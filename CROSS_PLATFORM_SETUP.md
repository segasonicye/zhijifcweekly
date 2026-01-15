# 跨平台安装指南 / Cross-Platform Setup Guide

本指南帮助您在新的电脑或Mac上设置完整的河伯战报发布系统。

This guide helps you set up the complete Hebo match report publishing system on a new computer or Mac.

---

## 📋 系统要求 / System Requirements

- **Node.js**: 14.x 或更高版本 / version 14.x or higher
- **npm**: 6.x 或更高版本（随Node.js自动安装）/ version 6.x or higher (installed with Node.js)
- **Python**: 3.x（用于图片处理，可选）/ for image processing (optional)
- **操作系统** / Operating System:
  - Windows 10/11
  - macOS 10.14+
  - Linux (Ubuntu, Debian, etc.)

---

## 🚀 快速安装 / Quick Installation

### 方案1：直接复制项目文件夹 / Direct Copy (Recommended)

最简单的方法是直接复制整个项目文件夹到新电脑。

The easiest method is to copy the entire project folder to the new computer.

**步骤 / Steps:**

1. **复制项目** / Copy Project
   - 将整个"河伯战报"文件夹复制到U盘或云盘
   - Copy the entire "河伯战报" folder to USB drive or cloud storage
   - 在新电脑上复制到任意位置，如：`~/Documents/河伯战报`
   - On new computer, copy to any location, e.g.: `~/Documents/河伯战报`

2. **安装Node.js** / Install Node.js
   - 访问：https://nodejs.org/
   - 下载并安装LTS版本（长期支持版）
   - Download and install LTS version (Long Term Support)

3. **安装依赖** / Install Dependencies
   ```bash
   # 进入项目目录 / Navigate to project directory
   cd ~/Documents/河伯战报  # Mac/Linux
   cd C:\Users\YourName\Documents\河伯战报  # Windows

   # 安装依赖包 / Install dependencies
   npm install
   ```

4. **测试安装** / Test Installation
   ```bash
   npm run publish
   ```

✅ 完成！系统已经可以使用了。

Done! The system is ready to use.

---

### 方案2：使用Git（适合多设备同步） / Using Git (for multi-device sync)

如果您熟悉Git，可以使用GitHub进行同步。

If you're familiar with Git, you can use GitHub for synchronization.

**步骤 / Steps:**

1. **创建GitHub仓库** / Create GitHub Repository
   ```bash
   # 在项目目录下 / In project directory
   git init
   git add .
   git commit -m "Initial commit"
   ```

   然后在GitHub上创建新仓库，按提示推送。

   Then create new repository on GitHub and push as instructed.

2. **在新电脑上克隆** / Clone on New Computer
   ```bash
   git clone https://github.com/your-username/hebo-match-reports.git
   cd hebo-match-reports
   npm install
   ```

3. **同步更新** / Sync Updates
   ```bash
   # 拉取最新更改 / Pull latest changes
   git pull

   # 推送新更改 / Push new changes
   git add .
   git commit -m "Add new match report"
   git push
   ```

---

## 🍎 Mac特定设置 / Mac-Specific Setup

### 1. 安装Homebrew（可选但推荐） / Install Homebrew (Optional but Recommended)

Homebrew是Mac上最流行的包管理器。

Homebrew is the most popular package manager for Mac.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 使用Homebrew安装Node.js / Install Node.js via Homebrew

```bash
brew install node
```

### 3. 验证安装 / Verify Installation

```bash
# 检查Node.js版本 / Check Node.js version
node --version  # 应该显示 / Should show: v18.x.x or higher

# 检查npm版本 / Check npm version
npm --version  # 应该显示 / Should show: 9.x.x or higher
```

### 4. Mac剪贴板支持 / Mac Clipboard Support

系统已自动支持Mac剪贴板，`npm run publish`命令会自动使用Mac的`pbcopy`命令。

The system automatically supports Mac clipboard. `npm run publish` will automatically use Mac's `pbcopy` command.

---

## 🪟 Windows特定设置 / Windows-Specific Setup

### 1. 安装Node.js / Install Node.js

- 访问：https://nodejs.org/
- 下载Windows安装包（.msi文件）
- Download Windows installer (.msi file)
- 双击运行，按提示安装
- Double-click to run, install as prompted

### 2. 验证安装 / Verify Installation

打开PowerShell或命令提示符：

Open PowerShell or Command Prompt:

```bash
node --version
npm --version
```

### 3. Windows剪贴板支持 / Windows Clipboard Support

系统已自动支持Windows剪贴板，使用`clip`命令。

The system automatically supports Windows clipboard using `clip` command.

---

## 🐧 Linux特定设置 / Linux-Specific Setup

### Ubuntu/Debian / Ubuntu/Debian

```bash
# 更新包列表 / Update package list
sudo apt update

# 安装Node.js和npm / Install Node.js and npm
sudo apt install nodejs npm

# 验证安装 / Verify installation
node --version
npm --version
```

### 其他Linux发行版 / Other Linux Distributions

参考各发行版的文档安装Node.js。

Refer to your distribution's documentation to install Node.js.

---

## 📸 可选：图片处理设置 / Optional: Image Processing Setup

如果您需要批量调整图片大小，可以安装Python和PIL库。

If you need to batch resize images, you can install Python and PIL library.

### 安装Python / Install Python

**Mac:**
```bash
# Mac通常已预装Python / Python is usually pre-installed on Mac
python3 --version
```

**Windows:**
- 访问：https://www.python.org/downloads/
- 下载并安装Python 3.x
- 勾选"Add Python to PATH"
- Download and install Python 3.x
- Check "Add Python to PATH"

**Linux:**
```bash
sudo apt install python3 python3-pip  # Ubuntu/Debian
```

### 安装Pillow（PIL） / Install Pillow (PIL)

```bash
pip install Pillow
```

### 使用示例 / Usage Example

```python
from PIL import Image

# 调整Logo大小 / Resize logo
img = Image.open('logo.png')
img_resized = img.resize((150, 150))
img_resized.save('logo-150.png')
```

---

## ✅ 测试安装 / Test Your Installation

安装完成后，运行以下命令测试：

After installation, run these commands to test:

```bash
# 1. 测试发布流程 / Test publishing workflow
npm run publish

# 2. 查看所有可用命令 / View all available commands
npm run

# 3. 测试最新比赛生成 / Test latest match generation
npm run wechat:latest
```

如果一切正常，您应该看到：

If everything is working, you should see:
- ✅ 彩色终端输出 / Colored terminal output
- ✅ 浏览器自动打开预览 / Browser automatically opens preview
- ✅ 详细的步骤指引 / Detailed step-by-step guide

---

## 📁 项目结构说明 / Project Structure Overview

```
河伯战报/
├── matches/           # 比赛记录Markdown文件 / Match report Markdown files
├── photos/            # 比赛照片（按日期组织）/ Match photos (organized by date)
├── output/            # 生成的HTML文件 / Generated HTML files
├── scripts/           # 自动化脚本 / Automation scripts
│   ├── publish-wechat.js       # 一键发布 / One-click publish
│   ├── wechat-workflow.js      # 微信工作流 / WeChat workflow
│   ├── wechat-template.js      # 微信模板 / WeChat template
│   ├── new-post.js             # 创建新比赛 / Create new match
│   ├── parse-report.js         # 解析战报 / Parse report
│   └── ...
├── package.json        # 项目配置 / Project configuration
├── WECHAT_PUBLISH.md   # 微信发布指南 / WeChat publishing guide
└── CROSS_PLATFORM_SETUP.md  # 本文件 / This file
```

---

## 🔧 常见问题 / Troubleshooting

### 问题1：找不到Node.js命令 / Node.js command not found

**Mac/Linux:**
```bash
# 确认Node.js已安装 / Confirm Node.js is installed
which node

# 如果没有，重新安装 / If not, reinstall
brew install node  # Mac
sudo apt install nodejs  # Linux
```

**Windows:**
- 重新运行Node.js安装程序
- 勾选"Add to PATH"选项
- Re-run Node.js installer
- Check "Add to PATH" option

### 问题2：npm install失败 / npm install failed

```bash
# 清除npm缓存 / Clear npm cache
npm cache clean --force

# 重新安装 / Reinstall
npm install
```

### 问题3：权限错误（Mac/Linux） / Permission errors (Mac/Linux)

```bash
# 不要使用sudo安装全局包 / Don't use sudo for global packages
# 使用以下方式修复 / Fix with:
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 问题4：图片无法在预览中显示 / Images not showing in preview

这是正常的！预览使用的是本地文件路径，图片需要手动上传到微信公众号。

This is normal! Preview uses local file paths. Images need to be manually uploaded to WeChat.

### 问题5：剪贴板复制失败 / Clipboard copy failed

**手动复制方法 / Manual copy method:**
1. 在浏览器中打开预览文件
2. 按 Ctrl+A (Windows/Linux) 或 Cmd+A (Mac) 全选
3. 按 Ctrl+C (Windows/Linux) 或 Cmd+C (Mac) 复制

---

## 🎯 核心工作流 / Core Workflow

安装完成后，使用以下流程发布战报：

After installation, use this workflow to publish reports:

```bash
# 1. 创建新比赛记录 / Create new match record
npm run new

# 2. 编辑matches/目录下的Markdown文件 / Edit Markdown file in matches/ directory

# 3. 添加照片到photos/日期/目录 / Add photos to photos/date/ directory

# 4. 一键发布到微信公众号 / One-click publish to WeChat
npm run publish
```

就这么简单！Just 4 steps!

---

## 📞 获取帮助 / Getting Help

如果遇到问题：

If you encounter issues:

1. 查看 `WECHAT_PUBLISH.md` - 微信发布详细指南
   Check `WECHAT_PUBLISH.md` - Detailed WeChat publishing guide

2. 查看脚本注释 - 每个脚本都有详细说明
   Check script comments - Each script has detailed documentation

3. 运行 `npm run` - 查看所有可用命令
   Run `npm run` - View all available commands

---

## 🎉 开始使用 / Getting Started

现在您已经准备好在新电脑上使用完整的战报发布系统了！

Now you're ready to use the complete match report publishing system on your new computer!

```bash
# 立即开始 / Start now
cd ~/Documents/河伯战报  # 或您的项目路径 / or your project path
npm run publish
```

祝发布顺利！Happy publishing!
