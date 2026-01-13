# Netlify 快速部署指南

## 方法一: Netlify Drop (最简单 - 无需配置)

适合: 快速测试,一次性部署

### 步骤:

1. 生成HTML文件
```bash
npm run matches
```

2. 访问 https://app.netlify.com/drop

3. 将 `output` 文件夹直接拖拽到网页上

4. 等待几秒,完成! 🎉

### 优点
- ✅ 无需任何配置
- ✅ 无需安装工具
- ✅ 30秒完成部署
- ✅ 获得一个随机网址 (如: https://amazing-pudding-123456.netlify.app)

### 缺点
- ❌ 每次更新需要重新拖拽
- ❌ 域名是随机的

---

## 方法二: 自动化部署 (推荐 - 支持增量更新)

适合: 长期使用,需要频繁更新

### 首次设置 (只需一次)

#### 步骤1: 初始化Netlify项目

```bash
npm run setup-netlify
```

这个命令会:
1. 检查Netlify登录状态
2. 引导你创建或连接Netlify项目
3. 保存项目配置到本地

#### 步骤2: 选择部署方式

在交互式界面中:
- 选择 **"Create & configure a new project"** (创建新项目)
- 或者选择 **"Link to an existing project"** (连接已有项目)

#### 步骤3: 确认配置

Netlify会自动检测到你的output目录,按Enter确认即可

### 日常部署

首次设置完成后,以后每次更新内容只需要:

```bash
npm run deploy
```

就这么简单! 🚀

### 工作原理

1. 自动生成所有HTML文件
2. Netlify自动检测变化
3. 只上传修改过的文件 (增量更新)
4. 完成部署

### 性能

- 全新部署: 1-2分钟
- 增量更新: 10-20秒
- 只修改文字: 5秒!

---

## 命令对比

### 方法一 (Netlify Drop)
```bash
# 每次更新都需要:
npm run matches
# 然后手动拖拽 output 文件夹到网页
```

### 方法二 (自动化部署)
```bash
# 首次设置 (只需一次)
npm run setup-netlify

# 以后每次更新:
npm run deploy
```

---

## 常见问题

### Q: 我应该选择哪种方法?

**个人使用,偶尔更新**: 方法一 (Netlify Drop)
**频繁更新,追求方便**: 方法二 (自动化部署)

### Q: 如何使用自定义域名?

在Netlify Dashboard中:
1. 进入你的站点设置
2. 点击 "Domain management"
3. 添加自定义域名

### Q: 如何查看部署历史?

访问 Netlify Dashboard:
https://app.netlify.com/sites/你的站点名/deploys

### Q: 如何回滚到之前版本?

在Netlify的Deploys页面:
1. 找到你想回滚的版本
2. 点击 "Publish deploy"
3. 选择 "Publish" 确认回滚

---

## 完整工作流程示例

### 使用自动化部署 (推荐)

```bash
# 1. 添加新战报
npm run new

# 2. 添加照片 (如果有)
npm run add-photos

# 3. 部署到Netlify
npm run deploy

# ✅ 完成! 你的网站已更新
```

---

## 部署后你会得到

部署成功后,你会得到一个Netlify网址,例如:
- `https://hebo-fc.netlify.app`
- `https://zhi-ji-football.netlify.app`

你可以:
- 📱 直接用手机访问
- 🔗 分享给朋友
- 📮 在微信群中分享链接

---

## 进阶: Git + Netlify 自动部署

如果你熟悉Git,可以实现推送即自动部署:

详见: `NETLIFY_AUTO_DEPLOY.md`

---

## 总结

**快速体验**: 用 Netlify Drop
**长期使用**: 运行 `npm run setup-netlify` 然后用 `npm run deploy`

选择适合你的方式,开始展示你的足球队战报吧! ⚽
