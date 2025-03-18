'use client';

import { useWishlist } from '@/context/WishlistContext';
import ListingCard from '@/components/ListingCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function WishlistPage() {
  const { wishlistItems, loading, toggleWishlist, isInWishlist } = useWishlist();
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch full listing data for each wishlist item
  useEffect(() => {
    const fetchListings = async () => {
      if (loading) return;
      
      setPageLoading(true);
      setError(null);
      
      if (wishlistItems.length === 0) {
        setPageLoading(false);
        return;
      }
      
      try {
        // Extract listing IDs from wishlist items
        const listingIds = wishlistItems.map(item => item.item_id);
        console.log("Fetching listings for IDs:", listingIds);
        
        // Fetch all listings at once
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', listingIds);
          
        if (error) {
          console.error('Error fetching wishlist listings:', error);
          throw error;
        }
        
        console.log("Fetched listings:", data?.length || 0);
        setListings(data || []);
      } catch (error: any) {
        console.error('Error fetching wishlist listings:', error);
        setError(error.message || 'Failed to load wishlist items');
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchListings();
  }, [wishlistItems, loading, supabase]);

  // Handle wishlist toggling with immediate UI feedback
  const handleToggleFavorite = async (id: string) => {
    console.log("Toggle favorite for:", id);
    await toggleWishlist(id);
  };

  // Display loading state
  if (loading || pageLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Min Ønskeliste</h1>
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Indlæser din ønskeliste...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Min Ønskeliste</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center py-8">
          <p className="text-gray-500">
            <a href="/" className="text-blue-500 hover:underline">
              Gå tilbage til forsiden
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Display empty state
  if (listings.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Min Ønskeliste</h1>
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Din ønskeliste er tom.</p>
          <p className="mt-2">
            <a href="/" className="text-blue-500 hover:underline">
              Se produkter og tilføj til din ønskeliste
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Display listings
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Min Ønskeliste</h1>
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
    </div>
  );
}