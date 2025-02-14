import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function FrontPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full h-96 bg-gray-100 flex items-center justify-center">
          <h2 className="text-2xl text-gray-600">Insert stuff here</h2>
        </section>

        {/* Brands Section */}
        <section className="w-full h-48 bg-white flex items-center justify-center">
          <h2 className="text-2xl text-gray-600">Insert stuff here</h2>
        </section>

        {/* Featured Ads Section */}
        <section className="w-full h-96 bg-gray-100 flex items-center justify-center">
          <h2 className="text-2xl text-gray-600">Insert stuff here</h2>
        </section>
      </main>

      <Footer />
    </div>
  );
}