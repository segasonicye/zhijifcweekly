#!/usr/bin/env node

/**
 * 🛠️ 纯文本 Markdown 手动发布脚本 (赛博朋克风 + Logo 自动上传)
 *
 * 功能：
 * 1. 读取指定的 Markdown 文件
 * 2. 渲染为赛博朋克风格 HTML (深色背景 + 霓虹边框 + 亮色文字)
 * 3. 自动上传 Logo (logo.png) 到微信，获取 URL 并替换
 * 4. 上传默认封面图 (football-theme.png) 到微信，获取 media_id
 * 5. 推送到微信草稿箱
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

// 获取 Access Token
async function getAccessToken() {
    console.log('🔑 获取 Access Token...');
    try {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;
        const res = await axios.get(url);
        if (res.data.access_token) {
            console.log('✅ Access Token 获取成功');
            return res.data.access_token;
        } else {
            throw new Error(JSON.stringify(res.data));
        }
    } catch (err) {
        console.error('❌ 获取 Token 失败:', err.message);
        process.exit(1);
    }
}

// 上传图片 (Logo 或正文图片) -> 返回 URL
async function uploadImage(token, imagePath) {
    if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ 图片不存在: ${imagePath}，跳过上传`);
        return null;
    }

    console.log(`🖼️ 上传图片 (${path.basename(imagePath)})...`);
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', 'image');

    try {
        // 使用永久素材接口 (material/add_material)，返回 url 字段
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
        
        const headers = form.getHeaders();
        const res = await axios.post(url, form, { headers });

        if (res.data.url) {
            console.log('✅ 图片上传成功, URL:', res.data.url);
            return res.data.url;
        } else {
            throw new Error(`上传失败: ${JSON.stringify(res.data)}`);
        }
    } catch (err) {
        console.error('❌ 上传图片失败:', err.response ? err.response.data : err.message);
        throw err;
    }
}

// 上传封面图 -> 返回 media_id
async function uploadCover(token, imagePath) {
    if (!fs.existsSync(imagePath)) {
        throw new Error(`封面图不存在: ${imagePath}`);
    }

    console.log(`🖼️ 上传封面素材 (${path.basename(imagePath)})...`);
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', 'image');

    try {
        // 使用永久素材接口 (material/add_material)，返回 media_id
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
        
        const headers = form.getHeaders();
        const res = await axios.post(url, form, { headers });

        if (res.data.media_id) {
            console.log('✅ 封面图上传成功, Media ID:', res.data.media_id);
            return res.data.media_id;
        } else {
            throw new Error(`上传失败: ${JSON.stringify(res.data)}`);
        }
    } catch (err) {
        console.error('❌ 上传封面图失败:', err.response ? err.response.data : err.message);
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

// 赛博朋克 Markdown 转 HTML
function markdownToHtml(md) {
    // 替换标题 (赛博朋克风：深色背景 + 霓虹边框 + 亮色文字)
    let html = md
        .replace(/^# (.*$)/gim, '<h1 style="font-size: 28px; font-weight: 900; margin: 30px 0 20px; color: #00f3ff; text-shadow: 0 0 10px rgba(0, 243, 255, 0.5); text-transform: uppercase; letter-spacing: 2px;">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size: 22px; font-weight: 700; margin: 25px 0 15px; color: #bc13fe; border-left: 4px solid #bc13fe; padding-left: 15px; text-shadow: 0 0 8px rgba(188, 19, 254, 0.4);">> $1</h2>')
        .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 8px;">/// $1 ///</h3>')
        
        // 替换加粗 (亮黄色/紫色)
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #f600ff; font-weight: 800;">$1</strong>')
        
        // 替换引用块 (青色边框 + 亮灰文字)
        .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid #00f3ff; padding-left: 15px; margin: 20px 0; color: #ddd; background: #111; padding: 15px; border-radius: 4px; font-style: normal;">> $1</blockquote>')
        
        // 处理段落 (深色背景下的亮色文字)
        .split('\n\n').map(p => {
            // 如果段落里还有单换行，替换为 <br/>
            let content = p.replace(/\n/g, '<br/>');
            // 如果段落已经包含 HTML标签 (比如上面替换过的标题)，就不包 p 标签了
            if (content.startsWith('<h') || content.startsWith('<blockquote')) return content;
            return `<p style="font-size: 16px; line-height: 1.8; margin: 15px 0; color: #ccc;">${content}</p>`;
        }).join('\n');
    
    // 自动给所有图片添加居中样式（兼容微信公众号）
    html = html.replace(/<img\s+([^>]*?)>/gim, (match, attrs) => {
        // 如果已经有居中样式，就跳过
        if (attrs.includes('display: block') || attrs.includes('margin-left: auto')) {
            return match;
        }
        // 包装成居中的块级元素
        return `<img ${attrs} style="display: block; margin-left: auto; margin-right: auto; max-width: 100%;" />`;
    });

    // 赛博朋克整体容器
    return `<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #050505; padding: 30px 20px; color: #ddd;">{{LOGO_SECTION}}${html}</div>`;
}

// 主逻辑
async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ 用法: node scripts/publish-manual.js <markdown-file>');
        process.exit(1);
    }

    try {
        const token = await getAccessToken();
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 1. 上传 Logo (使用小版本)
        const logoPath = path.join(__dirname, '../logo-150.png');
        let logoHtml = '';
        if (fs.existsSync(logoPath)) {
            const logoUrl = await uploadImage(token, logoPath);
            if (logoUrl) {
                // 插入 Logo HTML
                logoHtml = `
                    <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #0f0f13; border: 1px solid #00f3ff; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);">
                        <img src="${logoUrl}" alt="Logo" style="max-width: 150px; display: block; margin-left: auto; margin-right: auto;" />
                    </div>`;
            }
        }

        // 2. 渲染 Markdown 为 HTML
        const rawHtml = markdownToHtml(content);
        const html = rawHtml.replace('{{LOGO_SECTION}}', logoHtml);

        // 3. 获取封面图 ID（自动识别节日封面）
        let coverPath = path.join(__dirname, '../football-theme.png');

        // 如果是情人节，使用专属封面
        const isValentinesDay = (new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }).slice(5) === '02-14');
        if (isValentinesDay) {
            const valentineCover = path.join(__dirname, '../football-theme-valentine.png');
            if (fs.existsSync(valentineCover)) {
                console.log('💖 情人节，使用专属封面');
                coverPath = valentineCover;
            }
        }

        if (!fs.existsSync(coverPath)) {
            console.warn('⚠️ 未找到默认封面 football-theme.png，尝试查找其他图片...');
            const files = fs.readdirSync(path.join(__dirname, '..'));
            const img = files.find(f => f.endsWith('.png') || f.endsWith('.jpg'));
            if (img) coverPath = path.join(__dirname, '..', img);
        }

        if (!fs.existsSync(coverPath)) {
            throw new Error('❌ 未找到任何封面图，无法发布。');
        }

        const thumbMediaId = await uploadCover(token, coverPath);

        // 4. 构造文章数据
        const titleMatch = content.match(/^# (.*)/);
        const title = titleMatch ? titleMatch[1].trim() : '知己FC早报';

        const draftData = {
            articles: [
                {
                    title: title,
                    author: '知己FC',
                    digest: '点击查看今日科技与绿茵动态',
                    content: html,
                    content_source_url: '',
                    thumb_media_id: thumbMediaId,
                    need_open_comment: 1,
                    only_fans_can_comment: 0
                }
            ]
        };

        // 5. 提交草稿（支持去重更新）
        console.log(`🚀 正在推送赛博朋克草稿: "${title}"...`);

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
        console.error('❌ 发生错误:', err.response ? JSON.stringify(err.response.data) : err.message);
        process.exit(1);
    }
}

main();
