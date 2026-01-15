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
 * @param {String} logoPath - logo路径（可选）
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // Logo部分 - 使用醒目的边框占位符
  const logoSection = `
    <div style="text-align: center; margin: 0 0 20px 0; padding: 30px; background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border: 3px dashed #e17055; border-radius: 15px;">
      <p style="margin: 0; color: #d63031; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">⚠️ 请插入Logo图片</p>
      <p style="margin: 8px 0 0 0; color: #e17055; font-size: 13px;">上传 logo-150.png 后删除此框</p>
    </div>
  `;

  // 构建比赛信息框
  const infoBox = `
    <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
      <h1 style="text-align: center; font-size: 26px; margin: 0 0 20px 0; font-weight: 800;">${data.title || '⚽ 比赛战报'}</h1>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 12px;">
        ${data.date ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">📅 ${data.date}</div>` : ''}
        ${data.opponent ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">⚔️ ${data.opponent}</div>` : ''}
        ${data.score ? `<div style="background: rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 25px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">${data.score}</div>` : ''}
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

  // 构建出勤名单
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%); border-left: 5px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);">
        <h3 style="margin: 0 0 12px 0; color: #667eea; font-size: 18px; font-weight: 700;">📋 出勤名单 (${data.attendance.length}人)</h3>
        <div style="line-height: 2; color: #4a4a6a; font-size: 15px;">${data.attendance.join('、')}</div>
      </section>
    `;
  }

  // 构建照片展示区
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map(photo => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: 25px 0;">
          <img src="${imgName}" alt="${caption}" style="width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);" />
          ${caption ? `<p style="text-align: center; color: #667eea; font-size: 15px; margin: 10px 0 0 0; font-weight: 600;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 35px 0; padding: 25px; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); border-radius: 15px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);">
        <h3 style="font-size: 22px; font-weight: 800; margin: 0 0 25px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-align: center;">📸 精彩瞬间</h3>
        ${photosHTML}
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
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      <section style="padding: 15px 0; line-height: 1.9; color: #4a4a6a;">
        ${contentHTML}
      </section>
      ${attendanceSection}
      ${photosSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
