# Netlify 部署指南

## 首次设置

### 方法1: 使用Netlify Drop (最简单 - 推荐)

1. 访问 https://app.netlify.com/drop
2. 将 `output` 文件夹直接拖拽到页面上
3. 等待上传完成,获得网站URL
4. 每次更新内容后,重复这个步骤

### 方法2: 使用Netlify CLI (自动部署)

#### 步骤1: 登录Netlify

```bash
npx netlify login
```

这会打开浏览器让你授权登录。

#### 步骤2: 初始化项目

```bash
npx netlify init
```

按提示操作:
- 选择 `Create & configure a new site`
- 选择团队
- 输入站点名称(如: zhiji-football)
- 部署目录填写: `output`

#### 步骤3: 部署

```bash
npm run deploy
```

这个命令会:
1. 自动生成所有HTML文件
2. 部署到Netlify
3. 显示网站URL

## 日常使用

### 添加新战报并部署

```bash
# 1. 创建新战报
npm run new

# 2. 如果有照片,添加照片
npm run add-photos

# 3. 部署到Netlify
npm run deploy
```

### 更新现有战报

```bash
# 1. 编辑matches/目录下的对应md文件

# 2. 部署
npm run deploy
```

## 常见问题

### Q: Netlify额度够用吗?
A: Netlify免费版每月100GB带宽,对于纯静态网站完全够用。每周更新一次不会超限。

### Q: 如何更新已部署的网站?
A: 运行 `npm run deploy` 即可自动更新。

### Q: 忘记网站URL了?
A:
- 登录 https://app.netlify.com
- 在Sites列表中查看你的网站
- 点击网站名称查看详情和URL

### Q: 可以使用自定义域名吗?
A: 可以!在Netlify网站设置中添加自定义域名即可。

## 备份建议

建议将整个项目目录同步到GitHub,这样:
1. 代码有备份
2. 可以连接Netlify实现Git push自动部署
3. 多人协作更方便

### Git同步命令

```bash
# 初始化Git仓库(首次)
git init
git add .
git commit -m "Initial commit"

# 推送到GitHub
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

后续更新:
```bash
git add .
git commit -m "更新战报"
git push
```
