import { useState } from "react";
import { Search, Filter, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("any");
  const [rating, setRating] = useState("any");

  const handleSubmit = () => {
    // Convert special "all" and "any" values to empty strings or null values for filtering
    const filters = {
      searchTerm,
      specialization: specialization === "all" ? null : specialization,
      priceRange: { min: minPrice, max: maxPrice },
      availability: availability === "any" ? null : availability,
      rating: rating === "any" ? null : rating
    };
    
    onSearch(filters);
  };

  return (
    <section className="bg-white border-b md:py-6 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="relative flex-grow mb-4 md:mb-0 md:mr-4">
            <Input
              type="text"
              placeholder="Search legal services, notaries, executors..."
              className="w-full pl-10 pr-4 py-6 md:py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="py-6 md:py-2 flex items-center"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="mr-2 h-4 w-4" /> 
              Filters
              {showAdvanced ? 
                <ChevronUp className="ml-2 h-4 w-4" /> : 
                <ChevronDown className="ml-2 h-4 w-4" />
              }
            </Button>
            <Button variant="outline" className="py-6 md:py-2 flex items-center">
              <MapPin className="mr-2 h-4 w-4" /> Location
            </Button>
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Specialization</label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specializations</SelectItem>
                  <SelectItem value="notary">Notaries</SelectItem>
                  <SelectItem value="judicial_executor">Judicial Executors</SelectItem>
                  <SelectItem value="lawyer">Lawyers</SelectItem>
                  <SelectItem value="judge">Judges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Price Range</label>
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>-</span>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Availability</label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                  <SelectItem value="24_7">24/7 Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Rating</label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any rating</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit}>
              Apply Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
