"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MobileMegaMenuProps {
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
  onClose: () => void;
}

const MobileMegaMenu: React.FC<MobileMegaMenuProps> = ({ categories, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const router = useRouter();

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category);
    setActiveSubcategory(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setActiveSubcategory(subcategory === activeSubcategory ? null : subcategory);
  };

  const handleItemClick = (slug: string) => {
    router.push(`/listings/${slug}`);
    onClose();
  };

  return (
    <div className="px-4 pt-2 pb-3 space-y-1">
      {categories.map((category) => (
        <div key={category.name} className="border-b border-gray-100 pb-2">
          <button
            className={`flex justify-between items-center w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors text-left ${
              activeCategory === category.name 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
            onClick={() => handleCategoryClick(category.name)}
          >
            <div className="flex items-center">
              {category.name === 'TIL RYTTEREN' && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {category.name === 'TIL HESTEN' && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {category.name === 'TIL STALDEN' && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
              {category.name}
            </div>
            <svg 
              className={`w-4 h-4 transform transition-transform ${activeCategory === category.name ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {activeCategory === category.name && (
            <div className="pl-4 mt-1 space-y-1">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.name}>
                  <button
                    className={`flex justify-between items-center w-full px-4 py-2 text-sm transition-colors text-left rounded-lg ${
                      activeSubcategory === subcategory.name 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubcategoryClick(subcategory.name)}
                  >
                    <span className="font-medium">{subcategory.name}</span>
                    <svg 
                      className={`w-3 h-3 transform transition-transform ${activeSubcategory === subcategory.name ? 'rotate-180 text-blue-600' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {activeSubcategory === subcategory.name && (
                    <div className="pl-6 mt-1 space-y-1">
                      {subcategory.items.map((item) => (
                        <button
                          key={item.name}
                          className="block w-full text-left px-4 py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg text-sm transition-colors flex items-center justify-between"
                          onClick={() => handleItemClick(item.slug)}
                        >
                          <span>{item.name}</span>
                          <svg 
                            className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MobileMegaMenu;