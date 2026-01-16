/**
 * 微信公众号文章模板 - 热血外战风格
 * 专为外战设计，突出对抗性和战斗氛围
 * 特点：激情、热烈、战斗感强、视觉冲击力大
 */

const path = require('path');

/**
 * 获取热血外战风格模板
 * @param {Object} data - 比赛数据
 * @param {String} contentHTML - 转换后的HTML内容
 * @param {Array} photos - 照片数组
 * @param {String} logoPath - logo路径（可选）
 */
function getArticleTemplate(data, contentHTML, photos = [], logoPath = null) {
  // 判断是否为外战
  const isExternalMatch = !data.opponent || data.opponent.includes('内战') === false;

  // Logo部分 - 战斗风格占位
  const logoSection = `
    <div style="text-align: center; margin: 0 0 30px 0; padding: 25px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border: 3px solid #ff6b6b; border-radius: 12px; box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);">
      <p style="margin: 0; color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">⚔️ 上传 Logo 后删除此框</p>
    </div>
  `;

  // 顶部战斗装饰
  const topBattleDecor = `
    <div style="text-align: center; margin: 20px 0;">
      <div style="display: inline-flex; align-items: center; gap: 15px;">
        <div style="width: 50px; height: 3px; background: linear-gradient(90deg, transparent, #ff6b6b);"></div>
        <span style="font-size: 24px;">⚔️</span>
        <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #ff6b6b, transparent);"></div>
      </div>
    </div>
  `;

  // 构建比赛信息框 - 战斗风格
  const infoBox = `
    <section style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 35px 30px; margin: 30px 0; border-radius: 16px; text-align: center; box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4); position: relative; overflow: hidden;">
      <!-- 背景装饰 -->
      <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>

      <h1 style="font-size: 30px; margin: 0 0 25px 0; font-weight: 800; color: #fff; letter-spacing: 1px; line-height: 1.4; text-shadow: 0 2px 10px rgba(0,0,0,0.2); position: relative; z-index: 1;">${data.title || '⚽ 热血外战'}</h1>

      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-bottom: 25px; position: relative; z-index: 1;">
        ${data.date ? `<span style="background: rgba(255,255,255,0.25); padding: 10px 20px; border-radius: 25px; font-size: 14px; color: #fff; font-weight: 600; backdrop-filter: blur(10px);">📅 ${data.date}</span>` : ''}
        ${data.opponent ? `<span style="background: rgba(255,255,255,0.25); padding: 10px 20px; border-radius: 25px; font-size: 14px; color: #fff; font-weight: 600; backdrop-filter: blur(10px);">⚔️ ${data.opponent}</span>` : ''}
        ${data.location ? `<span style="background: rgba(255,255,255,0.25); padding: 10px 20px; border-radius: 25px; font-size: 14px; color: #fff; font-weight: 600; backdrop-filter: blur(10px);">📍 ${data.location}</span>` : ''}
      </div>

      ${data.score ? `
        <div style="background: linear-gradient(135deg, #ffd93d 0%, #ff9500 100%); padding: 20px 30px; border-radius: 12px; box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4); position: relative; z-index: 1;">
          <div style="font-size: 42px; font-weight: 900; color: #fff; letter-spacing: 3px; text-shadow: 0 3px 10px rgba(0,0,0,0.3);">${data.score}</div>
        </div>
      ` : ''}
    </section>
  `;

  // MVP展示 - 热血英雄风格
  let mvpSection = '';
  if (data.mvp) {
    mvpSection = `
      <section style="background: linear-gradient(135deg, #ffd93d 0%, #ff9500 100%); padding: 35px 30px; margin: 35px 0; border-radius: 16px; text-align: center; box-shadow: 0 12px 30px rgba(255, 149, 0, 0.4); position: relative; overflow: hidden;">
        <!-- 装饰元素 -->
        <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 40px; opacity: 0.3;">🏆</div>

        <p style="margin: 0 0 15px 0; color: #fff; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; text-shadow: 0 2px 5px rgba(0,0,0,0.2);">本场最佳 · MVP</p>
        <div style="font-size: 32px; font-weight: 800; color: #fff; letter-spacing: 2px; text-shadow: 0 3px 10px rgba(0,0,0,0.3); position: relative; z-index: 1;">${data.mvp}</div>
        <div style="margin-top: 15px; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">🌟 战斗英雄 🌟</div>
      </section>
    `;
  }

  // 战斗分隔线
  const battleDivider = `
    <div style="text-align: center; margin: 40px 0;">
      <div style="display: inline-flex; align-items: center; gap: 20px;">
        <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #ff6b6b);"></div>
        <span style="font-size: 20px; color: #ff6b6b;">⚡</span>
        <div style="width: 80px; height: 2px; background: linear-gradient(90deg, #ff6b6b, transparent);"></div>
      </div>
    </div>
  `;

  // 构建出勤名单 - 战斗阵容风格
  let attendanceSection = '';
  if (data.attendance && data.attendance.length > 0) {
    attendanceSection = `
      <section style="background: linear-gradient(135deg, #2d3436 0%, #000000 100%); padding: 30px; margin: 35px 0; border-radius: 12px; border-left: 5px solid #ff6b6b; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <span style="font-size: 24px;">🛡️</span>
          <p style="margin: 0; color: #ffd93d; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">出勤名单 · ${data.attendance.length}人</p>
        </div>
        <div style="line-height: 2.2; color: #fff; font-size: 15px;">${data.attendance.join(' · ')}</div>
      </section>
    `;
  }

  // 构建照片展示区 - 战斗镜头风格
  let photosSection = '';
  if (photos.length > 0) {
    const photosHTML = photos.map((photo, index) => {
      const imgPath = typeof photo === 'string' ? photo : (photo.path || '');
      const caption = photo.caption || (index === 0 ? '战斗瞬间' : '');
      const imgName = path.basename(imgPath);

      return `
        <div style="margin: ${index === 0 ? '0' : '35px'} 0 0 0;">
          <div style="position: relative;">
            <img src="${imgName}" alt="${caption}" style="width: 100%; display: block; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);" />
            <div style="position: absolute; top: 15px; right: 15px; background: rgba(255, 107, 107, 0.9); color: #fff; padding: 8px 15px; border-radius: 20px; font-size: 12px; font-weight: 700; backdrop-filter: blur(10px);">
              ${index + 1}
            </div>
          </div>
          ${caption ? `<p style="text-align: center; color: #ff6b6b; font-size: 14px; margin: 15px 0 0 0; font-weight: 600; letter-spacing: 1px;">${caption}</p>` : ''}
        </div>
      `;
    }).join('');

    photosSection = `
      <section style="margin: 50px 0;">
        <div style="text-align: center; margin-bottom: 35px;">
          <div style="display: inline-flex; align-items: center; gap: 15px;">
            <span style="font-size: 28px;">📸</span>
            <p style="margin: 0; color: #ff6b6b; font-size: 18px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700;">战斗镜头</p>
            <span style="font-size: 28px;">📸</span>
          </div>
        </div>
        ${photosHTML}
      </section>
    `;
  }

  // 页脚 - 热血风格
  const footer = `
    <section style="background: linear-gradient(135deg, #2d3436 0%, #000000 100%); padding: 40px 30px; margin: 60px 0 40px 0; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; overflow: hidden;">
      <!-- 装饰元素 -->
      <div style="position: absolute; top: -20px; right: -20px; font-size: 80px; opacity: 0.1;">⚽</div>
      <div style="position: absolute; bottom: -20px; left: -20px; font-size: 80px; opacity: 0.1;">🔥</div>

      <p style="margin: 0 0 10px 0; color: #ffd93d; font-size: 18px; font-weight: 700; letter-spacing: 2px; position: relative; z-index: 1;">感谢阅读</p>
      <p style="margin: 0 0 15px 0; color: #fff; font-size: 14px; letter-spacing: 1px; position: relative; z-index: 1;">
        知己足球俱乐部 · 每周末与你相约
      </p>
      <div style="display: inline-flex; align-items: center; gap: 10px; margin-top: 20px; position: relative; z-index: 1;">
        <span style="font-size: 20px;">⚔️</span>
        <span style="color: #ff6b6b; font-size: 16px; font-weight: 600; letter-spacing: 2px;">战斗到底</span>
        <span style="font-size: 20px;">⚔️</span>
      </div>
    </section>
  `;

  // 组装完整文章 - 热血外战布局
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif; background: #fff; padding: 40px 30px; color: #333;">
      ${logoSection}
      ${topBattleDecor}
      ${infoBox}
      ${mvpSection}
      ${battleDivider}

      <section style="line-height: 1.9; color: #2d3436; font-size: 16px; text-align: justify;">
        ${contentHTML}
      </section>

      ${battleDivider}
      ${attendanceSection}
      ${photosSection}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
