#!/usr/bin/env node

/**
 * 使用Netlify Drop快速部署
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n=== 准备部署到 Netlify Drop ===\n');

try {
  // 1. 生成所有HTML文件
  console.log('📝 生成HTML文件...\n');
  execSync('node scripts/matches-view.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  // 重新生成所有比赛页面
  const fs = require('fs');
  const matchesDir = path.join(__dirname, '..', 'matches');

  if (fs.existsSync(matchesDir)) {
    const files = fs.readdirSync(matchesDir).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      const matchName = file.replace('.md', '');
      console.log(`生成 ${matchName}...`);
      execSync(`node scripts/preview.js "${matchName}"`, { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    });
  }

  console.log('\n✅ HTML文件生成完成!\n');

  console.log('🌐 正在打开 Netlify Drop...\n');

  // 打开 Netlify Drop
  execSync('start https://app.netlify.com/drop', { windows: true });

  console.log('📋 接下来的步骤:\n');
  console.log('1. 在浏览器中,将 output 文件夹拖拽到网页上的虚线区域');
  console.log('2. 等待上传完成 (通常30秒左右)');
  console.log('3. 你会得到一个网址,例如: https://xxx-xxx-123456.netlify.app\n');
  console.log('💡 提示:');
  console.log('- 每次更新内容后,重复拖拽 output 文件夹即可');
  console.log('- Netlify 会自动覆盖旧版本,网址保持不变\n');
  console.log('✨ 完成!\n');

} catch (error) {
  console.error('\n❌ 准备失败:', error.message);
  process.exit(1);
}
