import { useParams } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import ProviderDetail from "@/components/providers/provider-detail";

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const providerId = parseInt(params.id);
  
  if (isNaN(providerId)) {
    return (
      <>
        <MobileHeader />
        <DesktopHeader />
        
        <main className="pt-14 md:pt-20 pb-20 md:pb-10 flex justify-center items-center">
          <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-2">Invalid Provider ID</h1>
            <p className="text-neutral-600 mb-4">The provider ID you're looking for is invalid.</p>
            <button 
              className="text-primary hover:underline"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </main>
        
        <MobileBottomNav />
      </>
    );
  }
  
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
      
      <main className="pt-14 md:pt-20 pb-20 md:pb-10">
        <ProviderDetail providerId={providerId} />
      </main>
      
      <MobileBottomNav />
    </>
  );
}
