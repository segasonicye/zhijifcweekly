/**
 * 生成队歌投票微信文章
 * 热血风格，二选一投票
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 热血风格投票模板
function getVoteArticleTemplate(options) {
  const {
    version1Name = '版本一',
    version1Desc = '',
    version2Name = '版本二',
    version2Desc = '',
    lyrics = '',
    audioLink1 = '',
    audioLink2 = ''
  } = options;

  const article = `
    <div style="max-width: 680px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; color: #fff;">

      <!-- Logo占位 -->
      <div style="text-align: center; margin: 0 0 40px 0; padding: 40px; background: #fff; border: 4px solid #ff6b6b; border-radius: 20px; box-shadow: 0 10px 30px rgba(255, 107, 107, 0.5);">
        <p style="margin: 0; color: #ff6b6b; font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">⚽ 上传 Logo 后删除此框 ⚽</p>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; font-weight: 600;">上传 logo-150.png 后删除此提示框</p>
      </div>

      <!-- 标题区 -->
      <section style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 50px 35px; margin: 0 0 40px 0; border-radius: 20px; text-align: center; box-shadow: 0 15px 40px rgba(255, 107, 107, 0.5); position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>

        <div style="font-size: 48px; margin-bottom: 20px;">🎵</div>
        <h1 style="font-size: 36px; margin: 0 0 15px 0; font-weight: 900; color: #fff; letter-spacing: 3px; line-height: 1.3; text-shadow: 0 3px 15px rgba(0,0,0,0.3); position: relative; z-index: 1;">
          知己FC队歌<br/>投票评选
        </h1>
        <p style="margin: 20px 0 0 0; color: #ffd93d; font-size: 18px; font-weight: 700; letter-spacing: 2px; position: relative; z-index: 1;">
          🔥 二选一 · 由你决定 🔥
        </p>
      </section>

      <!-- 分隔线 -->
      <div style="text-align: center; margin: 50px 0;">
        <div style="display: inline-flex; align-items: center; gap: 25px;">
          <div style="width: 100px; height: 3px; background: linear-gradient(90deg, transparent, #ff6b6b);"></div>
          <span style="font-size: 32px;">⚔️</span>
          <div style="width: 100px; height: 3px; background: linear-gradient(90deg, #ff6b6b, transparent);"></div>
        </div>
      </div>

      <!-- 版本一 -->
      <section style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 35px; margin: 0 0 30px 0; border-radius: 16px; box-shadow: 0 12px 35px rgba(231, 76, 60, 0.4); position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; left: -30px; font-size: 100px; opacity: 0.2;">🎸</div>

        <div style="position: relative; z-index: 1;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: #ffd93d; color: #c0392b; padding: 12px 30px; border-radius: 25px; font-size: 16px; font-weight: 800; letter-spacing: 2px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
              版本一
            </div>
          </div>

          <h2 style="font-size: 32px; margin: 0 0 20px 0; font-weight: 800; color: #fff; text-align: center; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            ${version1Name}
          </h2>

          ${version1Desc ? `
          <p style="margin: 20px 0; color: #fff; font-size: 16px; line-height: 1.8; text-align: center; opacity: 0.95;">
            ${version1Desc}
          </p>
          ` : ''}

          ${audioLink1 ? `
          <div style="text-align: center; margin-top: 25px;">
            <a href="${audioLink1}" style="display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 15px 35px; border-radius: 25px; text-decoration: none; font-size: 15px; font-weight: 700; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3);">
              🎧 点击试听版本一
            </a>
          </div>
          ` : ''}
        </div>
      </section>

      <!-- VS -->
      <div style="text-align: center; margin: 40px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #ffd93d 0%, #ff9500 100%); color: #fff; padding: 15px 40px; border-radius: 50px; font-size: 28px; font-weight: 900; letter-spacing: 5px; box-shadow: 0 10px 30px rgba(255, 149, 0, 0.5); text-shadow: 0 3px 10px rgba(0,0,0,0.3);">
          VS
        </div>
      </div>

      <!-- 版本二 -->
      <section style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); padding: 40px 35px; margin: 30px 0 0 0; border-radius: 16px; box-shadow: 0 12px 35px rgba(155, 89, 182, 0.4); position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; right: -30px; font-size: 100px; opacity: 0.2;">🎹</div>

        <div style="position: relative; z-index: 1;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background: #ffd93d; color: #8e44ad; padding: 12px 30px; border-radius: 25px; font-size: 16px; font-weight: 800; letter-spacing: 2px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
              版本二
            </div>
          </div>

          <h2 style="font-size: 32px; margin: 0 0 20px 0; font-weight: 800; color: #fff; text-align: center; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            ${version2Name}
          </h2>

          ${version2Desc ? `
          <p style="margin: 20px 0; color: #fff; font-size: 16px; line-height: 1.8; text-align: center; opacity: 0.95;">
            ${version2Desc}
          </p>
          ` : ''}

          ${audioLink2 ? `
          <div style="text-align: center; margin-top: 25px;">
            <a href="${audioLink2}" style="display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 15px 35px; border-radius: 25px; text-decoration: none; font-size: 15px; font-weight: 700; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3);">
              🎧 点击试听版本二
            </a>
          </div>
          ` : ''}
        </div>
      </section>

      <!-- 投票提示 -->
      <section style="background: linear-gradient(135deg, #ffd93d 0%, #ff9500 100%); padding: 40px 35px; margin: 50px 0; border-radius: 16px; text-align: center; box-shadow: 0 15px 40px rgba(255, 149, 0, 0.5); position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); font-size: 60px; opacity: 0.3;">🗳️</div>

        <p style="margin: 0 0 15px 0; color: #fff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.2); position: relative; z-index: 1;">
          请在下方投票区选出你心中的队歌
        </p>
        <p style="margin: 10px 0 0 0; color: #fff; font-size: 14px; font-weight: 600; opacity: 0.9; position: relative; z-index: 1;">
          （使用公众号投票功能，此处为占位）
        </p>
      </section>

      <!-- 投票按钮占位符 -->
      <div style="background: #fff; padding: 50px 30px; margin: 40px 0; border-radius: 16px; border: 4px solid #ff6b6b; text-align: center; box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);">
        <p style="margin: 0; color: #ff6b6b; font-size: 24px; font-weight: 900; letter-spacing: 2px;">
          📊 在公众号后台插入投票组件
        </p>
        <p style="margin: 15px 0 0 0; color: #666; font-size: 16px; font-weight: 600;">
          新建图文 → 插入 → 投票 → 创建投票（单选，2个选项）
        </p>
      </div>

      <!-- 歌词展示 -->
      ${lyrics ? `
      <section style="background: rgba(0,0,0,0.3); padding: 40px 35px; margin: 50px 0; border-radius: 16px; border-left: 5px solid #ff6b6b; backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px; justify-content: center;">
          <span style="font-size: 32px;">📜</span>
          <p style="margin: 0; color: #ffd93d; font-size: 20px; letter-spacing: 2px; font-weight: 700;">队歌歌词</p>
          <span style="font-size: 32px;">📜</span>
        </div>
        <div style="line-height: 2.2; color: #fff; font-size: 15px; white-space: pre-line; text-align: left; background: rgba(0,0,0,0.2); padding: 25px; border-radius: 12px;">${lyrics}</div>
      </section>
      ` : ''}

      <!-- 页脚 -->
      <section style="background: rgba(0,0,0,0.4); padding: 40px 30px; margin: 60px 0 0 0; border-radius: 16px; text-align: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,107,107,0.3);">
        <p style="margin: 0 0 15px 0; color: #ffd93d; font-size: 20px; font-weight: 700; letter-spacing: 2px;">
          🔥 投出你的一票 🔥
        </p>
        <p style="margin: 0; color: #fff; font-size: 14px; opacity: 0.8;">
          知己足球俱乐部 · 让我们唱响队歌
        </p>
      </section>

    </div>
  `;

  return article;
}

// 交互式输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n=== 知己FC队歌投票文章生成器 ===\n');
  console.log('🔥 热血风格 · 二选一投票\n');

  const version1Name = await question('版本一名称（如：激情摇滚版）: ');
  const version1Desc = await question('版本一描述（可选，直接回车跳过）: ');
  const audioLink1 = await question('版本一音频链接（可选，如网易云/QQ音乐链接）: ');

  console.log('\n---\n');

  const version2Name = await question('版本二名称（如：柔情民谣版）: ');
  const version2Desc = await question('版本二描述（可选，直接回车跳过）: ');
  const audioLink2 = await question('版本二音频链接（可选，如网易云/QQ音乐链接）: ');

  console.log('\n---\n');

  const includeLyrics = await question('是否包含歌词？(y/n，默认n): ');
  let lyrics = '';

  if (includeLyrics.toLowerCase() === 'y') {
    console.log('\n请输入歌词（输入完成后按回车，然后输入END结束）:');
    const lines = [];
    while (true) {
      const line = await question('> ');
      if (line === 'END') break;
      lines.push(line);
    }
    lyrics = lines.join('\n');
  }

  // 生成HTML
  const article = getVoteArticleTemplate({
    version1Name,
    version1Desc,
    version2Name,
    version2Desc,
    lyrics,
    audioLink1,
    audioLink2
  });

  // 保存文件
  const filename = 'output/wechat-vote-队歌评选.html';
  fs.writeFileSync(filename, article, 'utf8');

  console.log(`\n✅ 投票文章已生成: ${filename}\n`);

  // 打开文件
  const platform = process.platform;
  const openCmd = platform === 'darwin' ? 'open' :
                  platform === 'win32' ? 'explorer' :
                  'xdg-open';

  try {
    require('child_process').exec(`${openCmd} ${filename}`);
    console.log('🌐 已在浏览器中打开预览\n');
  } catch (err) {
    console.log('💡 提示：复制HTML内容到微信公众号编辑器\n');
  }

  console.log('📝 下一步操作：');
  console.log('   1. 复制生成的HTML内容');
  console.log('   2. 粘贴到微信公众号编辑器');
  console.log('   3. 在文章末尾插入投票组件');
  console.log('   4. 创建投票：单选，2个选项（版本一、版本二）\n');

  rl.close();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getVoteArticleTemplate };
