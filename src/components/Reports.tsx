import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Calendar, Download, FileText } from 'lucide-react';
import { Product, Sale, Purchase, Expense } from '../types';
import { calculations } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { generatePDFReport } from '../utils/reports';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
}

const Reports: React.FC<ReportsProps> = ({ products, sales, purchases, expenses }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState<'overview' | 'sales' | 'inventory' | 'profit'>('overview');

  const filterByDateRange = <T extends { date: Date }>(items: T[]) => {
    if (!dateFrom && !dateTo) return items;
    return items.filter(item => {
      const itemDate = new Date(item.date);
      const from = dateFrom ? new Date(dateFrom) : new Date(0);
      const to = dateTo ? new Date(dateTo) : new Date();
      return itemDate >= from && itemDate <= to;
    });
  };

  const filteredSales = filterByDateRange(sales);
  const filteredExpenses = filterByDateRange(expenses);
  const filteredPurchases = filterByDateRange(purchases);

  const profitAnalysis = calculations.getProfitAnalysis(filteredSales, filteredPurchases, filteredExpenses, products);
  const salesStats = calculations.getSalesStats(filteredSales);
  const inventoryMetrics = calculations.getInventoryMetrics(products, filteredSales);
  const expenseStats = calculations.getExpenseStats(filteredExpenses);

  const handleExportReport = () => {
    generatePDFReport({
      reportType,
      dateFrom,
      dateTo,
      profitAnalysis,
      salesStats,
      inventoryMetrics,
      expenseStats,
      products,
      sales: filteredSales,
      expenses: filteredExpenses
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Riportok és Elemzések</h1>
          <p className="text-gray-400">Részletes üzleti jelentések és statisztikák</p>
        </div>
        <button
          onClick={handleExportReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Riport Exportálása
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Időszak kezdete</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Időszak vége</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Riport típusa</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="overview">Áttekintés</option>
              <option value="sales">Eladások</option>
              <option value="inventory">Készlet</option>
              <option value="profit">Profit/Veszteség</option>
            </select>
          </div>
        </div>

        {reportType === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 p-6 rounded-lg border border-green-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Teljes bevétel</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(salesStats.totalRevenue)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-6 rounded-lg border border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Nettó profit</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(profitAnalysis.netProfit)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 p-6 rounded-lg border border-orange-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Összes kiadás</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {formatCurrency(profitAnalysis.operatingExpenses)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-6 rounded-lg border border-purple-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Profit margin</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {profitAnalysis.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-blue-400" />
                  Eladási statisztikák
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Eladások száma:</span>
                    <span className="text-white font-medium">{salesStats.totalSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Átlagos eladási érték:</span>
                    <span className="text-white font-medium">{formatCurrency(salesStats.averageSaleValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Összes bevétel:</span>
                    <span className="text-green-400 font-medium">{formatCurrency(salesStats.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-yellow-400" />
                  Készlet állapot
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Készlet értéke:</span>
                    <span className="text-white font-medium">{formatCurrency(inventoryMetrics.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Alacsony készlet:</span>
                    <span className="text-orange-400 font-medium">{inventoryMetrics.lowStockCount} termék</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Készleten nincs:</span>
                    <span className="text-red-400 font-medium">{inventoryMetrics.outOfStockCount} termék</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'sales' && (
          <div className="space-y-6">
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Top eladott termékek</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Termék</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Mennyiség</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Bevétel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesStats.topSellingProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-600/50">
                        <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                        <td className="py-3 px-4 text-white">{product.productName}</td>
                        <td className="py-3 px-4 text-right text-white">{product.quantity}</td>
                        <td className="py-3 px-4 text-right text-green-400 font-medium">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Legértékesebb termékek</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Termék</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Készlet</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Beszerzési ár</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Összérték</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMetrics.mostValuableProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-600/50">
                        <td className="py-3 px-4 text-white">{product.name}</td>
                        <td className="py-3 px-4 text-right text-white">
                          {product.currentStock} {product.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {formatCurrency(product.purchasePrice)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-400 font-medium">
                          {formatCurrency(product.currentStock * product.purchasePrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'profit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Profit/Veszteség elemzés</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-600">
                    <span className="text-gray-400">Bevétel:</span>
                    <span className="text-green-400 font-medium">{formatCurrency(salesStats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600">
                    <span className="text-gray-400">Beszerzési költség:</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(profitAnalysis.costOfGoodsSold)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600">
                    <span className="text-gray-400">Eladott termékek költsége:</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(profitAnalysis.productCostsFromSales)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600">
                    <span className="text-gray-400">Egyéb tételek költsége:</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(profitAnalysis.manualItemCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600">
                    <span className="text-gray-400">Működési költségek:</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(profitAnalysis.operatingExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-500 mt-3">
                    <span className="text-white font-semibold">Nettó profit:</span>
                    <span className={`font-bold text-lg ${profitAnalysis.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(profitAnalysis.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Kiadások kategóriánként</h3>
                <div className="space-y-3">
                  {expenseStats.map((stat) => (
                    <div key={stat.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">{stat.category}</span>
                        <span className="text-white font-medium">{formatCurrency(stat.amount)}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{stat.count} tétel</span>
                        <span className="text-gray-400">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
