const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function checkDrafts() {
    const configPath = path.join(__dirname, '../wechat-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
    const tokenRes = await axios.get(tokenUrl);
    const token = tokenRes.data.access_token;

    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`;
    const draftRes = await axios.post(draftUrl, {
        offset: 0,
        count: 5,
        no_content: 1
    });

    if (!draftRes.data.item || draftRes.data.item.length === 0) {
        console.log('草稿箱为空');
        return;
    }

    console.log(`共有 ${draftRes.data.item.length} 篇草稿:\n`);
    draftRes.data.item.forEach((item, index) => {
        console.log(`[${index}] Title: ${item.content.news_item[0].title}`);
        console.log(`    Media ID: ${item.media_id}`);
        console.log(`    Update Time: ${new Date(item.update_time * 1000).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`);
    });
}

checkDrafts();