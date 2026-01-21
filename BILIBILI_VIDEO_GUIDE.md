# 微信公众号插入B站视频指南

## 📹 如何在公众号文章中嵌入B站视频

### 方法1：使用BV号（推荐，最简单）

**步骤：**

1. **找到B站视频的BV号**
   - 打开B站视频页面
   - 在URL中找到BV号
   - 例如：`https://www.bilibili.com/video/BV1xx411c7mD`
   - BV号就是：`BV1xx411c7mD`

2. **使用嵌入代码**
   ```html
   <iframe
     src="//player.bilibili.com/player.html?bvid=你的BV号&page=1"
     scrolling="no"
     border="0"
     frameborder="no"
     framespacing="0"
     allowfullscreen="true"
     style="width: 100%; height: 400px;">
   </iframe>
   ```

3. **替换BV号**
   - 将示例中的`BV1xx411c7mD`替换为你的视频BV号
   - 保持其他参数不变

---

### 方法2：使用完整嵌入代码（最灵活）

**步骤：**

1. **在B站获取嵌入代码**
   - 打开B站视频页面
   - 点击视频下方的"分享"按钮
   - 选择"嵌入代码"
   - 复制完整的HTML代码

2. **嵌入代码示例**
   ```html
   <iframe src="//player.bilibili.com/player.html?aid=视频ID&bvid=BV号&cid=分区ID&page=1"
     scrolling="no" border="0" frameborder="no" framespacing="0"
     allowfullscreen="true" style="width: 100%; height: 500px;">
   </iframe>
   ```

3. **调整样式**
   - 修改`height`值调整视频高度
   - 修改`width`值调整宽度（通常100%）

---

### 方法3：直接上传到微信公众号（最稳定）

**优点：**
- ✅ 不依赖第三方平台
- ✅ 加载速度快
- ✅ 不会被平台删除

**步骤：**
1. 从B站下载视频（使用第三方工具）
2. 在公众号编辑器中点击"视频"
3. 上传视频文件
4. 等待转码完成

---

## 🎨 实际应用示例

### 示例1：固定大小视频

```html
<iframe
  src="//player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1"
  scrolling="no"
  border="0"
  frameborder="no"
  framespacing="0"
  allowfullscreen="true"
  style="width: 100%; height: 400px; border-radius: 8px;">
</iframe>
```

### 示例2：响应式视频（自适应屏幕）

```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
  <iframe
    src="//player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1"
    scrolling="no"
    border="0"
    frameborder="no"
    framespacing="0"
    allowfullscreen="true"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
  </iframe>
</div>
```

**说明：**
- `padding-bottom: 56.25%` 创建16:9的宽高比
- `position: absolute` 让iframe完全填充容器
- 自动适应手机和电脑屏幕

### 示例3：带标题的视频

```html
<div style="margin: 20px 0;">
  <p style="text-align: center; color: #e94560; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
    🎬 国足U23精彩集锦
  </p>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
    <iframe
      src="//player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1"
      scrolling="no"
      border="0"
      frameborder="no"
      framespacing="0"
      allowfullscreen="true"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
    </iframe>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 10px;">
    点击播放观看精彩瞬间
  </p>
</div>
```

---

## 🔧 常见问题

### Q1：视频显示为空白？
**A：** 检查以下几点：
- BV号是否正确
- 是否在https环境下访问
- 网络是否正常

### Q2：视频无法播放？
**A：** 可能原因：
- B站限制外链播放
- 尝试使用完整嵌入代码
- 或直接上传视频到公众号

### Q3：如何调整视频大小？
**A：** 修改`height`值：
```html
style="width: 100%; height: 300px;"  <!-- 较小 -->
style="width: 100%; height: 500px;"  <!-- 较大 -->
```

### Q4：视频不居中？
**A：** 添加居中样式：
```html
<div style="text-align: center;">
  <iframe ...></iframe>
</div>
```

---

## 💡 最佳实践

### 推荐设置：

1. **视频尺寸**
   - 手机：`height: 200-300px`
   - 电脑：`height: 400-500px`
   - 响应式：使用`padding-bottom: 56.25%`

2. **样式优化**
   ```html
   <iframe
     src="//player.bilibili.com/player.html?bvid=你的BV号&page=1&high_quality=1"
     scrolling="no"
     border="0"
     frameborder="no"
     framespacing="0"
     allowfullscreen="true"
     style="width: 100%; height: 400px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
   </iframe>
   ```

3. **加载参数说明**
   - `bvid`: 视频BV号（必需）
   - `page`: 分P数，默认为1
   - `high_quality=1`: 高清画质
   - `danmaku=0`: 关闭弹幕（可选）

---

## 📱 在微信公众号中使用

### 步骤：

1. **生成嵌入代码**
   - 使用上面任意方法获取HTML代码

2. **插入到公众号**
   - 打开公众号编辑器
   - 点击"<>"（源代码）按钮
   - 粘贴HTML代码
   - 再次点击"<>"返回可视化模式

3. **预览效果**
   - 点击"预览"
   - 在手机上查看视频是否正常显示
   - 测试播放功能

4. **调整位置**
   - 可以拖动视频到任意位置
   - 调整前后文字内容

---

## 🎯 快速模板

### 简单模板：
```html
<iframe src="//player.bilibili.com/player.html?bvid=你的BV号&page=1"
  style="width: 100%; height: 400px;" frameborder="0"
  allowfullscreen="true"></iframe>
```

### 完整模板（推荐）：
```html
<div style="margin: 20px 0;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
    <iframe
      src="//player.bilibili.com/player.html?bvid=你的BV号&page=1"
      scrolling="no"
      border="0"
      frameborder="no"
      framespacing="0"
      allowfullscreen="true"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
    </iframe>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 10px;">
    点击播放观看精彩瞬间
  </p>
</div>
```

---

## ✨ 总结

**最简单的方法：**
1. 找到B站视频的BV号
2. 替换模板中的`你的BV号`
3. 复制到公众号编辑器

**注意事项：**
- 首次使用建议预览测试
- 确保视频在公众号中能正常播放
- 建议同时提供文字说明，以防视频无法加载

祝使用顺利！🎉
