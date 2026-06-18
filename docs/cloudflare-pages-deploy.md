# Cloudflare Pages Deploy

AgentBridge's hosted web frontend is a static Vite build that can be deployed to Cloudflare Pages.

## Production Flow

Pushing to `main` runs `.github/workflows/deploy-cloudflare-pages.yml`.

The workflow:

1. Installs dependencies with Bun `1.3.6`.
2. Builds the local workspace packages that the web app imports.
3. Typechecks the web app.
4. Runs the web tests.
5. Builds `@agentbridge/web`.
6. Uploads `apps/web/dist` to Cloudflare Pages with Wrangler.

## Cloudflare Setup

Create a Cloudflare Pages project named `agentbridge`, or set the GitHub repository variable `CLOUDFLARE_PAGES_PROJECT_NAME` to the existing Pages project name.

The current direct-upload Pages project is `agentbridge`, with production URL:

```text
https://agentbridge-8q9.pages.dev
```

Set the Pages project's production branch to `main`.

Add these GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The API token needs Cloudflare Pages edit access for the account.

Attach your chosen custom domain to the Pages project in Cloudflare:

1. Open Cloudflare dashboard.
2. Go to Workers & Pages.
3. Select the AgentBridge Pages project.
4. Open Custom domains.
5. Add the custom domain.

Cloudflare requires the custom domain to be attached to the Pages project. DNS alone is not enough.
