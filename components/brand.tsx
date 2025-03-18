'use client'

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Marquee } from "./magicui/marquee";
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

interface BrandLogo {
  id: string;
  name: string; // Used internally for alt text
  url: string;  // Full URL to the logo image
}

const BrandLogoCard = ({ name, url }: { name: string, url: string }) => {
  return (
    <div
      className={cn(
        "relative h-24 w-40 mx-4 overflow-hidden rounded-xl border p-4",
        "border-gray-200 bg-white hover:shadow-md transition-shadow",
        "dark:border-gray-800 dark:bg-gray-900",
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="relative w-full h-full">
          <Image
            src={url}
            alt={`${name} logo`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    </div>
  );
};

export function Brands() {
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogosFromBucket = async () => {
      setLoading(true);
      const supabase = createClient();
      
      try {
        // List all files in the brand-logos bucket
        const { data: files, error } = await supabase
          .storage
          .from('brand-logos')
          .list();
        
        if (error) {
          throw error;
        }
        
        if (files && files.length > 0) {
          // Filter for image files only (just in case there are other files in the bucket)
          const imageFiles = files.filter(file => 
            file.name.match(/\.(jpeg|jpg|png|gif|svg|webp)$/i)
          );
          
          // Create brand logo objects with public URLs
          const brandLogos = imageFiles.map((file, index) => {
            const { data } = supabase
              .storage
              .from('brand-logos')
              .getPublicUrl(file.name);
              
            return {
              id: index.toString(),
              name: file.name.split('.')[0], // Use filename (without extension) as name
              url: data.publicUrl
            };
          });
          
          setLogos(brandLogos);
        }
      } catch (err) {
        console.error('Error fetching logos from bucket:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogosFromBucket();
  }, []);
  
  // If still loading or no logos found
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (logos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No brand logos available
      </div>
    );
  }

  // Split logos into two rows for the marquee
  const firstRow = logos.slice(0, Math.ceil(logos.length / 2));
  const secondRow = logos.slice(Math.ceil(logos.length / 2));

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-8">
      <Marquee pauseOnHover className="[--duration:40s] mb-8">
        {firstRow.map((logo) => (
          <BrandLogoCard key={logo.id} name={logo.name} url={logo.url} />
        ))}
      </Marquee>
      
      <Marquee reverse pauseOnHover className="[--duration:40s]">
        {secondRow.map((logo) => (
          <BrandLogoCard key={logo.id} name={logo.name} url={logo.url} />
        ))}
      </Marquee>
      
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white dark:from-gray-900"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white dark:from-gray-900"></div>
    </div>
  );
}