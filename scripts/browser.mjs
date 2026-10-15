// 启动浏览器：优先用 Playwright 自带的 Chromium，没装时退回系统里的 Chrome / Edge，
// 这样不必额外下载浏览器也能运行脚本。
import { chromium } from 'playwright';

export async function launch() {
  const tries = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  let lastErr;
  for (const opts of tries) {
    try {
      return await chromium.launch(opts);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`找不到可用的浏览器。请执行 npx playwright install chromium，或安装 Chrome / Edge。\n${lastErr?.message || ''}`);
}
