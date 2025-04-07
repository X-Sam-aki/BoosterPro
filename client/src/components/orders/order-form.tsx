import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ServicePackage } from "@/lib/types";

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  deliverySpeed: z.enum(["gradual", "express"]),
  dripFeed: z.boolean().default(false)
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  selectedPackage: ServicePackage;
  onFormSubmit: (data: OrderFormValues) => void;
}

export function OrderForm({ selectedPackage, onFormSubmit }: OrderFormProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      deliverySpeed: "gradual",
      dripFeed: false
    }
  });

  const handleSubmit = (data: OrderFormValues) => {
    onFormSubmit(data);
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base font-semibold">Order Details</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedPackage.platform.charAt(0).toUpperCase() + selectedPackage.platform.slice(1)} Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="@username" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is the account that will receive the {selectedPackage.type}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email for Order Updates</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your@email.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliverySpeed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Speed</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`border p-3 rounded-lg cursor-pointer ${
                        field.value === "gradual" 
                          ? "bg-primary/10 dark:bg-primary/20 border-primary" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      onClick={() => form.setValue("deliverySpeed", "gradual")}
                    >
                      <div className="font-medium">Gradual</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Looks more natural (1-3 days)
                      </div>
                    </div>
                    <div 
                      className={`border p-3 rounded-lg cursor-pointer ${
                        field.value === "express" 
                          ? "bg-primary/10 dark:bg-primary/20 border-primary" 
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      onClick={() => form.setValue("deliverySpeed", "express")}
                    >
                      <div className="font-medium">Express</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Fast delivery (12-24 hours)
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dripFeed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Add drip-feed (delivers {selectedPackage.type} gradually over 5 days for more natural growth)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
