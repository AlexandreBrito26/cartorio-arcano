"""
Gera os sprites base das 9 espécies (Fase 3). Reproduzível: `python3 tools/gen_characters.py`.

Cada espécie vira uma folha horizontal de camadas 64×72 px, com um atlas JSON para o loadAtlas:
- camadas de cor variável (cloak, skin, hair0/1/2, beard, eyes, eyelid, wings): máscaras BRANCAS,
  que o Pixi colore com `tint` a partir do `look`. Branco × tint = a cor exata do look.
- camadas fixas (details, outline): cores da paleta, sem tint.
Os olhos ficam em branco também, para o tint escolher a cor dos olhos.
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'art', 'personagens')
PAL = {c['id']: c['hex'] for c in json.load(open(os.path.join(ROOT, 'src/render/palette.json')))['colors']}

W, H = 64, 72
WHITE = (255, 255, 255, 255)
LAYERS = [
    'cloak', 'skin', 'hair0', 'hair1', 'hair2', 'beard', 'eyes', 'eyelid', 'wings', 'details', 'outline',
    # Fase 12 (sempre depois do contorno: o Portrait de reserva assume o contorno no índice 10).
    'eyewhite',  # brancos dos olhos, pupila e brilho (cores fixas), por cima da íris tingida
    'shade',     # sombras e luzes do rosto e da capa (cores fixas com alfa); desenhada ANTES do cabelo
    'armL', 'armR',    # mangas (máscara da capa)
    'handL', 'handR',  # mãos (máscara da pele)
    'lineL', 'lineR',  # contorno, juntas e garras de cada braço (cores fixas)
]
OUTLINE_INDEX = LAYERS.index('outline')

SLUG = {
    'Humano': 'humano', 'Elfo': 'elfo', 'Anão': 'anao', 'Goblin': 'goblin', 'Fada': 'fada',
    'Draconato': 'draconato', 'Tritão': 'tritao', 'Golem': 'golem', 'Espectro': 'espectro',
}


def hexrgba(h, a=255):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def blank():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))


def head_ellipse(d, fill):
    d.ellipse([19, 12, 45, 44], fill=fill)


def body(d, fill, golem=False):
    if golem:
        d.rectangle([14, 46, 50, 71], fill=fill)
    else:
        d.polygon([(8, 71), (12, 54), (22, 46), (32, 44), (42, 46), (52, 54), (56, 71)], fill=fill)


def cap(d):
    """Cabelo curto: topo da cabeça até a linha da testa."""
    d.ellipse([18, 9, 46, 32], fill=WHITE)
    d.rectangle([0, 22, W, H], fill=(0, 0, 0, 0))



# ---------------------------------------------------------------- mãos (Fase 12)
# Mão esquerda, dedos para a direita, vista pelo dorso. A direita é o espelho.
# Códigos: S pele (tingida) | d junta/sombra | h luz | c garra | w membrana | g rachadura
#          r anel | s brilho | k fiapo de névoa
def make_hand(lengths=(11, 12, 10), claws=False, web=False, ring=False, scales=False, stone=False,
              wisps=False, sparkle=False, palm=6):
    """Polegar em cima e três dedos de 2 px, separados por uma linha vazia (o contorno a preenche)."""
    width = max(lengths) + (3 if claws or wisps else 1)
    rows = [['.'] * width for _ in range(11)]

    def put(x, y, ch):
        if 0 <= x < width:
            rows[y][x] = ch

    for x in range(2, 6):
        put(x, 1, 'S')
    for x in range(1, 8):
        put(x, 2, 'S')
    put(3, 2, 'h')
    for y in range(3, 11):                       # palma
        for x in range(0 if y < 10 else 1, palm):
            put(x, y, 'S')
    for (y0, ln) in zip((3, 6, 9), lengths):     # dedos
        for y in (y0, y0 + 1):
            if y > 10:
                continue
            for x in range(palm, ln):
                put(x, y, 'S')
    if web or stone:                             # entre os dedos
        for y in (5, 8):
            for x in range(palm, min(lengths) - 1):
                put(x, y, 'w' if web else 'S')
    if stone:
        for y in (5, 8):
            put(palm + 1, y, 'd')
    if scales:
        for x, y in ((1, 4), (3, 4), (2, 7), (4, 7), (6, 4), (7, 7), (8, 4)):
            put(x, y, 'd')
    if ring:
        for y in (3, 4):
            put(palm, y, 'r')
    if claws:
        for y0, ln in zip((3, 6, 9), lengths):
            for x in range(ln, ln + 2):
                put(x, y0, 'c')
    if wisps:
        for y0, ln in zip((3, 6, 9), lengths):
            put(ln - 1, y0, 'k')
            put(ln, y0, 'k')
            put(ln + 1, y0 + 1, 'k')
        for x in range(1, 6):
            put(x, 10, 'k')
    if stone:
        put(2, 4, 'g'); put(3, 5, 'g'); put(4, 8, 'g')
    if sparkle:
        put(width - 1, 0, 's'); put(0, 0, 's')
    put(1, 3, 'h')
    return [''.join(r) for r in rows]


HAND = make_hand()
HAND_ELFO = make_hand(lengths=(13, 14, 12))
HAND_ANAO = make_hand(lengths=(10, 11, 9), ring=True)
HAND_GOBLIN = make_hand(lengths=(11, 12, 10), claws=True)
HAND_DRACO = make_hand(lengths=(11, 12, 10), claws=True, scales=True)
HAND_TRITAO = make_hand(lengths=(11, 12, 10), web=True)
HAND_FADA = make_hand(lengths=(8, 9, 7), palm=4, sparkle=True)
HAND_GOLEM = make_hand(lengths=(11, 12, 11), stone=True, palm=7)
HAND_ESPECTRO = make_hand(lengths=(10, 11, 9), wisps=True)

HAND_BY_SPECIES = {
    'Humano': HAND, 'Elfo': HAND_ELFO, 'Anão': HAND_ANAO, 'Goblin': HAND_GOBLIN, 'Fada': HAND_FADA,
    'Draconato': HAND_DRACO, 'Tritão': HAND_TRITAO, 'Golem': HAND_GOLEM, 'Espectro': HAND_ESPECTRO,
}

CLAW_COLOR = {'Goblin': 'pergaminho-2', 'Draconato': 'pergaminho-0'}

# Posição (canto superior esquerdo) da mão esquerda; a direita espelha em torno do eixo x = 32.
HAND_ORIGIN = (15, 57)


def code_color(code, sp):
    return {
        'd': hexrgba(PAL['noite-0'], 95),
        'h': hexrgba(PAL['pergaminho-2'], 80),
        'c': hexrgba(PAL[CLAW_COLOR.get(sp, 'pergaminho-0')]),
        'w': hexrgba(PAL['mare-2']),
        'g': hexrgba(PAL['ouro-2']),
        'r': hexrgba(PAL['ouro-2']),
        's': hexrgba(PAL['ouro-4']),
        'k': hexrgba(PAL['nevoa-2'], 130),
    }[code]


def dark_outline(masks):
    """Contorno de 1 px, em noite-0, em volta da união das máscaras (imagens RGBA)."""
    union = Image.new('L', (W, H), 0)
    for m in masks:
        union.paste(255, mask=m.split()[3])
    out = blank()
    u, o = union.load(), out.load()
    dark = hexrgba(PAL['noite-0'])
    for y in range(H):
        for x in range(W):
            if u[x, y] == 0 and any(
                0 <= x + dx < W and 0 <= y + dy < H and u[x + dx, y + dy] > 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                o[x, y] = dark
    return out


def build_arm(sp, side):
    """Devolve (manga, mão, linha) de um lado. `side` é 'L' ou 'R'."""
    mirror = side == 'R'
    sleeve, hand, line = blank(), blank(), blank()
    ds, dh, dl = ImageDraw.Draw(sleeve), hand.load(), line.load()

    ox, oy = HAND_ORIGIN
    art = HAND_BY_SPECIES[sp]
    aw = len(art[0])
    # manga: do ombro até o punho, na capa
    left = [(10, 57), (14, 49), (23, 51), (ox + 2, oy + 1), (ox + 2, oy + 9), (ox - 3, oy + 9), (9, 66)]
    if mirror:
        left = [(W - 1 - x, y) for x, y in left]
    ds.polygon(left, fill=WHITE)

    claw_px = []
    extras = []
    for ry, row in enumerate(art):
        for rx, ch in enumerate(row):
            if ch == '.':
                continue
            x = ox + rx
            y = oy + ry
            if mirror:
                x = W - 1 - x
            if ch == 'S':
                dh[x, y] = WHITE
            else:
                extras.append((x, y, ch))
                if ch in 'cw':
                    claw_px.append((x, y))

    # contorno: manga + mão + garras/membrana
    claw = blank()
    cp = claw.load()
    for x, y in claw_px:
        cp[x, y] = WHITE
    ol = dark_outline([sleeve, hand, claw])
    lp = ol.load()
    for y in range(H):
        for x in range(W):
            if lp[x, y][3]:
                dl[x, y] = lp[x, y]

    # sombra na parte de baixo da manga e dobras (cores fixas com alfa)
    sh = ImageDraw.Draw(line)
    sx = (lambda x: W - 1 - x) if mirror else (lambda x: x)
    for y in range(58, 66):
        for x in range(11, ox + 2):
            if sleeve.getpixel((sx(x), y))[3] and (y + x) % 2 == 0:
                dl[sx(x), y] = hexrgba(PAL['noite-0'], 80)
    # punho: fita dourada entre a manga e a mão
    for y in range(oy + 2, oy + 10):
        if hand.getpixel((sx(ox), y))[3]:
            dl[sx(ox), y] = hexrgba(PAL['ouro-0'])
    sh.line([(sx(14), 52), (sx(18), 61)], fill=hexrgba(PAL['noite-0'], 70))   # dobra no cotovelo
    sh.line([(sx(20), 51), (sx(22), 57)], fill=hexrgba(PAL['pergaminho-2'], 45))  # luz no ombro

    for x, y, ch in extras:
        line.putpixel((x, y), code_color(ch, sp))
    return sleeve, hand, line


def build_shade(layers, sp):
    """Sombras e luzes (cores fixas com alfa) restritas às máscaras de capa e pele."""
    out = blank()
    cloak_a, skin_a = layers['cloak'].split()[3], layers['skin'].split()[3]
    golem, espectro = sp == 'Golem', sp == 'Espectro'

    def paint(mask_img, region, color_id, alpha):
        zone = Image.new('L', (W, H), 0)
        ImageDraw.Draw(zone).__getattribute__(region[0])(*region[1:], fill=255)
        m = Image.new('L', (W, H), 0)
        m.paste(zone, mask=mask_img)
        out.paste(Image.new('RGBA', (W, H), hexrgba(PAL[color_id], alpha)), mask=m)

    # capa: lado direito mais escuro, luz no ombro esquerdo, gola em V
    paint(cloak_a, ('polygon', [(38, 44), (64, 44), (64, 72), (46, 72)]), 'noite-0', 60)
    paint(cloak_a, ('polygon', [(0, 50), (20, 46), (16, 60), (0, 72)]), 'pergaminho-2', 34)
    paint(cloak_a, ('polygon', [(26, 44), (38, 44), (32, 54)]), 'noite-0', 100)
    paint(cloak_a, ('polygon', [(27, 44), (37, 44), (32, 51)]), 'noite-0', 60)
    # pescoço sob o queixo
    paint(skin_a, ('rectangle', [26, 44, 38, 48]), 'noite-0', 95)
    # rosto: terço direito na sombra, luz na testa e no nariz
    paint(skin_a, ('polygon', [(42, 18), (46, 18), (46, 40), (41, 43)]), 'noite-0', 28)
    paint(skin_a, ('rectangle', [24, 15, 30, 16]), 'pergaminho-2', 55)
    if not golem and not espectro:
        paint(skin_a, ('rectangle', [22, 32, 25, 34]), 'carimbo-3', 70)  # bochechas
        paint(skin_a, ('rectangle', [39, 32, 42, 34]), 'carimbo-3', 70)
        paint(skin_a, ('rectangle', [31, 31, 32, 34]), 'madeira-4', 110)  # nariz
        paint(skin_a, ('rectangle', [31, 31, 31, 31]), 'pergaminho-2', 70)
    if golem:
        for x, y in ((22, 18), (40, 20), (26, 40), (36, 16), (44, 34), (20, 34), (30, 56), (40, 62), (22, 64)):
            paint(cloak_a if y > 46 else skin_a, ('rectangle', [x, y, x + 1, y + 1]), 'noite-0', 70)
    return out


def build_eyewhite(sp):
    """Brancos laterais, pupila e brilho; o centro 3×3 fica livre para a íris tingida aparecer."""
    im = blank()
    d = im.load()
    if sp == 'Espectro':
        for x in (25, 36):
            d[x + 1, 28] = hexrgba(PAL['nevoa-2'])  # só um ponto de luz
        return im
    white = hexrgba(PAL['pergaminho-2'])
    pupil = hexrgba(PAL['noite-0'])
    for x in (25, 36):
        for y in (27, 28, 29):
            d[x - 1, y] = white
            d[x + 3, y] = white
        d[x + 1, 28] = pupil
        d[x, 27] = white  # brilho no canto da íris
    return im


def add_face_details(details, sp):
    """Sobrancelhas, em cor fixa. O piscar não as cobre (a pálpebra começa na linha 26)."""
    brow = hexrgba(PAL['madeira-2'])
    if sp == 'Golem':
        details.line([(23, 25), (29, 25)], fill=hexrgba(PAL['noite-0']), width=1)
        details.line([(34, 25), (40, 25)], fill=hexrgba(PAL['noite-0']), width=1)
    elif sp != 'Espectro':
        details.line([(24, 25), (28, 24)], fill=brow)
        details.line([(35, 24), (39, 25)], fill=brow)


def draw_species(sp):
    layers = {k: blank() for k in LAYERS}
    details = ImageDraw.Draw(layers['details'])
    wings = ImageDraw.Draw(layers['wings'])
    cloak = ImageDraw.Draw(layers['cloak'])
    skin = ImageDraw.Draw(layers['skin'])
    h0 = ImageDraw.Draw(layers['hair0'])
    h1 = ImageDraw.Draw(layers['hair1'])
    h2 = ImageDraw.Draw(layers['hair2'])
    beard = ImageDraw.Draw(layers['beard'])
    eyes = ImageDraw.Draw(layers['eyes'])
    lid = ImageDraw.Draw(layers['eyelid'])

    golem = sp == 'Golem'
    espectro = sp == 'Espectro'

    body(cloak, WHITE, golem=golem)
    skin.rectangle([27, 40, 37, 48], fill=WHITE)  # pescoço
    if golem:
        skin.rectangle([18, 12, 46, 46], fill=WHITE)
    else:
        head_ellipse(skin, WHITE)

    # Orelhas e acessórios por espécie (máscara de pele, cor do tint).
    if sp == 'Elfo':
        skin.polygon([(19, 26), (6, 18), (20, 34)], fill=WHITE)
        skin.polygon([(45, 26), (58, 18), (44, 34)], fill=WHITE)
    elif sp == 'Goblin':
        skin.polygon([(19, 26), (0, 14), (4, 32), (20, 36)], fill=WHITE)
        skin.polygon([(45, 26), (64, 14), (60, 32), (44, 36)], fill=WHITE)
    elif sp == 'Fada':
        skin.polygon([(19, 28), (10, 22), (20, 34)], fill=WHITE)
        skin.polygon([(45, 28), (54, 22), (44, 34)], fill=WHITE)
        wings.ellipse([0, 22, 15, 52], fill=hexrgba(PAL['luz-fria-1'], 150))
        wings.ellipse([49, 22, 64, 52], fill=hexrgba(PAL['luz-fria-1'], 150))
    elif sp == 'Golem':
        skin.rectangle([12, 26, 18, 44], fill=WHITE)
        skin.rectangle([46, 26, 52, 44], fill=WHITE)
    elif sp == 'Tritão':
        skin.rectangle([14, 28, 19, 40], fill=WHITE)
        skin.rectangle([44, 28, 49, 40], fill=WHITE)
        for x0 in (8, 52):  # barbatanas da orelha, em cor fixa
            details.polygon([(x0, 26), (x0 + 6, 20), (x0 + 6, 34)], fill=hexrgba(PAL['mare-2']))
        details.line([(23, 34), (21, 40)], fill=hexrgba(PAL['mare-2']))
        details.line([(41, 34), (43, 40)], fill=hexrgba(PAL['mare-2']))
    elif sp == 'Draconato':
        details.polygon([(21, 16), (18, 4), (26, 12)], fill=hexrgba(PAL['pergaminho-0']))
        details.polygon([(43, 16), (46, 4), (38, 12)], fill=hexrgba(PAL['pergaminho-0']))
        for x, y in ((26, 36), (38, 36), (32, 42)):
            details.point((x, y), fill=hexrgba(PAL['madeira-3']))

    # Cabelo: 0 = cap, 1 = cap + mechas laterais, 2 = cachos
    if not golem and not espectro:
        cap(h0)
        h1.ellipse([18, 9, 46, 32], fill=WHITE)
        h1.rectangle([16, 22, 22, 46], fill=WHITE)
        h1.rectangle([42, 22, 48, 46], fill=WHITE)
        for cx, cy in ((22, 14), (30, 10), (38, 10), (46, 14), (26, 20), (42, 20)):
            h2.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=WHITE)
        h2.rectangle([18, 16, 46, 22], fill=WHITE)

    # Barba (anão e humano com barba) na faixa do queixo.
    beard.polygon([(24, 36), (40, 36), (38, 46), (32, 49), (26, 46)], fill=WHITE)

    # Olhos e pálpebra (mesmas posições para o piscar).
    for x in (25, 36):
        eyes.rectangle([x, 27, x + 2, 29], fill=WHITE)
        lid.rectangle([x - 1, 26, x + 3, 30], fill=WHITE)

    # Detalhes fixos: boca e, no Golem, rachaduras que brilham.
    details.line([(28, 38), (36, 38)], fill=hexrgba(PAL['carimbo-0']))
    if golem:
        for pts in (
            [(24, 20), (28, 26), (25, 32)],
            [(42, 22), (37, 30), (41, 36)],
            [(30, 50), (34, 56), (31, 62)],
        ):
            details.line(pts, fill=hexrgba(PAL['ouro-2']), width=1)
        details.point((31, 26), fill=hexrgba(PAL['ouro-4']))
    if espectro:
        # espectro sem traços faciais, só a boca
        details.line([(28, 38), (36, 38)], fill=hexrgba(PAL['nevoa-2']))

    add_face_details(details, sp)
    layers['outline'] = outline(layers)
    layers['eyewhite'] = build_eyewhite(sp)
    layers['shade'] = build_shade(layers, sp)
    for side in ('L', 'R'):
        arm, hand, line = build_arm(sp, side)
        layers[f'arm{side}'], layers[f'hand{side}'], layers[f'line{side}'] = arm, hand, line
    return layers


def outline(layers):
    """Contorno de 1 px em volta da união das camadas, em cor escura da paleta."""
    union = Image.new('L', (W, H), 0)
    for k in ('cloak', 'skin', 'hair0', 'hair1', 'hair2', 'beard'):
        union.paste(255, mask=layers[k].split()[3])
    out = blank()
    px_u = union.load()
    px_o = out.load()
    dark = hexrgba(PAL['noite-0'])
    for y in range(H):
        for x in range(W):
            if px_u[x, y] == 0:
                near = any(
                    0 <= x + dx < W and 0 <= y + dy < H and px_u[x + dx, y + dy] > 0
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                )
                if near:
                    px_o[x, y] = dark
    return out


def build_sheet(sp):
    layers = draw_species(sp)
    sheet = Image.new('RGBA', (W * len(LAYERS), H), (0, 0, 0, 0))
    frames = []
    for i, name in enumerate(LAYERS):
        sheet.paste(layers[name], (i * W, 0))
        frames.append({'name': name, 'x': i * W, 'y': 0, 'w': W, 'h': H})
    slug = SLUG[sp]
    sheet.save(os.path.join(OUT, f'{slug}.png'))
    atlas = {
        'image': f'/art/personagens/{slug}.png',
        'frameWidth': W,
        'frameHeight': H,
        'frames': frames,
        'animations': {},
    }
    with open(os.path.join(OUT, f'{slug}.json'), 'w') as f:
        json.dump(atlas, f, indent=2)


def main():
    os.makedirs(OUT, exist_ok=True)
    for sp in SLUG:
        build_sheet(sp)
    print('personagens gerados em', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
