# Documentation

The site at <https://ttlp.docs.isaackogan.com/> is built with Astro Starlight and served from Cloudflare Workers static assets. It is a separate pnpm project from the monorepo so its dependencies never reach the published library.

```sh
pnpm --dir docs install --frozen-lockfile
pnpm --dir docs dev        # http://127.0.0.1:4321
pnpm --dir docs build      # validates internal links, writes dist/
pnpm --dir docs verify     # SEO gate against dist/
```

Pages live in `src/content/docs/`: `app/` for the no-code app, `library/` for the npm package. Keep the two sections independent; a reader on one path should not need the other.

## Hosting

`wrangler.jsonc` declares the asset directory and the custom domain `ttlp.docs.isaackogan.com`; there is no Worker script. The GitHub workflow builds and verifies every change, and on pushes to `main` deploys when the repository has the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. To deploy from a checkout with a logged-in wrangler: `pnpm --dir docs build && pnpm --dir docs run deploy:cloudflare`.
