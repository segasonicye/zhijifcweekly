#!/usr/bin/env node

/**
 * 🕶️ 赛博朋克风格早报发布脚本 (Cyberpunk Edition)
 *
 * 功能：
 * 1. 读取 Markdown 内容
 * 2. 上传 Logo 和 封面图
 * 3. 渲染炫酷的 Cyberpunk HTML
 * 4. 推送到微信草稿箱
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 配置
const configPath = path.join(__dirname, '../wechat-config.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ 配置文件不存在:', configPath);
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const account = config.accounts['zhiji'];

if (!account) {
    console.error('❌ 未找到配置账号 zhiji');
    process.exit(1);
}

// 资源路径
const LOGO_PATH = path.join(__dirname, '../logo.png');
const COVER_PATH = path.join(__dirname, '../football-theme.png'); // 默认封面

// 获取 Access Token
async function getAccessToken() {
    console.log('🔑 获取 Access Token...');
    try {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;
        const res = await axios.get(url);
        if (res.data.access_token) {
            return res.data.access_token;
        } else {
            throw new Error(JSON.stringify(res.data));
        }
    } catch (err) {
        console.error('❌ 获取 Token 失败:', err.message);
        process.exit(1);
    }
}

// 上传正文图片 (返回 URL)
async function uploadImage(token, imagePath) {
    if (!fs.existsSync(imagePath)) return null;
    console.log(`🖼️ 上传图片到正文 (${path.basename(imagePath)})...`);
    
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    
    try {
        // 正文图片接口: media/uploadimg (返回 url)
        const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;
        const headers = form.getHeaders();
        const res = await axios.post(url, form, { headers });
        
        if (res.data.url) {
            return res.data.url;
        } else {
            throw new Error(JSON.stringify(res.data));
        }
    } catch (err) {
        console.error('❌ 上传图片失败:', err.message);
        return null;
    }
}

// 上传封面图 (返回 Media ID)
async function uploadCover(token, imagePath) {
    if (!fs.existsSync(imagePath)) throw new Error('封面图不存在');
    console.log(`🖼️ 上传封面素材 (${path.basename(imagePath)})...`);
    
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', 'image');
    
    try {
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
        const headers = form.getHeaders();
        const res = await axios.post(url, form, { headers });
        
        if (res.data.media_id) {
            return res.data.media_id;
        } else {
            throw new Error(JSON.stringify(res.data));
        }
    } catch (err) {
        console.error('❌ 上传封面失败:', err.message);
        throw err;
    }
}

// 获取草稿列表
async function getDrafts(token) {
    try {
        const url = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`;
        const res = await axios.post(url, { offset: 0, count: 20, no_content: 0 });
        if (res.data.item) {
            return res.data.item;
        } else {
            return [];
        }
    } catch (err) {
        console.warn('⚠️ 获取草稿列表失败:', err.response ? JSON.stringify(err.response.data) : err.message);
        return [];
    }
}

// 查找相同标题的草稿
async function findDraftByTitle(token, title) {
    const drafts = await getDrafts(token);
    for (const draft of drafts) {
        if (draft.content && draft.content.news_item && draft.content.news_item.length > 0) {
            if (draft.content.news_item[0].title === title) {
                return draft.media_id;
            }
        }
    }
    return null;
}

// 更新草稿
async function updateDraft(token, mediaId, draftData) {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/update?access_token=${token}`;
    const payload = {
        media_id: mediaId,
        ...draftData
    };
    const res = await axios.post(url, payload);
    return res.data;
}

// 赛博朋克 HTML 渲染器
function renderCyberpunkHtml(title, contentMd, logoUrl) {
    // 1. Markdown 转 HTML (带样式)
    let bodyHtml = contentMd
        // 移除 Markdown 里的 H1 标题 (因为我们会单独渲染头部)
        .replace(/^# (.*)/, '') 
        // H2 -> 霓虹标题
        .replace(/^## (.*$)/gim, `
            <h2 style="
                font-size: 20px; 
                font-weight: 900; 
                margin: 40px 0 20px; 
                padding-left: 15px; 
                border-left: 4px solid #f600ff; 
                color: #fff; 
                letter-spacing: 1px;
                text-shadow: 0 0 10px rgba(246, 0, 255, 0.4);
            ">$1</h2>`)
        // H3 -> 次级标题
        .replace(/^### (.*$)/gim, `
            <h3 style="
                font-size: 16px; 
                font-weight: 700; 
                margin: 25px 0 15px; 
                color: #00f3ff;
                letter-spacing: 1px;
            ">> $1</h3>`)
        // 加粗 -> 荧光色
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #f600ff; font-weight: bold;">$1</strong>')
        // 引用 -> 终端风格
        .replace(/^> (.*$)/gim, `
            <blockquote style="
                background: #111; 
                border: 1px dashed #333; 
                padding: 15px; 
                margin: 20px 0; 
                color: #888; 
                font-family: monospace; 
                font-size: 14px;
            ">root@zhiji:~$ $1</blockquote>`)
        // 段落
        .split('\n\n').map(p => {
            let c = p.replace(/\n/g, '<br/>');
            if (c.trim().length === 0) return '';
            if (c.startsWith('<h') || c.startsWith('<blockquote')) return c;
            return `<p style="margin: 15px 0; line-height: 1.8; color: #ccc;">${c}</p>`;
        }).join('');

    // 2. 组装整体结构
    const logoImg = logoUrl ? `<img src="${logoUrl}" style="width: 120px; display: block; margin: 0 auto 20px;" />` : '';
    
    return `
    <div style="background: #050505; padding: 20px; font-family: -apple-system, sans-serif;">
        <!-- 顶部容器 -->
        <div style="
            text-align: center; 
            padding: 40px 20px; 
            background: #0f0f13; 
            border: 1px solid #333; 
            border-radius: 8px; 
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.1);
            margin-bottom: 40px;
        ">
            ${logoImg}
            <div style="font-size: 12px; color: #00f3ff; letter-spacing: 4px; margin-bottom: 10px;">SYSTEM_BROADCAST</div>
            <h1 style="
                font-size: 28px; 
                font-weight: 900; 
                color: #fff; 
                margin: 0; 
                text-shadow: 2px 2px 0px #bc13fe;
            ">${title}</h1>
            <div style="height: 2px; width: 50px; background: #f600ff; margin: 20px auto;"></div>
        </div>

        <!-- 正文内容 -->
        <div style="padding: 0 10px;">
            ${bodyHtml}
        </div>

        <!-- 底部 -->
        <div style="
            margin-top: 60px; 
            text-align: center; 
            padding-top: 20px; 
            border-top: 1px solid #222; 
            color: #555; 
            font-size: 12px; 
            letter-spacing: 2px;
        ">
            ZHIJI FOOTBALL CLUB <span style="color: #333; margin: 0 10px;">|</span> 2026
        </div>
    </div>
    `;
}

// 主逻辑
async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ 用法: node scripts/publish-manual-cyber.js <markdown-file>');
        process.exit(1);
    }

    try {
        const token = await getAccessToken();
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 1. 上传 Logo (用于正文)
        const logoUrl = await uploadImage(token, LOGO_PATH);
        if (!logoUrl) console.warn('⚠️ Logo 上传失败，将不显示 Logo');

        // 2. 上传封面 (用于草稿封面)
        // 优先尝试找同名图片，没有则用默认
        let coverFile = COVER_PATH;
        if (!fs.existsSync(coverFile)) {
             // 再次兜底
             const files = fs.readdirSync(path.join(__dirname, '..'));
             const img = files.find(f => f.endsWith('.png') || f.endsWith('.jpg'));
             if (img) coverFile = path.join(__dirname, '..', img);
        }
        
        const thumbMediaId = await uploadCover(token, coverFile);
        console.log('✅ 封面准备就绪');

        // 3. 渲染 HTML
        const titleMatch = content.match(/^# (.*)/);
        const title = titleMatch ? titleMatch[1].trim() : '知己FC早报';
        
        const html = renderCyberpunkHtml(title, content, logoUrl);
        
        // 4. 提交草稿（支持去重更新）
        const draftData = {
            articles: [
                {
                    title: title,
                    author: '知己FC',
                    digest: '点击查看赛博版早报',
                    content: html,
                    content_source_url: '',
                    thumb_media_id: thumbMediaId,
                    need_open_comment: 1,
                    only_fans_can_comment: 0
                }
            ]
        };

        console.log(`🚀 推送赛博草稿: "${title}"...`);

        // 检查是否存在相同标题的草稿
        const existingMediaId = await findDraftByTitle(token, title);
        let mediaId;

        if (existingMediaId) {
            console.log(`📝 发现现有草稿 (Media ID: ${existingMediaId})，正在更新...`);
            await updateDraft(token, existingMediaId, draftData);
            mediaId = existingMediaId;
            console.log('✅ 更新现有草稿成功！');
        } else {
            console.log('📝 未找到现有草稿，创建新草稿...');
            const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
            const res = await axios.post(url, draftData);
            if (!res.data.media_id) {
                throw new Error(`发布失败: ${JSON.stringify(res.data)}`);
            }
            mediaId = res.data.media_id;
            console.log('✅ 创建新草稿成功！');
        }

        console.log('✅✅✅ 推送成功！(Cyberpunk Style + Logo)');
        console.log('📝 草稿 Media ID:', mediaId);
        console.log('👉 请前往公众号后台查看并群发。');

    } catch (err) {
        console.error('❌ 错误:', err.message);
    }
}

main();
