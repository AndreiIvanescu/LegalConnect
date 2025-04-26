import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Menu, LogIn, LogOut, User, Mail, Calendar, Settings, Briefcase, ListFilter } from 'lucide-react';

function AuthAwareHeader() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LegalMatch</span>
          </div>

          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()} 
                    onClick={() => navigate('/providers')}
                  >
                    Find Providers
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                {user && (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink 
                        className={navigationMenuTriggerStyle()}
                        onClick={() => navigate('/bookings')}
                      >
                        Bookings
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink 
                        className={navigationMenuTriggerStyle()}
                        onClick={() => navigate('/messages')}
                      >
                        Messages
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    
                    {user.role === 'client' && (
                      <NavigationMenuItem>
                        <NavigationMenuLink 
                          className={navigationMenuTriggerStyle()}
                          onClick={() => navigate('/jobs')}
                        >
                          My Job Postings
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}
                    
                    {user.role === 'provider' && (
                      <NavigationMenuItem>
                        <NavigationMenuLink 
                          className={navigationMenuTriggerStyle()}
                          onClick={() => navigate('/job-board')}
                        >
                          Job Board
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar>
                          <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.fullName || user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="justify-start w-full" 
                          size="sm"
                          onClick={() => navigate('/bookings')}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Bookings
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="justify-start w-full" 
                          size="sm"
                          onClick={() => navigate('/messages')}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Messages
                        </Button>
                      </SheetClose>
                      {user.role === 'provider' && (
                        <>
                          <SheetClose asChild>
                            <Button 
                              variant="ghost" 
                              className="justify-start w-full" 
                              size="sm"
                              onClick={() => navigate('/provider/dashboard')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Provider Dashboard
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button 
                              variant="ghost" 
                              className="justify-start w-full" 
                              size="sm"
                              onClick={() => navigate('/job-board')}
                            >
                              <ListFilter className="mr-2 h-4 w-4" />
                              Job Board
                            </Button>
                          </SheetClose>
                        </>
                      )}
                      
                      {user.role === 'client' && (
                        <SheetClose asChild>
                          <Button 
                            variant="ghost" 
                            className="justify-start w-full" 
                            size="sm"
                            onClick={() => navigate('/jobs')}
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            My Job Postings
                          </Button>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="justify-start w-full" 
                          size="sm"
                          onClick={() => navigate('/profile')}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="justify-start w-full" 
                          size="sm"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'provider' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/provider/dashboard')}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Provider Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/job-board')}>
                          <ListFilter className="mr-2 h-4 w-4" />
                          <span>Job Board</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {user.role === 'client' && (
                      <DropdownMenuItem onClick={() => navigate('/jobs')}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>My Job Postings</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bookings')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Bookings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <Button onClick={() => navigate('/auth')} size={isMobile ? "icon" : "default"}>
              {isMobile ? <LogIn className="h-5 w-5" /> : "Login / Register"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AuthAwareHeader;