#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs/publish-history');

function parseCli(argv) {
  const opts = {
    limit: 10,
    json: false,
    outcome: '',
    match: ''
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if ((arg === '--limit' || arg === '-n') && next && !next.startsWith('-')) {
      opts.limit = Math.max(1, parseInt(next, 10) || 10);
      i += 1;
      continue;
    }

    if (arg === '--json') {
      opts.json = true;
      continue;
    }

    if (arg === '--outcome' && next && !next.startsWith('-')) {
      opts.outcome = next.trim();
      i += 1;
      continue;
    }

    if (arg === '--match' && next && !next.startsWith('-')) {
      opts.match = next.trim();
      i += 1;
      continue;
    }
  }

  return opts;
}

function readLogs() {
  if (!fs.existsSync(LOG_DIR)) return [];

  return fs.readdirSync(LOG_DIR)
    .filter(name => name.endsWith('.json'))
    .map(name => {
      const filePath = path.join(LOG_DIR, name);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...parsed, __file: filePath, __name: name };
      } catch (error) {
        return {
          outcome: 'invalid-json',
          eventAt: '',
          matchFile: '',
          title: '',
          opponent: '',
          stopReason: error.message,
          __file: filePath,
          __name: name
        };
      }
    })
    .sort((a, b) => {
      const ta = new Date(a.publishedAt || a.stoppedAt || a.continuedAt || a.eventAt || 0).getTime();
      const tb = new Date(b.publishedAt || b.stoppedAt || b.continuedAt || b.eventAt || 0).getTime();
      return tb - ta;
    });
}

function filterLogs(logs, opts) {
  return logs.filter(item => {
    if (opts.outcome && item.outcome !== opts.outcome) return false;
    if (opts.match) {
      const hay = [item.matchFile, item.title, item.opponent, item.__name].join(' ').toLowerCase();
      if (!hay.includes(opts.match.toLowerCase())) return false;
    }
    return true;
  }).slice(0, opts.limit);
}

function summarizeStopReason(item) {
  if (item.stopReason) return item.stopReason;
  if (Array.isArray(item.preflightChecks) && item.preflightChecks.length > 0) {
    return item.preflightChecks.slice(0, 2).map(x => x.message).join(' | ');
  }
  return '';
}

function renderTable(logs) {
  if (logs.length === 0) {
    console.log('暂无发布记录');
    return;
  }

  console.log('最近发布记录');
  console.log('');

  for (const item of logs) {
    const time = item.publishedAt || item.stoppedAt || item.continuedAt || item.eventAt || '-';
    console.log(`- 时间: ${time}`);
    console.log(`  结果: ${item.outcome || '-'}`);
    console.log(`  文件: ${item.matchFile || '-'}`);
    console.log(`  标题: ${item.title || '-'}`);
    if (item.draftId) console.log(`  Draft ID: ${item.draftId}`);
    if (item.account) console.log(`  账号: ${item.account}`);
    if (item.coverStrategy) console.log(`  封面: ${item.coverStrategy}`);
    if (item.digestSource) console.log(`  摘要: ${item.digestSource}`);
    const reason = summarizeStopReason(item);
    if (reason) console.log(`  备注: ${reason}`);
    console.log(`  日志: ${path.relative(path.join(__dirname, '..'), item.__file)}`);
    console.log('');
  }
}

function main() {
  const opts = parseCli(process.argv.slice(2));
  const logs = filterLogs(readLogs(), opts);

  if (opts.json) {
    console.log(JSON.stringify(logs, null, 2));
    return;
  }

  renderTable(logs);
}

main();
