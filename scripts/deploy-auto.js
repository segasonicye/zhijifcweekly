#!/usr/bin/env node

/**
 * Netlify 自动部署脚本 (非交互式)
 * 直接创建项目并部署,无需交互
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n=== Netlify 自动部署 ===\n');

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

  // 检查是否已经链接到Netlify项目
  const netlifyStatePath = path.join(__dirname, '..', '.netlify', 'state.json');

  if (!fs.existsSync(netlifyStatePath)) {
    console.log('💡 首次部署,创建新项目...\n');

    // 使用 deploy 命令配合 --create-site 参数
    // 注意: 这会创建一个随机名称的站点
    try {
      execSync(`npx netlify deploy --prod --dir="${outputDir}"`, {
        stdio: 'inherit',
        env: process.env
      });
    } catch (error) {
      console.log('\n⚠️  需要手动选择部署选项\n');
      console.log('请按照以下步骤操作:\n');
      console.log('1. 在打开的窗口中选择 "Create & configure a new project"');
      console.log('2. 选择 "Yes, create and deploy project manually"');
      console.log('3. 输入站点名称 (如: hebo-fc-match-reports)');
      console.log('4. 确认发布目录为: output\n');
      console.log('或者使用更简单的方式:\n');
      console.log('访问 https://app.netlify.com/drop');
      console.log('将 output 文件夹拖拽到网页上即可\n');
      throw error;
    }
  } else {
    console.log('✅ 检测到已配置的Netlify项目\n');

    // 标准部署
    execSync(`npx netlify deploy --prod --dir="${outputDir}"`, {
      stdio: 'inherit',
      env: process.env
    });
  }

  console.log('\n✅ 部署成功!\n');

} catch (error) {
  console.error('\n❌ 部署失败:', error.message);
  console.log('\n💡 备选方案: 使用 Netlify Drop\n');
  console.log('运行: npm run deploy-drop');
  console.log('或访问: https://app.netlify.com/drop\n');
  process.exit(1);
}
