const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testSimpleDraft() {
    try {
        // 1. 读取配置
        const config = JSON.parse(fs.readFileSync('/Users/yesu/zhijifcweekly/wechat-config.json', 'utf8'));
        
        // 2. 获取 Token
        const tokenRes = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.accounts.zhiji.appId}&secret=${config.accounts.zhiji.appSecret}`);
        const token = tokenRes.data.access_token;
        console.log('Token:', token.substring(0, 10) + '...');
        
        // 3. 先上传一个封面（使用 logo）
        const logoPath = path.join(__dirname, '..', 'logo.png');
        console.log('上传封面:', logoPath);
        
        const FormData = require('form-data');
        const form = new FormData();
        form.append('media', fs.createReadStream(logoPath));
        
        const thumbRes = await axios.post(
            `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=thumb`,
            form,
            { headers: form.getHeaders() }
        );
        
        console.log('封面上传结果:', JSON.stringify(thumbRes.data));
        
        if (thumbRes.data.errcode) {
            throw new Error('封面上传失败: ' + thumbRes.data.errmsg);
        }
        
        const thumbId = thumbRes.data.media_id;
        console.log('封面ID:', thumbId);
        
        // 4. 创建草稿（最简单的内容）
        const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
        const draftData = {
            articles: [{
                title: "测试草稿 " + new Date().toLocaleTimeString(),
                author: "测试账号",
                digest: "这是一条测试草稿",
                content: "<p>这是一条测试草稿的内容。</p>",
                show_cover_pic: 1,
                thumb_media_id: thumbId,
                content_source_url: ""
            }]
        };
        
        console.log('\n发送草稿数据...');
        console.log('封面ID:', thumbId);
        
        const draftRes = await axios.post(draftUrl, draftData);
        console.log('\n草稿返回结果:', JSON.stringify(draftRes.data));
        
        if (draftRes.data.errcode) {
            throw new Error('草稿创建失败: ' + draftRes.data.errmsg);
        }
        
        console.log('\n✅ 草稿创建成功!');
        console.log('Media ID:', draftRes.data.media_id);
        
        // 5. 立即查询草稿箱验证
        console.log('\n验证草稿箱...');
        const checkRes = await axios.post(
            `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`,
            { offset: 0, count: 10 }
        );
        
        console.log('草稿箱总数:', checkRes.data.total_count);
        
        if (checkRes.data.item && checkRes.data.item.length > 0) {
            console.log('\n最新的草稿:');
            checkRes.data.item.forEach((item, idx) => {
                console.log(`[${idx}] ${item.content.news_item[0].title}`);
                console.log(`    Media ID: ${item.media_id}`);
            });
        } else {
            console.log('草稿箱为空（奇怪！）');
        }
        
    } catch (err) {
        console.error('\n❌ 错误:', err.message);
        if (err.response) {
            console.error('响应数据:', JSON.stringify(err.response.data));
        }
    }
}

testSimpleDraft();
