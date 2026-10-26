
import { html } from 'hono/html';

import { KonomiTVLogoDataURL } from './logo';


/**
 * 確認画面のレスポンスに付けるヘッダー
 * - Content-Security-Policy: スクリプトを一切読み込ませず、ほかのサイトの iframe に埋め込ませない
 *   (罠のページが確認画面を透明な iframe で重ね、ボタンを押させる攻撃 (クリックジャッキング) を防ぐ)
 *   フォントは KonomiTV と同じ Open Sans と Noto Sans JP を Google Fonts から読み込む
 * - X-Frame-Options: frame-ancestors に対応していない古いブラウザでも iframe への埋め込みを防ぐ
 * - Cache-Control: 認可コードを含むページなので、ブラウザや中間のキャッシュに残さない
 * - Referrer-Policy: 遷移先に、認可コードを含むこのページの URL を Referer として送らない
 * なお Cross-Origin-Opener-Policy は付けない (付けると PC のポップアップで window.opener が切れ、
 * KonomiTV サーバーの結果ページから元の画面に連携結果を postMessage で伝えられなくなる)
 */
export const RedirectConfirmPageHeaders = {
    'Content-Security-Policy': [
        "default-src 'none'",
        "style-src 'unsafe-inline' https://fonts.googleapis.com",
        'font-src https://fonts.gstatic.com',
        'img-src data:',
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'none'",
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
};


/**
 * OAuth のコールバックを KonomiTV サーバーに転送する前に、転送先のサーバーを利用者に確認してもらう画面
 * 罠のリンクで "state" の転送先を書き換えられても、利用者が見覚えのないサーバーに気づいて連携を止められるようにする
 * ボタンはリダイレクト先の URL へのリンクで、押すと 302 リダイレクトと同じ URL にブラウザが遷移する
 * 見た目は KonomiTV のログイン画面 (client/src/views/Login.vue) に合わせている
 * @param redirect_url 連携を続けたときに遷移する、KonomiTV サーバーのコールバック URL
 * @param server_host 利用者に確認してもらう、転送先のサーバーのホスト名 (ポート番号を含む)
 * @returns 確認画面の HTML (埋め込む値は Hono の html ヘルパーでエスケープされる)
 */
export function RedirectConfirmPage(redirect_url: string, server_host: string) {

    // ホスト名が1行に収まらないときは、語の途中ではなくドメインの区切り (. の後ろ) で折り返すよう <wbr> を挟む
    // ただし最後の2つのラベル (example.com など) とポート番号は1つのまとまりとして読めるよう、その間では折り返さない
    // 各部分は Hono の html ヘルパーでエスケープされる
    const labels = server_host.split(/(?<=\.)/);
    const breakable_parts = labels.length > 2 ? [...labels.slice(0, -2), labels.slice(-2).join('')] : [server_host];
    const server_host_html = breakable_parts.map((part) => html`${part}<wbr>`);

    return html`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="#1E1310">
    <title>ニコニコアカウントと連携 - KonomiTV</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700&family=Open+Sans:wght@500;700&display=swap">
    <style>
        /* 色は KonomiTV のテーマ (client/src/plugins/vuetify.ts) から取っている */
        :root {
            --background: #1E1310;
            --background-lighten-1: #2F221F;
            --secondary: #E33157;
            --text: #FFEAEA;
            --text-darken-1: #D9C7C7;
            --text-darken-2: #8E7F7E;
        }
        *, *::before, *::after {
            box-sizing: border-box;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            margin: 0;
            padding: 20px;
            background: var(--background);
            color: var(--text);
            font-family: 'Open Sans', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
            font-weight: 500;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-text-size-adjust: 100%;
        }

        /* ログイン画面の v-card (elevation="10") と同じカード */
        .confirm {
            width: 100%;
            max-width: 450px;
            padding: 32px 40px 44px;
            border-radius: 11px;
            background: var(--background-lighten-1);
            box-shadow: 0px 6px 6px -3px rgba(0, 0, 0, 0.2), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12);
        }
        .confirm__header {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px 0;
        }
        .confirm__logo {
            display: block;
            width: 100%;
            max-width: 250px;
        }
        .confirm__title {
            margin: 40px 0 0;
            font-size: 20px;
            font-weight: 700;
            line-height: 32px;
            letter-spacing: 0.25px;
        }
        .confirm__divider {
            margin: 0;
            border: none;
            border-top: 1px solid rgba(128, 128, 128, 0.12);
        }

        /* 説明文は KonomiTV のダイアログ本文 (.v-card-text) と同じ文字の大きさと色にする */
        .confirm__description {
            margin: 24px 0 0;
            color: var(--text-darken-1);
            font-size: 14px;
            line-height: 22px;
            letter-spacing: 0.1px;
        }

        /* 最初の説明文は、見出しの直下で軸が合うよう中央揃えにする */
        /* 日本語は語の途中で折り返さず、文節の区切りに置いた <wbr> でだけ折り返す (文節より狭い画面では語の途中でも折り返す) */
        .confirm__description--lead {
            text-align: center;
            word-break: keep-all;
            overflow-wrap: anywhere;
        }
        /* 連携先のサーバーの枠の下の説明文は、背景のある枠の端と文字の端がそろうと本文のほうが広く見えるので、左右を少し内側に寄せる */
        .confirm__server + .confirm__description {
            margin-top: 20px;
            padding: 0 8px;
        }

        /* 連携先のサーバーは、見落とされないよう本文より大きく表示する */
        .confirm__server {
            margin-top: 20px;
            padding: 14px 20px 16px;
            border-radius: 7px;
            background: var(--background);
        }
        .confirm__server-label {
            color: var(--text-darken-2);
            font-size: 13px;
            line-height: 20px;
        }
        .confirm__server-host {
            margin-top: 4px;
            font-size: 18px;
            font-weight: 700;
            line-height: 26px;
            overflow-wrap: anywhere;
        }

        /* ログイン画面のログインボタン (color="secondary" variant="flat") と同じボタン */
        .confirm__button {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 56px;
            margin-top: 24px;
            padding: 0 16px;
            border-radius: 7px;
            background: var(--secondary);
            color: var(--text);
            font-size: 18px;
            font-weight: 500;
            letter-spacing: 0px;
            text-decoration: none;
            overflow: hidden;
        }
        /* Vuetify のボタンと同じく、ホバーとフォーカスで文字色の薄い膜を重ねる */
        .confirm__button::after {
            content: '';
            position: absolute;
            inset: 0;
            background: currentColor;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        .confirm__button:hover::after {
            opacity: 0.08;
        }
        .confirm__button:focus-visible {
            outline: none;
        }
        .confirm__button:focus-visible::after {
            opacity: 0.24;
        }
        .confirm__button-icon {
            flex-shrink: 0;
            width: 26px;
            height: 26px;
            margin-right: 8px;
        }

        /* スマートフォン (縦) では、ログイン画面と同じく余白と文字を詰める */
        @media (max-width: 600px) and (orientation: portrait) {
            body {
                padding: 20px 12px;
            }
            .confirm {
                padding: 32px 20px;
            }
            .confirm__header {
                padding: 4px 0 12px;
            }
            .confirm__logo {
                max-width: 200px;
            }
            .confirm__title {
                margin-top: 24px;
                font-size: 19px;
            }
            .confirm__description {
                margin-top: 20px;
            }
            .confirm__server {
                padding: 12px 16px 14px;
            }
            .confirm__server-host {
                font-size: 16px;
                line-height: 24px;
            }
            .confirm__button {
                height: 50px;
                font-size: 15.5px;
            }
            .confirm__button-icon {
                width: 23px;
                height: 23px;
            }
        }

        /* 幅 375px 未満のスマートフォンでは、最初の説明文が文節の区切りで2行に、通常のホスト名が1行に収まるよう文字を少し小さくする */
        @media (max-width: 374px) and (orientation: portrait) {
            .confirm__description {
                font-size: 13px;
                line-height: 21px;
            }
            .confirm__server-host {
                font-size: 15px;
                line-height: 22px;
            }
        }

        /* 幅 360px 未満のスマートフォンでは、さらに余白と文字を詰めて、最初の説明文の改行位置を変えないようにする */
        @media (max-width: 359px) and (orientation: portrait) {
            body {
                padding: 20px 8px;
            }
            .confirm {
                padding: 32px 16px;
            }
            .confirm__description {
                font-size: 12px;
                line-height: 20px;
            }
            .confirm__server-host {
                font-size: 14px;
                line-height: 21px;
            }
        }

        /* スマートフォン (横) でも、ログイン画面と同じく余白と文字を詰める */
        @media (max-width: 960px) and (orientation: landscape) {
            .confirm {
                padding: 24px;
            }
            .confirm__header {
                padding: 4px 0 8px;
            }
            .confirm__logo {
                max-width: 200px;
            }
            .confirm__title {
                margin-top: 16px;
                font-size: 19px;
            }
            .confirm__description {
                margin-top: 16px;
            }
            .confirm__button {
                height: 44px;
                margin-top: 20px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <main class="confirm">
        <div class="confirm__header">
            <img class="confirm__logo" src="${KonomiTVLogoDataURL}" alt="KonomiTV">
            <h1 class="confirm__title">ニコニコアカウントと連携</h1>
        </div>
        <hr class="confirm__divider">
        <p class="confirm__description confirm__description--lead">
            次のサーバーが、<wbr>あなたの<wbr>ニコニコアカウントで<wbr>ニコニコ実況に<wbr>コメントできるように<wbr>なります。
        </p>
        <div class="confirm__server">
            <div class="confirm__server-label">連携先のサーバー</div>
            <div class="confirm__server-host">${server_host_html}</div>
        </div>
        <p class="confirm__description">
            普段 KonomiTV を開いているアドレスと同じか確認してください。<br>
            見覚えのないアドレスなら、連携せずにこのページを閉じてください。
        </p>
        <a class="confirm__button" href="${redirect_url}">
            <svg class="confirm__button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                <path fill="currentColor" d="M17.78 3.28a.75.75 0 0 0-1.06-1.06l-2.446 2.445a4.04 4.04 0 0 0-5.128.481l-.3.3a1.49 1.49 0 0 0 0 2.108l3.6 3.6a1.49 1.49 0 0 0 2.107 0l.3-.3a4.04 4.04 0 0 0 .482-5.128zM7.554 8.846a1.49 1.49 0 0 0-2.107 0l-.3.3a4.04 4.04 0 0 0-.481 5.128L2.22 16.72a.75.75 0 1 0 1.06 1.06l2.446-2.446a4.04 4.04 0 0 0 5.128-.48l.3-.3a1.49 1.49 0 0 0 0-2.108z"/>
            </svg>
            連携を続ける
        </a>
    </main>
</body>
</html>`;
}
