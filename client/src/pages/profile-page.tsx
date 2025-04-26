import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, Settings, Star, Clock, MapPin, Briefcase, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  
  // For profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [country, setCountry] = useState(user?.country || "");
  
  // For provider profile
  const { data: providerProfile } = useQuery({
    queryKey: ['/api/profile/provider'],
    enabled: user?.role === 'provider',
  });
  
  // For account history (bookings, reviews)
  const { data: bookingHistory } = useQuery({
    queryKey: ['/api/bookings/history'],
    enabled: !!user,
  });
  
  const { data: reviewsReceived } = useQuery({
    queryKey: ['/api/reviews/received'],
    enabled: user?.role === 'provider',
  });
  
  const handleSaveProfile = () => {
    // Would make a mutation to update profile
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
    setIsEditing(false);
  };
  
  if (!user) {
    return (
      <>
        <MobileHeader />
        <DesktopHeader />
        
        <main className="pt-14 md:pt-20 pb-20 md:pb-10 flex justify-center items-center">
          <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-2">Please login</h1>
            <p className="text-neutral-600 mb-4">You need to be logged in to view your profile.</p>
            <Button asChild>
              <a href="/auth">Login</a>
            </Button>
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
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="text-neutral-600">Manage your account and settings</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                      <span className="text-primary-700 text-2xl font-medium">
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold">{user.fullName}</h2>
                    <p className="text-neutral-600">{user.role === 'provider' ? 'Service Provider' : 'Client'}</p>
                  </div>
                  
                  <nav className="space-y-1">
                    <Button 
                      variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    {user.role === 'provider' && (
                      <Button 
                        variant={activeTab === 'providerProfile' ? 'default' : 'ghost'} 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('providerProfile')}
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        Provider Profile
                      </Button>
                    )}
                    <Button 
                      variant={activeTab === 'history' ? 'default' : 'ghost'} 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('history')}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      History
                    </Button>
                    {user.role === 'provider' && (
                      <Button 
                        variant={activeTab === 'reviews' ? 'default' : 'ghost'} 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('reviews')}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Reviews
                      </Button>
                    )}
                    <Button 
                      variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Separator className="my-2" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Logout
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === 'profile' && 'Personal Information'}
                    {activeTab === 'providerProfile' && 'Provider Profile'}
                    {activeTab === 'history' && 'Booking History'}
                    {activeTab === 'reviews' && 'My Reviews'}
                    {activeTab === 'settings' && 'Account Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input 
                                id="email" 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input 
                                id="phone" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input 
                                id="city" 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor="country">Country</Label>
                              <Input 
                                id="country" 
                                value={country} 
                                onChange={(e) => setCountry(e.target.value)} 
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveProfile}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Full Name</h3>
                                <p className="mt-1">{user.fullName}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Username</h3>
                                <p className="mt-1">{user.username}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                                <p className="mt-1">{user.email || '—'}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Phone</h3>
                                <p className="mt-1">{user.phone || '—'}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Location</h3>
                                <p className="mt-1">
                                  {user.city && user.country ? `${user.city}, ${user.country}` : '—'}
                                </p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-neutral-500">Account Type</h3>
                                <p className="mt-1 capitalize">{user.role}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6">
                            <Button onClick={() => setIsEditing(true)}>
                              Edit Profile
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Provider Profile Tab */}
                  {activeTab === 'providerProfile' && user.role === 'provider' && (
                    <>
                      {providerProfile ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-2">About Me</h3>
                            <p className="text-neutral-700">
                              {providerProfile.description || 'No description provided.'}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-2">Specializations</h3>
                            <div className="flex flex-wrap gap-2">
                              {providerProfile.specializations?.map((spec: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-primary-50 text-primary-700">
                                  {spec}
                                </Badge>
                              ))}
                              {(!providerProfile.specializations || providerProfile.specializations.length === 0) && (
                                <p className="text-neutral-500">No specializations added.</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-2">Services</h3>
                            {providerProfile.services?.length > 0 ? (
                              <div className="space-y-3">
                                {providerProfile.services.map((service: any, i: number) => (
                                  <div key={i} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{service.title}</h4>
                                        <p className="text-sm text-neutral-600">{service.description}</p>
                                      </div>
                                      <p className="font-semibold">{service.price}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-neutral-500">No services added yet.</p>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <Button onClick={() => navigate('/profile/setup')}>Edit Provider Profile</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <h3 className="text-lg font-medium mb-2">Provider Profile Not Set Up</h3>
                          <p className="text-neutral-500 mb-4">
                            You need to complete your provider profile to start offering services.
                          </p>
                          <Button onClick={() => navigate('/profile/setup')}>Set Up Provider Profile</Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <div>
                      <Tabs defaultValue="bookings">
                        <TabsList className="mb-4">
                          <TabsTrigger value="bookings">Bookings</TabsTrigger>
                          <TabsTrigger value="payments">Payments</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="bookings">
                          {bookingHistory && bookingHistory.length > 0 ? (
                            <div className="space-y-4">
                              {bookingHistory.map((booking: any) => (
                                <div key={booking.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium">{booking.providerName}</p>
                                      <div className="flex items-center text-sm text-neutral-500">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        <span>
                                          {new Date(booking.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`
                                        ${booking.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        ${booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        ${booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                      `}
                                    >
                                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">{booking.serviceName}</p>
                                  <div className="mt-2 pt-2 border-t flex justify-between items-center">
                                    <p className="font-medium">{booking.amount}</p>
                                    {booking.status === 'completed' && !booking.reviewed && (
                                      <Button size="sm" variant="outline">Leave Review</Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-neutral-500">No booking history yet.</p>
                              <Button className="mt-4" asChild>
                                <a href="/">Find Providers</a>
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="payments">
                          <div className="text-center py-8">
                            <p className="text-neutral-500">Your payment history will appear here.</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                  
                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && user.role === 'provider' && (
                    <div>
                      {reviewsReceived && reviewsReceived.length > 0 ? (
                        <div className="space-y-4">
                          {reviewsReceived.map((review: any) => (
                            <div key={review.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                                    <span className="text-primary-700 font-medium">
                                      {review.clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{review.clientName}</p>
                                    <div className="flex items-center">
                                      {Array(5).fill(0).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${
                                            i < review.rating ? 'text-amber-500 fill-current' : 'text-neutral-300'
                                          }`} 
                                        />
                                      ))}
                                      <span className="ml-2 text-sm text-neutral-500">
                                        {new Date(review.date).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-neutral-700 mt-2">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500">You haven't received any reviews yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={user.username} disabled />
                            <p className="text-xs text-neutral-500 mt-1">Username cannot be changed.</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value="••••••••" disabled />
                            <Button variant="outline" size="sm" className="mt-2">
                              Change Password
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                        <div className="space-y-4">
                          {/* Notification settings would go here */}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                        <div className="space-y-4">
                          {/* Privacy settings would go here */}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                          Permanently delete your account and all of your content from LegalMarket.
                          This action cannot be undone.
                        </p>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <MobileBottomNav />
    </>
  );
}
