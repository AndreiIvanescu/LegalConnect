import { useAuth } from "@/hooks/use-auth";
import { LogoIcon } from "@/components/ui/icons";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DesktopHeader() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    // Use the default logout behavior from useAuth
    logoutMutation.mutate();
  };
  
  return (
    <header className="hidden md:block bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <LogoIcon className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-semibold text-neutral-800">LegalMarket</span>
              </div>
            </Link>
            <nav className="ml-8">
              <ul className="flex space-x-6">
                <li>
                  <Link href="/" className="text-neutral-700 hover:text-primary-600 font-medium">
                    Find Providers
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="text-neutral-700 hover:text-primary-600 font-medium">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-neutral-700 hover:text-primary-600 font-medium">
                    How it works
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <Button variant="ghost" className="text-neutral-700 hover:text-primary-600" asChild>
              <Link href="/search">
                <Search className="mr-1 h-4 w-4" />
                <span>Search</span>
              </Link>
            </Button>
            <Button variant="ghost" className="text-neutral-700 hover:text-primary-600" asChild>
              <Link href="/notifications">
                <Bell className="mr-1 h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </Button>
            {user ? (
              <div className="flex items-center">
                <Link href="/profile">
                  <div className="flex items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium">
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <span className="ml-2 font-medium text-neutral-700">{user.fullName}</span>
                  </div>
                </Link>
                <Button variant="ghost" size="sm" className="ml-4" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link href="/auth">Login / Register</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
