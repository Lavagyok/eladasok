// Notification system for inventory management
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const notifications = {
  // Check for low stock and generate notifications
  checkLowStock: (products: any[]): Notification[] => {
    const lowStockProducts = products.filter(product => 
      product.currentStock <= product.minStock && product.currentStock > 0
    );
    
    const outOfStockProducts = products.filter(product => 
      product.currentStock === 0
    );

    const notifications: Notification[] = [];

    if (lowStockProducts.length > 0) {
      notifications.push({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'Alacsony készlet figyelmeztetés',
        message: `${lowStockProducts.length} termék készlete alacsony szinten van`,
        timestamp: new Date(),
        read: false
      });
    }

    if (outOfStockProducts.length > 0) {
      notifications.push({
        id: crypto.randomUUID(),
        type: 'error',
        title: 'Elfogyott termékek',
        message: `${outOfStockProducts.length} termék készlete elfogyott`,
        timestamp: new Date(),
        read: false
      });
    }

    return notifications;
  },

  // Generate sales milestone notifications
  checkSalesMilestones: (sales: any[], lastCheck: Date): Notification[] => {
    const notifications: Notification[] = [];
    const today = new Date();
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.toDateString() === today.toDateString();
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Check for daily revenue milestones
    if (todayRevenue >= 100000 && todayRevenue < 200000) {
      notifications.push({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'Napi bevétel mérföldkő',
        message: `Ma elérted a 100,000 Ft bevételt! Jelenlegi: ${todayRevenue.toLocaleString('hu-HU')} Ft`,
        timestamp: new Date(),
        read: false
      });
    } else if (todayRevenue >= 200000) {
      notifications.push({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'Kiváló napi teljesítmény!',
        message: `Fantasztikus! Ma már ${todayRevenue.toLocaleString('hu-HU')} Ft bevételt értél el!`,
        timestamp: new Date(),
        read: false
      });
    }

    return notifications;
  },

  // Format notification for display
  formatNotification: (notification: Notification): string => {
    const timeAgo = notifications.getTimeAgo(notification.timestamp);
    return `${notification.title} - ${notification.message} (${timeAgo})`;
  },

  // Get time ago string
  getTimeAgo: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    return `${diffDays} napja`;
  }
};