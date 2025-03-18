import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    category: string
    subcategory: string
    description: string
    image_url: string
  }
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const [imageError, setImageError] = useState(false)
  const supabase = createClient()

  // Function to get the correct image URL
  const getImageUrl = (url: string) => {
    // If it's already a full URL, return it
    if (url?.startsWith('http')) {
      return url
    }
    
    // If it's just a path, get the public URL
    if (url) {
      const { data } = supabase
        .storage
        .from('listing-images')
        .getPublicUrl(url)
      return data?.publicUrl
    }
    
    return null
  }

  const imageUrl = getImageUrl(listing.image_url)

  return (
    <div className="mb-4 border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image section */}
        <div className="w-full sm:w-48 h-48 relative">
          {imageUrl && !imageError ? (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="rounded-lg object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat('da-DK', { 
              style: 'currency', 
              currency: 'DKK' 
            }).format(listing.price)}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {listing.category}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Subcategory:</span> {listing.subcategory}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">{listing.description}</p>
        </div>
      </div>
    </div>
  )
}

export default ListingCard