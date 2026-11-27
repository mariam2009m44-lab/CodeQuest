# CodeQuest Cloudflare Worker

This directory contains the production Cloudflare Worker used by CodeQuest for Cody chat, code execution, and quiz validation.

## Production deployment

The repository workflow `.github/workflows/deploy-cloudflare-worker.yml` deploys this Worker to the existing production service named `codequest` whenever files in this directory change on `main`.

Required GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
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

## ParentLinks (pilot ON since 2026-11-27) - limits to settle before wider rollout
- `PARENT_LINKS_ENABLED = "on"` in wrangler.toml as a pilot (owner asked on 2026-11-27). Requests without a valid Firebase sign-in get 401 before the flag is read (see parent-http tests). Still open: Not tested for real authenticated CPU on the free Worker.
- All links and codes live under ONE Durable Object storage key (`links`). That is fine for a small pilot; it has a storage-size ceiling and one object serialises every request. Move to per-account keys before broad use.
- Bounds (3 active codes per child, 10 failed claims per hour per parent, 4 parents per child, 10 children per parent, 30 minute codes) are provisional, not user-approved.
- The parent dashboard shows only lessonTestsPassed and unitExamsPassed from server-assessed results. An empty server record, or PROGRESS_WRITES not "on", returns syncState "unknown" (never 0).
- Storage: academy and parent services run as the named instances "svc:academy" and "svc:parent" of the already-deployed StudentProgress class. No new Durable Object namespace and no new migration: Workers Free allows only 100 DO namespaces per account, and the deploy of two new classes was refused (error 10067) on 2026-11-25. Instance names are 140+ characters ("svc-academy-xxxx..."), longer than any accepted uid (max 128), so no authenticated user can address them and no uid format is rejected.
- Roll-forward only: never delete these records or the StudentProgress class as rollback.
