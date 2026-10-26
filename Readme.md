
# KonomiTV-API

[KonomiTV](https://github.com/tsukumijima/KonomiTV) に関連する小さな API です。

この API は [Cloudflare Workers](https://workers.cloudflare.com/) 向けに書かれています。https://app.konomi.tv/api/ で稼働中です。

## 概要

[gmencz/cloudflare-workers-typescript-esbuild-esm](https://github.com/gmencz/cloudflare-workers-typescript-esbuild-esm) を参考にして開発しました。

現時点では、ニコニコ API のコールバック URL を、KonomiTV サーバーにクエリごと 302 リダイレクトする API を実装しています。  
ちょっと URL を修正してリダイレクトするだけの API のためだけにサーバーを立てたくなかったので、無料枠の大きい Cloudflare Workers を採用しました。

OAuth の認証では、コールバック先の URL を、事前にサービスのデベロッパーダッシュボードなどで設定しておく必要があります。  
一方、KonomiTV サーバーの URL (プライベート IP アドレス) は環境によってまちまちで、コールバックする URL を一意に決められません。

> コールバック URL はほとんどのサービスで複数設定できるものの、考えられるすべての URL を指定するのは非現実的…。

そこで、一旦この API にコールバック URL を集約してから、サービスからのリダイレクト結果をそれぞれの KonomiTV サーバーに振り分けることにしました。

クエリの "state" パラメーターの JSON (Base64 エンコードされている) 内の "server" プロパティで指定された、KonomiTV サーバーの URL へ振り分けます。

最後に KonomiTV サーバーがこの API からのリダイレクトを受け取ることで、コールバック対象の URL が定まらなくても、OAuth 連携ができるようになります。

## 開発

### 環境構築

```bash
$ yarn install
```

依存パッケージをインストールします。Node.js 22 以降が必要です。  
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) も開発用の依存パッケージとして一緒にインストールされるため、グローバルにインストールする必要はありません。当然 Cloudflare アカウントも必要です。

そのあと、wrangler.jsonc を編集します。  
自分のアカウントやドメインで動かしたい場合は、少なくとも route を変更する必要があります。

### 開発サーバーの起動

```bash
$ yarn dev
```

Wrangler を使い、Cloudflare Workers と同じランタイム (workerd) でローカル内だけで開発できるように設定しています。  
開発サーバーは http://localhost:8787/api/ でリッスンされます。

### 型チェック

```bash
$ yarn typecheck
```

Workers のランタイムの型定義は、wrangler.jsonc の互換性の日付に合わせて `wrangler types` で生成した worker-configuration.d.ts を使っています。  
wrangler.jsonc を変更したり Wrangler を更新したりしたときは、`yarn types` で worker-configuration.d.ts を生成し直してください。

### デプロイ

```bash
$ yarn deploy
```

Wrangler が src/index.ts をバンドルしてから、Cloudflare Workers にデプロイします。  
初回は `yarn wrangler login` で Cloudflare アカウントにログインしてください。

## License

[MIT License](License.txt)
