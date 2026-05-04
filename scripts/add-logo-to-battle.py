import sys

file_path = "/Users/yesu/zhijifcweekly/scripts/wechat-template-battle.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 目标：在 <h1> 标签之前，插入 Logo HTML
target_str = '<h1 style="font-size: 30px;'
insert_str = '''      <div style="margin-bottom: 20px;">
        <img src="logo-200.png" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
      </div>

      <h1 style="font-size: 30px;'''

if target_str in content:
    new_content = content.replace(target_str, insert_str, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ 成功在标题前添加 Logo")
else:
    print("❌ 未找到目标字符串，可能已经添加过或文件已更新")
