import { Product, Sale, Purchase, Expense } from '../types';

export const calculations = {
  // Calculate total revenue from sales
  getTotalRevenue: (sales: Sale[]): number => {
    return sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  },

  // Calculate total expenses
  getTotalExpenses: (expenses: Expense[]): number => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  },

  // Calculate purchase costs
  getTotalPurchaseCosts: (purchases: Purchase[]): number => {
    return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  },

  // Calculate profit (revenue - purchase costs - expenses)
  getProfit: (sales: Sale[], purchases: Purchase[], expenses: Expense[]): number => {
    const revenue = calculations.getTotalRevenue(sales);
    const purchaseCosts = calculations.getTotalPurchaseCosts(purchases);
    
    // Add manual item purchase costs from sales
    const manualItemCosts = sales.reduce((sum, sale) => {
      return sum + (sale.items?.reduce((itemSum, item) => {
        return itemSum + (item.purchasePrice ? item.quantity * item.purchasePrice : 0);
      }, 0) || 0);
    }, 0);
    
    const totalExpenses = calculations.getTotalExpenses(expenses);
    return revenue - purchaseCosts - manualItemCosts - totalExpenses;
  },

  // Calculate total cost of goods sold from sales (products sold at their purchase price)
  getCostOfGoodsSoldFromSales: (sales: Sale[], products: Product[]): number => {
    return sales.reduce((sum, sale) => {
      return sum + (sale.items?.reduce((itemSum, item) => {
        if (item.type === 'product' && item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            return itemSum + (item.quantity * product.purchasePrice);
          }
        }
        return itemSum;
      }, 0) || 0);
    }, 0);
  },

  // Calculate manual item costs from sales
  getManualItemCosts: (sales: Sale[]): number => {
    return sales.reduce((sum, sale) => {
      return sum + (sale.items?.reduce((itemSum, item) => {
        if (item.type === 'manual' && item.purchasePrice) {
          return itemSum + (item.quantity * item.purchasePrice);
        }
        return itemSum;
      }, 0) || 0);
    }, 0);
  },

  // Calculate inventory value
  getInventoryValue: (products: Product[]): number => {
    return products.reduce((sum, product) => sum + (product.currentStock * product.purchasePrice), 0);
  },

  // Get low stock products
  getLowStockProducts: (products: Product[]): Product[] => {
    return products.filter(product => product.currentStock <= product.minStock);
  },

  // Calculate profit margin for a product
  getProductProfitMargin: (product: Product): number => {
    if (product.purchasePrice === 0) return 0;
    return ((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100;
  },

  // Filter data based on search criteria
  filterBySearch: (query: string, items: any[]): any[] => {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowerQuery)
      );
    });
  },

  // Get sales statistics for a time period
  getSalesStats: (sales: Sale[]): {
    totalSales: number;
    totalRevenue: number;
    averageSaleValue: number;
    topSellingProducts: Array<{ productId?: string; productName: string; quantity: number; revenue: number }>;
  } => {
    const totalSales = sales.length;
    const totalRevenue = calculations.getTotalRevenue(sales);
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate top selling products
    const productStats = sales.reduce((acc, sale) => {
      sale.items?.forEach(item => {
        const key = item.productId || item.name;
        if (!acc[key]) {
          acc[key] = {
            productId: item.productId,
            productName: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.totalPrice;
      });
      return acc;
    }, {} as Record<string, { productId?: string; productName: string; quantity: number; revenue: number }>);

    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalSales,
      totalRevenue,
      averageSaleValue,
      topSellingProducts
    };
  },

  // Get expense statistics by category
  getExpenseStats: (expenses: Expense[]): Array<{ category: string; amount: number; count: number; percentage: number }> => {
    const totalExpenses = calculations.getTotalExpenses(expenses);
    
    const categoryStats = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { amount: 0, count: 0 };
      }
      acc[expense.category].amount += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        amount: stats.amount,
        count: stats.count,
        percentage: totalExpenses > 0 ? (stats.amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  // Calculate inventory turnover and other metrics
  getInventoryMetrics: (products: Product[], sales: Sale[]): {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    averageStockValue: number;
    mostValuableProducts: Product[];
  } => {
    const totalValue = calculations.getInventoryValue(products);
    const lowStockCount = calculations.getLowStockProducts(products).length;
    const outOfStockCount = products.filter(p => p.currentStock === 0).length;
    const averageStockValue = products.length > 0 ? totalValue / products.length : 0;
    
    const mostValuableProducts = products
      .map(product => ({
        ...product,
        totalValue: product.currentStock * product.purchasePrice
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      totalValue,
      lowStockCount,
      outOfStockCount,
      averageStockValue,
      mostValuableProducts
    };
  },

  // Get profit analysis
  getProfitAnalysis: (sales: Sale[], purchases: Purchase[], expenses: Expense[], products: Product[]): {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    operatingExpenses: number;
    costOfGoodsSold: number;
    manualItemCosts: number;
    productCostsFromSales: number;
  } => {
    const revenue = calculations.getTotalRevenue(sales);
    const purchaseCosts = calculations.getTotalPurchaseCosts(purchases);
    
    // Calculate costs from actual sales
    const productCostsFromSales = calculations.getCostOfGoodsSoldFromSales(sales, products);
    const manualItemCosts = calculations.getManualItemCosts(sales);
    
    const operatingExpenses = calculations.getTotalExpenses(expenses);
    
    // Total cost of goods sold includes both purchase costs and costs from sales
    const totalCostOfGoodsSold = purchaseCosts + productCostsFromSales + manualItemCosts;
    const grossProfit = revenue - totalCostOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      grossProfit,
      netProfit,
      profitMargin,
      operatingExpenses,
      costOfGoodsSold: purchaseCosts,
      manualItemCosts,
      productCostsFromSales
    };
  }
};