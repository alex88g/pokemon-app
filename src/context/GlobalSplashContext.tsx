import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Ctx = {
  /** Är overlay synlig just nu? */
  visible: boolean;
  /** Meddelande som visas under spinnern */
  message: string;
  /** Tvinga att visa med ett specifikt meddelande */
  show: (msg?: string) => void;
  /** Tvinga att dölja (ignorerar busy-räkningen) */
  hide: () => void;
  /**
   * Referensräknad busy-toggle.
   * setBusy(true, "Text") ökar räknaren och visar overlay (senaste msg vinner).
   * setBusy(false) minskar räknaren; overlay stängs när räknaren når 0.
   */
  setBusy: (busy: boolean, msg?: string) => void;
};

const GlobalSplashContext = createContext<Ctx | undefined>(undefined);

export function GlobalSplashProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Laddar...');
  const busyCountRef = useRef(0);

  const show = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    busyCountRef.current = 0; // nollställ allt
    setVisible(false);
  }, []);

  const setBusy = useCallback((busy: boolean, msg?: string) => {
    if (busy) {
      busyCountRef.current += 1;
      if (msg) setMessage(msg);
      setVisible(true);
    } else {
      busyCountRef.current = Math.max(0, busyCountRef.current - 1);
      if (busyCountRef.current === 0) setVisible(false);
    }
  }, []);

  const value = useMemo(
    () => ({ visible, message, show, hide, setBusy }),
    [visible, message, show, hide, setBusy],
  );

  return <GlobalSplashContext.Provider value={value}>{children}</GlobalSplashContext.Provider>;
}

export function useGlobalSplash() {
  const ctx = useContext(GlobalSplashContext);
  if (!ctx) throw new Error('useGlobalSplash måste användas inom <GlobalSplashProvider>.');
  return ctx;
}
