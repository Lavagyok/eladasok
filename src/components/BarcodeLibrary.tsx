import React, { useState, useEffect } from 'react';
import { X, Trash2, BookOpen, Plus } from 'lucide-react';
import { getAllCustomBarcodes, deleteCustomBarcode, setCustomBarcode } from '../utils/customBarcodes';
import { BarcodeProduct } from '../utils/barcodeApi';

interface BarcodeLibraryProps {
  onClose: () => void;
}

interface Entry {
  barcode: string;
  product: BarcodeProduct;
}

const BarcodeLibrary: React.FC<BarcodeLibraryProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adding, setAdding] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const reload = () => setEntries(getAllCustomBarcodes());

  useEffect(() => { reload(); }, []);

  const handleDelete = (barcode: string) => {
    deleteCustomBarcode(barcode);
    reload();
  };

  const handleAdd = () => {
    if (!newBarcode.trim() || !newName.trim()) return;
    setCustomBarcode(newBarcode.trim(), {
      name: newName.trim(),
      brand: newBrand.trim() || undefined,
      category: newCategory.trim() || undefined,
    });
    setNewBarcode('');
    setNewName('');
    setNewBrand('');
    setNewCategory('');
    setAdding(false);
    reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-lg">Saját vonalkód könyvtár</h2>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{entries.length} tétel</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 px-5 pt-3 shrink-0">
          Termékek hozzáadásakor a vonalkód ide kerül mentésre. A következő beolvasáskor azonnal felismert lesz — internet nélkül is.
        </p>

        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {entries.length === 0 && !adding && (
            <div className="text-center py-10 text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nincs mentett vonalkód.</p>
              <p className="text-xs mt-1">Szkennelj be egy terméket és add hozzá — az itt jelenik meg.</p>
            </div>
          )}

          {entries.map(({ barcode, product }) => (
            <div key={barcode} className="flex items-center justify-between gap-3 bg-gray-700/50 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-xs">{barcode}</span>
                  {product.brand && <span className="text-gray-500 text-xs">{product.brand}</span>}
                  {product.category && (
                    <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">{product.category}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(barcode)}
                className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {adding && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Új vonalkód hozzáadása</p>
              <input
                type="text"
                placeholder="Vonalkód *"
                value={newBarcode}
                onChange={e => setNewBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <input
                type="text"
                placeholder="Termék neve *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Márka (opcionális)"
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Kategória (opcionális)"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  Mégse
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newBarcode.trim() || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                >
                  Mentés
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-700 shrink-0">
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Vonalkód hozzáadása manuálisan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeLibrary;
