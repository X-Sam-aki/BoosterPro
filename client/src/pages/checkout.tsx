import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

// Initialize Stripe
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY || '');

interface CheckoutFormProps {
  type: 'package' | 'plan';
  item: any;
}

function CheckoutForm({ type, item }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          itemId: item.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      // Handle error (show error message to user)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>
            {type === 'package' ? 'Service Package' : 'Subscription Plan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price</span>
              <span className="text-xl font-bold">
                ${type === 'package' ? item.price / 100 : `${item.price / 100}/month`}
              </span>
            </div>
            {type === 'package' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quantity</span>
                <span>{item.quantity} {item.type}</span>
              </div>
            )}
            {type === 'plan' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Followers</span>
                  <span>{item.dailyFollowers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Views</span>
                  <span>{item.dailyViews}</span>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'package' | 'plan';
  const id = searchParams.get('id');

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: [type, id],
    queryFn: async () => {
      const response = await fetch(`/api/${type === 'package' ? 'packages' : 'subscription-plans'}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      return response.json();
    },
    enabled: !!type && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!type || !id || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Checkout</CardTitle>
            <CardDescription>
              The item you're trying to purchase is not available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Elements stripe={stripePromise}>
          <CheckoutForm type={type} item={item} />
        </Elements>
      </div>
    </div>
  );
}
