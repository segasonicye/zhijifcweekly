#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - Classic风格版本 (经典)
 */

const { getArticleTemplate } = require('./wechat-template');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
  styleName: 'Classic (经典风格)',
  templateName: 'default',
  getTemplate: getArticleTemplate,
  themeColor: 'blue',
  markdownStyles: {
    h3: (match, p1) => `<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">${p1}</h3>`,
    h2: (match, p1) => `<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">${p1}</h2>`,
    strong: '<strong>$1</strong>',
    link: 'color: #1890ff; text-decoration: none;',
    p: 'line-height: 1.8; margin: 10px 0; color: #555;'
  },
  stepsDesc: {
    startIcon: '📮',
    tips: [
      '经典风格，兼容性最好',
      '适合所有类型比赛',
      '预览文件名: wechat-*.html (无后缀)'
    ]
  }
});
