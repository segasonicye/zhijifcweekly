/**
 * 微信公众号文章模板 - 清新草地风格 (Fresh)
 * 特点：绿色主调、现代、充满活力、健康自然
 */

const path = require('path');

/**
 * 获取Fresh风格文章模板
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // 1. Logo部分 - 清新圆角
  const logoSection = `
    <div style="text-align: center; margin: 0 0 30px 0; padding: 25px; background: rgba(46, 204, 113, 0.05); border: 2px dashed #2ecc71; border-radius: 20px;">
      <p style="margin: 0; color: #2ecc71; font-size: 14px; font-weight: 600; letter-spacing: 1px;">📷 上传 Logo 后删除此框</p>
    </div>
  `;

  // 2. 比赛信息卡片 - 现代悬浮感
  const infoBox = `
    <section style="background: #fff; padding: 40px 30px; margin: 30px 0; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(46, 204, 113, 0.15); border: 1px solid rgba(46, 204, 113, 0.1); position: relative; overflow: hidden;">
      <!-- 装饰圆点 -->
      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: #2ecc71; opacity: 0.1; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: #27ae60; opacity: 0.1; border-radius: 50%;"></div>

      <h1 style="font-size: 26px; margin: 0 0 25px 0; font-weight: 800; color: #2d3436; letter-spacing: 0.5px; line-height: 1.4; position: relative; z-index: 1;">
        <span style="background: linear-gradient(120deg, #2ecc71 0%, #27ae60 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.title || '⚽ 比赛战报'}</span>
      </h1>

      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; position: relative; z-index: 1;">
        ${data.date ? `<span style="background: #e8f8f5; padding: 8px 16px; border-radius: 12px; font-size: 13px; color: #27ae60; font-weight: 600;">📅 ${data.date}</span>` : ''}
        ${data.opponent ? `<span style="background: #e8f8f5; padding: 8px 16px; border-radius: 12px; font-size: 13px; color: #27ae60; font-weight: 600;">🆚 ${data.opponent}</span>` : ''}
        ${data.location ? `<span style="background: #e8f8f5; padding: 8px 16px; border-radius: 12px; font-size: 13px; color: #27ae60; font-weight: 600;">📍 ${data.location}</span>` : ''}
      </div>

      ${data.score ? `
        <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 15px 30px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(46, 204, 113, 0.3); position: relative; z-index: 1;">
          <div style="font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 2px;">${data.score}</div>
        </div>
      ` : ''}
    </section>
  `;

  // 3. MVP展示 - 奖牌风格
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: #fff; padding: 30px; margin: 30px 0; border-radius: 20px; text-align: center; border: 2px solid #f1c40f; box-shadow: 0 10px 30px rgba(241, 196, 15, 0.15);">
        <div style="font-size: 30px; margin-bottom: 10px;">⭐</div>
        <p style="margin: 0 0 5px 0; color: #f39c12; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">MATCH MVP</p>
        <div style="font-size: 24px; font-weight: 700; color: #2d3436;">${data.mvp}</div>
      </section>
    `;
  }

  // 4. 分隔符 - 绿色叶子
  const divider = `
    <div style="text-align: center; margin: 40px 0;">
      <span style="font-size: 20px; color: #2ecc71; opacity: 0.6;">🌿</span>
    </div>
  `;

  // 5. 出勤名单 - 气泡风格
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: #f0fdf4; padding: 30px; margin: 30px 0; border-radius: 16px; border: 1px solid #dcfce7;">
        <h3 style="margin: 0 0 20px 0; color: #166534; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> 出勤名单 (${data.attendance.length})
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${data.attendance.map(name =>
      `<span style="background: #fff; color: #15803d; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #bbf7d0;">${name}</span>`
    ).join('')}
        </div>
      </section>
    `;
  }

  // 6. 照片展示 - 画廊风格
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: ${index === 0 ? '0' : '30px'} 0 0 0; background: #fff; padding: 10px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <img src="${imgPath}" alt="${caption}" style="width: 100%; display: block; border-radius: 12px;" />
          ${caption ? `<p style="text-align: center; color: #7f8c8d; font-size: 13px; margin: 10px 0 0 0;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 50px 0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background: #2ecc71; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1px;">GALLERY</span>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // 7. 页脚
  const footer = `
    <section style="margin: 60px 0 30px 0; text-align: center;">
      <div style="width: 40px; height: 4px; background: #2ecc71; margin: 0 auto 20px auto; border-radius: 2px;"></div>
      <p style="margin: 0; color: #95a5a6; font-size: 14px; letter-spacing: 1px;">
        知己足球俱乐部，每周末与你相伴
      </p>
    </section>
  `;

  // 8. 组装文章
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fafafa; padding: 30px 20px; color: #2c3e50;">
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      ${divider}

      <section style="line-height: 1.8; color: #34495e; font-size: 16px; text-align: justify; padding: 0 10px;">
        ${contentHTML}
      </section>

      ${divider}
      ${attendanceSection}
      ${photosSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
