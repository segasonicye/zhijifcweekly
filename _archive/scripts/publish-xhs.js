const puppeteer = require('puppeteer-core');
const path = require('path');

// 配置
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const COVER_IMAGE = '/Users/yesu/zhijifcweekly/output/xhs-cover.jpg';
const TITLE = "Mac 别吃灰！5分钟给它装个 24小时 AI 私人秘书（保姆级）";
const DESC = `家人们！发现一个超牛的 AI 工具 OpenClaw！💻...（此处省略，内容同上）...`;

(async () => {
  console.log('🚀 [人机协作版] 正在启动浏览器...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
      const page = await browser.newPage();
      
      console.log('🔗 打开小红书发布页...');
      await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'networkidle2' });

      // 1. 等待登录
      console.log('🔔 正在检测登录状态...');
      try {
          await page.waitForFunction(() => {
              // 只要页面上有“发布笔记”或者“上传图文”字样，就算登录成功
              return document.body.innerText.includes('发布笔记') || document.body.innerText.includes('上传图文');
          }, { timeout: 0 }); // 无限等待
      } catch (e) {}
      
      console.log('✅ 检测到已登录！');
      
      // 2. 等待用户手动切换到“图文” Tab
      console.log('🔔 ！！！重要！！！');
      console.log('👆 请手动点击页面顶部的【上传图文】Tab！');
      console.log('⏳ 脚本正在等待直到检测到图片上传按钮...');
      
      try {
          await page.waitForFunction(() => {
              // 必须是有 accept="image/*" 的 input，才算是在图文页
              const input = document.querySelector('input[accept="image/*"]');
              return input && input.offsetParent !== null; // 且必须是可见的（非 hidden）
          }, { timeout: 0 }); // 无限等待
          console.log('✅ 检测到已切换到图文上传页！接管操作...');
      } catch (e) {}

      // 3. 上传封面
      const uploadInput = await page.$('input[accept="image/*"]');
      if (uploadInput) {
          console.log('📤 正在上传封面...');
          await uploadInput.uploadFile(COVER_IMAGE);
          console.log('✅ 封面上传指令已发送！');
          
          // 等待编辑框出现
          console.log('⏳ 等待编辑界面加载...');
          await page.waitForSelector('input[placeholder*="标题"]', { timeout: 30000 });
      } else {
          console.error('❌ 致命错误：找不到上传入口。');
      }

      // 4. 填标题
      console.log('✍️ 正在填写标题...');
      const titleInput = await page.$('input[placeholder*="标题"]');
      if (titleInput) {
          await titleInput.type(TITLE, { delay: 100 });
      } else {
           console.log('⚠️ 未找到标题框');
      }

      // 5. 填正文
      console.log('✍️ 正在填写正文...');
      const contentEditable = await page.$('#post-textarea, .c-input_textarea, [contenteditable="true"]');
      if (contentEditable) {
          await contentEditable.click();
          await contentEditable.type(DESC, { delay: 50 });
      } else {
          console.log('⚠️ 未找到正文框');
      }

      console.log('🎉 脚本流程结束！剩下的图片请手动补充，然后发布。');

  } catch (error) {
      console.error('💥 发生错误:', error);
  }
})();
