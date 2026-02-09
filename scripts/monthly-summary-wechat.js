const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generateWechatMonthlySummary(year, month) {
  const matchesDir = path.join(__dirname, '../matches');
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  // 读取当月所有比赛
  const files = fs.readdirSync(matchesDir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.log(`❌ 没有找到 ${year}年${month}月 的比赛记录`);
    return;
  }

  // 统计数据
  const attendance = {};
  const goals = {};
  const mvps = {};

  files.forEach(file => {
    const content = fs.readFileSync(path.join(matchesDir, file), 'utf8');
    const { data } = matter(content);

    if (data.attendance && Array.isArray(data.attendance)) {
      data.attendance.forEach(player => {
        attendance[player] = (attendance[player] || 0) + 1;
      });
    }

    if (data.scorers && Array.isArray(data.scorers)) {
      data.scorers.forEach(scorer => {
        const count = scorer.goals || 0;
        goals[scorer.name] = (goals[scorer.name] || 0) + count;
      });
    }

    if (data.mvp) {
      mvps[data.mvp] = (mvps[data.mvp] || 0) + 1;
    }
  });

  const sortedAttendance = Object.entries(attendance).sort((a, b) => b[1] - a[1]);
  const sortedGoals = Object.entries(goals).sort((a, b) => b[1] - a[1]);
  const sortedMvps = Object.entries(mvps).sort((a, b) => b[1] - a[1]);

  // 生成微信公众号兼容HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 10px; text-align: left; }
  </style>
</head>
<body>
  <section style="max-width: 650px; margin: 0 auto; background: #fff;">

    <!-- 头部 -->
    <section style="background: #1e3c72; padding: 30px 20px 25px 20px; text-align: center; color: #fff;">
      <section style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.3); border-radius: 5px;">
        <span style="font-size: 11px; color: rgba(255,255,255,0.7);">📷 上传Logo<br>后删除此框</span>
      </section>
      <p style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">${year}年${month}份赛事总结</p>
      <p style="font-size: 13px; margin: 0 0 15px 0; opacity: 0.9;">知己足球俱乐部 · 战绩数据统计分析</p>
      <p style="font-size: 11px; margin: 0; opacity: 0.7; font-style: italic;">根据战报自动统计，如有错漏敬请谅解</p>
    </section>

    <!-- 统计数据栏 -->
    <table style="background: #1a1a1a; color: #fff; width: 100%;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 20px; text-align: center; border-right: 1px solid #333; width: 50%;">
          <p style="font-size: 32px; font-weight: bold; margin: 0; color: #4CAF50;">${files.length}</p>
          <p style="font-size: 11px; margin: 5px 0 0 0; color: #999; text-transform: uppercase;">比赛场次</p>
        </td>
        <td style="padding: 20px; text-align: center; width: 50%;">
          <p style="font-size: 24px; font-weight: bold; margin: 0; color: #4CAF50;">${sortedGoals[0][0]}</p>
          <p style="font-size: 32px; font-weight: bold; margin: 0; color: #4CAF50;">${sortedGoals[0][1]}⚽</p>
          <p style="font-size: 11px; margin: 5px 0 0 0; color: #999; text-transform: uppercase;">最佳射手</p>
        </td>
      </tr>
    </table>

    <section style="padding: 30px 20px;">

      <!-- MVP -->
      <section style="margin-bottom: 30px;">
        <p style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e8e8e8;">🏆 月度最有价值球员</p>
        ${sortedMvps.length > 0 ? `
        <section style="background: #FF6B6B; padding: 25px; text-align: center; border-radius: 5px; color: #fff;">
          <p style="font-size: 26px; font-weight: bold; margin: 0;">${sortedMvps[0][0]}</p>
          <p style="font-size: 14px; margin: 8px 0 0 0;">荣获 ${sortedMvps[0][1]} 次 MVP · ${sortedMvps[0][1] === 1 ? '单场最佳表现' : '多次获得全场最佳球员'}</p>
        </section>
        ` : '<p style="color: #999;">暂无MVP记录</p>'}
      </section>

      <!-- 射手榜 -->
      <section style="margin-bottom: 30px;">
        <p style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e8e8e8;">⚽ 射手榜排名</p>
        <table style="width: 100%; border: 1px solid #e8e8e8;" cellpadding="0" cellspacing="0">
          <tr style="background: #2c3e50; color: #fff;">
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left;">排名</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left;">球员</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left; width: 70px;">进球数</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left; width: 80px;">场均进球</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left; width: 60px;">出场</th>
          </tr>
          ${sortedGoals.slice(0, 15).map((item, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString().padStart(2, '0');
    const playerAttendance = attendance[item[0]] || 1;
    const avg = (item[1] / playerAttendance).toFixed(2);
    const bg = rank <= 3 ? 'background: #fff3cd;' : rank % 2 === 0 ? 'background: #f8f9fa;' : 'background: #fff;';
    return `<tr style="${bg}">
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${medal}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${item[0]}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8; font-weight: bold;">${item[1]}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${avg}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${playerAttendance}</td>
            </tr>`;
  }).join('')}
        </table>
      </section>

      <!-- 出勤榜 -->
      <section style="margin-bottom: 30px;">
        <p style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e8e8e8;">🏃 出勤榜排名</p>
        <table style="width: 100%; border: 1px solid #e8e8e8;" cellpadding="0" cellspacing="0">
          <tr style="background: #2c3e50; color: #fff;">
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left;">排名</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left;">球员</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left; width: 70px;">出勤次数</th>
            <th style="padding: 10px 12px; font-size: 13px; font-weight: 600; text-align: left; width: 80px;">出勤率</th>
          </tr>
          ${sortedAttendance.slice(0, 15).map((item, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString().padStart(2, '0');
    const rate = ((item[1] / files.length) * 100).toFixed(1);
    const bg = rank <= 3 ? 'background: #fff3cd;' : rank % 2 === 0 ? 'background: #f8f9fa;' : 'background: #fff;';
    return `<tr style="${bg}">
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${medal}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${item[0]}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8; font-weight: bold;">${item[1]}</td>
              <td style="padding: 11px 12px; font-size: 14px; border-bottom: 1px solid #e8e8e8;">${rate}%</td>
            </tr>`;
  }).join('')}
        </table>
      </section>

    </section>

    <!-- 底部 -->
    <section style="background: #1a1a1a; padding: 25px 20px; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0 0 5px 0;"><strong>知己足球俱乐部</strong> · 每周末与你相约</p>
      <p style="margin: 0; font-size: 10px; opacity: 0.6;">数据统计日期: ${new Date().toLocaleDateString('zh-CN')}</p>
    </section>

  </section>
</body>
</html>`;

  // 保存文件
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `${prefix}-monthly-summary-wechat.html`);
  fs.writeFileSync(outputFile, html, 'utf8');

  console.log(`\n✅ 微信公众号版月度总结已生成: ${outputFile}`);
  console.log(`\n📊 ${year}年${month}月 统计数据`);
  console.log(`═══════════════════════════════════════`);
  console.log(`📅 比赛场次: ${files.length}`);
  console.log(`🏆 月度MVP: ${sortedMvps[0] ? sortedMvps[0][0] + ' (' + sortedMvps[0][1] + '次)' : '无'}`);
  console.log(`⚽ 最佳射手: ${sortedGoals[0] ? sortedGoals[0][0] + ' (' + sortedGoals[0][1] + '球)' : '无'}`);

  return outputFile;
}

// 运行
const year = 2026;
const month = 1;
const outputFile = generateWechatMonthlySummary(year, month);

// 打开预览
// 打开预览
if (!process.env.NO_OPEN) {
  const { exec } = require('child_process');
  exec(`open "${outputFile}"`);
}
