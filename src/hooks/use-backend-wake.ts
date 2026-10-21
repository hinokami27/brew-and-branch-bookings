import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** After this long a pending slots request is treated as a cold start. */
export const WAKE_HINT_AFTER_MS = 2500;
/** After this long the wait is unusual and the notice changes tone. */
export const STILL_WAITING_AFTER_MS = 15000;

const TOAST_ID = "backend-wake";

/**
 * The backend runs on a free tier that sleeps while idle, so the first request
 * after a lull can take up to ~30s. This surfaces that wait as a friendly
 * loading notice plus a toast, and celebrates the wake-up once data lands.
 */
export function useBackendWake(pending: boolean) {
  const [slow, setSlow] = useState(false);
  const [verySlow, setVerySlow] = useState(false);
  const flags = useRef({ toasted: false, wasSlow: false });

  useEffect(() => {
    if (!pending) {
      setSlow(false);
      setVerySlow(false);
      if (flags.current.wasSlow) {
        flags.current.wasSlow = false;
        toast.success("Backend's awake", {
          id: TOAST_ID,
          description: "Here are the latest slots.",
          duration: 3000,
        });
      }
      flags.current.toasted = false;
      return;
    }
    const t1 = setTimeout(() => {
      setSlow(true);
      flags.current.wasSlow = true;
    }, WAKE_HINT_AFTER_MS);
    const t2 = setTimeout(() => setVerySlow(true), STILL_WAITING_AFTER_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pending]);

  useEffect(() => {
    if (slow && !flags.current.toasted) {
      flags.current.toasted = true;
      toast("Waking up the coffee machine", {
        id: TOAST_ID,
        description:
          "The free-tier backend dozes off when idle — the first request can take up to 30 seconds.",
        duration: 10000,
      });
    }
  }, [slow]);

  return { slow, verySlow };
}
