
import { Hono } from 'hono';

import type { AppEnv } from '../types';


// ニコニコ API 関連のルート
export const NiconicoRouter = new Hono<AppEnv>();


/**
 * ニコニコ API (OAuth 2.0) のコールバック URL の実装
 * クエリの "state" パラメーター内の JSON で指定された KonomiTV サーバーに、クエリごと 302 リダイレクトする API
 * KonomiTV サーバーの URL は環境によってまちまちでコールバック URL を一意に決められないため、一旦ここに集約した上でリダイレクトするようにした
 * KonomiTV サーバーは認証コードとユーザーの JWT アクセストークンさえ取れれば、OAuth 認証を続行できる
 */
NiconicoRouter.get('/redirect/niconico', (c) => {

    // クエリは、リダイレクト先に引き継ぐ際にも同じ解釈になるよう URLSearchParams で一度だけ解析する
    const search_params = new URL(c.req.url).searchParams;

    // "state" パラメーターが設定されていない
    const state_base64_values = search_params.getAll('state');
    if (state_base64_values.length === 0) {
        return c.json({'detail': 'URL query does not have "state" parameter'}, 400);
    }

    // "state" パラメーターをデコード
    // まず Base64 デコードし、さらに JSON デコードしてオブジェクトにする
    // KonomiTV サーバーは JSON を UTF-8 でエンコードしてから Base64 エンコードしているので、Base64 デコードしたバイト列を
    // TextDecoder で UTF-8 としてデコードする (UTF-8 として不正なバイト列は不正な値として扱う)
    // Uint8Array.fromBase64() は atob() と同じく、末尾の = が省かれた Base64 文字列もデコードできる
    let state: unknown = null;
    try {
        // "state" パラメーターが複数指定されている場合は、1つの Base64 文字列として解釈できないので不正な値として扱う
        if (state_base64_values.length === 1) {
            const state_bytes = Uint8Array.fromBase64(state_base64_values[0]);
            state = JSON.parse(new TextDecoder('utf-8', {fatal: true, ignoreBOM: false}).decode(state_bytes));
        }
    } catch {
        state = null;
    }

    // Base64・UTF-8・JSON として不正な値か、JSON としては正しくてもオブジェクトでなければ
    // "server" プロパティを取り出せないので不正な値として扱う
    if (typeof state !== 'object' || state === null || Array.isArray(state)) {
        return c.json({'detail': '"state" parameter is invalid'}, 400);
    }
    const state_object = state as Record<string, unknown>;

    // KonomiTV サーバーの URL
    // https://192-168-1-11.local.konomi.tv/ のようなフォーマット
    const server_url = state_object['server'];

    // "server" プロパティが URL ではない
    // ref: https://qiita.com/nagimaruxxx/items/c2f186a2df5e32233122
    if (typeof server_url !== 'string' || server_url.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g) === null) {
        return c.json({'detail': '"server" property is not URL'}, 400);
    }

    // "state" パラメーター以外のクエリを再構築
    // 同名のパラメーターが複数ある場合は、最初に現れた位置にカンマ区切りで連結した値を置く (以前の itty-router v3 と同じ挙動)
    const query_values = new Map<string, string[]>();
    for (const [param_key, param_value] of search_params) {

        // "state" パラメーターはもう不要なので追加しない
        if (param_key === 'state') continue;

        // 同名のパラメーターの値をまとめる
        const values = query_values.get(param_key) ?? [];
        values.push(param_value);
        query_values.set(param_key, values);
    }
    let redirect_url_query = '';
    for (const [param_key, param_values] of query_values) {

        // key=value の組を追加
        redirect_url_query += `${param_key}=${param_values.join(',')}&`;
    }

    // "state" パラメーター内の JSON の "server" プロパティ以外のプロパティをクエリに追加
    for (const [param_key, param_value] of Object.entries(state_object)) {

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
});
