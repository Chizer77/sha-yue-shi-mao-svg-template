import fs from 'node:fs';
import { serve } from '../dev/server.mjs';
import { playwright } from '../runtime.mjs';
export async function openCapture(browserChannel) {
  const { server, url } = await serve(0, { exportsEnabled: false });
  let browser;
  try {
    const channel =
      browserChannel ||
      process.env.SVG_BROWSER ||
      (!fs.existsSync(playwright.chromium.executablePath()) && process.platform === 'win32'
        ? 'msedge'
        : undefined);
    browser = await playwright.chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: 'zh-CN',
    });
    let failure = null;
    page.on('pageerror', (error) => {
      failure = error;
    });
    await page.goto(url + '/export.html?export=1');
    await page.waitForFunction(() => window.animation?.ready, { timeout: 120000 });
    await page.evaluate(async () => {
      await window.animation.ready;
      await document.fonts.ready;
    });
    return {
      page,
      browser,
      url,
      async frame(frame) {
        if (failure) throw failure;
        await page.evaluate(async (frame) => {
          window.animation.renderFrame(frame);
          await window.animation.frameReady;
        }, frame);
        if (failure) throw failure;
        return page.screenshot({
          type: 'png',
          clip: { x: 0, y: 0, width: 1920, height: 1080 },
          animations: 'disabled',
        });
      },
      async close() {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
}
