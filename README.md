# Stats Loop

統計学・計量経済学・機械学習を10問ずつ復習できるスマホ優先のクイズWebアプリです。

## ローカルで試す

```bash
pnpm install
pnpm dev
```

ブラウザで `http://127.0.0.1:5173/` を開きます。

## 本番用にビルド

```bash
pnpm build
```

ビルド結果は `dist/` に作られます。

## 公開方法

### おすすめ: Vercel

1. GitHubにこのフォルダのリポジトリを作成してアップロードします。
2. Vercelで `Add New Project` を選び、このリポジトリを選択します。
3. Framework Preset は `Vite` を選びます。
4. Build Command は `pnpm build`、Output Directory は `dist` にします。
5. Deploy を押すとURLが発行されます。

### 手軽に試す: Netlify Drop

1. `pnpm build` を実行します。
2. Netlify Drop に `dist/` フォルダをドラッグ&ドロップします。
3. 一時URLが発行されます。

### GitHub Pages

GitHub Pagesでも公開できますが、Viteの `base` 設定やActions設定が必要になることがあります。初回はVercelかNetlifyの方が簡単です。

## 公開後の注意

- 学習記録は各ユーザーのブラウザ内に保存されます。
- ログインやサーバー保存はまだありません。
- 問題を追加したら、再ビルド・再デプロイすれば公開版にも反映されます。
