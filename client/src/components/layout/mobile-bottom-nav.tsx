import { Link, useLocation } from "wouter";
import { Search, Calendar, MessageSquare, User } from "lucide-react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-50">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-3 ${location === '/' ? 'text-primary-600' : 'text-neutral-500'}`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Browse</span>
          </a>
        </Link>
        <Link href="/bookings">
          <a className={`flex flex-col items-center py-3 ${location === '/bookings' ? 'text-primary-600' : 'text-neutral-500'}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Bookings</span>
          </a>
        </Link>
        <Link href="/messages">
          <a className={`flex flex-col items-center py-3 ${location === '/messages' ? 'text-primary-600' : 'text-neutral-500'}`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Messages</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className={`flex flex-col items-center py-3 ${location === '/profile' ? 'text-primary-600' : 'text-neutral-500'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
