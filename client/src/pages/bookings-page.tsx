import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { useAuth } from "@/hooks/use-auth";

export default function BookingsPage() {
  const { user } = useAuth();
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'confirmed':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  const renderBookingsList = (filteredBookings: any[]) => {
    if (!filteredBookings || filteredBookings.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No bookings found</h3>
          <p className="text-neutral-500 mb-4">You don't have any bookings in this category yet.</p>
          <Button asChild>
            <a href="/">Find a Provider</a>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4">
                  {getStatusIcon(booking.status)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.provider.name}</h3>
                      <p className="text-neutral-600">{booking.provider.type}</p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex items-center text-sm text-neutral-600 mb-3">
                    <Calendar className="mr-2 h-4 w-4 text-neutral-500" />
                    <span>{new Date(booking.startTime).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                    <span className="mx-2">•</span>
                    <Clock className="mr-2 h-4 w-4 text-neutral-500" />
                    <span>{new Date(booking.startTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}</span>
                  </div>
                  {booking.service && (
                    <p className="text-neutral-700 mb-4">
                      <span className="font-medium">Service:</span> {booking.service.title}
                    </p>
                  )}
                  <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-neutral-500">Total Amount</p>
                      <p className="font-semibold text-lg">
                        {(booking.totalAmount / 100).toLocaleString('ro-RO', { 
                          style: 'currency', 
                          currency: 'RON' 
                        })}
                      </p>
                    </div>
                    <div className="space-x-2">
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                          Cancel
                        </Button>
                      )}
                      {booking.status === 'completed' && !booking.hasReviewed && (
                        <Button>
                          Leave Review
                        </Button>
                      )}
                      {booking.status === 'pending' && (
                        <Button>
                          Reschedule
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <>
        <MobileHeader />
        <DesktopHeader />
        
        <main className="pt-14 md:pt-20 pb-20 md:pb-10">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>
            <Tabs defaultValue="upcoming">
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <Skeleton className="h-5 w-5 mr-4" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Skeleton className="h-6 w-48 mb-1" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full mb-3" />
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                              <Skeleton className="h-8 w-24" />
                              <div className="space-x-2">
                                <Skeleton className="h-10 w-24 inline-block" />
                                <Skeleton className="h-10 w-24 inline-block" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
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
          <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>
          
          <Tabs defaultValue="upcoming">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {renderBookingsList(bookings?.filter(b => b.status === 'confirmed'))}
            </TabsContent>
            
            <TabsContent value="pending">
              {renderBookingsList(bookings?.filter(b => b.status === 'pending'))}
            </TabsContent>
            
            <TabsContent value="completed">
              {renderBookingsList(bookings?.filter(b => b.status === 'completed'))}
            </TabsContent>
            
            <TabsContent value="cancelled">
              {renderBookingsList(bookings?.filter(b => b.status === 'cancelled'))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileBottomNav />
    </>
  );
}
