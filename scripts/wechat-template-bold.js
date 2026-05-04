/**
 * 微信公众号文章模板 - 视觉冲击版 (Bold/Impact)
 * 特点：高对比度、渐变背景、毛玻璃效果、大图模式
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

  // Hero 头图区 - 全宽渐变背景
  const heroSection = `
    <section style="margin: -20px -20px 30px -20px; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); position: relative; overflow: hidden;">
      <!-- 装饰性光晕 -->
      <div style="position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30%; left: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); border-radius: 50%;"></div>
      
      <!-- Logo -->
      <div style="text-align: center; position: relative; z-index: 1;">
        <img src="${logoSrc}" alt="知己足球俱乐部 Logo" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.3); background: white;" />
      </div>
      
      <!-- 大标题 -->
      <h1 style="text-align: center; font-size: 32px; margin: 25px 0 15px 0; font-weight: 900; color: white; text-shadow: 0 4px 20px rgba(0,0,0,0.3); position: relative; z-index: 1;">${data.title || '⚽ 比赛战报'}</h1>
      
      <!-- 副标题装饰线 -->
      <div style="width: 60px; height: 4px; background: rgba(255,255,255,0.6); margin: 0 auto 20px auto; border-radius: 2px;"></div>
      
      ${data.opponent ? `<p style="text-align: center; color: rgba(255,255,255,0.9); font-size: 18px; margin: 0; font-weight: 600;">VS ${data.opponent}</p>` : ''}
    </section>
  `;

  // 毛玻璃信息卡片
  const infoCards = `
    <section style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
      ${data.date ? `
        <div style="background: rgba(102, 126, 234, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(102, 126, 234, 0.2); padding: 20px; border-radius: 16px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">📅</div>
          <div style="color: #667eea; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">日期</div>
          <div style="color: #333; font-size: 16px; font-weight: 700; margin-top: 5px;">${data.date}</div>
        </div>
      ` : ''}
      
      ${showScore && data.score ? `
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);">
          <div style="font-size: 24px; margin-bottom: 5px;">⚽</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">比分</div>
          <div style="color: white; font-size: 28px; font-weight: 900; margin-top: 5px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${data.score}</div>
        </div>
      ` : ''}
      
      ${data.location ? `
        <div style="background: rgba(118, 75, 162, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(118, 75, 162, 0.2); padding: 20px; border-radius: 16px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">📍</div>
          <div style="color: #764ba2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">地点</div>
          <div style="color: #333; font-size: 16px; font-weight: 700; margin-top: 5px;">${data.location}</div>
        </div>
      ` : ''}
      
      ${data.weather ? `
        <div style="background: rgba(255, 193, 7, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 193, 7, 0.2); padding: 20px; border-radius: 16px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 5px;">🌤️</div>
          <div style="color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">天气</div>
          <div style="color: #333; font-size: 16px; font-weight: 700; margin-top: 5px;">${data.weather}</div>
        </div>
      ` : ''}
    </section>
  `;

  // MVP 区 - 发光效果
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="margin: 30px 0; padding: 30px 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 20px 50px rgba(240, 147, 251, 0.4);">
        <!-- 发光背景 -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); border-radius: 50%;"></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="font-size: 40px; margin-bottom: 10px;">⭐</div>
          <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">本场 MVP</div>
          <div style="color: white; font-size: 36px; font-weight: 900; text-shadow: 0 4px 20px rgba(0,0,0,0.3);">${data.mvp}</div>
        </div>
      </section>
    `;
  }

  // 正文区 - 优化排版
  const contentSection = `
    <section style="padding: 10px 0; line-height: 2; color: #2d3748; font-size: 16px;">
      ${contentHTML}
    </section>
  `;

  // 照片墙 - 大图模式
  let photoGallery = '';
  if (photos && photos.length > 0) {
    const photoItems = photos.map((photo, index) => {
      const photoPath = typeof photo === 'string' ? photo : photo.path;
      return `
        <div style="margin: 20px 0; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
          <img src="${photoPath}" style="width: 100%; display: block;" />
        </div>
      `;
    }).join('');
    
    photoGallery = `
      <section style="margin: 30px 0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; padding: 10px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 25px; font-weight: 700; font-size: 14px; box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);">📸 精彩瞬间</span>
        </div>
        ${photoItems}
      </section>
    `;
  }

  // 页脚 - 渐变签名区
  const footer = `
    <section style="margin: 40px -20px -20px -20px; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f093fb, #f5576c, #667eea);"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.9;">⚽</div>
        <p style="margin: 0 0 10px 0; color: white; font-size: 20px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">知己足球俱乐部</p>
        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">每周末与你相约 · 热爱不止于球场</p>
        
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
          <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px; letter-spacing: 1px;">— 感谢阅读 —</p>
        </div>
      </div>
    </section>
  `;

  // 组装完整文章
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #ffffff; padding: 20px; border-radius: 20px; box-shadow: 0 25px 80px rgba(0,0,0,0.15);">
      ${heroSection}
      ${infoCards}
      ${mvpSection}
      ${contentSection}
      ${photoGallery}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
