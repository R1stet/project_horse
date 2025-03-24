"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface MegaMenuProps {
  categories: {
    name: string;
    subcategories: {
      name: string;
      items: {
        name: string;
        slug: string;
      }[];
    }[];
  }[];
}

const MegaMenu: React.FC<MegaMenuProps> = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (category: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTransitioning(true);
    setActiveCategory(category);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 50);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 300);
  };

  const handleItemClick = (slug: string, category: string, subcategory: string) => {
    router.push(`/listings?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
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
            className={`px-3 py-2 font-medium text-lg transition-colors relative ${
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
              style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
            >
              <div className="p-6">
                <div className="grid grid-cols-3 gap-8">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.name} className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        {subcategory.name}
                      </h3>
                      <ul className="space-y-3">
                        {subcategory.items.map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => handleItemClick(item.slug, category.name, subcategory.name)}
                              className="text-sm text-gray-600 hover:text-black hover:font-bold"
                            >
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 rounded-b-xl">
                <button 
                  className="text-xs text-gray-600 hover:text-black hover:font-bold"
                  onClick={() => router.push(`/listings?category=${encodeURIComponent(category.name)}`)}
                >
                  Se alle {category.name.toLowerCase()} produkter
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