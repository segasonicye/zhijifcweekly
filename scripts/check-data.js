const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Color codes for console output
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
const photosDir = path.join(__dirname, '../photos');

// Required frontmatter fields
const requiredFields = ['title', 'date', 'opponent', 'score'];

function checkMatchData() {
    log('\n📊 开始检查数据完整性...', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'white');

    if (!fs.existsSync(matchesDir)) {
        log(`❌ 错误: 找不到 matches 目录: ${matchesDir}`, 'red');
        return;
    }

    const files = fs.readdirSync(matchesDir).filter(file => file.endsWith('.md'));
    let totalMatches = 0;
    let issuesFound = 0;

    files.forEach(file => {
        totalMatches++;
        const filePath = path.join(matchesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(content);
        const data = parsed.data;
        
        let fileIssues = [];

        // Check required fields
        const missing = requiredFields.filter(field => !data[field]);
        if (missing.length > 0) {
            fileIssues.push(`缺少必填字段: ${missing.join(', ')}`);
        }

        // Check attendance
        if (!data.attendance) {
             fileIssues.push(`缺少出勤名单 (attendance 字段不存在)`);
        } else if (!Array.isArray(data.attendance) || data.attendance.length === 0) {
             fileIssues.push(`出勤名单为空`);
        }

        // Check photos directory
        // Date format validation to construct photo path correctly
        let dateStr = '';
        if (data.date instanceof Date) {
            dateStr = data.date.toISOString().split('T')[0];
        } else if (typeof data.date === 'string') {
             dateStr = data.date.split('T')[0]; // Handle cases where it might be a string
        }
        
        // If date is missing in FM, try to infer from filename (YYYY-MM-DD-...)
        if (!dateStr) {
             const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
             if (match) {
                 dateStr = match[1];
             }
        }

        if (dateStr) {
            const matchPhotosDir = path.join(photosDir, dateStr);
            if (!fs.existsSync(matchPhotosDir)) {
                fileIssues.push(`缺少照片目录: photos/${dateStr}`);
            } else {
                 // Check if directory is empty
                 const photos = fs.readdirSync(matchPhotosDir).filter(f => !f.startsWith('.'));
                 if (photos.length === 0) {
                     fileIssues.push(`照片目录为空: photos/${dateStr}`);
                 }
            }
        } else {
             fileIssues.push(`无法确定日期，无法检查照片目录`);
        }


        if (fileIssues.length > 0) {
            issuesFound++;
            log(`\n⚠️  ${file}:`, 'yellow');
            fileIssues.forEach(issue => log(`   - ${issue}`, 'red'));
        } else {
            log(`✅ ${file} - 数据完整`, 'green');
        }
    });

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'white');
    if (issuesFound > 0) {
        log(`检查完成: 共 ${totalMatches} 场比赛, 发现 ${issuesFound} 个文件存在问题。`, 'yellow');
    } else {
        log(`检查完成: 共 ${totalMatches} 场比赛, 全部数据完整! 🎉`, 'green');
    }
}

checkMatchData();
