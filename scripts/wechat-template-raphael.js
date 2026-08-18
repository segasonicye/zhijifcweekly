/**
 * 微信公众号文章模板 - Raphael Publish 风格
 * 基于 Claude/Anthropic 的 Raphael Publish 排版美学
 * 
 * 支持主题：
 *   claude  - 燕麦色暖调，适合古诗词/文艺战报
 *   retro   - 羊皮纸古风，适合古典/怀旧战报
 *   stripe  - 硅谷科技风，适合月度统计/数据报告
 * 
 * 使用方式：--style raphael[:theme]
 *   例如：--style raphael          (默认 claude)
 *         --style raphael:claude
 *         --style raphael:retro
 *         --style raphael:stripe
 */

const path = require('path');
const { getTheme } = require('./themes/raphael-themes');

/**
 * 从 style 参数中解析主题名
 * @param {string} style - 如 'raphael' 或 'raphael:retro'
 * @returns {string} 主题名
 */
function parseThemeName(style = 'raphael') {
  if (style.includes(':')) {
    return style.split(':')[1].trim();
  }
  return 'claude';
}

/**
 * 将主题内联样式注入到 contentHTML 的各个元素上
 */
function applyThemeToHTML(html, theme) {
    const bgColor = theme.container.match(/background-color:\s*([^;]+)/i)?.[1] || '';
  // 注入 p 样式
  html = html.replace(/<p(\s[^>]*)?>/gi, (match, attrs) => {
    const style = `margin: 18px 0 !important; line-height: 1.7 !important; color: ${theme.p.match(/color:\s*([^;]+)/i)?.[1] || 'inherit'} !important;${bgColor ? ' background-color: ' + bgColor + ' !important;' : ''}`;
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<p${attrs} style="${style}">` : `<p style="${style}">`;
  });
  // 注入 strong 样式
  html = html.replace(/<strong(\s[^>]*)?>/gi, (match, attrs) => {
    const style = theme.strong || 'font-weight: 700;';
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<strong${attrs} style="${style}">` : `<strong style="${style}">`;
  });
  // 注入 em 样式
  html = html.replace(/<em(\s[^>]*)?>/gi, (match, attrs) => {
    const style = theme.em || 'font-style: italic;';
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<em${attrs} style="${style}">` : `<em style="${style}">`;
  });
  // 注入 a 样式
  html = html.replace(/<a(\s[^>]*)?>/gi, (match, attrs) => {
    const style = theme.a || 'color: #0066cc;';
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<a${attrs} style="${style}">` : `<a style="${style}">`;
  });
  // 注入 blockquote 样式
  html = html.replace(/<blockquote(\s[^>]*)?>/gi, (match, attrs) => {
    const style = theme.blockquote || 'margin: 24px 0; padding: 16px 20px; border-left: 4px solid #999; background-color: #f5f5f5;';
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<blockquote${attrs} style="${style}">` : `<blockquote style="${style}">`;
  });
  // 注入 img 样式
  html = html.replace(/<img(\s[^>]*)?>/gi, (match, attrs) => {
    const style = theme.img || 'max-width: 100%; height: auto; display: block; margin: 24px auto;';
    if (attrs && /style=/i.test(attrs)) return match;
    return attrs ? `<img${attrs} style="${style}">` : `<img style="${style}">`;
  });
  // 注入 h2/h3/h4 样式
  ['h2', 'h3', 'h4'].forEach(tag => {
    const themeStyle = theme[tag] || '';
    if (!themeStyle) return;
    html = html.replace(new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi'), (match, attrs) => {
      if (attrs && /style=/i.test(attrs)) return match;
      return attrs ? `<${tag}${attrs} style="${themeStyle}">` : `<${tag} style="${themeStyle}">`;
    });
  });
  return html;
}

/**
 * 获取文章模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 * @param {String} logoPath - logo的微信URL（可选）
 * @param {Object} options - 选项
 * @param {Object} options.themeName - 主题名覆盖
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null, options = {}) {
  const { showScore = true, themeName, indent } = options;
  const theme = getTheme(themeName || 'zhiji');
  const accent = theme.accent;
  const isZhiji = (themeName || 'zhiji') === 'zhiji';

  // ── Logo ──
  let logoSrc = logoPath || 'logo-200.png';
  const logoSection = `
    <div style="text-align: center; margin: 0 0 20px 0;">
      <img src="${logoSrc}" alt="知己FC" style="width: 72px; height: 72px; display: block; margin: 0 auto; border-radius: 50%; border: 3px solid ${accent}; object-fit: cover;" />
    </div>
  `;

  // ── 比赛信息框 ──
  // 兼容性：标签用 inline-block + margin（不依赖 flex/gap），emoji 不承载关键信息
  const tag = (text) => `<span style="display: inline-block; background: rgba(255,255,255,0.22); padding: 6px 16px; margin: 4px; border-radius: 20px; font-size: 13px; color: #fff; font-weight: 500;">${text}</span>`;

  // zhiji 品牌主题：奶白底 + 金线描边（与封面视觉统一）；其他主题保持彩色实底
  const infoBoxStyle = isZhiji
    ? `padding: 30px 25px; margin: 0 0 28px 0; border-radius: 12px; text-align: center; background: #fffdf7; color: #4a3f2e; border: 2px solid #c9a84c;`
    : `padding: 30px 25px; margin: 0 0 28px 0; border-radius: 12px; text-align: center; background: ${accent}; color: #fff;`;

  const titleColor = isZhiji ? '#8a6d1f' : '#fff';
  const tagBg = (text) => isZhiji
    ? `<span style="display: inline-block; background: #faf5e6; padding: 6px 16px; margin: 4px; border-radius: 20px; font-size: 13px; color: #8a6d1f; font-weight: 500; border: 1px solid #e8d9b0;">${text}</span>`
    : tag(text);

  const infoBox = `
    <section style="${infoBoxStyle}">
      <h1 style="font-size: 28px; margin: 0 0 20px; font-weight: 800; color: ${titleColor}; line-height: 1.4; letter-spacing: 0.5px;">${data.title || '知己FC 战报'}</h1>

      <div style="text-align: center; margin-bottom: 8px;">
        ${data.date ? tagBg(data.date) : ''}
        ${data.opponent ? tagBg(data.opponent) : ''}
        ${data.location ? tagBg(data.location) : ''}
      </div>

      ${data.score && showScore ? `
        <div style="background: ${isZhiji ? '#faf5e6' : 'rgba(255,255,255,0.18)'}; padding: 16px 28px; border-radius: 10px; display: inline-block; margin-top: 12px;">
          <span style="font-size: 36px; font-weight: 900; color: ${isZhiji ? '#8a6d1f' : '#fff'}; letter-spacing: 2px;">${data.score}</span>
        </div>
      ` : ''}
    </section>
  `;

  // ── MVP ──
  let mvpSection = '';
  if (data.mvp) {
    const mvpStyle = isZhiji
      ? `padding: 28px 25px; margin: 0 0 28px 0; border-radius: 12px; text-align: center; background: #faf5e6; border: 1px solid #e8d9b0;`
      : `padding: 28px 25px; margin: 0 0 28px 0; border-radius: 12px; text-align: center; background: #fff; border: 2px solid ${accent};`;
    mvpSection = `
      <section style="${mvpStyle}">
        <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 3px; font-weight: 700; color: ${accent};">本场最佳 · MVP</p>
        <div style="font-size: 28px; font-weight: 800; color: ${accent};">${data.mvp}</div>
      </section>
    `;
  }

  // ── 分隔线 ──
  const divider = `
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, ${accent}, transparent);"></div>
    </div>
  `;

  // ── 出勤名单（胶囊标签流式排布）──
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    const pills = data.attendance.map(name =>
      `<span style="display: inline-block; padding: 5px 14px; margin: 4px; border-radius: 16px; font-size: 14px; color: ${accent}; background: ${isZhiji ? '#faf5e6' : 'rgba(0,0,0,0.03)'}; border: 1px solid ${isZhiji ? '#e8d9b0' : 'rgba(0,0,0,0.08)'};">${name}</span>`
    ).join('');
    attendanceSection = `
      <section style="padding: 24px; margin: 0 0 28px 0; border-radius: 10px; background: ${isZhiji ? '#fffdf7' : '#fff'}; border-left: 4px solid ${accent};">
        <div style="margin-bottom: 14px;">
          <span style="font-size: 13px; letter-spacing: 2px; font-weight: 700; color: ${accent};">出勤名单 · ${data.attendance.length}人</span>
        </div>
        <div style="line-height: 1.9;">${pills}</div>
      </section>
    `;
  }

  // ── 照片展示 ──
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: ${index === 0 ? '0' : '28px'} 0 0 0;">
          <img src="${imgPath}" alt="${caption || imgName}" style="width: 100%; display: block; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);" />
          ${caption ? `<p style="text-align: center; font-size: 13px; color: #999; margin: 12px 0 0 0;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 40px 0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 13px; letter-spacing: 3px; font-weight: 700; color: ${accent};">精彩瞬间</span>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // ── 页脚 ──
  const footer = `
    <section style="padding: 30px 25px; margin: 50px 0 20px 0; border-radius: 12px; text-align: center; background: ${isZhiji ? '#faf5e6' : '#fff'}; border: ${isZhiji ? '1px solid #e8d9b0' : 'none'};">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: ${accent};">感谢阅读</p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">
        知己足球俱乐部，每周末与你相伴
      </p>
      <div style="display: inline-block; width: 40px; height: 1px; background: ${accent}; opacity: 0.3;"></div>
    </section>
  `;

  // ── 正文（indent 选项：首行缩进 2 字符，默认关闭）──
  let bodyHTML = applyThemeToHTML(contentHTML, theme);
  if (indent) {
    bodyHTML = bodyHTML.replace(/<p(?![^>]*text-indent)(\s[^>]*)?>/gi, (match, attrs) => {
      if (attrs && /style="/i.test(attrs)) {
        return match.replace(/style="/i, 'style="text-indent: 2em; ');
      }
      return attrs ? `<p${attrs} style="text-indent: 2em;">` : `<p style="text-indent: 2em;">`;
    });
  }

  // ── 组装 ──
  const article = `
    <div style="${theme.container} max-width: 680px;">
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      ${divider}

      <section style="${theme.p} text-align: justify; background-color: ${theme.container.match(/background-color:\s*([^;]+)/i)?.[1] || 'transparent'}; padding: 20px; border-radius: 8px; margin: 0 -10px;">
        ${bodyHTML}
      </section>

      ${divider}
      ${attendanceSection}
      ${photos.length > 0 && !contentHTML.includes('<img') ? photosSection : ''}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate, parseThemeName };
