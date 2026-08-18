#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
用法:
  node scripts/publish-battle-report.js <比赛文件> [选项]

说明:
  统一入口：透传选项到底层 upload-to-wechat.js。
  预检警告默认不阻塞；如需“警告也中止”，显式加 --strict-preflight。

常用选项:
  --account, -a <name>   指定公众号账号
  --style <name>         指定排版风格
  --no-score             隐藏比分
  --show-score           显示比分
  --no-ai-cover          不生成 AI 封面（默认直出生图，失败自动回退 HTML）
  --strict-preflight     预检出现警告也中止（默认关闭）
  --no-strict-preflight  显式声明非 strict（与不传等价，仅为可读性）
  --force                允许创建同名重复草稿（默认会检查并阻塞）
  --help, -h             显示帮助

示例:
  node scripts/publish-battle-report.js 2026-03-21-知己内战.md
  node scripts/publish-battle-report.js 2026-03-21-知己内战.md --account zhiji
  node scripts/publish-battle-report.js 2026-03-21-知己内战.md --style simple --no-score
  node scripts/publish-battle-report.js 2026-03-21-知己内战.md --strict-preflight --force
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const passthrough = [];
let matchFile = null;

for (const arg of args) {
  if (!matchFile && !arg.startsWith('-')) {
    matchFile = arg;
  } else {
    passthrough.push(arg);
  }
}

const uploadScript = path.join(__dirname, 'upload-to-wechat.js');
const finalArgs = [uploadScript];

if (matchFile) finalArgs.push(matchFile);

if (!matchFile) {
  console.error('❌ 缺少比赛文件。使用 --help 查看用法。');
  process.exit(1);
}

// 不再硬编码追加 --strict-preflight：底层默认非 strict，需要时显式传。
// --no-strict-preflight 仅作为可读性参数透传，底层忽略。

finalArgs.push(...passthrough);

console.log('🚀 发布战报到微信公众号草稿箱');
console.log(`   脚本: ${path.basename(uploadScript)}`);
console.log(`   预检: ${passthrough.includes('--strict-preflight') ? 'strict' : '默认（警告不阻塞）'}`);
if (matchFile) console.log(`   文件: ${matchFile}`);
if (passthrough.length) console.log(`   额外参数: ${passthrough.join(' ')}`);
console.log('');

const result = spawnSync(process.execPath, finalArgs, {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

process.exit(result.status || 0);
