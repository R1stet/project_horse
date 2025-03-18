'use client';

import { ReactNode } from 'react';
import { WishlistProvider } from "@/context/WishlistContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WishlistProvider>
      {children}
    </WishlistProvider>
  );
}