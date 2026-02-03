import { getSessionUserId } from '@/server/auth/auth';
import { NotificationEmitter } from '@/server/notifications/NotificationEmitter';

const HEARTBEAT_INTERVAL_MS = 30_000;

export async function GET(): Promise<Response> {
    const userId = await getSessionUserId();
    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const write = (text: string) => {
                try {
                    controller.enqueue(encoder.encode(text));
                } catch {
                    // Stream already closed
                }
            };

            const cleanup = NotificationEmitter.on((event) => {
                if (event.recipientUserId !== userId) return;
                write(`data: ${JSON.stringify(event)}\n\n`);
            });

            const heartbeat = setInterval(() => {
                write(': heartbeat\n\n');
            }, HEARTBEAT_INTERVAL_MS);

            // Send initial heartbeat so the client knows the connection is alive
            write(': connected\n\n');

            // Cleanup when the client disconnects
            const abortHandler = () => {
                cleanup();
                clearInterval(heartbeat);
            };

            // Store cleanup for the cancel callback
            (controller as any)._notifCleanup = abortHandler;
        },
        cancel(controller: any) {
            controller._notifCleanup?.();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
