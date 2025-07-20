'use client';

import React, { useState } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function StripeOnboardingPage() {
  const router = useRouter();
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);

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
        await initializeStripeConnect(json.account);
      } else if (json.error) {
        setError(json.error);
      }
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setAccountCreatePending(false);
    }
  };

  const initializeStripeConnect = async (accountId: string) => {
    try {
      const sessionResponse = await fetch('/api/stripe/account_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: accountId,
        }),
      });
      
      const session = await sessionResponse.json();
      
      if (session.client_secret) {
        const stripeConnectInstance = await loadConnectAndInitialize({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          fetchClientSecret: async () => session.client_secret,
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#1B3376',
              colorBackground: '#ffffff',
              colorText: '#1B3376',
              colorDanger: '#df1b41',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
        });
        
        setStripeConnectInstance(stripeConnectInstance);
      } else {
        setError(session.error || 'Failed to initialize onboarding');
      }
    } catch {
      setError('Failed to initialize Stripe Connect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

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
                  : 'Complete your information to start receiving payments'
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
                      We&apos;ll collect your basic information including name, contact details, address, and banking information to set up your seller account.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                      <h4 className="font-medium text-blue-800 mb-2">What we&apos;ll collect:</h4>
                      <ul className="text-blue-700 space-y-1 text-left">
                        <li>• Personal information (first and last name)</li>
                        <li>• Contact details (email and phone number)</li>
                        <li>• Address information</li>
                        <li>• Banking details for payments</li>
                      </ul>
                    </div>
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

              {connectedAccountId && stripeConnectInstance && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 text-green-600 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Account Created Successfully!</p>
                      <p className="text-xs text-green-600/80">Account ID: {connectedAccountId}</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 mb-6">
                    <h3 className="font-semibold">Complete Your Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Please fill out the form below with your personal and banking details.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[500px]">
                    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                      <ConnectAccountOnboarding
                        onExit={() => {
                          // Handle when user exits onboarding
                          router.push('/dashboard');
                        }}
                      />
                    </ConnectComponentsProvider>
                  </div>
                </div>
              )}

              {connectedAccountId && !stripeConnectInstance && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading onboarding form...</span>
                </div>
              )}

              <div className="text-xs text-center text-muted-foreground border-t pt-4">
                <p>
                  Your information is secure and encrypted. We collect only the minimum required information for payment processing.
                </p>
                <p className="mt-1">
                  Connected accounts pay Stripe fees directly. No additional fees from our platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}