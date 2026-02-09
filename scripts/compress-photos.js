const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

const photosDir = path.join(__dirname, '../photos');

async function compressPhotos() {
    log('\n📸 开始扫描并压缩照片...', 'cyan');

    if (!fs.existsSync(photosDir)) {
        log(`❌ 错误: 找不到 photos 目录: ${photosDir}`, 'red');
        return;
    }

    const dateDirs = fs.readdirSync(photosDir).filter(file => {
        return fs.statSync(path.join(photosDir, file)).isDirectory();
    });

    let totalCompressed = 0;
    let savedBytes = 0;

    for (const dateDir of dateDirs) {
        const currentDir = path.join(photosDir, dateDir);
        const files = fs.readdirSync(currentDir).filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        if (files.length === 0) continue;

        const compressedDir = path.join(currentDir, 'compressed');
        if (!fs.existsSync(compressedDir)) {
            fs.mkdirSync(compressedDir);
        }

        log(`\n📁 处理目录: ${dateDir} (${files.length} 张照片)`, 'blue');

        for (const file of files) {
            const inputPath = path.join(currentDir, file);
            const outputPath = path.join(compressedDir, file);

            // Skip if already compressed
            if (fs.existsSync(outputPath)) {
                // log(`   S 跳过: ${file} (已存在)`, 'white');
                continue;
            }

            try {
                const metadata = await sharp(inputPath).metadata();
                const originalSize = fs.statSync(inputPath).size;

                await sharp(inputPath)
                    .resize(1600, null, { // Max width 1600, maintain aspect ratio
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(outputPath);

                const newSize = fs.statSync(outputPath).size;
                const savings = originalSize - newSize;
                const savingsPercent = Math.round((savings / originalSize) * 100);

                savedBytes += savings;
                totalCompressed++;

                log(`   ✅ 压缩: ${file} (${Math.round(originalSize / 1024)}KB -> ${Math.round(newSize / 1024)}KB, -${savingsPercent}%)`, 'green');

            } catch (err) {
                log(`   ❌ 失败: ${file} - ${err.message}`, 'red');
            }
        }
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'white');
    const savedMB = (savedBytes / 1024 / 1024).toFixed(2);
    log(`🎉 压缩完成! 共压缩 ${totalCompressed} 张照片, 节省空间 ${savedMB} MB`, 'green');
}

compressPhotos();
