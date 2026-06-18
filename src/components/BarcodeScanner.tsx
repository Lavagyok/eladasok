import React, { useState, useCallback } from 'react';
import {
  Barcode,
  X,
  Package,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
} from 'lucide-react';
import { Product } from '../types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { lookupBarcode, BarcodeProduct } from '../utils/barcodeApi';
import { setCustomBarcode } from '../utils/customBarcodes';
import { formatCurrency, formatNumberInput, parseFormattedNumber } from '../utils/formatters';

interface BarcodeScannerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onNavigateToProducts: () => void;
}

type ScanState = 'idle' | 'loading' | 'found-local' | 'found-api' | 'not-found';

interface AddFormData {
  name: string;
  category: string;
  displayPurchasePrice: string;
  displaySellingPrice: string;
  currentStock: string;
  minStock: string;
  unit: string;
  description: string;
}

const EMPTY_FORM: AddFormData = {
  name: '',
  category: '',
  displayPurchasePrice: '',
  displaySellingPrice: '',
  currentStock: '1',
  minStock: '1',
  unit: 'db',
  description: '',
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onNavigateToProducts,
}) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [apiResult, setApiResult] = useState<BarcodeProduct | null>(null);
  const [formData, setFormData] = useState<AddFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const handleScan = useCallback(async (barcode: string) => {
    setScannedBarcode(barcode);
    setLastScan(barcode);
    setScanState('loading');
    setFoundProduct(null);
    setApiResult(null);

    const localMatch = products.find(p => p.barcode === barcode);
    if (localMatch) {
      setFoundProduct(localMatch);
      setScanState('found-local');
      return;
    }

    const result = await lookupBarcode(barcode);
    if (result) {
      setApiResult(result);
      setFormData({
        ...EMPTY_FORM,
        name: result.name,
        category: result.category || '',
        description: [result.brand, result.description].filter(Boolean).join(' — '),
      });
      setScanState('found-api');
    } else {
      setFormData({ ...EMPTY_FORM });
      setScanState('not-found');
    }
  }, [products]);

  useBarcodeScanner(handleScan, scanState === 'idle');

  const closeModal = () => {
    setScanState('idle');
    setFoundProduct(null);
    setApiResult(null);
    setFormData(EMPTY_FORM);
    setSaving(false);
  };

  const handleSaveProduct = () => {
    setSaving(true);
    const name = formData.name.trim() || `Termék (${scannedBarcode})`;
    const category = formData.category || 'Egyéb';
    const productData = {
      name,
      category,
      purchasePrice: parseFormattedNumber(formData.displayPurchasePrice),
      sellingPrice: parseFormattedNumber(formData.displaySellingPrice),
      currentStock: parseInt(formData.currentStock) || 1,
      minStock: parseInt(formData.minStock) || 1,
      unit: formData.unit || 'db',
      description: formData.description,
      barcode: scannedBarcode,
    };
    // Save to personal barcode library so future scans skip external APIs entirely
    setCustomBarcode(scannedBarcode, { name, category, description: formData.description || undefined });
    onAddProduct(productData);
    setSaving(false);
    closeModal();
    onNavigateToProducts();
  };

  const stockPercent = foundProduct
    ? Math.min(100, (foundProduct.currentStock / Math.max(foundProduct.minStock * 2, 1)) * 100)
    : 0;

  return (
    <>
      {/* Floating scanner status pill */}
      <div className="fixed bottom-4 right-4 z-40">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg border transition-all ${
            scanState === 'idle'
              ? 'bg-gray-800 border-gray-600 text-gray-300'
              : 'bg-gray-800 border-blue-500 text-blue-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              scanState === 'loading'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-green-400 animate-pulse'
            }`}
          />
          <Barcode className="w-3.5 h-3.5" />
          <span>
            {scanState === 'loading' ? 'Keresés...' : 'Vonalkód olvasó kész'}
          </span>
          {lastScan && scanState === 'idle' && (
            <span className="text-gray-500 font-mono">{lastScan.slice(-6)}</span>
          )}
        </div>
      </div>

      {/* Modal overlay */}
      {scanState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Loading */}
            {scanState === 'loading' && (
              <div className="p-8 text-center">
                <Loader className="w-10 h-10 text-blue-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-medium">Termék keresése...</p>
                <p className="text-gray-400 text-sm mt-1 font-mono">{scannedBarcode}</p>
              </div>
            )}

            {/* Found in local inventory */}
            {scanState === 'found-local' && foundProduct && (
              <>
                <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Termék megtalálva</span>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-900/30 rounded-lg shrink-0">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg leading-tight">{foundProduct.name}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{foundProduct.category}</p>
                      {foundProduct.description && (
                        <p className="text-gray-500 text-xs mt-1">{foundProduct.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-400">Készlet</span>
                        <span className={`font-semibold ${
                          foundProduct.currentStock <= 0 ? 'text-red-400' :
                          foundProduct.currentStock <= foundProduct.minStock ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          {foundProduct.currentStock} {foundProduct.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            foundProduct.currentStock <= 0 ? 'bg-red-500' :
                            foundProduct.currentStock <= foundProduct.minStock ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum: {foundProduct.minStock} {foundProduct.unit}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-600">
                      <div>
                        <p className="text-xs text-gray-400">Beszer. ár</p>
                        <p className="text-white font-medium">{formatCurrency(foundProduct.purchasePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Eladási ár</p>
                        <p className="text-white font-medium">{formatCurrency(foundProduct.sellingPrice)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-600">
                      <p className="text-xs text-gray-400">Vonalkód</p>
                      <p className="text-gray-300 font-mono text-sm">{scannedBarcode}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Bezárás
                    </button>
                    <button
                      onClick={() => { closeModal(); onNavigateToProducts(); }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Szerkesztés
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Found via API or not found — confirm and add */}
            {(scanState === 'found-api' || scanState === 'not-found') && (
              <>
                <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${scanState === 'found-api' ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {scanState === 'found-api'
                      ? <CheckCircle className="w-5 h-5" />
                      : <AlertCircle className="w-5 h-5" />
                    }
                    <span className="font-semibold">
                      {scanState === 'found-api' ? 'Termék azonosítva' : 'Ismeretlen vonalkód'}
                    </span>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {scanState === 'found-api' && apiResult && (
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-3">
                      <p className="text-xs text-blue-400 font-medium mb-1">Azonosított termék</p>
                      <p className="text-white font-medium">{apiResult.name}</p>
                      {apiResult.brand && <p className="text-gray-400 text-sm">{apiResult.brand}</p>}
                      {apiResult.category && <p className="text-gray-500 text-xs mt-0.5">{apiResult.category}</p>}
                    </div>
                  )}

                  {scanState === 'not-found' && (
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-3">
                      <p className="text-xs text-yellow-400 font-medium mb-1">Vonalkód: <span className="font-mono">{scannedBarcode}</span></p>
                      <p className="text-gray-400 text-xs mt-0.5">Töltsd ki az adatokat — a vonalkód ezután mindig automatikusan felismerhető lesz!</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Termék adatok</p>
                    <input
                      type="text"
                      placeholder="Termék neve *"
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Kategória"
                      value={formData.category}
                      onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Leírás (opcionális)"
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Beszer. ár (Ft)"
                        value={formData.displayPurchasePrice}
                        onChange={e => setFormData(f => ({ ...f, displayPurchasePrice: formatNumberInput(e.target.value) }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Eladási ár (Ft)"
                        value={formData.displaySellingPrice}
                        onChange={e => setFormData(f => ({ ...f, displaySellingPrice: formatNumberInput(e.target.value) }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Készlet"
                        value={formData.currentStock}
                        onChange={e => setFormData(f => ({ ...f, currentStock: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Mértékegy. (db)"
                        value={formData.unit}
                        onChange={e => setFormData(f => ({ ...f, unit: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Mégse
                    </button>
                    <button
                      onClick={handleSaveProduct}
                      disabled={saving || !formData.name.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      Hozzáadás
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BarcodeScanner;
