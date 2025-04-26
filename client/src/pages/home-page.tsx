import { useState } from "react";
import SearchFilters from "@/components/search/search-filters";
import ProviderList from "@/components/providers/provider-list";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export default function HomePage() {
  const [searchFilters, setSearchFilters] = useState({});
  
  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
  };
  
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
      
      <main className="pt-14 md:pt-20 pb-20 md:pb-10">
        <SearchFilters onSearch={handleSearch} />
        <ProviderList filters={searchFilters} />
      </main>
      
      <MobileBottomNav />
    </>
  );
}
