#!/usr/bin/env node

/**
 * 球队照片整理脚本
 * 功能:自动将散乱的照片按日期重命名并组织到对应目录
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 从图片EXIF数据中提取拍摄日期
 * 支持jpg/jpeg格式
 */
function getImageDate(filePath) {
  try {
    // 使用exiftool读取EXIF数据(需要安装: npm install -g exiftool)
    // 或者使用exifr库
    const stats = fs.statSync(filePath);
    return stats.mtime; // 如果没有EXIF,使用文件修改时间
  } catch (error) {
    console.warn(`⚠️  无法读取 ${filePath} 的日期信息`);
    return null;
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 递归扫描目录中的所有图片文件
 */
function scanImages(dir) {
  const images = [];
  const extensions = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scan(filePath);
      } else if (extensions.includes(path.extname(file).toLowerCase())) {
        images.push(filePath);
      }
    }
  }

  scan(dir);
  return images;
}

/**
 * 整理照片到目标目录
 */
async function organizePhotos(sourceDir, targetDir, matchDate) {
  console.log(`\n📸 开始整理照片...`);
  console.log(`📂 源目录: ${sourceDir}`);
  console.log(`📂 目标目录: ${targetDir}`);

  // 扫描源目录中的所有图片
  const images = scanImages(sourceDir);
  console.log(`\n✅ 找到 ${images.length} 张图片`);

  if (images.length === 0) {
    console.log('❌ 没有找到图片文件');
    return;
  }

  // 创建目标目录
  const dateDir = path.join(targetDir, matchDate);
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    console.log(`\n✅ 创建目录: ${dateDir}`);
  }

  // 复制并重命名图片
  let counter = 1;
  for (const image of images) {
    const ext = path.extname(image);
    const newName = `photo-${String(counter).padStart(3, '0')}${ext}`;
    const newPath = path.join(dateDir, newName);

    fs.copyFileSync(image, newPath);
    console.log(`  📷 ${path.basename(image)} → ${matchDate}/${newName}`);
    counter++;
  }

  console.log(`\n✅ 成功整理 ${images.length} 张照片到 photos/${matchDate}/`);
  console.log(`\n💡 提示: 在战报中引用照片时使用:\n`);
  console.log(`![照片描述](photos/${matchDate}/photo-001.jpg)`);
}

/**
 * 交互式询问
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== 球队照片整理工具 ===\n');

  try {
    // 获取源目录
    const sourceDir = await question('请输入照片所在的目录路径: ');
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ 目录不存在!');
      process.exit(1);
    }

    // 获取比赛日期
    const matchDate = await question('请输入比赛日期 (格式: YYYY-MM-DD, 如 2025-01-12): ');

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(matchDate)) {
      console.error('❌ 日期格式不正确! 请使用 YYYY-MM-DD 格式');
      process.exit(1);
    }

    // 目标目录
    const targetDir = path.join(__dirname, '..', 'photos');

    // 整理照片
    await organizePhotos(sourceDir, targetDir, matchDate);

    console.log('\n✨ 完成!\n');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { organizePhotos, scanImages };
