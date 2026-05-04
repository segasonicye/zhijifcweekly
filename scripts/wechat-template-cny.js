/**
 * 微信公众号文章模板 - 新春红火版 (CNY Festive Style)
 * 专为拜年、庆功等红火场景设计
 */

const path = require('path');

/**
 * 获取文章模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 */
function getArticleTemplate(data, contentHTML, photos = []) {
  // 1. 提取海报图 (第一张图) 放到最顶部
  let posterSection = '';
  const remainingPhotos = [...photos];
  
  if (remainingPhotos.length > 0) {
    const poster = remainingPhotos.shift();
    const imgPath = typeof poster === 'string' ? poster : (poster.path || '');
    posterSection = `
      <div style="margin: -20px -20px 30px -20px; border-radius: 0 0 20px 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(214, 48, 49, 0.3);">
        <img src="${imgPath}" style="width: 100%; display: block;" />
      </div>
    `;
  }

  // Logo部分 - 新春特别版
  const logoSection = `
    <div style="text-align: center; margin: 0 0 25px 0; padding: 20px; background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); border: 2px solid #d63031; border-radius: 15px;">
      <p style="margin: 0; color: #d63031; font-size: 14px; font-weight: 700; letter-spacing: 2px;">🏮 知己足球俱乐部 🏮</p>
    </div>
  `;

  // 构建标题框 - 极度红火版
  const infoBox = `
    <section style="background: linear-gradient(135deg, #d63031 0%, #b33939 100%); padding: 30px 20px; border-radius: 20px; margin: 25px 0; color: #fff; box-shadow: 0 10px 30px rgba(214, 48, 49, 0.4); border: 2px solid #f1c40f; position: relative; overflow: hidden;">
      <!-- 背景装饰 -->
      <div style="position: absolute; top: -10px; right: -10px; font-size: 60px; opacity: 0.1; color: #f1c40f;">福</div>
      
      <h1 style="text-align: center; font-size: 28px; margin: 0; font-weight: 900; color: #f1c40f; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${data.title || '🧨 新春快乐'}</h1>
    </section>
  `;

  // 构建照片展示区
  let photosSection = '';
  if (remainingPhotos.length > 0) {
    const photosHTML = remainingPhotos.map(photo => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || '';
      return `
        <div style="margin: 20px 0;">
          <img src="${imgPath}" alt="${caption}" style="width: 100%; display: block; border-radius: 12px; border: 3px solid #f1c40f; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" />
          ${caption ? `<p style="text-align: center; color: #d63031; font-size: 14px; margin: 10px 0 0 0; font-weight: 600;">✨ ${caption} ✨</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 35px 0; padding: 20px; background: #fffaf0; border-radius: 15px; border: 1px solid #fab1a0;">
        <h3 style="text-align: center; color: #d63031; font-size: 20px; margin-bottom: 20px;">📸 精彩瞬间</h3>
        ${photosHTML}
      </section>
    `;
  }

  // 页脚 - 喜庆结束
  const footer = `
    <section style="background: linear-gradient(135deg, #d63031 0%, #b33939 100%); padding: 30px 20px; margin: 40px 0 0 0; border-radius: 20px; text-align: center; border: 2px solid #f1c40f; color: #fff;">
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #f1c40f;">🐉 祝大家马年大吉 🐉</p>
      <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        知己足球俱乐部 · 莫愁前路无知己 ⚽
      </p>
    </section>
  `;

  // 组装完整文章
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'STHeiti', 'Microsoft YaHei', sans-serif; background: #fff; padding: 20px; border-radius: 20px; border: 2px solid #eee;">
      ${posterSection}
      ${logoSection}
      ${infoBox}
      <section style="padding: 10px 5px; line-height: 2.0; color: #2d3436; font-size: 16px;">
        ${contentHTML}
      </section>
      ${photosSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
