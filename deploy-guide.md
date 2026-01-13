# 部署到GitHub Pages指南

## 步骤1: 创建GitHub仓库

1. 访问 https://github.com
2. 点击右上角 "+" → "New repository"
3. 仓库名称: `hebo-match-reports` (或其他名称)
4. 选择 "Public" (公开)
5. 勾选 "Add a README file"
6. 点击 "Create repository"

## 步骤2: 上传代码

在项目目录执行:

```bash
# 初始化git仓库
cd "C:\Users\segas\Desktop\河伯战报"
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/hebo-match-reports.git

# 推送代码
git push -u origin main
```

## 步骤3: 启用GitHub Pages

1. 进入仓库页面
2. 点击 "Settings" (设置)
3. 左侧菜单找到 "Pages"
4. Source选择:
   - Branch: `main`
   - Folder: `/docs`
5. 点击 "Save"

## 步骤4: 调整目录结构

```bash
# 创建docs目录
mkdir docs

# 移动output内容到docs
cp -r output/* docs/

# 提交更改
git add .
git commit -m "Add GitHub Pages"
git push
```

## 访问地址

https://你的用户名.github.io/hebo-match-reports/
