#!/usr/bin/env node

/**
 * 一键同步最新战报到微信公众号 (v3.2 - 支持自定义封面)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 获取最新的战报文件
 */
function getLatestMatch() {
  const matchesDir = path.join(__dirname, '..', 'matches');
  if (!fs.existsSync(matchesDir)) return null;
  const files = fs.readdirSync(matchesDir).filter(f => f.endsWith('.md')).sort().reverse();
  return files.length > 0 ? files[0] : null;
}

/**
 * 读取并解析比赛文件
 */
function readMatch(filename) {
  const filePath = path.join(__dirname, '..', 'matches', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  return { data, body, filename };
}

/**
 * 转换Markdown为微信公众号HTML格式
 */
function markdownToWechatHTML(markdown, data) {
  let html = markdown;
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    return `<img src="${src}" alt="${alt}" style="width: 100%; max-width: 600px; display: block; margin: 15px auto; border-radius: 8px;" />`;
  });
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>');
  html = html.replace(/\n\n/g, '</p><p style="line-height: 1.8; margin: 10px 0; color: #555;">');
  html = '<p style="line-height: 1.8; margin: 10px 0; color: #555;">' + html + '</p>';
  html = html.replace(/\n/g, '<br/>');
  return html;
}

/**
 * 生成微信公众号文章模板
 */
function generateWechatArticle(matchData, matchBody, wechatConfig) {
  const { data, body } = matchData;
  const style = data.style || 'fresh'; // 默认使用 fresh 风格

  // 根据风格获取颜色配置
  const styleConfigs = {
    ins: {
      primary: '#a0aec0',
      secondary: '#718096',
      boxBg: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
      boxBorder: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.15)',
      logoSize: '80px',
      titleFont: '22px',
      infoBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    battle: {
      primary: '#ff6b6b',
      secondary: '#ee5a24',
      boxBg: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
      boxBorder: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
      logoSize: '100px',
      titleFont: '26px',
      infoBg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      textShadow: '0 3px 10px rgba(0,0,0,0.3)'
    },
    fresh: {
      primary: '#48bb78',
      secondary: '#38a169',
      boxBg: 'linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)',
      boxBorder: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      borderRadius: '16px',
      boxShadow: '0 6px 20px rgba(72, 187, 120, 0.2)',
      logoSize: '90px',
      titleFont: '24px',
      infoBg: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      textShadow: '0 2px 10px rgba(0,0,0,0.15)'
    }
  };

  const config = styleConfigs[style] || styleConfigs.fresh;

  // Logo (只显示在标题上方)
  const logoPath = path.resolve(__dirname, '..', wechatConfig.logo).replace(/\\/g, '/');
  const logoSection = `<div style="text-align: center; margin: 0 0 25px 0;"><img src="file:///${logoPath}" alt="${wechatConfig.name} Logo" style="width: ${config.logoSize}; height: ${config.logoSize}; display: block; margin: 0 auto; border-radius: 50%; border: 4px solid rgba(${config.primary}, 0.3); box-shadow: 0 6px 20px rgba(${config.primary}, 0.3); object-fit: cover;" /></div>`;

  // 比赛信息框
  const infoBox = `<section style="background: ${config.infoBg}; padding: 25px; border-radius: 15px; margin: 25px 0; color: white; text-align: center; box-shadow: 0 10px 30px rgba(${config.primary}, 0.4);"><h1 style="font-size: ${config.titleFont}; margin: 0 0 20px 0; font-weight: 800;">${data.title || '⚽ 比赛战报'}</h1><div style="display: flex; justify-content: space-around;"><div>📅 ${data.date}</div><div>⚔️ ${data.opponent}</div><div>🎯 ${data.score}</div></div></section>`;

  return `<div style="max-width: 650px; margin: 0 auto; background: #fff; padding: 20px;">${logoSection}${infoBox}<section style="line-height: 1.9; color: #4a4a6a;">${markdownToWechatHTML(body, data)}</section></div>`;
}

/**
 * 获取微信公众号配置
 */
function getWechatConfig(accountName = null) {
  const configPath = path.join(__dirname, '../wechat-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (accountName) {
    if (!config.accounts[accountName]) {
      throw new Error(`公众号配置不存在: ${accountName}`);
    }
    return {
      ...config.accounts[accountName],
      name: config.accounts[accountName].name,
      account: accountName,
      logo: config.logo?.[accountName] || 'logo.png'
    };
  }
  
  const defaultAccount = config.defaultAccount || Object.keys(config.accounts)[0];
  return {
    ...config.accounts[defaultAccount],
    name: config.accounts[defaultAccount].name,
    account: defaultAccount,
    logo: config.logo?.[defaultAccount] || 'logo.png'
  };
}

async function getAccessToken(appId, appSecret) {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await axios.get(url);
  return res.data.access_token;
}

async function uploadImageForUrl(token, filePath) {
  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;
  try {
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    const res = await axios.post(url, form, { headers: form.getHeaders() });
    return res.data.url;
  } catch (error) {
    throw new Error('上传正文图片失败: ' + error.message);
  }
}

async function deleteOldDrafts(token, title) {
  try {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`;
    const res = await axios.post(url, { offset: 0, count: 20 });
    
    if (res.data.item && res.data.item.length > 0) {
      const oldDrafts = res.data.item.filter(item => 
        item.content.news_item && item.content.news_item[0].title === title
      );
      
      if (oldDrafts.length > 0) {
        log(`🗑️  删除 ${oldDrafts.length} 个旧草稿...`, 'yellow');
        
        for (const draft of oldDrafts) {
          try {
            await axios.post(
              `https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=${token}`,
              { media_id: draft.media_id }
            );
          } catch (err) {
            console.error(`删除草稿失败: ${draft.media_id}`, err.message);
          }
        }
        
        log('✅ 旧草稿已删除\n', 'green');
      }
    }
  } catch (error) {
    log('⚠️  删除旧草稿时出错，继续推送...', 'yellow');
    console.error(error);
  }
}

async function uploadThumb(token, filePath) {
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=thumb`;
  try {
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    const res = await axios.post(url, form, { headers: form.getHeaders() });
    
    if (res.data.errcode) {
      throw new Error(`上传封面素材失败: ${res.data.errcode} - ${res.data.errmsg}`);
    }
    return res.data.media_id;
  } catch (error) {
    throw new Error('上传封面失败: ' + error.message);
  }
}

async function publishDraft(token, title, html, thumbId, wechatConfig) {
  if (!thumbId) throw new Error('封面图 ID (thumbId) 为空，无法创建草稿');
  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
  const data = {
    articles: [{
      title,
      author: wechatConfig.name || '公众号',
      content: html,
      digest: title,
      show_cover_pic: 1,
      thumb_media_id: thumbId
    }]
  };
  const res = await axios.post(url, data);
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`微信接口报错: ${res.data.errcode} - ${res.data.errmsg}`);
  }
  return res.data.media_id;
}

/**
 * 主流程
 */
async function main() {
  log('\n=== 一键同步微信公众号 (v3.2) ===\n', 'cyan');
  try {
    const accountName = process.argv[2];
    const wechatConfig = getWechatConfig(accountName);
    
    log(`📢 使用公众号: ${wechatConfig.name} (${wechatConfig.account})\n`, 'blue');
    
    const latest = getLatestMatch();
    if (!latest) throw new Error('未找到战报');
    const match = readMatch(latest);
    const articleHtml = generateWechatArticle(match, match.body, wechatConfig);
    
    log('🔐 获取权限...', 'yellow');
    const token = await getAccessToken(wechatConfig.appId, wechatConfig.appSecret);

    log('🗑️  检查旧草稿...', 'yellow');
    await deleteOldDrafts(token, match.data.title || '战报');

    log('🖼️  上传封面...', 'yellow');
    let coverPath;
    if (match.data.cover) {
        coverPath = path.resolve(__dirname, '..', match.data.cover);
        if (!fs.existsSync(coverPath)) {
            log(`⚠️  指定的封面不存在: ${match.data.cover}, 回退到默认 Logo`, 'red');
            coverPath = path.resolve(__dirname, '..', wechatConfig.logo);
        } else {
            log(`✅ 使用自定义封面: ${match.data.cover}`, 'green');
        }
    } else {
        coverPath = path.resolve(__dirname, '..', wechatConfig.logo);
    }
    
    const thumbId = await uploadThumb(token, coverPath);

    log('📸 转换正文图片...', 'yellow');
    let finalHtml = articleHtml;
    const imgRegex = /src=\"(?:file:\/\/\/)?([^\"]+)\"/g;
    let matchImg;
    const imgMap = new Map();
    while ((matchImg = imgRegex.exec(articleHtml)) !== null) {
      const local = matchImg[1];
      if (!imgMap.has(local) && !local.startsWith('http')) {
        const absolutePath = local.startsWith('/') ? local : path.resolve(__dirname, '..', local);
        if (fs.existsSync(absolutePath)) {
          process.stdout.write(`   📸 转换: ${path.basename(local)}...`);
          const wechatUrl = await uploadImageForUrl(token, absolutePath);
          imgMap.set(local, wechatUrl);
          process.stdout.write(' ✅\n');
        }
      }
    }
    for (const [local, remote] of imgMap) {
      finalHtml = finalHtml.split(`file:///${local}`).join(remote);
      finalHtml = finalHtml.split(`src="${local}"`).join(`src="${remote}"`);
    }

    log('📤 推送草稿...', 'yellow');
    const mediaId = await publishDraft(token, match.data.title || '战报', finalHtml, thumbId, wechatConfig);
    
    log(`✅ 推送成功! MediaID: ${mediaId}`, 'green');
    if (process.platform === 'darwin') execSync(`osascript -e 'display notification "✅ 战报已推送到草稿箱" with title "微信战报"'`);

  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    console.error(err);
  }
}

main();
