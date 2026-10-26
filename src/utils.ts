
import type { IRequest, RequestHandler } from 'itty-router';


/**
 * 各 API のハンドラーの型
 * ルーターから IRequest と、Worker の fetch() に渡された env・ctx をそのまま受け取る
 * いまの API は env・ctx を使わないが、将来 KV などのバインディングを使う API を追加するときに引数を変えずに済むよう揃えている
 */
export type APIHandler = RequestHandler<IRequest, [Env, ExecutionContext]>;


/**
 * KonomiTV サーバー (FastAPI) のエラーレスポンスと同じ {"detail": "..."} 形式の JSON レスポンスを作る
 * @param status HTTP ステータスコード
 * @param detail エラーの内容を表すメッセージ
 * @returns JSON レスポンス
 */
export function createErrorResponse(status: number, detail: string): Response {
    return new Response(JSON.stringify({'detail': detail}), {
        headers: {'content-type': 'application/json'},
        status: status,
    });
}
