"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import MegaMenu, { MegaMenuProps } from './MegaMenu';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  // Define the mega menu structure with new categories and subcategories
  const megaMenuCategories = [
    {
      name: 'Rytter',
      subcategories: [
        {
          name: 'Tøj',
          items: [
            { name: 'Ridebukser', slug: 'ridebukser' },
            { name: 'Jakker', slug: 'jakker' },
            { name: 'Strik', slug: 'strik' },
            { name: 'Polos', slug: 'polos' },
            { name: 'Sweatshirts', slug: 'sweatshirts' },
            { name: 'Skjorter', slug: 'skjorter' },
            { name: 'T-Shirts', slug: 't-shirts' }
          ]
        },
        {
          name: 'Sikkerhed',
          items: [
            { name: 'Ridehjelme', slug: 'ridehjelme' },
            { name: 'Sikkerhedsveste', slug: 'sikkerhedsveste' },
            { name: 'Airbags', slug: 'airbags' }
          ]
        },
        {
          name: 'Tilbehør',
          items: [
            { name: 'Caps', slug: 'caps' },
            { name: 'Accessories', slug: 'accessories' },
            { name: 'Tasker', slug: 'tasker' },
            { name: 'Støvler', slug: 'stovler' },
            { name: 'Handsker', slug: 'handsker' },
            { name: 'Stigbøjler', slug: 'stigbojler' },
            { name: 'Sundhedsteknologi', slug: 'sundhedsteknologi-rytter' }
          ]
        }
      ]
    },
    {
      name: 'Hest',
      subcategories: [
        {
          name: 'Udrustning',
          items: [
            { name: 'Sadler', slug: 'sadler' },
            { name: 'Sadelpads', slug: 'sadelpads' },
            { name: 'Trenser & Grimer', slug: 'trenser-grimer' },
            { name: 'Bid', slug: 'bid' },
            { name: 'Fortøj & Hjælpetøjler', slug: 'fortoj-hjaelpetojler' },
            { name: 'Gjorde', slug: 'gjorde' }
          ]
        },
        {
          name: 'Beskyttelse',
          items: [
            { name: 'Dækkener', slug: 'daekkener' },
            { name: 'Bandager', slug: 'bandager' },
            { name: 'Gamacher', slug: 'gamacher' },
            { name: 'Ørenet', slug: 'orenet' }
          ]
        },
        {
          name: 'Pleje & Sundhed',
          items: [
            { name: 'Pleje', slug: 'pleje' },
            { name: 'Sadelunderlag', slug: 'sadelunderlag' },
            { name: 'Sundhedsteknologi', slug: 'sundhedsteknologi-hest' }
          ]
        }
      ]
    },
    {
      name: 'Stald',
      subcategories: [
        {
          name: 'Foder',
          items: [
            { name: 'Snacks', slug: 'snacks' },
            { name: 'Tilskudsfoder', slug: 'tilskudsfoder' }
          ]
        }
      ]
    }
  ];

  // For mobile view: simplified categories for the mobile menu
  const mobileCategoryItems = [
    { name: 'Rytter', subcategories: ['Tøj', 'Sikkerhed', 'Tilbehør'] },
    { name: 'Hest', subcategories: ['Udrustning', 'Beskyttelse', 'Pleje & Sundhed'] },
    { name: 'Stald', subcategories: ['Foder'] }
  ];

  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const toggleMobileCategory = (category: string) => {
    if (expandedMobileCategory === category) {
      setExpandedMobileCategory(null);
    } else {
      setExpandedMobileCategory(category);
    }
  };

  const renderAuthButtons = () => {
    // For desktop view (logged in state only)
    if (isLoading) {
      // Show skeleton loader while auth state is loading
      return (
        <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      );
    }

    if (user) {
      // If logged in, show the dropdown menu.
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-full p-1 pl-3 pr-1 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col justify-between h-4 w-5">
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
                <div className="w-full h-0.5 bg-gray-600"></div>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-2 p-2">
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/dashboard')}
            >
              Min Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/dashboard')}
            >
              XYZ
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/wishlist')}
            >
              Ønskelister
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/host')}
            >
              XYZ
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/account')}
            >
              XYZ
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/gift-cards')}
            >
              XYZ
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={() => router.push('/help')}
            >
              Hjælpecenter
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
              onClick={handleSignOut}
            >
              Log ud
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // When not logged in, no dropdown is rendered in the desktop view.
    return null;
  };

  const renderMobileAuthButtons = () => {
    // For mobile view
    if (isLoading) {
      return (
        <div className="flex justify-center py-4">
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      );
    }

    if (user) {
      // If logged in, show mobile menu items for authenticated users.
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {(user.email?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => router.push('/messages')}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
          >
            Beskeder
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
          >
            Rejser
          </button>
          <button
            onClick={() => router.push('/wishlist')}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
          >
            Ønskelister
          </button>
          <div className="border-t border-gray-100 my-2"></div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
          >
            Log ud
          </button>
        </div>
      );
    }

    // If not logged in, show two buttons: one for creating a new listing (redirects to /signup) and one for login.
    return (
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => router.push('/signup')}
          className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
        >
          Sælg nu
        </button>
        <button 
          onClick={() => router.push('/login')}
          className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
        >
          Login
        </button>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
              <span className="text-xl font-semibold text-gray-800">RideLikeAPro</span>
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

          {/* Mega Menu (Desktop) */}
          <MegaMenu categories={megaMenuCategories} />

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              // Skeleton loader while checking auth state
              <div className="flex space-x-4">
                <div className="h-10 w-36 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                <button 
                  onClick={() => router.push('/create_listing')}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Sælg nu
                </button>
                {renderAuthButtons()}
              </>
            ) : (
              <>
                <button 
                  onClick={() => router.push('/signup')}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Sælg nu
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {mobileCategoryItems.map((category) => (
              <div key={category.name} className="border-b border-gray-100 pb-2">
                <button
                  className="flex justify-between items-center w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors text-left"
                  onClick={() => toggleMobileCategory(category.name)}
                >
                  {category.name}
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${expandedMobileCategory === category.name ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedMobileCategory === category.name && (
                  <div className="pl-6 mt-1 space-y-1">
                    {category.subcategories.map((subcat) => (
                      <button
                        key={subcat}
                        className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                        onClick={() => {
                          // Navigate to listings with both category and subcategory filters
                          router.push(`/listings?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcat)}`);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {subcat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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