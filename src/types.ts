
/**
 * 各ルートの Hono インスタンスで共有する型
 * Bindings には wrangler types で生成した Env を指定し、ハンドラー内で c.env から型付きでバインディングを参照できるようにする
 * いまの API はバインディングを使わないが、将来 KV などのバインディングを使う API を追加するときにそのまま使える
 */
export type AppEnv = {
    Bindings: Env;
};
