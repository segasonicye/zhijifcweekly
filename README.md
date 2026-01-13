# 河伯FC 战报管理系统

一套专为业余足球队设计的战报记录和展示系统,支持微信公众号发布和数据统计分析。

## 功能特点

- ✍️ **Markdown写作** - 用熟悉的Markdown格式编写战报
- 📊 **自动统计** - 自动计算出勤率、进球榜、助攻榜
- 📸 **照片管理** - 自动整理比赛照片
- 📱 **公众号支持** - 一键转换为微信公众号格式
- 💾 **版本控制** - Git管理,永不丢失

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 创建第一篇战报

```bash
npm run new
```

按提示输入比赛信息:
- 日期 (YYYY-MM-DD)
- 对手名称
- 比分
- 场地
- 出勤人员

### 3. 编写战报内容

生成的Markdown文件模板:

```markdown
---
title: "逆转取胜!河伯FC 3-2 战胜星光联队"
date: 2025-01-12
opponent: 星光联队
score: "3-2"
location: 朝阳公园
scorers:
  - name: 张三
    minute: 12
    assist: 李四
  - name: 王五
    minute: 78
attendance: [张三, 李四, 王五, 赵六]
photos:
  - path: "photos/2025-01-12/photo-001.jpg"
    caption: "赛后合影"
---

## 比赛回顾

本周六,河伯FC在朝阳公园迎战老对手星光联队...

![赛后合影](photos/2025-01-12/photo-001.jpg)

### 精彩瞬间

第12分钟,李四右路突破传中,张三头球破门...
```

### 4. 整理照片

将比赛照片放到一个临时文件夹,然后运行:

```bash
npm run photos
```

按提示输入照片目录和比赛日期,脚本会自动:
- 将照片复制到 `photos/YYYY-MM-DD/` 目录
- 按顺序重命名为 `photo-001.jpg`, `photo-002.jpg` 等

### 5. 生成统计数据

```bash
npm run stats
```

自动生成:
- 出勤排行榜
- 进球排行榜
- 助攻排行榜
- 比赛历史记录

结果保存在 `stats/` 目录。

### 6. 发布到公众号

```bash
npm run sync
```

按提示选择要发布的比赛,脚本会:
- 生成带样式的HTML文章
- 在浏览器中预览效果
- 生成图片上传清单
- 复制到微信公众号编辑器

## 使用技巧

### 战报写作要点

基于你们的实际战报风格,建议包含:

1. **开场氛围** - 天气、场地、心情
2. **首发阵容** - 两队阵容对比
3. **比赛进程** - 按时间顺序叙述
   - 关键进球(时间、球员、助攻)
   - 精彩配合
   - 轮换变化
4. **亮点表现** - MVP表现、精彩瞬间
5. **赛后安排** - 晚上聚餐等

示例:

```markdown
冬日不虚度,晴光忽满帘,周六上午知己队再战福沁球场...

**蓝队首发**: 辉哥、托蒂、王书记、喜力授、叶伯海、德国小弟
**红队首发**: 张航、小王、东哥、叶老师、高主席、潘书记

### 首节较量

蓝队率先把握机会:辉哥左路发起进攻,喜力授边路带球杀入禁区传后点,德国小弟跟上包抄一蹴而就**1-0**!

### 喜力授的高光时刻

喜力授状态依旧火热,用不可思议的帽子戏法统治全场:
- 两个外脚背捅射
- 一个禁区单刀连过数人后小角度打进

**全场数据**: 7个进球 + 7个助攻 = 完美表现!
```

### 照片命名规范

建议在战报中引用照片时使用描述性的说明:

```markdown
![赛后合影](photos/2025-01-12/photo-001.jpg)

![喜力授精彩进球](photos/2025-01-12/photo-002.jpg)

![两队首发阵容](photos/2025-01-12/photo-003.jpg)
```

### 数据记录建议

为了准确统计,建议完整记录:

1. **所有出勤人员** - 包括替补
2. **每个进球的详细信息**:
   ```yaml
   scorers:
     - name: 喜力授
       minute: 12
       assist: 德国小弟
   ```
3. **助攻数据** - 可以单独记录或包含在进球中

## 项目结构

```
河伯战报/
├── matches/              # 战报文章目录
│   └── 2025-01-12-xxx.md
├── photos/              # 照片库
│   └── 2025-01-12/
│       ├── photo-001.jpg
│       └── photo-002.jpg
├── stats/               # 统计数据(自动生成)
│   ├── stats.json
│   └── stats.md
├── output/              # 公众号文章输出(自动生成)
│   ├── 2025-01-12-xxx.html
│   └── 2025-01-12-xxx-photos.json
├── scripts/             # 工具脚本
│   ├── new-post.js        # 创建新战报
│   ├── organize-photos.js # 整理照片
│   ├── generate-stats.js  # 统计数据
│   └── sync-wechat.js     # 转换公众号格式
├── templates/           # 模板文件
│   └── match-template.md
├── package.json
└── README.md
```

## Git版本管理

建议使用Git管理所有战报和数据:

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "添加2025-01-12战报"

# 推送到GitHub私有仓库(可选)
git remote add origin https://github.com/yourname/hebo-match-reports.git
git push -u origin main
```

## 常见问题

### Q: 如何修改已有的战报?

直接编辑 `matches/` 目录下的Markdown文件,修改后重新运行 `npm run sync` 即可。

### Q: 照片太大怎么办?

可以在整理照片前手动压缩,或者在公众号编辑器中上传时自动压缩。

### Q: 如何添加自定义样式?

编辑 `scripts/sync-wechat.js` 中的样式定义,修改颜色、字体等。

### Q: 统计数据有误怎么办?

检查 `matches/` 目录下的Markdown文件,确保:
- `attendance` 字段包含所有出勤人员
- `scorers` 字段格式正确
- 每场比赛都正确记录

## 进阶功能

### 自定义公众号模板

可以编辑 `scripts/sync-wechat.js` 中的 `generateWechatArticle` 函数来自定义:
- 顶部横幅
- 比赛信息框样式
- 进球榜展示方式
- 尾部签名

### 导出为PDF

可以使用浏览器的打印功能将HTML文章保存为PDF:
```bash
npm run sync
# 在浏览器中打开生成的HTML文件
# 使用打印功能保存为PDF
```

### 集成静态网站

未来可以轻松集成VitePress或Astro,将战报生成为独立网站:

```bash
npm install -g vitepress
vitepress init
```

## 更新日志

### v1.0.0 (2025-01-12)
- ✅ 基础战报功能
- ✅ 照片管理
- ✅ 数据统计
- ✅ 公众号格式转换
- ✅ Git版本管理

## 贡献

欢迎提交问题和改进建议!

## 许可

MIT License

---

**河伯FC · 每周末与你相约** ⚽
