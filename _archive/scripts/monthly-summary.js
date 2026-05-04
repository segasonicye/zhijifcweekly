const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generateMonthlySummary(year, month) {
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
  let totalGoals = 0;

  files.forEach(file => {
    const content = fs.readFileSync(path.join(matchesDir, file), 'utf8');
    const { data } = matter(content);

    // 统计出勤
    if (data.attendance && Array.isArray(data.attendance)) {
      data.attendance.forEach(player => {
        attendance[player] = (attendance[player] || 0) + 1;
      });
    }

    // 统计进球
    if (data.scorers && Array.isArray(data.scorers)) {
      data.scorers.forEach(scorer => {
        const count = scorer.goals || 0;
        goals[scorer.name] = (goals[scorer.name] || 0) + count;
        totalGoals += count;
      });
    }

    // 统计MVP
    if (data.mvp) {
      mvps[data.mvp] = (mvps[data.mvp] || 0) + 1;
    }
  });

  // 排序
  const sortedAttendance = Object.entries(attendance)
    .sort((a, b) => b[1] - a[1]);

  const sortedGoals = Object.entries(goals)
    .sort((a, b) => b[1] - a[1]);

  const sortedMvps = Object.entries(mvps)
    .sort((a, b) => b[1] - a[1]);

  // 生成HTML - 专业报表风
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f8f9fa;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 13px;
      opacity: 0.8;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .disclaimer {
      font-size: 12px;
      opacity: 0.7;
      font-style: italic;
    }
    .stats-bar {
      display: flex;
      background: #1a1a1a;
      color: white;
    }
    .stat-item {
      flex: 1;
      padding: 20px;
      text-align: center;
      border-right: 1px solid #333;
    }
    .stat-item:last-child {
      border-right: none;
    }
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #4CAF50;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e8e8e8;
    }
    .section-icon {
      font-size: 22px;
      margin-right: 10px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .mvp-card {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      color: white;
      padding: 30px;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }
    .mvp-name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .mvp-detail {
      font-size: 15px;
      opacity: 0.95;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 14px;
    }
    th {
      background: #2c3e50;
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 11px 15px;
      border-bottom: 1px solid #e8e8e8;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    tr:hover {
      background: #e9ecef;
    }
    .rank-1 { color: #FFD700; font-weight: 700; }
    .rank-2 { color: #C0C0C0; font-weight: 600; }
    .rank-3 { color: #CD7F32; font-weight: 600; }
    .rank-other { color: #666; font-weight: 500; }
    .medal { margin-right: 6px; }
    .number-bold {
      font-weight: 700;
      color: #1a1a1a;
    }
    .logo-placeholder {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.1);
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      border: 2px dashed rgba(255,255,255,0.3);
    }
    .footer {
      background: #1a1a1a;
      color: #999;
      text-align: center;
      padding: 25px;
      font-size: 12px;
    }
    .highlight-row {
      background: #fff3cd !important;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-placeholder">
        📷 上传 Logo 后删除此框
      </div>
      <h1 class="title">${year}年${month}份赛事总结</h1>
      <p class="subtitle">知己足球俱乐部 · 战绩数据统计分析</p>
      <p class="disclaimer">根据战报自动统计，如有错漏敬请谅解</p>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-number">${files.length}</div>
        <div class="stat-label">比赛场次</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="font-size: 24px; line-height: 1.4;">${sortedGoals[0][0]}</div>
        <div class="stat-number">${sortedGoals[0][1]}⚽</div>
        <div class="stat-label">最佳射手</div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-header">
          <span class="section-icon">🏆</span>
          <h2 class="section-title">月度最有价值球员</h2>
        </div>
        ${sortedMvps.length > 0 ? `
        <div class="mvp-card">
          <div class="mvp-name">${sortedMvps[0][0]}</div>
          <div class="mvp-detail">荣获 ${sortedMvps[0][1]} 次 MVP · ${sortedMvps[0][1] === 1 ? '单场最佳表现' : '多次获得全场最佳球员'}</div>
        </div>
        ` : '<p style="color: #999;">暂无MVP记录</p>'}
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-icon">⚽</span>
          <h2 class="section-title">射手榜排名</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th width="70">排名</th>
              <th>球员</th>
              <th width="80">进球数</th>
              <th width="90">场均进球</th>
              <th width="70">出场</th>
            </tr>
          </thead>
          <tbody>
            ${sortedGoals.slice(0, 15).map((item, index) => {
              const rank = index + 1;
              const medalClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString().padStart(2, '0');
              const playerAttendance = attendance[item[0]] || 1;
              const avg = (item[1] / playerAttendance).toFixed(2);
              const highlight = rank <= 3 ? ' highlight-row' : '';
              return `<tr class="${highlight}">
                <td class="${medalClass}"><span class="medal">${medal}</span></td>
                <td>${item[0]}</td>
                <td><span class="number-bold">${item[1]}</span></td>
                <td>${avg}</td>
                <td>${playerAttendance}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-icon">🏃</span>
          <h2 class="section-title">出勤榜排名</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th width="70">排名</th>
              <th>球员</th>
              <th width="80">出勤次数</th>
              <th width="90">出勤率</th>
            </tr>
          </thead>
          <tbody>
            ${sortedAttendance.slice(0, 15).map((item, index) => {
              const rank = index + 1;
              const medalClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString().padStart(2, '0');
              const rate = ((item[1] / files.length) * 100).toFixed(1);
              const highlight = rank <= 3 ? ' highlight-row' : '';
              return `<tr class="${highlight}">
                <td class="${medalClass}"><span class="medal">${medal}</span></td>
                <td>${item[0]}</td>
                <td><span class="number-bold">${item[1]}</span></td>
                <td>${rate}%</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <p><strong>知己足球俱乐部</strong> · 每周末与你相约</p>
      <p style="font-size: 10px; margin-top: 6px; opacity: 0.6;">数据统计日期: ${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
  </div>
</body>
</html>`;

  // 保存文件
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `${prefix}-monthly-summary.html`);
  fs.writeFileSync(outputFile, html, 'utf8');

  console.log(`\n✅ 月度总结已生成: ${outputFile}`);

  // 打印统计
  console.log(`\n📊 ${year}年${month}月 统计数据`);
  console.log(`═══════════════════════════════════════`);
  console.log(`📅 比赛场次: ${files.length}`);
  console.log(`⚽ 总进球数: ${totalGoals}`);
  console.log(`\n🏆 月度MVP: ${sortedMvps[0] ? sortedMvps[0][0] + ' (' + sortedMvps[0][1] + '次)' : '无'}`);
  console.log(`\n⚽ 最佳射手: ${sortedGoals[0] ? sortedGoals[0][0] + ' (' + sortedGoals[0][1] + '球)' : '无'}`);
  console.log(`\n🏃 全勤王: ${sortedAttendance.filter(i => i[1] === files.length).map(i => i[0]).join(', ') || '无'}`);

  return outputFile;
}

// 运行
const year = 2026;
const month = 1;
const outputFile = generateMonthlySummary(year, month);

// 打开预览
const { exec } = require('child_process');
exec(`open "${outputFile}"`);
