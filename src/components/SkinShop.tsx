import { useEffect, useRef, useState } from 'react';
import {
  SKINS,
  canBuySkin,
  owns,
  skinDef,
  skyGradient,
  type SkinId,
  type SkinsState,
  canBuySuit,
  ownsSuit,
} from '../game/skins';
import { SUITS, type SuitId } from '../game/suits';
import { SuitSamples } from './SuitSamples';
import { WEATHERS } from '../game/weather';

interface Props {
  skins: SkinsState;
  /** Skin em pré-visualização (a interface inteira já está com ela). */
  previewId: SkinId | null;
  onPreview: (id: SkinId | null) => void;
  onBuy: (id: SkinId) => void;
  onEquip: (id: SkinId) => void;
  onBuySuit: (id: SuitId) => void;
  onEquipSuit: (id: SuitId) => void;
  onClose: () => void;
}

type Tab = 'cenario' | 'viajantes';

/** Loja de Skins: temas que trocam as cores da interface, do céu e da arte do balcão. */
export function SkinShop({ skins, previewId, onPreview, onBuy, onEquip, onBuySuit, onEquipSuit, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<Tab>('cenario');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rain = WEATHERS[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal skin-shop"
        role="dialog"
        aria-modal="true"
        aria-label="Loja de Skins"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skin-head">
          <div>
            <p className="eyebrow">Ateliê do cartório</p>
            <h2>Loja de Skins</h2>
          </div>
          <p className="skin-balance" aria-live="polite">
            Selos: <strong>{skins.selos}</strong>
          </p>
        </header>

        <p className="muted skin-lead">
          Ganhe Selos fechando cada dia sem falir (3 a cada quinto dia, e 5 ao chegar ao fim). Skins de cenário e
          trajes de viajantes usam os mesmos Selos e valem em qualquer jogo.
        </p>

        <div className="skin-tabs" role="tablist" aria-label="Tipo de skin">
          {(
            [
              ['cenario', 'Cenário'],
              ['viajantes', 'Viajantes'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'cenario' && (
          <p className="muted skin-lead">
            Cada skin troca as cores de toda a interface, o céu de cada dia e a tinta do balcão. Você pode
            experimentar antes de comprar.
          </p>
        )}
        {tab === 'viajantes' && (
          <p className="muted skin-lead">
            Cada traje muda as cores das roupas, dos cabelos e dos olhos de quem chega ao balcão. É só aparência: as
            regras não mudam. Aqui, três viajantes de exemplo.
          </p>
        )}

        {tab === 'viajantes' && (
          <ul className="skin-list">
            {SUITS.map((suit) => {
              const mine = ownsSuit(skins, suit.id);
              const equipped = skins.suit === suit.id;
              return (
                <li key={suit.id} className={`skin-card suit-card${equipped ? ' equipped' : ''}`}>
                  <SuitSamples suit={suit} />
                  <div className="skin-body">
                    <h3>{suit.name}</h3>
                    <p>{suit.description}</p>
                  </div>
                  <div className="skin-actions">
                    {mine ? (
                      <button
                        type="button"
                        className={equipped ? 'secondary' : 'primary'}
                        disabled={equipped}
                        onClick={() => onEquipSuit(suit.id)}
                      >
                        {equipped ? 'Em uso' : 'Usar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary"
                        disabled={!canBuySuit(skins, suit.id)}
                        onClick={() => onBuySuit(suit.id)}
                      >
                        Comprar · {suit.cost}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'cenario' && (
        <ul className="skin-list">
          {SKINS.map((skin) => {
            const mine = owns(skins, skin.id);
            const equipped = skins.equipped === skin.id;
            const previewing = previewId === skin.id;
            const affordable = canBuySkin(skins, skin.id);
            const { ui } = skin;
            return (
              <li
                key={skin.id}
                className={`skin-card${equipped ? ' equipped' : ''}${previewing ? ' previewing' : ''}`}
              >
                <div className="skin-swatch" style={{ background: skyGradient(rain, skin) }} aria-hidden="true">
                  <span className="skin-chips">
                    {[ui.night2, ui.wood2, ui.gold, ui.violet, ui.parchment].map((c, i) => (
                      <i key={i} style={{ background: c }} />
                    ))}
                  </span>
                </div>
                <div className="skin-body">
                  <h3>{skin.name}</h3>
                  <p>{skin.description}</p>
                </div>
                <div className="skin-actions">
                  {mine ? (
                    <button
                      type="button"
                      className={equipped ? 'secondary' : 'primary'}
                      disabled={equipped}
                      onClick={() => onEquip(skin.id)}
                    >
                      {equipped ? 'Em uso' : 'Usar'}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="primary" disabled={!affordable} onClick={() => onBuy(skin.id)}>
                        Comprar · {skin.cost}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        aria-pressed={previewing}
                        onClick={() => onPreview(previewing ? null : skin.id)}
                      >
                        {previewing ? 'Parar prévia' : 'Experimentar'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        )}

        {tab === 'cenario' && previewId && (
          <p className="skin-preview-note" role="status">
            Pré-visualizando “{skinDef(previewId).name}”. A prévia termina ao fechar a loja.
          </p>
        )}

        <div className="actions">
          <button ref={closeRef} type="button" className="primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
