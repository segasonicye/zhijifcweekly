/**
 * 微信公众号文章模板 - 绿茵风云 (Field)
 * 特点：深沉绿茵、纹理质感、职业赛场、广播级视觉
 */

const path = require('path');

/**
 * 获取Green Storm风格文章模板
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // 1. Logo - 徽章风格
  const logoSection = `
    <div style="text-align: center; margin: 0 0 30px 0; padding: 30px; background: url('https://w.wallhaven.cc/full/kw/wallhaven-kwp8p6.jpg') center/cover; border-radius: 8px; position: relative; overflow: hidden;">
      <div style="position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(19, 78, 94, 0.85);"></div>
      <div style="position: relative; z-index: 1; border: 2px solid rgba(255,255,255,0.3); display: inline-block; padding: 15px 30px; border-radius: 4px;">
        <p style="margin: 0; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">🛡️ CLUB BADGE SPOT 🛡️</p>
      </div>
    </div>
  `;

  // 2. 比赛信息 - 记分牌风格
  const infoBox = `
    <section style="background: linear-gradient(to bottom, #134e5e, #71b280); padding: 5px; margin: 30px 0; border-radius: 12px; box-shadow: 0 15px 35px rgba(113, 178, 128, 0.3);">
      <div style="background: #fff; padding: 30px 20px; border-radius: 10px; text-align: center; position: relative; overflow: hidden;">
        <!-- 背景纹理 -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: #134e5e;"></div>
        
        <h1 style="font-size: 28px; margin: 15px 0 25px 0; font-weight: 900; color: #134e5e; line-height: 1.3;">
          ${data.title || 'MATCH DAY REPORT'}
        </h1>

        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 25px;">
           <div style="text-align: center; flex: 1;">
              <div style="font-size: 12px; color: #999; margin-bottom: 5px; font-weight: 700;">DATE</div>
              <div style="font-size: 14px; color: #333; font-weight: 600;">${data.date || '-'}</div>
           </div>
           <div style="width: 1px; background: #ddd;"></div>
           <div style="text-align: center; flex: 1;">
              <div style="font-size: 12px; color: #999; margin-bottom: 5px; font-weight: 700;">AVERSARY</div>
              <div style="font-size: 14px; color: #333; font-weight: 600;">${data.opponent || '-'}</div>
           </div>
        </div>

        ${data.score ? `
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
             <div style="font-size: 40px; font-weight: 900; color: #134e5e;">${data.score.split(/[-:]/)[0] || '0'}</div>
             <div style="font-size: 18px; color: #71b280; font-weight: 700;">FT</div>
             <div style="font-size: 40px; font-weight: 900; color: #134e5e;">${data.score.split(/[-:]/)[1] || '0'}</div>
          </div>
        ` : ''}
      </div>
    </section>
  `;

  // 3. MVP - 半场最佳
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: #1a2a33; padding: 30px; margin: 30px 0; border-radius: 4px; text-align: center; border-left: 6px solid #71b280; position: relative;">
        <!-- 装饰 -->
        <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 40px; opacity: 0.1; color: #fff; font-weight: 900;">MVP</div>
        
        <p style="margin: 0 0 10px 0; color: #71b280; font-size: 12px; letter-spacing: 2px; font-weight: 700;">MAN OF THE MATCH</p>
        <div style="font-size: 32px; font-weight: 800; color: #fff; text-transform: uppercase;">${data.mvp}</div>
        <div style="width: 40px; height: 3px; background: #71b280; margin: 15px auto 0 auto;"></div>
      </section>
    `;
  }

  // 4. 分隔 - 足球术语
  const divider = `
    <div style="text-align: center; margin: 45px 0; border-bottom: 1px solid #ddd; line-height: 0.1em;">
      <span style="background:#fff; padding:0 15px; color:#134e5e; font-weight:700; font-size:14px; letter-spacing:1px;">MATCH ANALYSIS</span>
    </div>
  `;

  // 5. 出勤 - 阵容表
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: #f4f7f6; padding: 25px; margin: 30px 0; border-radius: 8px;">
         <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 15px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #134e5e; display: inline-block; padding-bottom: 5px;">
           Starting XI & Subs
         </h3>
         <div style="line-height: 2.2; color: #555; font-size: 15px;">
           ${data.attendance.map(name => `<span style="border-bottom: 1px dashed #ccc; margin-right: 12px;">${name}</span>`).join(' ')}
         </div>
      </section>
    `;
  }

  // 6. 照片 - 胶片感
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: 40px 0; padding: 10px; background: #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transform: rotate(${index % 2 === 0 ? '-1deg' : '1deg'});">
          <img src="${imgPath}" alt="${caption}" style="width: 100%; display: block; filter: sepia(0.1) contrast(1.1);" />
          ${caption ? `<p style="text-align: center; color: #666; font-size: 13px; margin: 12px 0 5px 0; font-weight: 600; font-family: serif; font-style: italic;">"${caption}"</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 60px 0;">
        <div style="background: #134e5e; color: #fff; padding: 10px 20px; display: inline-block; font-weight: 800; transform: skewX(-15deg); margin-bottom: 30px;">
           <span style="display: block; transform: skewX(15deg);">HIGHLIGHTS</span>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // 7. 本文
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; padding: 40px 25px; color: #333;">
      ${logoSection}
      ${infoBox}
      ${mvpSection}
      ${divider}

      <section style="line-height: 1.8; color: #2c3e50; font-size: 16px; text-align: justify; font-weight: 400;">
        ${contentHTML}
      </section>

      ${divider}
      ${attendanceSection}
      ${photosSection}
      
      <div style="text-align: center; margin-top: 60px; padding-top: 30px; border-top: 4px solid #134e5e;">
        <p style="font-weight: 900; color: #134e5e; font-size: 16px; margin: 0;">知己足球俱乐部，每周末与你相伴</p>
      </div>
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
