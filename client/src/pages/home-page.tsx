import { useState } from "react";
import SearchFilters from "@/components/search/search-filters";
import ProviderList from "@/components/providers/provider-list";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export default function HomePage() {
  const [searchFilters, setSearchFilters] = useState({});
  const [locationName, setLocationName] = useState("Romania");
  
  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
    
    // Update location name for display purposes
    if (filters.location && filters.location !== "any") {
      // Get location name from the romanianLocations array in SearchFilters
      // For now just extract a readable version from the filter value
      const locationValue = filters.location;
      if (typeof locationValue === 'string') {
        const locationParts = locationValue.split('-');
        if (locationParts.length > 0) {
          const cleanLocation = locationParts[0]
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          setLocationName(cleanLocation);
        }
      }
    } else {
      setLocationName("Romania");
    }
  };
  
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
      
      <main className="pt-14 md:pt-20 pb-20 md:pb-10">
        <SearchFilters onSearch={handleSearch} />
        <ProviderList filters={searchFilters} location={locationName} />
      </main>
      
      <MobileBottomNav />
    </>
  );
}
