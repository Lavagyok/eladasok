import { BarcodeProduct } from './barcodeApi';

const LS_KEY = 'barcode_custom_library';

type Library = Record<string, BarcodeProduct>;

function readLibrary(): Library {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLibrary(lib: Library): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(lib));
  } catch { /* ignore quota errors */ }
}

export function getCustomBarcode(barcode: string): BarcodeProduct | null {
  const lib = readLibrary();
  return lib[barcode] ?? null;
}

export function setCustomBarcode(barcode: string, product: BarcodeProduct): void {
  const lib = readLibrary();
  lib[barcode] = product;
  writeLibrary(lib);
}

export function deleteCustomBarcode(barcode: string): void {
  const lib = readLibrary();
  delete lib[barcode];
  writeLibrary(lib);
}

export function getAllCustomBarcodes(): Array<{ barcode: string; product: BarcodeProduct }> {
  const lib = readLibrary();
  return Object.entries(lib).map(([barcode, product]) => ({ barcode, product }));
}

export function getCustomBarcodeCount(): number {
  return Object.keys(readLibrary()).length;
}
