#!/usr/bin/env node

/**
 * 一键发布到微信公众号 - Cyberpunk风格版本
 */

const { getArticleTemplate } = require('./wechat-template-cyber');
const { runPublishWorkflow } = require('./utils/publish-helper');

runPublishWorkflow({
    styleName: 'Cyberpunk (赛博朋克)',
    templateName: 'cyber',
    getTemplate: getArticleTemplate,
    themeColor: 'cyan',
    markdownStyles: {
        h3: (match, p1) => `<h3 style="font-size: 16px; font-weight: 700; margin: 30px 0 15px; color: #00f3ff; letter-spacing: 1px;">> ${p1}</h3>`,
        h2: (match, p1) => `<h2 style="font-size: 22px; font-weight: 800; margin: 40px 0 20px; color: #fff; text-shadow: 0 0 5px #bc13fe;">${p1}_</h2>`,
        strong: '<strong style="color: #f600ff;">$1</strong>',
        p: 'line-height: 1.8; margin: 20px 0;'
    },
    stepsDesc: {
        startIcon: '⚡',
        tips: [
            'Cyber风格适合夜场比赛',
            '霓虹光效，深色背景',
            '预览文件名: *-cyber.html'
        ]
    }
});
