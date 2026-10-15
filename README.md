# vip.anyaigc.ai

AnyAIGC·AI 的 AI 会员订阅页。单个静态 HTML 文件，不依赖框架、不需要构建，直接部署即可。

用户在页面上浏览 ChatGPT、Claude、Google AI、Grok / X 等会员，有标价的商品显示价格，未标价的商品点击「咨询」弹出客服联系方式。

## 目录结构

```
.
├── subscriptions.html   # 页面本体：HTML、CSS、JS 都在这一个文件里
├── favicon.ico
├── robots.txt
├── sitemap.xml          # 由 npm run prerender 生成
├── assets/
│   ├── openai_bai.svg   # 商品图标
│   ├── claude.svg
│   ├── gemini.svg
│   ├── Grok_bai.svg
│   ├── x.svg
│   ├── support.png      # 客服联系方式（微信 / QQ / TG 二维码）
│   └── og-cover.png     # 分享卡片封面，由 npm run og 生成
├── scripts/             # 维护脚本，部署时不需要
│   ├── prerender.mjs
│   ├── og-cover.mjs
│   └── browser.mjs
└── package.json         # 只为运行维护脚本，页面本身无依赖
```

## 本地预览

双击 `subscriptions.html` 用浏览器打开即可。也可以起一个本地静态服务：

```bash
npx serve .
# 或
python -m http.server 8080
```

## 部署

把目录上传到任意静态托管（Nginx、OSS / COS、GitHub Pages、Vercel、Cloudflare Pages 等）。需要上传的是 `subscriptions.html`、`favicon.ico`、`robots.txt`、`sitemap.xml` 和 `assets/`；`scripts/`、`package.json`、`node_modules/` 不用上传。

如果希望访问域名根路径就打开这个页面，把 `subscriptions.html` 重命名为 `index.html`，或在服务器上配置默认文档。

## 修改内容

所有数据都在 `subscriptions.html` 底部 `<script>` 里，改完刷新页面即可。

### 商品 `PRODUCTS`

```js
{
  id: 'gpt-plus',                     // 唯一标识
  icon: 'assets/openai_bai.svg',      // 图标文件；缺失时自动退回内置示意图标
  cat: 'chatgpt',                     // 所属分类，对应 CATS 里的 id
  name: 'ChatGPT Plus',
  tile: T.green,                      // 图标底块颜色
  accent: ['#18b97a', '#0a6e4f'],     // 卡片主题渐变色
  accentInk: '#cbd5e1',               // 可选：主题色太暗时，深色背景上的文字/小图标改用这个颜色
  badge: '人气',                       // 角标，留空则不显示
  delivery: 'account',                // 开通方式，对应 DELIVERY 里的 key
  tagline: '……',                       // 一句话介绍
  perks: ['……', '……'],                // 权益列表，卡片上显示前两条
  fit: '……',                           // 适合人群
  plans: [
    { label: '月卡', term: '1 个月', price: 160 }
  ]
}
```

- `price` 填数字：显示「160 算力」，按钮为「开通」。
- `price` 填 `null`：显示「联系客服」，按钮为「咨询」，点击弹出客服二维码。
- 一个商品有多个规格时，卡片显示最低价并加「起」，详情弹窗里可以切换规格。

### 其他配置

| 常量 | 作用 |
|---|---|
| `CATS` | 分类 Tab，没有商品的分类会自动隐藏 |
| `DELIVERY` | 开通方式：标签文字与开通流程步骤 |
| `NOTES` | 各开通方式对应的购买须知 |
| `PROMISES` | Hero 区的四个承诺点 |
| `FAQ` | 常见问题 |
| `featured` | Hero 区展示的三张卡片（按商品 id） |
| `SUPPORT_IMG` | 客服联系方式图片路径 |

### 替换客服信息

直接覆盖 `assets/support.png`。账号有变化时，同步修改 `openSupport` 函数里图片的 `alt` 文字（读屏软件会朗读这段文字）。

## SEO

页面已经包含：

- `<title>`、`description`、`keywords`、`canonical`、`robots`
- Open Graph / Twitter 分享卡片（封面图 `assets/og-cover.png`，1200×630）
- JSON-LD 结构化数据：`Organization`、`WebPage`、`OfferCatalog`（只给有标价的规格写价格）、`FAQPage`
- `robots.txt`、`sitemap.xml`
- 预渲染：商品网格、分类、FAQ、承诺点、Hero 卡片直接写在 HTML 里，百度、微信搜一搜等不执行 JS 的爬虫也能读到

预渲染内容放在 `<!--SEO:xxx-->…<!--/SEO:xxx-->` 标记之间，由脚本生成，不要手改。

**改了 `PRODUCTS` / `FAQ` 等数据后，执行一次预渲染**，否则 HTML 里的静态内容和结构化数据会和页面显示对不上：

```bash
npm install          # 首次
npm run prerender    # 更新预渲染内容、JSON-LD、sitemap.xml 的 lastmod
npm run og           # 可选：Hero 区有变化时重新生成分享封面
```

脚本用 Playwright 驱动浏览器；没有下载 Playwright 自带的 Chromium 时，会自动使用系统里的 Chrome 或 Edge。

正式域名写死为 `https://vip.anyaigc.ai/`，出现在 `subscriptions.html` 的 `<head>`、`scripts/prerender.mjs`、`robots.txt` 里，换域名时三处一起改。

上线后建议到 [Google Search Console](https://search.google.com/search-console) 和 [百度搜索资源平台](https://ziyuan.baidu.com/) 提交 `sitemap.xml`。

## 待接入

页面目前是纯前端演示，下面这些按钮只会弹出提示，需要接入真实业务：

- 顶栏「登录 / 注册」
- 「我的订单」
- 有标价商品的「立即开通」（下单流程）

## 浏览器支持

Chrome / Edge / Safari / Firefox 的近两年版本。页面用到了 `color-mix()`、`scrollbar-gutter`、CSS 独立变换属性（`translate` / `scale`），旧版浏览器上部分视觉效果会降级，功能不受影响。

系统开启「减少动态效果」时，页面动画会自动关闭。
