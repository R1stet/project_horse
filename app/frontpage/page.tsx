'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createClient } from '@/utils/supabase/client';
import { Brands } from '@/components/brand';
import ListingCard from '@/components/ListingCard';
import { useWishlist } from '@/context/WishlistContext'; // Import the wishlist context

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  image_url: string;
  rating: number;
  user_id: string;
  created_at?: string;
  description?: string;
  subcategory?: string;
  condition?: string;
}

export default function FrontPage() {
    const router = useRouter();
    const [recentListings, setRecentListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
    // Use the wishlist context instead of local state
    const { isInWishlist, toggleWishlist } = useWishlist();
    
    // Map to store usernames
    const [usernames, setUsernames] = useState<{[key: string]: string}>({});

    // Fetch listings without any joins
    useEffect(() => {
      const fetchRecentListings = async () => {
        setLoading(true);
        
        try {
          // Simple query to fetch just the listings
          const { data, error } = await supabase
            .from('listings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);

          if (error) {
            console.error('Error fetching listings:', error);
            setRecentListings([]);
          } else if (data) {
            setRecentListings(data);
            
            // Extract unique user IDs
            const userIds = [...new Set(data.map(listing => listing.user_id))];
            
            // Try to fetch usernames separately
            try {
              // Create a temporary map for usernames
              const usernameMap: {[key: string]: string} = {};
              
              // Get current user to identify their listings
              const { data: { user } } = await supabase.auth.getUser();
              
              // First add the current user's username
              if (user) {
                usernameMap[user.id] = 'You (Current User)';
              }
              
              // Fetch usernames from profiles table
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);
              
              if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
              } else if (profiles) {
                // Add fetched usernames to the map
                profiles.forEach(profile => {
                  // Only add if not already set (preserves current user label)
                  if (!usernameMap[profile.id]) {
                    usernameMap[profile.id] = profile.username || `User ${profile.id.substring(0, 6)}`;
                  }
                });
              }
              
              // For any remaining IDs without usernames, use fallback format
              userIds.forEach(id => {
                if (!usernameMap[id]) {
                  usernameMap[id] = `User ${id.substring(0, 6)}`;
                }
              });
              
              setUsernames(usernameMap);
            } catch (err) {
              console.log('Unable to fetch user details:', err);
            }
          }
        } catch (err) {
          console.error('Error in fetch process:', err);
          setRecentListings([]);
        } finally {
          setLoading(false);
        }
      };

      fetchRecentListings();
    }, [supabase]);

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative w-full h-[500px] flex items-center justify-center bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Find amazing products
              </h2>
              <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                Discover quality items from trusted sellers in our marketplace
              </p>
              <div className="max-w-3xl mx-auto bg-white rounded-full shadow-lg p-2">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-2 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="font-medium text-sm">What</div>
                    <input 
                      type="text" 
                      placeholder="Search products" 
                      className="w-full border-none focus:ring-0 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  <div className="flex-1 p-2 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="font-medium text-sm">Category</div>
                    <div className="text-gray-800">All categories</div>
                  </div>
                  <div className="flex-1 p-2 relative">
                    <div className="font-medium text-sm">Price</div>
                    <div className="text-gray-800">Any price</div>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
  
          {/* Listings Section */}
          <section className="w-full py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Featured Products
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  // Loading placeholders
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden shadow-md">
                      <div className="h-64 bg-gray-200 animate-pulse"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 animate-pulse mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-200 animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : recentListings.length === 0 ? (
                  // No listings found
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500 mb-2">
                      <ImageOff className="mx-auto h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">No listings available</h3>
                    <p className="text-gray-500 mt-2">Check back soon for new products</p>
                  </div>
                ) : (
                  // Display actual listings using ListingCard component
                  recentListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      sellerName={usernames[listing.user_id]}
                      isFavorite={isInWishlist(listing.id)} // Use wishlist context
                      onToggleFavorite={toggleWishlist} // Use wishlist context
                    />
                  ))
                )}
              </div>
              {!loading && recentListings.length > 0 && (
                <div className="text-center mt-12">
                  <button 
                    onClick={() => router.push('/listings')}
                    className="px-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
                  >
                    View all products
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Brands Section */}
          <section className="w-full py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Featured Brands
              </h2>
              {/* Integrate the Brands component */}
              <Brands />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }