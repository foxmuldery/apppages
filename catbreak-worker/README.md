# CatBreak download stats Worker

This Worker counts CatBreak downloads and serves the public stats JSON used by the CatBreak page footer.

Routes:

- `/catbreak/download`: increments the counter, then redirects to the zip file.
- `/catbreak/stats.json`: returns the current totals as JSON.

Deploy flow:

1. Log in to Cloudflare:

   ```sh
   npx wrangler login
   ```

2. Deploy:

   ```sh
   npx wrangler deploy
   ```

The production KV namespace is already configured in `wrangler.jsonc`.
