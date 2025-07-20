'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';

export default function StripeReturnPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  useEffect(() => {
    // Here you could make an API call to verify the account status
    // For now, we'll assume the onboarding was successful
    console.log('Stripe onboarding completed for account:', accountId);
  }, [accountId]);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Onboarding Complete!
            </CardTitle>
            <CardDescription>
              Your Stripe Connect account has been successfully set up
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Account ID: <code className="bg-muted px-2 py-1 rounded text-xs">{accountId}</code>
              </p>
              <p className="text-sm">
                You can now start receiving payments for your listings. Your account will be reviewed by Stripe and you&apos;ll receive confirmation via email.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/create_listing')}
                className="flex-1"
              >
                Create Your First Listing
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                If you need to update your account information later, you can do so from your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}