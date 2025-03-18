"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const categories = ['TIL RYTTEREN', 'TIL HESTEN', 'TIL STALDEN', 'SE ALLE'] as const;
  type Category = typeof categories[number];
  
  const categoryRoutes: Record<Category, string | undefined> = {
    'TIL RYTTEREN': undefined,
    'TIL HESTEN': undefined,
    'TIL STALDEN': undefined,
    'SE ALLE': '/listings'
  };

  useEffect(() => {
    // Get initial auth state
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleCategoryClick = (category: Category) => {
    const route = categoryRoutes[category];
    if (route) {
      router.push(route);
    }
  };

  const renderAuthButtons = () => {
    if (isLoading) {
      return null;
    }

    if (user) {
      return (
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>
                  {(user.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleSignOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
        >
          Log in
        </button>
        <button 
          onClick={() => router.push('/signup')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign up
        </button>
      </>
    );
  };

  const renderMobileAuthButtons = () => {
    if (isLoading) {
      return null;
    }

    if (user) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata.avatar_url} />
              <AvatarFallback>
                {(user.email?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-center"
          >
            Profile
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-center"
          >
            Sign out
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => router.push('/login')}
          className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-center"
        >
          Log in
        </button>
        <button 
          onClick={() => router.push('/signup')}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Sign up
        </button>
      </div>
    );
  };

  // Rest of the component remains the same
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg"></div>
              <span className="text-xl font-semibold text-gray-800">Brand</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                {isMobileMenuOpen ? (
                  <div className="relative w-full h-full">
                    <div className="absolute w-full h-0.5 bg-gray-600 transform rotate-45 top-1/2"></div>
                    <div className="absolute w-full h-0.5 bg-gray-600 transform -rotate-45 top-1/2"></div>
                  </div>
                ) : (
                  <>
                    <div className="w-full h-0.5 bg-gray-600"></div>
                    <div className="w-full h-0.5 bg-gray-600"></div>
                    <div className="w-full h-0.5 bg-gray-600"></div>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {categories.map((category) => (
              <button
                key={category}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          {/* Auth Buttons or User Button */}
          <div className="hidden md:flex items-center space-x-4">
            {renderAuthButtons()}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                className="block w-full text-left px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="px-4 py-4 border-t border-gray-100">
            {renderMobileAuthButtons()}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;