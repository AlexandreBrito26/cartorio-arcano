"""
Gera a arte pixel do balcão (Fase 4). Reproduzível: `python3 tools/gen_counter_art.py`.

Base 320×80 px (mesma proporção 4:1 do palco, 1200×300 do SVG antigo, já removido; 1 px de arte = 3,75 unidades).
- counter-back.png:  montanhas, torre, portão e chão, atrás do viajante. O céu (linhas 0 a 39) fica
                     transparente: ele é desenhado pelo Pixi, por dia (src/game/weather.ts).
- counter-front.png: pilares, grade de latão, viga, tampo e objetos fixos, na frente do viajante.
- counter-lamp.png:  lampião pendurado (14×32), com o ponto de suspensão no topo (x=7, y=0).
- counter-stamp.png: folha de 4 quadros 16×18 do carimbo: 0 repouso, 1 caindo, 2 impacto, 3 volta.
- counter-rune.png:  não é gerado aqui; usa a runa de `public/sprites/smoke-rune.*`.
Usa só cores de src/render/palette.json, sem anti-aliasing.
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'art', 'balcao')
PAL = {c['id']: c['hex'] for c in json.load(open(os.path.join(ROOT, 'src/render/palette.json')))['colors']}
W, H = 320, 80


def col(cid, a=255):
    h = PAL[cid]
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def blank(w=W, h=H):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def back():
    im = blank(); d = ImageDraw.Draw(im)
    # o céu (faixas e nuvens) não é mais pintado aqui: cada dia tem o seu, desenhado pelo Pixi
    d.rectangle([0, 40, W, H], fill=col('mare-0'))
    # montanhas distantes
    d.polygon([(0, 40), (20, 31), (40, 38), (65, 28), (90, 36), (110, 30), (140, 39), (165, 34),
               (190, 41), (230, 31), (260, 40), (290, 33), (320, 38), (320, 62), (0, 62)], fill=col('noite-0'))
    # torre distante, com janela acesa
    d.polygon([(161, 36), (170, 24), (179, 36)], fill=col('mare-0'))
    d.rectangle([165, 36, 176, 61], fill=col('mare-0'))
    d.rectangle([169, 41, 172, 45], fill=col('ouro-3'))
    # portão de pedra, em silhueta
    d.rectangle([23, 40, 48, 61], fill=col('noite-4'))
    d.ellipse([23, 27, 48, 48], fill=col('noite-4'))
    d.rectangle([27, 40, 44, 61], fill=col('noite-0'))
    d.ellipse([27, 31, 44, 46], fill=col('noite-0'))
    # chão molhado e reflexos
    d.rectangle([0, 61, W, H], fill=col('mare-0'))
    for y in (66, 72, 76):
        d.line([(0, y), (W, y)], fill=col('noite-4'))
    return im


def front():
    im = blank(); d = ImageDraw.Draw(im)
    # pilares laterais, em madeira com faixas
    for x0, x1 in ((0, 19), (301, 319)):
        d.rectangle([x0, 0, x1, H], fill=col('madeira-2'))
        for y in range(0, 60, 6):
            d.line([(x0, y), (x1, y)], fill=col('madeira-1'))
    d.rectangle([18, 0, 19, 60], fill=col('ouro-1'))
    d.rectangle([300, 0, 301, 60], fill=col('ouro-1'))
    # viga superior com fio de latão
    d.rectangle([0, 0, W, 7], fill=col('madeira-2'))
    d.rectangle([0, 7, W, 8], fill=col('ouro-1'))
    # placa do guichê (o texto é desenhado pelo Pixi, em Cinzel)
    d.rectangle([146, 3, 174, 12], fill=col('madeira-0'))
    d.rectangle([146, 3, 174, 3], fill=col('ouro-0'))
    d.rectangle([146, 12, 174, 12], fill=col('ouro-0'))
    # grade de latão, a cada 10 px
    for x in range(26, 300, 10):
        d.line([(x, 9), (x, 59)], fill=col('ouro-0'))
    # tampo do balcão
    d.rectangle([0, 59, W, 60], fill=col('ouro-2'))
    d.rectangle([0, 61, W, H], fill=col('madeira-1'))
    for y in range(63, H, 3):
        d.line([(0, y), (W, y)], fill=col('madeira-2'))
    d.rectangle([0, 61, W, 61], fill=col('noite-0'))
    # objetos fixos: tinteiro, sineta e carimbo parado
    d.rectangle([42, 57, 50, 61], fill=col('noite-0'))
    d.rectangle([42, 57, 50, 57], fill=col('ouro-0'))
    d.rectangle([236, 55, 244, 61], fill=col('ouro-1'))
    d.rectangle([237, 53, 243, 55], fill=col('ouro-2'))
    d.point((240, 51), fill=col('ouro-2'))
    d.rectangle([266, 53, 270, 61], fill=col('pergaminho-1'))
    return im


def lamp():
    im = blank(14, 32); d = ImageDraw.Draw(im)
    d.line([(7, 0), (7, 8)], fill=col('ouro-0'))
    d.rectangle([3, 8, 11, 17], fill=col('madeira-1'))
    d.rectangle([3, 8, 11, 8], fill=col('ouro-1'))
    d.rectangle([4, 9, 10, 16], fill=col('ouro-0'))
    d.rectangle([5, 10, 9, 15], fill=col('madeira-0'))
    d.rectangle([3, 18, 11, 18], fill=col('ouro-1'))
    return im


def stamp():
    im = blank(64, 18)
    d = ImageDraw.Draw(im)

    def frame(ox, handle_y, base_y, base_h, squash=False):
        d.rectangle([ox + 6, handle_y, ox + 9, handle_y + 5], fill=col('madeira-4'))
        d.rectangle([ox + 4, handle_y + 5, ox + 11, handle_y + 7], fill=col('madeira-5'))
        d.rectangle([ox + 2, base_y, ox + 13, base_y + base_h - 1], fill=col('carimbo-2'))
        d.rectangle([ox + 2, base_y + base_h - 1, ox + 13, base_y + base_h - 1], fill=col('carimbo-1'))
        if squash:
            d.line([(ox + 1, 17), (ox + 14, 17)], fill=col('carimbo-1'))

    frame(0, 2, 9, 5)      # 0 repouso
    frame(16, 5, 12, 4)    # 1 caindo
    frame(32, 6, 13, 3, squash=True)  # 2 impacto: base achatada, tinta na mesa
    frame(48, 4, 10, 4)    # 3 volta
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    back().save(os.path.join(OUT, 'counter-back.png'))
    front().save(os.path.join(OUT, 'counter-front.png'))
    lamp().save(os.path.join(OUT, 'counter-lamp.png'))
    stamp().save(os.path.join(OUT, 'counter-stamp.png'))
    print('arte do balcão gerada em', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
