'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ArrowLeft, ChevronDown, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { use } from 'react'

// Define types
type Category = '' | 'Rytter' | 'Hest' | 'Stald'
type Condition = '' | 'Helt ny - uåbnet/med prismærke' | 'Som ny - ingen synlige brugsspor' | 'Brugt - men i god stand' | 'Brugt - med synlige brugsspor'

type SubCategory = {
  '': string[]
  'Rytter': string[]
  'Hest': string[]
  'Stald': string[]
}

interface Listing {
  id: string
  title: string
  price: number
  category: string
  subcategory?: string
  description: string
  image_url: string
  condition: string
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
    category: '' as Category,
    subcategory: '',
    description: '',
    condition: '' as Condition
  })
  
  const router = useRouter()
  const supabase = createClient()

  // Subcategories mapping
  const subcategories: SubCategory = {
    '': [],
    'Rytter': ['Caps', 'Accessories', 'Airbags', 'Tasker', 'Støvler', 'Ridebukser', 'Ridehjelme', 'Handsker', 'Sundhedsteknologi', 'Jakker', 'Strik', 'Polos', 'Sweatshirts', 'Skjorter', 'Sikkerhedsveste', 'Stigbøjler', 'T-Shirts'],
    'Hest': ['Bandager', 'Bid', 'Fortøj & Hjælpetøjler', 'Trenser & Grimer', 'Pleje', 'Ørenet', 'Gjorde', 'Sadelunderlag', 'Sundhedsteknologi', 'Dækkener', 'Gamacher', 'Sadler', 'Sadelpads'],
    'Stald': ['Snacks', 'Tilskudsfoder']
  }

  // Condition options
  const conditionOptions: Condition[] = [
    'Helt ny - uåbnet/med prismærke',
    'Som ny - ingen synlige brugsspor',
    'Brugt - men i god stand',
    'Brugt - med synlige brugsspor'
  ]

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
          .eq('id', listingId)
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
            category: (data.category as Category) || '',
            subcategory: data.subcategory || '',
            description: data.description || '',
            condition: (data.condition as Condition) || ''
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
  }, [listingId, router, supabase])

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
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or GIF image')
        return
      }

      setImageFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or GIF image')
        return
      }

      setImageFile(file)
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
    
    // Validate form
    if (!formData.category) {
      setError('Please select a category')
      return
    }
    
    if (!formData.subcategory) {
      setError('Please select a subcategory')
      return
    }
    
    if (!formData.condition) {
      setError('Please select a condition')
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
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          condition: formData.condition,
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

  // Custom select component style classes
  const selectWrapperClasses = "relative"
  const selectClasses = "appearance-none mt-1 block w-full px-3 py-2.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-gray-700"
  const selectIconClasses = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none transition-transform duration-200"

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
      
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to listing
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Listing</h1>

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
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price (DKK)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                required
              />
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className={selectWrapperClasses}>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category: e.target.value as Category,
                      subcategory: '' // Reset subcategory when category changes
                    })
                  }}
                  className={selectClasses}
                  required
                >
                  <option value="">Vælg kategori</option>
                  <option value="Rytter">Rytter</option>
                  <option value="Hest">Hest</option>
                  <option value="Stald">Stald</option>
                </select>
                <ChevronDown className={selectIconClasses} size={18} />
              </div>
            </div>

            {/* Subcategory */}
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <div className={selectWrapperClasses}>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className={selectClasses}
                  required
                >
                  <option value="">Vælg en underkategori</option>
                  {subcategories[formData.category].map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <ChevronDown className={selectIconClasses} size={18} />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                Condition
              </label>
              <div className={selectWrapperClasses}>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value as Condition})}
                  className={selectClasses}
                  required
                >
                  <option value="">Vælg stand</option>
                  {conditionOptions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
                <ChevronDown className={selectIconClasses} size={18} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors duration-200 cursor-pointer"
              >
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-auto"
                      />
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Saving changes...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save size={18} className="mr-2" />
                  Save Changes
                </div>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}