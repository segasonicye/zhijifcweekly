#!/usr/bin/env node

/**
 * 一键更新脚本
 * 整合: 创建战报 → 添加照片 → 生成HTML → 推送部署
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * 执行命令
 */
function execCommand(command, options = {}) {
  try {
    execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取最新创建的比赛日期
 */
function getLatestMatchDate() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) {
    return null;
  }

  const files = fs.readdirSync(matchesDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  // 从文件名提取日期 (YYYY-MM-DD格式)
  const match = files[0].match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * 主流程
 */
async function main() {
  log('\n=== 知己足球俱乐部战报更新 ===\n', 'blue');

  try {
    // 步骤1: 创建新战报
    log('📝 步骤 1/4: 创建新战报\n', 'blue');
    const success = execCommand('node scripts/new-post.js');

    if (!success) {
      log('\n❌ 战报创建失败或已取消\n', 'red');
      process.exit(1);
    }

    log('\n✅ 战报创建完成!\n', 'green');

    // 获取最新比赛日期
    const matchDate = getLatestMatchDate();
    if (matchDate) {
      const photosDir = path.join(__dirname, '..', 'photos', matchDate);
      if (fs.existsSync(photosDir)) {
        const photoCount = fs.readdirSync(photosDir)
          .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length;

        log(`📸 照片文件夹: photos/${matchDate}/`, 'yellow');
        log(`   当前照片数量: ${photoCount} 张\n`, 'yellow');
      } else {
        log(`📸 照片文件夹: photos/${matchDate}/ (已创建)\n`, 'yellow');
      }
    }

    // 步骤2: 添加照片
    const addPhotos = await question('照片已放入文件夹,是否继续添加照片到战报? (y/n, 默认n): ');

    if (addPhotos.toLowerCase() === 'y' || addPhotos.toLowerCase() === 'yes') {
      log('\n📷 步骤 2/4: 添加照片\n', 'blue');
      execCommand('node scripts/add-photos.js');
      log('\n✅ 照片添加完成!\n', 'green');
    } else {
      log('\n⏭️  跳过照片添加\n', 'yellow');
    }

    // 步骤3: 生成HTML
    log('🌐 步骤 3/4: 生成HTML页面\n', 'blue');

    // 生成总览页面
    execCommand('node scripts/matches-view.js');

    // 生成所有比赛详情页
    const matchesDir = path.join(__dirname, '..', 'matches');
    if (fs.existsSync(matchesDir)) {
      const files = fs.readdirSync(matchesDir).filter(f => f.endsWith('.md'));
      log(`正在生成 ${files.length} 个比赛页面...\n`, 'yellow');

      files.forEach(file => {
        const matchName = file.replace('.md', '');
        execCommand(`node scripts/preview.js "${matchName}"`, { stdio: 'pipe' });
      });
    }

    log('\n✅ HTML生成完成!\n', 'green');

    // 步骤4: 推送到GitHub
    const pushToGit = await question('是否立即推送到GitHub? (y/n, 默认y): ');

    if (pushToGit === '' || pushToGit.toLowerCase() === 'y' || pushToGit.toLowerCase() === 'yes') {
      log('\n🚀 步骤 4/4: 推送到GitHub\n', 'blue');

      // 检查是否有Git仓库
      const gitDir = path.join(__dirname, '..', '.git');
      if (!fs.existsSync(gitDir)) {
        log('\n❌ 未找到Git仓库\n', 'red');
        log('💡 提示: 请先运行: git init\n', 'yellow');
        process.exit(1);
      }

      // 添加所有文件
      log('正在添加文件...', 'yellow');
      execCommand('git add .');

      // 检查是否有变化
      try {
        execSync('git diff --cached --quiet', {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        log('\n⚠️  没有需要提交的更改\n', 'yellow');
        process.exit(0);
      } catch (error) {
        // 有变化,继续提交
      }

      // 提交
      const date = new Date().toISOString().split('T')[0];
      log('正在提交更改...', 'yellow');
      const commitSuccess = execCommand(`git commit -m "更新战报 ${date}"`);

      if (!commitSuccess) {
        log('\n❌ Git提交失败\n', 'red');
        process.exit(1);
      }

      // 推送
      log('正在推送到GitHub...', 'yellow');
      const pushSuccess = execCommand('git push');

      if (pushSuccess) {
        log('\n✅ 推送成功!', 'green');
        log('\n🌐 Netlify正在自动部署中...', 'blue');
        log('   大约1-2分钟后你的网站将会更新!\n', 'blue');
        log('✨ 全部完成!\n', 'green');
      } else {
        log('\n❌ 推送到GitHub失败\n', 'red');
        log('💡 提示: 你可以稍后手动运行:', 'yellow');
        log('   git push\n', 'yellow');
      }
    } else {
      log('\n💡 提示: 你可以稍后手动推送:', 'yellow');
      log('   git add .');
      log('   git commit -m "更新战报"');
      log('   git push\n', 'yellow');
      log('✨ HTML已生成完成!\n', 'green');
    }

  } catch (error) {
    log(`\n❌ 发生错误: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// 运行主程序
main();
