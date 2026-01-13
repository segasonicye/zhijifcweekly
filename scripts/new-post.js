#!/usr/bin/env node

/**
 * 创建新战报脚本
 * 交互式创建比赛记录模板
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * 读取模板文件
 */
function readTemplate() {
  const templatePath = path.join(__dirname, '..', 'templates', 'match-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ 模板文件不存在:', templatePath);
    process.exit(1);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * 生成战报文件
 */
function generateMatchReport(data) {
  let content = readTemplate();

  // 替换基本信息
  content = content.replace(/title: .*/, `title: "${data.title}"`);
  content = content.replace(/date: YYYY-MM-DD/, `date: "${data.date}"`);
  content = content.replace(/opponent: .*/, `opponent: ${data.opponent}`);
  content = content.replace(/score: .*/, `score: "${data.score}"`);
  content = content.replace(/location: .*/, `location: ${data.location}`);

  // 替换出勤名单
  if (data.attendance && data.attendance.length > 0) {
    const attendanceArray = data.attendance.map(p => `"${p.trim()}"`).join(', ');
    content = content.replace(/attendance: \[.*\]/, `attendance: [${attendanceArray}]`);
  }

  // 替换照片路径中的日期
  content = content.replace(/photos\/YYYY-MM-DD/g, `photos/${data.date}`);

  return content;
}

/**
 * 创建文件
 */
async function createMatchReport(filename, content) {
  const matchesDir = path.join(__dirname, '..', 'matches');

  // 确保目录存在
  if (!fs.existsSync(matchesDir)) {
    fs.mkdirSync(matchesDir, { recursive: true });
  }

  const filePath = path.join(matchesDir, filename);

  // 检查文件是否已存在
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  文件已存在: ${filename}`);
    const overwrite = await question('是否覆盖? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ 已取消');
      process.exit(0);
    }
  }

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`\n✅ 战报已创建: ${filename}`);
  console.log(`📂 路径: ${filePath}\n`);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== 创建新战报 ===\n');

  try {
    // 收集基本信息
    const date = await question('请输入比赛日期 (YYYY-MM-DD, 如 2025-01-12): ');
    const opponent = await question('请输入对手名称: ');
    const score = await question('请输入比分 (如 3-2, 如未比赛可留空): ');
    const location = await question('请输入比赛地点 (如: 朝阳公园): ');

    // 生成标题
    let title = `${date} ${opponent}`;
    if (score) {
      title += ` ${score}`;
    }
    const confirmTitle = await question(`\n自动生成标题: "${title}", 是否修改? (直接回车使用默认): `);
    if (confirmTitle.trim()) {
      title = confirmTitle.trim();
    }

    // 收集出勤名单
    console.log('\n请输入出勤人员 (用逗号或空格分隔):');
    const attendanceInput = await question('人员: ');
    const attendance = attendanceInput
      .split(/[,，\s]+/)
      .filter(p => p.trim())
      .map(p => p.trim());

    // 显示确认信息
    console.log('\n--- 确认信息 ---');
    console.log(`日期: ${date}`);
    console.log(`对手: ${opponent}`);
    console.log(`比分: ${score || '未填写'}`);
    console.log(`地点: ${location}`);
    console.log(`出勤: ${attendance.length > 0 ? attendance.join(', ') : '未填写'}`);
    console.log(`标题: ${title}`);
    console.log('----------------\n');

    const confirm = await question('确认创建? (Y/n): ');
    if (confirm.toLowerCase() === 'n') {
      console.log('❌ 已取消');
      process.exit(0);
    }

    // 生成文件名
    const filename = `${date}-${opponent}.md`;

    // 生成内容
    const content = generateMatchReport({
      title,
      date,
      opponent,
      score: score || '',
      location,
      attendance
    });

    // 创建文件
    await createMatchReport(filename, content);

    console.log('💡 下一步操作:');
    console.log('   1. 编辑战报内容');
    console.log('   2. 添加照片: npm run photos');
    console.log('   3. 查看统计: npm run stats');
    console.log('   4. 发布公众号: npm run sync\n');

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

module.exports = { generateMatchReport };
