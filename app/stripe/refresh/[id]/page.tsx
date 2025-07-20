'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export default function StripeRefreshPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewAccountLink = async () => {
    setIsCreatingLink(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/account_link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: accountId,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to create account link. Please try again.');
    } finally {
      setIsCreatingLink(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-16 w-16 text-orange-500" />
            </div>
            <CardTitle className="text-2xl text-orange-700">
              Session Expired
            </CardTitle>
            <CardDescription>
              Your onboarding session has expired. Let's get you back on track.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Account ID: <code className="bg-muted px-2 py-1 rounded text-xs">{accountId}</code>
              </p>
              <p className="text-sm">
                Don&apos;t worry! We can continue where you left off. Click the button below to resume your onboarding process.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={createNewAccountLink}
                disabled={isCreatingLink}
                className="w-full"
                size="lg"
              >
                {isCreatingLink ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating New Link...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Continue Onboarding
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                If you continue to experience issues, please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}