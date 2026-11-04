import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import lucode from 'lucode-starlight';
import { visit } from 'unist-util-visit';
import { unified } from '@astrojs/markdown-remark';

const base = `/${(process.env.DOCS_BASE || '').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

// Authored Markdown uses root-relative links; prefix them with the deploy base (a no-op when base is '/').
function prefixLinks() {
  return (tree) => visit(tree, 'link', (node) => {
    if (node.url.startsWith('/') && !node.url.startsWith('//') && !node.url.startsWith(base)) {
      node.url = `${base}${node.url.slice(1)}`;
    }
  });
}

export default defineConfig({
  site: process.env.DOCS_SITE || 'https://ttlp.docs.isaackogan.com',
  base,
  trailingSlash: 'always',
  markdown: { processor: unified({ remarkPlugins: [prefixLinks] }) },
  integrations: [
    starlight({
      title: 'TikTok Live Printer',
      description: 'Print TikTok LIVE gifts, follows and comments to a thermal receipt printer: a no-code desktop app and a Node.js library built on the Euler Stream WebSocket.',
      favicon: '/favicon.png',
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://raw.githubusercontent.com/isaackogan/TikTokLive/master/.github/SquareLogo.png' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'TikTok Live Printer, a TikTok LIVE gift printer for thermal receipt printers' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/isaackogan/TikTokPrinter' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/tiktok-live-printer' },
      ],
      editLink: { baseUrl: 'https://github.com/isaackogan/TikTokPrinter/edit/main/docs/' },
      sidebar: [
        { label: 'Start here', items: [{ label: 'Overview', slug: '' }] },
        { label: 'App (no-code)', items: [{ autogenerate: { directory: 'app' } }] },
        { label: 'Library (Node.js)', items: [{ autogenerate: { directory: 'library' } }] },
      ],
      plugins: [
        lucode({
          navLinks: [
            { label: 'Docs', link: base },
            { label: 'App', link: `${base}app/install/` },
            { label: 'Library', link: `${base}library/getting-started/` },
          ],
          footerText: 'Unofficial project, not affiliated with TikTok or ByteDance Ltd. LIVE events by the [Euler Stream](https://www.eulerstream.com/) WebSocket API. Source on [GitHub](https://github.com/isaackogan/TikTokPrinter).',
        }),
        starlightLinksValidator(),
      ],
    }),
  ],
});
