#!/usr/bin/env node

/**
 * Netlify 项目初始化脚本
 * 首次使用时运行此脚本来连接Netlify项目
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n=== Netlify 项目初始化 ===\n');

// 检查是否已经初始化
const netlifyStatePath = path.join(__dirname, '..', '.netlify', 'state.json');
if (fs.existsSync(netlifyStatePath)) {
  console.log('✅ 已经连接到Netlify项目\n');
  const state = JSON.parse(fs.readFileSync(netlifyStatePath, 'utf8'));
  if (state.siteId) {
    console.log(`🌐 Site ID: ${state.siteId}\n`);
    console.log('你可以直接运行: npm run deploy\n');
    return;
  }
}

console.log('📝 开始连接到Netlify...\n');

try {
  // 检查是否已登录
  try {
    execSync('npx netlify status', { stdio: 'pipe' });
    console.log('✅ 已登录Netlify账号\n');
  } catch (error) {
    console.log('🔑 需要登录Netlify账号...\n');
    execSync('npx netlify login', { stdio: 'inherit' });
    console.log('✅ 登录成功!\n');
  }

  // 初始化项目
  console.log('🚀 正在初始化Netlify项目...\n');
  console.log('提示: 请选择 "Create & configure a new project"\n');

  // 使用 init 命令创建或连接项目
  execSync('npx netlify init', {
    stdio: 'inherit',
    env: process.env
  });

  console.log('\n✅ Netlify项目设置完成!\n');
  console.log('现在你可以运行: npm run deploy\n');

} catch (error) {
  console.error('\n❌ 初始化失败:', error.message);
  console.log('\n💡 或者你可以使用Netlify Drop快速部署:');
  console.log('https://app.netlify.com/drop\n');
  console.log('直接将 output 文件夹拖拽到网页上即可\n');
  process.exit(1);
}
