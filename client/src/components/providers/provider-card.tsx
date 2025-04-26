import { MapPin, GraduationCap, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface ProviderCardProps {
  provider: {
    id: number;
    name: string;
    type: string;
    rating: number;
    reviewCount: number;
    location: string;
    education: string;
    specializations: string[];
    startingPrice: string;
    isTopRated?: boolean;
    isAvailable24_7?: boolean;
    imageUrl: string;
  };
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  // Ensure image URLs are properly formatted - use the image uploaded by the user
  let imageUrl = provider.imageUrl;
  
  // For debugging
  console.log(`Provider ${provider.id}:`, provider.name);
  console.log("Image URL being used:", imageUrl);
  
  return (
    <Card className="card-hover bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="relative">
        {imageUrl && 
         imageUrl !== '/placeholder-avatar.jpg' && 
         imageUrl !== 'undefined' && 
         imageUrl !== 'null' ? (
          <img 
            src={imageUrl} 
            alt={`${provider.name} portrait`} 
            className="w-full h-48 object-cover transition-transform hover:scale-105"
            onError={(e) => {
              console.log("Image failed to load:", imageUrl);
              e.currentTarget.src = "https://placehold.co/400x200/e0e0e0/6c757d?text=Provider";
            }}
          />
        ) : (
          <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
            <User className="h-16 w-16 text-neutral-400" />
          </div>
        )}
        {provider.isTopRated && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-lg text-sm font-medium fade-in">
            Top Rated
          </div>
        )}
        {provider.isAvailable24_7 && (
          <div className="absolute top-3 right-3 bg-secondary text-white px-2 py-1 rounded-lg text-sm font-medium fade-in">
            Available 24/7
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{provider.name}</h3>
            <p className="text-neutral-600">{provider.type}</p>
          </div>
          <div className="flex items-center">
            <span className="text-amber-500 font-medium">{provider.rating}</span>
            <Star className="ml-1 text-amber-500 h-4 w-4 fill-current" />
            <span className="text-neutral-500 text-sm ml-1">({provider.reviewCount})</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-neutral-600 mb-3">
          <MapPin className="mr-2 text-neutral-500 h-4 w-4" />
          <span>{provider.location}</span>
        </div>
        <div className="flex items-center text-sm text-neutral-600 mb-4">
          <GraduationCap className="mr-2 text-neutral-500 h-4 w-4" />
          <span>{provider.education}</span>
        </div>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {provider.specializations.map((spec, index) => (
              <Badge key={index} variant="secondary" className="bg-primary-50 text-primary-700 hover:bg-primary-100">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-neutral-200 p-5 flex justify-between items-center">
        <div className="slide-in-right">
          <p className="text-sm text-neutral-500">Starting from</p>
          <p className="font-semibold text-neutral-800 text-primary">{provider.startingPrice}</p>
        </div>
        <Button asChild className="btn-transition hover-up">
          <Link href={`/providers/${provider.id}`}>
            View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
