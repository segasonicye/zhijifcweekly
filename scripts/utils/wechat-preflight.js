const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { resolveCoverPlan } = require('./cover-strategy');
const { buildDigest } = require('./digest-strategy');

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function extractMarkdownImages(markdown) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const images = [];
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({ alt: match[1], src: match[2] });
  }
  return images;
}

function normalizePhotoEntry(photo) {
  if (!photo) return null;
  if (typeof photo === 'string') return { path: photo, caption: '' };
  if (typeof photo === 'object' && photo.path) return { path: photo.path, caption: photo.caption || '' };
  return null;
}

function classifySeverity(checks) {
  if (checks.some(c => c.level === 'error')) return 'error';
  if (checks.some(c => c.level === 'warn')) return 'warn';
  return 'ok';
}



function runPreflight({ matchFilePath, repoRoot, config, options = {} }) {
  const checks = [];
  const root = repoRoot || path.resolve(__dirname, '../..');

  if (!matchFilePath || !fileExists(matchFilePath)) {
    return {
      status: 'error',
      checks: [{ level: 'error', code: 'MATCH_FILE_MISSING', message: `比赛文件不存在: ${matchFilePath}` }],
      summary: null
    };
  }

  const raw = fs.readFileSync(matchFilePath, 'utf-8');
  const { data, content: body } = matter(raw);
  const markdownImages = extractMarkdownImages(body);
  const photos = (data.photos || []).map(normalizePhotoEntry).filter(Boolean);

  const requiredFields = ['title', 'date', 'opponent'];
  for (const field of requiredFields) {
    if (!data[field] || !String(data[field]).trim()) {
      checks.push({ level: 'error', code: `MISSING_${field.toUpperCase()}`, message: `缺少 frontmatter 字段: ${field}` });
    }
  }

  if (!body || !String(body).trim()) {
    checks.push({ level: 'error', code: 'EMPTY_BODY', message: '正文为空' });
  }

  if (!data.summary || !String(data.summary).trim()) {
    checks.push({ level: 'warn', code: 'MISSING_SUMMARY', message: '未提供 summary，将自动生成 digest' });
  }

  if (!data.location || !String(data.location).trim()) {
    checks.push({ level: 'warn', code: 'MISSING_LOCATION', message: '未填写 location' });
  }

  if (!data.mvp || !String(data.mvp).trim()) {
    checks.push({ level: 'info', code: 'MISSING_MVP', message: '未填写 MVP，将跳过 MVP 模块' });
  }

  if ((config && config.showScore === false) && data.score) {
    checks.push({ level: 'info', code: 'SCORE_HIDDEN', message: '当前配置将隐藏比分展示' });
  }

  const title = String(data.title || '').trim();
  if (title.length > 64) {
    checks.push({ level: 'warn', code: 'TITLE_LONG', message: `标题偏长（${title.length} 字）` });
  }
  if (title && title.length < 8) {
    checks.push({ level: 'warn', code: 'TITLE_SHORT', message: `标题偏短（${title.length} 字）` });
  }

  const bodyParagraphs = String(body || '').split(/\n\n+/).filter(p => p.trim());
  if (bodyParagraphs.length < 3) {
    checks.push({ level: 'warn', code: 'BODY_TOO_SHORT', message: `正文段落偏少（${bodyParagraphs.length} 段）` });
  }

  const referencedNames = new Set();
  for (const img of markdownImages) {
    const resolved = path.resolve(root, img.src);
    referencedNames.add(path.basename(img.src));
    if (!fileExists(resolved)) {
      checks.push({ level: 'error', code: 'IMAGE_NOT_FOUND', message: `正文图片不存在: ${img.src}` });
    }
  }

  for (const photo of photos) {
    const resolved = path.resolve(root, photo.path);
    if (!fileExists(resolved)) {
      checks.push({ level: 'error', code: 'PHOTO_NOT_FOUND', message: `photos 列表中的图片不存在: ${photo.path}` });
    }
  }

  const unusedPhotos = photos.filter(photo => !referencedNames.has(path.basename(photo.path)) && !photo.path.toLowerCase().includes('logo'));
  if (unusedPhotos.length >= 6) {
    checks.push({ level: 'info', code: 'MANY_UNUSED_PHOTOS', message: `有 ${unusedPhotos.length} 张照片将依赖自动补图逻辑` });
  }

  const coverPlan = resolveCoverPlan({ data, config, options, repoRoot: root });
  const coverStrategy = coverPlan.strategy;
  if ((config && config.defaultCover) === 'logo' && coverStrategy !== 'logo' && coverStrategy !== 'logo-fallback' && !options.aiCover && !data.cover) {
    checks.push({ level: 'warn', code: 'COVER_STRATEGY_DRIFT', message: `配置默认封面为 logo，但当前策略可能使用 ${coverStrategy}` });
  }

  if ((coverStrategy === 'logo' || coverStrategy === 'logo-fallback') && !coverPlan.exists) {
    checks.push({ level: 'error', code: 'LOGO_MISSING', message: '默认 Logo 缺失: logo-200.png' });
  }

  if ((coverStrategy === 'frontmatter-cover' || coverStrategy === 'first-photo' || coverStrategy === 'fallback-photo') && coverPlan.exists === false) {
    checks.push({ level: 'error', code: 'COVER_NOT_FOUND', message: `封面文件不存在: ${coverPlan.sourcePath}` });
  }

  const digestPlan = buildDigest({ data, body, maxLength: 110 });
  const digest = digestPlan.digest;

  return {
    status: classifySeverity(checks),
    checks,
    summary: {
      title,
      date: data.date || '',
      opponent: data.opponent || '',
      digest,
      digestSource: digestPlan.source,
      digestReason: digestPlan.reason,
      coverStrategy,
      coverReason: coverPlan.reason,
      coverSourcePath: coverPlan.sourcePath,
      totalPhotos: photos.length,
      referencedImages: markdownImages.length,
      autoInsertCandidates: unusedPhotos.length,
      bodyParagraphs: bodyParagraphs.length,
      matchFilePath
    }
  };
}

function formatPreflightReport(report) {
  if (!report) return 'Preflight: no report';
  const lines = [];
  const icon = report.status === 'error' ? '❌' : report.status === 'warn' ? '⚠️' : '✅';
  lines.push(`${icon} Preflight ${report.status.toUpperCase()}`);

  if (report.summary) {
    lines.push(`- 标题: ${report.summary.title || '(空)'}`);
    lines.push(`- 比赛: ${report.summary.date} vs ${report.summary.opponent}`);
    lines.push(`- 封面策略: ${report.summary.coverStrategy}`);
    if (report.summary.coverSourcePath) lines.push(`- 封面来源: ${report.summary.coverSourcePath}`);
    if (report.summary.coverReason) lines.push(`- 封面说明: ${report.summary.coverReason}`);
    lines.push(`- 图片: 总 ${report.summary.totalPhotos} / 正文显式 ${report.summary.referencedImages} / 待自动补图 ${report.summary.autoInsertCandidates}`);
    lines.push(`- 正文段落: ${report.summary.bodyParagraphs}`);
    lines.push(`- Digest: ${report.summary.digest}`);
    if (report.summary.digestSource) lines.push(`- 摘要来源: ${report.summary.digestSource}`);
    if (report.summary.digestReason) lines.push(`- 摘要说明: ${report.summary.digestReason}`);
  }

  if (report.checks && report.checks.length) {
    lines.push('- 检查结果:');
    for (const check of report.checks) {
      const prefix = check.level === 'error' ? '  ❌' : check.level === 'warn' ? '  ⚠️' : '  ℹ️';
      lines.push(`${prefix} ${check.message}`);
    }
  } else {
    lines.push('- 检查结果: 无异常');
  }

  return lines.join('\n');
}

module.exports = {
  runPreflight,
  formatPreflightReport,
  extractMarkdownImages,
  safeReadJson
};
