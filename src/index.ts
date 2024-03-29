
import { Router } from 'itty-router';


// API のベースを指定してルーターを初期化
// 実際にどのサブディレクトリにデプロイされるかは関係なく、URL 上のルート (example.com/) から解析されるらしい
// ref: https://github.com/kwhitley/itty-router
const router = Router({base: '/api'});


/**
 * Twitter API (OAuth 1.0a) のコールバック URL の実装
 * クエリの "server" パラメーターで指定された KonomiTV サーバーに、クエリごと 302 リダイレクトする API
 * KonomiTV サーバーの URL は環境によってまちまちでコールバック URL を一意に決められないため、一旦ここに集約した上でリダイレクトするようにした
 * KonomiTV サーバーは oauth_verifier さえ取れれば、OAuth 認証を続行できる
 */
router.get('/redirect/twitter', (request) => {

    // リクエストされる URL の例
    // https://app.konomi.tv/api/redirect/twitter?server=https://192-168-1-11.local.konomi.tv/&oauth_verifier=YOUR_OAUTH_VERIFIER
    // http://localhost:8787/api/redirect/twitter?server=https://192-168-1-11.local.konomi.tv/&oauth_verifier=YOUR_OAUTH_VERIFIER (開発環境)

    // KonomiTV サーバーの URL
    // https://192-168-1-11.local.konomi.tv/ のようなフォーマット
    const server_url = request.query?.server as string | undefined;

    // "server" パラメーターが設定されていない
    if (server_url === undefined) {
        return new Response(JSON.stringify({'detail': 'URL query does not have "server" parameter'}), {
            headers: {'content-type': 'application/json'},
            status: 400,
        });
    }

    // "server" パラメーターが URL ではない
    // ref: https://qiita.com/nagimaruxxx/items/c2f186a2df5e32233122
    if (server_url.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g) === null) {
        return new Response(JSON.stringify({'detail': '"server" parameter is not URL'}), {
            headers: {'content-type': 'application/json'},
            status: 400,
        });
    }

    // "server" パラメーター以外のクエリを再構築
    let redirect_url_query = '';
    for (const [param_key, param_value] of Object.entries(request.query as {[key: string]: string})) {

        // "server" パラメーターはもう不要なので追加しない
        if (param_key === 'server') continue;

        // key=value の組を追加
        redirect_url_query += `${param_key}=${param_value}&`;
    }

    // リダイレクト先の URL を組み立てる
    // それぞれ末尾の / (URL) と & (クエリ) を除去
    const redirect_url = `${server_url.replace(/\/$/, '')}/api/twitter/callback?${redirect_url_query.replace(/\&$/, '')}`;
    console.log(`Redirect to: ${redirect_url}`);

    // 302 リダイレクトを行う
    return Response.redirect(redirect_url, 302);
});


/**
 * ニコニコ API (OAuth 2.0) のコールバック URL の実装
 * クエリの "state" パラメーター内の JSON で指定された KonomiTV サーバーに、クエリごと 302 リダイレクトする API
 * KonomiTV サーバーの URL は環境によってまちまちでコールバック URL を一意に決められないため、一旦ここに集約した上でリダイレクトするようにした
 * KonomiTV サーバーは認証コードとユーザーの JWT アクセストークンさえ取れれば、OAuth 認証を続行できる
 */
router.get('/redirect/niconico', (request) => {

    // "state" パラメーターが設定されていない
    if (request.query?.state === undefined) {
        return new Response(JSON.stringify({'detail': 'URL query does not have "state" parameter'}), {
            headers: {'content-type': 'application/json'},
            status: 400,
        });
    }

    // "state" パラメーターをデコード
    // まず Base64 デコードし、さらに JSON デコードしてオブジェクトにする
    let state: {[key: string]: string};
    try {
        state = JSON.parse(atob(request.query?.state as string));
    } catch (error) {
        return new Response(JSON.stringify({'detail': '"state" parameter is invalid'}), {
            headers: {'content-type': 'application/json'},
            status: 400,
        });
    }

    // KonomiTV サーバーの URL
    // https://192-168-1-11.local.konomi.tv/ のようなフォーマット
    const server_url = state['server']

    // "server" プロパティが URL ではない
    // ref: https://qiita.com/nagimaruxxx/items/c2f186a2df5e32233122
    if (server_url.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g) === null) {
        return new Response(JSON.stringify({'detail': '"server" property is not URL'}), {
            headers: {'content-type': 'application/json'},
            status: 400,
        });
    }

    // "state" パラメーター以外のクエリを再構築
    let redirect_url_query = '';
    for (const [param_key, param_value] of Object.entries(request.query as {[key: string]: string})) {

        // "state" パラメーターはもう不要なので追加しない
        if (param_key === 'state') continue;

        // key=value の組を追加
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
});


/**
 * どのルートにも当てはまらなかったときのルート
 * 404 Not Found を返す
 */
router.get('/*', () => {
    return new Response(JSON.stringify({'detail': 'Not Found'}), {
        headers: {'content-type': 'application/json'},
        status: 404,
    });
});


// ES Modules 構文の Worker を定義
// まだ普及していないけど、とりあえず動くのでヨシ！（このあたりで散々試行錯誤した）
// ref: https://developers.cloudflare.com/workers/cli-wrangler/configuration/#modules
// ref: https://github.com/gmencz/cloudflare-workers-typescript-esbuild-esm
export default {
    async fetch(request: Request, env: {[key: string]: any}, context: ExecutionContext) {

        // ルーターに Request を投げ、Response (あるいは undefined) を受け取る
        // ref: https://github.com/kwhitley/itty-router
        const response = await router.handle(request);

        // Response が返ってこなかった場合（基本的にはないが、念のため）
        // 422 Unprocessable Entity を返す
        if (response === undefined) {
            return new Response(JSON.stringify({'detail': 'Unprocessable Entity'}), {
                headers: {'content-type': 'application/json'},
                status: 422,
            });
        }

        // 取得した Response を返す
        return response;
    }
};
