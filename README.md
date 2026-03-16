# gungi-action

フェーズチェーンを実行する GitHub Actions の Composite Action。

## Usage

```yaml
steps:
  - name: Run Gungi AI Development
    uses: symon-brain/gungi-action@main
    with:
      auth-token: ${{ inputs.auth_token }}
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Name | Required | Description |
|------|----------|-------------|
| `auth-token` | Yes | One-time authentication token (Gungi API が webhook 受信時に生成) |
| `github-token` | Yes | GitHub token for repository operations |

## Security Architecture

### API URL のハードコード（意図的な設計決定）

`GUNGI_API_URL`（`https://api.gungi-ai.com`）は action.yml 内に**ハードコード**されている。
これは意図的なセキュリティ設計であり、以下の理由による。

#### なぜ input で受け取らないのか

このリポジトリは **public** である。
もし `gungi-api-url` を input として受け取ると、以下の攻撃が可能になる：

1. **認証トークンの窃取**: ユーザーが自身のリポジトリの `gungi.yml` で悪意あるURLを指定すると、Gungi API が発行した `auth_token` が攻撃者のサーバーに送信される
2. **GitHub Token の悪用**: Docker Runner が攻撃者の API から悪意ある指示を受け取り、`GITHUB_TOKEN` の権限（コード変更、PR作成、Issue操作）を悪用される
3. **コード・データの流出**: リポジトリのソースコードや実行結果が攻撃者のサーバーに送信される

#### Docker イメージ側の多層防御

Docker Runner イメージ（`gungi-runner`）にも同様の保護がある：

- **本番イメージ** (`gungi-runner:latest`): `GUNGI_ENV_MODE=production` がビルド時に `/etc/gungi-env-mode` に焼き込まれ、許可されたホスト（`api.gungi-ai.com`, `api.staging.gungi-ai.com`）以外の API URL を拒否する。実行時の環境変数では上書きできない
- **開発イメージ** (`gungi-runner:dev`): `GUNGI_ENV_MODE=development` で、任意の API URL を許可する。開発チーム専用

### 本番と開発の分離

| | 本番 | 開発 |
|---|---|---|
| **Action** | `symon-brain/gungi-action@main`（本リポ） | 使用しない（ワークフロー内に直接記述） |
| **Docker イメージ** | `gungi-runner:latest` | `gungi-runner:dev` |
| **API URL** | ハードコード（`api.gungi-ai.com`） | ワークフロー内の環境変数で指定 |
| **リポジトリ** | public（ユーザーが参照） | private（symon-brain/symon 内） |

開発時はカスタム API URL（ngrok 等）が必要なため、**プライベートリポ（symon-brain/symon）内のワークフローに直接ステップを記述する**。
public リポである gungi-action には開発用コードを一切置かない。

### 変更時の注意事項

- **絶対に外部入力で API URL を受け取る機能を追加しないこと**
- API URL を変更する場合は action.yml 内のハードコード値を直接変更する
- 新しいホストを許可する場合は `src/docker/runner.ts` の `ALLOWED_API_HOSTS` にも追加する
