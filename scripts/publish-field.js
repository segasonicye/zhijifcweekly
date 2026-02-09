#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - Green Storm风格版本 (绿茵风云)
 */

const { getArticleTemplate } = require('./wechat-template-field');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
    styleName: 'Green Storm (绿茵风云)',
    templateName: 'field',
    getTemplate: getArticleTemplate,
    themeColor: 'green',
    markdownStyles: {
        h3: (match, p1) => `<h3 style="font-size: 18px; font-weight: 800; margin: 30px 0 15px; color: #134e5e; text-transform: uppercase;">${p1}</h3>`,
        h2: (match, p1) => `<h2 style="font-size: 24px; font-weight: 900; margin: 40px 0 20px; color: #000; letter-spacing: -1px; border-left: 6px solid #71b280; padding-left: 15px; line-height: 1;">${p1}</h2>`,
        strong: '<strong style="color: #134e5e; background: rgba(113, 178, 128, 0.2); padding: 0 4px;">$1</strong>',
        p: 'line-height: 1.8; margin: 15px 0;'
    },
    stepsDesc: {
        startIcon: '⚽',
        tips: [
            'Field风格适合正式比赛',
            '深绿主调，报纸质感',
            '预览文件名: *-field.html'
        ]
    }
});
