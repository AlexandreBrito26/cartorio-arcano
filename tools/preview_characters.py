"""
Prévia dos personagens: tinge e empilha as camadas como o PixelPortrait faz.
Uso: python3 tools/preview_characters.py [saida.png] [escala]
A linha rosa marca onde o tampo do balcão costuma cobrir o retrato (por volta da linha 69).
"""
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'public', 'art', 'personagens')
W, H = 64, 72
LOOKS = {
    'humano': ('#d9a273', '#5a3a22', '#2a5db0', '#3b2f6b', 1, False),
    'elfo': ('#f3dcc6', '#c9a24b', '#3b7a3b', '#23504a', 0, False),
    'anao': ('#e3b48c', '#8b5a2b', '#7a4a1e', '#5b2a3a', 1, True),
    'goblin': ('#8fbf6a', '#2b1d17', '#b8860b', '#6b4a22', 0, False),
    'fada': ('#f7d6e0', '#7a3b6e', '#6b3fa0', '#2c3e6b', 2, False),
    'draconato': ('#b5523b', '#2b1d17', '#b8860b', '#4a4a5e', 0, False),
    'tritao': ('#5fb3c4', '#2f5d62', '#2a5db0', '#23504a', 1, False),
    'golem': ('#8a8a8f', '#2b1d17', '#b8860b', '#4a4a5e', 0, False),
    'espectro': ('#d8dce8', '#2b1d17', '#6b3fa0', '#3b2f6b', 0, False),
}


def tint(img, hexcol):
    r, g, b = (int(hexcol[i:i + 2], 16) for i in (1, 3, 5))
    px = img.load()
    out = Image.new('RGBA', img.size)
    po = out.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            if pa:
                po[x, y] = (pr * r // 255, pg * g // 255, pb * b // 255, pa)
    return out


def compose(slug, hand_dy=(0, 0)):
    sheet = Image.open(os.path.join(DIR, f'{slug}.png')).convert('RGBA')
    atlas = json.load(open(os.path.join(DIR, f'{slug}.json')))
    fr = {f['name']: sheet.crop((f['x'], f['y'], f['x'] + W, f['y'] + H)) for f in atlas['frames']}
    skin, hair, eyes, cloak, style, beard = LOOKS[slug]
    ghost = slug == 'espectro'
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    def put(name, color=None, alpha=1.0, dy=0):
        im = fr[name]
        if color:
            im = tint(im, color)
        if alpha < 1:
            a = im.split()[3].point(lambda v: int(v * alpha))
            im.putalpha(a)
        out.alpha_composite(im, (0, dy))

    if slug == 'fada':
        put('wings')
    put('cloak', cloak, 0.72 if ghost else 1)
    put('skin', skin, 0.72 if ghost else 1)
    put('shade', alpha=0.72 if ghost else 1)
    if slug not in ('golem', 'espectro'):
        put(f'hair{style}', hair)
        if beard:
            put('beard', hair)
    put('eyes', eyes)
    put('eyewhite')
    put('details')
    put('outline')
    for side, dy in zip('LR', hand_dy):
        put(f'arm{side}', cloak, dy=dy)
        put(f'hand{side}', skin, 0.72 if ghost else 1, dy=dy)
        put(f'line{side}', dy=dy)
    return out


def main():
    dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'preview-personagens.png')
    s = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    slugs = list(LOOKS)
    cols = 5
    rows = (len(slugs) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * W * s, rows * H * s), (28, 22, 56, 255))
    for i, slug in enumerate(slugs):
        im = compose(slug).resize((W * s, H * s), Image.NEAREST)
        x, y = (i % cols) * W * s, (i // cols) * H * s
        sheet.alpha_composite(im, (x, y))
        ImageDraw.Draw(sheet).line([(x, y + 69 * s), (x + W * s, y + 69 * s)], fill=(255, 80, 160, 255))
    sheet.save(dest)
    print('prévia salva em', dest)


if __name__ == '__main__':
    main()
