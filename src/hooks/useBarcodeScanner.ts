import { useEffect, useRef, useCallback } from 'react';

// Scanner emits chars with < 80ms between each key — human typing is typically > 120ms
const MAX_INTER_KEY_GAP_MS = 80;
const MIN_BARCODE_LENGTH = 4;

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
        const barcode = bufferRef.current.join('');
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
