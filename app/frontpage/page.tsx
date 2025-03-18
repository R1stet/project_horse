'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImageOff, Heart, Star } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createClient } from '@/utils/supabase/client';
import { Brands } from '@/components/brand';

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
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const supabase = createClient();
    
    // Map to store usernames
    const [usernames, setUsernames] = useState<{[key: string]: string}>({});

    // Function to get the correct image URL
    const getImageUrl = (url: string) => {
      // If it's already a full URL, return it
      if (url?.startsWith('http')) {
        return url;
      }
      
      // If it's just a path, get the public URL
      if (url) {
        const { data } = supabase
          .storage
          .from('listing-images')
          .getPublicUrl(url);
        return data?.publicUrl;
      }
      
      return null;
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(id)) {
          newFavorites.delete(id);
        } else {
          newFavorites.add(id);
        }
        return newFavorites;
      });
    };

    // Update the useEffect block where you fetch listings
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
                  // Display actual listings in product marketplace style
                  recentListings.map((listing) => {
                    const imageUrl = getImageUrl(listing.image_url);
                    const isFavorite = favorites.has(listing.id);
                    const sellerName = usernames[listing.user_id] || `User ${listing.user_id.substring(0, 6)}`;
                    const randomRating = (4 + Math.random()).toFixed(2);
                    const condition = listing.condition || ['New', 'Like New', 'Good', 'Used'][Math.floor(Math.random() * 4)];
                    
                    return (
                      <div 
                        key={listing.id} 
                        className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/listings/${listing.id}`)}
                      >
                        {/* Image with favorite button and carousel dots */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={listing.title || 'Listing image'}
                              fill
                              className="object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                const imgElement = e.target as HTMLImageElement;
                                imgElement.src = '/api/placeholder/400/300';
                              }}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                              <ImageOff className="text-white" size={40} />
                            </div>
                          )}
                          
                          {/* Favorite Button */}
                          <button 
                            onClick={(e) => toggleFavorite(e, listing.id)}
                            className="absolute top-3 right-3 z-10 p-2 rounded-full"
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart 
                              className={`h-6 w-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} 
                              strokeWidth={2}
                            />
                          </button>
                          
                          {/* Carousel Dots */}
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}
                              ></div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Listing Details - Product Style */}
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900 line-clamp-1">
                              {listing.title}
                            </h3>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-gray-900 fill-gray-900" />
                              <span className="ml-1 text-gray-900">{listing.rating || randomRating}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-1">
                            <p className="text-gray-500 truncate max-w-[180px]">
                              {sellerName}
                            </p>
                            <p className="text-gray-500 truncate max-w-[120px]">{listing.location}</p>
                          </div>
                          
                          <div className="flex items-center mt-2 mb-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700 mr-2">
                              {condition}
                            </span>
                            <span className="text-xs text-gray-500">
                              {listing.category}
                            </span>
                          </div>
                          
                          <p className="mt-2 font-semibold">
                            {listing.price.toLocaleString()} kr DKK
                          </p>
                        </div>
                      </div>
                    );
                  })
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