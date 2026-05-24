# jwt-auth-sample

A React SPA + GraphQL API authentication sample based on Ben Awad's JWT auth example.

Reference implementation: https://github.com/benawad/jwt-auth-example

## Improvements

This version keeps the original architecture while hardening the authentication flow.

- Stores the access token in React memory
- Stores the refresh token in an HttpOnly cookie
- Reissues access tokens through `/refresh_token`
- Adds a `jti` claim to refresh tokens and maps them to database-backed sessions
- Rotates refresh tokens on every refresh and revokes the token family when reuse is detected
- Uses the `__Host-` cookie prefix to reduce cookie overwrite risk
- Checks Origin, Referer, and Fetch Metadata on `/refresh_token` to reduce CSRF risk
- Sanitizes error logging to avoid printing tokens or stack traces
- Adds groundwork for CSRF token validation on GraphQL mutations
