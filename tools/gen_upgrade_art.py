"""
Arte animada da oficina de melhorias (Fase 11). Reproduzível: `python3 tools/gen_upgrade_art.py`.
Cada arquivo é uma folha horizontal: N quadros lado a lado, todos do mesmo tamanho.
- upg-carimbo / upg-ampulheta / upg-seguro / upg-cofre / upg-balcao .png : 24×24, 4 quadros
- icon-moeda-spin.png : 16×16, 6 quadros (moeda girando)
- fx-burst.png        : 32×32, 6 quadros (faísca ao comprar)
- shop-banner.png     : 160×48, 4 quadros (prateleira da oficina com vela, estrelas e poeira)
Só cores de src/render/palette.json, sem anti-aliasing (o script confere no final).
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'art', 'ui')
PAL = {c['id']: c['hex'] for c in json.load(open(os.path.join(ROOT, 'src/render/palette.json')))['colors']}
ALLOWED = {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in PAL.values()}


def col(cid, a=255):
    h = PAL[cid]
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def sheet(frames):
    w, h = frames[0].size
    out = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.paste(f, (i * w, 0))
    return out


def new(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def px(d, pts, color):
    for x, y in pts:
        d.point((x, y), fill=col(color))


def rect(d, x0, y0, x1, y1, color):
    d.rectangle([x0, y0, x1, y1], fill=col(color))


# ---------------------------------------------------------------- ícones 24×24

def carimbo(f):
    """Carimbo de prata: sobe, desce, bate na almofada e solta uma faísca."""
    im, d = new(24, 24)
    dy = [0, -3, 2, 0][f]
    # almofada de tinta
    rect(d, 3, 19, 20, 22, 'madeira-1')
    rect(d, 4, 18, 19, 20, 'carimbo-1')
    rect(d, 5, 18, 18, 18, 'carimbo-2')
    if f == 2:
        rect(d, 6, 19, 17, 19, 'carimbo-3')
    # cabo de madeira
    y = 2 + dy
    rect(d, 10, y, 13, y + 3, 'madeira-4')
    rect(d, 9, y + 1, 14, y + 2, 'madeira-4')
    px(d, [(10, y + 1), (10, y + 2)], 'madeira-7')
    rect(d, 11, y + 4, 12, y + 8, 'madeira-5')
    px(d, [(11, y + 4), (11, y + 6)], 'madeira-6')
    # corpo de prata
    rect(d, 6, y + 9, 17, y + 12, 'luz-fria-0')
    rect(d, 6, y + 9, 17, y + 9, 'luz-fria-2')
    rect(d, 6, y + 12, 17, y + 12, 'ouro-0')
    px(d, [(7, y + 10), (8, y + 10)], 'pergaminho-2')
    # base
    rect(d, 5, y + 13, 18, y + 14, 'ouro-2')
    rect(d, 5, y + 14, 18, y + 14, 'ouro-1')
    if f == 3:
        px(d, [(3, 14), (20, 15), (12, 12), (4, 18)], 'ouro-4')
        px(d, [(2, 14), (4, 14), (3, 13), (3, 15)], 'ouro-3')
    return im


def ampulheta(f):
    """Ampulheta: a areia desce, o fio cai."""
    im, d = new(24, 24)
    # tampas e laterais
    rect(d, 4, 1, 19, 3, 'madeira-4')
    rect(d, 4, 20, 19, 22, 'madeira-4')
    rect(d, 4, 1, 19, 1, 'madeira-6')
    rect(d, 4, 20, 19, 20, 'madeira-6')
    px(d, [(5, 4), (18, 4), (5, 19), (18, 19)], 'madeira-3')
    # vidro (dois triângulos)
    d.polygon([(6, 4), (17, 4), (12, 11)], fill=col('mare-4'))
    d.polygon([(12, 12), (6, 19), (17, 19)], fill=col('mare-4'))
    d.line([(6, 4), (12, 11)], fill=col('luz-fria-0'))
    d.line([(17, 4), (11, 11)], fill=col('luz-fria-0'))
    d.line([(6, 19), (11, 12)], fill=col('luz-fria-0'))
    d.line([(17, 19), (12, 12)], fill=col('luz-fria-0'))
    # areia
    top = [6, 5, 3, 2][f]      # linhas de areia em cima
    bot = [1, 2, 4, 5][f]      # monte embaixo
    for i in range(top):
        yy = 10 - i
        half = max(0, 5 - (10 - yy) // 1 - 0)
        half = max(1, 5 - (10 - yy) - 0)
        rect(d, 12 - half, yy, 11 + half, yy, 'ouro-3' if i % 2 == 0 else 'ouro-2')
    for i in range(bot):
        yy = 18 - i
        half = max(1, 5 - i)
        rect(d, 12 - half, yy, 11 + half, yy, 'ouro-2' if i % 2 == 0 else 'ouro-3')
    # fio de areia
    rect(d, 11, 11, 12, 12, 'ouro-3')
    for k in range(3):
        yy = 13 + ((f + k * 2) % 5)
        if yy < 18 - bot + 1:
            px(d, [(11, yy)], 'ouro-4')
    return im


def seguro(f):
    """Escudo com um brilho que atravessa a face."""
    im, d = new(24, 24)
    outline = [(4, 2), (19, 2), (19, 11), (17, 16), (12, 22), (7, 16), (4, 11)]
    d.polygon(outline, fill=col('ouro-0'))
    inner = [(5, 3), (18, 3), (18, 11), (16, 15), (12, 20), (8, 15), (5, 11)]
    d.polygon(inner, fill=col('mare-1'))
    d.polygon([(6, 4), (11, 4), (11, 18), (8, 14), (6, 11)], fill=col('mare-2'))
    # moldura dourada interna
    d.line([(5, 3), (18, 3)], fill=col('ouro-2'))
    d.line([(5, 3), (5, 11)], fill=col('ouro-2'))
    d.line([(18, 3), (18, 11)], fill=col('ouro-1'))
    # emblema: portãozinho
    rect(d, 9, 8, 14, 14, 'pergaminho-2')
    rect(d, 10, 10, 13, 14, 'madeira-2')
    px(d, [(10, 9), (13, 9)], 'madeira-2')
    px(d, [(11, 12), (12, 12)], 'ouro-4')
    # brilho em diagonal
    sx = [4, 8, 12, 17][f]
    for i in range(10):
        x, y = sx + i // 2, 3 + i
        if 5 <= x <= 17 and y <= 18:
            px(d, [(x, y)], 'mare-4')
            if x + 1 <= 17:
                px(d, [(x + 1, y)], 'luz-fria-1')
    return im


def cofre(f):
    """Despensa: vela acesa sobre pilha de pergaminhos, chama tremendo."""
    im, d = new(24, 24)
    # pilha de pergaminhos
    rect(d, 3, 17, 20, 21, 'pergaminho-0')
    rect(d, 3, 17, 20, 17, 'pergaminho-2')
    rect(d, 3, 19, 20, 19, 'pedra-1')
    rect(d, 3, 21, 20, 21, 'pedra-0')
    rect(d, 5, 14, 18, 16, 'pergaminho-1')
    rect(d, 5, 16, 18, 16, 'pedra-1')
    # fita de lacre
    rect(d, 15, 14, 16, 21, 'carimbo-2')
    # vela
    rect(d, 9, 8, 12, 13, 'pergaminho-2')
    rect(d, 12, 8, 12, 13, 'pergaminho-0')
    rect(d, 8, 13, 13, 13, 'ouro-1')
    px(d, [(10, 9), (10, 10)], 'pedra-1')
    # pavio
    px(d, [(10, 7)], 'madeira-0')
    # chama: 4 quadros
    shapes = [
        [(10, 6), (10, 5), (10, 4), (9, 5), (11, 5), (10, 3)],
        [(10, 6), (10, 5), (11, 4), (9, 5), (11, 5), (11, 3)],
        [(10, 6), (10, 5), (10, 4), (9, 5), (11, 5), (10, 2)],
        [(10, 6), (10, 5), (9, 4), (9, 5), (11, 5), (9, 3)],
    ]
    px(d, shapes[f], 'ouro-3')
    px(d, [(10, 5), (10, 6)], 'ouro-4')
    px(d, [(10, 6)], 'pergaminho-2')
    # halo
    for p in [(7, 5), (13, 5), (8, 3), (12, 3)]:
        if (p[0] + f) % 2 == 0:
            px(d, [p], 'ouro-0')
    return im


def balcao(f):
    """Fila ordenada: dois pilares e uma corda que balança."""
    im, d = new(24, 24)
    sag = [0, 1, 2, 1][f]
    for x in (3, 18):
        rect(d, x, 6, x + 2, 20, 'madeira-4')
        rect(d, x, 6, x, 20, 'madeira-6')
        rect(d, x - 1, 4, x + 3, 6, 'ouro-2')
        rect(d, x - 1, 4, x + 3, 4, 'ouro-3')
        rect(d, x - 1, 20, x + 3, 22, 'madeira-1')
        px(d, [(x + 1, 3)], 'ouro-4')
    # corda carmim em catenária simples
    pts = []
    for i, x in enumerate(range(6, 19)):
        t = (x - 12) / 6.0
        y = 8 + sag + int(round(3 * (1 - t * t)))
        pts.append((x, y))
    for x, y in pts:
        d.point((x, y), fill=col('carimbo-2'))
        d.point((x, y + 1), fill=col('carimbo-1'))
    # viajantinho esperando atrás da corda
    rect(d, 10, 16, 13, 21, 'noite-5')
    rect(d, 10, 13, 13, 15, 'pele-0')
    px(d, [(11, 14)], 'madeira-2')
    rect(d, 10, 12, 13, 12, 'madeira-4')
    return im


ICONS = {'carimbo': carimbo, 'ampulheta': ampulheta, 'seguro': seguro, 'cofre': cofre, 'balcao': balcao}


# ---------------------------------------------------------------- moeda e faísca

def coin_spin(f):
    """Moeda girando em 6 quadros (largura da elipse varia)."""
    im, d = new(16, 16)
    half = [6, 4, 2, 1, 2, 4][f]
    cx = 8
    d.ellipse([cx - half - 1, 1, cx + half, 14], fill=col('ouro-0'))
    d.ellipse([cx - half, 2, cx + half - 1, 13], fill=col('ouro-2'))
    if half >= 4:
        d.ellipse([cx - half + 1, 3, cx + half - 2, 12], outline=col('ouro-1'))
        rect(d, 7, 5, 8, 10, 'ouro-1')
    if half >= 2:
        px(d, [(cx - half + 1, 4)], 'ouro-4')
    if f in (0, 5):
        px(d, [(4, 3), (5, 2)], 'ouro-4')
    return im


def burst(f):
    """Faísca de compra: oito pontas que se afastam e somem."""
    im, d = new(32, 32)
    r = [2, 5, 8, 11, 13, 14][f]
    c = 16
    cols = ['ouro-4', 'ouro-4', 'ouro-3', 'ouro-2', 'ouro-1', 'ouro-0'][f]
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        px(d, [(c + dx * r, c + dy * r)], cols)
        if f < 4:
            px(d, [(c + dx * (r - 1), c + dy * (r - 1))], 'ouro-3')
    dg = int(r * 0.7)
    for dx, dy in [(1, 1), (-1, 1), (1, -1), (-1, -1)]:
        px(d, [(c + dx * dg, c + dy * dg)], 'ouro-3' if f < 4 else 'ouro-1')
        if f < 3:
            px(d, [(c + dx * dg, c + dy * dg - dy)], 'ouro-4')
    if f < 3:
        px(d, [(c, c), (c + 1, c), (c, c + 1), (c - 1, c), (c, c - 1)], 'ouro-4')
    return im


# ---------------------------------------------------------------- banner da oficina

def banner(f):
    """Prateleira da oficina à noite: janela com estrelas, vela, ampulheta, livros e moedas."""
    W, H = 160, 48
    im, d = new(W, H)
    # parede em faixas
    for y in range(H):
        cid = 'noite-1' if y < 12 else 'noite-3' if y < 26 else 'noite-4'
        rect(d, 0, y, W - 1, y, cid)
    # janela arqueada à direita
    d.rectangle([112, 4, 144, 34], fill=col('madeira-1'))
    d.rectangle([114, 6, 142, 34], fill=col('noite-0'))
    d.pieslice([114, 2, 142, 20], 180, 360, fill=col('noite-0'))
    rect(d, 127, 6, 128, 34, 'madeira-1')
    rect(d, 114, 18, 142, 19, 'madeira-1')
    stars = [(118, 9), (135, 8), (123, 14), (138, 15), (120, 26), (133, 24), (140, 30)]
    for i, p in enumerate(stars):
        tw = (i + f) % 4
        px(d, [p], 'ouro-4' if tw == 0 else 'luz-fria-1' if tw == 1 else 'luz-fria-0')
    # neblina na janela
    for i in range(4):
        x = (114 + (f * 3 + i * 9)) % 28 + 114
        px(d, [(x, 31), (x + 1, 31), (x + 2, 32)], 'nevoa-1')
    # prateleira de madeira
    rect(d, 0, 36, W - 1, 39, 'madeira-3')
    rect(d, 0, 36, W - 1, 36, 'madeira-6')
    rect(d, 0, 40, W - 1, 47, 'madeira-1')
    for x in range(0, W, 16):
        rect(d, x, 40, x, 47, 'madeira-0')
    # livros
    for i, (x, h, c) in enumerate([(8, 14, 'carimbo-1'), (13, 17, 'mare-1'), (18, 12, 'verde-0'), (23, 15, 'ouro-0')]):
        rect(d, x, 36 - h, x + 3, 35, c)
        rect(d, x, 36 - h, x, 35, 'noite-5')
        rect(d, x + 1, 36 - h + 3, x + 2, 36 - h + 3, 'ouro-3')
    # ampulheta pequena
    rect(d, 36, 22, 45, 23, 'madeira-4')
    rect(d, 36, 34, 45, 35, 'madeira-4')
    d.polygon([(37, 24), (44, 24), (40, 29)], fill=col('mare-4'))
    d.polygon([(40, 30), (37, 33), (44, 33)], fill=col('mare-4'))
    rect(d, 39, 26, 42, 27, 'ouro-3')
    rect(d, 38, 32, 43, 33, 'ouro-2')
    px(d, [(40, 29 + (f % 3)), (41, 29 + (f % 3))], 'ouro-4')
    # pilha de moedas
    for i in range(4):
        rect(d, 62, 33 - i * 2, 71, 34 - i * 2, 'ouro-2')
        rect(d, 62, 34 - i * 2, 71, 34 - i * 2, 'ouro-0')
    px(d, [(64, 27), (65, 27)], 'ouro-4')
    if f == 1:
        px(d, [(66, 25), (65, 26), (67, 26), (66, 27)], 'ouro-4')
    # vela com chama animada
    rect(d, 84, 24, 89, 35, 'pergaminho-2')
    rect(d, 89, 24, 89, 35, 'pergaminho-0')
    rect(d, 82, 35, 91, 35, 'ouro-1')
    px(d, [(86, 23)], 'madeira-0')
    flame = [
        [(86, 22), (86, 21), (86, 20), (85, 21), (87, 21)],
        [(86, 22), (86, 21), (87, 20), (85, 21), (87, 21)],
        [(86, 22), (86, 21), (86, 19), (86, 20), (85, 21), (87, 21)],
        [(86, 22), (86, 21), (85, 20), (85, 21), (87, 21)],
    ][f]
    px(d, flame, 'ouro-3')
    px(d, [(86, 21), (86, 22)], 'ouro-4')
    for p in [(82, 20), (90, 20), (83, 17), (89, 17)]:
        if (p[0] + f) % 2 == 0:
            px(d, [p], 'ouro-0')
    # pergaminho enrolado e tinteiro
    rect(d, 98, 30, 108, 35, 'pergaminho-0')
    rect(d, 98, 30, 108, 30, 'pergaminho-2')
    rect(d, 98, 35, 108, 35, 'pedra-1')
    rect(d, 150, 28, 154, 35, 'noite-0')
    rect(d, 151, 25, 153, 28, 'madeira-5')
    px(d, [(152, 24), (153, 22), (154, 21)], 'pergaminho-2')
    # poeira flutuando na luz da vela
    for i in range(3):
        x = 78 + ((f * 2 + i * 7) % 20)
        y = 28 - ((f * 2 + i * 5) % 14)
        px(d, [(x, y)], 'ouro-3' if i % 2 == 0 else 'ouro-1')
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {}
    for name, fn in ICONS.items():
        files[f'upg-{name}.png'] = sheet([fn(i) for i in range(4)])
    files['icon-moeda-spin.png'] = sheet([coin_spin(i) for i in range(6)])
    files['fx-burst.png'] = sheet([burst(i) for i in range(6)])
    files['shop-banner.png'] = sheet([banner(i) for i in range(4)])
    for fname, im in files.items():
        # confere paleta e ausência de meio-tom
        for r, g, b, a in set(im.getdata()):
            assert a in (0, 255), f'{fname}: alfa parcial'
            if a:
                assert (r, g, b) in ALLOWED, f'{fname}: cor fora da paleta {(r, g, b)}'
        im.save(os.path.join(OUT, fname))
    print('gerados:', ', '.join(sorted(files)))


if __name__ == '__main__':
    main()
