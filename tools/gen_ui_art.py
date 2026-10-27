"""
Ícones pixel da interface (Fase 5). Reproduzível: `python3 tools/gen_ui_art.py`.
- logo-seal.png 32×32: selo do portão (topo da barra e fallback da logo).
- icon-dia.png 16×16: ampulheta, para o Dia.
- icon-moeda.png 16×16: moeda, para as Moedas.
Só cores de src/render/palette.json, sem anti-aliasing.
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'art', 'ui')
PAL = {c['id']: c['hex'] for c in json.load(open(os.path.join(ROOT, 'src/render/palette.json')))['colors']}


def col(cid, a=255):
    h = PAL[cid]
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def seal():
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 31, 31], fill=col('ouro-0'))
    d.ellipse([2, 2, 29, 29], fill=col('noite-0'))
    d.ellipse([3, 3, 28, 28], outline=col('ouro-2'))
    d.pieslice([9, 6, 22, 19], 180, 360, fill=col('pergaminho-2'))
    d.rectangle([9, 12, 22, 22], fill=col('pergaminho-2'))
    d.pieslice([11, 8, 20, 17], 180, 360, fill=col('madeira-2'))
    d.rectangle([11, 12, 20, 22], fill=col('madeira-2'))
    d.point((15, 13), fill=col('ouro-4')); d.point((16, 13), fill=col('ouro-4'))
    d.rectangle([7, 23, 24, 25], fill=col('carimbo-2'))
    return im


def hourglass():
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([3, 1, 12, 2], fill=col('ouro-2'))
    d.rectangle([3, 13, 12, 14], fill=col('ouro-2'))
    d.polygon([(4, 3), (11, 3), (8, 8)], fill=col('pergaminho-2'))
    d.polygon([(8, 8), (5, 13), (11, 13)], fill=col('ouro-4'))
    d.line([(4, 3), (8, 8)], fill=col('ouro-1'))
    d.line([(11, 3), (8, 8)], fill=col('ouro-1'))
    d.point((8, 7), fill=col('ouro-0'))
    return im


def coin():
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([1, 1, 14, 14], fill=col('ouro-0'))
    d.ellipse([2, 2, 13, 13], fill=col('ouro-2'))
    d.ellipse([3, 3, 12, 12], outline=col('ouro-1'))
    d.rectangle([7, 5, 8, 10], fill=col('ouro-1'))
    d.point((4, 4), fill=col('ouro-4')); d.point((5, 3), fill=col('ouro-4'))
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    seal().save(os.path.join(OUT, 'logo-seal.png'))
    hourglass().save(os.path.join(OUT, 'icon-dia.png'))
    coin().save(os.path.join(OUT, 'icon-moeda.png'))
    print('ícones gerados em', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
