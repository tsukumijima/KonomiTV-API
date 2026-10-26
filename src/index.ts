
import { Hono } from 'hono';

import { NiconicoRouter } from './routes/niconico';
import type { AppEnv } from './types';


// API のベースを指定してアプリケーションを初期化
// 実際にどのサブディレクトリにデプロイされるかは関係なく、URL 上のルート (example.com/) から解析される
// strict: false で、末尾にスラッシュが付いた URL (/api/redirect/niconico/ など) も同じルートとして扱う
// ref: https://hono.dev/docs/api/hono
const app = new Hono<AppEnv>({strict: false}).basePath('/api');

// API を追加するときは、src/routes/ 以下に Hono インスタンスとしてルートを実装し、ここに追加する
app.route('/', NiconicoRouter);

// どのルートにも当てはまらなかったときのルート
// GET の場合は 404 Not Found を、GET 以外のメソッドでリクエストされた場合は 422 Unprocessable Entity を返す
app.notFound((c) => {
    if (c.req.method === 'GET') {
        return c.json({'detail': 'Not Found'}, 404);
    }
    return c.json({'detail': 'Unprocessable Entity'}, 422);
});


// ES Modules 構文の Worker として Hono のアプリケーションをそのまま公開する
// ref: https://hono.dev/docs/getting-started/cloudflare-workers
export default app;
