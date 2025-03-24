"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface MegaMenuProps {
  categories: Array<{
    name: string;
    subcategories: Array<{
      name: string;
      items: Array<{
        name: string;
        slug: string;
      }>;
    }>;
  }>;
}

const MegaMenu = ({ categories }: MegaMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (category: string) => {
    // Clear any existing timeout to prevent menu from disappearing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsTransitioning(true);
    setActiveCategory(category);
    // Small delay to make transition smoother
    setTimeout(() => {
      setIsTransitioning(false);
    }, 50);
  };

  const handleMouseLeave = () => {
    // Set a longer timeout before hiding the menu
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 300); // 300ms delay before menu disappears
  };

  const handleItemClick = (slug: string) => {
    router.push(`/listings/${slug}`);
  };

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {categories.map((category) => (
        <div
          key={category.name}
          className="relative group"
          onMouseEnter={() => handleMouseEnter(category.name)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`px-3 py-2 font-medium text-sm transition-colors relative ${
              activeCategory === category.name 
                ? 'text-black font-bold' 
                : 'text-gray-700 hover:text-black hover:font-bold'
            }`}
          >
            {category.name}
            {activeCategory === category.name && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full"></span>
            )}
          </button>

          {activeCategory === category.name && (
            <div 
              className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-screen max-w-6xl bg-white border border-gray-100 rounded-xl shadow-xl z-50 transition-opacity duration-200 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto'
              }}
            >
              <div className="p-6">
                <div className="grid grid-cols-3 gap-8">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.name} className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">{subcategory.name}</h3>
                      <ul className="space-y-3">
                        {subcategory.items.map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => handleItemClick(item.slug)}
                              className="text-sm text-gray-600 hover:text-black hover:font-bold transition-colors flex items-center"
                            >
                              <span className="relative overflow-hidden hover:after:w-full">
                                {item.name}
                                {/* Underline effect using after pseudo-element that only shows on individual hover */}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black hover:w-full transition-all duration-300"></span>
                              </span>
                              <svg 
                                className="ml-1 w-3 h-3 opacity-0 hover:opacity-100 transform translate-x-0 hover:translate-x-1 transition-all duration-300" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 rounded-b-xl flex justify-between items-center">
                <span className="text-xs text-gray-500">Opdateret produktkatalog</span>
                <button 
                  className="text-xs text-gray-600 hover:text-black hover:font-bold font-medium flex items-center"
                  onClick={() => handleItemClick(`${category.name.toLowerCase().replace('til ', '')}/all`)}
                >
                  Se alle {category.name.toLowerCase().replace('til ', '')} produkter
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default MegaMenu;