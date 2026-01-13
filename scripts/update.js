#!/usr/bin/env node

/**
 * 一键更新脚本
 * 整合: 创建战报 → 生成HTML → 推送部署
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n=== 知己足球俱乐部战报更新 ===\n');

try {
  // 步骤1: 创建新战报
  console.log('📝 步骤 1/3: 创建新战报\n');
  execSync('node scripts/new-post.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('\n✅ 战报创建完成!\n');

  // 询问是否添加照片
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('是否有照片需要添加? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n📷 步骤 2/3: 添加照片\n');

      try {
        execSync('node scripts/add-photos.js', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
        console.log('\n✅ 照片添加完成!\n');
      } catch (error) {
        console.log('\n⚠️  照片添加跳过\n');
      }

      generateAndDeploy();
    } else {
      console.log('\n⏭️  跳过照片添加\n');
      generateAndDeploy();
    }

    rl.close();
  });

  function generateAndDeploy() {
    // 步骤3: 生成HTML
    console.log('🌐 步骤 3/3: 生成HTML页面\n');

    try {
      execSync('node scripts/matches-view.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // 重新生成所有比赛页面
      const matchesDir = path.join(__dirname, '..', 'matches');
      if (fs.existsSync(matchesDir)) {
        const files = fs.readdirSync(matchesDir).filter(f => f.endsWith('.md'));
        files.forEach(file => {
          const matchName = file.replace('.md', '');
          execSync(`node scripts/preview.js "${matchName}"`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
          });
        });
      }

      console.log('\n✅ HTML生成完成!\n');

      // 询问是否推送到GitHub
      const readline = require('readline');
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl2.question('\n是否立即推送到GitHub? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log('\n🚀 正在推送到GitHub...\n');

          try {
            execSync('git add .', {
              cwd: path.join(__dirname, '..'),
              stdio: 'inherit'
            });

            // 获取当前日期作为commit message
            const date = new Date().toISOString().split('T')[0];
            execSync(`git commit -m "更新战报 ${date}"`, {
              cwd: path.join(__dirname, '..'),
              stdio: 'inherit'
            });

            execSync('git push', {
              cwd: path.join(__dirname, '..'),
              stdio: 'inherit'
            });

            console.log('\n✅ 推送成功!');
            console.log('\n🌐 Netlify正在自动部署中...');
            console.log('大约1-2分钟后你的网站将会更新!\n');
            console.log('✨ 全部完成!\n');

          } catch (error) {
            console.error('\n❌ 推送失败:', error.message);
            console.log('\n💡 提示: 你可以稍后手动运行:');
            console.log('  git add .');
            console.log('  git commit -m "更新战报"');
            console.log('  git push\n');
          }

          rl2.close();
          process.exit(0);
        } else {
          console.log('\n💡 提示: 你可以稍后手动推送:');
          console.log('  git add .');
          console.log('  git commit -m "更新战报"');
          console.log('  git push\n');
          console.log('✨ HTML已生成完成!\n');

          rl2.close();
          process.exit(0);
        }
      });
    }

    catch (error) {
      console.error('\n❌ 生成HTML失败:', error.message);
      process.exit(1);
    }
  }

} catch (error) {
  console.error('\n❌ 创建战报失败:', error.message);
  process.exit(1);
}
