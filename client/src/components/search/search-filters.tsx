import { useState, useEffect } from "react";
import { Search, Filter, MapPin, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Top Romanian locations for search
const romanianLocations = [
  { value: "alba", label: "Alba" },
  { value: "alba-iulia", label: "Alba Iulia" },
  { value: "arad", label: "Arad" },
  { value: "bacau", label: "Bacău" },
  { value: "baia-mare", label: "Baia Mare" },
  { value: "bistrita", label: "Bistrița" },
  { value: "botosani", label: "Botoșani" },
  { value: "braila", label: "Brăila" },
  { value: "brasov", label: "Brașov" },
  { value: "bucuresti", label: "București" },
  { value: "buzau", label: "Buzău" },
  { value: "calarasi", label: "Călărași" },
  { value: "cluj-napoca", label: "Cluj-Napoca" },
  { value: "constanta", label: "Constanța" },
  { value: "craiova", label: "Craiova" },
  { value: "deva", label: "Deva" },
  { value: "focsani", label: "Focșani" },
  { value: "galati", label: "Galați" },
  { value: "giurgiu", label: "Giurgiu" },
  { value: "hunedoara", label: "Hunedoara" },
  { value: "iasi", label: "Iași" },
  { value: "oradea", label: "Oradea" },
  { value: "piatra-neamt", label: "Piatra Neamț" },
  { value: "pitesti", label: "Pitești" },
  { value: "ploiesti", label: "Ploiești" },
  { value: "ramnicu-valcea", label: "Râmnicu Vâlcea" },
  { value: "resita", label: "Reșița" },
  { value: "satu-mare", label: "Satu Mare" },
  { value: "sibiu", label: "Sibiu" },
  { value: "slatina", label: "Slatina" },
  { value: "slobozia", label: "Slobozia" },
  { value: "suceava", label: "Suceava" },
  { value: "targoviste", label: "Târgoviște" },
  { value: "targu-jiu", label: "Târgu Jiu" },
  { value: "targu-mures", label: "Târgu Mureș" },
  { value: "timisoara", label: "Timișoara" },
  { value: "tulcea", label: "Tulcea" },
  { value: "vaslui", label: "Vaslui" },
  { value: "zalau", label: "Zalău" },
  // Additional villages and small towns
  { value: "adjud", label: "Adjud" },
  { value: "aiud", label: "Aiud" },
  { value: "alexandria", label: "Alexandria" },
  { value: "avrig", label: "Avrig" },
  { value: "baleni", label: "Băleni" },
  { value: "bals", label: "Balș" },
  { value: "beclean", label: "Beclean" },
  { value: "bran", label: "Bran" },
  { value: "branesti", label: "Brănești" },
  { value: "busteni", label: "Bușteni" },
  { value: "calarasi", label: "Călărași" },
  { value: "campina", label: "Câmpina" },
  { value: "campulung", label: "Câmpulung" },
  { value: "caracal", label: "Caracal" },
  { value: "caransebes", label: "Caransebeș" },
  { value: "cernavoda", label: "Cernavodă" },
  { value: "comarnic", label: "Comarnic" },
  { value: "curtea-de-arges", label: "Curtea de Argeș" },
  { value: "dej", label: "Dej" },
  { value: "dobreta-turnu-severin", label: "Dobreta-Turnu Severin" },
  { value: "dorohoi", label: "Dorohoi" },
  { value: "draganesti-olt", label: "Drăgănești-Olt" },
  { value: "dragasani", label: "Drăgășani" },
  { value: "dragomiresti", label: "Dragomirești" },
  { value: "fagaras", label: "Făgăraș" },
  { value: "falticeni", label: "Fălticeni" },
  { value: "fetesti", label: "Fetești" },
  { value: "gherla", label: "Gherla" },
  { value: "gugesti", label: "Gugești" },
  { value: "husi", label: "Huși" },
  { value: "iernut", label: "Iernut" },
  { value: "lugoj", label: "Lugoj" },
  { value: "mangalia", label: "Mangalia" },
  { value: "marghita", label: "Marghita" },
  { value: "medgidia", label: "Medgidia" },
  { value: "medias", label: "Mediaș" },
  { value: "miercurea-ciuc", label: "Miercurea Ciuc" },
  { value: "mioveni", label: "Mioveni" },
  { value: "navodari", label: "Năvodari" },
  { value: "odorheiu-secuiesc", label: "Odorheiu Secuiesc" },
  { value: "oltenita", label: "Oltenița" },
  { value: "onesti", label: "Onești" },
  { value: "pascani", label: "Pașcani" },
  { value: "predeal", label: "Predeal" },
  { value: "rasnov", label: "Râșnov" },
  { value: "reghin", label: "Reghin" },
  { value: "roman", label: "Roman" },
  { value: "rovinari", label: "Rovinari" },
  { value: "sacele", label: "Săcele" },
  { value: "saliste", label: "Săliște" },
  { value: "sangeorz-bai", label: "Sângeorz-Băi" },
  { value: "sannicolau-mare", label: "Sânnicolau Mare" },
  { value: "sighetu-marmatiei", label: "Sighetu Marmației" },
  { value: "sighisoara", label: "Sighișoara" },
  { value: "sinaia", label: "Sinaia" },
  { value: "slanic-moldova", label: "Slănic Moldova" },
  { value: "tecuci", label: "Tecuci" },
  { value: "tirgu-neamt", label: "Târgu Neamț" },
  { value: "turda", label: "Turda" },
  { value: "urziceni", label: "Urziceni" },
  { value: "vatra-dornei", label: "Vatra Dornei" },
  { value: "viseu-de-sus", label: "Vișeu de Sus" },
  { value: "vulcan", label: "Vulcan" },
  { value: "zarnesti", label: "Zărnești" }
];

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("any");
  const [rating, setRating] = useState("any");
  const [location, setLocation] = useState("any");
  const [openLocationPopover, setOpenLocationPopover] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState(""); 
  
  const filteredLocations = locationSearchTerm.length > 0
    ? romanianLocations.filter((item) =>
        item.label.toLowerCase().includes(locationSearchTerm.toLowerCase())
      )
    : romanianLocations;

  const handleSubmit = () => {
    // Convert special "all" and "any" values to empty strings or null values for filtering
    const filters = {
      searchTerm,
      specialization: specialization === "all" ? null : specialization,
      priceRange: { min: minPrice, max: maxPrice },
      availability: availability === "any" ? null : availability,
      rating: rating === "any" ? null : rating,
      location: location === "any" ? null : location
    };
    
    onSearch(filters);
  };

  return (
    <section className="bg-white border-b md:py-6 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="relative flex-grow mb-4 md:mb-0 md:mr-4">
            <form 
              className="flex w-full"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search legal services, notaries, executors..."
                  className="w-full pl-10 pr-4 py-6 md:py-2 rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              </div>
              <Button type="submit" className="rounded-l-none">
                Search
              </Button>
            </form>
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
            <Button 
              variant="outline" 
              className="py-6 md:py-2 flex items-center"
              onClick={() => setShowLocationFilter(!showLocationFilter)}
            >
              <MapPin className="mr-2 h-4 w-4" /> 
              Location
              {showLocationFilter ? 
                <ChevronUp className="ml-2 h-4 w-4" /> : 
                <ChevronDown className="ml-2 h-4 w-4" />
              }
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
        
        {/* Location Filters */}
        {showLocationFilter && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Location</label>
                <Popover open={openLocationPopover} onOpenChange={setOpenLocationPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openLocationPopover}
                      className="w-full justify-between"
                    >
                      {location === "any" 
                        ? "Any location" 
                        : romanianLocations.find((item) => item.value === location)?.label || "Select location"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search location..." 
                        className="h-9" 
                        value={locationSearchTerm}
                        onValueChange={setLocationSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          <CommandItem
                            key="any"
                            value="any"
                            onSelect={() => {
                              setLocation("any");
                              setOpenLocationPopover(false);
                              setLocationSearchTerm("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                location === "any" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Any location
                          </CommandItem>
                          {filteredLocations.map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.value}
                              onSelect={() => {
                                setLocation(item.value);
                                setOpenLocationPopover(false);
                                setLocationSearchTerm("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  location === item.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSubmit}>
                Apply Location
              </Button>
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
