import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Search, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { calculations } from '../utils/calculations';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../utils/formatters';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

const Products: React.FC<ProductsProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price' | 'stock' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchasePrice: '',
    displayPurchasePrice: '',
    sellingPrice: '',
    displaySellingPrice: '',
    currentStock: '',
    minStock: '',
    unit: '',
    description: ''
  });

  const filteredAndSortedProducts = () => {
    let filtered = calculations.filterBySearch(searchQuery, products);
    
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'price':
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        case 'stock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      category: formData.category,
      purchasePrice: parseFormattedNumber(formData.displayPurchasePrice),
      sellingPrice: parseFormattedNumber(formData.displaySellingPrice),
      currentStock: parseInt(formData.currentStock),
      minStock: parseInt(formData.minStock),
      unit: formData.unit,
      description: formData.description
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
      setEditingProduct(null);
    } else {
      onAddProduct(productData);
    }

    setFormData({
      name: '',
      category: '',
      purchasePrice: '',
      displayPurchasePrice: '',
      sellingPrice: '',
      displaySellingPrice: '',
      currentStock: '',
      minStock: '',
      unit: '',
      description: ''
    });
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice.toString(),
      displayPurchasePrice: formatNumberInput(product.purchasePrice.toString()),
      sellingPrice: product.sellingPrice.toString(),
      displaySellingPrice: formatNumberInput(product.sellingPrice.toString()),
      currentStock: product.currentStock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
      description: product.description || ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      purchasePrice: '',
      displayPurchasePrice: '',
      sellingPrice: '',
      displaySellingPrice: '',
      currentStock: '',
      minStock: '',
      unit: '',
      description: ''
    });
  };

  const handlePurchasePriceChange = (value: string) => {
    const formatted = formatNumberInput(value);
    const rawValue = parseFormattedNumber(formatted).toString();
    
    setFormData({
      ...formData,
      purchasePrice: rawValue,
      displayPurchasePrice: formatted
    });
  };

  const handleSellingPriceChange = (value: string) => {
    const formatted = formatNumberInput(value);
    const rawValue = parseFormattedNumber(formatted).toString();
    
    setFormData({
      ...formData,
      sellingPrice: rawValue,
      displaySellingPrice: formatted
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Termékek</h1>
          <p className="text-gray-400">Készlet kezelése és termékek áttekintése</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Új Termék
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Keresés termékekben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="name">Rendezés név szerint</option>
              <option value="category">Rendezés kategória szerint</option>
              <option value="price">Rendezés ár szerint</option>
              <option value="stock">Rendezés készlet szerint</option>
              <option value="date">Rendezés dátum szerint</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="asc">Növekvő</option>
              <option value="desc">Csökkenő</option>
            </select>
            <div className="bg-blue-900/20 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400">Összes termék</p>
              <p className="text-lg font-bold text-blue-600">{filteredAndSortedProducts().length}</p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {editingProduct ? 'Termék Szerkesztése' : 'Új Termék Hozzáadása'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Termék neve"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Kategória"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Beszerzési ár (HUF)"
                  value={formData.displayPurchasePrice}
                  onChange={(e) => handlePurchasePriceChange(e.target.value)}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Eladási ár (HUF)"
                  value={formData.displaySellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="number"
                  placeholder="Jelenlegi készlet"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="number"
                  placeholder="Minimum készlet"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Mértékegység (db, kg, l)"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Leírás (opcionális)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Frissítés' : 'Hozzáadás'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Termék
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Kategória
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Készlet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Beszerzési Ár
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Eladási Ár
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredAndSortedProducts().map((product) => (
                <tr key={product.id} className="hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-400">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {product.category}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-300">
                        {product.currentStock} {product.unit}
                      </span>
                      {product.currentStock <= product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-orange-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatCurrency(product.purchasePrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatCurrency(product.sellingPrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {calculations.getProductProfitMargin(product).toFixed(1)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                        title="Szerkesztés"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Törlés"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedProducts().length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nincs termék a keresési feltételeknek megfelelően</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;