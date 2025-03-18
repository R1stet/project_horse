'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'  // Added this import
import { Search, Filter, Grid, List, Loader2, ImageOff } from 'lucide-react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

interface Listing {
  id: string
  title: string
  price: number
  location: string
  category: string
  image_url: string
  rating: number
  user_id?: string
  created_at?: string
  description?: string
  subcategory?: string
}

export default function MarketplacePage() {
  const router = useRouter()  // Added router initialization
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    priceRange: '',
    location: '',
    rating: ''
  })
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Function to get the correct image URL - same as in ListingCard
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

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch listings from database
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          console.log('Fetched listings:', data)
          setListings(data)
        }
      } catch (err: any) {
        console.error('Error fetching listings:', err)
        setError(err.message || 'Failed to fetch listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [supabase])

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedFilters.category || listing.category === selectedFilters.category
    
    // Price range filter
    let matchesPriceRange = true
    if (selectedFilters.priceRange) {
      const [min, max] = selectedFilters.priceRange.split('-')
      if (min && max) {
        matchesPriceRange = listing.price >= Number(min) && listing.price <= Number(max)
      } else if (min && min.includes('+')) {
        const minValue = Number(min.replace('+', ''))
        matchesPriceRange = listing.price >= minValue
      }
    }
    
    // Location filter
    const matchesLocation = !selectedFilters.location || listing.location === selectedFilters.location
    
    // Rating filter
    let matchesRating = true
    if (selectedFilters.rating) {
      matchesRating = listing.rating >= Number(selectedFilters.rating)
    }
    
    return matchesSearch && matchesCategory && matchesPriceRange && matchesLocation && matchesRating
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg shadow sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} />
                <h2 className="font-semibold">Filters</h2>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedFilters.category}
                  onChange={(e) => setSelectedFilters({...selectedFilters, category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  <option value="Ranch">Ranch</option>
                  <option value="Stable">Stable</option>
                  <option value="Training">Training</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedFilters.priceRange}
                  onChange={(e) => setSelectedFilters({...selectedFilters, priceRange: e.target.value})}
                >
                  <option value="">Any Price</option>
                  <option value="0-100000">Under $100,000</option>
                  <option value="100000-250000">$100,000 - $250,000</option>
                  <option value="250000+">$250,000+</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedFilters.location}
                  onChange={(e) => setSelectedFilters({...selectedFilters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  <option value="Montana">Montana</option>
                  <option value="Texas">Texas</option>
                  <option value="Kentucky">Kentucky</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedFilters.rating}
                  onChange={(e) => setSelectedFilters({...selectedFilters, rating: e.target.value})}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="flex justify-end mb-4 gap-2">
              <button
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">Error: {error}</p>
                <p className="text-gray-600 mt-2">Please try refreshing the page.</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No listings found matching your filters.</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : (
              /* Listings */
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredListings.map((listing) => {
                  // Get the image URL for each listing
                  const imageUrl = getImageUrl(listing.image_url);
                  
                  return (
                    <div
                      key={listing.id}
                      className={`bg-white rounded-lg shadow overflow-hidden ${
                        viewMode === 'list' ? 'flex' : ''
                      } cursor-pointer hover:shadow-lg transition-shadow duration-200`}
                      onClick={() => router.push(`/listings/${listing.id}`)}
                    >
                      <div className={viewMode === 'list' ? 'w-48 h-48 relative' : 'w-full h-48 relative'}>
                        {imageUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={imageUrl}
                              alt={listing.title || 'Listing image'}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.log(`Image failed to load: ${imageUrl}`);
                                // Reset src to placeholder
                                const imgElement = e.target as HTMLImageElement;
                                imgElement.src = '/api/placeholder/400/300';
                              }}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ImageOff className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                        <p className="text-gray-600 mb-2">{listing.location}</p>
                        <p className="text-blue-600 font-semibold">${listing.price.toLocaleString()}</p>
                        <div className="mt-2 flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1">{listing.rating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}