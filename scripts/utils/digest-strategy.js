function stripMarkdown(markdown = '') {
  return String(markdown)
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[`>*\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(text = '', maxLength = 110) {
  const normalized = stripMarkdown(text);
  if (!normalized) return '';
  const split = normalized.split(/[。！？!?.]/).map(s => s.trim()).filter(Boolean);
  const candidate = split[0] || normalized;
  return candidate.slice(0, maxLength);
}

function buildDigest({ data = {}, body = '', maxLength = 110 }) {
  if (data.summary && String(data.summary).trim()) {
    return {
      digest: String(data.summary).trim().slice(0, maxLength),
      source: 'summary',
      reason: '使用 frontmatter.summary'
    };
  }

  const parts = [];
  if (data.date) parts.push(data.date);
  if (data.opponent) parts.push(`对阵${data.opponent}`);
  if (data.location) parts.push(`地点${data.location}`);
  if (data.mvp) parts.push(`MVP ${data.mvp}`);

  const intro = firstSentence(body, 70);
  const base = parts.join('，');
  let digest = [base, intro].filter(Boolean).join('。');
  if (!digest) digest = `${data.date || ''} ${data.opponent || ''} 比赛战报`.trim();

  return {
    digest: digest.slice(0, maxLength),
    source: 'generated',
    reason: '根据 frontmatter 与正文首句自动生成'
  };
}

module.exports = {
  buildDigest,
  stripMarkdown,
  firstSentence
};
