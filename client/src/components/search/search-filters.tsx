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

// Create a utility function that creates a normalized value slug
const normalizeValue = (name: string) => {
  // Create a unique, URL-friendly slug from the location name
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[\s.,\-()]/g, "-") // Convert spaces and special chars to hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

// Romania counties (județe)
const romanianCounties = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", 
  "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", 
  "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", 
  "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", 
  "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", 
  "Tulcea", "Vâlcea", "Vaslui", "Vrancea"
];

// Major Romanian cities
const romanianCities = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", 
  "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", 
  "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani", "Satu Mare", 
  "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava", "Piatra Neamț", "Târgu Jiu", 
  "Târgoviște", "Focșani", "Bistrița", "Reșița", "Tulcea", "Slatina", "Călărași", 
  "Giurgiu", "Alba Iulia", "Deva", "Hunedoara", "Zalău", "Sfântu Gheorghe", 
  "Alexandria", "Vaslui", "Slobozia", "Turda", "Mediaș", "Miercurea Ciuc", 
  "Roman", "Făgăraș", "Mangalia", "Câmpina", "Câmpulung"
];

// Smaller towns and communes
const romanianTowns = [
  "Adjud", "Aiud", "Aleșd", "Anina", "Avrig", "Azuga", "Baia de Aramă", "Baia Sprie", 
  "Băicoi", "Băile Herculane", "Băile Tușnad", "Balș", "Băneasa", "Beclean", "Beiuș", 
  "Bicaz", "Bocșa", "Boldești-Scăeni", "Bolintin-Vale", "Borșa", "Brad", "Bragadiru", 
  "Brezoi", "Buftea", "Buhuși", "Bumbești-Jiu", "Busteni", "Caransebeș", "Cavnic", 
  "Cernavodă", "Chișineu-Criș", "Cisnădie", "Codlea", "Comănești", "Comarnic", 
  "Copșa Mică", "Corabia", "Costești", "Covasna", "Curtea de Argeș", "Dărmănești", 
  "Dej", "Dorohoi", "Drăgănești-Olt", "Drăgășani", "Dumbrăveni", "Eforie", "Făget", 
  "Fălticeni", "Fetești", "Fieni", "Fierbinți-Târg", "Flămânzi", "Găești", "Gherla", 
  "Gura Humorului", "Hârlău", "Hațeg", "Horezu", "Huedin", "Huși", "Ianca", "Iernut", 
  "Ineu", "Isaccea", "Jibou", "Jimbolia", "Lehliu Gară", "Lipova", "Lugoj", "Lupeni", 
  "Măcin", "Marghita", "Medgidia", "Mizil", "Moinești", "Moreni", "Motru", "Nădlac", 
  "Năsăud", "Năvodari", "Negrești-Oaș", "Novaci", "Ocna Mureș", "Ocna Sibiului", 
  "Odorheiu Secuiesc", "Oltenița", "Onești", "Oravița", "Orăștie", "Orșova", "Oțelu Roșu", 
  "Panciu", "Pașcani", "Pecica", "Petrila", "Petroșani", "Piatra-Olt", "Popești-Leordeni", 
  "Predeal", "Râșnov", "Râmnicu Sărat", "Reghin", "Rovinari", "Rupea", "Săcele", 
  "Salonta", "Sângeorz-Băi", "Sânnicolau Mare", "Sărmașu", "Săveni", "Scornicești", 
  "Sebeș", "Segarcea", "Seini", "Sfântu Gheorghe", "Sibiu", "Sighetu Marmației", 
  "Sighișoara", "Simeria", "Sinaia", "Siret", "Slănic", "Slănic Moldova", "Slatina", 
  "Solca", "Sovata", "Ștefănești", "Sulina", "Tălmaciu", "Tăuții-Măgherăuș", "Târgu Bujor", 
  "Târgu Cărbunești", "Târgu Frumos", "Târgu Lăpuș", "Târgu Neamț", "Târgu Ocna", 
  "Târgu Secuiesc", "Târnăveni", "Tășnad", "Teiuș", "Techirghiol", "Tecuci", 
  "Tismana", "Toplița", "Topoloveni", "Tulcea", "Turceni", "Turda", "Turnu Măgurele", 
  "Uricani", "Urlați", "Urziceni", "Valea lui Mihai", "Vălenii de Munte", "Vânju Mare", 
  "Vașcău", "Vatra Dornei", "Vicovu de Sus", "Victoria", "Videle", "Vișeu de Sus", 
  "Vlăhița", "Voluntari", "Vulcan", "Zlatna", "Zimnicea"
];

// Villages and rural communes
const romanianVillages = [
  "Adâncata", "Agigea", "Albești", "Albota", "Amara", "Andreiașu de Jos", "Apahida",
  "Ariceștii Rahtivani", "Armășești", "Babadag", "Baia de Fier", "Baia Mare", "Balotești",
  "Băneasa", "Barcea", "Bascov", "Berca", "Berești-Tazlău", "Biled", "Bobicești",
  "Botiza", "Bran", "Brănești", "Breaza", "Brezoi", "Bucium", "Bucșani", "Budești",
  "Buftea", "Cârligele", "Cârța", "Călinești", "Ceanu Mare", "Cernica", "Cetate",
  "Chirnogi", "Ciocănești", "Ciugud", "Cogealac", "Corbu", "Corlăteni", "Cornetu",
  "Coșula", "Crevedia", "Cristian", "Crucea", "Cudalbi", "Daia", "Dărmănești",
  "Dascălu", "Diosig", "Dobroteasa", "Domnești", "Dragalina", "Dragomirești",
  "Drăgotești", "Dumbrava", "Dumbrăveni", "Fântânele", "Făurei", "Filipeștii de Pădure",
  "Florești", "Frumușani", "Fundulea", "Gherăseni", "Ghimbav", "Gilău", "Giroc",
  "Glina", "Goiești", "Gornet-Cricov", "Gura Foii", "Hălchiu", "Hălmagiu", "Hârseni",
  "Hoghiz", "Holboca", "Hurezani", "Ipotești", "Izvoarele", "Jilava", "Jucu",
  "Leordeni", "Lipnița", "Lumina", "Măgurele", "Malu", "Mănăstirea", "Mărgineni",
  "Matca", "Mihăilești", "Miroslava", "Mogoșoaia", "Moieciu", "Munteni", "Năsturelu",
  "Nicorești", "Nucet", "Ogrezeni", "Pantelimon", "Papiu Ilarian", "Păulești", "Pecineaga",
  "Perișani", "Perișoru", "Periș", "Petrești", "Plopeni", "Podari", "Poiana Câmpina",
  "Poienarii Burchii", "Poienești", "Potlogi", "Praid", "Prejmer", "Prundeni", "Racovița",
  "Rădăuți-Prut", "Rădești", "Răducăneni", "Râfov", "Remetea", "Roșiori", "Runcu",
  "Rușețu", "Săbăoani", "Săcălaz", "Sadova", "Săliște", "Sângeorgiu de Mureș", "Sânmihaiu Român",
  "Sântana de Mureș", "Sascut", "Scânteia", "Scorțaru Nou", "Seaca de Câmp", "Secăria",
  "Sânzieni", "Șiria", "Șirnea", "Șișești", "Slimnic", "Snagov", "Stejari", "Ștefan cel Mare",
  "Tărlungeni", "Tătăranu", "Tăuteu", "Titu", "Tomești", "Tunari", "Turnu Roșu", "Țibănești",
  "Urechești", "Vadu Moldovei", "Vâlcele", "Valea Călugărească", "Vărbilău", "Vârfuri",
  "Vedea", "Vernești", "Viișoara", "Vișina", "Vlădeni", "Vorona", "Vulturești", "Zăbala",
  "Zăbrani", "Zâmbreasca", "Zărnești"
];

// Create a combined, de-duplicated list of all locations with unique IDs
const allLocationNames = Array.from(new Set([
  ...romanianCounties,
  ...romanianCities, 
  ...romanianTowns,
  ...romanianVillages
]));

const romanianLocations = allLocationNames.map((name) => ({
  value: `${normalizeValue(name)}-${Math.floor(Math.random() * 10000)}`, // Add random suffix to ensure uniqueness
  label: name
}));

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
  
  // Only use the first 200 locations when no search term, otherwise filter by search term
  const filteredLocations = locationSearchTerm.length > 0
    ? romanianLocations
        .filter((item) => 
          item.label.toLowerCase().includes(locationSearchTerm.toLowerCase())
        )
        .slice(0, 100) // Limit results to prevent performance issues
    : romanianLocations.slice(0, 200);
    
  // Group locations by first letter for better display
  const groupLocationsByFirstLetter = (locations: typeof romanianLocations) => {
    const groups: Record<string, typeof romanianLocations> = {};
    
    locations.forEach(location => {
      const firstLetter = location.label.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(location);
    });
    
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };
  
  const groupedLocations = groupLocationsByFirstLetter(filteredLocations);

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
                console.log("Search form submitted with term:", searchTerm);
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
              <Button 
                type="submit" 
                className="rounded-l-none"
                onClick={() => {
                  console.log("Search button clicked with term:", searchTerm);
                  handleSubmit();
                }}
              >
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
                        <CommandGroup>
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
                        </CommandGroup>
                        
                        <div className="max-h-[300px] overflow-auto">
                          {locationSearchTerm.length > 0 ? (
                            <CommandGroup heading="Matching locations">
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
                          ) : (
                            // Show alphabetically grouped locations when not searching
                            groupedLocations.map(([letter, locations]) => (
                              <CommandGroup key={letter} heading={letter}>
                                {locations.map((item) => (
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
                            ))
                          )}
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => {
                  console.log("Apply Location button clicked with location:", location);
                  handleSubmit();
                }}
              >
                Apply Location
              </Button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={() => {
                console.log("Apply Filters button clicked with filters:", {
                  searchTerm,
                  specialization,
                  priceRange: { min: minPrice, max: maxPrice },
                  availability,
                  rating,
                  location
                });
                handleSubmit();
              }}
            >
              Apply Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
