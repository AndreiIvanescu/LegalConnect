import { Link, useLocation } from "wouter";
import { Search, Calendar, MessageSquare, User } from "lucide-react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-50">
      <div className="flex justify-around">
        <Link href="/" className={`flex flex-col items-center py-3 transition-all ${location === '/' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
            <Search className={`h-5 w-5 transition-transform ${location === '/' ? 'scale-110' : ''}`} />
            <span className="text-xs mt-1">Browse</span>
        </Link>
        <Link href="/bookings" className={`flex flex-col items-center py-3 transition-all ${location === '/bookings' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
            <Calendar className={`h-5 w-5 transition-transform ${location === '/bookings' ? 'scale-110' : ''}`} />
            <span className="text-xs mt-1">Bookings</span>
        </Link>
        <Link href="/messages" className={`flex flex-col items-center py-3 transition-all ${location === '/messages' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
            <MessageSquare className={`h-5 w-5 transition-transform ${location === '/messages' ? 'scale-110' : ''}`} />
            <span className="text-xs mt-1">Messages</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center py-3 transition-all ${location === '/profile' ? 'text-primary font-medium scale-105' : 'text-neutral-500'}`}>
            <User className={`h-5 w-5 transition-transform ${location === '/profile' ? 'scale-110' : ''}`} />
            <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
