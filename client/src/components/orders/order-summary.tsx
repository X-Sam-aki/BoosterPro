import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServicePackage } from "@/lib/types";

interface OrderFormData {
  deliverySpeed: "gradual" | "express";
  dripFeed: boolean;
}

interface OrderSummaryProps {
  packageData: ServicePackage;
  formData: OrderFormData;
}

export function OrderSummary({ packageData, formData }: OrderSummaryProps) {
  const { name, price } = packageData;
  const { deliverySpeed, dripFeed } = formData;
  
  // Calculate additional costs
  const expressDeliveryCost = deliverySpeed === "express" ? 999 : 0; // $9.99
  const dripFeedCost = dripFeed ? 499 : 0; // $4.99
  
  const totalCost = price + expressDeliveryCost + dripFeedCost;
  
  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex justify-between mb-3">
          <span>{name}</span>
          <span>${(price / 100).toFixed(2)}</span>
        </div>
        
        {deliverySpeed === "express" && (
          <div className="flex justify-between mb-3 text-sm text-gray-600 dark:text-gray-400">
            <span>Express Delivery</span>
            <span>+${(expressDeliveryCost / 100).toFixed(2)}</span>
          </div>
        )}
        
        {dripFeed && (
          <div className="flex justify-between mb-3 text-sm text-gray-600 dark:text-gray-400">
            <span>Drip Feed Option</span>
            <span>+${(dripFeedCost / 100).toFixed(2)}</span>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${(totalCost / 100).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
