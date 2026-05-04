/**
 * 暗黑科技风文章模板
 * 深色背景 + 霓虹绿/蓝配色，适合技术分享、工具推荐
 */

function getArticleTemplate(data, contentHTML, photos = [], logoPath = null, options = {}) {
  const title = data.title || '文章标题';
  const author = data.author || '小叶助手';
  const date = data.date || '';

  // 顶部渐变装饰条
  const topBar = `<div style="height: 4px; background: linear-gradient(90deg, #22c55e, #3b82f6, #a855f7); border-radius: 2px; margin-bottom: 0;"></div>`;

  // 页头
  const header = `
    <section style="background: #0a0e1a; padding: 35px 25px 30px; border-radius: 0 0 15px 15px; margin: 0 0 20px 0; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%); pointer-events: none;"></div>
      <div style="border-left: 4px solid #22c55e; padding-left: 18px; margin-bottom: 18px;">
        <h1 style="font-size: 22px; margin: 0; font-weight: 800; line-height: 1.5; color: #f1f5f9;">${title}</h1>
      </div>
      <div style="display: flex; gap: 18px; font-size: 13px; color: #64748b; padding-left: 22px;">
        ${author ? `<span style="color: #22c55e;">✍️ ${author}</span>` : ''}
        ${date ? `<span>📅 ${date}</span>` : ''}
      </div>
    </section>
  `;

  // 正文区域样式覆盖（深色适配）
  const bodyWrapper = `
    <section style="padding: 5px 15px; line-height: 1.95; color: #e2e8f0; font-size: 15px; background: #0f172a; border-radius: 12px; margin: 0 0 20px 0;">
      <div style="padding: 20px 10px;">
        ${contentHTML}
      </div>
    </section>
  `;

  // 页脚
  const footer = `
    <section style="background: #0a0e1a; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid rgba(34,197,94,0.15);">
      <div style="height: 2px; background: linear-gradient(90deg, transparent, #22c55e, #3b82f6, transparent); margin-bottom: 20px; border-radius: 1px;"></div>
      <p style="margin: 0; color: #22c55e; font-size: 15px; font-weight: 600;">🍃 感谢阅读</p>
      <p style="margin: 12px 0 0 0; color: #475569; font-size: 13px;">
        由小叶助手推荐 · Powered by OpenClaw
      </p>
    </section>
  `;

  // 组装
  const article = `
    <div style="max-width: 650px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0f172a; padding: 0; border-radius: 20px; overflow: hidden;">
      ${topBar}
      ${header}
      ${bodyWrapper}
      ${footer}
    </div>
  `;

  return article;
}

module.exports = { getArticleTemplate };
