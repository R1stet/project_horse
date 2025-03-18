'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowLeft, Edit, Trash2, ImageOff } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { use } from 'react'

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
          .eq('id', listingId) // Use unwrapped parameter instead of params.id
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setListing(data)
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
  }, [listingId, supabase]) // Use unwrapped parameter instead of params.id

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
      <div className="min-h-screen flex flex-col">
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'Listing not found'}</AlertDescription>
            </Alert>
            <button 
              onClick={() => router.back()}
              className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to listings
          </button>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image Section */}
            <div className="w-full h-96 relative bg-gray-100">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="text-gray-400" size={48} />
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <p className="text-gray-600 mb-1">{listing.location}</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">${listing.price.toLocaleString()}</div>
              </div>

              <div className="flex items-center mt-2 mb-6">
                <span className="text-yellow-400">★</span>
                <span className="ml-1">{listing.rating}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Details</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Category:</span> {listing.category}</p>
                    {listing.subcategory && (
                      <p><span className="font-medium">Subcategory:</span> {listing.subcategory}</p>
                    )}
                    <p><span className="font-medium">Listed:</span> {new Date(listing.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold mb-3">Owner Actions</h2>
                  
                  {!deleteConfirm ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push(`/listings/${listing.id}/edit`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
                      >
                        <Edit size={16} className="mr-1" /> Edit Listing
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center hover:bg-red-700"
                      >
                        <Trash2 size={16} className="mr-1" /> Delete Listing
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-red-800 font-medium mb-3">Are you sure you want to delete this listing? This action cannot be undone.</p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                              Deleting...
                            </>
                          ) : (
                            'Confirm Delete'
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                          disabled={deleting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}