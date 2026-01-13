#!/usr/bin/env node

/**
 * 球队数据统计脚本
 * 扫描所有比赛记录,生成球员统计数据
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * 解析所有比赛文件
 */
function parseMatches() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  const matches = [];

  if (!fs.existsSync(matchesDir)) {
    console.log('⚠️  matches 目录不存在');
    return matches;
  }

  const files = fs.readdirSync(matchesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse(); // 最新的比赛在前

  for (const file of files) {
    const filePath = path.join(matchesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    matches.push({
      file,
      ...data,
      body
    });
  }

  return matches;
}

/**
 * 统计球员数据
 */
function calculateStats(matches) {
  const stats = {
    // 出勤统计
    attendance: {},
    // MVP统计
    mvp: {},
    // 比赛统计
    totalMatches: matches.length,
    matches: []
  };

  for (const match of matches) {
    // 记录比赛信息
    stats.matches.push({
      date: match.date,
      opponent: match.opponent,
      score: match.score,
      location: match.location,
      mvp: match.mvp || null
    });

    // 统计出勤
    if (match.attendance && Array.isArray(match.attendance)) {
      for (const player of match.attendance) {
        if (!stats.attendance[player]) {
          stats.attendance[player] = 0;
        }
        stats.attendance[player]++;
      }
    }

    // 统计MVP
    if (match.mvp) {
      if (!stats.mvp[match.mvp]) {
        stats.mvp[match.mvp] = 0;
      }
      stats.mvp[match.mvp]++;
    }
  }

  return stats;
}

/**
 * 生成排行榜
 */
function generateRankings(stats) {
  // 出勤排行榜
  const attendanceRanking = Object.entries(stats.attendance)
    .map(([player, count]) => ({ player, count }))
    .sort((a, b) => b.count - a.count);

  // MVP排行榜
  const mvpRanking = Object.entries(stats.mvp)
    .map(([player, count]) => ({ player, count }))
    .sort((a, b) => b.count - a.count);

  return {
    attendance: attendanceRanking,
    mvp: mvpRanking
  };
}

/**
 * 格式化输出
 */
function formatOutput(stats, rankings) {
  let output = '\n';
  output += '='.repeat(60) + '\n';
  output += '        知己足球俱乐部 数据统计\n';
  output += '='.repeat(60) + '\n\n';

  output += `📊 总比赛场次: ${stats.totalMatches}\n\n`;

  // MVP排行榜
  if (rankings.mvp.length > 0) {
    output += '⭐ MVP排行榜\n';
    output += '-'.repeat(60) + '\n';
    output += '排名  球员          MVP次数\n';
    output += '-'.repeat(60) + '\n';
    rankings.mvp.forEach((item, index) => {
      const rate = ((item.count / stats.totalMatches) * 100).toFixed(1);
      const rank = index + 1;
      const rankStr = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`.padStart(4);
      output += `${rankStr}  ${item.player.padEnd(12)}  ${item.count}次      (${rate}%)\n`;
    });
    output += '\n';
  }

  // 出勤排行榜
  output += '🏃 出勤排行榜\n';
  output += '-'.repeat(60) + '\n';
  output += '排名  球员          出勤次数  出勤率\n';
  output += '-'.repeat(60) + '\n';
  rankings.attendance.forEach((item, index) => {
    const rate = ((item.count / stats.totalMatches) * 100).toFixed(1);
    const rank = index + 1;
    const rankStr = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`.padStart(4);
    output += `${rankStr}  ${item.player.padEnd(12)}  ${item.count}次      ${rate}%\n`;
  });
  output += '\n';

  // 最近比赛
  output += '📅 最近比赛记录\n';
  output += '-'.repeat(60) + '\n';
  stats.matches.slice(0, 5).forEach((match, index) => {
    const mvpStr = match.mvp ? ` (MVP: ${match.mvp})` : '';
    output += `${index + 1}. ${match.date} ${match.opponent} ${match.score}${mvpStr}\n`;
  });

  output += '='.repeat(60) + '\n';

  return output;
}

/**
 * 保存统计数据到文件
 */
function saveStats(stats, rankings) {
  const statsDir = path.join(__dirname, '..', 'stats');
  if (!fs.existsSync(statsDir)) {
    fs.mkdirSync(statsDir, { recursive: true });
  }

  // 保存JSON格式
  const jsonPath = path.join(statsDir, 'stats.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ stats, rankings }, null, 2));
  console.log(`✅ JSON数据已保存: ${jsonPath}`);

  // 保存Markdown格式
  const markdown = formatOutput(stats, rankings);
  const mdPath = path.join(statsDir, 'stats.md');
  fs.writeFileSync(mdPath, markdown);
  console.log(`✅ Markdown报告已保存: ${mdPath}`);
}

/**
 * 主函数
 */
function main() {
  console.log('\n=== 球队数据统计工具 ===\n');

  try {
    // 解析所有比赛
    console.log('📖 正在扫描比赛记录...');
    const matches = parseMatches();
    console.log(`✅ 找到 ${matches.length} 场比赛记录\n`);

    if (matches.length === 0) {
      console.log('⚠️  没有找到比赛记录');
      process.exit(0);
    }

    // 计算统计数据
    console.log('🔢 正在计算统计数据...');
    const stats = calculateStats(matches);
    const rankings = generateRankings(stats);

    // 显示统计结果
    console.log(formatOutput(stats, rankings));

    // 保存到文件
    console.log('\n💾 正在保存统计数据...');
    saveStats(stats, rankings);

    console.log('\n✨ 统计完成!\n');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { parseMatches, calculateStats, generateRankings };
