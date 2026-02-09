/**
 * 微信公众号文章模板 - ins风格
 * 参考insdaily等高质量公众号的设计风格
 * 特点：简洁、现代、优雅、留白充足
 */

const path = require('path');

/**
 * 获取ins风格文章模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 * @param {String} logoPath - logo路径（可选）
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // Logo部分 - 极简设计，小尺寸优雅占位
  const logoSection = `
    <div style="text-align: center; margin: 0 0 40px 0; padding: 20px; background: #fafafa; border: 1px dashed #ddd; border-radius: 8px;">
      <p style="margin: 0; color: #999; font-size: 13px; letter-spacing: 1px;">📷 上传 Logo 后删除此框</p>
    </div>
  `;

  // 顶部装饰线 - ins风格元素
  const topDivider = `
    <div style="text-align: center; margin: 20px 0 30px 0;">
      <div style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, transparent, #000, transparent);"></div>
    </div>
  `;

  // 构建比赛信息框 - 极简卡片风格
  const infoBox = `
    <section style="background: #fff; padding: 35px 30px; margin: 30px 0; border: 1px solid #e8e8e8; border-radius: 12px; text-align: center;">
      <h1 style="font-size: 28px; margin: 0 0 25px 0; font-weight: 600; color: #fff; letter-spacing: 0.5px; line-height: 1.4; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">${data.title || '⚽ 比赛战报'}</h1>

      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
        ${data.date ? `<span style="background: #f5f5f5; padding: 8px 16px; border-radius: 20px; font-size: 14px; color: #666; letter-spacing: 0.5px;">${data.date}</span>` : ''}
        ${data.opponent ? `<span style="background: #000; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">${data.opponent}</span>` : ''}
        ${data.location ? `<span style="background: #f5f5f5; padding: 8px 16px; border-radius: 20px; font-size: 14px; color: #666;">📍 ${data.location}</span>` : ''}
      </div>

      ${data.score ? `
        <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
          <div style="font-size: 36px; font-weight: 700; color: #fff; letter-spacing: 2px;">${data.score}</div>
        </div>
      ` : ''}
    </section>
  `;

  // MVP展示 - 优雅卡片风格
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; margin: 35px 0; border-radius: 12px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
        <p style="margin: 0 0 10px 0; color: #8b4513; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">MVP</p>
        <div style="font-size: 26px; font-weight: 600; color: #5a3e2b; letter-spacing: 1px;">${data.mvp}</div>
      </section>
    `;
  }

  // 引用样式分隔线
  const sectionDivider = `
    <div style="text-align: center; margin: 40px 0;">
      <div style="display: inline-block; width: 60px; height: 1px; background: #e0e0e0;"></div>
    </div>
  `;

  // 构建出勤名单 - 极简列表风格
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: #fafafa; padding: 30px; margin: 35px 0; border-radius: 8px; border-left: 3px solid #000;">
        <p style="margin: 0 0 15px 0; color: #000; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">出勤名单 · ${data.attendance.length}人</p>
        <div style="line-height: 2; color: #666; font-size: 15px; text-align: justify;">${data.attendance.join(' · ')}</div>
      </section>
    `;
  }

  // 构建照片展示区 - 杂志风格
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || (index === 0 ? '精彩瞬间' : '');
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: ${index === 0 ? '0' : '40px'} 0 0 0;">
          <img src="${imgPath}" alt="${caption}" style="width: 100%; display: block; border-radius: 8px;" />
          ${caption ? `<p style="text-align: center; color: #999; font-size: 12px; margin: 12px 0 0 0; letter-spacing: 1px;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 50px 0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="margin: 0; color: #000; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">PHOTOS</p>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // 页脚 - 极简风格
  const footer = `
    <section style="margin: 60px 0 40px 0; padding: 30px 0; border-top: 1px solid #e8e8e8; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #000; font-size: 14px; font-weight: 500; letter-spacing: 2px;">感谢阅读</p>
      <p style="margin: 0; color: #999; font-size: 12px; letter-spacing: 1px;">
        知己足球俱乐部，每周末与你相伴
      </p>
      <div style="margin-top: 20px;">
        <span style="display: inline-block; width: 30px; height: 1px; background: #e0e0e0;"></span>
      </div>
    </section>
  `;

  // 组装完整文章 - ins风格布局
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif; background: #fff; padding: 40px 30px; color: #333;">
      ${logoSection}
      ${topDivider}
      ${infoBox}
      ${mvpSection}
      ${sectionDivider}

      <section style="line-height: 1.9; color: #444; font-size: 16px; text-align: justify;">
        ${contentHTML}
      </section>

      ${sectionDivider}
      ${attendanceSection}
      ${photosSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
