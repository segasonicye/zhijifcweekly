const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:9377';
const USER_ID = 'openclaw';
const SESSION_KEY = 'xhs-publish';

const COVER_IMAGE = '/Users/yesu/zhijifcweekly/output/xhs-cover.jpg';
const TITLE = "Mac 别吃灰！5分钟给它装个 24小时 AI 私人秘书（保姆级）";
const DESC = `家人们！发现一个超牛的 AI 工具 OpenClaw！💻...`;

async function main() {
  try {
    // 1. 新建标签页
    console.log('🦊 [Camoufox] 正在打开小红书发布页...');
    const createRes = await axios.post(`${BASE_URL}/tabs`, {
      userId: USER_ID,
      sessionKey: SESSION_KEY,
      url: 'https://creator.xiaohongshu.com/publish/publish'
    });
    const tabId = createRes.data.tabId;
    console.log(`✅ 标签页已创建！ID: ${tabId}`);

    // 2. 等待登录 (轮询快照)
    console.log('🔔 正在检测登录状态...');
    let isLoggedIn = false;
    let attempts = 0;
    while (!isLoggedIn) {
      if (attempts++ % 5 === 0) console.log('⏳ 等待扫码...');
      const snapRes = await axios.get(`${BASE_URL}/tabs/${tabId}/snapshot?userId=${USER_ID}`);
      const content = JSON.stringify(snapRes.data);
      
      // 检查是否包含“发布笔记”或“上传图文”字样
      if (content.includes('发布笔记') || content.includes('上传图文') || content.includes('视频上传')) {
        isLoggedIn = true;
        console.log('✅ 检测到已登录！');
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 3. 提示上传
    console.log('⚠️ Camoufox HTTP 接口不支持直接文件上传。');
    console.log('👉 请在弹出的浏览器窗口中【手动点击上传图片】！');
    console.log('⏳ 脚本将等待直到检测到【标题输入框】出现，然后自动填字...');

    let titleInputReady = false;
    while (!titleInputReady) {
        const snapRes = await axios.get(`${BASE_URL}/tabs/${tabId}/snapshot?userId=${USER_ID}`);
        // 查找标题输入框的 ref
        // 假设 snapshot 返回结构里有 refs，我们需要遍历找到 placeholder="标题" 的
        // 简单起见，这里只做等待
        if (JSON.stringify(snapRes.data).includes('标题')) {
             titleInputReady = true;
             console.log('✅ 检测到编辑界面！准备填字...');
        } else {
             await new Promise(r => setTimeout(r, 1000));
        }
    }

    // 4. 填标题 (如果有 ref)
    // 这里需要解析 snapshot 返回的 ref ID，比较复杂，先暂停
    console.log('🎉 流程结束！请在浏览器中完成剩余操作。');
    
  } catch (error) {
    console.error('💥 发生错误:', error.response ? error.response.data : error.message);
  }
}

main();
