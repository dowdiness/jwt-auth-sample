# jwt-auth-sample

Ben Awad 氏の JWT 認証サンプルを参考にした、React SPA + GraphQL API の認証サンプルです。

参考実装: https://github.com/benawad/jwt-auth-example

## 改善内容

このサンプルでは、元の構成を保ったまま認証まわりを少し堅牢にしています。

- アクセストークンは React のメモリ上で管理
- リフレッシュトークンは HttpOnly Cookie で管理
- `/refresh_token` でアクセストークンを再発行
- リフレッシュトークンに `jti` を付与し、DB 上のセッションと対応付け
- リフレッシュごとにトークンをローテーションし、再利用を検知した場合は同じトークンファミリーを失効
- Cookie 名に `__Host-` プレフィックスを使い、Cookie の上書きリスクを低減
- `/refresh_token` で Origin / Referer / Fetch Metadata を確認し、CSRF リスクを低減
- ログにトークンやスタックトレースを出さないようにエラー出力をサニタイズ
- GraphQL ミューテーション向け CSRF トークン検証の土台を追加
