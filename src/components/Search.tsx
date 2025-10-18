import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Product, Sale, Purchase, Expense, Service } from '../types';
import { calculations } from '../utils/calculations';

interface SearchProps {
  products: Product[];
  services: Service[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  onUpdateProduct?: (id: string, product: Partial<Product>) => void;
  onDeleteProduct?: (id: string) => void;
  onDeleteSale?: (id: string) => void;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => void;
  onDeleteExpense?: (id: string) => void;
}

const Search: React.FC<SearchProps> = ({ 
  products, 
  services, 
  sales, 
  purchases, 
  expenses,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteSale,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'products' | 'services' | 'sales' | 'purchases' | 'expenses'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Ft';
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

  const filterByDateRange = (items: any[], dateField: string) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  const filterByPriceRange = (items: any[], priceField: string) => {
    return items.filter(item => {
      const price = item[priceField];
      const minPrice = priceFrom ? parseFloat(priceFrom) : null;
      const maxPrice = priceTo ? parseFloat(priceTo) : null;
      
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  };

  const getFilteredResults = () => {
    let results: any[] = [];

    if (category === 'all' || category === 'products') {
      let filteredProducts = calculations.filterBySearch(query, products);
      if (dateFrom || dateTo) {
        filteredProducts = filterByDateRange(filteredProducts, 'createdAt');
      }
      if (priceFrom || priceTo) {
        filteredProducts = filterByPriceRange(filteredProducts, 'sellingPrice');
      }
      results.push(...filteredProducts.map(item => ({ ...item, type: 'product' })));
    }

    if (category === 'all' || category === 'services') {
      let filteredServices = calculations.filterBySearch(query, services);
      if (priceFrom || priceTo) {
        filteredServices = filterByPriceRange(filteredServices, 'price');
      }
      results.push(...filteredServices.map(item => ({ ...item, type: 'service' })));
    }

    if (category === 'all' || category === 'sales') {
      let filteredSales = calculations.filterBySearch(query, sales);
      if (dateFrom || dateTo) {
        filteredSales = filterByDateRange(filteredSales, 'date');
      }
      if (priceFrom || priceTo) {
        filteredSales = filterByPriceRange(filteredSales, 'totalAmount');
      }
      results.push(...filteredSales.map(item => ({ ...item, type: 'sale' })));
    }

    if (category === 'all' || category === 'purchases') {
      let filteredPurchases = calculations.filterBySearch(query, purchases);
      if (dateFrom || dateTo) {
        filteredPurchases = filterByDateRange(filteredPurchases, 'date');
      }
      if (priceFrom || priceTo) {
        filteredPurchases = filterByPriceRange(filteredPurchases, 'totalAmount');
      }
      results.push(...filteredPurchases.map(item => ({ ...item, type: 'purchase' })));
    }

    if (category === 'all' || category === 'expenses') {
      let filteredExpenses = calculations.filterBySearch(query, expenses);
      if (dateFrom || dateTo) {
        filteredExpenses = filterByDateRange(filteredExpenses, 'date');
      }
      if (priceFrom || priceTo) {
        filteredExpenses = filterByPriceRange(filteredExpenses, 'amount');
      }
      results.push(...filteredExpenses.map(item => ({ ...item, type: 'expense' })));
    }

    return results.sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt || a.updatedAt);
      const bDate = new Date(b.date || b.createdAt || b.updatedAt);
      
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.productName || a.serviceName || a.description || '').toLowerCase();
          bValue = (b.name || b.productName || b.serviceName || b.description || '').toLowerCase();
          break;
        case 'date':
          aValue = aDate.getTime();
          bValue = bDate.getTime();
          break;
        case 'price':
          aValue = a.sellingPrice || a.price || a.totalAmount || a.amount || 0;
          bValue = b.sellingPrice || b.price || b.totalAmount || b.amount || 0;
          break;
        default:
          return bDate.getTime() - aDate.getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const results = getFilteredResults();

  const renderResultItem = (item: any) => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'product': return 'bg-blue-100 text-blue-800';
        case 'service': return 'bg-purple-100 text-purple-800';
        case 'sale': return 'bg-green-100 text-green-800';
        case 'purchase': return 'bg-purple-100 text-purple-800';
        case 'expense': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'product': return 'Termék';
        case 'service': return 'Szolgáltatás';
        case 'sale': return 'Eladás';
        case 'purchase': return 'Beszerzés';
        case 'expense': return 'Kiadás';
        default: return 'Ismeretlen';
      }
    };

    const renderActionButtons = (item: any) => {
      return (
        <div className="flex gap-2 mt-2">
          {item.type === 'product' && onUpdateProduct && (
            <button
              onClick={() => {
                // This would need to trigger edit mode in the parent component
                console.log('Edit product:', item.id);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
              title="Termék szerkesztése"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {item.type === 'product' && onDeleteProduct && (
            <button
              onClick={() => {
                if (window.confirm('Biztosan törölni szeretnéd ezt a terméket?')) {
                  onDeleteProduct(item.id);
                }
              }}
              className="text-red-400 hover:text-red-300 text-sm"
              title="Termék törlése"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {item.type === 'sale' && onDeleteSale && (
            <button
              onClick={() => {
                if (window.confirm('Biztosan törölni szeretnéd ezt az eladást?')) {
                  onDeleteSale(item.id);
                }
              }}
              className="text-red-400 hover:text-red-300 text-sm"
              title="Eladás törlése"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {item.type === 'expense' && onUpdateExpense && (
            <button
              onClick={() => {
                console.log('Edit expense:', item.id);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
              title="Kiadás szerkesztése"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {item.type === 'expense' && onDeleteExpense && (
            <button
              onClick={() => {
                if (window.confirm('Biztosan törölni szeretnéd ezt a kiadást?')) {
                  onDeleteExpense(item.id);
                }
              }}
              className="text-red-400 hover:text-red-300 text-sm"
              title="Kiadás törlése"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    };

    return (
      <div key={`${item.type}-${item.id}`} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
              {getTypeLabel(item.type)}
            </span>
            <h3 className="font-semibold text-white">
              {item.name || 
               (item.items && item.items.length > 0 ? 
                 item.items.map((i: any) => i.name).join(', ') : 
                 item.productName || item.serviceName) || 
               item.description}
            </h3>
          </div>
          <div className="text-right">
            {item.type === 'product' && (
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Eladási ár: {formatCurrency(item.sellingPrice)}</p>
                <p className="text-sm text-gray-400">Készlet: {item.currentStock} {item.unit}</p>
              </div>
            )}
            {item.type === 'service' && (
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Ár: {formatCurrency(item.price)}</p>
                <p className="text-sm text-gray-400">Egység: {item.unit}</p>
              </div>
            )}
            {(item.type === 'sale' || item.type === 'purchase') && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {formatCurrency(item.totalAmount)}
                </p>
                {item.items ? (
                  <p className="text-sm text-gray-400">Tételek: {item.items.length}</p>
                ) : (
                  <p className="text-sm text-gray-400">Mennyiség: {item.quantity}</p>
                )}
              </div>
            )}
            {item.type === 'expense' && (
              <p className="text-sm font-medium text-red-600">
                {formatCurrency(item.amount)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            {item.category && (
              <span className="mr-4">Kategória: {item.category}</span>
            )}
            {item.customerName && (
              <span className="mr-4">Vásárló: {item.customerName}</span>
            )}
            {item.supplierName && (
              <span className="mr-4">Beszállító: {item.supplierName}</span>
            )}
          </div>
          <div>
            {item.type !== 'service' && formatDate(new Date(item.date || item.createdAt || item.updatedAt))}
          </div>
        </div>
        
        {(item.notes || item.description) && (
          <p className="mt-2 text-sm text-gray-400 italic">
            {item.notes || item.description}
          </p>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-600">
          {renderActionButtons(item)}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Keresés</h1>
        <p className="text-gray-400">Keresés minden adatban: termékek, eladások, beszerzések, kiadások</p>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Keresés név, leírás, kategória, stb. alapján..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="all">Minden kategória</option>
                <option value="products">Termékek</option>
                <option value="services">Szolgáltatások</option>
                <option value="sales">Eladások</option>
                <option value="purchases">Beszerzések</option>
                <option value="expenses">Kiadások</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="date">Rendezés dátum szerint</option>
              <option value="name">Rendezés név szerint</option>
              <option value="price">Rendezés ár szerint</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="asc">Növekvő</option>
              <option value="desc">Csökkenő</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                placeholder="Dátum-tól"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
               min="1900-01-01"
               max="2099-12-31"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <input
                type="date"
                placeholder="Dátum-ig"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
               min="1900-01-01"
               max="2099-12-31"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <input
                type="number"
                placeholder="Ár-tól (HUF)"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Ár-ig (HUF)"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400">
            Találatok: {results.length} elem
          </p>
        </div>

        <div className="space-y-4">
          {results.map(renderResultItem)}
        </div>

        {results.length === 0 && (query || category !== 'all' || dateFrom || dateTo || priceFrom || priceTo) && (
          <div className="text-center py-8">
            <SearchIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nincs találat a keresési feltételeknek megfelelően</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;