import { createContext, useContext } from 'react';
import { DEFAULT_SKIN, skinDef, type Skin } from '../game/skins';
import { DEFAULT_SUIT, suitDef, type Suit } from '../game/suits';

/** A skin de cenário em uso (ou em pré-visualização). Sem provedor, vale a clássica. */
export const SkinContext = createContext<Skin>(skinDef(DEFAULT_SKIN));

export const useSkin = () => useContext(SkinContext);

/** O traje dos viajantes em uso. Sem provedor, vale o original (as cores de cada um). */
export const SuitContext = createContext<Suit>(suitDef(DEFAULT_SUIT));

export const useSuit = () => useContext(SuitContext);
