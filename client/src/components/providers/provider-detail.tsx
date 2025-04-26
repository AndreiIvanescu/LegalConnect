import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, GraduationCap, IdCard, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Credential {
  organization: string;
  title: string;
  year: string;
}

interface Provider {
  id: number;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  location: string;
  education: string;
  description?: string;
  yearsOfExperience?: number;
  specializations: string[];
  credentials?: Credential[];
  languages?: string[];
  address?: string;
  is24_7?: boolean;
  completedServices?: number;
  services?: Array<{
    id: number;
    title: string;
    description: string;
    price: string;
    priceType?: string;
    isTopRated?: boolean;
  }>;
  reviews?: Array<{
    id: number;
    author: string;
    date: string;
    rating: number;
    comment: string;
  }>;
}

interface ProviderDetailProps {
  providerId: number;
}

export default function ProviderDetail({ providerId }: ProviderDetailProps) {
  const { toast } = useToast();
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: provider, isLoading } = useQuery<Provider>({
    queryKey: [`/api/providers/${providerId}`]
  });
  
  const handleBookAppointment = () => {
    if (!bookingDate) {
      toast({
        title: "Please select a date",
        description: "You must select a date to book an appointment",
        variant: "destructive",
      });
      return;
    }
    
    // Would make a mutation to book appointment
    toast({
      title: "Appointment requested",
      description: `Your appointment request has been sent to ${provider?.name}`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="relative">
            <Skeleton className="w-full h-32" />
            <div className="absolute top-16 left-8">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
          </div>
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <div className="mt-4 md:mt-0 flex">
                <Skeleton className="h-10 w-40 mr-3" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <h2 className="text-lg font-medium mb-2">Provider not found</h2>
          <p className="text-neutral-600 mb-4">The provider you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Provider Header */}
        <div className="relative">
          <div className="bg-primary h-32"></div>
          <div className="absolute top-16 left-8 rounded-full border-4 border-white">
            <img 
              src={provider.imageUrl} 
              alt={provider.name} 
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
        </div>
        
        {/* Provider Info */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6">
            <div>
              <h1 className="text-2xl font-semibold">{provider.name}</h1>
              <p className="text-neutral-600">{provider.type}</p>
              <div className="flex items-center mt-2">
                <div className="text-amber-500 flex items-center">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="ml-1 font-medium">{provider.rating}</span>
                </div>
                <span className="text-neutral-500 text-sm ml-1">({provider.reviewCount} reviews)</span>
                <span className="mx-2 text-neutral-300">|</span>
                <MapPin className="text-neutral-500 mr-1 h-4 w-4" />
                <span className="text-neutral-600">{provider.location}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mb-2 sm:mb-0 sm:mr-3 btn-transition hover-up">Book Appointment</Button>
                </DialogTrigger>
                <DialogContent className="fade-in">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Book an Appointment with {provider.name}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="mb-4 slide-in-right">
                      <h3 className="text-sm font-medium mb-2">Select a date</h3>
                      <Calendar
                        mode="single"
                        selected={bookingDate}
                        onSelect={setBookingDate}
                        className="rounded-md border transition-all hover:border-primary/50"
                        initialFocus
                      />
                    </div>
                    <Button onClick={handleBookAppointment} className="w-full btn-transition hover-up transition-transform">
                      Request Appointment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="flex items-center btn-transition hover-up">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Message</span>
              </Button>
            </div>
          </div>

          {/* Provider Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 relative overflow-hidden">
              <TabsTrigger value="overview" className="transition-all relative z-10">
                <span className="transition-colors">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="transition-all relative z-10">
                <span className="transition-colors">Services</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="transition-all relative z-10">
                <span className="transition-colors">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="transition-all relative z-10">
                <span className="transition-colors">Availability</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 slide-in-right">
                  <h2 className="text-lg font-semibold mb-4 text-primary">About</h2>
                  <p className="text-neutral-700 mb-4">
                    {provider.description || `With over ${provider.yearsOfExperience} years of experience as a ${provider.type}, I specialize in ${provider.specializations.join(', ')}. My office is committed to providing efficient, accurate, and professional legal services to individuals and businesses throughout ${provider.location}.`}
                  </p>
                  
                  <h2 className="text-lg font-semibold mt-6 mb-4 text-primary">Education & Credentials</h2>
                  <div className="flex items-start mb-3 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                    <GraduationCap className="mt-1 text-primary w-5 h-5" />
                    <div className="ml-3">
                      <p className="font-medium">{provider.education.split(',')[0]}</p>
                      <p className="text-neutral-600">{provider.education.split(',')[1] || "Doctor of Law"}</p>
                    </div>
                  </div>
                  {provider.credentials && provider.credentials.map((credential, index) => (
                    <div key={index} className="flex items-start mb-3 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                      <IdCard className="mt-1 text-primary w-5 h-5" />
                      <div className="ml-3">
                        <p className="font-medium">{credential.organization}</p>
                        <p className="text-neutral-600">{credential.title}, {credential.year}</p>
                      </div>
                    </div>
                  ))}
                  
                  <h2 className="text-lg font-semibold mt-6 mb-4 text-primary">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1 rounded-full transition-all hover:scale-105">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="slide-in-right" style={{ animationDelay: '0.1s' }}>
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-semibold mb-4 text-primary">Quick Information</h2>
                      
                      <div className="mb-4 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">Years of Experience</p>
                        <p className="font-semibold">{provider.yearsOfExperience}+ years</p>
                      </div>
                      
                      <div className="mb-4 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">Languages</p>
                        <p className="font-medium">{provider.languages?.join(', ') || 'Romanian, English'}</p>
                      </div>
                      
                      <div className="mb-4 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">Location</p>
                        <p className="font-medium">{provider.address || provider.location}</p>
                      </div>
                      
                      <div className="mb-4 transition-all hover:bg-neutral-50 p-2 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">Working Hours</p>
                        {provider.is24_7 ? (
                          <p className="font-medium text-secondary">Available 24/7</p>
                        ) : (
                          <>
                            <p className="font-medium">Mon-Fri: 9:00 - 17:00</p>
                            <p className="font-medium">Sat: 10:00 - 14:00</p>
                          </>
                        )}
                      </div>
                      
                      <div className="transition-all hover:bg-neutral-50 p-2 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">Completed Services</p>
                        <p className="font-semibold">{provider.completedServices || provider.reviewCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Services Tab Content */}
            <TabsContent value="services" className="fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {provider.services && provider.services.map((service, index) => (
                  <Card key={index} className="service-card overflow-hidden border border-neutral-200 hover:border-primary/30">
                    <CardContent className="pt-6 relative">
                      {service.isTopRated && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-amber-500 hover:bg-amber-600">Top Rated</Badge>
                        </div>
                      )}
                      <h3 className="text-lg font-semibold mb-2 transition-colors">{service.title}</h3>
                      
                      {/* Beautiful expectation box */}
                      <div className="mb-5">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Detailed explanation of what clients can expect</h4>
                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                          <p className="text-neutral-700 text-sm">{service.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4">
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Pricing Type</p>
                          <p className="font-medium text-neutral-700 mb-2">{service.priceType || 'Fixed Price'}</p>
                          <div className="flex items-baseline gap-1">
                            <p className="font-semibold text-xl text-primary">{service.price}</p>
                            {service.priceType === 'percentage' && <span className="text-sm text-neutral-500">min fee applies</span>}
                          </div>
                        </div>
                        <Button className="btn-transition hover-up">Book This Service</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!provider.services || provider.services.length === 0) && (
                  <div className="col-span-full">
                    <p className="text-neutral-600">This provider hasn't listed any services yet. Contact them directly for pricing information.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reviews Tab Content */}
            <TabsContent value="reviews" className="fade-in">
              <div className="grid grid-cols-1 gap-6">
                {provider.reviews && provider.reviews.map((review, index) => (
                  <Card key={index} className="card-hover slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3 transition-transform hover:scale-110">
                            <span className="text-primary font-medium">
                              {review.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{review.author}</p>
                            <p className="text-sm text-neutral-500">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full transition-all hover:bg-amber-100">
                          <span className="font-medium mr-1">{review.rating}</span>
                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                        </div>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 transition-all hover:border-neutral-200">
                        <p className="text-neutral-700">{review.comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!provider.reviews || provider.reviews.length === 0) && (
                  <div className="text-center p-8 bg-neutral-50 rounded-lg border border-neutral-200 fade-in">
                    <Star className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">This provider doesn't have any reviews yet. Be the first to leave a review after using their services.</p>
                    <Button className="mt-4 btn-transition hover-up">Leave a Review</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Availability Tab Content */}
            <TabsContent value="availability" className="fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="slide-in-right">
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-semibold mb-4 text-primary">Working Hours</h2>
                      {provider.is24_7 ? (
                        <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20 transition-all">
                          <p className="text-secondary font-medium flex items-center">
                            <span className="inline-block w-3 h-3 bg-secondary rounded-full mr-2 pulse"></span>
                            This provider is available 24/7
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-lg border border-neutral-200 p-4">
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Monday</span>
                            <span>9:00 - 17:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Tuesday</span>
                            <span>9:00 - 17:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Wednesday</span>
                            <span>9:00 - 17:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Thursday</span>
                            <span>9:00 - 17:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Friday</span>
                            <span>9:00 - 17:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Saturday</span>
                            <span>10:00 - 14:00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between transition-colors hover:bg-neutral-50 p-2 rounded">
                            <span className="font-medium">Sunday</span>
                            <span className="text-neutral-500">Closed</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="slide-in-right" style={{ animationDelay: '0.1s' }}>
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-semibold mb-4 text-primary">Book an Appointment</h2>
                      <div className="transition-all hover:border-primary/30 rounded-lg">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                          className="rounded-md border transition-all"
                          initialFocus
                        />
                      </div>
                      <Button onClick={handleBookAppointment} className="w-full mt-4 btn-transition hover-up">
                        Request Appointment
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
