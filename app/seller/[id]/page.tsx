'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Calendar, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ListingCard from '@/components/ListingCard';
import { use } from 'react';
import { useWishlist } from '@/context/WishlistContext';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  subcategory?: string;
  description: string;
  image_url: string;
  rating?: number;
  user_id: string;
  created_at: string;
  condition?: string;
}

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  updated_at?: string;
  created_at?: string;
  location?: string;
}

export default function SellerProfilePage({ params }: { params: { id: string } }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params as any) as { id: string };
  const sellerId = unwrappedParams.id;
  
  const [seller, setSeller] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActiveListings, setTotalActiveListings] = useState(0);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch seller profile
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sellerId)
          .single();

        if (sellerError) {
          throw sellerError;
        }

        if (sellerData) {
          setSeller(sellerData);
          
          // Set joined date
          const dateToUse = sellerData.created_at || sellerData.updated_at;
          if (dateToUse) {
            setJoinedDate(new Date(dateToUse).toLocaleDateString('en-GB', {
              month: 'long',
              year: 'numeric'
            }));
          }

          // Fetch seller's active listings
          const { data: listingsData, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', sellerId)
            .order('created_at', { ascending: false });

          if (listingsError) {
            throw listingsError;
          }

          if (listingsData) {
            setListings(listingsData);
            setTotalActiveListings(listingsData.length);
          }
        } else {
          setError('Seller not found');
        }
      } catch (err: any) {
        console.error('Error fetching seller data:', err);
        setError(err.message || 'Failed to fetch seller data');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'Seller not found'}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.back()}
              variant="ghost"
              className="mt-4"
            >
              Go back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Seller Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-white rounded-lg shadow mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={seller.avatar_url} alt={seller.username || "Seller"} />
            <AvatarFallback>{seller.username?.charAt(0)?.toUpperCase() || "S"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{seller.username || `User ${seller.id.substring(0, 6)}`}</h1>
            
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-gray-500 justify-center md:justify-start">
              {joinedDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Joined {joinedDate}</span>
                </div>
              )}
              
              {seller.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{seller.location}</span>
                </div>
              )}
              
              <div>
                <span>{totalActiveListings} active listing{totalActiveListings !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seller Listings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Listings from {seller.username || 'this seller'}</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                This seller has no active listings at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    sellerName={seller.username}
                    isFavorite={isInWishlist(listing.id)}
                    onToggleFavorite={toggleWishlist}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}