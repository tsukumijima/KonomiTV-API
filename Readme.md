
# KonomiTV-API

[KonomiTV](https://github.com/tsukumijima/KonomiTV) に関連する小さな API です。

この API は [Cloudflare Workers](https://workers.cloudflare.com/) 向けに書かれています。https://app.konomi.tv/api/ 以下で稼働中です。

## 概要

[https://github.com/gmencz/cloudflare-workers-typescript-esbuild-esm](gmencz/cloudflare-workers-typescript-esbuild-esm) を参考にして開発しました。

今のところ、Twitter API のコールバック URL をクエリの "server" パラメーターに設定された KonomiTV サーバーにクエリごと 302 リダイレクトする API のみ実装しています。  
ちょっと URL を修正してリダイレクトするだけの API のためだけにサーバーを立てたくなかったので、無料枠の大きい Cloudflare Workers を利用しました。

Twitter との OAuth 認証では、事前にコールバックする URL (Callback URLs) を開発者ダッシュボードから設定しておく必要があります。一方、KonomiTV サーバーの URL は環境によってまちまちで、コールバックする URL を一意に決められません。

> コールバック URL は複数設定できるものの、すべて指定するのは現実的ではない…。

そこで、一旦上記の API にコールバック URL を集約し、その API でクエリの "server" パラメーターに指定された KonomiTV サーバーの URL (ex: https://192-168-1-11.local.konomi.tv/) へ適宜振り分けるようにしました。  
こうすることで、コールバック URL が1つに定まらなくても、コールバック結果を KonomiTV サーバーに返せるようになります。

## 開発

### 環境構築

```bash
$ npm install -g @cloudflare/wrangler
```

事前に [wrangler](https://github.com/cloudflare/wrangler) をインストールしてください。当然 Cloudflare アカウントも必要です。

```bash
$ yarn install
```

依存パッケージをインストールします。

そのあと、wrangler.toml を編集します。 
もし自分のドメインで動かしたい場合は、少なくとも route, account_id, zone_id の変更が必要です。

### ビルド

```bash
$ yarn build
```

dist/worker.mjs にビルド済みの JS ファイルが出力されます。  
このファイルが Cloudflare Workers にデプロイされます。

### 開発サーバーの起動

```bash
$ yarn dev
```

Miniflare を使い、ローカル内だけで開発できるようにしました。  
開発サーバーは http://localhost:8787/api/* でリッスンされます。

### デプロイ

```bash
$ yarn publish-worker
```

デプロイした成果物は 10 秒ほどで Cloudflare Workers に反映されます。

> yarn だと publish が内蔵コマンドと被ってしまう…

## License

[MIT License](License.txt)

