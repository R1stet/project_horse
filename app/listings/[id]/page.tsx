'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowLeft, Edit, Trash2, ImageOff, MapPin, Share, Heart, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { use } from 'react'
import ListingCard from '@/components/ListingCard'

interface Listing {
  id: string
  title: string
  price: number
  location: string
  category: string
  subcategory?: string
  description: string
  image_url: string
  rating: number
  user_id: string
  created_at: string
  condition?: string
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  // Unwrap params with React.use() to fix the error
  const unwrappedParams = use(params as any) as { id: string };
  const listingId = unwrappedParams.id;
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [relatedListings, setRelatedListings] = useState<Listing[]>([])
  const [sellerName, setSellerName] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Function to get the correct image URL
  const getImageUrl = (url: string) => {
    if (!url) return null;
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      return url
    }
    
    // If it's just a path, get the public URL
    const { data } = supabase
      .storage
      .from('listing-images')
      .getPublicUrl(url)
    return data?.publicUrl
  }

  const nextImage = () => {
    if (listing?.image_url) {
      setCurrentImage((prev) => (prev + 1) % 1) // Currently only one image
    }
  }

  const prevImage = () => {
    if (listing?.image_url) {
      setCurrentImage((prev) => (prev - 1 + 1) % 1) // Currently only one image
    }
  }

  useEffect(() => {
    // Fetch current user
    const getUser = async () => {
      setUserLoading(true)
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error)
      } else {
        setUser(user)
      }
      setUserLoading(false)
    }

    // Fetch the listing details
    const fetchListing = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setListing(data)
          
          // Fetch seller name
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', data.user_id)
            .single()
            
          if (!userError && userData) {
            setSellerName(userData.username)
          }
          
          // Fetch related listings from the same category
          const { data: relatedData, error: relatedError } = await supabase
            .from('listings')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4)
            
          if (!relatedError && relatedData) {
            setRelatedListings(relatedData)
          }
        } else {
          setError('Listing not found')
        }
      } catch (err: any) {
        console.error('Error fetching listing:', err)
        setError(err.message || 'Failed to fetch listing')
      } finally {
        setLoading(false)
      }
    }

    getUser()
    fetchListing()
  }, [listingId, supabase])

  const handleDelete = async () => {
    if (!listing || !user) return
    
    setDeleting(true)
    
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id)
        .eq('user_id', user.id)
      
      if (error) {
        throw error
      }
      
      // Navigate back to the dashboard or listings page
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting listing:', err)
      setError(err.message || 'Failed to delete listing')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  // Check if current user is the owner
  const isOwner = !userLoading && user && listing && user.id === listing.user_id

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'Listing not found'}</AlertDescription>
            </Alert>
            <button 
              onClick={() => router.back()}
              className="mt-4 flex items-center text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Go back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const imageUrl = getImageUrl(listing.image_url)
  const images = imageUrl ? [imageUrl] : ['/api/placeholder/600/600']

  // Generate some product highlights based on the listing data
  const generateHighlights = () => {
    const baseHighlights = [
      `Quality ${listing.category} in ${listing.condition || 'great condition'}`,
      `Located in ${listing.location}`,
    ]
    
    if (listing.subcategory) {
      baseHighlights.push(`${listing.subcategory} type for best experience`)
    }
    
    return baseHighlights
  }

  const highlights = generateHighlights()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-background">
              <div className="absolute inset-0 flex items-center justify-center">
                {imageUrl ? (
                  <Image
                    src={images[currentImage]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="text-gray-400" size={48} />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative h-20 w-20 rounded-md border overflow-hidden ${
                      index === currentImage ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setCurrentImage(index)}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{listing.condition || 'Used'}</Badge>
              <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
              <div className="flex items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  Sold by{" "}
                  <Link href="#" className="text-primary hover:underline">
                    {sellerName || `User ${listing.user_id.substring(0, 6)}`}
                  </Link>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-3xl font-bold">{listing.price.toLocaleString()} kr DKK</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin size={16} className="mr-1" />
                <span>{listing.location}</span>
              </div>
            </div>

            <hr className="border-t border-gray-200 my-4" />

            <div className="space-y-2">
              <h3 className="font-medium">Product Highlights</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="flex-1" size="lg">
                <Share className="mr-2 h-5 w-5" />
                Share Listing
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setSaved(!saved)}
              >
                <Heart className={`mr-2 h-5 w-5 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save Listing"}
              </Button>
            </div>
            
            {/* Listed date */}
            <div className="py-2 flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2" size={16} />
              <span>Listed on {new Date(listing.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
              }).replace(/\//g, '.')}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Description</h2>
          <div className="space-y-4">
            <p>{listing.description}</p>
          </div>
        </div>
        
        {/* Owner Actions */}
        {isOwner && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Owner Actions</h2>
            {!deleteConfirm ? (
              <div className="flex space-x-4">
                <Button 
                  onClick={() => router.push(`/listings/${listing.id}/edit`)}
                  className="flex items-center"
                >
                  <Edit className="mr-2 h-5 w-5" /> Edit Listing
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center"
                >
                  <Trash2 className="mr-2 h-5 w-5" /> Delete Listing
                </Button>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="font-medium mb-3">
                  Are you sure you want to delete this listing? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="destructive"
                    className="flex items-center"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-5 w-5" /> Confirm Delete
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(false)}
                    variant="outline"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related Listings */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedListings.length > 0 ? (
              relatedListings.map((relatedListing) => (
                <ListingCard 
                  key={relatedListing.id}
                  listing={relatedListing}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                />
              ))
            ) : (
              // Placeholder cards when no related listings found
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-sm border border-gray-100 h-64 bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-400">No related listings found</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}