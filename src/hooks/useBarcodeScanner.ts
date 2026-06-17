import { useEffect, useRef, useCallback } from 'react';

// Scanner emits chars with < 80ms between each key — human typing is typically > 120ms
const MAX_INTER_KEY_GAP_MS = 80;
const MIN_BARCODE_LENGTH = 4;

/**
 * Some scanners are configured in Alt+Numpad mode: instead of sending '8' directly,
 * they send Alt+0+5+6 (the ASCII decimal code for '8'). This produces strings like
 * "056056057..." instead of "889...". Detect and decode this pattern.
 */
function decodeAltNumpadEncoding(raw: string): string {
  if (raw.length === 0 || raw.length % 3 !== 0) return raw;
  const chars: string[] = [];
  for (let i = 0; i < raw.length; i += 3) {
    const code = parseInt(raw.slice(i, i + 3), 10);
    if (code < 32 || code > 127) return raw; // not valid printable ASCII — return as-is
    chars.push(String.fromCharCode(code));
  }
  const decoded = chars.join('');
  // Only accept decode if the result looks like a real barcode (alphanumeric)
  return /^[A-Za-z0-9\-. $/+%]+$/.test(decoded) ? decoded : raw;
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  enabled = true
) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBuffer = useCallback(() => {
    bufferRef.current = [];
    lastKeyTimeRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const isBarcodeInput = target.getAttribute('data-barcode-input') === 'true';

      // Skip normal inputs unless explicitly marked as barcode input
      if (['input', 'textarea', 'select'].includes(tag) && !isBarcodeInput) {
        clearBuffer();
        return;
      }

      const now = Date.now();

      if (e.key === 'Enter') {
        const raw = bufferRef.current.join('');
        const barcode = decodeAltNumpadEncoding(raw);
        if (barcode.length >= MIN_BARCODE_LENGTH) {
          onScan(barcode);
        }
        clearBuffer();
        return;
      }

      // Only collect printable single characters
      if (e.key.length !== 1) return;

      // If the gap since last char is too large, this is human typing — reset
      if (lastKeyTimeRef.current > 0 && now - lastKeyTimeRef.current > MAX_INTER_KEY_GAP_MS) {
        clearBuffer();
      }

      bufferRef.current.push(e.key);
      lastKeyTimeRef.current = now;

      // Auto-clear if Enter never comes within 300ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(clearBuffer, 300);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearBuffer();
    };
  }, [enabled, onScan, clearBuffer]);
}
