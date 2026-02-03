import { EventEmitter } from 'events';
import { NotificationEvent } from '@/shared/types/notification';

const EVENT_NAME = 'notification';

declare const globalThis: {
    notificationEmitterGlobal: EventEmitter;
} & typeof global;

function getEmitter(): EventEmitter {
    if (!globalThis.notificationEmitterGlobal) {
        globalThis.notificationEmitterGlobal = new EventEmitter();
        globalThis.notificationEmitterGlobal.setMaxListeners(0);
    }
    return globalThis.notificationEmitterGlobal;
}

export namespace NotificationEmitter {
    export function emit(event: NotificationEvent): void {
        getEmitter().emit(EVENT_NAME, event);
    }

    export function on(handler: (event: NotificationEvent) => void): () => void {
        getEmitter().on(EVENT_NAME, handler);
        return () => {
            getEmitter().off(EVENT_NAME, handler);
        };
    }
}
