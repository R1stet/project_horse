'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowLeft, ImageOff, Save } from 'lucide-react'
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

export default function EditListingPage({ params }: { params: { id: string } }) {
  // Unwrap params with React.use() to fix the error
  const unwrappedParams = use(params as any) as { id: string };
  const listingId = unwrappedParams.id;
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    location: '',
    category: '',
    subcategory: '',
    description: ''
  })
  
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
        router.push('/login')
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
          // Initialize form data
          setFormData({
            title: data.title || '',
            price: data.price || 0,
            location: data.location || '',
            category: data.category || '',
            subcategory: data.subcategory || '',
            description: data.description || ''
          })
          
          // Set image preview if there's an image
          if (data.image_url) {
            setImagePreview(getImageUrl(data.image_url))
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
  }, [listingId, router, supabase]) // Use unwrapped parameter instead of params.id

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!listing || !user) return
    if (user.id !== listing.user_id) {
      setError('You do not have permission to edit this listing')
      return
    }
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      let updatedImagePath = listing.image_url
      
      // If there's a new image, upload it
      if (imageFile) {
        // Generate a unique file name
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('listing-images')
          .upload(fileName, imageFile, {
            upsert: true
          })
        
        if (uploadError) {
          throw uploadError
        }
        
        updatedImagePath = fileName
      }
      
      // Update the listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          price: formData.price,
          location: formData.location,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          image_url: updatedImagePath
        })
        .eq('id', listing.id)
        .eq('user_id', user.id)
      
      if (updateError) {
        throw updateError
      }
      
      setSuccess('Listing updated successfully')
      
      // Navigate back to the listing after a short delay
      setTimeout(() => {
        router.push(`/listings/${listing.id}`)
      }, 1500)
    } catch (err: any) {
      console.error('Error updating listing:', err)
      setError(err.message || 'Failed to update listing')
    } finally {
      setSaving(false)
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

  if (error && !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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

  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>You do not have permission to edit this listing</AlertDescription>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to listing
          </button>

          <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>

          {/* Error and Success Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  <option value="Ranch">Ranch</option>
                  <option value="Stable">Stable</option>
                  <option value="Training">Training</option>
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                
                {/* Current Image Preview */}
                {imagePreview ? (
                  <div className="mb-3">
                    <div className="w-full h-48 relative mb-2">
                      <Image
                        src={imagePreview}
                        alt="Listing preview"
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Current image</p>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-md mb-3">
                    <ImageOff className="text-gray-400" size={32} />
                  </div>
                )}
                
                {/* Image Upload */}
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload a new image to replace the current one (optional)
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}