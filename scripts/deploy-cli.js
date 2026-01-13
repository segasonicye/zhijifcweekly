#!/usr/bin/env node

/**
 * Netlify CLI 部署脚本
 * 使用命令行参数,避免交互式输入
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n=== Netlify CLI 部署 ===\n');

try {
  // 1. 生成所有HTML文件
  console.log('📝 生成HTML文件...\n');
  execSync('node scripts/matches-view.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  // 重新生成所有比赛页面
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

  // 2. 部署到Netlify
  console.log('🚀 正在部署到Netlify...\n');

  const outputDir = path.join(__dirname, '..', 'output');

  // 检查是否已链接
  const netlifyStatePath = path.join(__dirname, '..', '.netlify', 'state.json');

  if (!fs.existsSync(netlifyStatePath)) {
    console.log('💡 首次部署,需要链接项目...\n');

    // 方法1: 直接使用deploy命令创建新站点
    try {
      console.log('正在创建新站点...\n');
      execSync(`npx netlify deploy --prod --dir="${outputDir}" --message="Auto deploy"`, {
        stdio: 'inherit',
        env: { ...process.env, NETLIFY_AUTH_TOKEN: '' }
      });
    } catch (deployError) {
      console.log('\n⚠️  需要手动链接项目\n');
      console.log('请运行以下命令来链接项目:\n');
      console.log('npx netlify link\n');
      console.log('然后选择 "Create & configure a new project"\n');
      throw deployError;
    }
  } else {
    // 已链接,直接部署
    console.log('✅ 已连接到Netlify项目\n');
    execSync(`npx netlify deploy --prod --dir="${outputDir}" --message="Update match reports"`, {
      stdio: 'inherit',
      env: process.env
    });
  }

  console.log('\n✅ 部署成功!\n');

  // 显示站点信息
  try {
    const state = JSON.parse(fs.readFileSync(netlifyStatePath, 'utf8'));
    if (state.siteId) {
      console.log(`🌐 Site ID: ${state.siteId}\n`);
    }
  } catch (e) {
    // 忽略错误
  }

} catch (error) {
  console.error('\n❌ 部署失败:', error.message);
  console.log('\n💡 提示: 如果是首次使用,请先运行:\n');
  console.log('npx netlify link\n');
  process.exit(1);
}
