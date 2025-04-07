import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Order } from "@/lib/types";

interface OrderHistoryProps {
  orders: Order[];
  onViewAll: () => void;
}

export function OrderHistory({ orders, onViewAll }: OrderHistoryProps) {
  const [_, navigate] = useLocation();

  const handleViewDetails = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 dark:text-green-500';
      case 'processing':
      case 'delivering':
        return 'text-blue-600 dark:text-blue-500';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-500';
      case 'failed':
        return 'text-red-600 dark:text-red-500';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Order History</CardTitle>
        <Button variant="link" onClick={onViewAll}>View All</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className={getStatusColor(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.quantity.toLocaleString()} {order.platform} {order.packageId} • {formatDate(order.createdAt)}
                </p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium">${(order.price / 100).toFixed(2)}</span>
                  <Button variant="link" size="sm" className="text-xs h-5 p-0" onClick={() => handleViewDetails(order.id)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No orders yet. Start boosting your social media presence today!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
