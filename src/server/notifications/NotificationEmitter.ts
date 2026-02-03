import { EventEmitter } from 'events';
import { NotificationEvent } from '@/shared/types/notification';

const EVENT_NAME = 'notification';

declare const globalThis: {
    notificationEmitterGlobal: EventEmitter;
} & typeof global;

let _emitter: EventEmitter | null = globalThis.notificationEmitterGlobal ?? null;

function getEmitter(): EventEmitter {
    if (!_emitter) {
        _emitter = new EventEmitter();
        _emitter.setMaxListeners(0);

        if (process.env.NODE_ENV !== 'production') {
            globalThis.notificationEmitterGlobal = _emitter;
        }
    }
    return _emitter;
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
