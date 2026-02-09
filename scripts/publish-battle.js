#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - 热血外战风格版本
 */

const { getArticleTemplate } = require('./wechat-template-battle');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
  styleName: 'Battle (热血外战)',
  templateName: 'battle',
  getTemplate: getArticleTemplate,
  themeColor: 'red',
  markdownStyles: {
    h3: (match, p1) => `<h3 style="font-size: 19px; font-weight: 700; margin: 30px 0 15px; color: #ff6b6b; letter-spacing: 1px; border-left: 4px solid #ff6b6b; padding-left: 12px;">${p1}</h3>`,
    h2: (match, p1) => `<h2 style="font-size: 22px; font-weight: 800; margin: 35px 0 20px; color: #2d3436; letter-spacing: 1px; border-bottom: 3px solid #ff6b6b; padding-bottom: 12px;">${p1}</h2>`,
    strong: '<strong style="color: #ff6b6b; font-weight: 700;">$1</strong>',
    link: 'color: #ff6b6b; text-decoration: none; border-bottom: 2px solid #ff6b6b; font-weight: 600;',
    p: 'line-height: 1.9; margin: 15px 0; color: #2d3436; text-align: justify;',
    img: 'width: 100%; max-width: 600px; display: block; margin: 20px auto; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);'
  },
  stepsDesc: {
    startIcon: '🔥',
    tips: [
      '热血风格专为外战设计',
      '红色主题营造激情战斗氛围',
      '预览文件名: *-battle.html'
    ]
  }
});
