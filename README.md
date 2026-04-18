# 知己FC比赛报告系统

本系统用于管理业余球队「知己FC」（亦曾名「河伯FC」）的赛后报告，支持 Markdown 报告、照片整理、统计与一键发布到公众号与静态站点。

## 项目结构

- `matches/`      — 存放每场比赛的 Markdown 报告（YAML 前置事项）
- `photos/YYYY-MM-DD/`  — 按日期存放比赛照片
- `stats/`        — 统计输出（JSON + Markdown）
- `output/`       — 生成的 HTML（.gitignore 已忽略，避免提交）
- `scripts/`      — 全部自动化脚本
- `templates/`    — Markdown 报告模板

## 快速开始

```bash
# 安装依赖（仅 gray-matter）
npm install

# 创建新报告（交互式）
npm run new

# 生成统计
npm run stats

# 生成现代 HTML 页面（glassmorphism）
npm run matches

# 生成 WeChat 文章（默认最新）
npm run wechat:latest
```

## 报告格式（YAML 前置事项）

```yaml
---
title: "比赛标题"
date: '2026-01-03'
opponent: 党校队
score: 20-26
location: 福沁球场
mvp: 高主席
photos: []
scorers:
  - name: 高主席
    goals: 7
attendance: []
---
```

- `scorers` 支持两种写法：`goals` 计数 或 `minute` 具体时间 + 可选 `assist`
- `attendance` 填写到场球员名单
- `mvp` 填写本场最佳球员
- `photos` 可在报告中按顺序引用

## 照片组织

- 手动或使用脚本按日期整理到 `photos/YYYY-MM-DD/`
- 在报告中通过相对路径引用照片
- 清理与重命名工具：`organize-photos.js`（顺序编号）

## 发布流程

1. 编写并生成报告：`npm run new` 或手动编辑 `matches/*.md`
2. 生成输出：`npm run matches`（生成 HTML）
3. 生成公众号文章：`npm run wechat:latest`（或按日期 `wechat:date`）
4. 部署到 Netlify：`npm run deploy`（需配置 Netlify CLI）

## 环境与安全

- 敏感文件已在 `.gitignore` 中屏蔽：`.env`、`.env.example`、`wechat-config.json`
- 部署推荐使用 GitHub Token（`GH_TOKEN`）进行认证
- 不要提交私钥或证书到仓库

## 脚本速查

- `npm run stats`           — 生成统计
- `npm run matches`          — 生成现代页面
- `npm run matches-classic`  — 生成传统列表页
- `npm run preview <file>`   — 预览单个报告
- `npm run wechat:all`       — 批量生成公众号文章
- `npm run wechat:latest`    — 仅发布最新一场

## WeChat 风格说明

- 系统内置两种公众号模板：
  - 默认（通用）：保留 AI 封面，奶白暖金亮色风格
  - `wechat-template-ins.js`：极简黑白灰（内赛/友谊赛）
  - `wechat-template-battle.js`：红主题（外赛/对抗赛）
- 使用时请通过对应脚本选择：`npm run publish:ins` 或 `npm run publish:battle`

## 贡献与维护

- 报告推荐使用 `npm run new` 创建，保持格式统一
- 定期运行 `npm run stats` 更新排行榜
- 发布前请用 `git diff` 检查变更，避免误删数据

---
*自动维护：禁止手动修改 output/，请通过脚本生成*