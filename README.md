# jwt-auth-sample

## このサンプルの実装　https://github.com/benawad/jwt-auth-example

## Refresh token rotation notes

This sample stores the access token in React memory and stores the refresh token in an HttpOnly `__Host-jid` cookie. Refresh tokens are rotated locally by the server and persisted as hashed `RefreshTokenSession` rows keyed by `jti` and token family.

Migration notes:

- Existing pre-rotation `jid` cookies and refresh tokens without `jti` cannot be mapped to a DB session. Users with those cookies must log in again.
- The repository currently uses TypeORM `synchronize: true`, so the new refresh-token table is created from the entity in development. Production deployments should replace this with an additive migration before disabling synchronization.
- `/refresh_token` requires a matching `Origin` or `Referer` header. Missing origin headers are allowed only outside production when `ALLOW_MISSING_ORIGIN_IN_DEV=true`.
- `Sec-Fetch-Site: cross-site` state-changing requests are rejected unless the origin is explicitly listed in `FETCH_METADATA_CROSS_SITE_ALLOW_ORIGINS`.
- CSRF token cookie/header helpers are present for GraphQL mutations, but mutation enforcement is intentionally left for a follow-up change.
