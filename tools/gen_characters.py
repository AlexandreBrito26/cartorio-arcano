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
LAYERS = ['cloak', 'skin', 'hair0', 'hair1', 'hair2', 'beard', 'eyes', 'eyelid', 'wings', 'details', 'outline']

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

    layers['outline'] = outline(layers)
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
