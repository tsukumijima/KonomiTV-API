
import { type APIHandler, createErrorResponse } from '../utils';


/**
 * ニコニコ API (OAuth 2.0) のコールバック URL の実装
 * クエリの "state" パラメーター内の JSON で指定された KonomiTV サーバーに、クエリごと 302 リダイレクトする API
 * KonomiTV サーバーの URL は環境によってまちまちでコールバック URL を一意に決められないため、一旦ここに集約した上でリダイレクトするようにした
 * KonomiTV サーバーは認証コードとユーザーの JWT アクセストークンさえ取れれば、OAuth 認証を続行できる
 */
export const NiconicoRedirectAPI: APIHandler = (request) => {

    // "state" パラメーターが設定されていない
    const state_base64 = request.query.state;
    if (state_base64 === undefined) {
        return createErrorResponse(400, 'URL query does not have "state" parameter');
    }

    // "state" パラメーターをデコード
    // "state" パラメーターが複数指定されている場合は配列になるが、1つの Base64 文字列として解釈できないので不正な値として扱う
    const state = typeof state_base64 === 'string' ? decodeState(state_base64) : null;
    if (state === null) {
        return createErrorResponse(400, '"state" parameter is invalid');
    }

    // KonomiTV サーバーの URL
    // https://192-168-1-11.local.konomi.tv/ のようなフォーマット
    const server_url = state['server'];

    // "server" プロパティが URL ではない
    // ref: https://qiita.com/nagimaruxxx/items/c2f186a2df5e32233122
    if (typeof server_url !== 'string' || server_url.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g) === null) {
        return createErrorResponse(400, '"server" property is not URL');
    }

    // "state" パラメーター以外のクエリを再構築
    let redirect_url_query = '';
    for (const [param_key, param_value] of Object.entries(request.query)) {

        // "state" パラメーターはもう不要なので追加しない
        if (param_key === 'state') continue;

        // key=value の組を追加
        // 同名のパラメーターが複数ある場合は配列になり、カンマ区切りで連結される
        redirect_url_query += `${param_key}=${param_value}&`;
    }

    // "state" パラメーター内の JSON の "server" プロパティ以外のプロパティをクエリに追加
    for (const [param_key, param_value] of Object.entries(state)) {

        // "server" プロパティはもう不要なので追加しない
        if (param_key === 'server') continue;

        // key=value の組を追加
        redirect_url_query += `${param_key}=${param_value}&`;
    }

    // リダイレクト先の URL を組み立てる
    const redirect_url = `${server_url.replace(/\/$/, '')}/api/niconico/callback?${redirect_url_query}`;
    console.log(`Redirect to: ${redirect_url}`);

    // 302 リダイレクトを行う
    return Response.redirect(redirect_url, 302);
};


/**
 * "state" パラメーターを Base64 デコードし、さらに JSON デコードしてオブジェクトにする
 * @param state_base64 KonomiTV サーバーが JSON を Base64 エンコードした "state" パラメーターの値
 * @returns デコードしたオブジェクト (Base64 や JSON として不正な値か、JSON がオブジェクトでない場合は null)
 */
function decodeState(state_base64: string): Record<string, unknown> | null {
    let state: unknown;
    try {
        state = JSON.parse(atob(state_base64));
    } catch {
        return null;
    }

    // JSON としては正しくても、オブジェクトでなければ "server" プロパティを取り出せないので不正な値として扱う
    if (typeof state !== 'object' || state === null || Array.isArray(state)) {
        return null;
    }
    return state as Record<string, unknown>;
}
