'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Loader2, Upload, Camera, X, Check, Edit2 } from "lucide-react"
import Image from 'next/image'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ListingCard from '@/components/ListingCard'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [loadingListings, setLoadingListings] = useState<boolean>(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          throw error || new Error('User not found')
        }
        setUser(user)
        setEmail(user.email || '')
        
        // Handle profile fetching with better error handling
        try {
          await fetchUserProfile(user.id)
        } catch (profileError) {
          console.error('Profile error:', profileError)
          // Set a default username even if profile fetch fails
          if (user.email) {
            setUsername(user.email.split('@')[0])
          }
        }
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, supabase])

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      // Use maybeSingle instead of single to avoid errors when no results are found
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      } 
      
      if (data) {
        // Profile exists, update state
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || null)
      } else {
        // Profile doesn't exist, create one
        console.log('No profile found, creating new profile')
        await createUserProfile(userId)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      throw error // Rethrow to handle in the parent function
    }
  }

  // Create a user profile if one doesn't exist
  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email || ''
      const defaultUsername = email.split('@')[0] || 'user'

      // Check if profile already exists first to avoid conflicts
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (existingProfile) {
        console.log('Profile already exists, skipping creation')
        setUsername(defaultUsername)
        return
      }

      // Use upsert instead of insert to handle both insert and update cases
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: defaultUsername,
          avatar_url: null,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id', 
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error creating profile:', error)
        
        // If there's an error, check if required fields are missing
        if (error.message.includes('violates not-null constraint')) {
          console.warn('Adding required fields and retrying')
          
          // Try again with all possible fields (in case of missing columns)
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              username: defaultUsername,
              avatar_url: null,
              updated_at: new Date().toISOString()
            })
            
          if (retryError) {
            console.error('Retry error:', retryError)
          } else {
            setUsername(defaultUsername)
          }
        }
      } else {
        setUsername(defaultUsername)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return
      setLoadingListings(true)
      setError(null)

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else if (data) {
        setListings(data)
      }

      setLoadingListings(false)
    }

    fetchListings()
  }, [user, supabase])

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size should be less than 2MB')
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please upload an image file (JPG, PNG, WEBP)')
      }

      // Upload to storage
      const fileName = `avatar-${user.id}-${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = data.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setSuccess('Profile picture updated successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setAvatarLoading(false)
    }
  }

  // Handle username update
  const handleUpdateUsername = async () => {
    if (!user) return
    setUpdateLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Username updated successfully')
      setEditingUsername(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update username')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle email update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdateLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error

      setSuccess('Email update initiated. Please check your new email for verification.')
    } catch (err: any) {
      setError(err.message || 'Failed to update email')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdateLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setUpdateLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setSuccess('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle click on a listing to navigate to its detail page
  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

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

          <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            {/* Profile Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {avatarLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    ) : avatarUrl ? (
                      <Image 
                        src={avatarUrl}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarUrl(null)}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-2xl font-medium">
                        {username ? username.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                    disabled={avatarLoading}
                  >
                    <Camera size={16} />
                  </button>
                  
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    {editingUsername ? (
                      <div className="flex">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mr-2"
                        />
                        <button
                          onClick={handleUpdateUsername}
                          disabled={updateLoading}
                          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          {updateLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check size={20} />}
                        </button>
                        <button
                          onClick={() => setEditingUsername(false)}
                          className="p-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 ml-2"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-gray-900">{username || 'No username set'}</span>
                        <button
                          onClick={() => setEditingUsername(true)}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="text-gray-900">{email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Update Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Email</h2>
              <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
                >
                  {updateLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Update Email'
                  )}
                </button>
              </form>
            </div>

            {/* Password Update Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
                >
                  {updateLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>

            {/* Listings Section */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Listings</h2>
                <button
                  onClick={() => router.push('/create_listing')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-md hover:opacity-90"
                >
                  Create New Listing
                </button>
              </div>

              {loadingListings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div 
                      key={listing.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                      onClick={() => handleListingClick(listing.id)}
                    >
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">You haven't created any listings yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click the "Create New Listing" button to get started!
                  </p>
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