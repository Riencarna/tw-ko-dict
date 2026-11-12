# 홈 화면 아이콘(PNG)을 만듭니다.  사용법: python -I tools/make_icons.py .
import sys
from PIL import Image, ImageDraw, ImageFont

out = sys.argv[1]


def font(names, size):
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    return ImageFont.load_default()


for size in (192, 512):
    img = Image.new("RGB", (size, size), "#0f766e")
    d = ImageDraw.Draw(img)
    zh = font(["msjhbd.ttc", "msjh.ttc", "mingliu.ttc"], int(size * 0.40))
    ko = font(["malgunbd.ttf", "malgun.ttf"], int(size * 0.27))
    d.text((size / 2, size * 0.36), "台", font=zh, fill="#ffffff", anchor="mm")
    d.text((size / 2, size * 0.74), "한", font=ko, fill="#d9f0ec", anchor="mm")
    img.save(f"{out}/icon-{size}.png")
    print("icon", size)
