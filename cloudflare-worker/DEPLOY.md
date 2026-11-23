# CodeQuest Cloudflare Worker

This directory contains the production Cloudflare Worker used by CodeQuest for Cody chat, code execution, and quiz validation.

## Production deployment

The repository workflow `.github/workflows/deploy-cloudflare-worker.yml` deploys this Worker to the existing production service named `codequest` whenever files in this directory change on `main`.

Required GitHub Actions secrets:

Create a dedicated Cloudflare API token with the **Workers Editor** role scoped to the existing `codequest` Worker, then store it as `CLOUDFLARE_DEPLOY_API_TOKEN`. Keep the existing `CLOUDFLARE_API_TOKEN` unchanged; it is used by the separate quiz-answer KV workflow.

- `CLOUDFLARE_DEPLOY_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The Worker also requires the Cloudflare secret `GEMINI_API_KEY` for Cody responses. Keep this secret in Cloudflare **Workers & Pages → codequest → Settings → Variables and Secrets**. Never commit it to this repository.

The deployment workflow runs a production health check after publishing. It considers Cody ready only when both Gemini configuration and the `CODE_EXECUTION_LIMITER` Durable Object binding are available.

## Local validation

From this directory:

```bash
npm install
npx wrangler deploy --dry-run --outdir /tmp/codequest-worker-dist
```

The dry run validates the bundle without publishing it. Production publishing is handled by the protected GitHub Actions workflow.
