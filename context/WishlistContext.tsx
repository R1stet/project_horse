'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

// Define types based on your database schema
type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  image_url: string;
  user_id: string;
  // other fields from your schema
};

type WishlistItem = {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  listing?: Listing;
};

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  isInWishlist: (itemId: string) => boolean;
  toggleWishlist: (itemId: string) => Promise<boolean>;
  loading: boolean;
};

// Create context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Create provider component
export function WishlistProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user and wishlist on mount
  useEffect(() => {
    const fetchUserAndWishlist = async () => {
      try {
        console.log("Fetching user and wishlist...");
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }
        
        console.log("User is logged in:", user.id);
        setUserId(user.id);
        
        // Fetch wishlist items
        console.log("Fetching wishlist items for user:", user.id);
        const { data, error } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching wishlist:", error);
          throw error;
        }
        
        console.log("Fetched wishlist items:", data?.length || 0);
        
        // If we have wishlist items, fetch the corresponding listings
        if (data && data.length > 0) {
          const itemIds = data.map(item => item.item_id);
          console.log("Fetching listing details for items:", itemIds);
          
          const { data: listingsData, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .in('id', itemIds);
          
          if (listingsError) {
            console.error("Error fetching listings:", listingsError);
          } else if (listingsData) {
            console.log("Fetched listings data:", listingsData.length);
            
            // Match listings to wishlist items
            const enhancedItems = data.map(item => ({
              ...item,
              listing: listingsData.find(listing => listing.id === item.item_id)
            }));
            
            setWishlistItems(enhancedItems);
          } else {
            // If no listings data, just set the wishlist items without listings
            setWishlistItems(data);
          }
        } else {
          // No wishlist items, set empty array
          setWishlistItems([]);
        }
      } catch (error) {
        console.error('Error in fetchUserAndWishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndWishlist();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserAndWishlist();
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);
  
  // Check if an item is in wishlist
  const isInWishlist = (itemId: string): boolean => {
    const result = wishlistItems.some(item => item.item_id === itemId);
    console.log(`Item ${itemId} in wishlist: ${result}`);
    return result;
  };
  
  // Toggle wishlist item (add/remove)
  const toggleWishlist = async (itemId: string): Promise<boolean> => {
    console.log("toggleWishlist called for item:", itemId);
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in, cannot toggle wishlist");
        return false;
      }
      
      const currentUserId = user.id;
      console.log("User ID for wishlist operation:", currentUserId);
      setUserId(currentUserId);
      
      const alreadyInWishlist = isInWishlist(itemId);
      console.log("Item already in wishlist:", alreadyInWishlist);
      
      if (alreadyInWishlist) {
        // Remove from wishlist
        console.log("Removing item from wishlist");
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', currentUserId)
          .eq('item_id', itemId);
          
        if (error) {
          console.error("Error removing from wishlist:", error);
          throw error;
        }
        
        console.log("Item removed from wishlist successfully");
        
        // Update local state
        setWishlistItems(prev => prev.filter(item => item.item_id !== itemId));
      } else {
        // Add to wishlist
        console.log("Adding item to wishlist");
        const { data, error } = await supabase
          .from('wishlists')
          .insert({ 
            user_id: currentUserId, 
            item_id: itemId 
          })
          .select();
          
        if (error) {
          console.error("Error adding to wishlist:", error);
          throw error;
        }
        
        console.log("Insert result:", data);
        
        // Update local state
        if (data && data.length > 0) {
          console.log("Fetching listing details for newly added item");
          
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', itemId)
            .single();
            
          if (listingError) {
            console.error("Error fetching listing details:", listingError);
          }
          
          console.log("Listing data for new wishlist item:", listingData);
          
          const newItem = {
            ...data[0],
            listing: listingData || undefined
          };
          
          setWishlistItems(prev => [...prev, newItem]);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error in toggleWishlist:', error);
      return false;
    }
  };
  
  // Context value
  const value: WishlistContextType = {
    wishlistItems,
    isInWishlist,
    toggleWishlist,
    loading
  };
  
  // Debug mounted state
  useEffect(() => {
    console.log("WishlistProvider mounted");
    return () => console.log("WishlistProvider unmounted");
  }, []);
  
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// Custom hook to use the wishlist context
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}