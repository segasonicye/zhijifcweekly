# 微信公众号多账号支持指南

## 📋 功能说明

战报系统现在支持**多个公众号**，可以轻松切换不同的公众号进行推送。

## 🚀 快速开始

### 1. 添加新公众号

编辑 `wechat-config.json` 文件：

```json
{
  "defaultAccount": "zhiji",
  "accounts": {
    "zhiji": {
      "name": "知己足球俱乐部",
      "appId": "wxXXXXXXXXXXXXXXXX",
      "appSecret": "YOUR_APP_SECRET"
    },
    "your_new_account": {
      "name": "你的公众号名称",
      "appId": "YOUR_APP_ID",
      "appSecret": "YOUR_APP_SECRET"
    }
  },
  "logo": {
    "zhiji": "logo.png",
    "your_new_account": "your-logo.png"
  }
}
```

**配置说明**：
- `defaultAccount`: 默认使用的公众号账号名
- `accounts`: 公众号配置列表
  - `name`: 公众号名称（显示在文章作者位置）
  - `appId`: 微信公众号 AppID
  - `appSecret`: 微信公众号 AppSecret
- `logo`: 每个公众号对应的 Logo 文件路径

### 2. 添加 Logo

将你的新公众号 Logo 文件放到项目根目录，并重命名为对应的文件名。

例如：
```
zhijifcweekly/
├── logo.png              # 知己俱乐部的 Logo
├── your-logo.png         # 新公众号的 Logo
├── matches/
└── photos/
```

### 3. 使用新公众号

**方法 1：命令行参数（推荐）**
```bash
# 使用默认公众号
node scripts/wechat-auto.js

# 使用指定公众号
node scripts/wechat-auto.js your_new_account
```

**方法 2：交互式选择**
```bash
# 列出所有可用公众号
node scripts/wechat-auto.js --list

# 选择后运行推送
node scripts/wechat-auto.js <account_name>
```

## 📝 使用示例

### 示例 1：使用知己足球俱乐部

```bash
node scripts/wechat-auto.js zhiji
```

### 示例 2：使用新公众号

```bash
node scripts/wechat-auto.js your_new_account
```

## 🔧 获取 AppID 和 AppSecret

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入"设置与开发" → "基本配置"
3. 找到"开发者ID（AppID）"
4. 找到"开发者密码（AppSecret）"，点击"重置"获取

## ⚠️ 注意事项

### 1. 安全性
- **不要**将 `wechat-config.json` 提交到 Git
- 建议将配置文件添加到 `.gitignore`
- 定期更换 AppSecret

### 2. Logo 命名
- Logo 文件必须和配置中的路径一致
- 推荐使用 PNG 格式
- 建议尺寸：200x200px

### 3. 测试配置
添加新公众号后，建议先测试一次推送：
```bash
node scripts/wechat-auto.js your_new_account
```

## 📊 配置文件结构

```json
{
  "defaultAccount": "默认使用的公众号账号名",
  "accounts": {
    "账号名1": {
      "name": "公众号显示名称",
      "appId": "微信AppID",
      "appSecret": "微信AppSecret"
    },
    "账号名2": {
      ...
    }
  },
  "logo": {
    "账号名1": "logo文件路径",
    "账号名2": "其他logo文件路径"
  }
}
```

## 🆕 添加新账号步骤

1. **获取公众号凭证**
   - 登录微信公众平台
   - 获取 AppID 和 AppSecret

2. **准备 Logo**
   - 准备公众号 Logo（推荐 PNG 格式）
   - 放到项目根目录

3. **编辑配置文件**
   - 打开 `wechat-config.json`
   - 在 `accounts` 中添加新账号配置
   - 在 `logo` 中添加 Logo 路径

4. **测试推送**
   ```bash
   node scripts/wechat-auto.js your_new_account
   ```

5. **验证效果**
   - 登录对应公众号后台
   - 进入草稿箱查看
   - 确认 Logo 和文章作者名称

## 🎯 常见问题

### Q: 如何切换默认公众号？
A: 编辑 `wechat-config.json`，修改 `defaultAccount` 为你想要的账号名。

### Q: 推送到错误的公众号了怎么办？
A: 检查命令行参数，确认账号名正确。可以使用 `--list` 查看所有可用账号。

### Q: Logo 没有显示？
A: 检查：
1. Logo 文件路径是否正确
2. 文件是否存在
3. 格式是否正确（推荐 PNG）

### Q: 推送失败提示 "公众号配置不存在"
A: 检查 `wechat-config.json` 中的账号名是否正确。

## 💡 最佳实践

1. **备份配置**
   - 修改配置前先备份
   - 保存好 AppSecret

2. **使用版本控制**
   - 将 `.gitignore` 添加配置文件
   - 不要提交敏感信息

3. **定期测试**
   - 每次推送前测试
   - 验证草稿箱中的内容

4. **命名规范**
   - 账号名使用小写字母和下划线
   - Logo 文件名清晰易懂

## 📞 需要帮助？

如果遇到问题，检查：
1. 配置文件格式是否正确
2. AppID 和 AppSecret 是否有效
3. Logo 文件是否存在
4. 命令行参数是否正确

---

**版本**: v3.2
**更新日期**: 2026-02-21
