"""
Gera a arte pixel das cenas da abertura (Fase 2). Reproduzível: `python3 tools/gen_cutscene_art.py`.

Cada cena tem três camadas de profundidade (far, mid, near) em 368×228 px: a arte de 320×180
mais 24 px de margem em cada lado, para a câmera e o parallax não mostrarem borda vazia.
Usa só cores de src/render/palette.json, sem anti-aliasing.
"""
import json
import os
import random

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'art', 'cutscene')
PAL = {c['id']: c['hex'] for c in json.load(open(os.path.join(ROOT, 'src/render/palette.json')))['colors']}

M = 24
W, H = 320 + 2 * M, 180 + 2 * M


def col(cid, a=255):
    h = PAL[cid]
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def canvas():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))


def P(pts):
    return [(x + M, y + M) for x, y in pts]


def rect(d, x0, y0, x1, y1, c):
    d.rectangle([x0 + M, y0 + M, x1 + M, y1 + M], fill=c)


def poly(d, pts, c):
    d.polygon(P(pts), fill=c)


def sky(d, top='noite-0', bottom='noite-3', bands=6, height=140):
    """Céu em faixas horizontais, do escuro ao horizonte (sem gradiente suave: é pixel art)."""
    ids = [top, 'noite-1', 'noite-2', bottom][:bands]
    step = height / len(ids)
    for i, cid in enumerate(ids):
        rect(d, -M, int(i * step) - M, 320 + M, int((i + 1) * step) - M, col(cid))


def stars(d, seed, n, ymax):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.randrange(4, 316), rnd.randrange(4, ymax)
        d.point((x + M, y + M), fill=col('luz-fria-1' if rnd.random() < 0.5 else 'pergaminho-2'))


def gate(d, cx, base, w, h):
    """Portão em arco: moldura de pedra clara, vão escuro e carimbo vermelho na soleira."""
    x0, x1 = cx - w // 2, cx + w // 2
    top = base - h
    r = w // 2
    rect(d, x0, top + r, x1, base, col('pergaminho-2'))
    d.ellipse([x0 + M, top + M, x1 + M, top + 2 * r + M], fill=col('pergaminho-2'))
    ix0, ix1 = x0 + 6, x1 - 6
    rect(d, ix0, top + r + 2, ix1, base, col('madeira-2'))
    d.ellipse([ix0 + M, top + 8 + M, ix1 + M, top + 8 + 2 * (r - 6) + M], fill=col('madeira-2'))
    rect(d, x0 - 6, base, x1 + 6, base + 4, col('carimbo-2'))


def ground(d, y, cid):
    rect(d, -M, y, 320 + M, 180 + M, col(cid))


# ---------- far: céu e fundo distante ----------

def far_road():
    im = canvas(); d = ImageDraw.Draw(im)
    sky(d); stars(d, 1, 60, 80)
    poly(d, [(0, 118), (60, 96), (110, 110), (160, 98), (220, 106), (280, 92), (320, 104), (320, 180), (0, 180)], col('noite-2'))
    return im


def far_gate():
    im = canvas(); d = ImageDraw.Draw(im)
    sky(d); stars(d, 2, 60, 110)
    poly(d, [(0, 120), (80, 100), (160, 116), (250, 96), (320, 112), (320, 180), (0, 180)], col('noite-2'))
    return im


def far_office():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, -M, 320 + M, 180 + M, col('madeira-1'))
    rect(d, -M, 0, 320 + M, 120, col('madeira-2'))
    return im


def far_mistress():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, -M, 320 + M, 180 + M, col('noite-1'))
    for i in range(0, 320, 16):  # padrão de reboco de parede
        d.line([(i + M, M), (i + M, 180 + M)], fill=col('noite-2'))
    return im


def far_stamp():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, -M, 320 + M, 180 + M, col('madeira-2'))
    return im


# ---------- mid: elementos principais ----------

def mid_road():
    im = canvas(); d = ImageDraw.Draw(im)
    poly(d, [(0, 136), (70, 120), (120, 130), (170, 118), (230, 104), (280, 116), (320, 108), (320, 180), (0, 180)], col('noite-0'))
    poly(d, [(120, 180), (230, 180), (176, 108), (168, 108)], col('madeira-3'))
    poly(d, [(150, 180), (200, 180), (172, 112), (170, 112)], col('madeira-4'))
    gate(d, 172, 118, 28, 44)
    return im


def mid_gate():
    im = canvas(); d = ImageDraw.Draw(im)
    poly(d, [(0, 140), (320, 130), (320, 180), (0, 180)], col('noite-0'))
    gate(d, 160, 150, 84, 120)
    return im


def mid_office():
    im = canvas(); d = ImageDraw.Draw(im)
    # janela com a noite lá fora
    rect(d, 36, 20, 96, 84, col('mare-0'))
    rect(d, 36, 20, 96, 22, col('madeira-4'))
    for x in range(40, 96, 14):
        d.point((x + M, 40 + M), fill=col('luz-fria-1'))
    # estantes de regulamento
    for sx in range(190, 320, 12):
        rect(d, sx, 40, sx + 9, 92, col('pergaminho-1' if (sx // 12) % 2 else 'madeira-4'))
    # mesa
    rect(d, 0, 118, 320, 130, col('madeira-7'))
    rect(d, 0, 130, 320, 180, col('madeira-3'))
    # carimbos e pilha de papéis
    rect(d, 120, 104, 150, 118, col('pergaminho-1'))
    rect(d, 124, 98, 134, 104, col('carimbo-2'))
    rect(d, 152, 108, 182, 118, col('pergaminho-0'))
    rect(d, 216, 106, 262, 118, col('pergaminho-1'))
    rect(d, 230, 98, 250, 106, col('carimbo-3'))
    # vela
    rect(d, 60, 104, 64, 118, col('pergaminho-2'))
    rect(d, 60, 102, 64, 103, col('ouro-4'))
    return im


def mid_mistress():
    im = canvas(); d = ImageDraw.Draw(im)
    # ombros e capuz da Mestra
    poly(d, [(40, 180), (60, 132), (110, 110), (160, 104), (210, 110), (260, 132), (280, 180)], col('noite-0'))
    poly(d, [(92, 180), (106, 130), (160, 98), (214, 130), (228, 180)], col('madeira-1'))
    # rosto e pescoço
    rect(d, 146, 112, 174, 130, col('pele-0'))
    poly(d, [(132, 92), (160, 62), (188, 92), (184, 120), (136, 120)], col('noite-0'))
    poly(d, [(140, 96), (160, 78), (180, 96), (176, 116), (144, 116)], col('pele-0'))
    rect(d, 150, 98, 152, 99, col('ouro-2'))
    rect(d, 168, 98, 170, 99, col('ouro-2'))
    # vela à esquerda
    rect(d, 50, 118, 54, 150, col('pergaminho-2'))
    rect(d, 50, 116, 54, 117, col('ouro-4'))
    return im


def mid_stamp():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, 100, 320 + M, 180 + M, col('madeira-7'))
    rect(d, -M, 100, 320 + M, 104, col('madeira-6'))
    # folha de pergaminho sob o carimbo
    rect(d, 80, 110, 240, 170, col('pergaminho-1'))
    for y in range(118, 168, 8):
        rect(d, 92, y, 228, y, col('pergaminho-0'))
    # almofada de tinta
    rect(d, 246, 124, 280, 138, col('carimbo-1'))
    return im


# ---------- near: primeiro plano ----------

def near_road():
    im = canvas(); d = ImageDraw.Draw(im)
    poly(d, [(-M, 170), (0, 150), (40, 160), (60, 180), (-M, 180)], col('noite-0'))
    poly(d, [(320, 160), (296, 150), (280, 168), (270, 180), (320, 180)], col('noite-0'))
    return im


def near_gate():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, 168, 320 + M, 180 + M, col('noite-0'))
    return im


def near_office():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, 170, 320 + M, 180 + M, col('madeira-1'))
    return im


def near_mistress():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, 170, 320 + M, 180 + M, col('noite-0'))
    return im


def near_stamp():
    im = canvas(); d = ImageDraw.Draw(im)
    rect(d, -M, 176, 320 + M, 180 + M, col('madeira-2'))
    return im


# ---------- efeitos com alfa ----------

def fx_mist():
    """Faixa de névoa com borda pontilhada (alfa 0 ou 255, sem meio-tom)."""
    w, h = 160, 24
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y in range(h):
        for x in range(w):
            dx = (x - w / 2) / (w / 2)
            dy = (y - h / 2) / (h / 2)
            inside = dx * dx + dy * dy < 1
            if inside and ((x + y) % 2 == 0 or dx * dx + dy * dy < 0.5):
                d.point((x, y), fill=col('nevoa-1'))
    return im


def fx_stamp():
    """Carimbo visto de frente: alça de madeira e base vermelha."""
    im = Image.new('RGBA', (32, 36), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([12, 0, 19, 12], fill=col('madeira-4'))
    d.rectangle([8, 12, 23, 16], fill=col('madeira-5'))
    d.rectangle([4, 16, 27, 34], fill=col('carimbo-2'))
    d.rectangle([4, 32, 27, 34], fill=col('carimbo-1'))
    return im


LAYERS = {
    'road': (far_road, mid_road, near_road),
    'gate': (far_gate, mid_gate, near_gate),
    'office': (far_office, mid_office, near_office),
    'mistress': (far_mistress, mid_mistress, near_mistress),
    'stamp': (far_stamp, mid_stamp, near_stamp),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for scene, fns in LAYERS.items():
        for depth, fn in zip(('far', 'mid', 'near'), fns):
            fn().save(os.path.join(OUT, f'{scene}-{depth}.png'))
    fx_mist().save(os.path.join(OUT, 'fx-mist.png'))
    fx_stamp().save(os.path.join(OUT, 'fx-stamp.png'))
    print('arte gerada em', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
