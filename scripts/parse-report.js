#!/usr/bin/env node

/**
 * 从战报文章自动生成结构化数据
 * 支持从已有的战报文本中提取比赛信息
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const matter = require('gray-matter');
const { Logger } = require('./utils/logger');
const { Validator } = require('./utils/validator');
const { Metrics } = require('./utils/metrics');

// 初始化日志器
const logDir = path.join(__dirname, '..', 'logs/battle-report');
const logger = new Logger({
  level: 'info',
  logFile: path.join(logDir, `parse-report-${new Date().toISOString().slice(0, 10)}.log`)
});

// 初始化指标采集器
const metrics = new Metrics();

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
 * 从战报文本中提取进球信息
 * 匹配格式: "XX分钟 XXX 破门/进球/破门得分"
 */
function extractGoals(text) {
  const goals = [];
  const patterns = [
    /(\d+)[分分钟]'*[\s,，]*(.+?)(?:破门|进球|得分|破门得分|推射破门|头球破门|捅射)/g,
    /(.+?)(?:在)?第?(\d+)[分分钟]'*(?:破门|进球|得分)/g,
    /(.+?)[\s,，]+(\d+)[分分钟]'*/g
  ];

  let match;
  for (const pattern of patterns) {
    while ((match = pattern.exec(text)) !== null) {
      const minute = match[1].match(/^\d+$/) ? match[1] : match[2];
      const playerName = match[1].match(/^\d+$/) ? match[2] : match[1];
      goals.push({
        name: playerName.trim().replace(/[，,]/g, ''),
        minute: parseInt(minute)
      });
    }
  }

  return goals;
}

/**
 * 从战报文本中提取球员名单
 * 匹配格式: "XXX、XXX、XXX等" 或 "XXX, XXX, XXX"
 */
function extractPlayers(text) {
  const players = new Set();

  // 匹配中文顿号分隔
  const pattern1 = /([^，\d\n]{2,4})(?:、|，|,)/g;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length >= 2 && name.length <= 4 && !['首发', '比赛', '对阵', '双方'].includes(name)) {
      players.add(name);
    }
  }

  return Array.from(players);
}

/**
 * 创建比赛记录
 */
async function createFromText() {
  metrics.startTimer('total');
  console.log('\n=== 从战报文章生成结构化数据 ===\n');
  logger.info('Starting parse-report workflow');

  // 获取比赛日期
  const date = await question('请输入比赛日期 (YYYY-MM-DD, 如 2025-01-18): ');

  // 获取对手名称
  const opponent = await question('请输入对手名称: ');

  // 获取比分
  const score = await question('请输入比分 (如 3-2, 可留空): ');

  // 获取地点
  const location = await question('请输入比赛地点: ');

  // 获取战报正文
  console.log('\n请粘贴战报文章内容 (输入完成后按回车,然后输入 ===END=== 结束):\n');
  let reportText = '';
  while (true) {
    const line = await question('> ');
    if (line.trim() === '===END===') {
      break;
    }
    reportText += line + '\n';
  }

  // 提取进球信息
  console.log('\n正在分析战报...');
  const goals = extractGoals(reportText);

  // 提取球员名单
  const allPlayers = extractPlayers(reportText);

  // 显示提取的信息供确认
  console.log('\n--- 提取的信息 ---');
  console.log(`日期: ${date}`);
  console.log(`对手: ${opponent}`);
  console.log(`比分: ${score || '未填写'}`);
  console.log(`地点: ${location}`);
  console.log(`\n检测到的进球 (${goals.length}个):`);
  goals.forEach((goal, index) => {
    console.log(`  ${index + 1}. ${goal.name} (${goal.minute}')`);
  });
  console.log(`\n检测到的球员 (${allPlayers.length}人):`);
  console.log(`  ${allPlayers.join('、')}`);

  // 是否手动添加出勤人员
  const addAttendance = await question('\n是否手动添加出勤人员? (y/N): ');
  let attendance = allPlayers;

  if (addAttendance.toLowerCase() === 'y') {
    const attendanceInput = await question('请输入出勤人员 (用逗号或顿号分隔): ');
    attendance = attendanceInput
      .split(/[,，、]/)
      .filter(p => p.trim())
      .map(p => p.trim());
  }

  // 确认
  const confirm = await question('\n确认创建? (Y/n): ');
  if (confirm.toLowerCase() === 'n') {
    console.log('❌ 已取消');
    rl.close();
    process.exit(0);
  }

  // 生成Markdown文件
  const filename = `${date}-${opponent}.md`;
  const matchesDir = path.join(__dirname, '..', 'matches');

  if (!fs.existsSync(matchesDir)) {
    fs.mkdirSync(matchesDir, { recursive: true });
  }

  const filePath = path.join(matchesDir, filename);

  // 构建frontmatter
  const frontmatter = {
    title: `${date} ${opponent}${score ? ' ' + score : ''}`,
    date,
    opponent,
    score: score || '',
    location,
    scorers: goals.map(g => ({
      name: g.name,
      minute: g.minute
    })),
    attendance: attendance
  };

  // 验证数据
  logger.info('Validating match data...');
  try {
    Validator.validateMatch(frontmatter);
    logger.info('Data validation passed', { filename });
  } catch (error) {
    logger.error('Data validation failed', { error: error.message });
    console.error('❌ 数据验证失败:', error.message);
    rl.close();
    process.exit(1);
  }

  // 组装完整内容
  const content = matter.stringify(reportText, frontmatter);

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf-8');
  logger.info('Match report created', { filename, path: filePath });
  console.log(`\n✅ 战报已创建: ${filename}`);
  console.log(`📂 路径: ${filePath}\n`);

  console.log('💡 下一步操作:');
  console.log('   1. 打开文件编辑格式');
  console.log('   2. 添加照片: npm run photos');
  console.log('   3. 查看统计: npm run stats');
  console.log('   4. 发布公众号: npm run sync\n');

  rl.close();
}

// 运行
createFromText().catch(error => {
  logger.error('Fatal error in parse-report', { error: error.message, stack: error.stack });
  console.error('❌ 发生错误:', error.message);
  rl.close();
  process.exit(1);
}).finally(() => {
  // 打印性能指标
  metrics.printSummary();
  logger.info('Parse-report completed');
});
