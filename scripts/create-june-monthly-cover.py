#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFilter
import math, random, os

W, H = 1536, 653
OUT = "/Users/yesu/zhijifcweekly/photos/2026-06-30-monthly/cover.png"
LOGO = "/Users/yesu/zhijifcweekly/logo-200.png"
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# Warm cream vertical gradient
img = Image.new("RGBA", (W, H), (255, 253, 247, 255))
for y in range(H):
    t = y / (H - 1)
    r = int(255 * (1-t) + 246 * t)
    g = int(253 * (1-t) + 236 * t)
    b = int(247 * (1-t) + 216 * t)
    ImageDraw.Draw(img).line([(0, y), (W, y)], fill=(r, g, b, 255))

d = ImageDraw.Draw(img, "RGBA")

# Misty pitch base
pitch_y = int(H * 0.63)
d.rectangle([0, pitch_y, W, H], fill=(169, 190, 135, 42))
for i in range(11):
    y = pitch_y + i * 24
    d.line([(0, y), (W, y + 10)], fill=(255, 255, 255, 38), width=2)

# Soft floodlight glows
for cx, cy in [(235, 165), (W-235, 165), (430, 120), (W-430, 120)]:
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow, "RGBA")
    for r in range(170, 8, -8):
        alpha = int(75 * (1 - r/180)**1.5)
        gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 222, 139, alpha))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img, "RGBA")
    for dx in [-18, 0, 18]:
        d.ellipse([cx+dx-5, cy-5, cx+dx+5, cy+5], fill=(255, 244, 210, 230))

# Golden rain streaks, deterministic
random.seed(630)
for _ in range(430):
    x = random.randint(-80, W+80)
    y = random.randint(0, H)
    length = random.randint(22, 90)
    slant = random.randint(8, 26)
    alpha = random.randint(28, 92)
    width = random.choice([1,1,1,2])
    d.line([(x, y), (x+slant, y+length)], fill=(201,168,76,alpha), width=width)

# Poetic cloud ribbons
for i, (yy, a) in enumerate([(250, 42), (328, 30), (462, 26)]):
    pts = []
    for x in range(-80, W+81, 40):
        pts.append((x, yy + int(math.sin(x/110 + i) * 18)))
    d.line(pts, fill=(255,255,255,a), width=38, joint="curve")
    d.line(pts, fill=(201,168,76,22), width=2)

# Subtle football field geometry
line = (201,168,76,92)
d.arc([W//2-170, pitch_y-40, W//2+170, pitch_y+300], 200, 340, fill=line, width=3)
d.line([(W//2, pitch_y+10), (W//2, H)], fill=(255,255,255,58), width=2)
d.rectangle([72, pitch_y+64, 310, H+80], outline=(255,255,255,48), width=2)
d.rectangle([W-310, pitch_y+64, W-72, H+80], outline=(255,255,255,48), width=2)

# Data motif: four golden bars for four June reports
bar_base = H - 78
for i, h in enumerate([84, 132, 112, 96]):
    x = W - 315 + i*42
    d.rounded_rectangle([x, bar_base-h, x+22, bar_base], radius=8, fill=(201,168,76,72))
    d.rounded_rectangle([x, bar_base-h, x+22, bar_base], radius=8, outline=(176,138,40,95), width=1)

# Central empty logo medallion
cx, cy = W//2, 113
for r, alpha in [(150,42),(126,58),(101,230)]:
    d.ellipse([cx-r,cy-r,cx+r,cy+r], fill=(255,253,247,alpha))
d.ellipse([cx-111,cy-111,cx+111,cy+111], outline=(201,168,76,185), width=3)
d.ellipse([cx-121,cy-121,cx+121,cy+121], outline=(255,255,255,170), width=6)

# Logo overlay
logo = Image.open(LOGO).convert("RGBA")
scale = 162 / logo.width
try:
    resample = Image.Resampling.LANCZOS
except AttributeError:
    resample = 1
logo = logo.resize((int(logo.width*scale), int(logo.height*scale)), resample)
pos = ((W-logo.width)//2, cy-logo.height//2)
img.alpha_composite(logo, pos)

# Warm vignette and polish
v = Image.new("RGBA", (W,H), (0,0,0,0))
vd = ImageDraw.Draw(v, "RGBA")
for r in range(0, 420, 8):
    alpha = int((r/420)**2 * 28)
    vd.rectangle([r, r//3, W-r, H-r//3], outline=(121,89,29,alpha), width=8)
img = Image.alpha_composite(img, v)

# Gentle sharpen
img = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=85, threshold=3))
img.convert("RGB").save(OUT, "PNG", quality=95)
print(OUT)
