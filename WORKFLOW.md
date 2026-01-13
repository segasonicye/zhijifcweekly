# 知己足球俱乐部战报系统 - 使用指南

## 🚀 一键更新 (推荐)

### 完整自动化流程

```bash
npm run update
```

这个命令会自动完成:

1. ✍️ **创建新战报** - 交互式输入比赛信息
2. 📷 **添加照片** (可选) - 询问是否添加照片
3. 🌐 **生成HTML** - 自动生成所有HTML页面
4. 🚀 **推送部署** (可选) - 询问是否推送到GitHub

---

## 📋 详细流程说明

### 步骤1: 运行更新命令

```bash
npm run update
```

### 步骤2: 输入比赛信息

系统会依次询问:
- 📅 比赛日期 (如: 2026-01-18)
- ⚔️ 对手队伍 (如: 三海风)
- 🔢 比分 (如: 4-4)
- ⭐ MVP球员 (如: 小王)
- 📍 比赛地点 (如: 福沁球场)
- 📝 战报内容 (直接粘贴文字)

### 步骤3: 添加照片 (可选)

```
是否有照片需要添加? (y/n):
```

- 输入 `y` → 运行照片添加脚本
- 输入 `n` → 跳过,继续下一步

### 步骤4: 自动生成HTML

系统自动:
- 生成所有比赛的HTML页面
- 生成战报总览页面
- 生成首页重定向

### 步骤5: 推送到GitHub (可选)

```
是否立即推送到GitHub? (y/n):
```

- 输入 `y` → 自动推送,Netlify将自动部署
- 输入 `n` → 稍后手动推送

---

## 📁 文件说明

### 输入文件
- `matches/*.md` - 战报Markdown文件
- `photos/YYYY-MM-DD/` - 比赛照片
- `logo.png` - 球队logo

### 输出文件 (自动生成)
- `output/index.html` - 首页重定向
- `output/matches.html` - 战报总览
- `output/YYYY-MM-DD-*.html` - 单场比赛页面
- `output/photos/` - 网站使用的照片副本

---

## 🎯 常用场景

### 场景1: 标准更新流程 (最常用)

```bash
npm run update
```

然后按照提示:
1. 输入比赛信息
2. 选择是否添加照片
3. 选择是否推送

**总耗时: 约2-3分钟**

### 场景2: 只创建战报,稍后推送

```bash
npm run update
# 输入信息 → 添加照片 → 生成HTML
# 推送时选择: n

# 稍后推送:
git add .
git commit -m "更新战报"
git push
```

### 场景3: 批量添加历史战报

```bash
npm run new          # 创建第1篇
npm run new          # 创建第2篇
npm run new          # 创建第3篇
npm run matches      # 统一生成HTML
git push             # 一次性推送
```

### 场景4: 只更新照片

```bash
npm run add-photos   # 添加照片
npm run matches      # 重新生成HTML
git push             # 推送更新
```

---

## ⚙️ 高级用法

### 单独使用各个命令

```bash
# 只创建新战报
npm run new

# 只添加照片
npm run add-photos

# 只生成HTML
npm run matches

# 查看统计
npm run stats

# 预览单个战报
npm run preview
```

### 查看统计数据

```bash
npm run stats
```

显示:
- 总比赛场次
- MVP排行榜
- 出勤统计

---

## 🔧 故障排查

### 问题1: 照片不显示

**原因**: 照片未复制到output目录

**解决**:
```bash
npm run matches
git add -f output/photos/
git push
```

### 问题2: 网页404

**原因**: 缺少index.html

**解决**:
```bash
npm run matches
git add -f output/index.html
git push
```

### 问题3: Logo未更新

**原因**: Logo未推送到output

**解决**:
```bash
cp logo.png output/logo.png
git add -f output/logo.png
git push
```

---

## 📊 当前数据

- **总比赛**: 3场
- **MVP球员**: 3位
- **GitHub仓库**: https://github.com/segasonicye/zhijifcweekly
- **Netlify网站**: (你的网址)

---

## 💡 最佳实践

1. **每周固定时间更新** - 比赛结束后尽快更新
2. **照片命名规范** - 使用有意义的文件名
3. **战报内容丰富** - 包含比赛细节、精彩瞬间
4. **及时推送** - 完成后立即推送到GitHub

---

## 🎉 开始使用

```bash
npm run update
```

就这么简单! 🚀
