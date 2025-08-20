import { useEffect, useRef } from 'react';
import { useGlobalSplash } from '@/context/GlobalSplashContext';

/**
 * useGlobalBlocker(loading, error, ready, message?)
 * - Visar overlay när loading === true och ready saknas och inget error finns
 * - Döljer när error || ready || loading === false
 * - Stänger även på unmount om den var aktiv
 * - Uppdaterar overlay-texten om `message` ändras under pågående blockering
 */
export function useGlobalBlocker(
  loading: boolean,
  error: unknown,
  ready: unknown,
  message = 'Laddar...',
) {
  const { setBusy, show } = useGlobalSplash();
  const wasBlocking = useRef(false);

  // Huvudlogik: visa/dölj
  useEffect(() => {
    const shouldBlock = !!loading && !ready && !error;

    if (shouldBlock && !wasBlocking.current) {
      wasBlocking.current = true;
      setBusy(true, message); // +1 på räknaren
    } else if (!shouldBlock && wasBlocking.current) {
      wasBlocking.current = false;
      setBusy(false); // -1 på räknaren
    }
  }, [loading, error, ready, message, setBusy]);

  // Om meddelandet ändras medan vi blockerar → uppdatera texten
  useEffect(() => {
    if (wasBlocking.current) {
      // show() ändrar bara text/visning, rör inte ref-count
      show(message);
    }
  }, [message, show]);

  // Cleanup: om komponenten avmonteras medan vi blockerar → minus 1
  useEffect(() => {
    return () => {
      if (wasBlocking.current) {
        wasBlocking.current = false;
        setBusy(false);
      }
    };
  }, [setBusy]);
}
