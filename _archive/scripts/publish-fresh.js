#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - Fresh风格版本 (清新草地风)
 */

const { getArticleTemplate } = require('./wechat-template-fresh');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
    styleName: 'Fresh (清新草地)',
    templateName: 'fresh',
    getTemplate: getArticleTemplate,
    themeColor: 'green',
    markdownStyles: {
        h3: (match, p1) => `<h3 style="font-size: 17px; font-weight: 700; margin: 25px 0 15px; color: #2ecc71;">${p1}</h3>`,
        h2: (match, p1) => `<h2 style="font-size: 20px; font-weight: 700; margin: 30px 0 20px; color: #27ae60; border-left: 4px solid #2ecc71; padding-left: 12px;">${p1}</h2>`,
        strong: '<strong style="color: #27ae60;">$1</strong>',
        p: 'line-height: 1.8; margin: 15px 0;'
    },
    stepsDesc: {
        startIcon: '🌿',
        tips: [
            'Fresh风格适合日常战报',
            '绿色主调，清新自然',
            '预览文件名: *-fresh.html'
        ]
    }
});
