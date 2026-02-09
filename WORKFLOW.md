# 🚀 2026年全新战报发布流程

## 1. 创建新战报 (Create)
运行以下命令并按提示输入基本信息：
```bash
npm run new
```
- 输入日期 (YYYY-MM-DD)
- 输入对手名称
- 输入比分

## 2. 整理照片 (Photos)
将照片放入 `photos_temp` 文件夹，然后运行：
```bash
npm run photos
```
- 自动按日期归档整理
- 自动重命名

## 3. 编写内容 (Write)
编辑 `matches/YYYY-MM-DD-xxx.md` 文件：
- 填写 `scorers` (进球者)
- 填写 `attendance` (出勤名单)
- 撰写比赛回顾
- 插入照片 (使用相对路径 `photos/YYYY-MM-DD/xxx.jpg`)

## 4. 检查数据 (Check) ✨新功能
确保一切填写正确：
```bash
npm run check-data
```
- 检查必填项
- 检查照片路径

## 5. 本地预览 (Preview) ✨新功能
启动本地服务器查看所有战报效果：
```bash
npm run serve
```
- 浏览器打开 `http://localhost:3000`
- 实时查看不同风格的效果

## 6. 生成发布 (Publish) ✨新快捷指令
选择一种风格生成微信公众号文章：

| 风格 | 快捷指令 | 适用场景 |
| :--- | :--- | :--- |
| **Fresh (清新)** | `npm run pf` | 标准战报, 包含详细数据 (推荐) |
| **Cyber (赛博)** | `npm run pc` | 夜场比赛, 强调科技感 |
| **Field (绿茵)** | `npm run pg` | 强调专业感, 报纸风格 |
| **Ins (极简)** | `npm run pi` | 内战, 注重图片展示 |
| **Battle (热血)** | `npm run pb` | 外战强强对话, 激情风格 |
| **Classic (经典)** | `npm run p` | 旧版风格 (不推荐) |

## 7. 月度总结 (Monthly) ✨新功能
每月结束后生成数据报告：
```bash
npm run monthly
```
- 自动统计进球榜、MVP榜、出勤率

## 8. 智能分析 (Smart) ✨新功能
让AI分析比赛并推荐风格：
```bash
npm run smart-report
```
