# AGENTS.md — リポジトリ運用ガイドライン（セキュリティ対応版）

このリポジトリでは、Codex（LLM）による編集・実行を **安全第一** で運用します。  
以下は Codex / 開発者 / CI が共通で守るルールです。

---

## 0. プロジェクト概要・構成
- `src/`：React + TypeScript ソースコード（`App.tsx`、`main.tsx`、スタイル、アセット）
- `public/`：静的アセット（サイトルートで配信）
- `index.html`：SPAエントリーポイント（`#root` にマウント）
- `vite.config.ts`：Vite の開発・ビルド設定
- `eslint.config.js` / `tsconfig.*.json`：Lint / TypeScript 設定

---

## 1. 開発・ビルド・テストコマンド
- `npm install`：依存関係のインストール（推奨 Node.js 18+ / Vite 7）
- `npm run dev`：Vite 開発サーバー起動（HMR対応）
- `npm run build`：型チェック（`tsc -b`）＋ `dist/` へビルド
- `npm run preview`：本番ビルドのローカルサーブ
- `npm run lint`：ESLint 実行
- （テスト）Vitest + React Testing Library を推奨。`*.test.ts(x)` を対象コードと同階層に配置

---

## 2. コーディングスタイル
- **TypeScript**：`strict` モード、有効にする。未使用変数・引数は禁止
- インデント：2スペース、ESM インポートのみ使用、`any` は極力回避
- コンポーネント：PascalCase ファイル名（例：`UserCard.tsx`）
- ユーティリティ・Hooks：camelCase ファイル名（例：`formatDate.ts`）、Hooks は `use*` で開始
- アセット：kebab-case（例：`team-logo.svg`）、`src/assets/` または `public/` 配下

---

## 3. セキュリティポリシー
### 機密情報の保護
- 以下のファイル・パターンは**表示・出力・開封禁止**：
  - `.env*`, `.env.*`, `.envrc`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `secrets.*`, `*.kdbx`
  - `aws/credentials`, `gcloud/*.json`, `.npmrc` 内のトークン, `.dockerconfigjson`
- 環境変数のうち、`AWS_*`, `GOOGLE_*`, `OPENAI_API_KEY`, `GITHUB_TOKEN`, `SLACK_*` などは**ログ・PRに含めない**
- 秘密情報は `.env.local`（gitignore 済）に保存。Vite では `VITE_` プレフィックス付きのみクライアント公開可能

### ファイルアクセス
- **編集可**：`src/**`, `test/**`, `infrastructure/**`, `amplify/**`, `.github/workflows/**`
- **閲覧のみ**：`docs/**`, `scripts/**`
- **禁止**：プロジェクト外のパス（`/etc/*` など）、ホームディレクトリの秘密ファイル、Dockerソケット

---

## 4. コマンド実行ルール
- **禁止コマンド**：
  - 破壊的：`rm -rf /`, `chmod -R 777`, `docker system prune -a`（無確認）
  - 危険なネットワーク操作：不明サーバからの `curl|bash`, `wget|sh`
- **要承認**：`npm install`, `amplify push`, `aws *`, `docker *`, DBマイグレーション系
- 実行前に計画（目的、入出力、ロールバック方法）を提示

---

## 5. 依存関係管理
- 新規/更新時は：
  - `npm audit --audit-level=high` 実行（High/Critical で代替案提示）
  - 出所と最終更新日を確認、要約を提示
- 個人運営や信頼不明なレジストリは使用禁止
- lockfile（`package-lock.json` / `pnpm-lock.yaml`）は必ず更新し、PRに差分を含める

---

## 6. ネットワークアクセス
- デフォルトは**ネットワークOFF**。必要時は承認を得てホワイトリスト化：
  - 例：`registry.npmjs.org`, `api.github.com`, `amazonaws.com`（Amplify/Cognito/STSなど）
- 短縮URLや未知ドメインからのコード取得は禁止

---

## 7. コード品質・安全性チェック
- コード生成/変更後は：
  - `npm run lint && npm run build`  
  - 関連するテストの実行（Vitest推奨）
  - 必要に応じて `npm audit` / `snyk test`
- フロント：ユーザー入力は必ずバリデーション＆エスケープ（XSS対策）
- バックエンド：JWT検証（署名・aud/iss・exp必須）、秘密情報は環境変数＋Secrets Manager利用

---

## 8. インフラ（Amplify / AWS）
- `amplify push` はPR承認後に実施。dev環境での検証を必須化
- IAMは最小権限。ポリシー拡張提案時は差分レビュー＆ワイルドカード回避
- CloudWatch LogsにPIIや秘密を出力しない

---

## 9. コミット・PR運用
- コミットは Conventional Commits 準拠（例：`feat: 投票機能追加`, `fix: 空ルーム名対応`）
- PRには：
  - 目的と背景、影響範囲、スクショ（UI変更時）
  - 関連Issueリンク
  - 破壊的変更の有無
- `npm run lint` と `npm run build` が通っていることを確認

---

## 10. 事故対応
- 秘密情報流出時は即時キー無効化・再発行
- コミット除去（`revert` / `filter-branch` / `git push --force`）
- 影響調査と再発防止策を追記

---

## 11. コミュニケーション方針
- 既定言語は日本語。Issue / PR / レビュー / コメントは日本語で記載してください。
- コード（識別子・コメント）やファイル/フォルダ名は英語を使用して検索性を確保します。
- コミットメッセージは日本語または英語いずれも可（現状は日本語推奨）。Conventional Commits に準拠。
- 外部OSSや依存先への問い合わせは英語でも可。やり取りの要点は日本語で要約して残してください。

---

## Codex利用時の特記事項
- 承認必須モード（`suggest`）で運用
- 編集・コマンド実行前に必ず意図説明 → 承認 → 実行 → 差分要約 → リスク提示
- 破壊的変更・危険コマンドは提案禁止、必ず安全な代替案を提示
