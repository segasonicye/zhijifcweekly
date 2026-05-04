/**
 * 微信公众号文章模板 - 专业极简版 (Clean/Minimal)
 * 特点：克制、留白、清晰层级、无过度装饰
 */

const path = require('path');

/**
 * 获取文章模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 * @param {String} logoPath - logo的微信URL（可选）
 * @param {Object} options - 选项 (如 { showScore: false })
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null, options = {}) {
  const { showScore = true } = options;

  // Logo 图片源
  let logoSrc = logoPath || 'logo-200.png';

  // 顶部区域 - 极简白底，细线分隔
  const headerSection = `
    <section style="padding: 40px 20px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
      <img src="${logoSrc}" alt="知己足球俱乐部" style="width: 80px; height: 80px; margin-bottom: 20px;" />
      <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; letter-spacing: 2px;">${data.title || '比赛战报'}</h1>
      ${data.opponent ? `<p style="font-size: 14px; color: #666; margin: 0; letter-spacing: 1px;">VS ${data.opponent}</p>` : ''}
    </section>
  `;

  // 比赛信息 - 简洁表格形式
  const infoSection = `
    <section style="padding: 25px 20px; background: #fafafa; border-bottom: 1px solid #e5e5e5;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #999; width: 60px;">日期</td>
          <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date || '-'}</td>
        </tr>
        ${showScore && data.score ? `
        <tr>
          <td style="padding: 8px 0; color: #999;">比分</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">${data.score}</td>
        </tr>
        ` : ''}
        ${data.location ? `
        <tr>
          <td style="padding: 8px 0; color: #999;">地点</td>
          <td style="padding: 8px 0; color: #333;">${data.location}</td>
        </tr>
        ` : ''}
        ${data.weather ? `
        <tr>
          <td style="padding: 8px 0; color: #999;">天气</td>
          <td style="padding: 8px 0; color: #333;">${data.weather}</td>
        </tr>
        ` : ''}
      </table>
    </section>
  `;

  // MVP 区 - 极简卡片
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
        <p style="font-size: 12px; color: #999; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">本场 MVP</p>
        <p style="font-size: 28px; font-weight: 600; color: #1a1a1a; margin: 0;">${data.mvp}</p>
      </section>
    `;
  }

  // 正文区 - 优雅排版
  const contentSection = `
    <section style="padding: 30px 20px; line-height: 1.8; color: #333; font-size: 16px;">
      ${contentHTML}
    </section>
  `;

  // 照片区 - 自然展示
  let photoSection = '';
  if (photos && photos.length > 0) {
    const photoItems = photos.map((photo) => {
      const photoPath = typeof photo === 'string' ? photo : photo.path;
      return `
        <div style="margin: 20px 0;">
          <img src="${photoPath}" style="width: 100%; display: block;" />
        </div>
      `;
    }).join('');
    
    photoSection = `
      <section style="padding: 20px; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 12px; color: #999; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">精彩瞬间</p>
        ${photoItems}
      </section>
    `;
  }

  // 页脚 - 极简签名
  const footer = `
    <section style="padding: 40px 20px; text-align: center; border-top: 1px solid #e5e5e5; margin-top: 20px;">
      <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 5px 0; letter-spacing: 2px;">知己足球俱乐部</p>
      <p style="font-size: 12px; color: #999; margin: 0;">每周末与你相约</p>
    </section>
  `;

  // 组装完整文章
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #ffffff;">
      ${headerSection}
      ${infoSection}
      ${mvpSection}
      ${contentSection}
      ${photoSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
