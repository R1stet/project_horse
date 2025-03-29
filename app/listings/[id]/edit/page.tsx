'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ChevronDown } from "lucide-react"
import { useState, useEffect } from 'react'

// Define types
type Category = '' | 'Rytter' | 'Hest' | 'Stald'
type Condition = '' | 'Helt ny - uåbnet/med prismærke' | 'Som ny - ingen synlige brugsspor' | 'Brugt - men i god stand' | 'Brugt - med synlige brugsspor'

type SubCategory = {
  '': string[]
  'Rytter': string[]
  'Hest': string[]
  'Stald': string[]
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  // Create the component directly in the page
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </main>
      }>
        <EditListingForm id={params.id} />
      </Suspense>
      <Footer />
    </div>
  )
}

// Form component defined in the same file
function EditListingForm({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()
  
  // Form state
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('')
  const [subcategory, setSubcategory] = useState('')
  const [condition, setCondition] = useState<Condition>('')
  const [brand, setBrand] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Subcategories mapping
  const subcategories: SubCategory = {
    '': [],
    'Rytter': ['Caps', 'Accessories', 'Airbags', 'Tasker', 'Støvler', 'Ridebukser', 'Ridehjelme', 'Handsker', 'Sundhedsteknologi', 'Jakker', 'Strik', 'Polos', 'Sweatshirts', 'Skjorter', 'Sikkerhedsveste', 'Stigbøjler', 'T-Shirts'],
    'Hest': ['Bandager', 'Bid', 'Fortøj & Hjælpetøjler', 'Trenser & Grimer', 'Pleje', 'Ørenet', 'Gjorde', 'Sadelunderlag', 'Sundhedsteknologi', 'Dækkener', 'Gamacher', 'Sadler', 'Sadelpads'],
    'Stald': ['Snacks', 'Tilskudsfoder']
  }

  // Brands list
  const brands = [
    'Acavallo', 'Ariat', 'Back on Track', 'Borstiq farm', 'Boxbear', 'Brogaarden',
    'By Weber', 'By Wilton', 'Carr & Day & Martin', 'Casco', 'Cashel', 'Catago',
    'Cavalleria Toscana', 'Cavallo', 'Collonil', 'Compositi', 'CWD', 'De Niro Boots',
    'Dubarry', 'Dyon', 'Elt', 'Emin', 'Equestrian Stockholm', 'Equick',
    'Equidan Vetline', 'Equine America', 'Equine lts', 'Equipage', 'Equisoft',
    'Equsana', 'Eskadron', 'Fager', 'Fairplay', 'Finesse Bridles', 'Fir-tech - Catago',
    'Fleck', 'Freejump', 'Grooming Deluxe', 'Harry\'s horse', 'Herman Sprenger',
    'HELITE', 'Hit-air', 'Hkm', 'Horseguard', 'Horseware', 'Incrediwear',
    'Humma Kæpheste', 'Karlslund', 'Kask Equestrian', 'Kentucky Horsewear',
    'Kep Italia', 'Kingsland', 'Kingsland Classic', 'Komperdell', 'Lemieux',
    'Leovet', 'Likit', 'Lyngsøe', 'Medilamb', 'Montar', 'Mountain Horse',
    'Myler bid', 'Naff', 'Nathalie Horse Care', 'Nettex', 'Neue Schule Bits',
    'Nikwax', 'NORDIC HORSE', 'Ogilvy', 'One K', 'One K Design selv ridehjelme',
    'Os - Otto Schumacher', 'Parisol', 'Passier', 'Pikeur', 'Professional\'s Choice',
    'Q-pet', 'Quick Knot', 'Rambo', 'Rider By Horse', 'Riders Company', 'Roeckl',
    'Royal Steel', 'Samshield', 'Samshield ridehjelme', 'Scharf', 'Schockemöhle',
    'SD Design', 'Seeland', 'Seaver', 'Siccaro', 'Sleekez', 'Solanum', 'Sprenger',
    'St. Hippolyt', 'Stud Muffins', 'STÜBBEN', 'Swing', 'Thermatex',
    'Tommy Hilfiger Equestrian', 'Trolle Projects', 'Tucci', 'Twinkle', 'Veredus',
    'Vestrum', 'VIP Equestrian', 'Waldhausen', 'Werner Christ', 'Wintec', 'Woof wear'
  ].sort();

  // Condition options
  const conditionOptions: Condition[] = [
    'Helt ny - uåbnet/med prismærke',
    'Som ny - ingen synlige brugsspor',
    'Brugt - men i god stand',
    'Brugt - med synlige brugsspor'
  ]

  // Fetch listing data on component mount
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        // Verify that the user owns this listing
        if (data.user_id !== user?.id) {
          router.push('/dashboard')
          return
        }

        // Populate form with existing data
        setTitle(data.title || '')
        setPrice(data.price?.toString() || '')
        setDescription(data.description || '')
        setCategory(data.category as Category || '')
        setSubcategory(data.subcategory || '')
        setCondition(data.condition as Condition || '')
        setBrand(data.brand || '')
        setExistingImageUrl(data.image_url)
      } catch (err: any) {
        console.error('Error fetching listing:', err)
        setError('Failed to load listing data')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchListing()
  }, [id, router, supabase])

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

      setImage(file)
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

      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!category) {
      setError('Please select a category')
      return
    }
    
    if (!subcategory) {
      setError('Please select a subcategory')
      return
    }
    
    if (!condition) {
      setError('Please select a condition')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      let imageUrl = existingImageUrl

      // Handle image upload if a new image is selected
      if (image) {
        try {
          // Create unique file name with timestamp
          const fileExt = image.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          // Upload image
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, image, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName)

          imageUrl = urlData.publicUrl

          console.log('Upload successful:', {
            fileName,
            publicUrl: imageUrl
          })
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError)
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }
      }

      // Update the listing
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          title,
          price: parseFloat(price),
          description,
          category,
          subcategory,
          condition,
          brand,
          image_url: imageUrl
        })
        .eq('id', id)

      if (listingError) throw listingError

      setSuccess('Listing updated successfully!')
      
      // Redirect to dashboard after short delay
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setError(err.message || 'Error updating listing')
    } finally {
      setLoading(false)
    }
  }

  // Custom select component style classes
  const selectWrapperClasses = "relative"
  const selectClasses = "appearance-none mt-1 block w-full px-3 py-2.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-gray-700"
  const selectIconClasses = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none transition-transform duration-200"

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  return (
    <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Listing</h1>

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

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category)
                  setSubcategory('') // Reset subcategory when category changes
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
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className={selectClasses}
                required
              >
                <option value="">Vælg en underkategori</option>
                {subcategories[category].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <ChevronDown className={selectIconClasses} size={18} />
            </div>
          </div>

          {/* Brand - New Section */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            <div className={selectWrapperClasses}>
              <select
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={selectClasses}
              >
                <option value="">Vælg brand (valgfrit)</option>
                {brands.map((brandOption) => (
                  <option key={brandOption} value={brandOption}>{brandOption}</option>
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
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                ) : existingImageUrl ? (
                  <div className="mb-4">
                    <img
                      src={existingImageUrl}
                      alt="Current image"
                      className="mx-auto h-32 w-auto"
                    />
                    <p className="text-xs text-gray-500 mt-2">Current image</p>
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
                    <span>{existingImageUrl ? 'Change image' : 'Upload a file'}</span>
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
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Updating listing...
              </div>
            ) : (
              'Update Listing'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}