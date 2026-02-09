const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[97m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 获取最新比赛
 */
function getLatestMatch() {
    const matchesDir = path.join(__dirname, '../../matches');
    if (!fs.existsSync(matchesDir)) return null;

    const files = fs.readdirSync(matchesDir)
        .filter(file => file.endsWith('.md'))
        .sort()
        .reverse();

    return files.length > 0 ? files[0] : null;
}

/**
 * 解析比赛文件参数
 */
/**
 * 解析比赛文件参数
 */
function resolveMatchFile(argFile) {
    if (!argFile) return getLatestMatch();

    const matchesDir = path.join(__dirname, '../../matches');
    // 1. 尝试直接匹配
    const exactPath = path.join(matchesDir, argFile.endsWith('.md') ? argFile : `${argFile}.md`);
    if (fs.existsSync(exactPath)) {
        return path.basename(exactPath);
    }

    // 2. 尝试前缀匹配 (例如输入 "2026-02-08" 匹配 "2026-02-08-内战.md")
    if (fs.existsSync(matchesDir)) {
        const files = fs.readdirSync(matchesDir);
        const match = files.find(f => f.startsWith(argFile) && f.endsWith('.md'));
        if (match) return match;
    }

    return null;
}

/**
 * 加载照片
 */
function loadPhotos(data) {
    const photosDir = path.join(__dirname, '../../photos', data.date);
    if (!fs.existsSync(photosDir)) return [];

    const files = fs.readdirSync(photosDir)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .sort();

    return files.map(filename => ({
        path: path.join('photos', data.date, filename).replace(/\\/g, '/'),
        caption: ''
    }));
}

/**
 * Markdown转HTML (通用逻辑)
 */
function markdownToHTML(markdown, styles = {}) {
    let html = markdown;

    // 1. 标题处理
    if (styles.h3) {
        // 支持函数或字符串替换
        if (typeof styles.h3 === 'function') {
            html = html.replace(/^### (.*$)/gim, styles.h3);
        } else {
            html = html.replace(/^### (.*$)/gim, styles.h3);
        }
    }

    if (styles.h2) {
        if (typeof styles.h2 === 'function') {
            html = html.replace(/^## (.*$)/gim, styles.h2);
        } else {
            html = html.replace(/^## (.*$)/gim, styles.h2);
        }
    }

    // 2. 粗体处理
    if (styles.strong) {
        html = html.replace(/\*\*(.*?)\*\*/g, styles.strong);
    }

    // 3. 图片处理 (统一路径逻辑)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        // 始终使用完整相对路径
        const imgStyle = styles.img || 'width: 100%; max-width: 600px; display: block; margin: 15px auto; border-radius: 8px;';
        return `<img src="${src}" alt="${alt}" style="${imgStyle}" />`;
    });

    // 4. 链接处理
    const linkStyle = styles.link || 'color: #1890ff; text-decoration: none;';
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${linkStyle}">$1</a>`);

    // 5. 段落处理
    const pStyle = styles.p || 'line-height: 1.8; margin: 10px 0; color: #555;';
    html = html.replace(/\n\n/g, `</p><p style="${pStyle}">`);
    html = `<p style="${pStyle}">` + html + '</p>';

    // 6. 换行处理
    html = html.replace(/\n/g, '<br/>');

    return html;
}

/**
 * 主发布流程
 */
function runPublishWorkflow(options) {
    const {
        styleName,      // e.g., 'Fresh', 'Cyber'
        templateName,   // e.g., 'fresh', 'cyber' (for filename)
        getTemplate,    // function(data, contentHTML, photos)
        markdownStyles, // object for markdownToHTML configuration
        themeColor = 'green', // for log color
        stepsDesc = {}  // custom descriptions for steps
    } = options;

    log(`\n${stepsDesc.startIcon || '🚀'} 正在使用 [${styleName}] 风格生成战报...`, themeColor);

    // 1. 获取比赛文件
    const argFile = process.argv[2];
    const matchFile = resolveMatchFile(argFile);

    if (!matchFile) {
        log('❌ 未找到比赛记录', 'red');
        return;
    }

    // 2. 读取内容
    const filePath = path.join(__dirname, '../../matches', matchFile);
    if (!fs.existsSync(filePath)) {
        log(`❌ 文件不存在: ${filePath}`, 'red');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    log(`✅ 找到: ${data.title}`, themeColor);
    log(`   📅 ${data.date}`, 'blue');
    log(`   ⚔️ ${data.opponent} vs 知己`, 'blue');
    log(`   🎯 ${data.score}`, 'blue');

    // 3. 转换HTML
    log(`\n🔄 正在生成文章...`, 'yellow');
    const contentHTML = markdownToHTML(body, markdownStyles);
    const photos = data.photos || loadPhotos(data);
    const article = getTemplate(data, contentHTML, photos);

    // 4. 保存文件
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 处理输出文件名
    const suffix = templateName === 'default' ? '' : `-${templateName}`;
    const htmlFile = path.join(outputDir, `wechat-${matchFile.replace('.md', '')}${suffix}.html`);
    fs.writeFileSync(htmlFile, article, 'utf-8');
    log(`✅ 文章已生成: ${path.basename(htmlFile)}`, themeColor);

    // 5. 复制到剪贴板
    log('\n📋 正在复制HTML到剪贴板...', 'yellow');
    try {
        if (process.platform === 'darwin') {
            execSync(`cat "${htmlFile}" | pbcopy`);
            // Mac系统通知
            try {
                execSync(`osascript -e 'display notification "✅ HTML内容已复制到剪贴板，可直接粘贴" with title "战报发布助手"'`);
            } catch (e) { /* ignore notification error */ }
        } else {
            execSync(`echo "${article.replace(/"/g, '\\\"')}" | clip`, { windowsHide: true });
        }
        log('✅ HTML已复制到剪贴板', 'green');
    } catch (error) {
        log('⚠️  自动复制失败，请手动复制', 'yellow');
    }

    // 6. 打开浏览器
    log('\n🌐 正在打开浏览器预览...', 'yellow');
    if (!process.env.NO_OPEN) {
        try {
            const absolutePath = path.resolve(htmlFile);
            if (process.platform === 'darwin') {
                execSync(`open "${absolutePath}"`);
            } else {
                execSync(`start "" "${absolutePath}"`, { windowsHide: true });
            }
            log('✅ 预览已打开', 'green');
        } catch (error) {
            log(`⚠️  请手动打开`, 'yellow');
        }
    }

    // 7. 显示发布步骤提示
    log('\n╔════════════════════════════════════════════════════════╗', themeColor);
    log('║              📝 微信公众号发布步骤                    ║', themeColor);
    log('╚════════════════════════════════════════════════════════╝', themeColor);

    // ... (简化提示，或者允许传入自定义提示)
    log('\n👉 1. 在浏览器预览确认样式', 'blue');
    log('👉 2. 复制到公众号编辑器 (已自动复制到剪贴板)', 'blue');
    log('👉 3. 上传Logo和照片', 'blue');

    if (stepsDesc.tips) {
        log('\n💡 提示:', 'yellow');
        stepsDesc.tips.forEach(tip => log(`   - ${tip}`, 'white'));
    }
}

module.exports = {
    getLatestMatch,
    resolveMatchFile,
    loadPhotos,
    markdownToHTML,
    runPublishWorkflow,
    log,
    colors
};
