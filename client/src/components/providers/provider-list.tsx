import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProviderCard from "./provider-card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Provider {
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
}

interface ProviderListProps {
  location?: string;
  filters?: {
    searchTerm?: string;
    specialization?: string;
    priceRange?: { min?: string; max?: string };
    availability?: string;
    rating?: string;
    location?: string;
  };
}

export default function ProviderList({ 
  location = "Bucharest", 
  filters = { } 
}: ProviderListProps) {
  const [sortBy, setSortBy] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Log filters to see what we're getting
  console.log("Current filters:", filters);
  
  const { data: providers, isLoading } = useQuery<Provider[]>({
    queryKey: ['/api/providers', filters, location],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      
      // Add search term if it exists
      if (filters.searchTerm) {
        params.append('searchTerm', filters.searchTerm);
        console.log("Adding searchTerm to request:", filters.searchTerm);
      }
      
      // Add specialization if it exists and is not null
      if (filters.specialization && filters.specialization !== "all") {
        params.append('specialization', filters.specialization);
        console.log("Adding specialization to request:", filters.specialization);
      }
      
      // Add price range if it exists
      if (filters.priceRange && 
          (filters.priceRange.min || filters.priceRange.max)) {
        params.append('priceRange', JSON.stringify(filters.priceRange));
        console.log("Adding priceRange to request:", filters.priceRange);
      }
      
      // Add availability if it exists
      if (filters.availability && filters.availability !== "any") {
        params.append('availability', filters.availability);
        console.log("Adding availability to request:", filters.availability);
      }
      
      // Add rating if it exists
      if (filters.rating && filters.rating !== "any") {
        params.append('rating', filters.rating);
        console.log("Adding rating to request:", filters.rating);
      }
      
      // Add location if it exists
      if (filters.location && filters.location !== "any") {
        params.append('location', filters.location);
        console.log("Adding location to request:", filters.location);
      }
      
      // Make the request with query params
      const queryString = params.toString();
      const url = `/api/providers${queryString ? `?${queryString}` : ''}`;
      
      console.log("Fetching providers with URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      
      const data = await response.json();
      console.log("Received filtered providers:", data.length);
      return data;
    }
  });
  
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-semibold">
            <Skeleton className="h-8 w-72" />
          </h1>
          <div className="flex items-center">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-14" />
                </div>
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (!providers || providers.length === 0) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-semibold">No providers found</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <h2 className="text-lg font-medium mb-2">No legal service providers match your criteria</h2>
          <p className="text-neutral-600 mb-4">Try adjusting your filters or search terms to find more results.</p>
          <Button onClick={() => window.location.href = '/'}>Clear Filters</Button>
        </div>
      </section>
    );
  }
  
  // Simple pagination
  const providersPerPage = 6;
  const totalPages = Math.ceil(providers.length / providersPerPage);
  const paginatedProviders = providers.slice(
    (currentPage - 1) * providersPerPage, 
    currentPage * providersPerPage
  );
  
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Legal Service Providers in {location}</h1>
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2 hidden md:inline">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Recommended" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="price_low_high">Price: Low to High</SelectItem>
              <SelectItem value="price_high_low">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show current page and adjacent pages
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  className="rounded-none border-x-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <Button variant="outline" className="rounded-none border-x-0" disabled>
                  ...
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none border-x-0"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-r-md"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      )}
    </section>
  );
}
