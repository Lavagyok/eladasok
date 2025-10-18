import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Users,
  Star,
  Activity,
  Filter,
  CreditCard,
  FileText,
  Wallet
} from 'lucide-react';
import { Product, Sale, Purchase, Expense } from '../types';
import { calculations } from '../utils/calculations';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales, purchases, expenses }) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  
  const filterDataByTime = (data: any[], dateField: string = 'date') => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      switch (timeFilter) {
        case 'today':
          return itemDate >= startOfDay;
        case 'week':
          return itemDate >= startOfWeek;
        case 'month':
          return itemDate >= startOfMonth;
        case 'year':
          return itemDate >= startOfYear;
        default:
          return true;
      }
    });
  };

  const filteredSales = filterDataByTime(sales);
  const filteredExpenses = filterDataByTime(expenses);
  const filteredPurchases = filterDataByTime(purchases);

  const totalRevenue = calculations.getTotalRevenue(filteredSales);
  const totalExpenses = calculations.getTotalExpenses(filteredExpenses);
  const totalPurchaseCosts = calculations.getTotalPurchaseCosts(filteredPurchases);
  
  // Get detailed profit analysis
  const profitAnalysis = calculations.getProfitAnalysis(filteredSales, filteredPurchases, filteredExpenses, products);
  const profit = profitAnalysis.netProfit;
  
  // Bruttó és nettó készlet értékek
  const grossInventoryValue = calculations.getInventoryValue(products); // Beszerzési áron
  const netInventoryValue = products.reduce((sum, product) => sum + (product.currentStock * product.sellingPrice), 0); // Eladási áron
  
  // Teljes bruttó profit számítás - ÖSSZES bevétel mínusz ÖSSZES költség
  const totalAllCosts = totalPurchaseCosts + profitAnalysis.productCostsFromSales + profitAnalysis.manualItemCosts + totalExpenses + grossInventoryValue;
  const totalGrossProfit = totalRevenue - totalAllCosts; // Ez mutatja mennyi pénz maradt
  
  const lowStockProducts = calculations.getLowStockProducts(products);

  // Additional calculations
  const totalProducts = products.length;
  const totalSalesCount = filteredSales.length;
  const averageSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const grossProfitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Top selling products
  const productSales = filteredSales.reduce((acc, sale) => {
    sale.items?.forEach(item => {
      if (item.productId) {
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = { quantity: 0, revenue: 0 };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.totalPrice;
      }
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      return product ? { product, ...data } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.quantity - a!.quantity)
    .slice(0, 5);

  // Expense categories
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Recent activity
  const recentActivity = [
    ...filteredSales.map(sale => ({
      type: 'sale' as const,
      date: sale.date,
      description: `Eladás: ${sale.items?.map(item => item.name).join(', ') || 'Ismeretlen'}`,
      amount: sale.totalAmount,
      positive: true
    })),
    ...filteredExpenses.map(expense => ({
      type: 'expense' as const,
      date: expense.date,
      description: `Kiadás: ${expense.description}`,
      amount: expense.amount,
      positive: false
    })),
    ...filteredPurchases.map(purchase => ({
      type: 'purchase' as const,
      date: purchase.date,
      description: `Beszerzés: ${purchase.productName}`,
      amount: purchase.totalAmount,
      positive: false
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Ft';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Ma';
      case 'week': return 'Ez a hét';
      case 'month': return 'Ez a hónap';
      case 'year': return 'Ez az év';
      default: return 'Összes idő';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border-l-4 hover:bg-gray-750 transition-colors" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-center">
          <Icon className="w-8 h-8 text-gray-500" />
          {trend !== undefined && (
            <div className="mt-1 flex items-center text-xs">
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              ) : null}
              {trend !== 0 && (
                <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Irányítópult</h1>
          <p className="text-gray-400">Részletes áttekintés a készlet és pénzügyek állapotáról</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
          >
            <option value="today">Ma</option>
            <option value="week">Ez a hét</option>
            <option value="month">Ez a hónap</option>
            <option value="year">Ez az év</option>
            <option value="all">Összes idő</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-400">Időszak: <span className="text-blue-400 font-medium">{getTimeFilterLabel()}</span></p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Összes Bevétel"
          value={formatCurrency(totalRevenue)}
          subtitle={`${totalSalesCount} eladásból`}
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Bruttó Készlet Érték"
          value={formatCurrency(grossInventoryValue)}
          subtitle={`beszerzési áron (${totalProducts} termék)`}
          icon={Package}
          color="#3b82f6"
        />
        <StatCard
          title="Nettó Készlet Érték"
          value={formatCurrency(netInventoryValue)}
          subtitle={`eladási áron (${totalProducts} termék)`}
          icon={Package}
          color="#06b6d4"
        />
        <StatCard
          title="Maradt Pénz (Bruttó)"
          value={formatCurrency(totalGrossProfit)}
          subtitle={`${grossProfitMargin.toFixed(1)}% margin`}
          icon={Wallet}
          color={totalGrossProfit >= 0 ? "#10b981" : "#ef4444"}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Hagyományos Nettó Profit"
          value={formatCurrency(profit)}
          subtitle={`${profitMargin.toFixed(1)}% margin (készlet nélkül)`}
          icon={DollarSign}
          color={profit >= 0 ? "#10b981" : "#ef4444"}
        />
        <StatCard
          title="Működési Kiadások"
          value={formatCurrency(profitAnalysis.operatingExpenses)}
          subtitle={`${filteredExpenses.length} tétel`}
          icon={CreditCard}
          color="#f59e0b"
        />
        <StatCard
          title="Alacsony Készlet"
          value={lowStockProducts.length}
          subtitle="termék figyelmet igényel"
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <StatCard
          title="Átlag Eladás"
          value={formatCurrency(averageSaleValue)}
          subtitle="per tranzakció"
          icon={Target}
          color="#8b5cf6"
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Alacsony Készlet Riasztás
          </h3>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-green-400 font-medium">Minden termék készlete megfelelő!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 8).map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-orange-900/20 rounded-lg border border-orange-900/30">
                  <div>
                    <span className="font-medium text-white">{product.name}</span>
                    <p className="text-xs text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-orange-400">
                      {product.currentStock} {product.unit}
                    </span>
                    <p className="text-xs text-gray-500">min: {product.minStock}</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 8 && (
                <p className="text-center text-sm text-gray-400">
                  +{lowStockProducts.length - 8} további termék
                </p>
              )}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Legjobban Fogyó Termékek
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nincs eladási adat a kiválasztott időszakban</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(({ product, quantity, revenue }, index) => (
                <div key={product!.id} className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-medium text-white">{product!.name}</span>
                      <p className="text-xs text-gray-400">{product!.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-400">
                      {quantity} {product!.unit}
                    </span>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity and Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
            <Clock className="w-5 h-5 mr-2 text-purple-500" />
            Legutóbbi Tevékenységek
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nincs tevékenység a kiválasztott időszakban</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.positive ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <span className="text-sm text-white">{activity.description}</span>
                      <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    activity.positive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.positive ? '+' : '-'}{formatCurrency(activity.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Expense Categories */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
            <PieChart className="w-5 h-5 mr-2 text-red-500" />
            Kiadások Kategóriánként
          </h3>
          {topExpenseCategories.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nincs kiadás a kiválasztott időszakban</p>
          ) : (
            <div className="space-y-3">
              {topExpenseCategories.map(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">{category}</span>
                      <span className="text-sm text-red-400">{formatCurrency(amount)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{percentage.toFixed(1)}% az összes kiadásból</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
          Teljes Bruttó Profit Lebontás - {getTimeFilterLabel()}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-6 bg-green-900/20 rounded-lg border border-green-900/30">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Összes Bevétel</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{totalSalesCount} tranzakció</p>
          </div>
          
          <div className="text-center p-6 bg-red-900/20 rounded-lg border border-red-900/30">
            <Package className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Összes Költség</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalAllCosts)}</p>
            <p className="text-xs text-gray-500 mt-1">minden költség összesen</p>
          </div>
          
          <div className="text-center p-6 bg-blue-900/20 rounded-lg border border-blue-900/30">
            <Wallet className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Maradt Pénz</p>
            <p className={`text-2xl font-bold ${totalGrossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalGrossProfit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{grossProfitMargin.toFixed(1)}% margin</p>
          </div>
        </div>
        
        {/* Detailed Profit Breakdown */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Részletes Költség Lebontás
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
              <span className="text-green-400 font-medium">Összes Bevétel</span>
              <span className="text-green-400 font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
              <span className="text-red-400">- Közvetlen Beszerzési Költség</span>
              <span className="text-red-400">-{formatCurrency(profitAnalysis.costOfGoodsSold)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-orange-900/20 rounded">
              <span className="text-orange-400">- Eladott Termékek Beszerzési Költsége</span>
              <span className="text-orange-400">-{formatCurrency(profitAnalysis.productCostsFromSales)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-pink-900/20 rounded">
              <span className="text-pink-400">- Kézi Tételek Beszerzési Költsége</span>
              <span className="text-pink-400">-{formatCurrency(profitAnalysis.manualItemCosts)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
              <span className="text-yellow-400">- Működési Kiadások</span>
              <span className="text-yellow-400">-{formatCurrency(profitAnalysis.operatingExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-900/20 rounded">
              <span className="text-purple-400">- Jelenlegi Készlet Értéke (bruttó)</span>
              <span className="text-purple-400">-{formatCurrency(grossInventoryValue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-600 rounded border-2 border-blue-500">
              <span className="text-white font-bold text-lg">= Maradt Pénz (Bruttó Profit)</span>
              <span className={`font-bold text-xl ${totalGrossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalGrossProfit)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Comparison with Traditional Profit */}
        <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
          <h4 className="text-md font-semibold text-white mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            Összehasonlítás Hagyományos Profittal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-900/20 rounded border border-blue-900/30">
              <p className="text-sm text-blue-400 mb-1">Hagyományos Nettó Profit</p>
              <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(profit)}
              </p>
              <p className="text-xs text-gray-500">készlet értéke nincs levonva</p>
            </div>
            <div className="p-3 bg-green-900/20 rounded border border-green-900/30">
              <p className="text-sm text-green-400 mb-1">Bruttó Profit (Maradt Pénz)</p>
              <p className={`text-lg font-bold ${totalGrossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalGrossProfit)}
              </p>
              <p className="text-xs text-gray-500">minden költség levonva</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-600/50 rounded">
            <p className="text-sm text-gray-300">
              <strong>Különbség:</strong> {formatCurrency(Math.abs(profit - totalGrossProfit))} 
              <span className="text-gray-400 ml-2">
                (ez a jelenlegi készlet bruttó értéke)
              </span>
            </p>
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-cyan-900/20 rounded-lg border border-cyan-900/30">
            <Package className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Bruttó Készlet</p>
            <p className="text-lg font-bold text-cyan-400">{formatCurrency(grossInventoryValue)}</p>
            <p className="text-xs text-gray-500 mt-1">beszerzési áron</p>
          </div>
          <div className="text-center p-4 bg-teal-900/20 rounded-lg border border-teal-900/30">
            <Package className="w-6 h-6 text-teal-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Nettó Készlet</p>
            <p className="text-lg font-bold text-teal-400">{formatCurrency(netInventoryValue)}</p>
            <p className="text-xs text-gray-500 mt-1">eladási áron</p>
          </div>
          <div className="text-center p-4 bg-lime-900/20 rounded-lg border border-lime-900/30">
            <ShoppingCart className="w-6 h-6 text-lime-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Eladások</p>
            <p className="text-lg font-bold text-lime-400">{totalSalesCount}</p>
            <p className="text-xs text-gray-500 mt-1">tranzakció</p>
          </div>
          <div className="text-center p-4 bg-indigo-900/20 rounded-lg border border-indigo-900/30">
            <Activity className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Aktív Termékek</p>
            <p className="text-lg font-bold text-indigo-400">{products.filter(p => p.currentStock > 0).length}</p>
            <p className="text-xs text-gray-500 mt-1">{totalProducts} összesen</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;