'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import { useWishlist } from '@/context/WishlistContext';
import ListingCard from '@/components/ListingCard'; // Adjust import path if needed
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function WishlistPage() {
  const { wishlistItems, loading, toggleWishlist, isInWishlist } = useWishlist();
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch full listing data for each wishlist item
  useEffect(() => {
    const fetchListings = async () => {
      if (loading) return;
      
      if (wishlistItems.length === 0) {
        setPageLoading(false);
        return;
      }

      try {
        // Extract listing IDs from wishlist items
        const listingIds = wishlistItems.map(item => item.item_id);
        
        // Fetch all listings at once
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', listingIds);
          
        if (error) throw error;
        
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching wishlist listings:', error);
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchListings();
  }, [wishlistItems, loading, supabase]);

  // Handle wishlist toggling
  const handleToggleFavorite = async (id: string) => {
    await toggleWishlist(id);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Min Ønskeliste</h1>
        
        {(loading || pageLoading) ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Din ønskeliste er tom.</p>
            <p className="mt-2">
              <a href="/" className="text-blue-500 hover:underline">
                Se produkter og tilføj til din ønskeliste
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={isInWishlist(listing.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
