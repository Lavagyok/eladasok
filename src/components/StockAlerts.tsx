import React from 'react';
import { AlertTriangle, Package, TrendingDown, X } from 'lucide-react';
import { Product } from '../types';
import { calculations } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface StockAlertsProps {
  products: Product[];
  onDismiss?: () => void;
}

const StockAlerts: React.FC<StockAlertsProps> = ({ products, onDismiss }) => {
  const lowStockProducts = calculations.getLowStockProducts(products);
  const outOfStockProducts = products.filter(p => p.currentStock === 0);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-orange-400">Készlet Figyelmeztetések</h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {outOfStockProducts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-red-500" />
            <h4 className="font-medium text-red-400">Elfogyott termékek ({outOfStockProducts.length})</h4>
          </div>
          <div className="space-y-2">
            {outOfStockProducts.map(product => (
              <div key={product.id} className="bg-red-900/20 border border-red-600/30 rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">0 {product.unit}</p>
                    <p className="text-sm text-gray-400">Min: {product.minStock} {product.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStockProducts.filter(p => p.currentStock > 0).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            <h4 className="font-medium text-orange-400">
              Alacsony készlet ({lowStockProducts.filter(p => p.currentStock > 0).length})
            </h4>
          </div>
          <div className="space-y-2">
            {lowStockProducts.filter(p => p.currentStock > 0).map(product => (
              <div key={product.id} className="bg-orange-900/20 border border-orange-600/30 rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{product.currentStock} {product.unit}</p>
                    <p className="text-sm text-gray-400">Min: {product.minStock} {product.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-700 rounded">
        <p className="text-sm text-gray-300">
          <strong>Javasolt művelet:</strong> Vedd fel a kapcsolatot a beszállítókkal és rendeld meg ezeket a termékeket a készlet feltöltéséhez.
        </p>
      </div>
    </div>
  );
};

export default StockAlerts;
