const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const matchesDir = path.join(__dirname, '..', 'matches');
const scriptsDir = __dirname;
const styles = [
    'publish-wechat.js',
    'publish-fresh.js',
    'publish-cyber.js',
    'publish-field.js',
    'publish-ins.js',
    'publish-battle.js'
];

function main() {
    console.log('🔄 开始从头重新生成所有战报...');

    if (!fs.existsSync(matchesDir)) {
        console.error('❌ Matches directory not found');
        return;
    }

    const matches = fs.readdirSync(matchesDir)
        .filter(file => file.endsWith('.md'))
        .sort()
        .reverse();

    console.log(`📚 找到 ${matches.length} 场比赛`);

    matches.forEach((match, index) => {
        console.log(`\n[${index + 1}/${matches.length}] 处理: ${match}`);

        styles.forEach(script => {
            try {
                // Run script with NO_OPEN=true environment variable
                execSync(`node "${path.join(scriptsDir, script)}" "${match}"`, {
                    stdio: 'inherit',
                    env: { ...process.env, NO_OPEN: 'true' }
                });
            } catch (error) {
                console.error(`❌ Failed to run ${script} for ${match}`);
            }
        });
    });

    console.log('\n✅ 所有战报生成完毕!');

    console.log('🔄 更新索引页面...');
    try {
        execSync(`node "${path.join(scriptsDir, 'modern-matches.js')}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Failed to update index');
    }
}

main();
