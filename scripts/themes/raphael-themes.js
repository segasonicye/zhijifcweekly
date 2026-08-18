/**
 * Raphael Publish 风格主题集
 * 用于微信公众号推文
 * 
 * 主题：
 *   zhiji   - 暖奶白暖金（品牌主题，适合内战战报）
 *   claude  - 燕麦色暖调，适合古诗词/文艺战报
 *   retro   - 羊皮纸古风，适合古典/怀旧战报
 *   stripe  - 硅谷科技风，适合月度统计/数据报告
 */

const CHINESE_FONT = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei'";

const themes = {
  zhiji: {
    label: '暖奶白品牌风 (Zhiji)',
    accent: '#c9a84c',
    container: 'max-width: 100%; margin: 0 auto; padding: 24px 20px 48px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, ' + CHINESE_FONT + ', sans-serif; font-size: 16px; line-height: 1.75 !important; color: #4a3f2e !important; background-color: #fffdf7 !important; word-wrap: break-word;',
    h1: 'font-size: 32px; font-weight: 700; color: #8a6d1f !important; line-height: 1.3 !important; margin: 38px 0 16px; letter-spacing: -0.015em;',
    h2: 'font-size: 26px; font-weight: 600; color: #8a6d1f !important; line-height: 1.35 !important; margin: 32px 0 16px;',
    h3: 'font-size: 21px; font-weight: 600; color: #4a3f2e !important; line-height: 1.4 !important; margin: 28px 0 14px;',
    h4: 'font-size: 18px; font-weight: 600; color: #4a3f2e !important; line-height: 1.4 !important; margin: 24px 0 12px;',
    p: 'margin: 18px 0 !important; line-height: 1.75 !important; color: #4a3f2e !important;',
    strong: 'font-weight: 700; color: #b02a1e !important;',
    em: 'font-style: italic; color: #8a7a5c !important;',
    a: 'color: #8a6d1f !important; text-decoration: none; border-bottom: 1px solid #c9a84c; padding-bottom: 1px;',
    blockquote: 'margin: 24px 0; padding: 16px 20px; background-color: #faf5e6 !important; border-left: 4px solid #c9a84c; color: #6b5d42 !important; border-radius: 4px;',
    code: 'font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace; font-size: 14px; background-color: #faf5e6; padding: 2px 6px; border-radius: 4px; color: #8a6d1f;',
    pre: 'margin: 20px 0; padding: 16px 20px; background-color: #faf5e6 !important; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6;',
    hr: 'border: none; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); margin: 32px 0;',
    img: 'max-width: 100%; height: auto; display: block; margin: 24px auto; border-radius: 4px;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;',
    th: 'background-color: #faf5e6; padding: 10px 14px; text-align: left; font-weight: 600; color: #8a6d1f; border-bottom: 2px solid #c9a84c;',
    td: 'padding: 10px 14px; border-bottom: 1px solid #f0e6cd; color: #4a3f2e;',
  },

  claude: {
    label: '燕麦暖调 (Claude)',
    accent: '#b75c3d',
    container: 'max-width: 100%; margin: 0 auto; padding: 24px 20px 48px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, ' + CHINESE_FONT + ', sans-serif; font-size: 16px; line-height: 1.7 !important; color: #2b2b2b !important; background-color: #f8f6f0 !important; word-wrap: break-word;',
    h1: 'font-size: 32px; font-weight: 700; color: #b75c3d !important; line-height: 1.3 !important; margin: 38px 0 16px; letter-spacing: -0.015em;',
    h2: 'font-size: 26px; font-weight: 600; color: #b75c3d !important; line-height: 1.35 !important; margin: 32px 0 16px;',
    h3: 'font-size: 21px; font-weight: 600; color: #2b2b2b !important; line-height: 1.4 !important; margin: 28px 0 14px;',
    h4: 'font-size: 18px; font-weight: 600; color: #2b2b2b !important; line-height: 1.4 !important; margin: 24px 0 12px;',
    p: 'margin: 18px 0 !important; line-height: 1.7 !important; color: #2b2b2b !important;',
    strong: 'font-weight: 700; color: #b75c3d !important; background-color: rgba(183,92,61,0.08); padding: 0 4px; border-radius: 4px;',
    em: 'font-style: italic; color: #666 !important;',
    a: 'color: #b75c3d !important; text-decoration: none; border-bottom: 1px solid #b75c3d; padding-bottom: 1px;',
    blockquote: 'margin: 24px 0; padding: 16px 20px; background-color: rgba(183, 92, 61, 0.04) !important; border-left: 4px solid #b75c3d; color: #555 !important; border-radius: 4px;',
    code: 'font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace; font-size: 14px; background-color: rgba(183,92,61,0.06); padding: 2px 6px; border-radius: 4px; color: #b75c3d;',
    pre: 'margin: 20px 0; padding: 16px 20px; background-color: rgba(183,92,61,0.06) !important; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6;',
    hr: 'border: none; height: 1px; background: linear-gradient(90deg, transparent, #b75c3d, transparent); margin: 32px 0;',
    img: 'max-width: 100%; height: auto; display: block; margin: 24px auto; border-radius: 4px;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;',
    th: 'background-color: rgba(183,92,61,0.08); padding: 10px 14px; text-align: left; font-weight: 600; color: #b75c3d; border-bottom: 2px solid #b75c3d;',
    td: 'padding: 10px 14px; border-bottom: 1px solid rgba(183,92,61,0.12); color: #2b2b2b;',
  },

  retro: {
    label: '羊皮纸古风 (Retro)',
    accent: '#8c2211',
    container: 'max-width: 100%; margin: 0 auto; padding: 24px 20px 48px 20px; font-family: Georgia, "Times New Roman", Times, ' + CHINESE_FONT + ', serif; font-size: 16px; line-height: 1.7 !important; color: #2b2621 !important; background-color: #f4ecd8 !important; word-wrap: break-word;',
    h1: 'font-size: 36px; font-weight: 800; color: #2b2621 !important; line-height: 1.2 !important; margin: 38px 0 20px; letter-spacing: -0.02em; font-variant: small-caps;',
    h2: 'font-size: 26px; font-weight: 700; color: #8c2211 !important; line-height: 1.35 !important; margin: 32px 0 16px;',
    h3: 'font-size: 21px; font-weight: 600; color: #2b2621 !important; line-height: 1.4 !important; margin: 28px 0 14px;',
    h4: 'font-size: 18px; font-weight: 600; color: #2b2621 !important; line-height: 1.4 !important; margin: 24px 0 12px;',
    p: 'margin: 18px 0 !important; line-height: 1.7 !important; color: #2b2621 !important;',
    strong: 'font-weight: 700; color: #8c2211 !important;',
    em: 'font-style: italic; color: #666 !important;',
    a: 'color: #8c2211 !important; text-decoration: none; border-bottom: 1px solid #8c2211; padding-bottom: 1px;',
    blockquote: 'margin: 24px 0; padding: 16px 20px; background-color: #efe5cc !important; border-left: 4px solid #8c2211; color: #555 !important; border-radius: 4px; font-style: italic;',
    code: 'font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace; font-size: 14px; background-color: rgba(140,34,17,0.08); padding: 2px 6px; border-radius: 4px; color: #8c2211;',
    pre: 'margin: 20px 0; padding: 16px 20px; background-color: rgba(140,34,17,0.06) !important; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6;',
    hr: 'border: none; height: 1px; background: linear-gradient(90deg, transparent, #8c2211, transparent); margin: 32px 0;',
    img: 'max-width: 100%; height: auto; display: block; margin: 24px auto; border-radius: 4px;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;',
    th: 'background-color: rgba(140,34,17,0.08); padding: 10px 14px; text-align: left; font-weight: 600; color: #8c2211; border-bottom: 2px solid #8c2211;',
    td: 'padding: 10px 14px; border-bottom: 1px solid rgba(140,34,17,0.12); color: #2b2621;',
  },

  stripe: {
    label: '硅谷科技风 (Stripe)',
    accent: '#635bff',
    container: 'max-width: 100%; margin: 0 auto; padding: 24px 20px 48px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, ' + CHINESE_FONT + ', sans-serif; font-size: 16px; line-height: 1.7 !important; color: #425466 !important; background-color: #f6f9fc !important; word-wrap: break-word;',
    h1: 'font-size: 32px; font-weight: 700; color: #111 !important; line-height: 1.3 !important; margin: 38px 0 16px; letter-spacing: -0.015em;',
    h2: 'font-size: 26px; font-weight: 600; color: #111 !important; line-height: 1.35 !important; margin: 32px 0 16px;',
    h3: 'font-size: 21px; font-weight: 600; color: #111 !important; line-height: 1.4 !important; margin: 28px 0 14px;',
    h4: 'font-size: 18px; font-weight: 600; color: #111 !important; line-height: 1.4 !important; margin: 24px 0 12px;',
    p: 'margin: 18px 0 !important; line-height: 1.7 !important; color: #425466 !important;',
    strong: 'font-weight: 700; color: #0a2540 !important;',
    em: 'font-style: italic; color: #697386 !important;',
    a: 'color: #635bff !important; text-decoration: none; border-bottom: 1px solid #635bff; padding-bottom: 1px;',
    blockquote: 'margin: 24px 0; padding: 16px 20px; background-color: #eef0ff !important; border-left: 4px solid #635bff; color: #425466 !important; border-radius: 4px;',
    code: 'font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace; font-size: 14px; background-color: rgba(99,91,255,0.08); padding: 2px 6px; border-radius: 4px; color: #635bff;',
    pre: 'margin: 20px 0; padding: 16px 20px; background-color: rgba(99,91,255,0.06) !important; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6;',
    hr: 'border: none; height: 1px; background: linear-gradient(90deg, transparent, #635bff, transparent); margin: 32px 0;',
    img: 'max-width: 100%; height: auto; display: block; margin: 24px auto; border-radius: 4px;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;',
    th: 'background-color: rgba(99,91,255,0.08); padding: 10px 14px; text-align: left; font-weight: 600; color: #0a2540; border-bottom: 2px solid #635bff;',
    td: 'padding: 10px 14px; border-bottom: 1px solid rgba(99,91,255,0.12); color: #425466;',
  },
};

/**
 * 获取主题
 * @param {string} name - 主题名 (zhiji/claude/retro/stripe)，默认 zhiji
 * @returns {Object} 主题 CSS 对象
 */
function getTheme(name = 'zhiji') {
  const theme = themes[name];
  if (!theme) {
    console.warn(`⚠️ 未知 Raphael 主题 "${name}"，已回退到 zhiji`);
    return themes.zhiji;
  }
  return theme;
}

/**
 * 列出所有可用主题
 * @returns {Object} 所有主题
 */
function listThemes() {
  return themes;
}

module.exports = { getTheme, listThemes, themes };
