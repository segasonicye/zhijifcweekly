#!/usr/bin/env node

/**
 * 创建特殊庆祝文章
 * 用于国足U23挺进决赛等特殊事件
 */

const fs = require('fs');
const path = require('path');

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
 * 生成庆祝文章HTML
 */
function generateCelebrationArticle() {
  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 30px; color: #1a1a1a;">

      <!-- Logo区域 -->
      <div style="text-align: center; margin: 0 0 40px 0; padding: 25px; background: #fff; border: 3px solid #e94560; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <p style="margin: 0; color: #e94560; font-size: 18px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">🇨🇳 中国加油 🇨🇳</p>
        <p style="margin: 8px 0 0 0; color: #999; font-size: 13px;">上传 Logo 后删除此框</p>
      </div>

      <!-- 标题区域 -->
      <section style="background: #fff; padding: 40px 30px; margin: 30px 0; border-radius: 20px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.2); position: relative;">
        <p style="margin: 0 0 15px 0; color: #e94560; font-size: 18px; letter-spacing: 5px; text-transform: uppercase; font-weight: 600;">🎉 恭喜中国 🎉</p>
        <h1 style="font-size: 36px; margin: 0 0 20px 0; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; line-height: 1.3;">
          国足U23挺进决赛！
        </h1>
        <div style="display: inline-block; background: linear-gradient(135deg, #e94560 0%, #ff2363 100%); padding: 12px 30px; border-radius: 30px; font-size: 18px; color: #fff; font-weight: 700;">
          🏆 向着冠军冲刺 🏆
        </div>
      </section>

      <!-- 贺电内容 -->
      <section style="background: #fff; padding: 40px 30px; margin: 30px 0; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <h2 style="font-size: 26px; font-weight: 700; margin: 0 0 25px 0; color: #e94560; text-align: center; letter-spacing: 2px;">📜 知己足球俱乐部贺电</h2>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; border-left: 4px solid #e94560; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">
            致国足U23全体将士：
          </p>

          <p style="line-height: 1.9; margin: 15px 0; color: #333; font-size: 16px;">
            欣闻你们在U23亚洲杯半决赛中，以<span style="color: #e94560; font-weight: 700;">3:0</span>的比分技高一筹战胜越南队，一路高歌猛进杀入决赛！本指导代表知己足球俱乐部，对球队全程保持高度关注。看到胜利那一刻，我俱乐部上下兴高采烈，情绪指数居高不下！
          </p>

          <p style="line-height: 1.9; margin: 15px 0; color: #333; font-size: 16px;">
            特向你们致以崇高的敬意：
          </p>

          <p style="line-height: 1.9; margin: 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
            感谢主教练安东尼奥，您的排兵布阵高深莫测，临场指挥高瞻远瞩！<br>
            感谢彭啸、向余望、王钰栋，你们进攻手段高明，门前表现高人一等！<br>
            感谢门神李昊，面对狂轰滥炸，全场高接低挡，不仅艺高人胆大，更是劳苦功高！
          </p>

          <p style="line-height: 1.9; margin: 15px 0; color: #333; font-size: 16px;">
            决赛迎战日本队，咱们不谈硬性指标，不搞高谈阔论。不管对手排名多高、身价多高，咱们知己人的头都要抬得比他们更高！
          </p>

          <div style="background: linear-gradient(135deg, #e94560 0%, #ff2363 100%); padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);">
            <p style="margin: 0; color: #fff; font-size: 24px; font-weight: 900; letter-spacing: 3px;">
              两横一竖就是干！
            </p>
          </div>

          <p style="line-height: 1.9; margin: 15px 0; color: #333; font-size: 16px;">
            只要踢出高风亮节，拼出高昂气势，不管结果如何，咱们知己足球俱乐部下顿饭的餐标，必须水涨船高！
          </p>

          <p style="margin: 25px 0 0 0; color: #e94560; font-size: 16px; font-weight: 700; text-align: right;">
            —— 知己足球俱乐部 高指导<br>
            <span style="color: #999; font-weight: 400; font-size: 14px;">2026年1月21日</span>
          </p>
        </div>
      </section>

      <!-- 精彩瞬间 -->
      <section style="margin: 40px 0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 2px;">📸 精彩瞬间</p>
        </div>

        <div style="margin: 25px 0;">
          <div style="background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <p style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">🎬 比赛精彩集锦</p>

            <div style="background: #f8f9fa; padding: 25px; margin: 20px 0; border-radius: 12px; border: 2px dashed #e94560;">
              <p style="margin: 0 0 15px 0; color: #e94560; font-size: 16px; font-weight: 700;">
                📹 在此添加视频
              </p>
              <p style="margin: 10px 0; color: #555; font-size: 14px; line-height: 1.8;">
                <strong style="color: #e94560;">B站视频嵌入方法：</strong><br>
                1. 找到B站视频的BV号（如：BV1xx411c7mD）<br>
                2. 使用嵌入代码：<br>
                <code style="display: inline-block; background: #fff; padding: 8px 12px; border-radius: 4px; margin: 10px 0; color: #e94560; font-size: 12px; border: 1px solid #ddd;">
                  &lt;iframe src="//player.bilibili.com/player.html?bvid=你的BV号&page=1" style="width: 100%; height: 400px;" frameborder="0" allowfullscreen="true"&gt;&lt;/iframe&gt;
                </code>
                <br>
                3. 在公众号编辑器中替换此框
              </p>
            </div>

            <p style="margin: 15px 0 0 0; color: #666; font-size: 13px; line-height: 1.8;">
              <strong style="color: #e94560;">支持的平台：</strong><br>
              • B站（哔哩哔哩）- 使用BV号嵌入<br>
              • 优酷、腾讯视频等 - 使用嵌入代码<br>
              • 微信视频号 - 直接上传视频文件<br>
              <br>
              <span style="color: #999;">详细使用方法请查看：BILIBILI_VIDEO_GUIDE.md</span>
            </p>
          </div>
        </div>
      </section>

      <!-- 祝福与期待 -->
      <section style="background: #fff; padding: 35px 30px; margin: 35px 0; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 20px 0; color: #1a1a1a; text-align: center; letter-spacing: 1px;">🎯 冲吧，中国！</h2>

        <p style="line-height: 1.9; margin: 15px 0; color: #333; font-size: 16px; text-align: center; font-weight: 500;">
          决赛在即，让我们为中国U23男足加油鼓劲！<br>
          愿小伙子们放下包袱，轻装上阵，<br>
          发挥出最好的水平，创造新的辉煌！
        </p>

        <div style="text-align: center; margin-top: 25px;">
          <div style="display: inline-flex; align-items: center; gap: 15px; flex-wrap: wrap; justify-content: center;">
            <span style="background: #e94560; color: #fff; padding: 10px 25px; border-radius: 25px; font-size: 16px; font-weight: 700;">🇨🇳 加油中国</span>
            <span style="background: #e94560; color: #fff; padding: 10px 25px; border-radius: 25px; font-size: 16px; font-weight: 700;">⚽ 勇创佳绩</span>
            <span style="background: #e94560; color: #fff; padding: 10px 25px; border-radius: 25px; font-size: 16px; font-weight: 700;">🏆 梦想成真</span>
          </div>
        </div>
      </section>

      <!-- 页脚 -->
      <section style="background: rgba(255,255,255,0.95); padding: 30px; margin: 50px 0 40px 0; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <p style="margin: 0 0 15px 0; color: #e94560; font-size: 18px; font-weight: 700; letter-spacing: 2px;">🙏 为国足加油 🙏</p>
        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.8;">
          知己足球俱乐部 · 与国同梦<br>
          <span style="font-size: 24px;">🇨🇳 ⚽ 🏆</span>
        </p>
        <div style="margin-top: 20px;">
          <span style="display: inline-block; width: 50px; height: 2px; background: linear-gradient(90deg, transparent, #e94560, transparent);"></span>
        </div>
      </section>

    </div>
  `;

  return article;
}

/**
 * 主函数
 */
function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                    ║', 'cyan');
  log('║     🇨🇳 国足U23挺进决赛祝贺文章生成器 🇨🇳            ║', 'cyan');
  log('║                                                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  // 生成文章
  log('\n🔄 正在生成祝贺文章...', 'yellow');
  const article = generateCelebrationArticle();

  // 保存文件
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlFile = path.join(outputDir, 'celebration-u23-final.html');
  fs.writeFileSync(htmlFile, article, 'utf-8');
  log('✅ 文章已生成', 'green');

  // 复制到剪贴板
  log('\n📋 正在复制到剪贴板...', 'yellow');
  const { execSync } = require('child_process');
  try {
    execSync(`echo "${article.replace(/"/g, '\\\"')}" | clip`, { windowsHide: true });
    log('✅ HTML已复制到剪贴板', 'green');
  } catch (error) {
    log('⚠️  自动复制失败，请手动复制', 'yellow');
  }

  // 打开预览
  log('\n🌐 正在打开预览...', 'yellow');
  try {
    const absolutePath = path.resolve(htmlFile);
    execSync(`start "" "${absolutePath}"`, { windowsHide: true });
    log('✅ 预览已打开', 'green');
  } catch (error) {
    log(`⚠️  请手动打开: ${htmlFile}`, 'yellow');
  }

  // 显示使用说明
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║           📝 如何添加视频说明                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  log('\n' + ' '.repeat(54), 'white');
  log('  📹 添加视频步骤：', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  1️⃣  打开视频平台（优酷/腾讯/B站等）', 'blue');
  log('  2️⃣  找到"分享"按钮', 'blue');
  log('  3️⃣  点击"复制嵌入代码"', 'blue');
  log('  4️⃣  在公众号编辑器中替换占位框', 'blue');
  log('', 'reset');

  log('  📱 发布到公众号：', 'cyan');
  log('  ' + '─'.repeat(50), 'white');
  log('  1. 浏览器中 Ctrl+A 全选', 'blue');
  log('  2. Ctrl+C 复制', 'blue');
  log('  3. 打开微信公众号编辑器', 'blue');
  log('  4. Ctrl+V 粘贴', 'blue');
  log('  5. 替换Logo占位框', 'blue');
  log('  6. 添加视频嵌入代码', 'magenta');
  log('  7. 预览并发布', 'blue');
  log('', 'reset');

  log('╔════════════════════════════════════════════════════════╗', 'green');
  log('║                                                    ║', 'green');
  log('║              ✨ 准备完成，祝发布顺利！ ✨              ║', 'green');
  log('║                                                    ║', 'green');
  log('╚════════════════════════════════════════════════════════╝', 'green');
  log('', 'reset');

  log('💡 提示:', 'yellow');
  log('   - 文章使用清晰白色背景', 'white');
  log('   - 深色文字确保可读性', 'white');
  log('   - 预览文件: output/celebration-u23-final.html', 'white');
  log('   - 支持添加视频嵌入代码', 'white');
  log('   - 适合庆祝类特殊事件', 'white');
  log('', 'reset');
}

// 运行
main();
