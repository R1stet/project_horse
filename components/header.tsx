import React, { useState } from 'react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home'];

  return (
    <header className="relative bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-indigo-600 rounded-full"></div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                {isMobileMenuOpen ? (
                  // X icon
                  <div className="relative w-full h-full">
                    <div className="absolute w-full h-0.5 bg-current transform rotate-45 top-1/2"></div>
                    <div className="absolute w-full h-0.5 bg-current transform -rotate-45 top-1/2"></div>
                  </div>
                ) : (
                  // Hamburger icon
                  <>
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {categories.map((category) => (
              <button
                key={category}
                className="px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                {category}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Log in
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
                Log in
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;