// Report generation utilities
import { Product, Sale, Purchase, Expense } from '../types';
import { calculations } from './calculations';

export interface ReportData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  salesCount: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
}

export const reports = {
  // Generate comprehensive business report
  generateBusinessReport: (
    products: Product[],
    sales: Sale[],
    purchases: Purchase[],
    expenses: Expense[],
    startDate: Date,
    endDate: Date
  ): ReportData => {
    // Filter data by date range
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    const revenue = calculations.getTotalRevenue(filteredSales);
    const totalExpenses = calculations.getTotalExpenses(filteredExpenses) + 
                         calculations.getTotalPurchaseCosts(filteredPurchases);
    const profit = revenue - totalExpenses;

    // Top products
    const productSales = filteredSales.reduce((acc, sale) => {
      if (sale.productName) {
        if (!acc[sale.productName]) {
          acc[sale.productName] = { quantity: 0, revenue: 0 };
        }
        acc[sale.productName].quantity += sale.quantity;
        acc[sale.productName].revenue += sale.totalAmount;
      }
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Expenses by category
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: `${startDate.toLocaleDateString('hu-HU')} - ${endDate.toLocaleDateString('hu-HU')}`,
      revenue,
      expenses: totalExpenses,
      profit,
      salesCount: filteredSales.length,
      topProducts,
      expensesByCategory: expenseCategoryArray
    };
  },

  // Export report as CSV
  exportToCSV: (reportData: ReportData): string => {
    let csv = 'Üzleti Jelentés\n';
    csv += `Időszak,${reportData.period}\n`;
    csv += `Bevétel,${reportData.revenue}\n`;
    csv += `Kiadások,${reportData.expenses}\n`;
    csv += `Profit,${reportData.profit}\n`;
    csv += `Eladások száma,${reportData.salesCount}\n\n`;

    csv += 'Top Termékek\n';
    csv += 'Név,Mennyiség,Bevétel\n';
    reportData.topProducts.forEach(product => {
      csv += `${product.name},${product.quantity},${product.revenue}\n`;
    });

    csv += '\nKiadások kategóriánként\n';
    csv += 'Kategória,Összeg\n';
    reportData.expensesByCategory.forEach(expense => {
      csv += `${expense.category},${expense.amount}\n`;
    });

    return csv;
  },

  // Generate inventory report
  generateInventoryReport: (products: Product[]): string => {
    let report = 'Készlet Jelentés\n';
    report += `Generálva: ${new Date().toLocaleString('hu-HU')}\n\n`;

    const totalValue = calculations.getInventoryValue(products);
    const lowStockProducts = calculations.getLowStockProducts(products);
    const outOfStockProducts = products.filter(p => p.currentStock === 0);

    report += `Összes termék: ${products.length}\n`;
    report += `Készlet értéke: ${totalValue.toLocaleString('hu-HU')} Ft\n`;
    report += `Alacsony készletű termékek: ${lowStockProducts.length}\n`;
    report += `Elfogyott termékek: ${outOfStockProducts.length}\n\n`;

    if (lowStockProducts.length > 0) {
      report += 'Alacsony készletű termékek:\n';
      lowStockProducts.forEach(product => {
        report += `- ${product.name}: ${product.currentStock} ${product.unit} (min: ${product.minStock})\n`;
      });
      report += '\n';
    }

    if (outOfStockProducts.length > 0) {
      report += 'Elfogyott termékek:\n';
      outOfStockProducts.forEach(product => {
        report += `- ${product.name}\n`;
      });
    }

    return report;
  }
};