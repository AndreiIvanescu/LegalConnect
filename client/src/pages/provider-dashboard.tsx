import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Redirect, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import ServiceManagement from '@/components/providers/service-management';

// UI Components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  UserCog, 
  Map, 
  Settings, 
  ListChecks, 
  Star,
  Clock,
  CalendarRange,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

// Provider dashboard page
const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has a provider profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/profile/provider'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/profile/provider');
        if (res.status === 404) {
          return null;
        }
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    enabled: user?.role === 'provider',
  });

  // Get bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/bookings');
        return await res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!profile,
  });

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If user is not a provider, redirect to home page
  if (user.role !== 'provider') {
    return <Redirect to="/" />;
  }

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If provider profile doesn't exist, redirect to profile setup
  if (!profile) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Provider Profile</CardTitle>
            <CardDescription>
              You need to set up your provider profile before you can start offering services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center p-4 bg-muted/50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
              <div>
                <h3 className="font-medium">Profile Setup Required</h3>
                <p className="text-sm text-muted-foreground">
                  Your provider profile needs to be completed before you can manage services and bookings
                </p>
              </div>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/profile/setup">
                <UserCog className="mr-2 h-4 w-4" />
                Complete Profile Setup
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Count pending bookings
  const pendingBookings = bookings.filter((booking: any) => booking.status === 'pending').length;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your services, bookings, and profile
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-3">
          <Button asChild variant="outline">
            <Link href="/profile/setup">
              <UserCog className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Map className="mr-2 h-4 w-4" />
              View Public Profile
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Stats cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Bookings
                </CardTitle>
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingBookings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    pendingBookings
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pendingBookings === 1 ? 'Requires attention' : pendingBookings > 1 ? 'Require attention' : 'No pending bookings'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Services
                </CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.completedServices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {profile.completedServices > 0 ? 'Total completed services' : 'No completed services yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">N/A</div>
                <p className="text-xs text-muted-foreground">
                  No reviews yet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Availability
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-md font-bold flex items-center">
                  {profile.is24_7 ? (
                    <Badge className="bg-green-500">24/7 Available</Badge>
                  ) : (
                    <Badge variant="outline">Standard Hours</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.is24_7 ? 'Emergency services available' : 'Regular business hours'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>
                Your provider profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Provider Type</h3>
                    <p className="text-base">{profile.providerType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <p className="text-base">{profile.location}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
                    <p className="text-base">{profile.yearsOfExperience} years</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Education</h3>
                    <p className="text-base">{profile.education}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages?.map((lang: string) => (
                      <Badge key={lang} variant="secondary">
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{profile.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <ServiceManagement providerId={profile.id} />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>
                Manage your client bookings and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <CalendarRange className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No bookings yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    When clients book your services, they will appear here
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold">Booking Management Coming Soon</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    This feature is under development. Check back soon!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Messaging Coming Soon</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  The messaging feature is under development. You'll be able to communicate with clients here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboard;