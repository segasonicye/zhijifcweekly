import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '../wechat-config.json');
const LOGO_PATH = '/Users/yesu/zhijifcweekly/logo-200.png';

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    let title = '科技与绿茵早报 | 视频版';
    let author = '知己FC';
    let digest = '视频版早报';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--title' || arg === '-t') {
            title = args[++i] || '未命名视频';
        } else if (arg === '--author' || arg === '-a') {
            author = args[++i] || '未命名作者';
        } else if (arg === '--digest' || arg === '-d') {
            digest = args[++i] || '视频内容';
        }
    }

    return { title, author, digest };
}

async function main() {
    const videoPath = process.argv[2];
    if (!videoPath || !fs.existsSync(videoPath)) {
        console.error('❌ 请提供有效的视频路径！用法: node scripts/upload-video-article.js <video-path> [--title "标题"] [--author "作者"] [--digest "摘要"]');
        process.exit(1);
    }

    const { title, author, digest } = parseArgs();
    console.log(`📝 视频信息：${path.basename(videoPath)}`);
    console.log(`   标题：${title}`);
    console.log(`   作者：${author}`);
    console.log(`   摘要：${digest}`);

    // 1. 加载配置并获取 Token
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')).accounts['zhiji'];
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
    const tokenRes = await (await fetch(tokenUrl)).json();
    const token = tokenRes.access_token;
    console.log('✅ Access Token 获取成功');

    // 2. 上传 Logo (用于顶部 Banner 和封面)
    console.log('🖼️  正在上传 Logo...');
    const logoUploadUrl = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;
    const logoCmd = `curl -s -F "media=@${LOGO_PATH}" "${logoUploadUrl}"`;
    const logoResponse = execSync(logoCmd).toString();
    console.log('Logo 上传响应:', logoResponse);
    const logoData = JSON.parse(logoResponse);
    if (!logoData.url) {
        console.error('❌ Logo 上传失败:', logoData);
        process.exit(1);
    }
    const logoUrl = logoData.url;
    console.log('✅ Logo 上传完成, URL:', logoUrl);

    // 上传 Logo 为永久素材（用于 thumb_media_id）
    console.log('🖼️  正在上传 Logo (永久素材)...');
    const logoMaterialUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
    const logoMaterialCmd = `curl -s -F "media=@${LOGO_PATH}" "${logoMaterialUrl}"`;
    const logoMaterialResponse = execSync(logoMaterialCmd).toString();
    console.log('Logo 永久素材响应:', logoMaterialResponse);
    const logoMaterialData = JSON.parse(logoMaterialResponse);
    const logoMediaId = logoMaterialData.media_id;
    console.log('✅ Logo 永久素材上传完成, Media ID:', logoMediaId);

    // 3. 上传视频文件
    console.log('🎥 正在上传视频 (此过程较慢)...');
    const videoUploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=video`;

    // 创建临时 JSON 文件存储 description
    const descFile = '/tmp/video_desc.json';
    fs.writeFileSync(descFile, JSON.stringify({
        title: 'Video',
        introduction: 'Morning Report'
    }));

    const videoCmd = `curl -s -F "media=@${videoPath}" -F "description=<${descFile}" "${videoUploadUrl}"`;
    const videoResponse = execSync(videoCmd).toString();
    console.log('视频上传响应:', videoResponse);
    const videoData = JSON.parse(videoResponse);
    const videoMediaId = videoData.media_id;
    if (!videoMediaId) {
        console.error('❌ 视频上传失败:', videoData);
        process.exit(1);
    }
    console.log('✅ 视频上传完成, Media ID:', videoMediaId);

    // 4. 创建图文草稿 (Logo 置顶)
    console.log('📝 正在合成图文草稿...');
    const articleContent = `
        <section style="margin: 20px 0; text-align: center;">
            <img src="${logoUrl}" style="width: 150px; border-radius: 50%;" />
        </section>
        <section style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">${title}</h2>
            <p style="margin: 5px 0 0; color: #888; font-size: 14px;">${new Date().toISOString().split('T')[0]}</p>
        </section>
        <section style="margin: 30px 0;">
            <p style="text-align: center; font-weight: bold; color: #1890ff;">📹 视频内容</p>
            <p style="text-align: center; color: #666; font-size: 14px;">视频已上传到素材库，请在编辑器中插入视频素材</p>
            <p style="text-align: center; color: #999; font-size: 12px;">Video Media ID: ${videoMediaId.substring(0, 20)}...</p>
        </section>
        <section style="margin-top: 20px;">
            <p style="text-align: center; color: #666;">今日重点：AMD 新芯片、利物浦大胜、HBM 产能。</p>
        </section>
    `;

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
    const draftPayload = {
        articles: [{
            title: title,
            author: author,
            digest: digest,
            content: articleContent,
            thumb_media_id: logoMediaId // 使用 Logo 作为封面
        }]
    };

    console.log('草稿请求体:', JSON.stringify(draftPayload, null, 2));

    const draftRes = await fetch(draftUrl, {
        method: 'POST',
        body: JSON.stringify(draftPayload)
    });
    const draftData = await draftRes.json();

    console.log('草稿响应:', JSON.stringify(draftData, null, 2));

    if (draftData.media_id) {
        console.log('\n🎉 发布成功！');
        console.log('👉 请前往公众号后台 [草稿箱] 查看：', draftData.media_id);
    } else {
        console.error('❌ 草稿创建失败:', draftData);
    }
}

main().catch(console.error);
