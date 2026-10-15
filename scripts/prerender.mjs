// 预渲染：用无头浏览器运行页面，把 JS 渲染出的商品、FAQ 等区块写回 HTML，
// 并根据页面数据生成 JSON-LD 结构化数据与 sitemap.xml。
// 用法：npm run prerender（改了 PRODUCTS / FAQ 等数据后执行一次）
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'subscriptions.html');
const SITE = 'https://vip.anyaigc.ai/';
const REGIONS = ['promises', 'rig', 'tabs', 'grid', 'faq'];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 把 <!--SEO:name-->...<!--/SEO:name--> 之间的内容替换为 body
function fill(html, name, body) {
  const re = new RegExp(`(<!--SEO:${escapeRe(name)}-->)[\\s\\S]*?(<!--/SEO:${escapeRe(name)}-->)`);
  if (!re.test(html)) throw new Error(`找不到标记 <!--SEO:${name}-->`);
  return html.replace(re, (_, a, b) => `${a}${body}${b}`);
}

// 结构化数据里只放纯文本，避免 </script> 等内容截断脚本块
const safeJson = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

function buildJsonLd({ PRODUCTS, FAQ }) {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE}#org`,
    name: 'AnyAIGC·AI',
    url: 'https://anyaigc.ai/'
  };
  const webpage = {
    '@type': 'WebPage',
    '@id': SITE,
    url: SITE,
    name: 'AI 会员代开通 · ChatGPT、Claude、Gemini、Grok 一站开通',
    inLanguage: 'zh-CN',
    publisher: { '@id': `${SITE}#org` }
  };
  // 服务目录：只给有明确标价的规格写 Offer，未标价（联系客服）的商品不写价格，避免向搜索引擎提供不准确的信息
  const catalog = {
    '@type': 'OfferCatalog',
    name: 'AI 会员订阅',
    itemListElement: PRODUCTS.map((p) => {
      const service = {
        '@type': 'Service',
        name: p.name,
        description: p.tagline,
        provider: { '@id': `${SITE}#org` },
        serviceType: 'AI 会员开通服务'
      };
      const priced = p.plans.filter((pl) => typeof pl.price === 'number');
      if (priced.length) {
        service.offers = priced.map((pl) => ({
          '@type': 'Offer',
          name: `${p.name} ${pl.label}（${pl.term}）`,
          price: String(pl.price),
          priceCurrency: 'CNY',
          availability: 'https://schema.org/InStock',
          url: SITE
        }));
      }
      return service;
    })
  };
  const faq = {
    '@type': 'FAQPage',
    '@id': `${SITE}#faq`,
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  return { '@context': 'https://schema.org', '@graph': [org, webpage, { ...catalog, '@id': `${SITE}#catalog` }, faq] };
}

async function main() {
  let html = await readFile(PAGE, 'utf8');

  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__SEO_DATA__ && document.querySelector('#grid .sc'));
    if (errors.length) throw new Error(`页面运行出错：\n${errors.join('\n')}`);

    const out = await page.evaluate(() => {
      const inner = (sel) => document.querySelector(sel).innerHTML;
      const tabs = [...document.querySelectorAll('#tabs .tab')].map((b) => b.outerHTML).join('');
      // 预渲染内容去掉运行时才有的状态（如滑块位置），保持 HTML 干净
      return {
        promises: inner('#promises'),
        rig: inner('#rig'),
        tabs,
        grid: inner('#grid'),
        faq: inner('#faq'),
        data: JSON.parse(JSON.stringify(window.__SEO_DATA__))
      };
    });

    for (const name of REGIONS) {
      // 去掉上一次预渲染残留在区块里的标记注释
      const body = out[name].replace(/<!--\/?SEO:[a-z]+-->/g, '');
      html = fill(html, name, body);
    }
    html = fill(html, 'JSONLD', `\n<script type="application/ld+json">\n${safeJson(buildJsonLd(out.data))}\n</script>\n`);
  } finally {
    await browser.close();
  }

  await writeFile(PAGE, html);

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap);

  console.log(`预渲染完成：${REGIONS.join('、')}、JSON-LD；sitemap.xml lastmod=${today}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
