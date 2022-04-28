export {};

declare global {

    interface WorkerContext {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException: () => void;
    }

    interface WebSocket {
        accept(): void;
    }

    class WebSocketPair {
        0: WebSocket;
        1: WebSocket;
    }

    interface ResponseInit {
        webSocket?: WebSocket;
    }
}
