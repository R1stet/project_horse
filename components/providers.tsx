'use client';

import { ReactNode } from 'react';
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </AuthProvider>
  );
}