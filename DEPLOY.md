# GitHub Pages 移行手順

## 1. リポジトリ準備

このプロジェクトを GitHub の `used-car-app` リポジトリに push してください。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/s430g717-spec/used-car-app.git
git push -u origin main
```

## 2. GitHub Pages 有効化

1. GitHub リポジトリで **Settings** > **Pages** に移動
2. **Source** を **GitHub Actions** に変更
3. `.github/workflows/deploy.yml` が検出され、自動デプロイが開始されます

## 3. アクセス確認

デプロイ完了後、以下の URL でアクセスできます:

**https://s430g717-spec.github.io/used-car-app/**

## ビルド設定詳細

- `vite.config.ts`: `base: "/used-car-app/"` を設定済み
- `public/sw.js`: サブパス対応のため scope-relative に修正
- `public/404.html`: SPA fallback 用リダイレクト
- `.github/workflows/deploy.yml`: 自動ビルド・デプロイワークフロー

## ローカルでの確認

ビルド後、サブパス付きで動作確認:

```bash
npm run build
npx serve dist -s -p 8080 --rewrite /used-car-app/
```

http://localhost:8080/used-car-app/ でアクセス

## 注意事項

- サービスワーカーのキャッシュバージョンを v4 に更新済み
- 初回アクセス時はブラウザの Service Worker を一度クリアすることをおすすめします
- PWA インストールは HTTPS 環境でのみ動作します（GitHub Pages は対応済み）
