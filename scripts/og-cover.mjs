// 生成分享卡片封面 assets/og-cover.png（1200×630），截取页面 Hero 区。
// 用法：npm run og（改了 Hero 文案或展示卡片后执行一次）
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'subscriptions.html');
const OUT = path.join(ROOT, 'assets', 'og-cover.png');

const browser = await launch();
try {
  // 视口即封面尺寸；关闭动画，确保截到的是最终状态
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load' });
  await page.waitForSelector('#rig .holo');
  await page.addStyleTag({
    content: `
      html{scrollbar-gutter:auto !important;overflow:hidden !important}
      .top{position:absolute !important;left:0;right:0;top:0;padding:28px 56px !important;background:none !important;border:0 !important}
      main{max-width:none !important;padding:0 56px !important}
      .hero{min-height:630px;padding:72px 0 24px !important;align-items:center;grid-template-columns:1fr 1fr !important}
      .promises,.live{display:none !important}
    `
  });
  // reducedMotion 会把入场动画压到 0.01ms 并停在第一帧，奶茶杯等元素可能停在透明状态，这里强制显示最终状态
  await page.addStyleTag({ content: `*,*::before,*::after{animation:none !important;transition:none !important}` });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT });
  console.log(`封面已生成：${path.relative(ROOT, OUT)}`);
} finally {
  await browser.close();
}
