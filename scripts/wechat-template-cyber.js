/**
 * 微信公众号文章模板 - 赛博朋克风格 (Cyberpunk)
 * 特点：深色模式、霓虹光效、科技感、高对比度
 */

/**
 * 获取Cyberpunk风格文章模板
 */
const path = require('path');

function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // 1. Logo - 霓虹边框
  const logoSection = `
    <div style="text-align: center; margin: 0 0 40px 0; padding: 25px; background: #0f0f13; border: 1px solid #00f3ff; border-radius: 4px; box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);">
      <p style="margin: 0; color: #00f3ff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">📷 UPLOAD LOGO HERE</p>
    </div>
  `;

  // 2. 比赛信息 - HUD风格
  const infoBox = `
    <section style="background: #1a1a20; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center; border: 1px solid #333; box-shadow: 0 0 30px rgba(188, 19, 254, 0.1); position: relative; overflow: hidden;">
      <!-- 角标装饰 -->
      <div style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-top: 2px solid #00f3ff; border-left: 2px solid #00f3ff;"></div>
      <div style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; border-bottom: 2px solid #bc13fe; border-right: 2px solid #bc13fe;"></div>

      <h1 style="font-size: 32px; margin: 0 0 20px 0; font-weight: 800; color: #fff; letter-spacing: 1px; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);">
        ${data.title || 'CYBER MATCH'}
      </h1>

      <div style="display: flex; justify-content: center; opacity: 0.8; margin-bottom: 30px;">
        <span style="font-size: 12px; color: #00f3ff; letter-spacing: 2px;">/// SYSTEM.LOG_ID_${data.date ? data.date.replace(/-/g, '') : 'Unknown'} ///</span>
      </div>

      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 15px; margin-bottom: 30px;">
         ${data.date ? `<span style="border: 1px solid #bc13fe; color: #bc13fe; padding: 6px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px;">DATE: ${data.date}</span>` : ''}
         ${data.opponent ? `<span style="border: 1px solid #bc13fe; color: #bc13fe; padding: 6px 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px;">TARGET: ${data.opponent}</span>` : ''}
      </div>

      ${data.score ? `
        <div style="background: rgba(0, 0, 0, 0.5); padding: 20px; border: 1px solid #00f3ff; display: inline-block; box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);">
          <div style="font-size: 48px; font-weight: 900; color: #fff; text-shadow: 2px 2px 0px #00f3ff, -2px -2px 0px #bc13fe; letter-spacing: 4px;">${data.score}</div>
        </div>
      ` : ''}
    </section>
  `;

  // 3. MVP - 霓虹卡片
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(90deg, #120429 0%, #000 100%); padding: 30px; margin: 30px 0; border-radius: 4px; border-left: 4px solid #f600ff;">
        <p style="margin: 0 0 10px 0; color: #f600ff; font-size: 12px; letter-spacing: 4px; font-weight: 700;">MVP_DETECTED</p>
        <div style="font-size: 36px; font-weight: 800; color: #fff; text-shadow: 0 0 10px #f600ff;">${data.mvp}</div>
      </section>
    `;
  }

  // 4. 分隔线 - 激光扫描
  const divider = `
    <div style="height: 2px; background: linear-gradient(90deg, transparent, #00f3ff, transparent); margin: 50px 0; opacity: 0.5;"></div>
  `;

  // 5. 出勤 - 数据流
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: #111; padding: 25px; margin: 30px 0; border: 1px solid #333;">
         <h3 style="margin: 0 0 20px 0; color: #00f3ff; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">
           > SQUAD_LIST Loaded [${data.attendance.length}]
         </h3>
         <div style="line-height: 2; color: #aaa; font-family: monospace; font-size: 14px;">
           ${data.attendance.map(name => `<span style="margin-right: 15px;">[${name}]</span>`).join('')}
         </div>
      </section>
    `;
  }

  // 6. 照片 - 赛博边框
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: 40px 0; position: relative;">
          <div style="position: absolute; top: -5px; left: -5px; width: 20px; height: 20px; border-top: 2px solid #f600ff; border-left: 2px solid #f600ff; z-index: 1;"></div>
          <img src="${imgPath}" alt="${caption}" style="width: 100%; display: block; filter: contrast(1.1) brightness(1.1);" />
          <div style="position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px; border-bottom: 2px solid #00f3ff; border-right: 2px solid #00f3ff; z-index: 1;"></div>
          ${caption ? `<p style="text-align: right; color: #00f3ff; font-size: 12px; margin: 10px 0 0 0; font-family: monospace;">>> ${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 60px 0;">
        <div style="border-bottom: 1px solid #333; margin-bottom: 30px; padding-bottom: 10px;">
          <span style="background: #f600ff; color: #000; padding: 4px 12px; font-size: 12px; font-weight: 800;">VISUAL_DATA</span>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // 7. 组装
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #050505; padding: 40px 25px; color: #ddd;">
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      ${divider}

      <section style="line-height: 1.8; color: #bbb; font-size: 16px; text-align: justify;">
        ${contentHTML}
      </section>

      ${divider}
      ${attendanceSection}
      ${photosSection}
      
      <div style="text-align: center; margin-top: 60px; opacity: 0.7; font-size: 13px; letter-spacing: 2px; color: #00f3ff;">
        知己足球俱乐部，每周末与你相伴
      </div>
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
