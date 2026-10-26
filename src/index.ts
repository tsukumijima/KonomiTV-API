
import { type IRequest, IttyRouter } from 'itty-router';

import { NiconicoRedirectAPI } from './routes/niconico';
import { createErrorResponse } from './utils';


// API のベースを指定してルーターを初期化
// 実際にどのサブディレクトリにデプロイされるかは関係なく、URL 上のルート (example.com/) から解析されるらしい
// ルーターの fetch() に渡した env・ctx は、各ルートのハンドラーに第2・第3引数としてそのまま渡される
// ref: https://github.com/kwhitley/itty-router
const router = IttyRouter<IRequest, [Env, ExecutionContext]>({base: '/api'});

// API を追加するときは、src/routes/ 以下にハンドラーを実装し、ここにルートを追加する
router.get('/redirect/niconico', NiconicoRedirectAPI);

// どのルートにも当てはまらなかったときのルート
// 404 Not Found を返す
router.get('/*', () => createErrorResponse(404, 'Not Found'));


// ES Modules 構文の Worker を定義
// ref: https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/
export default {
    async fetch(request, env, ctx) {

        // ルーターに Request を投げ、Response (あるいは undefined) を受け取る
        // ref: https://github.com/kwhitley/itty-router
        const response: Response | undefined = await router.fetch(request, env, ctx);

        // Response が返ってこなかった場合（GET 以外のメソッドでリクエストされたときなど）
        // 422 Unprocessable Entity を返す
        if (response === undefined) {
            return createErrorResponse(422, 'Unprocessable Entity');
        }

        // 取得した Response を返す
        return response;
    },
} satisfies ExportedHandler<Env>;
