'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOff, Heart } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  image_url: string;
  rating?: number;
  user_id: string;
  created_at?: string;
  description?: string;
  subcategory?: string;
  condition?: string;
}

interface ListingCardProps {
  listing: Listing;
  sellerName?: string; // Optional override
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  sellerName,
  isFavorite = false,
  onToggleFavorite,
  compact = false
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [fetchedUsername, setFetchedUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sellerId, setSellerId] = useState<string>(listing.user_id);
  
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

  // Fetch username if not provided as prop
  useEffect(() => {
    const fetchUsername = async () => {
      // Skip if sellerName is already provided via props
      if (sellerName) return;
      
      setLoading(true);
      try {
        // Check if the user is the current user
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!error && user && user.id === listing.user_id) {
            setFetchedUsername('You (Current User)');
            setSellerId(user.id);
            setLoading(false);
            return;
          }
        } catch (authErr) {
          // Silently handle auth errors and continue to fetch username
          console.log("Auth check skipped:", authErr);
        }
        
        // Fetch from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', listing.user_id)
          .single();
        
        if (error) {
          console.error('Error fetching username:', error);
          return;
        }
        
        if (data && data.username) {
          setFetchedUsername(data.username);
          setSellerId(listing.user_id);
        }
      } catch (err) {
        console.error('Error in username fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsername();
  }, [listing.user_id, sellerName, supabase]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(listing.id);
    }
  };

  const navigateToListing = () => {
    router.push(`/listings/${listing.id}`);
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card click from triggering
  };

  const imageUrl = getImageUrl(listing.image_url);
  const condition = listing.condition || ['New', 'Like New', 'Good', 'Used'][Math.floor(Math.random() * 4)];
  
  // Use sellerName prop if provided, otherwise use fetched username or fallback
  const displayedSellerName = sellerName || fetchedUsername || `User ${listing.user_id.substring(0, 6)}`;

  // Different styles based on compact mode
  const cardClasses = compact 
    ? "rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
    : "rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer";
  
  const imageContainerClasses = compact
    ? "relative aspect-[16/9] overflow-hidden"
    : "relative aspect-[4/3] overflow-hidden";
  
  const contentPadding = compact ? "p-2" : "p-4";
  const titleClasses = compact 
    ? "font-medium text-gray-900 line-clamp-1 text-sm"
    : "font-medium text-gray-900 line-clamp-1";
  
  const infoTextClasses = compact ? "text-xs text-gray-500" : "text-gray-500";
  const sellerLinkClasses = "hover:text-blue-600 hover:underline cursor-pointer";

  return (
    <div 
      className={cardClasses}
      onClick={navigateToListing}
    >
      {/* Image with favorite button and carousel dots */}
      <div className={imageContainerClasses}>
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
            <ImageOff className="text-white" size={compact ? 24 : 40} />
          </div>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            onClick={handleToggleFavorite}
            className={`absolute ${compact ? 'top-1 right-1' : 'top-3 right-3'} z-10 ${compact ? 'p-1' : 'p-2'} rounded-full`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} 
              strokeWidth={2}
            />
          </button>
        )}
        
        {/* Carousel Dots - only show in non-compact mode */}
        {!compact && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}
              ></div>
            ))}
          </div>
        )}
      </div>
      
      {/* Listing Details - Product Style */}
      <div className={contentPadding}>
        {/* Title without the rating stars */}
        <div>
          <h3 className={titleClasses}>
            {listing.title}
          </h3>
        </div>
        
        {/* In compact mode, combine seller and location */}
        {compact ? (
          <div className="flex justify-between mt-1">
            <p className={`${infoTextClasses} truncate max-w-[180px]`}>
              <Link 
                href={`/seller/${sellerId}`} 
                onClick={handleSellerClick}
                className={sellerLinkClasses}
              >
                {displayedSellerName}
              </Link>
              {' • '}
              {listing.location}
            </p>
          </div>
        ) : (
          <div className="flex justify-between mt-1">
            <p className="text-gray-500 truncate max-w-[180px]">
              <Link 
                href={`/seller/${sellerId}`} 
                onClick={handleSellerClick}
                className={sellerLinkClasses}
              >
                {displayedSellerName}
              </Link>
            </p>
            <p className="text-gray-500 truncate max-w-[120px]">{listing.location}</p>
          </div>
        )}
        
        {/* Condition tags - simplified in compact mode */}
        {compact ? (
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500">{listing.category}</span>
          </div>
        ) : (
          <div className="flex items-center mt-2 mb-1">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700 mr-2">
              {condition}
            </span>
            <span className="text-xs text-gray-500">
              {listing.category}
            </span>
          </div>
        )}
        
        {/* Price - smaller in compact mode */}
        <p className={`${compact ? 'mt-1' : 'mt-2'} font-semibold ${compact ? 'text-sm' : ''}`}>
          {listing.price.toLocaleString()} kr DKK
        </p>
      </div>
    </div>
  );
};

export default ListingCard;