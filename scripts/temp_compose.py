from PIL import Image, ImageOps, ImageDraw

def compose_cover():
    try:
        bg_path = "/Users/yesu/zhijifcweekly/cover-bg-raw.png"
        logo_path = "/Users/yesu/zhijifcweekly/logo.png"
        out_path = "/Users/yesu/zhijifcweekly/final-cover-round.png"
        
        # 1. 打开背景和Logo
        bg = Image.open(bg_path).convert("RGBA")
        logo = Image.open(logo_path).convert("RGBA")
        
        # 2. 目标尺寸 (2.35:1, 900x383)
        target_w, target_h = 900, 383
        
        # 3. 裁剪背景图 (保持不变)
        bg_aspect = bg.width / bg.height
        target_aspect = target_w / target_h
        
        if bg_aspect > target_aspect:
            new_h = target_h
            new_w = int(bg.width * (target_h / bg.height))
        else:
            new_w = target_w
            new_h = int(bg.height * (target_w / bg.width))
            
        bg_resized = bg.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        bg_cropped = bg_resized.crop((left, top, left + target_w, top + target_h))
        
        # 4. Logo 处理：调整大小 + 圆形裁剪 + 描边
        logo_h = int(target_h * 0.5) # 占高度 50%
        ratio = logo_h / logo.height
        logo_w = int(logo.width * ratio)
        logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        
        # 创建圆形 Mask
        mask = Image.new("L", (logo_w, logo_h), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, logo_w, logo_h), fill=255)
        
        # 应用圆形 Mask
        logo_round = Image.new("RGBA", (logo_w, logo_h), (0,0,0,0))
        logo_round.paste(logo_resized, (0,0), mask=mask)
        
        # (可选) 加白色描边圈，提升质感
        stroke_width = 3
        draw.ellipse((0, 0, logo_w-1, logo_h-1), outline=None, fill=None) # 清除之前的
        # 为了加描边，我们可以画一个比logo稍大的白圆，放在下面
        bg_circle = Image.new("RGBA", (logo_w + stroke_width*2, logo_h + stroke_width*2), (0,0,0,0))
        draw_circle = ImageDraw.Draw(bg_circle)
        draw_circle.ellipse((0, 0, logo_w + stroke_width*2 - 1, logo_h + stroke_width*2 - 1), fill=(255,255,255,200)) # 半透明白圈
        
        # 5. 居中定位
        # 先贴白圈
        pos_x_circle = (target_w - bg_circle.width) // 2
        pos_y_circle = (target_h - bg_circle.height) // 2
        
        # 再贴Logo
        pos_x = (target_w - logo_w) // 2
        pos_y = (target_h - logo_h) // 2
        
        # 6. 合成
        final_img = Image.new("RGBA", (target_w, target_h), (0,0,0,255))
        final_img.paste(bg_cropped, (0, 0))
        final_img.paste(bg_circle, (pos_x_circle, pos_y_circle), bg_circle) # 贴描边底
        final_img.paste(logo_round, (pos_x, pos_y), logo_round) # 贴圆Logo
        
        final_img.save(out_path)
        print(f"✅ Cover generated (Round Logo): {out_path}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    compose_cover()
