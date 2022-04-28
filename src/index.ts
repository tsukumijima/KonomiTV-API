
import { Router } from 'itty-router';

// ルーターを初期化
const router = Router();

router.get('/', (request) => {
    return new Response('Hello World!!');
});

// ES Modules 構文の Worker を定義
// まだ普及していないけど、とりあえず動くのでヨシ！（このあたりで散々試行錯誤した）
// ref: https://developers.cloudflare.com/workers/cli-wrangler/configuration/#modules
// ref: https://github.com/gmencz/cloudflare-workers-typescript-esbuild-esm
export default {
    async fetch(request: Request, env: Env, context: Context) {
        return router.handle(request);
    }
};
