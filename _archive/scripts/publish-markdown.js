#!/usr/bin/env node

/**
 * 🚀 通用 Markdown 发布工具 (Universal Publisher)
 *
 * 功能：
 * 1. 读取指定 Markdown 文件
 * 2. 提取 Front Matter (title, author, digest)
 * 3. 渲染 Markdown 为 HTML
 * 4. 自动上传文中图片到微信服务器并替换 URL
 * 5. 推送到公众号草稿箱
 *
 * 用法:
 *   node scripts/publish-markdown.js <markdown-file>
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const FormData = require('form-data');
const fetch = require('node-fetch');
const marked = require('marked');

// 配置
const WECHAT_CONFIG = require('../wechat-config.json');

// 颜色输出
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

function log(msg, color = 'green') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
    console.error(`${colors.red}❌ ${msg}${colors.reset}`);
    process.exit(1);
}

// 获取 Access Token
async function getAccessToken(appId, appSecret) {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.errcode) error(`获取 Token 失败: ${data.errmsg}`);
    return data.access_token;
}

// 上传图片
async function uploadImage(token, filePath) {
    if (!fs.existsSync(filePath)) {
        log(`⚠️ 图片不存在: ${filePath}`, 'yellow');
        return null;
    }

    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));

    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
    const res = await fetch(url, { method: 'POST', body: form });
    const data = await res.json();

    if (data.errcode) {
        log(`⚠️ 图片上传失败: ${data.errmsg}`, 'yellow');
        return null;
    }
    return { url: data.url, media_id: data.media_id };
}

// 创建草稿
async function createDraft(token, article) {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
    const payload = {
        articles: [article]
    };

    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.errcode) error(`创建草稿失败: ${data.errmsg}`);
    return data.media_id;
}

// 主流程
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) error('请指定 Markdown 文件路径');

    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) error(`文件不存在: ${filePath}`);

    // 读取配置 (默认用 zhiji 账号，如需其他账号请修改代码或传参)
    const accountConfig = WECHAT_CONFIG.accounts['zhiji']; 
    if (!accountConfig) error('未找到 zhiji 账号配置');

    log(`🚀 开始发布: ${path.basename(filePath)}`, 'cyan');

    // 1. 获取 Token
    const token = await getAccessToken(accountConfig.appId, accountConfig.appSecret);
    log(`✅ 获取 Access Token 成功`);

    // 2. 解析 Markdown
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter, content } = matter(fileContent);
    
    // 3. 处理图片 (简单正则替换，仅支持本地相对路径)
    let processedContent = content;
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;
    const imagesToUpload = [];

    while ((match = imgRegex.exec(content)) !== null) {
        const [fullStr, alt, imgPath] = match;
        if (!imgPath.startsWith('http')) {
            // 假设是本地图片，解析绝对路径
            const absImgPath = path.resolve(path.dirname(filePath), imgPath);
            imagesToUpload.push({ fullStr, absImgPath });
        }
    }

    // 批量上传图片并替换链接
    for (const img of imagesToUpload) {
        log(`📤 上传图片: ${path.basename(img.absImgPath)}...`);
        const result = await uploadImage(token, img.absImgPath);
        if (result && result.url) {
            processedContent = processedContent.replace(img.fullStr, `![${path.basename(img.absImgPath)}](${result.url})`);
        }
    }

    // 4. 渲染 HTML
    const htmlContent = marked.parse(processedContent);
    
    // 5. 准备草稿数据
    // 如果 Front Matter 里没有指定 thumb_media_id，尝试上传第一张图作为封面，或者报错
    let thumbMediaId = frontMatter.thumb_media_id;
    if (!thumbMediaId && imagesToUpload.length > 0) {
        // 尝试上传第一张图作为封面素材 (永久素材)
        log(`🖼️ 尝试将第一张图设为封面...`);
        const coverResult = await uploadImage(token, imagesToUpload[0].absImgPath); // 这里复用上传逻辑，注意素材类型
        if (coverResult) thumbMediaId = coverResult.media_id;
    }

    if (!thumbMediaId) {
        log(`⚠️ 警告: 未指定封面图 (thumb_media_id)，草稿可能无法发布。建议在 Front Matter 中指定。`, 'yellow');
        // 尝试使用默认封面 (如果有)
        // thumbMediaId = '...'; 
    }

    const article = {
        title: frontMatter.title || path.basename(filePath, '.md'),
        author: frontMatter.author || 'OpenClaw',
        digest: frontMatter.digest || '',
        content: htmlContent,
        content_source_url: frontMatter.source_url || '',
        thumb_media_id: thumbMediaId || 'MediaId_placeholder_you_must_replace', // 占位符，如果没封面会报错
        need_open_comment: 0,
        only_fans_can_comment: 0
    };

    // 6. 提交草稿
    log(`📝 提交草稿中...`);
    try {
        const draftId = await createDraft(token, article);
        log(`✅ 草稿创建成功! Media ID: ${draftId}`, 'green');
        log(`👉 请前往公众号后台查看并群发。`);
    } catch (e) {
        error(`提交失败: ${e.message}`);
    }
}

main().catch(err => error(err.message));
