# 公众号推送流程（Battle Report）

这份文档用于固化当前的公众号推送工作流，避免以后靠聊天记忆。

---

## 1. 推荐入口

统一使用：

```bash
node scripts/publish-battle-report.js <比赛文件> [选项]
```

例如：

```bash
node scripts/publish-battle-report.js 2026-03-21-知己内战.md
node scripts/publish-battle-report.js 2026-03-21-知己内战.md --account zhiji
node scripts/publish-battle-report.js 2026-03-21-知己内战.md --style simple --no-score
```

查看帮助：

```bash
node scripts/publish-battle-report.js --help
```

---

## 2. 入口脚本做了什么

`publish-battle-report.js` 是统一入口，默认会自动附加：

```bash
--strict-preflight
```

意思是：
- 发布前先做预检
- 如果出现 warning，也默认拦下，不直接发
- 这样比直接调底层脚本更稳

---

## 3. 底层发布脚本能力

实际执行的是：

```bash
node scripts/upload-to-wechat.js
```

当前已经支持：

- 解析比赛 markdown
- 发布前预检（preflight）
- 自动补未引用图片
- 自动生成 digest
- 封面策略选择
- 可选 AI 封面
- 上传正文图片
- 上传封面图
- 创建公众号草稿
- 成功/失败记录落盘

---

## 4. 常用参数

### 账号
```bash
--account zhiji
-a zhiji
```

### 排版风格
```bash
--style simple
--style default
```

### 比分显示
```bash
--no-score
--show-score
```

### AI 封面
```bash
--ai-cover
```

### 严格预检
```bash
--strict-preflight
```

> 统一入口默认已经开启 strict-preflight。

---

## 5. 日志与记录

发布记录目录：

```bash
logs/publish-history/
```

记录类型包括：

- `success`
- `preflight-error`
- `preflight-warn-blocked`
- `preflight-warn-continue`

日志里会保存：

- 发布时间 / 中止时间
- 比赛文件
- 标题 / 对手 / 日期
- 账号
- Draft ID（成功时）
- style
- 是否隐藏比分
- 是否启用 AI 封面
- 封面策略
- digest 来源
- preflight 检查结果

---

## 6. 查看历史记录

默认查看最近 10 条：

```bash
npm run publish:history
```

查看最近 3 条：

```bash
node scripts/publish-history.js --limit 3
```

只看成功：

```bash
node scripts/publish-history.js --outcome success
```

只看失败：

```bash
node scripts/publish-history.js --outcome preflight-error
```

按比赛名筛选：

```bash
node scripts/publish-history.js --match 知己内战
```

输出 JSON：

```bash
node scripts/publish-history.js --json
```

---

## 7. 推荐日常操作

### 标准发布

```bash
node scripts/publish-battle-report.js 2026-03-21-知己内战.md --account zhiji
```

### 如果被预检拦住
1. 先看终端里的 preflight 报告
2. 再看 `logs/publish-history/` 里的对应记录
3. 修 frontmatter / 图片路径 / 封面 / 摘要等问题
4. 修完后重新发布

### 发布后确认
1. 记下终端返回的 Draft ID
2. 如有需要，用 `publish-history` 查最近记录
3. 去公众号后台确认草稿

---

## 8. 当前约定

- 优先走统一入口，不要直接手敲底层脚本除非在调试
- 预检默认从严，宁可拦住，不要带病发布
- 发布历史必须可追溯，避免“终端一关就失忆”

---

## 9. 后续可继续优化

可选增强项：

- 自动把 Draft ID 回写到项目状态文件
- 增加发布失败原因统计
- 增加最近一次发布摘要命令
- 增加一键 dry-run / preview 模式

---

最后更新：2026-03-25
