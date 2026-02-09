#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - ins风格版本
 */

const { getArticleTemplate } = require('./wechat-template-ins');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
  styleName: 'Ins Style (极简)',
  templateName: 'ins',
  getTemplate: getArticleTemplate,
  themeColor: 'cyan',
  markdownStyles: {
    h3: (match, p1) => `<h3 style="font-size: 17px; font-weight: 600; margin: 30px 0 15px; color: #000; letter-spacing: 1px;">${p1}</h3>`,
    h2: (match, p1) => `<h2 style="font-size: 20px; font-weight: 600; margin: 35px 0 20px; color: #000; letter-spacing: 1px; border-bottom: 1px solid #e8e8e8; padding-bottom: 15px;">${p1}</h2>`,
    strong: '<strong style="color: #000; font-weight: 600;">$1</strong>',
    link: 'color: #667eea; text-decoration: none; border-bottom: 1px solid #667eea;',
    p: 'line-height: 1.9; margin: 15px 0; color: #444; text-align: justify;'
  },
  stepsDesc: {
    startIcon: '📱',
    tips: [
      'Ins风格注重留白和呼吸感',
      '配色简洁专业，黑白为主',
      '预览文件名: *-ins.html'
    ]
  }
});
