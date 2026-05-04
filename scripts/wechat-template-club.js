/**
 * 微信公众号文章模板 - 专业球队官号版 (Club/Pro)
 * 蓝 + 橙品牌活力版：专业球队公众号、Logo 在标题上方、色彩更有张力
 */

function getArticleTemplate(data, contentHTML, photos = [], logoPath = null, options = {}) {
  const { showScore = true } = options;
  const logoSrc = logoPath || 'logo-200.png';
  const brand = '#0b4ea2';
  const brandDark = '#083a79';
  const accent = '#ff7a00';
  const accentSoft = '#fff1e5';
  const blueSoft = '#eef5ff';
  const line = '#e6edf7';

  const headerSection = `
    <section style="padding: 38px 24px 30px; text-align: center; border-bottom: 1px solid ${line}; background: linear-gradient(180deg, ${brand} 0%, ${brandDark} 100%);">
      <div style="margin-bottom: 18px;">
        <span style="display:inline-flex; width:104px; height:104px; align-items:center; justify-content:center; border-radius:999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.16);">
          <img src="${logoSrc}" alt="知己足球俱乐部" style="width: 84px; height: 84px; display: inline-block;" />
        </span>
      </div>
      <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,0.14); color: #ffffff; font-size: 12px; letter-spacing: 1.5px; margin-bottom: 14px; font-weight: 700;">MATCH REPORT</div>
      <h1 style="font-size: 28px; line-height: 1.45; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; letter-spacing: 0.5px;">${data.title || '比赛战报'}</h1>
      ${data.opponent ? `<p style="font-size: 14px; color: rgba(255,255,255,0.85); margin: 0; letter-spacing: 1px;">对阵 · ${data.opponent}</p>` : ''}
    </section>
  `;

  const metaItems = [
    data.date ? { label: '比赛日期', value: data.date } : null,
    data.location ? { label: '比赛地点', value: data.location } : null,
    showScore && data.score ? { label: '比赛比分', value: data.score, strong: true } : null,
    data.weather ? { label: '天气情况', value: data.weather } : null,
  ].filter(Boolean);

  const metaSection = `
    <section style="padding: 22px 24px; background: #ffffff; border-bottom: 1px solid ${line};">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 18px;">
        ${metaItems.map(item => `
          <div style="padding: 14px 14px 12px; border-radius: 14px; background: ${item.strong ? `linear-gradient(135deg, ${accent} 0%, #ff9f43 100%)` : blueSoft}; border: 1px solid ${item.strong ? '#ff9d45' : '#dde9fb'}; box-shadow: ${item.strong ? '0 8px 20px rgba(255,122,0,0.18)' : 'none'};">
            <div style="font-size: 11px; color: ${item.strong ? 'rgba(255,255,255,0.82)' : brand}; letter-spacing: 1.2px; margin-bottom: 6px; text-transform: uppercase; font-weight: 700;">${item.label}</div>
            <div style="font-size: ${item.strong ? '26px' : '15px'}; color: ${item.strong ? '#ffffff' : '#1f2937'}; font-weight: ${item.strong ? '800' : '600'}; line-height: 1.5;">${item.value}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  let summarySection = '';
  if (data.summary) {
    summarySection = `
      <section style="padding: 24px; border-bottom: 1px solid ${line}; background: #fff;">
        <div style="border-left: 4px solid ${accent}; padding-left: 14px;">
          <div style="font-size: 12px; color: ${accent}; letter-spacing: 1.2px; margin-bottom: 8px; text-transform: uppercase; font-weight: 800;">比赛摘要</div>
          <p style="font-size: 16px; line-height: 1.9; color: #374151; margin: 0;">${data.summary}</p>
        </div>
      </section>
    `;
  }

  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="padding: 28px 24px; border-bottom: 1px solid ${line}; background: #fff; text-align: center;">
        <div style="display: inline-block; padding: 7px 14px; border-radius: 999px; background: ${accentSoft}; color: ${accent}; font-size: 12px; letter-spacing: 1.6px; margin-bottom: 12px; text-transform: uppercase; font-weight: 800;">Man of the Match</div>
        <div style="font-size: 32px; font-weight: 800; color: ${brandDark}; line-height: 1.4;">${data.mvp}</div>
      </section>
    `;
  }

  const contentSection = `
    <section style="padding: 30px 24px 18px; color: #374151; font-size: 16px; line-height: 1.95; background: #fff;">
      ${contentHTML}
    </section>
  `;

  let photoSection = '';
  if (photos && photos.length > 0) {
    const photoItems = photos.map((photo) => {
      const photoPath = typeof photo === 'string' ? photo : photo.path;
      const caption = typeof photo === 'object' && photo.caption ? photo.caption : '';
      return `
        <figure style="margin: 0 0 22px 0;">
          <img src="${photoPath}" style="width: 100%; display: block; background: #f3f4f6; border-radius: 10px;" />
          ${caption ? `<figcaption style="font-size: 12px; color: #9ca3af; margin-top: 8px; text-align: center;">${caption}</figcaption>` : ''}
        </figure>
      `;
    }).join('');

    photoSection = `
      <section style="padding: 0 24px 24px; background: #fff;">
        <div style="padding-top: 8px; margin-bottom: 18px; border-top: 1px solid ${line}; display:flex; align-items:center; gap:10px;">
          <div style="width: 24px; height: 4px; background: ${accent}; border-radius: 999px;"></div>
          <div style="font-size: 12px; color: ${brand}; letter-spacing: 1.4px; text-transform: uppercase; font-weight: 800;">比赛图集</div>
        </div>
        ${photoItems}
      </section>
    `;
  }

  const footer = `
    <section style="padding: 30px 24px 34px; text-align: center; background: linear-gradient(180deg, #ffffff 0%, ${blueSoft} 100%); border-top: 1px solid ${line};">
      <div style="width: 64px; height: 4px; background: linear-gradient(90deg, ${brand}, ${accent}); border-radius: 999px; margin: 0 auto 16px;"></div>
      <div style="font-size: 15px; font-weight: 800; color: ${brandDark}; letter-spacing: 1px; margin-bottom: 6px;">知己足球俱乐部</div>
      <div style="font-size: 12px; color: #7d8898;">ZHJI FC · Official Match Report</div>
    </section>
  `;

  return `
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif; border-radius: 16px; overflow: hidden;">
      ${headerSection}
      ${metaSection}
      ${summarySection}
      ${mvpSection}
      ${contentSection}
      ${photoSection}
      ${footer}
    </div>
  `;
}

module.exports = { getArticleTemplate };
