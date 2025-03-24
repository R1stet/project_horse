'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff, MoveRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createClient } from '@/utils/supabase/client';
import { Brands } from '@/components/brand';
import ListingCard from '@/components/ListingCard';
import { useWishlist } from '@/context/WishlistContext';

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
    const [heroImageUrl, setHeroImageUrl] = useState('');
    const [imageLoading, setImageLoading] = useState(true);
    const supabase = createClient();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const { isInWishlist, toggleWishlist } = useWishlist();
    
    const [usernames, setUsernames] = useState<{[key: string]: string}>({});
    
    // Animated title state and effect
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
      () => ["amazing", "unique", "quality", "fantastic", "premium"],
      []
    );
    
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (titleNumber === titles.length - 1) {
          setTitleNumber(0);
        } else {
          setTitleNumber(titleNumber + 1);
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    // Check if user is authenticated
    useEffect(() => {
      const checkAuthStatus = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      };
      
      checkAuthStatus();
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setIsAuthenticated(!!session);
        }
      );
      
      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }, [supabase]);

    // Fetch hero image from Supabase storage
    useEffect(() => {
      const fetchHeroImage = async () => {
        try {
          // getPublicUrl returns { data: { publicUrl: string } } without an error property
          const { data } = await supabase
            .storage
            .from('frontpage-images')
            .getPublicUrl('hero-image.jpg');
            
          // If we get here, we have a publicUrl
          setHeroImageUrl(data.publicUrl);
        } catch (err) {
          // This catches any exceptions thrown during the process
          console.error('Error in hero image fetch:', err);
          setImageLoading(false);
        }
      };

      fetchHeroImage();
    }, [supabase]);

    useEffect(() => {
      const fetchRecentListings = async () => {
        setLoading(true);
        
        try {
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
            
            const userIds = [...new Set(data.map(listing => listing.user_id))];
            
            try {
              const usernameMap: {[key: string]: string} = {};
              
              const { data: { user } } = await supabase.auth.getUser();
              
              if (user) {
                usernameMap[user.id] = 'You (Current User)';
              }
              
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);
              
              if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
              } else if (profiles) {
                profiles.forEach(profile => {
                  if (!usernameMap[profile.id]) {
                    usernameMap[profile.id] = profile.username || `User ${profile.id.substring(0, 6)}`;
                  }
                });
              }
              
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

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    const handleSellingButtonClick = () => {
      if (isAuthenticated) {
        router.push('/create_listing');
      } else {
        router.push('/signup');
      }
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section with Image Background */}
          <section className="relative w-full h-[600px]">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              {heroImageUrl ? (
                <Image 
                  src={heroImageUrl}
                  alt="Marketplace hero background"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  onLoad={handleImageLoad}
                />
              ) : (
                // Fallback to gradient if image fails to load
                <div className="w-full h-full bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400"></div>
              )}
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            
            {/* Content */}
            <div className="container relative z-10 mx-auto h-full">
              <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col h-full">
                <div className="flex gap-4 flex-col">
                  <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular text-white">
                    <span>Find </span>
                    <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                      &nbsp;
                      {titles.map((title, index) => (
                        <motion.span
                          key={index}
                          className="absolute font-semibold"
                          initial={{ opacity: 0, y: "-100" }}
                          transition={{ type: "spring", stiffness: 50 }}
                          animate={
                            titleNumber === index
                              ? {
                                  y: 0,
                                  opacity: 1,
                                }
                              : {
                                  y: titleNumber > index ? -150 : 150,
                                  opacity: 0,
                                }
                          }
                        >
                          {title}
                        </motion.span>
                      ))}
                    </span>
                    <span> products</span>
                  </h1>
                  <p className="text-lg md:text-xl leading-relaxed tracking-tight text-white max-w-2xl text-center">
                    Discover quality items from trusted sellers in our marketplace. Browse and find the perfect items for your needs.
                  </p>
                </div>
                <div className="flex flex-row gap-3">
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => router.push('/listings')}
                    className="gap-4 bg-white text-rose-500 hover:bg-gray-100 hover:text-rose-600"
                  >
                    Browse products <MoveRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleSellingButtonClick}
                    className="gap-4 bg-white text-rose-500 font-bold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    SÆLG NU
                  </Button>
                </div>
              </div>
            </div>
          </section>
  
          {/* Featured Products Section */}
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
                      isFavorite={isInWishlist(listing.id)}
                      onToggleFavorite={toggleWishlist}
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