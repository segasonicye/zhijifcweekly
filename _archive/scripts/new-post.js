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
 * 从战报文本中解析信息
 */
function parseReportText(text) {
  // 已知球员名单（从历史战报中收集）
  const knownPlayers = [
    '托蒂', '金日卢', '德国小弟', '王峰', '张航', '王一辰', '大鼻涕', '小卢', '公正',
    '喜力授', '小王', '超仕', '叉叉', '叉弟', '小叶', '涛哥', '辉哥', '王书记',
    '叶伯海', '高主席', '潘书记', '东哥', '叶老师', '陈韬'
  ];

  const result = {
    date: null,
    opponent: null,
    location: null,
    mvp: null,
    scorers: [],
    attendance: []
  };

  // 提取日期
  if (text.includes('1月收官')) {
    result.date = '2026-01-31';
  } else if (text.includes('2月收官')) {
    result.date = '2026-02-28';
  } else {
    // 尝试提取日期格式
    const dateMatch = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // 提取地点
  const locationKeywords = ['福沁球场', '朝阳公园', '党校队', '三海风'];
  for (const keyword of locationKeywords) {
    if (text.includes(keyword)) {
      result.location = keyword;
      break;
    }
  }

  // 提取对手
  if (text.includes('红蓝两队') || text.includes('内战')) {
    result.opponent = '内战';
  } else {
    for (const keyword of locationKeywords) {
      if (keyword !== '福沁球场' && keyword !== '朝阳公园' && text.includes(keyword)) {
        result.opponent = keyword;
        break;
      }
    }
  }

  // 提取MVP
  if (text.includes('最佳射手')) {
    const mvpIndex = text.indexOf('最佳射手');
    const mvpSection = text.substring(Math.max(0, mvpIndex - 50), Math.min(text.length, mvpIndex + 50));

    for (const player of knownPlayers) {
      if (mvpSection.includes(`${player}蝉联最佳射手`)) {
        result.mvp = player;
        break;
      }
    }
  }

  // 提取进球球员
  const goalActions = ['捅射', '射门', '抽射', '推射', '扫射', '劲射', '补射', '破门', '入网', '得手'];

  for (const player of knownPlayers) {
    if (text.includes(player)) {
      const playerContext = text.split(player);
      for (let i = 1; i < playerContext.length; i++) {
        const context = playerContext[i].substring(0, 30);
        for (const action of goalActions) {
          if (context.includes(action)) {
            if (!result.scorers.find(s => s.name === player)) {
              result.scorers.push({ name: player, minute: null });
            }
            break;
          }
        }
        if (result.scorers.find(s => s.name === player)) {
          break;
        }
      }
    }
  }

  // 提取出勤人员
  for (const player of knownPlayers) {
    if (text.includes(player)) {
      result.attendance.push(player);
    }
  }

  result.attendance.sort();

  return result;
}

/**
 * 主函数
 */
async function main() {
  console.log('\n=== 创建新战报 ===\n');

  let parsedData = null;

  try {
    // 询问是否使用自动解析
    const useAutoParse = await question('是否粘贴战报文字自动提取信息？(y/n, 默认n): ');

    if (useAutoParse.toLowerCase() === 'y' || useAutoParse.toLowerCase() === 'yes') {
      console.log('\n请粘贴战报文字 (输入完成后按回车，然后输入 ===END=== 结束):\n');

      let reportText = '';
      while (true) {
        const line = await question('> ');
        if (line.trim() === '===END===') {
          break;
        }
        reportText += line + '\n';
      }

      console.log('\n正在解析战报...\n');
      parsedData = parseReportText(reportText);

      console.log('📊 解析结果:');
      console.log(`   日期: ${parsedData.date || '未提取'}`);
      console.log(`   对手: ${parsedData.opponent || '未提取'}`);
      console.log(`   地点: ${parsedData.location || '未提取'}`);
      console.log(`   MVP: ${parsedData.mvp || '未提取'}`);
      console.log(`   进球球员: ${parsedData.scorers.map(s => s.name).join('、') || '无'}`);
      console.log(`   出勤人员: ${parsedData.attendance.join('、') || '无'}\n`);
    }

    // 收集基本信息
    const datePrompt = parsedData && parsedData.date
      ? `请输入比赛日期 (默认: ${parsedData.date}): `
      : '请输入比赛日期 (YYYY-MM-DD, 如 2025-01-12): ';
    const date = (await question(datePrompt)) || (parsedData?.date || '');

    const opponentPrompt = parsedData && parsedData.opponent
      ? `请输入对手名称 (默认: ${parsedData.opponent}): `
      : '请输入对手名称: ';
    const opponent = (await question(opponentPrompt)) || (parsedData?.opponent || '');

    const score = await question('请输入比分 (如 3-2, 如未比赛可留空): ');

    const locationPrompt = parsedData && parsedData.location
      ? `请输入比赛地点 (默认: ${parsedData.location}): `
      : '请输入比赛地点 (如: 朝阳公园): ';
    const location = (await question(locationPrompt)) || (parsedData?.location || '');

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
    let attendanceInput = '';

    if (parsedData && parsedData.attendance.length > 0) {
      console.log(`(解析到的人员: ${parsedData.attendance.join('、')})`);
      console.log('按回车使用解析结果，或手动修改:');
      attendanceInput = await question('人员: ');
    } else {
      attendanceInput = await question('人员: ');
    }

    const attendance = (attendanceInput || (parsedData?.attendance?.join('、') || ''))
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

    // 创建照片文件夹
    const photosDir = path.join(__dirname, '..', 'photos', date);
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
      console.log(`📸 照片文件夹已创建: photos/${date}/`);
    } else {
      console.log(`📸 照片文件夹已存在: photos/${date}/`);
    }

    // 自动打开照片文件夹
    const { execSync } = require('child_process');
    try {
      const photosDirAbsolute = path.resolve(photosDir);
      if (process.platform === 'win32') {
        execSync(`explorer "${photosDirAbsolute}"`);
      } else if (process.platform === 'darwin') {
        execSync(`open "${photosDirAbsolute}"`);
      } else {
        execSync(`xdg-open "${photosDirAbsolute}"`);
      }
      console.log(`✅ 照片文件夹已打开\n`);
    } catch (error) {
      console.log(`💡 请手动打开文件夹: ${photosDir}\n`);
    }

    console.log('💡 下一步操作:');
    console.log('   1. 将照片放入 photos/' + date + '/ 文件夹');
    console.log('   2. 编辑战报内容');
    console.log('   3. 添加照片: npm run add-photos');
    console.log('   4. 生成HTML: npm run matches');
    console.log('   5. 查看统计: npm run stats\n');

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
