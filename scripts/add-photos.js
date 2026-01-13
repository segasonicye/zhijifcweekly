#!/usr/bin/env node

/**
 * 添加照片到战报
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * 列出所有比赛
 */
function listMatches() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) {
    return [];
  }

  return fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse();
}

/**
 * 获取指定日期的照片
 */
function getPhotosForDate(date) {
  const photosDir = path.join(__dirname, '..', 'photos', date);

  if (!fs.existsSync(photosDir)) {
    return [];
  }

  const files = fs.readdirSync(photosDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .sort();

  return files.map(file => ({
    path: path.join('photos', date, file).replace(/\\/g, '/'),
    filename: file,
    fullPath: path.join(photosDir, file)
  }));
}

/**
 * 添加照片到战报
 */
async function addPhotos() {
  console.log('\n=== 添加照片到战报 ===\n');

  // 列出所有比赛
  const matches = listMatches();
  if (matches.length === 0) {
    console.log('❌ 没有找到比赛记录');
    rl.close();
    return;
  }

  console.log('📋 可用的比赛记录:\n');
  matches.forEach((match, index) => {
    const matchName = match.replace('.md', '');
    console.log(`  ${index + 1}. ${matchName}`);
  });
  console.log('');

  // 选择比赛
  const matchIndex = await question('请输入比赛编号 (1-' + matches.length + '): ');
  const index = parseInt(matchIndex) - 1;

  if (index < 0 || index >= matches.length) {
    console.log('❌ 无效的编号');
    rl.close();
    return;
  }

  const selectedMatch = matches[index];
  const matchDate = selectedMatch.split('-')[0] + '-' + selectedMatch.split('-')[1] + '-' + selectedMatch.split('-')[2].split('-')[0];

  console.log(`\n📖 已选择: ${selectedMatch.replace('.md', '')}\n`);

  // 读取比赛文件
  const matchPath = path.join(__dirname, '..', 'matches', selectedMatch);
  const content = fs.readFileSync(matchPath, 'utf-8');
  const { data, content: body } = matter(content);

  // 获取照片
  const photos = getPhotosForDate(matchDate);

  if (photos.length === 0) {
    console.log(`❌ 没有找到 ${matchDate} 的照片`);
    console.log(`\n💡 提示: 请将照片放在 photos/${matchDate}/ 目录下`);
    rl.close();
    return;
  }

  console.log(`📸 找到 ${photos.length} 张照片:\n`);
  photos.forEach((photo, index) => {
    console.log(`  ${index + 1}. ${photo.filename}`);
  });
  console.log('');

  // 显示当前已添加的照片
  const currentPhotos = data.photos || [];
  if (currentPhotos.length > 0) {
    console.log(`当前已添加 ${currentPhotos.length} 张照片:\n`);
    currentPhotos.forEach(photo => {
      console.log(`  - ${photo.path}${photo.caption ? ' (' + photo.caption + ')' : ''}`);
    });
    console.log('');
  }

  const addAll = await question('是否添加所有照片? (y/n, 默认y): ');

  let photosToAdd = [];

  if (addAll.toLowerCase() === 'n') {
    // 选择要添加的照片
    const photoIndices = await question('请输入要添加的照片编号 (用逗号分隔, 如 1,3,5): ');
    const indices = photoIndices.split(',').map(i => parseInt(i.trim()) - 1);

    photosToAdd = indices.filter(i => i >= 0 && i < photos.length).map(i => photos[i]);
  } else {
    photosToAdd = photos;
  }

  if (photosToAdd.length === 0) {
    console.log('❌ 没有选择照片');
    rl.close();
    return;
  }

  // 询问是否添加说明
  const addCaption = await question('\n是否为照片添加说明? (y/n, 默认n): ');

  let newPhotos = [];

  if (addCaption.toLowerCase() === 'y') {
    for (let i = 0; i < photosToAdd.length; i++) {
      const photo = photosToAdd[i];
      const caption = await question(`照片 ${i + 1}/${photosToAdd.length} (${photo.filename}) 的说明 (按回车跳过): `);

      newPhotos.push({
        path: photo.path,
        caption: caption || ''
      });
    }
  } else {
    newPhotos = photosToAdd.map(photo => ({
      path: photo.path,
      caption: ''
    }));
  }

  // 合并现有照片和新照片
  const existingPaths = new Set(currentPhotos.map(p => p.path));
  const uniqueNewPhotos = newPhotos.filter(p => !existingPaths.has(p.path));
  const allPhotos = [...currentPhotos, ...uniqueNewPhotos];

  // 更新frontmatter
  const newContent = matter.stringify(body, {
    ...data,
    photos: allPhotos
  });

  // 保存文件
  fs.writeFileSync(matchPath, newContent, 'utf-8');

  console.log(`\n✅ 成功添加 ${uniqueNewPhotos.length} 张照片到 ${selectedMatch}`);
  console.log(`📊 当前共有 ${allPhotos.length} 张照片\n`);

  rl.close();
}

addPhotos().catch(error => {
  console.error('❌ 错误:', error.message);
  rl.close();
  process.exit(1);
});
