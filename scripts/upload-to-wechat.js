#!/usr/bin/env node

/**
 * 🚀 一键发布到微信公众号草稿箱 (Advanced)
 *
 * 功能：
 * 1. 自动上传文中所有图片到微信服务器
 * 2. 替换本地图片路径为微信URL
 * 3. 自动上传封面图
 * 4. 创建图文草稿
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const matter = require('gray-matter');
const FormData = require('form-data');
const { getLatestMatch, resolveMatchFile, markdownToHTML, log } = require('./utils/publish-helper');
const { runPreflight, formatPreflightReport } = require('./utils/wechat-preflight');
const { autoInsertUnusedPhotos } = require('./utils/photo-layout');
const { resolveCoverPlan } = require('./utils/cover-strategy');
const { buildDigest } = require('./utils/digest-strategy');

/**
 * 交互式选择账号
 */
async function selectAccount(accounts) {
  const accountNames = Object.keys(accounts);
  if (accountNames.length === 0) return null;
  if (accountNames.length === 1) return accountNames[0];

  console.log('\n📋 可用公众号账号:');
  accountNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n🎯 请输入账号序号或名称: ', (answer) => {
      rl.close();
      const trimmed = answer.trim();
      
      // 按序号选择
      const index = parseInt(trimmed) - 1;
      if (!isNaN(index) && accountNames[index]) {
        resolve(accountNames[index]);
        return;
      }
      
      // 按名称选择
      if (accountNames.includes(trimmed)) {
        resolve(trimmed);
        return;
      }

      console.log('⚠️ 无效选择，使用默认。');
      resolve(accountNames[0]);
    });
  });
}

// 动态加载模板函数
function loadTemplate(style = 'default') {
  try {
    let templateModule;
    if (style === 'default') {
      templateModule = require('./wechat-template');
    } else {
      // 支持 raphael:theme 语法，如 raphael:retro
      const baseName = style.includes(':') ? style.split(':')[0] : style;
      templateModule = require(`./wechat-template-${baseName}`);
    }
    return templateModule.getArticleTemplate;
  } catch (e) {
    log(`⚠️ 找不到模板 "${style}"，将使用默认模板。`, 'yellow');
    return require('./wechat-template').getArticleTemplate;
  }
}

// 配置
const CONFIG_FILE = path.join(__dirname, '../wechat-config.json');
const PUBLISH_LOG_DIR = path.join(__dirname, '../logs/publish-history');

// 微信API地址
const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

/**
 * 读取配置
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    log('❌ 配置文件不存在: wechat-config.json', 'red');
    log('💡 请参考模板创建 wechat-config.json', 'yellow');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function parseCliArgs(argv) {
  const options = {
    positional: [],
    flags: new Set(),
    values: new Map()
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      options.positional.push(arg);
      continue;
    }

    const next = argv[i + 1];
    const expectsValue = ['--account', '-a', '--style'].includes(arg);
    if (expectsValue && next && !next.startsWith('-')) {
      options.values.set(arg, next);
      i += 1;
      continue;
    }

    options.flags.add(arg);
  }

  return options;
}

function getOptionValue(cli, names = []) {
  for (const name of names) {
    if (cli.values.has(name)) return cli.values.get(name);
  }
  return undefined;
}

function hasFlag(cli, names = []) {
  return names.some(name => cli.flags.has(name));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writePublishLog(payload) {
  ensureDir(PUBLISH_LOG_DIR);
  const ts = new Date();
  const stamp = ts.toISOString().replace(/[:.]/g, '-');
  const matchStem = String(payload.matchFile || 'unknown-match').replace(/\.md$/i, '');
  const outcome = String(payload.outcome || 'event');
  const fileName = `${stamp}-${outcome}-${matchStem}.json`;
  const filePath = path.join(PUBLISH_LOG_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  return filePath;
}

function buildPublishMeta({
  accountName,
  matchFile,
  filePath,
  data,
  style,
  showScore,
  strictPreflight,
  aiCoverEnabled,
  preflightReport,
  coverPlan,
  digestPlan
}) {
  return {
    eventAt: new Date().toISOString(),
    account: accountName || '',
    matchFile: matchFile || '',
    matchFilePath: filePath || '',
    title: data?.title || '',
    opponent: data?.opponent || '',
    date: data?.date || '',
    style: style || 'default',
    showScore: Boolean(showScore),
    strictPreflight: Boolean(strictPreflight),
    aiCoverEnabled: Boolean(aiCoverEnabled),
    coverStrategy: coverPlan?.strategy || '',
    coverSourcePath: coverPlan?.sourcePath || '',
    digestSource: digestPlan?.source || '',
    digestReason: digestPlan?.reason || '',
    digest: digestPlan?.digest || '',
    preflightStatus: preflightReport?.status || 'unknown',
    preflightChecks: preflightReport?.checks || [],
    logVersion: 1
  };
}

/**
 * 获取 Access Token
 */
async function getAccessToken(appId, appSecret) {
  const url = `${API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`获取Access Token失败: ${data.errmsg}`);
  }
  return data.access_token;
}

/**
 * 确保图片大小符合微信限制 (2MB)
 * 如果超过限制，使用 ffmpeg 自动压缩
 */
function ensureImageSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (stats.size <= maxSize) {
      return filePath;
    }

    log(`   ⚠️ 图片超过 2MB (${(stats.size / 1024 / 1024).toFixed(2)}MB)，启动自动压缩...`, 'yellow');
    
    const ext = path.extname(filePath);
    const tempPath = path.join(path.dirname(filePath), `compressed_${Date.now()}_${path.basename(filePath, ext)}.jpg`);
    
    // 使用 ffmpeg 压缩：限制最大宽度 1280，转换为 jpg 格式通常体积更小
    execSync(`ffmpeg -i "${filePath}" -vf "scale='min(1280,iw)':-1" -q:v 2 "${tempPath}" -y`, { stdio: 'ignore' });
    
    const newStats = fs.statSync(tempPath);
    log(`   ✅ 压缩完成: ${(newStats.size / 1024 / 1024).toFixed(2)}MB`, 'green');
    
    // 注册到清理列表
    if (!global.tempFiles) global.tempFiles = [];
    global.tempFiles.push(tempPath);
    
    return tempPath;
  } catch (e) {
    log(`   ❌ 压缩失败: ${e.message}，尝试原图上传。`, 'red');
    return filePath;
  }
}

/**
 * 上传图片 (用于正文)
 * 返回 URL
 * 使用 curl 上传，最稳定
 */
async function uploadImage(accessToken, filePath) {
  const finalPath = ensureImageSize(filePath);
  const url = `${API_BASE}/media/uploadimg?access_token=${accessToken}`;
  const cmd = `curl -s -X POST -F "media=@${finalPath}" "${url}"`;
  
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);

  if (data.errcode) {
    throw new Error(`上传图片失败 (${path.basename(filePath)}): ${data.errmsg}`);
  }
  return data.url;
}

/**
 * 上传封面图 (永久素材)
 * 返回 media_id
 * 使用 curl 上传，最稳定
 */
async function uploadCover(accessToken, filePath) {
  const finalPath = ensureImageSize(filePath);
  const url = `${API_BASE}/material/add_material?access_token=${accessToken}&type=image`;
  const cmd = `curl -s -X POST -F "media=@${finalPath}" "${url}"`;
  
  const output = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(output);

  if (data.errcode) {
    throw new Error(`上传封面图失败: ${data.errmsg}`);
  }
  return data.media_id;
}

/**
 * 创建草稿
 */
async function createDraft(accessToken, article) {
  const url = `${API_BASE}/draft/add?access_token=${accessToken}`;
  
  const payload = {
    articles: [article]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`创建草稿失败: ${data.errmsg}`);
  }
  return data.media_id; // 草稿ID
}

/**
 * 主逻辑
 */
async function main() {
  try {
    const cli = parseCliArgs(process.argv.slice(2));
    const fullConfig = loadConfig();
    const accounts = fullConfig.accounts || {};

    let accountName = getOptionValue(cli, ['--account', '-a']);
    if (!accountName) {
      // 否则进入交互式选择
      accountName = await selectAccount(accounts);
    }
    
    const config = accounts[accountName];

    if (!config || !config.appId || !config.appSecret) {
      log(`❌ 账号 "${accountName}" 未配置或缺少 AppID 和 AppSecret`, 'red');
      return;
    }

    log(`🚀 开始自动发布流程 (账号: ${accountName})...`, 'cyan');

    // 1. 获取比赛信息
    const argFile = cli.positional[0];
    const matchFile = resolveMatchFile(argFile);
    if (!matchFile) {
      log('❌ 未找到比赛文件', 'red');
      return;
    }

    const filePath = path.join(__dirname, '../matches', matchFile);

    // 解析配置选项
    let showScore = config.showScore !== false; // 默认显示比分，可设为 false 隐藏
    const aiCoverEnabled = !hasFlag(cli, ['--no-ai-cover']); // 默认开启 AI 封面
    const strictPreflight = hasFlag(cli, ['--strict-preflight']);

    const preflightReport = runPreflight({
      matchFilePath: filePath,
      repoRoot: path.join(__dirname, '..'),
      config: { ...config, showScore },
      options: { aiCover: aiCoverEnabled }
    });

    const preflightMeta = buildPublishMeta({
      accountName,
      matchFile,
      filePath,
      data: preflightReport?.summary ? {
        title: preflightReport.summary.title,
        opponent: preflightReport.summary.opponent,
        date: preflightReport.summary.date
      } : {},
      style: getOptionValue(cli, ['--style']) || 'default',
      showScore,
      strictPreflight,
      aiCoverEnabled,
      preflightReport,
      coverPlan: preflightReport?.summary ? {
        strategy: preflightReport.summary.coverStrategy,
        sourcePath: preflightReport.summary.coverSourcePath
      } : null,
      digestPlan: preflightReport?.summary ? {
        source: preflightReport.summary.digestSource,
        reason: preflightReport.summary.digestReason,
        digest: preflightReport.summary.digest
      } : null
    });

    log('\n🩺 发布前预检', 'cyan');
    console.log(formatPreflightReport(preflightReport));

    if (preflightReport.status === 'error') {
      const preflightLogPath = writePublishLog({
        ...preflightMeta,
        outcome: 'preflight-error',
        stoppedAt: new Date().toISOString(),
        stopReason: 'preflight-error'
      });
      log(`🗂️  预检失败记录已保存: ${path.relative(path.join(__dirname, '..'), preflightLogPath)}`, 'cyan');
      log('\n❌ 预检失败，已中止发布。请先修复上述问题。', 'red');
      return;
    }

    if (preflightReport.status === 'warn') {
      if (strictPreflight) {
        const preflightLogPath = writePublishLog({
          ...preflightMeta,
          outcome: 'preflight-warn-blocked',
          stoppedAt: new Date().toISOString(),
          stopReason: 'strict-preflight-blocked-on-warning'
        });
        log(`🗂️  预检阻塞记录已保存: ${path.relative(path.join(__dirname, '..'), preflightLogPath)}`, 'cyan');
        log('\n⚠️ 预检存在警告，且启用了 --strict-preflight，已中止发布。', 'yellow');
        return;
      }
      const preflightLogPath = writePublishLog({
        ...preflightMeta,
        outcome: 'preflight-warn-continue',
        continuedAt: new Date().toISOString(),
        stopReason: ''
      });
      log(`🗂️  预检警告记录已保存: ${path.relative(path.join(__dirname, '..'), preflightLogPath)}`, 'cyan');
      log('\n⚠️ 预检存在警告，继续发布。可用 --strict-preflight 将警告视为阻塞。', 'yellow');
    } else {
      log('\n✅ 预检通过，继续发布。', 'green');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    // 命令行参数覆盖配置
    if (hasFlag(cli, ['--no-score'])) {
      showScore = false;
    } else if (hasFlag(cli, ['--show-score'])) {
      showScore = true;
    }

    log(`📄 正在处理: ${data.title} (隐藏比分: ${!showScore})`, 'blue');

    // 2. 获取 Access Token
    log('🔐 获取微信 Access Token...', 'yellow');
    const token = await getAccessToken(config.appId, config.appSecret);
    log('✅ Access Token 获取成功', 'green');

    // 3. 并行：上传文中图片 + 生成 AI 封面（默认直出生图，失败回退 HTML）
    let aiCoverPath = null;
    const coverPromise = aiCoverEnabled ? (async () => {
      log('🎨 正在直出生图封面...', 'magenta');
      try {
        const { generateAICover } = require('./generate-ai-cover');
        aiCoverPath = await generateAICover(filePath, data);
        log('   ✅ AI 生图封面就绪', 'green');
      } catch (e) {
        log(`   ⚠️ AI 生图失败，回退 HTML: ${e.message}`, 'yellow');
        try {
          const { generateHTMLCover } = require('./generate-html-cover');
          aiCoverPath = await generateHTMLCover(filePath, data);
          log('   ✅ HTML 封面回退成功', 'green');
        } catch (fallbackError) {
          log(`   ⚠️ HTML 封面生成失败: ${fallbackError.message}`, 'red');
        }
      }
    })() : Promise.resolve();

    const imagePromise = (async () => {
      log('🖼️  正在上传文中图片...', 'yellow');
      let processedBody = body;
      const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      const imagesToUpload = [];

      // 收集所有图片
      while ((match = imageRegex.exec(body)) !== null) {
        imagesToUpload.push({
          fullMatch: match[0],
          alt: match[1],
          src: match[2]
        });
      }

      const layoutResult = autoInsertUnusedPhotos(body, data.photos || []);
      if (layoutResult.changed) {
        log(`💡 检测到 ${layoutResult.report.unusedCount} 张未使用的图片，启动智能补全...`, 'magenta');
        if (layoutResult.report.appendedWallCount > 0) {
          log(`   ⚠️ 还有 ${layoutResult.report.appendedWallCount} 张图片，生成文末照片墙`, 'yellow');
        }
        processedBody = layoutResult.body;

        // 重新扫描所有图片
        imagesToUpload.length = 0;
        while ((match = imageRegex.exec(processedBody)) !== null) {
          imagesToUpload.push({
            fullMatch: match[0],
            alt: match[1],
            src: match[2]
          });
        }
      }

      // 逐个上传并替换
      let logoWechatUrl = null;
      for (const img of imagesToUpload) {
        // 解析绝对路径
        const imgPath = path.resolve(__dirname, '..', img.src);
        if (fs.existsSync(imgPath)) {
          log(`   ⬆️  上传: ${path.basename(img.src)}`, 'blue');
          try {
            const wechatUrl = await uploadImage(token, imgPath);
            
            // 捕获 Logo 的 URL
            if (path.basename(img.src).includes('logo')) {
               logoWechatUrl = wechatUrl;
            }

            // 替换 Markdown 中的链接为微信 URL
            processedBody = processedBody.replace(img.src, wechatUrl);
          } catch (e) {
            log(`   ⚠️  上传失败: ${e.message}`, 'red');
          }
        } else {
          log(`   ⚠️  图片未找到: ${img.src}`, 'yellow');
        }
      }

      // 确保 Logo 已上传（即使正文中没有引用 logo）
      const defaultLogoPath = path.join(__dirname, '../logo-200.png');
      if (!logoWechatUrl && fs.existsSync(defaultLogoPath)) {
        log('🖼️  正在上传 Logo...', 'yellow');
        try {
          logoWechatUrl = await uploadImage(token, defaultLogoPath);
          log('✅ Logo 已上传并获取正文链接', 'green');
        } catch (e) {
          log(`⚠️  Logo 上传失败: ${e.message}`, 'red');
        }
      }

      return { processedBody, logoWechatUrl };
    })();

    const [{ processedBody, logoWechatUrl }] = await Promise.all([imagePromise, coverPromise]);

    // 结尾签名已由 wechat-template.js 的 footer 处理，此处不再重复插入

    // 4. 转换 HTML
    let htmlContent = markdownToHTML(processedBody, {
      h3: '<h3>$1</h3>',
      h2: '<h2>$1</h2>',
      p: '<p>$1</p>'
    });

    // 5. 上传封面图
    let thumbMediaId = config.defaultThumbId; 
    const coverPlan = resolveCoverPlan({
      data,
      config: { ...fullConfig, ...config, showScore },
      options: { aiCover: aiCoverEnabled, matchFile },
      repoRoot: path.join(__dirname, '..')
    });
    log(`🖼️  封面策略: ${coverPlan.strategy}${coverPlan.sourcePath ? ` (${coverPlan.sourcePath})` : ''}`, 'cyan');

    if (aiCoverPath && fs.existsSync(aiCoverPath)) {
      log(`🖼️  正在上传 AI 封面图...`, 'yellow');
      try {
        thumbMediaId = await uploadCover(token, aiCoverPath);
        const coverUrl = await uploadImage(token, aiCoverPath);
        const headerHtml = `<div style="margin: -20px -10px 20px -10px;"><img src="${coverUrl}" style="width: 100%; display: block; border-radius: 0;"></div>`;
        htmlContent = headerHtml + htmlContent;
        log('✅ AI 封面已应用', 'green');
      } catch (e) {
        log(`⚠️  AI 封面上传失败: ${e.message}`, 'red');
      }
    } else if (coverPlan.expectedPath && fs.existsSync(coverPlan.expectedPath)) {
      log(`🖼️  正在上传封面图: ${path.basename(coverPlan.expectedPath)}`, 'yellow');
      try {
        thumbMediaId = await uploadCover(token, coverPlan.expectedPath);
        if (coverPlan.sourceType === 'logo') {
          logoWechatUrl = await uploadImage(token, coverPlan.expectedPath);
          log('✅ Logo 已上传并获取正文链接', 'green');
        } else if (data.coverBody === false) {
          // frontmatter 设置 coverBody: false 时，仅用作缩略图，不插入正文
          log('✅ 封面仅用作缩略图（coverBody: false），不插入正文', 'green');
        } else {
          const coverUrl = await uploadImage(token, coverPlan.expectedPath);
          const headerHtml = `<div style="margin: -20px -10px 20px -10px;"><img src="${coverUrl}" style="width: 100%; display: block; border-radius: 0;"></div>`;
          htmlContent = headerHtml + htmlContent;
          log('✅ 正文首屏已插入横版封面图', 'green');
        }
        log('✅ 封面图上传成功', 'green');
      } catch (e) {
        log(`⚠️  封面图上传失败: ${e.message}`, 'red');
      }
    }

    if (!thumbMediaId) {
      log('⚠️  没有封面图，发布可能会失败', 'red');
      // 可以在这里尝试上传默认 Logo
      // thumbMediaId = await uploadCover(token, path.join(__dirname, '../logo-200.png'));
    }

    // 6. 创建草稿
    log('📝 正在创建草稿...', 'yellow');

    // 解析模板风格参数 (默认为 'default')
    let style = getOptionValue(cli, ['--style']) || config.defaultStyle || 'default';
    
    // 支持 raphael:theme 语法，提取主题名
    let themeName;
    if (style.startsWith('raphael')) {
      if (style.includes(':')) {
        themeName = style.split(':')[1].trim();
        log(`🎨 使用排版风格: raphael (${themeName})`, 'cyan');
      } else {
        themeName = 'claude';
        log(`🎨 使用排版风格: raphael (claude)`, 'cyan');
      }
    } else {
      log(`🎨 使用排版风格: ${style}`, 'cyan');
    }
    
    // 加载对应模板
    const getArticleTemplate = loadTemplate(style);

    // 过滤掉 Logo，只让比赛照片显示在正文
    const photosWithoutLogo = (data.photos || []).filter(p => {
      const pPath = typeof p === 'string' ? p : p.path;
      if (!pPath) return false;
      return !pPath.includes('logo');
    });

    // 生成完整文章 HTML (正文只渲染比赛照片，不包括 Logo)
    // 传入捕获到的 logoWechatUrl 和配置选项
    const articleHtml = getArticleTemplate(data, htmlContent, photosWithoutLogo, logoWechatUrl, { showScore, themeName });

    const digestPlan = buildDigest({ data, body, maxLength: 110 });
    log(`📝 摘要策略: ${digestPlan.source} (${digestPlan.reason})`, 'cyan');

    const article = {
      title: data.title,
      author: '知己FC',
      digest: digestPlan.digest,
      content: articleHtml,
      content_source_url: '',
      thumb_media_id: thumbMediaId,
      show_cover_pic: 1,
      need_open_comment: 1,
      only_fans_can_comment: 0
    };

    const draftId = await createDraft(token, article);
    log(`✅ 草稿创建成功! Draft ID: ${draftId}`, 'green');

    const publishLog = {
      ...buildPublishMeta({
        accountName,
        matchFile,
        filePath,
        data,
        style,
        showScore,
        strictPreflight,
        aiCoverEnabled,
        preflightReport,
        coverPlan,
        digestPlan
      }),
      outcome: 'success',
      publishedAt: new Date().toISOString(),
      draftId
    };
    const publishLogPath = writePublishLog(publishLog);
    log(`🗂️  发布记录已保存: ${path.relative(path.join(__dirname, '..'), publishLogPath)}`, 'cyan');
    log('\n🎉 请前往微信公众号后台查看草稿箱！', 'cyan');

    // 清理临时文件
    if (global.tempFiles && global.tempFiles.length > 0) {
      log('\n🧹 正在清理临时文件...', 'yellow');
      global.tempFiles.forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      log('✅ 清理完成', 'green');
    }

  } catch (error) {
    log(`❌ 发生错误: ${error.message}`, 'red');
    console.error(error);
  }
}

main();
