#!/usr/bin/env python3
"""
一体化实拍封面命令：选图 → 裁切风格化 → 叠 logo → 写 frontmatter cover

用法:
  python3 scripts/make-photo-cover.py 2026-08-15-知己内战.md --photo photos/2026-08-15/02.jpg
  python3 scripts/make-photo-cover.py 2026-08-15-知己内战.md            # 自动选 photos/<date>/ 第一张非封面照片

流程:
  1. 从 frontmatter 读 date，定位 photos/<date>/ 目录
  2. 实拍图 center-crop 2.35:1 → 1536x653，暖金叠加 + 柔和暗角
  3. logo-200.png 白底转透明 → 圆羽化 → 柔光投影 → 顶部居中（无硬徽章底衬）
  4. 输出 photos/<date>/cover.png
  5. frontmatter 写入 cover: photos/<date>/cover.png + coverBody: false
"""

import argparse
import glob
import os
import re
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(PROJECT_ROOT, "logo-200.png")

TARGET_W, TARGET_H = 1536, 653  # 2.35:1


def resolve_match_file(name):
    candidates = [
        os.path.join(PROJECT_ROOT, "matches", name),
        os.path.join(PROJECT_ROOT, "matches", f"{name}.md"),
        os.path.abspath(name),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def parse_frontmatter(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return text, {}
    fm = {}
    for line in m.group(1).splitlines():
        kv = re.match(r"^([A-Za-z_][\w]*)\s*:\s*(.*)$", line)
        if kv:
            fm[kv.group(1)] = kv.group(2).strip().strip("'\"")
    return text, fm


def pick_default_photo(date):
    photo_dir = os.path.join(PROJECT_ROOT, "photos", date)
    if not os.path.isdir(photo_dir):
        return None, photo_dir
    exts = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    files = sorted(f for e in exts for f in glob.glob(os.path.join(photo_dir, e)))
    files = [
        f for f in files
        if "logo" not in os.path.basename(f).lower()
        and not os.path.basename(f).lower().startswith("cover")
        and "contact" not in os.path.basename(f).lower()
    ]
    return (files[0] if files else None), photo_dir


def stylize(photo_path):
    """center-crop 2.35:1 → 暖金叠加 + 柔和暗角"""
    img = Image.open(photo_path).convert("RGB")

    src_aspect = img.width / img.height
    dst_aspect = TARGET_W / TARGET_H
    if src_aspect > dst_aspect:
        new_w = int(img.height * dst_aspect)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        new_h = int(img.width / dst_aspect)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))

    img = img.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS).convert("RGBA")

    # 暖金叠加：低透明度 multiply，让画面偏暖但不压暗高光
    warm = Image.new("RGBA", (TARGET_W, TARGET_H), (255, 236, 200, 0))
    warm_draw = ImageDraw.Draw(warm)
    for y in range(TARGET_H):
        alpha = int(26 + 18 * (y / TARGET_H))  # 底部稍暖
        warm_draw.line([(0, y), (TARGET_W, y)], fill=(255, 226, 170, alpha))
    img = Image.alpha_composite(img, warm)

    # 柔和暗角 vignette：四角轻微压暗，突出中央人物
    vignette = Image.new("L", (TARGET_W, TARGET_H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-TARGET_W * 0.25, -TARGET_H * 0.6, TARGET_W * 1.25, TARGET_H * 1.6), fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGBA", (TARGET_W, TARGET_H), (20, 15, 5, 70))
    dark.putalpha(Image.eval(vignette, lambda v: int((255 - v) * 0.28)))
    img = Image.alpha_composite(img, dark)

    return img


def load_soft_logo(logo_width):
    """logo-200.png 是 RGB 白底无 alpha 的圆形徽章。
    按颜色距离抠除会让内圈浅灰变半透明、透出照片显脏（实测教训），
    正确做法是按形状抠：圆形 mask 一次切在红环上，圆内全实、边缘仅 1.5px 抗锯齿。"""
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo = logo.crop(logo.getbbox())

    ratio = logo_width / logo.width
    logo = logo.resize((logo_width, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    w, h = logo.size
    d = min(w, h)

    # 圆形 mask：向内收 2px 切掉白边，再 1.5px 高斯抗锯齿
    inset = 2
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((inset, inset, w - 1 - inset, h - 1 - inset), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.5))
    logo.putalpha(mask)
    return logo


def compose(cover, logo):
    """自然融合三板斧：磨砂玻璃过渡区 + 暖色柔光 + 贴色温的软投影"""
    W, H = cover.size
    logo_w = 230
    logo_img = load_soft_logo(logo_w)
    lw, lh = logo_img.size

    pos_x = (W - lw) // 2
    pos_y = 20
    cx, cy = pos_x + lw // 2, pos_y + lh // 2

    # 1) 磨砂玻璃过渡区：logo 背后一块椭圆区域，把照片局部高斯模糊+轻微提亮
    #    —— 自然的视觉分离，代替硬徽章底衬
    pad = 90  # 过渡区比 logo 大一圈
    region = (cx - lw // 2 - pad, cy - lh // 2 - pad // 2,
              cx + lw // 2 + pad, cy + lh // 2 + pad // 2)
    region = (max(0, region[0]), max(0, region[1]), min(W, region[2]), min(H, region[3]))

    backdrop = cover.crop(region)
    blurred = backdrop.filter(ImageFilter.GaussianBlur(22))
    # 轻微提亮 + 偏暖（磨砂玻璃感）
    bright = Image.new("RGBA", blurred.size, (255, 248, 235, 46))
    blurred = Image.alpha_composite(blurred, bright)

    # 过渡区自身也要羽化边缘，避免磨砂区本身成为新的"硬块"
    bw, bh = blurred.size
    bmask = Image.new("L", (bw, bh), 0)
    bmd = ImageDraw.Draw(bmask)
    bmd.ellipse((-bw * 0.08, -bh * 0.15, bw * 1.08, bh * 1.15), fill=255)
    bmask = bmask.filter(ImageFilter.GaussianBlur(50))

    frosted_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    frosted_layer.paste(blurred, (region[0], region[1]), bmask)
    cover = Image.alpha_composite(cover, frosted_layer)

    # 2) 暖色柔光 halo：logo 周围一层低透明度暖金光晕，进一步融入暖金画面
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    halo_r = max(lw, lh) // 2 + 46
    hd.ellipse((cx - halo_r, cy - halo_r, cx + halo_r, cy + halo_r), fill=(255, 233, 180, 60))
    halo = halo.filter(ImageFilter.GaussianBlur(55))
    cover = Image.alpha_composite(cover, halo)

    # 3) 贴合色温的软投影：暖棕色调、大模糊、向下偏移，模拟环境光遮挡
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", (lw, lh), (70, 50, 22, 90))
    shadow.paste(sh, (pos_x, pos_y + 12), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    cover = Image.alpha_composite(cover, shadow)

    # 4) 贴 logo（95% 不透明度，留一丝通透感）
    logo_img.putalpha(logo_img.split()[3].point(lambda v: int(v * 0.95)))
    cover.alpha_composite(logo_img, (pos_x, pos_y))

    return cover


def patch_frontmatter(match_path, cover_rel):
    text, _ = parse_frontmatter(match_path)
    m = re.match(r"^(---\n)(.*?)(\n---\n)", text, re.S)
    if not m:
        print("❌ frontmatter 解析失败，未写入 cover 字段")
        return False

    head, body = m.group(2), text[m.end():]
    changed = False

    def set_field(h, key, value):
        nonlocal changed
        pattern = re.compile(rf"^{key}\s*:.*$", re.M)
        new_line = f"{key}: {value}"
        if pattern.search(h):
            h2 = pattern.sub(new_line, h, count=1)
        else:
            h2 = h + "\n" + new_line
        if h2 != h:
            changed = True
        return h2

    head = set_field(head, "cover", f'"{cover_rel}"')
    head = set_field(head, "coverBody", "false")

    if changed or True:  # 即使无变化也幂等写回
        new_text = f"---\n{head}\n---\n{body}"
        with open(match_path, "w", encoding="utf-8") as f:
            f.write(new_text)
    return True


def main():
    parser = argparse.ArgumentParser(description="实拍照片一体化封面：风格化 + logo + frontmatter")
    parser.add_argument("match_file", help="比赛文件名，如 2026-08-15-知己内战.md")
    parser.add_argument("--photo", help="源照片路径（省略则自动选 photos/<date>/ 第一张非封面照片）")
    parser.add_argument("--output", help="输出路径（默认 photos/<date>/cover.png）")
    parser.add_argument("--no-write", action="store_true", help="只生成图片，不改 frontmatter")
    parser.add_argument("--show-candidates", action="store_true", help="列出候选照片后退出，便于挑选")
    args = parser.parse_args()

    match_path = resolve_match_file(args.match_file)
    if not match_path:
        print(f"❌ 未找到比赛文件: {args.match_file}")
        sys.exit(1)

    _, fm = parse_frontmatter(match_path)
    date = fm.get("date", "")
    if not date:
        print("❌ frontmatter 缺少 date 字段")
        sys.exit(1)

    photo_dir = os.path.join(PROJECT_ROOT, "photos", date)
    if args.show_candidates:
        for f in sorted(os.listdir(photo_dir)) if os.path.isdir(photo_dir) else []:
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                print(f)
        return

    if args.photo:
        photo_path = os.path.abspath(args.photo)
        if not os.path.isfile(photo_path):
            print(f"❌ 源照片不存在: {args.photo}")
            sys.exit(1)
    else:
        photo_path, photo_dir = pick_default_photo(date)
        if not photo_path:
            print(f"❌ {photo_dir} 下没有可用照片，请用 --photo 指定")
            sys.exit(1)
        print(f"📌 未指定 --photo，自动选用: {os.path.relpath(photo_path, PROJECT_ROOT)}")

    out_path = os.path.abspath(args.output) if args.output else os.path.join(photo_dir, "cover.png")

    if not os.path.isfile(LOGO_PATH):
        print(f"❌ logo 不存在: {LOGO_PATH}")
        sys.exit(1)

    print(f"🖼️  风格化: {os.path.relpath(photo_path, PROJECT_ROOT)} → {TARGET_W}x{TARGET_H} (2.35:1)")
    cover = stylize(photo_path)

    print("🏷️  叠加 logo（白底转透明 + 圆羽化 + 柔光投影）")
    cover = compose(cover, None)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    cover.convert("RGB").save(out_path, "PNG")
    print(f"✅ 封面已生成: {os.path.relpath(out_path, PROJECT_ROOT)}")

    # 验证输出
    check = Image.open(out_path)
    if check.size != (TARGET_W, TARGET_H):
        print(f"❌ 尺寸校验失败: {check.size}")
        sys.exit(1)
    print(f"✅ 尺寸校验通过: {check.size[0]}x{check.size[1]}")

    if not args.no_write:
        cover_rel = os.path.relpath(out_path, PROJECT_ROOT)
        if patch_frontmatter(match_path, cover_rel):
            print(f"✅ frontmatter 已写入: cover: {cover_rel}, coverBody: false")


if __name__ == "__main__":
    main()
