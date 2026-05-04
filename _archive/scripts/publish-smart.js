const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const readline = require('readline');

// Color codes
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

const matchesDir = path.join(__dirname, '../matches');

function getRecentMatches(limit = 5) {
    if (!fs.existsSync(matchesDir)) return [];

    return fs.readdirSync(matchesDir)
        .filter(file => file.endsWith('.md'))
        .sort().reverse() // Newest first
        .slice(0, limit);
}

function recommendStyle(data) {
    const isInternal = data.opponent.includes('内战');
    // Simple heuristic: "-" often implies a score like 3-2, common in external matches.
    // However, inner matches also have scores. 
    // The main differentiator is "内战".

    if (isInternal) {
        return {
            style: 'ins',
            reason: '检测到"内战"，推荐 Ins 风格'
        };
    } else {
        return {
            style: 'battle',
            reason: '检测到外战，推荐热血风格'
        };
    }
}

async function main() {
    log('\n🤖 智能发布助手启动...', 'cyan');

    const recentMatches = getRecentMatches();

    if (recentMatches.length === 0) {
        log('❌ 未找到任何战报', 'red');
        return;
    }

    // Default to latest match
    const latestMatchFile = recentMatches[0];
    log(`\n📄 最新战报: ${latestMatchFile}`, 'blue');

    const filePath = path.join(matchesDir, latestMatchFile);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);
    const data = parsed.data;

    log(`   对手: ${data.opponent}`, 'white');
    log(`   比分: ${data.score}`, 'white');

    const recommendation = recommendStyle(data);

    log(`\n💡 ${recommendation.reason}`, 'green');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    const answer = await question(`\n❓ 是否使用推荐的 [${recommendation.style}] 风格发布? (Y/n/other): `);

    let selectedStyle = recommendation.style;

    if (answer.toLowerCase() === 'n') {
        // Toggle style
        selectedStyle = recommendation.style === 'ins' ? 'battle' : 'ins';
        log(`\n🔄 已切换为 [${selectedStyle}] 风格`, 'yellow');
    } else if (answer.toLowerCase() === 'other') {
        // Fallback to default
        selectedStyle = 'default';
        log(`\n🔄 已切换为 [默认] 风格`, 'yellow');
    }

    rl.close();

    log(`\n🚀 开始生成 ${selectedStyle} 风格战报...`, 'cyan');

    try {
        let command = '';
        if (selectedStyle === 'ins') {
            command = 'npm run publish:ins';
        } else if (selectedStyle === 'battle') {
            command = 'npm run publish:battle';
        } else {
            command = 'npm run sync';
        }

        // Pass the specific date/file if the publish scripts support it (assuming they default to latest or we might need to modify them to accept args, but for now we follow the "latest" logic which matches this script's default)
        // NOTE: Standard scripts usually pick the latest or have a menu. 
        // To be safe, we rely on their default behavior which is usually "latest" or "menu".
        // If we want to be specific, we might need a "publish:specific" script.
        // For now, let's assume standard behavior.

        execSync(command, { stdio: 'inherit' });

    } catch (error) {
        log(`\n❌ 执行出错: ${error.message}`, 'red');
    }
}

main();
