export {};

declare global {
    interface Env {}
    interface Context {
        waitUntil(promise: Promise<any>): void;
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
