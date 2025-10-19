import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  ShoppingCart,
  CreditCard,
  Search,
  Settings,
  Download,
  Upload,
  Trash2,
  FileText,
  Bell
} from 'lucide-react';
import { Product, Sale, Purchase, Expense, Service } from './types';
import { storage } from './utils/storage';
import { calculations } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import SearchComponent from './components/Search';
import Reports from './components/Reports';
import StockAlerts from './components/StockAlerts';

type ActiveTab = 'dashboard' | 'products' | 'sales' | 'expenses' | 'search' | 'reports';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showStockAlerts, setShowStockAlerts] = useState(true);

  useEffect(() => {
    setProducts(storage.getProducts());
    setServices(storage.getServices());
    setSales(storage.getSales());
    setPurchases(storage.getPurchases());
    setExpenses(storage.getExpenses());
  }, []);

  // Initialize default services if none exist
  useEffect(() => {
    if (services.length === 0) {
      const defaultServices: Service[] = [
        { id: crypto.randomUUID(), name: 'Szerviz/Szoftver szolgáltatás', price: 9990, unit: 'óra', category: 'Szerviz', description: 'Általános szerviz és szoftver szolgáltatás' },
        { id: crypto.randomUUID(), name: 'Vírusírtás/Adatmentés', price: 8990, unit: 'óra', category: 'Szerviz', description: 'Vírusirtás és adatmentési szolgáltatás' },
        { id: crypto.randomUUID(), name: 'Rendszerszoftver installálás, beállítás', price: 14990, unit: 'db', category: 'Telepítés', description: 'Operációs rendszer és szoftver telepítés' },
        { id: crypto.randomUUID(), name: 'Helyben vásárolt alkatrész beépítése, installálása', price: 3990, unit: 'db', category: 'Szerelés', description: 'Alkatrész beépítési szolgáltatás' },
        { id: crypto.randomUUID(), name: 'Hibafeltárási/Bevizsgálási díj', price: 4990, unit: 'db', category: 'Diagnosztika', description: 'Hibakeresés és diagnosztika' },
        { id: crypto.randomUUID(), name: 'Szakvélemény kiállítása', price: 6990, unit: 'db', category: 'Dokumentáció', description: 'Szakmai vélemény készítése' },
        { id: crypto.randomUUID(), name: 'Nyomtatás (fekete-fehér A4)', price: 200, unit: 'oldal', category: 'Nyomtatás', description: 'Fekete-fehér nyomtatás' },
        { id: crypto.randomUUID(), name: 'Nyomtatás (színes csak szöveg A4)', price: 400, unit: 'oldal', category: 'Nyomtatás', description: 'Színes szöveges nyomtatás' },
        { id: crypto.randomUUID(), name: 'Nyomtatás (színes kép)', price: 800, unit: 'oldal', category: 'Nyomtatás', description: 'Színes képnyomtatás' },
        { id: crypto.randomUUID(), name: 'Szkennelés, E-mailben küldés', price: 500, unit: 'oldal', category: 'Szkennelés', description: 'Dokumentum szkennelés és email küldés' },
        { id: crypto.randomUUID(), name: 'Kiszállási költség, helyi(alap)', price: 3000, unit: 'alkalom', category: 'Kiszállás', description: 'Helyi kiszállási díj' },
        { id: crypto.randomUUID(), name: 'Kiszállási költség, helyközi(+alap)', price: 500, unit: 'km', category: 'Kiszállás', description: 'Helyközi kiszállási díj kilométerenként' }
      ];
      setServices(defaultServices);
      storage.saveServices(defaultServices);
    }
  }, [services.length]);

  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    storage.saveProducts(updatedProducts);
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
    );
    setProducts(updatedProducts);
    storage.saveProducts(updatedProducts);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a terméket?')) {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      storage.saveProducts(updatedProducts);
    }
  };

  const handleAddSale = (saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID()
    };
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    storage.saveSales(updatedSales);
  };

  const handleUpdateSale = (id: string, updates: Partial<Sale>) => {
    const updatedSales = sales.map(sale =>
      sale.id === id ? { ...sale, ...updates } : sale
    );
    setSales(updatedSales);
    storage.saveSales(updatedSales);
  };

  const handleUpdateProductStock = (productId?: string, newStock?: number) => {
    if (productId && newStock !== undefined) {
      handleUpdateProduct(productId, { currentStock: newStock });
    }
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID()
    };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    storage.saveExpenses(updatedExpenses);
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, ...updates } : expense
    );
    setExpenses(updatedExpenses);
    storage.saveExpenses(updatedExpenses);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a kiadást?')) {
      const updatedExpenses = expenses.filter(expense => expense.id !== id);
      setExpenses(updatedExpenses);
      storage.saveExpenses(updatedExpenses);
    }
  };

  const handleDeleteSale = (id: string) => {
    const updatedSales = sales.filter(sale => sale.id !== id);
    setSales(updatedSales);
    storage.saveSales(updatedSales);
  };

  const handleExportData = () => {
    const data = {
      products,
      services,
      sales,
      purchases,
      expenses,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keszlet_adatok_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.products) setProducts(data.products);
        if (data.services) setServices(data.services);
        if (data.sales) setSales(data.sales);
        if (data.purchases) setPurchases(data.purchases);
        if (data.expenses) setExpenses(data.expenses);
        
        storage.saveProducts(data.products || []);
        storage.saveServices(data.services || []);
        storage.saveSales(data.sales || []);
        storage.savePurchases(data.purchases || []);
        storage.saveExpenses(data.expenses || []);
        
        alert('Adatok sikeresen importálva!');
      } catch (error) {
        alert('Hiba az adatok importálása során!');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Biztosan törölni szeretnéd az összes adatot? Ez a művelet nem visszavonható!')) {
      setProducts([]);
      setServices([]);
      setSales([]);
      setPurchases([]);
      setExpenses([]);
      storage.clearAll();
      alert('Minden adat törölve!');
    }
  };

  const lowStockCount = calculations.getLowStockProducts(products).length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  const totalAlerts = lowStockCount + outOfStockCount;

  const navItems = [
    { id: 'dashboard', label: 'Irányítópult', icon: BarChart3 },
    { id: 'products', label: 'Termékek', icon: Package },
    { id: 'sales', label: 'Eladások', icon: ShoppingCart },
    { id: 'expenses', label: 'Kiadások', icon: CreditCard },
    { id: 'reports', label: 'Riportok', icon: FileText },
    { id: 'search', label: 'Keresés', icon: Search }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <div className="w-64 bg-gray-800 shadow-lg min-h-screen border-r border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">Készlet Kezelő</h1>
            <p className="text-sm text-gray-400">Helyi adattárolás</p>
          </div>
          
          <nav className="mt-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-700 transition-colors ${
                  activeTab === item.id ? 'bg-blue-900 text-blue-400 border-r-2 border-blue-400' : 'text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </div>
                {item.id === 'products' && totalAlerts > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalAlerts}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {totalAlerts > 0 && (
            <div className="mt-4 mx-4 p-3 bg-orange-900/20 border border-orange-600/50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400">
                <Bell className="w-4 h-4" />
                <div className="text-sm">
                  <p className="font-medium">{totalAlerts} készlet figyelmeztetés</p>
                  <p className="text-xs text-gray-400">Kattints a Termékek fülre</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-6 border-t border-gray-700">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-gray-400" />
              Adatkezelés
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                <Download className="w-4 h-4 mr-2 text-gray-400" />
                Adatok exportálása
              </button>
              <label className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg cursor-pointer">
                <Upload className="w-4 h-4 mr-2 text-gray-400" />
                Adatok importálása
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleClearAllData}
                className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                Minden törlése
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
            />
          )}
          {activeTab === 'products' && (
            <div>
              <Products
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
              {showStockAlerts && totalAlerts > 0 && (
                <div className="p-6">
                  <StockAlerts
                    products={products}
                    onDismiss={() => setShowStockAlerts(false)}
                  />
                </div>
              )}
            </div>
          )}
          {activeTab === 'sales' && (
            <Sales
              products={products}
              services={services}
              sales={sales}
              onAddSale={handleAddSale}
              onUpdateSale={handleUpdateSale}
              onDeleteSale={handleDeleteSale}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}
          {activeTab === 'expenses' && (
            <Expenses
              expenses={expenses}
              onAddExpense={handleAddExpense}
             onUpdateExpense={handleUpdateExpense}
             onDeleteExpense={handleDeleteExpense}
            />
          )}
          {activeTab === 'reports' && (
            <Reports
              products={products}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
            />
          )}
          {activeTab === 'search' && (
            <SearchComponent
              products={products}
              services={services}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
             onUpdateProduct={handleUpdateProduct}
             onDeleteProduct={handleDeleteProduct}
             onDeleteSale={handleDeleteSale}
             onUpdateExpense={handleUpdateExpense}
             onDeleteExpense={handleDeleteExpense}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;