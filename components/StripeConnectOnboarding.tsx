'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function StripeConnectOnboarding() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);

  const createAccount = async () => {
    setAccountCreatePending(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/account', {
        method: 'POST',
      });
      
      const json = await response.json();
      
      if (json.account) {
        setConnectedAccountId(json.account);
      } else if (json.error) {
        setError(json.error);
      }
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setAccountCreatePending(false);
    }
  };

  const createAccountLink = async () => {
    if (!connectedAccountId) return;
    
    setAccountLinkCreatePending(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/account_link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: connectedAccountId,
        }),
      });
      
      const json = await response.json();
      
      if (json.url) {
        window.location.href = json.url;
      } else if (json.error) {
        setError(json.error);
      }
    } catch {
      setError('Failed to create account link. Please try again.');
    } finally {
      setAccountLinkCreatePending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {!connectedAccountId ? 'Become a Seller' : 'Complete Your Setup'}
          </CardTitle>
          <CardDescription>
            {!connectedAccountId 
              ? 'Join our marketplace and start selling to equestrians worldwide'
              : 'Complete your Stripe onboarding to start receiving payments'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!connectedAccountId && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Ready to start selling?</h3>
                <p className="text-sm text-muted-foreground">
                  Create your seller account to begin listing your equestrian products and services.
                </p>
              </div>
              
              <Button 
                onClick={createAccount}
                disabled={accountCreatePending}
                className="w-full"
                size="lg"
              >
                {accountCreatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Seller Account'
                )}
              </Button>
            </div>
          )}

          {connectedAccountId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 text-green-600 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Account Created Successfully!</p>
                  <p className="text-xs text-green-600/80">Account ID: {connectedAccountId}</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Complete Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  Add your business details and bank information to start receiving payments securely.
                </p>
              </div>
              
              <Button 
                onClick={createAccountLink}
                disabled={accountLinkCreatePending}
                className="w-full"
                size="lg"
              >
                {accountLinkCreatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            <p>
              Powered by Stripe Connect. Your information is secure and encrypted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}