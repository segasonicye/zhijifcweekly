const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function debugPublish() {
    try {
        const config = JSON.parse(fs.readFileSync('/Users/yesu/zhijifcweekly/wechat-config.json', 'utf8'));
        
        // 1. 获取 Token
        const tokenRes = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.accounts.zhiji.appId}&secret=${config.accounts.zhiji.appSecret}`);
        const token = tokenRes.data.access_token;
        console.log("Token obtained:", token ? "Success" : "Failed");

        // 2. 尝试获取最近的草稿列表（验证权限）
        const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`;
        const drafts = await axios.post(draftUrl, { offset: 0, count: 1 });
        console.log("Draft list connection:", drafts.data.total_count !== undefined ? "Success" : "Failed");

        // 3. 准备一份最简单的测试数据
        const addDraftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
        const testData = {
            articles: [{
                title: "OpenClaw 连通性测试 " + new Date().getTime(),
                author: "小叶助手",
                content: "<p>如果您看到这条消息，说明 OpenClaw 与微信草稿箱的 API 连通性已经修复。</p>",
                digest: "这是一条测试推送",
                show_cover_pic: 0,
                thumb_media_id: "" // 暂时留空看报错
            }]
        };

        console.log("Sending test draft...");
        const res = await axios.post(addDraftUrl, testData);
        console.log("API RAW RESPONSE:", JSON.stringify(res.data));

    } catch (err) {
        console.error("DEBUG ERROR:", err.response ? JSON.stringify(err.response.data) : err.message);
    }
}

debugPublish();
