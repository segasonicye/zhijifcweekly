#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
from PIL import Image, ImageDraw

# 配置
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(PROJECT_ROOT, "logo.png")
BG_RAW_PATH = os.path.join(PROJECT_ROOT, "cover-bg-raw.png")

def generate_background(prompt, resolution="2K"):
    """调用 nano-banana-pro 生成背景图"""
    print(f"🎨 正在生成背景图... Prompt: {prompt}")
    
    # 构建命令
    # 注意：这里假设 nano-banana-pro 路径固定
    skill_script = os.path.expanduser("~/.agents/skills/nano-banana-pro/scripts/generate_image.py")
    uv_bin = os.path.expanduser("~/.local/bin/uv")
    
    # 强制加上构图指令
    full_prompt = (
        f"A wide cinematic football poster background, aspect ratio 21:9. "
        f"Symmetrical composition. In the dead center: {prompt}. "
        f"Background: stadium atmosphere, dynamic lighting. High contrast, 3D render. "
        f"Center 1:1 area must contain the main subject. Sides are atmospheric background only."
    )
    
    cmd = [
        uv_bin, "run", skill_script,
        "--prompt", full_prompt,
        "--filename", BG_RAW_PATH,
        "--resolution", resolution
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("✅ 背景图生成成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 背景生成失败: {e}")
        return False

def compose_cover(output_path):
    """合成背景和圆形Logo"""
    print("🛠️ 正在合成封面...")
    
    try:
        # 1. 打开背景和Logo
        if not os.path.exists(BG_RAW_PATH):
            print(f"❌ 背景图不存在: {BG_RAW_PATH}")
            return False
            
        bg = Image.open(BG_RAW_PATH).convert("RGBA")
        logo = Image.open(LOGO_PATH).convert("RGBA")
        
        # 2. 目标尺寸 (2.35:1, 900x383)
        target_w, target_h = 900, 383
        
        # 3. 裁剪背景图 (Center Crop)
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
        logo_h = int(target_h * 0.55) # 占高度 55%
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
        
        # 加白色描边圈
        stroke_width = 4
        bg_circle = Image.new("RGBA", (logo_w + stroke_width*2, logo_h + stroke_width*2), (0,0,0,0))
        draw_circle = ImageDraw.Draw(bg_circle)
        draw_circle.ellipse((0, 0, logo_w + stroke_width*2 - 1, logo_h + stroke_width*2 - 1), fill=(255,255,255,255))
        
        # 5. 居中定位
        pos_x_circle = (target_w - bg_circle.width) // 2
        pos_y_circle = (target_h - bg_circle.height) // 2
        
        pos_x = (target_w - logo_w) // 2
        pos_y = (target_h - logo_h) // 2
        
        # 6. 合成
        final_img = Image.new("RGBA", (target_w, target_h), (0,0,0,255))
        final_img.paste(bg_cropped, (0, 0))
        final_img.paste(bg_circle, (pos_x_circle, pos_y_circle), bg_circle) # 贴描边底
        final_img.paste(logo_round, (pos_x, pos_y), logo_round) # 贴圆Logo
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        final_img.save(output_path)
        print(f"✅ 封面生成完毕: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ 合成错误: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="生成知己队战报封面 (智能背景 + 圆形Logo)")
    parser.add_argument("--prompt", required=True, help="背景主题提示词 (如: 'red vs blue clash', 'rainy match')")
    parser.add_argument("--output", required=True, help="输出文件路径 (如: 'photos/2026-02-22/cover.png')")
    parser.add_argument("--skip-gen", action="store_true", help="跳过生图，只重新合成")
    
    args = parser.parse_args()
    
    # 1. 生成背景
    if not args.skip_gen:
        success = generate_background(args.prompt)
        if not success:
            sys.exit(1)
            
    # 2. 合成
    # 将相对路径转换为绝对路径
    output_abs = os.path.abspath(args.output)
    compose_cover(output_abs)

if __name__ == "__main__":
    main()
