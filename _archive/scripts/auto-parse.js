#!/usr/bin/env node

/**
 * 自动处理战报文件
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 读取战报文本
const reportText = fs.readFileSync(path.join(__dirname, '..', 'temp_report.txt'), 'utf-8');

// 基本信息
const date = '2025-01-12';
const opponent = '内战';
const score = '多场对抗';
const location = '福沁球场';

// 提取进球信息
const goals = [];

// 分析战报文本中的比分变化
const scorePatterns = [
  /德国小弟跟上包抄一蹴而就1-0/,
  /喜力授精准直塞助队友单刀破门2-0/,
  /张航插入禁区推射得分/, // 红队得分
  /潘书记.*门前机警前插抢射2-2/,
  /喜力授上演两射一传/,
  /托蒂锦上添花/,
  /6-2遥遥领先/,
  /潘书记.*头球破门3-6/,
  /喜力授.*帽子戏法/,
  /蓝队3-0完胜/,
  /东哥、公正闪电进球2-0/,
  /超仕趁热打铁，单刀再入一球/,
  /张航横传助德国小弟破门1-3/,
  /张航右路跟上冷静破门1-0/,
  /东哥头球破门终于得手1-1/,
  /东哥背身做球，超仕推射2-1/,
  /超仕前场断球再得一分，3-1锁定胜局/,
  /小王助攻公正1-0/,
  /喜力授接大鼻涕助攻，扳平比分后伤退1-1/,
  /小卢助东哥2-1反超/,
  /辉哥.*偷鸡梅开二度3-2/,
  /小王推射将比分定格在3-3/,
  /超仕助东哥先声夺人/,
  /小王.*助攻德国小弟.*进球扳平/,
  /辉哥右路包抄2-2/,
  /小王中场拦截直接推射破门3-2/,
  /德国小弟打进漂亮进球.*4-2/,
  /东哥.*梅开二度，再助攻公正进球，5-4逆转比分/,
  /小王.*头球破门/,
  /小王.*一脚低射2-0/,
  /辉哥门前包抄，3-0/
];

// 提取的进球球员(基于战报分析)
const scorers = [
  { name: '德国小弟', minute: null },
  { name: '喜力授', minute: null },
  { name: '张航', minute: null },
  { name: '潘书记', minute: null },
  { name: '托蒂', minute: null },
  { name: '东哥', minute: null },
  { name: '公正', minute: null },
  { name: '超仕', minute: null },
  { name: '大鼻涕', minute: null },
  { name: '小王', minute: null },
  { name: '辉哥', minute: null },
  { name: '小卢', minute: null }
];

// 提取所有出勤人员
const attendance = [
  '辉哥', '托蒂', '王书记', '喜力授', '叶伯海', '德国小弟',
  '张航', '小王', '东哥', '叶老师', '高主席', '潘书记',
  '超仕', '小卢', '公正', '陈韬', '大鼻涕'
];

// 生成Markdown文件
const filename = `${date}-${opponent}.md`;
const matchesDir = path.join(__dirname, '..', 'matches');

if (!fs.existsSync(matchesDir)) {
  fs.mkdirSync(matchesDir, { recursive: true });
}

const filePath = path.join(matchesDir, filename);

// 构建frontmatter
const frontmatter = {
  title: `冬日激战!河伯FC内战精彩纷呈`,
  date,
  opponent,
  score,
  location,
  scorers,
  attendance
};

// 组装完整内容
const content = matter.stringify(reportText, frontmatter);

// 写入文件
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n✅ 战报已自动生成: ${filename}`);
console.log(`📂 路径: ${filePath}\n`);
console.log('📊 提取的信息:');
console.log(`   - 日期: ${date}`);
console.log(`   - 对手: ${opponent}`);
console.log(`   - 地点: ${location}`);
console.log(`   - 进球球员: ${scorers.map(s => s.name).join('、')}`);
console.log(`   - 出勤人数: ${attendance.length}人\n`);

// 删除临时文件
fs.unlinkSync(path.join(__dirname, '..', 'temp_report.txt'));
console.log('🗑️  临时文件已清理\n');
