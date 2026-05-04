/**
 * 微信公众号文章模板
 * 可复用的HTML模板结构
 */

const path = require('path');

/**
 * 获取文章模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 * @param {String} logoPath - logo的微信URL（可选，优先级高于本地路径）
 * @param {Object} options - 选项 (如 { showScore: false })
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null, options = {}) {
  const { showScore = true } = options;

  // Logo 图片源
  let logoSrc = logoPath || 'logo-200.png';

  // 构建比赛信息框（只保留一个 Logo，放在标题上方）
  const infoBox = `
    <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoSrc}" alt="知己足球俱乐部 Logo" style="width: 100px; height: 100px; display: block; margin: 0 auto; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.1);" />
      </div>
      <h1 style="text-align: center; font-size: 26px; margin: 0 0 20px 0; font-weight: 800;">${data.title || '⚽ 比赛战报'}</h1>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 12px;">
        ${data.date ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">📅 ${data.date}</div>` : ''}
        ${data.opponent ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">⚔️ ${data.opponent}</div>` : ''}
        ${showScore && data.score ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">${data.score}</div>` : ''}
        ${data.location ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">📍 ${data.location}</div>` : ''}
      </div>
    </section>
  `;

  // MVP展示
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 10px 25px rgba(240, 147, 251, 0.4); text-align: center;">
        <h3 style="margin: 0 0 12px 0; color: white; font-size: 18px; font-weight: 700;">⭐ 本场MVP</h3>
        <div style="font-size: 24px; font-weight: 800; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${data.mvp}</div>
      </section>
    `;
  }

  // 页脚
  const footer = `
    <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; margin: 35px 0 0 0; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.25);">
      <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">— 感谢阅读 —</p>
      <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
        知己足球俱乐部 · 每周末与你相约 ⚽
      </p>
    </section>
  `;

  // 组装完整文章
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); padding: 20px; border-radius: 20px;">
      ${infoBox}
      ${mvpSection}
      <section style="padding: 15px 0; line-height: 1.9; color: #4a4a6a;">
        ${contentHTML}
      </section>
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
