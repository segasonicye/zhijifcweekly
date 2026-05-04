#!/usr/bin/env node

/**
 * 📊 一键发布月度总结到微信公众号草稿箱
 *
 * 功能：
 * 1. 读取 monthly-summary-wechat.js 生成的HTML
 * 2. 自动上传Logo和图片
 * 3. 创建图文草稿
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateSummaryPoster, generateMvpPoster } = require('./generate-poster');

// 引用发布工具的辅助函数
const { log } = require('./utils/publish-helper');

// 配置
const CONFIG_FILE = path.join(__dirname, '../wechat-config.json');
const API_BASE = 'https://api.weixin.qq.com/cgi-bin';
const POSTER_DIR = path.join(__dirname, '../output/posters');

/**
 * 读取配置
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    log('❌ 配置文件不存在: wechat-config.json', 'red');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

/**
 * 获取 Access Token
 */
async function getAccessToken(appId, appSecret) {
  const url = `${API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error(`获取Access Token失败: ${data.errmsg}`);
  return data.access_token;
}

/**
 * 上传图片
 */
async function uploadImage(accessToken, filePath) {
  const url = `${API_BASE}/media/uploadimg?access_token=${accessToken}`;
  const cmd = `curl -s -X POST -F "media=@${filePath}" "${url}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  if (data.errcode) throw new Error(`上传图片失败: ${data.errmsg}`);
  return data.url;
}

/**
 * 上传封面图
 */
async function uploadCover(accessToken, filePath) {
  const url = `${API_BASE}/material/add_material?access_token=${accessToken}&type=image`;
  const cmd = `curl -s -X POST -F "media=@${filePath}" "${url}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  if (data.errcode) throw new Error(`上传封面图失败: ${data.errmsg}`);
  return data.media_id;
}

/**
 * 创建草稿
 */
async function createDraft(accessToken, article) {
  const url = `${API_BASE}/draft/add?access_token=${accessToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles: [article] })
  });
  const data = await res.json();
  if (data.errcode) throw new Error(`创建草稿失败: ${data.errmsg}`);
  return data.media_id;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const year = args[0] ? parseInt(args[0]) : new Date().getFullYear();
    const month = args[1] ? parseInt(args[1]) : new Date().getMonth() + 1;

    log(`🚀 开始发布 ${year}年${month}月 月度总结...`, 'cyan');

    const config = loadConfig();
    // 支持两种配置格式：
    // 1. 扁平: { appId, appSecret }
    // 2. 多账号: { defaultAccount, accounts: { name: { appId, appSecret } } }
    let appId = config.appId;
    let appSecret = config.appSecret;
    if (!appId || !appSecret) {
      const accountName = config.defaultAccount || Object.keys(config.accounts || {})[0];
      const account = config.accounts?.[accountName];
      if (account) {
        appId = account.appId;
        appSecret = account.appSecret;
      }
    }
    if (!appId || !appSecret) {
      log('❌ 未配置 AppID/AppSecret', 'red');
      return;
    }

    // 1. 查找生成的HTML文件
    // 支持两种文件名格式:
    // - monthly-stats-YYYY-MM.html (当前)
    // - YYYY-MM-monthly-summary-wechat.html (原名)
    const paddedMonth = String(month).padStart(2, '0');
    const possibleFiles = [
      path.join(__dirname, '../output', `monthly-stats-${year}-${paddedMonth}.html`),
      path.join(__dirname, '../output', `${year}-${paddedMonth}-monthly-summary-wechat.html`),
    ];
    let summaryFile = possibleFiles.find(fs.existsSync);
    if (!summaryFile) {
      log(`❌ 未找到总结文件`, 'red');
      log('💡 请先运行: node scripts/monthly-summary-wechat.js', 'yellow');
      return;
    }

    let htmlContent = fs.readFileSync(summaryFile, 'utf-8');
    log(`📄 读取总结文件成功`, 'green');

    // 1.5 生成海报 (自动调用 generate-poster.js)
    log('🎨 正在生成海报...', 'magenta');
    const summaryPosterPath = path.join(POSTER_DIR, `summary-${year}-${month}.jpg`);
    const mvpPosterPath = path.join(POSTER_DIR, `mvp-${year}-${month}.jpg`);
    
    // 准备数据 (从文件名推断或重新计算，这里简化为通用海报)
    // 注意：generate-poster 已经被我们改为生成通用海报，不需要复杂参数
    await generateSummaryPoster({ year, month }, summaryPosterPath);
    await generateMvpPoster({ year, month }, mvpPosterPath);
    log('✅ 海报生成完毕', 'green');

    // 2. 获取 Access Token
    log('🔐 获取微信 Access Token...', 'yellow');
    const token = await getAccessToken(config.appId, config.appSecret);
    log('✅ Access Token 获取成功', 'green');

    // 3. 上传海报
    let summaryPosterUrl = '';
    let mvpPosterUrl = '';
    
    if (fs.existsSync(summaryPosterPath)) {
      log('⬆️  上传总结海报...', 'blue');
      summaryPosterUrl = await uploadImage(token, summaryPosterPath);
    }
    if (fs.existsSync(mvpPosterPath)) {
      log('⬆️  上传MVP海报...', 'blue');
      mvpPosterUrl = await uploadImage(token, mvpPosterPath);
    }

    // 3.1 替换 Logo 为总结海报
    // 原有的 HTML 里有一个 logo 占位符，我们直接用生成的 Summary Poster 替换它
    // 或者插入到顶部
    const logoPlaceholderRegex = /<section style="width: 80px;[\s\S]*?<\/section>/;
    // 新的头部 HTML: 宽度100%的海报
    const headerHtml = `<div style="margin: -30px -20px 20px -20px;"><img src="${summaryPosterUrl}" style="width: 100%; display: block; border-radius: 0;"></div>`;
    
    if (logoPlaceholderRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(logoPlaceholderRegex, ''); // 删掉旧 Logo 占位
      // 把海报插到 body 开始处 (通过正则找到第一个 <section>)
      htmlContent = htmlContent.replace('<section style="max-width: 650px;', `<section style="max-width: 650px;">${headerHtml}`);
    } else {
      // 没找到占位符，直接插在最前面
       htmlContent = htmlContent.replace('<body>', `<body><div style="max-width: 650px; margin: 0 auto;">${headerHtml}</div>`);
    }

    // 3.2 插入 MVP 海报
    // 修改逻辑：将 MVP 海报插在 "🏆 月度最有价值球员" 标题 *下方*
    if (mvpPosterUrl) {
      const mvpHeaderHtml = `<div style="margin: 20px 0 20px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><img src="${mvpPosterUrl}" style="width: 100%; display: block;"></div>`;
      // 替换目标：把标题后面接上图片
      const targetString = '<p style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e8e8e8;">🏆 月度最有价值球员</p>';
      htmlContent = htmlContent.replace(targetString, `${targetString}${mvpHeaderHtml}`);
    }

    // 4. 上传封面图 (使用 Summary Poster)
    let thumbMediaId = config.defaultThumbId;
    if (fs.existsSync(summaryPosterPath)) {
      log(`🖼️  使用总结海报作为封面图...`, 'yellow');
      try {
        thumbMediaId = await uploadCover(token, summaryPosterPath);
      } catch (e) {
        log(`⚠️  封面图上传失败: ${e.message}`, 'red');
      }
    } else {
       log('⚠️  没有找到海报，封面图可能为空', 'red');
    }

    if (!thumbMediaId) {
      log('⚠️  警告：没有封面图 (thumb_media_id)，发布可能会失败！', 'red');
    }

    // 5. 创建草稿
    log('📝 正在创建草稿...', 'yellow');
    const article = {
      title: `${year}年${month}月 知己FC 赛事总结`,
      author: '知己足球俱乐部',
      digest: `本月共进行 ${htmlContent.match(/比赛场次[\s\S]*?>(\d+)</)?.[1] || '?'} 场比赛，来看看大家的表现吧！`,
      content: htmlContent,
      content_source_url: '',
      thumb_media_id: thumbMediaId,
      need_open_comment: 1
    };

    const draftId = await createDraft(token, article);
    log(`✅ 月度总结草稿创建成功! Draft ID: ${draftId}`, 'green');
    log('\n🎉 请前往微信公众号后台查看草稿箱！', 'cyan');

  } catch (error) {
    log(`❌ 发生错误: ${error.message}`, 'red');
    console.error(error);
  }
}

main();
