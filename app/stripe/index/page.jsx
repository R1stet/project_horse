'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StripePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new onboarding page
    router.push('/stripe/onboarding');
  }, [router]);

  return (
    <div className="min-h-screen bg-background py-12 flex items-center justify-center">
      <p>Redirecting to onboarding...</p>
    </div>
  );
}