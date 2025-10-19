import { Product, Sale, Expense } from '../types';
import { formatCurrency } from './formatters';

export interface PDFReportData {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  profitAnalysis: any;
  salesStats: any;
  inventoryMetrics: any;
  expenseStats: any;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
}

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

export const generatePDFReport = (data: PDFReportData) => {
  const { reportType, dateFrom, dateTo, profitAnalysis, salesStats, inventoryMetrics } = data;

  let content = `ÜZLETI RIPORT\n`;
  content += `Riport típus: ${reportType === 'overview' ? 'Áttekintés' : reportType === 'sales' ? 'Eladások' : reportType === 'inventory' ? 'Készlet' : 'Profit/Veszteség'}\n`;
  content += `Időszak: ${dateFrom || 'Kezdet'} - ${dateTo || 'Most'}\n`;
  content += `Generálva: ${new Date().toLocaleString('hu-HU')}\n\n`;
  content += `${'='.repeat(60)}\n\n`;

  if (reportType === 'overview' || reportType === 'profit') {
    content += `PÉNZÜGYI ÖSSZEFOGLALÓ\n`;
    content += `${'-'.repeat(60)}\n`;
    content += `Teljes bevétel: ${formatCurrency(salesStats.totalRevenue)}\n`;
    content += `Nettó profit: ${formatCurrency(profitAnalysis.netProfit)}\n`;
    content += `Profit margin: ${profitAnalysis.profitMargin.toFixed(1)}%\n`;
    content += `Összes kiadás: ${formatCurrency(profitAnalysis.operatingExpenses)}\n\n`;
  }

  if (reportType === 'sales' || reportType === 'overview') {
    content += `ELADÁSI STATISZTIKÁK\n`;
    content += `${'-'.repeat(60)}\n`;
    content += `Eladások száma: ${salesStats.totalSales}\n`;
    content += `Átlagos eladási érték: ${formatCurrency(salesStats.averageSaleValue)}\n\n`;

    if (salesStats.topSellingProducts.length > 0) {
      content += `TOP ELADOTT TERMÉKEK:\n`;
      salesStats.topSellingProducts.forEach((product: any, index: number) => {
        content += `${index + 1}. ${product.productName} - ${product.quantity} db - ${formatCurrency(product.revenue)}\n`;
      });
      content += `\n`;
    }
  }

  if (reportType === 'inventory' || reportType === 'overview') {
    content += `KÉSZLET INFORMÁCIÓK\n`;
    content += `${'-'.repeat(60)}\n`;
    content += `Készlet értéke: ${formatCurrency(inventoryMetrics.totalValue)}\n`;
    content += `Alacsony készletű termékek: ${inventoryMetrics.lowStockCount}\n`;
    content += `Készleten nincs: ${inventoryMetrics.outOfStockCount}\n\n`;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riport_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateInvoice = (sale: Sale, businessInfo: { name: string; address: string; taxNumber: string }) => {
  let invoice = `SZÁMLA\n`;
  invoice += `${'='.repeat(60)}\n\n`;

  invoice += `Szolgáltató adatai:\n`;
  invoice += `Név: ${businessInfo.name}\n`;
  invoice += `Cím: ${businessInfo.address}\n`;
  invoice += `Adószám: ${businessInfo.taxNumber}\n\n`;

  invoice += `Számla adatai:\n`;
  invoice += `Számla száma: ${sale.id}\n`;
  invoice += `Dátum: ${new Date(sale.date).toLocaleString('hu-HU')}\n`;
  if (sale.customerName) {
    invoice += `Vevő: ${sale.customerName}\n`;
  }
  invoice += `\n${'-'.repeat(60)}\n\n`;

  invoice += `TÉTELEK:\n`;
  sale.items?.forEach((item, index) => {
    invoice += `${index + 1}. ${item.name}\n`;
    invoice += `   Mennyiség: ${item.quantity} ${item.unit}\n`;
    invoice += `   Egységár: ${formatCurrency(item.unitPrice)}\n`;
    invoice += `   Összesen: ${formatCurrency(item.totalPrice)}\n\n`;
  });

  invoice += `${'-'.repeat(60)}\n`;
  invoice += `VÉGÖSSZEG: ${formatCurrency(sale.totalAmount)}\n`;
  invoice += `${'='.repeat(60)}\n`;

  const blob = new Blob([invoice], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `szamla_${sale.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};