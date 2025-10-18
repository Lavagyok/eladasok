import React, { useState } from 'react';
import { Plus, ShoppingCart, Search, Calendar, Edit, Trash2, X, Package, Wrench, FileText } from 'lucide-react';
import { Product, Sale, Service, SaleItem } from '../types';
import { calculations } from '../utils/calculations';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../utils/formatters';

interface SalesProps {
  products: Product[];
  services: Service[];
  sales: Sale[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onUpdateSale?: (id: string, sale: Partial<Sale>) => void;
  onDeleteSale?: (id: string) => void;
  onUpdateProductStock: (productId?: string, newStock?: number) => void;
}

const Sales: React.FC<SalesProps> = ({ 
  products, 
  services, 
  sales, 
  onAddSale,
  onUpdateSale,
  onDeleteSale,
  onUpdateProductStock 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount' | 'items'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    notes: '',
    date: ''
  });

  // New item form state
  const [newItem, setNewItem] = useState({
    type: 'product' as 'product' | 'service' | 'manual',
    productId: '',
    serviceId: '',
    name: '',
    quantity: '',
    unitPrice: '',
    displayUnitPrice: '',
    purchasePrice: '',
    displayPurchasePrice: '',
    unit: 'db'
  });

  const filteredAndSortedSales = () => {
    let filtered = sales.filter(sale => {
      const matchesSearch = calculations.filterBySearch(searchQuery, [sale]).length > 0 ||
        sale.items?.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDate = !dateFilter || sale.date.toISOString().split('T')[0] === dateFilter;
      return matchesSearch && matchesDate;
    });
    
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'customer':
          aValue = (a.customerName || '').toLowerCase();
          bValue = (b.customerName || '').toLowerCase();
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'items':
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleItemTypeChange = (type: 'product' | 'service' | 'manual') => {
    setNewItem({
      ...newItem,
      type,
      productId: '',
      serviceId: '',
      name: '',
      unitPrice: '',
      displayUnitPrice: '',
      purchasePrice: '',
      displayPurchasePrice: '',
      unit: 'db'
    });
  };

  const handleItemChange = (itemId: string) => {
    if (newItem.type === 'product') {
      const product = products.find(p => p.id === itemId);
      if (product) {
        setNewItem({
          ...newItem,
          productId: itemId,
          name: product.name,
          unitPrice: product.sellingPrice.toString(),
          displayUnitPrice: formatNumberInput(product.sellingPrice.toString()),
          unit: product.unit
        });
      }
    } else if (newItem.type === 'service') {
      const service = services.find(s => s.id === itemId);
      if (service) {
        setNewItem({
          ...newItem,
          serviceId: itemId,
          name: service.name,
          unitPrice: service.price.toString(),
          displayUnitPrice: formatNumberInput(service.price.toString()),
          unit: service.unit
        });
      }
    }
  };

  const handleUnitPriceChange = (value: string) => {
    const formatted = formatNumberInput(value);
    const rawValue = parseFormattedNumber(formatted).toString();
    
    setNewItem({
      ...newItem,
      unitPrice: rawValue,
      displayUnitPrice: formatted
    });
  };

  const handlePurchasePriceChange = (value: string) => {
    const formatted = formatNumberInput(value);
    const rawValue = parseFormattedNumber(formatted).toString();
    
    setNewItem({
      ...newItem,
      purchasePrice: rawValue,
      displayPurchasePrice: formatted
    });
  };
  const addItemToSale = () => {
    if (!newItem.name || !newItem.quantity || !newItem.unitPrice) {
      alert('Kérlek töltsd ki az összes kötelező mezőt!');
      return;
    }

    const quantity = parseInt(newItem.quantity);
    const unitPrice = parseFloat(newItem.unitPrice);

    // Check stock for products
    if (newItem.type === 'product' && newItem.productId) {
      const product = products.find(p => p.id === newItem.productId);
      if (product && product.currentStock < quantity) {
        alert(`Nincs elegendő készlet! Elérhető: ${product.currentStock} ${product.unit}`);
        return;
      }
    }

    const item: SaleItem = {
      id: crypto.randomUUID(),
      type: newItem.type,
      productId: newItem.productId || undefined,
      serviceId: newItem.serviceId || undefined,
      name: newItem.name,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      unit: newItem.unit,
      purchasePrice: newItem.type === 'manual' && newItem.purchasePrice ? 
        parseFloat(newItem.purchasePrice) : undefined
    };

    setSaleItems([...saleItems, item]);
    
    // Reset new item form
    setNewItem({
      type: 'product',
      productId: '',
      serviceId: '',
      name: '',
      quantity: '',
      unitPrice: '',
      displayUnitPrice: '',
      purchasePrice: '',
      displayPurchasePrice: '',
      unit: 'db'
    });
  };

  const removeItemFromSale = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      alert('Adj hozzá legalább egy tételt az eladáshoz!');
      return;
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const sale: Omit<Sale, 'id'> = {
      items: saleItems,
      totalAmount,
      date: formData.date ? new Date(formData.date) : new Date(),
      customerName: formData.customerName || undefined,
      notes: formData.notes || undefined
    };

    if (editingSale && onUpdateSale) {
      // Restore stock for old items if editing
      editingSale.items?.forEach(oldItem => {
        if (oldItem.type === 'product' && oldItem.productId) {
          const product = products.find(p => p.id === oldItem.productId);
          if (product) {
            onUpdateProductStock(oldItem.productId, product.currentStock + oldItem.quantity);
          }
        }
      });
      
      onUpdateSale(editingSale.id, sale);
    } else {
      onAddSale(sale);
    }

    // Update product stock for new items
    saleItems.forEach(item => {
      if (item.type === 'product' && item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          onUpdateProductStock(item.productId, product.currentStock - item.quantity);
        }
      }
    });

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      notes: '',
      date: ''
    });
    setSaleItems([]);
    setNewItem({
      type: 'product',
      productId: '',
      serviceId: '',
      name: '',
      quantity: '',
      unitPrice: '',
      displayUnitPrice: '',
      purchasePrice: '',
      displayPurchasePrice: '',
      unit: 'db'
    });
    setShowForm(false);
    setEditingSale(null);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customerName: sale.customerName || '',
      notes: sale.notes || '',
      date: sale.date.toISOString().slice(0, 16)
    });
    setSaleItems(sale.items || []);
    setShowForm(true);
  };

  const handleDelete = (sale: Sale) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt az eladást?')) {
      // Restore stock for all product items
      sale.items?.forEach(item => {
        if (item.type === 'product' && item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            onUpdateProductStock(item.productId, product.currentStock + item.quantity);
          }
        }
      });
      
      if (onDeleteSale) {
        onDeleteSale(sale.id);
      }
    }
  };

  const totalRevenue = calculations.getTotalRevenue(filteredAndSortedSales());
  const totalSaleItems = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'product': return Package;
      case 'service': return Wrench;
      case 'manual': return FileText;
      default: return ShoppingCart;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Termék';
      case 'service': return 'Szolgáltatás';
      case 'manual': return 'Egyéb';
      default: return 'Ismeretlen';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Eladások</h1>
          <p className="text-gray-400">Eladások kezelése és nyomon követése</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Új Eladás
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Keresés eladásokban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="date">Rendezés dátum szerint</option>
              <option value="customer">Rendezés vásárló szerint</option>
              <option value="amount">Rendezés összeg szerint</option>
              <option value="items">Rendezés tételek szerint</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="asc">Növekvő</option>
              <option value="desc">Csökkenő</option>
            </select>
            <div className="bg-green-900/20 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400">Összes bevétel</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-orange-900/20 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400">Beszerzési költség</p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(
                  filteredAndSortedSales().reduce((sum, sale) => {
                    return sum + (sale.items?.reduce((itemSum, item) => {
                      if (item.type === 'product' && item.productId) {
                        const product = products.find(p => p.id === item.productId);
                        return itemSum + (product ? item.quantity * product.purchasePrice : 0);
                      } else if (item.type === 'manual' && item.purchasePrice) {
                        return itemSum + (item.quantity * item.purchasePrice);
                      }
                      return itemSum;
                    }, 0) || 0);
                  }, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-6 border border-gray-600 rounded-lg bg-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {editingSale ? 'Eladás Szerkesztése' : 'Új Eladás Rögzítése'}
            </h3>
            
            {/* Sale Items */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">Eladott tételek</h4>
              
              {saleItems.length > 0 && (
                <div className="mb-4 space-y-2">
                  {saleItems.map((item) => {
                    const ItemIcon = getItemIcon(item.type);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <ItemIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <div className="text-sm text-gray-400">
                              {getItemTypeLabel(item.type)} • {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                              {item.type === 'manual' && item.purchasePrice && (
                                <span className="ml-2 text-orange-400">
                                  (Beszerzés: {formatCurrency(item.purchasePrice)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-green-400 font-medium">{formatCurrency(item.totalPrice)}</span>
                          <button
                            onClick={() => removeItemFromSale(item.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-right p-3 bg-green-900/20 rounded-lg">
                    <span className="text-lg font-bold text-green-400">
                      Összesen: {formatCurrency(totalSaleItems)}
                    </span>
                  </div>
                </div>
              )}

              {/* Add New Item */}
              <div className="p-4 border border-gray-500 rounded-lg bg-gray-600">
                <h5 className="text-sm font-medium text-white mb-3">Új tétel hozzáadása</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Típus</label>
                    <select
                      value={newItem.type}
                      onChange={(e) => handleItemTypeChange(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    >
                      <option value="product">Termék</option>
                      <option value="service">Szolgáltatás</option>
                      <option value="manual">Egyéb (kézi)</option>
                    </select>
                  </div>

                  {newItem.type === 'product' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Termék</label>
                      <select
                        value={newItem.productId}
                        onChange={(e) => handleItemChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                      >
                        <option value="">Válassz terméket</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} (Készlet: {product.currentStock} {product.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newItem.type === 'service' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Szolgáltatás</label>
                      <select
                        value={newItem.serviceId}
                        onChange={(e) => handleItemChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                      >
                        <option value="">Válassz szolgáltatást</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({formatCurrency(service.price)}/{service.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newItem.type === 'manual' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Név</label>
                      <input
                        type="text"
                        placeholder="Tétel neve"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Mennyiség</label>
                    <input
                      type="number"
                      placeholder="Mennyiség"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Egységár</label>
                    <input
                      type="text"
                      placeholder="Egységár (HUF)"
                      value={newItem.displayUnitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                    />
                  </div>

                  {newItem.type === 'manual' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Beszerzési ár (opcionális)</label>
                      <input
                        type="text"
                        placeholder="Beszerzési ár (HUF)"
                        value={newItem.displayPurchasePrice}
                        onChange={(e) => handlePurchasePriceChange(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                      />
                    </div>
                  )}
                  {newItem.type === 'manual' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Mértékegység</label>
                      <input
                        type="text"
                        placeholder="db, óra, stb."
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addItemToSale}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tétel hozzáadása
                </button>
              </div>
            </div>

            {/* Sale Details */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Vásárló neve (opcionális)"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />

                <input
                  type="datetime-local"
                  placeholder="Dátum (opcionális - alapértelmezett: most)"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min="1900-01-01T00:00"
                  max="2099-12-31T23:59"
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />

                <input
                  type="text"
                  placeholder="Megjegyzés (opcionális)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={saleItems.length === 0}
                >
                  {editingSale ? 'Eladás Frissítése' : 'Eladás Rögzítése'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
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
                  Dátum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tételek
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Összesen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Beszerzési Költség
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Vásárló
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredAndSortedSales().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {sale.items?.map((item, index) => {
                        const ItemIcon = getItemIcon(item.type);
                        return (
                          <div key={index} className="flex items-center text-sm">
                            <ItemIcon className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-white">{item.name}</span>
                            <span className="text-gray-400 ml-2">
                              ({item.quantity} {item.unit} × {formatCurrency(item.unitPrice)})
                              {item.type === 'manual' && item.purchasePrice && (
                                <span className="text-orange-400 ml-1">
                                  [Beszerzés: {formatCurrency(item.purchasePrice)}]
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {formatCurrency(
                      (sale.items?.reduce((sum, item) => {
                        if (item.type === 'product' && item.productId) {
                          const product = products.find(p => p.id === item.productId);
                          return sum + (product ? item.quantity * product.purchasePrice : 0);
                        } else if (item.type === 'manual' && item.purchasePrice) {
                          return sum + (item.quantity * item.purchasePrice);
                        }
                        return sum;
                      }, 0) || 0)
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {sale.customerName || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                        title="Eladás szerkesztése"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onDeleteSale && (
                        <button
                          onClick={() => handleDelete(sale)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                          title="Eladás törlése"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedSales().length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery || dateFilter ? 'Nincs eladás a keresési feltételeknek megfelelően' : 'Még nincsenek eladások'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;