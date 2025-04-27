import { Link, useLocation } from "wouter";
import { Search, Calendar, MessageSquare, User, Clock, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { FilePlus, Briefcase, Book, FileText } from "lucide-react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  // Use state to track the provider status for more reliable re-rendering
  const [isProvider, setIsProvider] = useState(false);
  
  // Use effect to update provider status whenever user changes
  useEffect(() => {
    // Check if user role is provider
    const providerCheck = user?.role === 'provider';
    console.log("MobileNav useEffect - User:", user?.username, "Role:", user?.role, "Is Provider:", providerCheck);
    setIsProvider(providerCheck);
  }, [user]);
  
  // Always log current values for debugging
  console.log("MobileNav render - Username:", user?.username, "Role:", user?.role, "Is Provider state:", isProvider);
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-50">
      <div className="flex justify-around">
        {isProvider && (
          // PROVIDER NAVIGATION - shown only if user is a provider
          <>
            <Link href="/" className={`flex flex-col items-center py-2 transition-all ${location === '/' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Home className={`h-5 w-5 transition-transform ${location === '/' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Home</span>
            </Link>
            <Link href="/find-contracts" className={`flex flex-col items-center py-2 transition-all ${location === '/find-contracts' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Search className={`h-5 w-5 transition-transform ${location === '/find-contracts' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Contracts</span>
            </Link>
            <Link href="/my-applications" className={`flex flex-col items-center py-2 transition-all ${location === '/my-applications' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Briefcase className={`h-5 w-5 transition-transform ${location === '/my-applications' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Applications</span>
            </Link>
            <Link href="/my-bookings" className={`flex flex-col items-center py-2 transition-all ${location === '/my-bookings' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Calendar className={`h-5 w-5 transition-transform ${location === '/my-bookings' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Bookings</span>
            </Link>
            <Link href="/messages" className={`flex flex-col items-center py-2 transition-all ${location === '/messages' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <MessageSquare className={`h-5 w-5 transition-transform ${location === '/messages' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Messages</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center py-2 transition-all ${location === '/profile' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <User className={`h-5 w-5 transition-transform ${location === '/profile' ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-1">Profile</span>
            </Link>
          </>
        )}
        
        {!isProvider && (
          // CLIENT NAVIGATION - shown only if user is a client
          <>
            <Link href="/" className={`flex flex-col items-center py-3 transition-all ${location === '/' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Search className={`h-5 w-5 transition-transform ${location === '/' ? 'scale-110' : ''}`} />
                <span className="text-xs mt-1">Find Providers</span>
            </Link>
            <Link href="/post-gig" className={`flex flex-col items-center py-3 transition-all ${location === '/post-gig' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <FilePlus className={`h-5 w-5 transition-transform ${location === '/post-gig' ? 'scale-110' : ''}`} />
                <span className="text-xs mt-1">Post Gig</span>
            </Link>
            <Link href="/my-gigs" className={`flex flex-col items-center py-3 transition-all ${location === '/my-gigs' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <Briefcase className={`h-5 w-5 transition-transform ${location === '/my-gigs' ? 'scale-110' : ''}`} />
                <span className="text-xs mt-1">My Gigs</span>
            </Link>
          </>
        )}
        
        {/* Client-only messages & profile links (since provider has its own complete nav) */}
        {!isProvider && (
          <>
            <Link href="/messages" className={`flex flex-col items-center py-3 transition-all ${location === '/messages' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <MessageSquare className={`h-5 w-5 transition-transform ${location === '/messages' ? 'scale-110' : ''}`} />
                <span className="text-xs mt-1">Messages</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center py-3 transition-all ${location === '/profile' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
                <User className={`h-5 w-5 transition-transform ${location === '/profile' ? 'scale-110' : ''}`} />
                <span className="text-xs mt-1">Profile</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
