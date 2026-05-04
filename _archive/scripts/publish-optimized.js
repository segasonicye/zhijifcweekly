#!/usr/bin/env node
/**
 * 🛠️ 优化后的战报发布脚本（带重试、日志和验证）
 * 
 * 功能：
 * 1. 读取指定的 Markdown 文件
 * 2. 验证数据完整性
 * 3. 自动上传 Logo 和封面图（带重试）
 * 4. 渲染为赛博朋克风格 HTML
 * 5. 推送到微信草稿箱（带重试）
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { Logger } = require('./utils/logger');
const { Validator } = require('./utils/validator');
const { Metrics } = require('./utils/metrics');
const { retryWithBackoff } = require('./utils/retry');

// 初始化日志器
const logDir = path.join(__dirname, '..', 'logs/battle-report');
const logger = new Logger({
  level: 'info',
  logFile: path.join(logDir, `publish-${new Date().toISOString().slice(0, 10)}.log`)
});

// 初始化指标采集器
const metrics = new Metrics();

// 配置
const configPath = path.join(__dirname, '../config/battle-report.json');
let config = {};

// 加载配置
function loadConfig() {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    logger.info('Config loaded', { path: configPath });
  } else {
    // 降级到旧配置
    const oldConfigPath = path.join(__dirname, '../wechat-config.json');
    if (fs.existsSync(oldConfigPath)) {
      const oldConfig = JSON.parse(fs.readFileSync(oldConfigPath, 'utf8'));
      config.wechat = oldConfig.accounts['zhiji'];
      logger.warn('Using deprecated config file', { path: oldConfigPath });
    } else {
      throw new Error('No config file found');
    }
  }
}

// 获取 Access Token（带重试）
async function getAccessToken() {
  logger.info('Getting WeChat access token...');

  const account = config.wechat;

  return retryWithBackoff(async (attempt) => {
    metrics.startTimer('getAccessToken');
    logger.debug(`Attempt ${attempt + 1} to get access token`);

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;
    const res = await axios.get(url);

    if (res.data.access_token) {
      metrics.endTimer('getAccessToken');
      logger.info('Access token obtained', { expiresIn: res.data.expires_in });
      return res.data.access_token;
    } else {
      throw new Error(`Failed to get token: ${JSON.stringify(res.data)}`);
    }
  }, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  });
}

// 上传图片（带重试）
async function uploadImage(token, imagePath) {
  if (!fs.existsSync(imagePath)) {
    logger.warn('Image file not found, skipping', { path: imagePath });
    return null;
  }

  logger.info('Uploading image', { path: path.basename(imagePath) });

  return retryWithBackoff(async (attempt) => {
    metrics.startTimer(`uploadImage-${path.basename(imagePath)}`);
    logger.debug(`Attempt ${attempt + 1} to upload image`);

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', 'image');

    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
    const headers = form.getHeaders();
    const res = await axios.post(url, form, { headers });

    if (res.data.url) {
      metrics.endTimer(`uploadImage-${path.basename(imagePath)}`);
      logger.info('Image uploaded successfully', { url: res.data.url });
      return res.data.url;
    } else {
      throw new Error(`Upload failed: ${JSON.stringify(res.data)}`);
    }
  }, {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000
  });
}

// 上传封面图（带重试）
async function uploadCover(token, imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Cover image not found: ${imagePath}`);
  }

  logger.info('Uploading cover image', { path: path.basename(imagePath) });

  return retryWithBackoff(async (attempt) => {
    metrics.startTimer('uploadCover');
    logger.debug(`Attempt ${attempt + 1} to upload cover`);

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', 'image');

    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
    const headers = form.getHeaders();
    const res = await axios.post(url, form, { headers });

    if (res.data.media_id) {
      metrics.endTimer('uploadCover');
      logger.info('Cover uploaded successfully', { media_id: res.data.media_id });
      return res.data.media_id;
    } else {
      throw new Error(`Upload failed: ${JSON.stringify(res.data)}`);
    }
  }, {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000
  });
}

// Markdown 转 HTML（赛博朋克风）
function markdownToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 28px; font-weight: 900; margin: 30px 0 20px; color: #00f3ff; text-shadow: 0 0 10px rgba(0, 243, 255, 0.5); text-transform: uppercase; letter-spacing: 2px;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 22px; font-weight: 700; margin: 25px 0 15px; color: #bc13fe; border-left: 4px solid #bc13fe; padding-left: 15px; text-shadow: 0 0 8px rgba(188, 19, 254, 0.4);">> $1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 8px;">/// $1 ///</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #f600ff; font-weight: 800;">$1</strong>')
    .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid #00f3ff; padding-left: 15px; margin: 20px 0; color: #ddd; background: #111; padding: 15px; border-radius: 4px; font-style: normal;">> $1</blockquote>')
    .split('\n\n').map(p => {
      let content = p.replace(/\n/g, '<br/>');
      if (content.startsWith('<h') || content.startsWith('<blockquote')) return content;
      return `<p style="font-size: 16px; line-height: 1.8; margin: 15px 0; color: #ccc;">${content}</p>`;
    }).join('\n');

  html = html.replace(/<img\s+([^>]*?)>/gim, (match, attrs) => {
    if (attrs.includes('display: block') || attrs.includes('margin-left: auto')) {
      return match;
    }
    return `<img ${attrs} style="display: block; margin-left: auto; margin-right: auto; max-width: 100%;" />`;
  });

  return `<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #050505; padding: 30px 20px; color: #ddd;">{{LOGO_SECTION}}${html}</div>`;
}

// 推送草稿到微信（带重试）
async function publishDraft(token, draftData) {
  logger.info('Publishing draft to WeChat...');

  return retryWithBackoff(async (attempt) => {
    metrics.startTimer('publishDraft');
    logger.debug(`Attempt ${attempt + 1} to publish draft`);

    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
    const res = await axios.post(url, draftData);

    if (res.data.media_id) {
      metrics.endTimer('publishDraft');
      logger.info('Draft published successfully', { media_id: res.data.media_id });
      return res.data.media_id;
    } else {
      throw new Error(`Publish failed: ${JSON.stringify(res.data)}`);
    }
  }, {
    maxRetries: 3,
    baseDelay: 3000,
    maxDelay: 20000
  });
}

// 主逻辑
async function main() {
  metrics.startTimer('total');
  logger.info('Starting optimized publish workflow');

  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ 用法: node scripts/publish-optimized.js <markdown-file>');
    process.exit(1);
  }

  try {
    // 验证文件存在
    Validator.validateFileExists(filePath, 'Markdown file');
    logger.info('File validated', { path: filePath });

    // 加载配置
    loadConfig();

    // 读取内容
    const content = fs.readFileSync(filePath, 'utf8');
    logger.info('File read successfully', { size: content.length });

    // 获取 Access Token
    const token = await getAccessToken();

    // 上传 Logo
    const logoPath = config.paths?.logoPath || path.join(__dirname, '../logo-150.png');
    let logoHtml = '';
    const logoUrl = await uploadImage(token, logoPath);
    if (logoUrl) {
      logoHtml = `
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #0f0f13; border: 1px solid #00f3ff; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);">
          <img src="${logoUrl}" alt="Logo" style="max-width: 150px; display: block; margin-left: auto; margin-right: auto;" />
        </div>`;
    }

    // 渲染 Markdown 为 HTML
    const rawHtml = markdownToHtml(content);
    const html = rawHtml.replace('{{LOGO_SECTION}}', logoHtml);

    // 获取封面图
    let coverPath = config.paths?.defaultCover || path.join(__dirname, '../football-theme.png');

    // 情人节特殊封面
    const isValentinesDay = (new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }).slice(5) === '02-14');
    if (isValentinesDay) {
      const valentineCover = config.paths?.valentineCover || path.join(__dirname, '../football-theme-valentine.png');
      if (fs.existsSync(valentineCover)) {
        logger.info('Using Valentine\'s Day cover');
        coverPath = valentineCover;
      }
    }

    // 验证封面图
    Validator.validateImageFile(coverPath);
    const thumbMediaId = await uploadCover(token, coverPath);

    // 构造文章数据
    const titleMatch = content.match(/^# (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : '知己FC战报';

    const draftData = {
      articles: [
        {
          title: title,
          author: '知己FC',
          digest: '点击查看比赛战报',
          content: html,
          content_source_url: '',
          thumb_media_id: thumbMediaId,
          need_open_comment: 1,
          only_fans_can_comment: 0
        }
      ]
    };

    // 提交草稿
    const mediaId = await publishDraft(token, draftData);

    console.log('\n✅✅✅ 发布成功！');
    console.log('📝 草稿 Media ID:', mediaId);
    console.log('👉 请前往公众号后台查看并群发。');
    logger.info('Workflow completed successfully', { mediaId, title });

  } catch (err) {
    logger.error('Workflow failed', { error: err.message, stack: err.stack });
    console.error('❌ 发生错误:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  } finally {
    metrics.endTimer('total');
    metrics.printSummary();
    logger.info('Publish workflow completed');
  }
}

main();
