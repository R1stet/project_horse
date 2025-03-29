'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Loader2, Camera, X, Check, Edit2, CreditCard, ShieldCheck } from "lucide-react"
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
        fetchUserProfile(user.id)
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createUserProfile(userId)
        } else {
          console.error('Error fetching profile:', error)
        }
      } else if (data) {
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Create a user profile if one doesn't exist
  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email || ''

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: email.split('@')[0], // Use the first part of email as username
          avatar_url: null,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating profile:', error)
      } else {
        setUsername(email.split('@')[0])
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

  // Placeholder functions for future features
  const handleBecomeSeller = () => {
    // In future: Redirect to Stripe
    setSuccess('Seller functionality coming soon!')
  }

  const handleVerifyProfile = () => {
    // In future: Redirect to verification page
    setSuccess('Verification functionality coming soon!')
  }

  // Handle click on a listing to navigate to its detail page
  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3376]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1B3376] mb-8">Account Settings</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-[#E0E4F1] text-[#1B3376] border-[#7A8CC0] border-2">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white shadow-md rounded-lg border-2 border-[#E0E4F1] divide-y-2 divide-[#E0E4F1]">
            {/* Profile Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#1B3376] mb-4">Profile</h2>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-[#E0E4F1] flex items-center justify-center border-2 border-[#7A8CC0]">
                    {avatarLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-[#7A8CC0]" />
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
                      <div className="h-full w-full flex items-center justify-center text-[#1B3376] text-2xl font-medium">
                        {username ? username.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#1B3376] text-white p-2 rounded-full shadow-md hover:bg-[#142759] transition-colors border-2 border-white"
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
                    <label className="block text-sm font-medium text-[#472A1A] mb-1">
                      Username
                    </label>
                    {editingUsername ? (
                      <div className="flex">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#7A8CC0] rounded-md shadow-sm focus:outline-none focus:ring-[#1B3376] focus:border-[#1B3376] mr-2"
                        />
                        <button
                          onClick={handleUpdateUsername}
                          disabled={updateLoading}
                          className="p-2 bg-[#1B3376] text-white rounded-md hover:bg-[#142759] border-2 border-[#1B3376]"
                        >
                          {updateLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check size={20} />}
                        </button>
                        <button
                          onClick={() => setEditingUsername(false)}
                          className="p-2 bg-[#E0E4F1] text-[#1B3376] rounded-md hover:bg-[#7A8CC0] ml-2 border-2 border-[#7A8CC0]"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-[#1B3376] font-medium">{username || 'No username set'}</span>
                        <button
                          onClick={() => setEditingUsername(true)}
                          className="ml-2 p-1 text-[#7A8CC0] hover:text-[#1B3376]"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#472A1A] mb-1">
                      Email Address
                    </label>
                    <div className="text-[#1B3376] font-medium">{email}</div>
                  </div>
                </div>
              </div>
              
              {/* Account action buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBecomeSeller}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#472A1A] text-white rounded-md hover:bg-[#331D12] transition-colors font-medium shadow-md border-2 border-[#472A1A]"
                >
                  <CreditCard size={18} />
                  <span>Bliv Sælger</span>
                </button>
                
                <button
                  onClick={handleVerifyProfile}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#7A8CC0] text-white rounded-md hover:bg-[#5A6B9C] transition-colors font-medium shadow-md border-2 border-[#7A8CC0]"
                >
                  <ShieldCheck size={18} />
                  <span>Verificér din profil</span>
                </button>
              </div>
            </div>
            
            {/* Password Update Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#1B3376] mb-4">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#472A1A]">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#7A8CC0] rounded-md shadow-sm focus:outline-none focus:ring-[#1B3376] focus:border-[#1B3376]"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#472A1A]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#7A8CC0] rounded-md shadow-sm focus:outline-none focus:ring-[#1B3376] focus:border-[#1B3376]"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full flex justify-center py-3 px-4 border-2 border-[#1B3376] rounded-md shadow-md text-sm font-medium text-white bg-[#1B3376] hover:bg-[#142759] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B3376] disabled:opacity-50"
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
                <h2 className="text-xl font-semibold text-[#1B3376]">My Listings</h2>
                <button
                  onClick={() => router.push('/create_listing')}
                  className="px-6 py-3 text-sm font-medium text-white bg-[#1B3376] border-2 border-[#1B3376] rounded-md hover:bg-[#142759] shadow-md"
                >
                  Create New Listing
                </button>
              </div>

              {loadingListings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#7A8CC0]" />
                </div>
              ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {listings.map((listing) => (
                    <div 
                      key={listing.id} 
                      className="cursor-pointer border-2 border-[#E0E4F1] rounded-md hover:shadow-lg transition-shadow duration-200"
                      onClick={() => handleListingClick(listing.id)}
                    >
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-3 border-dashed border-[#7A8CC0] rounded-lg bg-[#F8F9FC]">
                  <p className="text-[#1B3376] font-medium">You haven't created any listings yet.</p>
                  <p className="text-sm text-[#472A1A] mt-2">
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