#!/usr/bin/env node

/**
 * Netlify自动部署脚本
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n=== 部署到Netlify ===\n');

try {
  // 1. 先生成所有HTML文件
  console.log('📝 生成HTML文件...');
  execSync('node scripts/matches-view.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  // 重新生成所有比赛页面
  const matches = ['2026-01-09-内战', '2026-01-03-党校队', '2026-01-01-三海风'];
  matches.forEach(match => {
    console.log(`生成 ${match}...`);
    execSync(`node scripts/preview.js ${match}`, { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  });

  console.log('✅ HTML文件生成完成\n');

  // 2. 部署到Netlify
  console.log('🚀 正在部署到Netlify...\n');

  const outputDir = path.join(__dirname, '..', 'output');

  try {
    // 先尝试标准部署
    execSync(`npx netlify deploy --prod --dir=${outputDir}`, {
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {
    // 如果失败,尝试创建新项目
    console.log('\n💡 检测到首次部署,正在创建新项目...\n');

    // 使用 --create-site 参数自动创建项目
    execSync(`npx netlify deploy --prod --dir=${outputDir} --create-site`, {
      stdio: 'inherit',
      env: process.env
    });
  }

  console.log('\n✅ 部署成功!\n');

} catch (error) {
  console.error('\n❌ 部署失败:', error.message);
  console.log('\n💡 提示:');
  console.log('1. 首次使用请运行: npx netlify login');
  console.log('2. 然后运行: npx netlify init');
  console.log('3. 或者手动访问 https://app.netlify.com/drop 拖拽output文件夹\n');
  process.exit(1);
}
