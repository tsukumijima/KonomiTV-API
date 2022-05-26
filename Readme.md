
# KonomiTV-API

[KonomiTV](https://github.com/tsukumijima/KonomiTV) に関連する小さな API です。

この API は [Cloudflare Workers](https://workers.cloudflare.com/) 向けに書かれています。https://app.konomi.tv/api/ で稼働中です。

## 概要

[gmencz/cloudflare-workers-typescript-esbuild-esm](https://github.com/gmencz/cloudflare-workers-typescript-esbuild-esm) を参考にして開発しました。

現時点では、Twitter API / ニコニコ API のコールバック URL を、KonomiTV サーバーにクエリごと 302 リダイレクトする API を実装しています。  
ちょっと URL を修正してリダイレクトするだけの API のためだけにサーバーを立てたくなかったので、無料枠の大きい Cloudflare Workers を採用しました。

OAuth 認証では、事前にコールバック先の URL (Callback URLs) をサービスのデベロッパーダッシュボードなどで設定しておく必要があります。  
一方、KonomiTV サーバーの URL (プライベート IP アドレス) は環境によってまちまちで、コールバックする URL を一意に決められません。

> コールバック URL は複数設定できるものの、考えられるすべての URL を指定するのは非現実的…。

そこで、一旦この API にコールバック URL を集約しました。  
Twitter API では、リクエストをクエリの "server" パラメーターで指定された KonomiTV サーバーの URL へ振り分けます。
それ以外の API では、リクエストをクエリの "state" パラメーター内の JSON で指定された KonomiTV サーバーの URL へ振り分けます。

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
自分のアカウントやドメインで動かしたい場合は、少なくとも route, account_id, zone_id を変更する必要があります。

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

[Miniflare](https://github.com/cloudflare/miniflare) を使い、ローカル内だけで開発できるように設定しています。  
開発サーバーは http://localhost:8787/api/ でリッスンされます。

### デプロイ

```bash
$ yarn publish-worker
```

ビルドとデプロイが同時に行われます。  
デプロイした worker.mjs は、10 秒ほどで Cloudflare Workers に反映されます。

> yarn だと publish が内蔵のコマンドと被ってしまうため、`-worker` の Suffix を付けざるを得ない…

## License

[MIT License](License.txt)
