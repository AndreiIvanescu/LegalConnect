import { useAuth } from "@/hooks/use-auth";
import { LogoIcon } from "@/components/ui/icons";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function MobileHeader() {
  const { user } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 md:hidden">
      <div className="flex justify-between items-center px-4 py-3">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="ml-2 text-lg font-semibold text-neutral-800">LegalMarket</span>
          </div>
        </Link>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search">
              <Search className="h-5 w-5 text-neutral-600" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5 text-neutral-600" />
            </Link>
          </Button>
          {user ? (
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center cursor-pointer">
                <span className="text-primary-700 text-sm font-medium">
                  {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
