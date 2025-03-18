'use client'

import { FC } from 'react';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Star, 
  Clock,
  House,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ListingDetails {
  id: string;
  title: string;
  breed: string;
  age: number;
  price: number;
  location: string;
  description: string;
  createdAt: string;
  seller: {
    name: string;
    rating: number;
    totalListings: number;
  };
  images: string[];
  features: string[];
}

interface ListingDetailsProps {
  listing: ListingDetails;
}

const ListingDetailsComponent: FC<ListingDetailsProps> = ({ listing }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Main Image Gallery */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative h-96 rounded-lg overflow-hidden">
          <img
            src={listing.images[0] || "/api/placeholder/800/600"}
            alt={listing.title}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {listing.images.slice(1, 5).map((image, index) => (
            <div key={index} className="relative h-44 rounded-lg overflow-hidden">
              <img
                src={image || "/api/placeholder/400/300"}
                alt={`${listing.title} - ${index + 2}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <House className="w-5 h-5 text-gray-600" />
                  <span>Breed: {listing.breed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span>Age: {listing.age} years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-line">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {listing.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Price and Seller Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <DollarSign className="w-6 h-6" />
                {listing.price.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-12 h-12 text-gray-600" />
                  <div>
                    <h3 className="font-semibold">{listing.seller.name}</h3>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span>{listing.seller.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {listing.seller.totalListings} total listings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;