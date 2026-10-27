import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createStage, type Stage } from './stage';

interface StageState {
  stage: Stage | null;
  /** Verdadeiro quando o WebGL não iniciou: cada camada usa a reserva em PNG/CSS. */
  failed: boolean;
}

const StageContext = createContext<StageState>({ stage: null, failed: false });

export const useStage = () => useContext(StageContext);

/**
 * Cria um único canvas/Application para o balcão e o compartilha com as camadas filhas.
 * Renderiza o canvas e depois os filhos, como irmãos, para o CSS poder intercalar
 * a névoa, o brilho quente e a vinheta por cima dele.
 */
export function PixiStage({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<StageState>({ stage: null, failed: false });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let created: Stage | null = null;

    void createStage(el).then((s) => {
      if (cancelled) {
        s?.destroy();
        return;
      }
      if (!s) {
        setState({ stage: null, failed: true });
        return;
      }
      created = s;
      setState({ stage: s, failed: false });
    });

    return () => {
      cancelled = true;
      created?.destroy();
      created = null;
    };
  }, []);

  return (
    <StageContext.Provider value={state}>
      <div ref={host} className="pixi-stage" aria-hidden="true" />
      {children}
    </StageContext.Provider>
  );
}
