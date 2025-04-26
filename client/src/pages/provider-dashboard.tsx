import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertServiceSchema } from '@shared/schema';
import { 
  formatPrice, 
  parsePrice, 
  getUserCountry, 
  getUserCurrencySymbol, 
  getCurrencyForCountry,
  formatPriceValue
} from '@/lib/currency';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, 
  FileText, 
  Award, 
  Clock, 
  Settings, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2,
  CreditCard,
  CheckCircle2,
  AlarmClock,
  XCircle,
  ImagePlus,
  User
} from 'lucide-react';

// Service form schema with additional validations
const serviceSchema = insertServiceSchema.extend({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  priceType: z.enum(['fixed', 'percentage']),
});

export default function ProviderDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  // Fetch provider profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile/provider'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/profile/provider');
      if (!res.ok) {
        throw new Error('Failed to fetch provider profile');
      }
      return res.json();
    },
  });

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const res = await apiRequest('GET', `/api/services/provider/${profile.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch services');
      }
      return res.json();
    },
    enabled: !!profile?.id,
  });

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/provider'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bookings/provider');
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return res.json();
    },
  });

  // Forms
  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      providerId: profile?.id,
      title: '',
      description: '',
      priceType: 'fixed',
      price: 0,
      percentageRate: 0,
      minPrice: 0,
    },
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isAddServiceDialogOpen) {
      if (!serviceToEdit) {
        serviceForm.reset({
          providerId: profile?.id,
          title: '',
          description: '',
          priceType: 'fixed',
          price: 0,
          percentageRate: 0,
          minPrice: 0,
        });
      }
    }
  }, [isAddServiceDialogOpen, serviceForm, profile?.id, serviceToEdit]);

  // Set form values when editing a service
  React.useEffect(() => {
    if (serviceToEdit) {
      serviceForm.reset({
        providerId: profile?.id,
        title: serviceToEdit.title,
        description: serviceToEdit.description,
        priceType: serviceToEdit.priceType,
        price: serviceToEdit.price || 0,
        percentageRate: serviceToEdit.percentageRate || 0,
        minPrice: serviceToEdit.minPrice || 0,
      });
      setIsAddServiceDialogOpen(true);
    }
  }, [serviceToEdit, serviceForm, profile?.id]);

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceSchema>) => {
      const res = await apiRequest('POST', '/api/services', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services', profile?.id] });
      setIsAddServiceDialogOpen(false);
      toast({
        title: "Service created",
        description: "Your service has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof serviceSchema> }) => {
      const res = await apiRequest('PATCH', `/api/services/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services', profile?.id] });
      setIsAddServiceDialogOpen(false);
      setServiceToEdit(null);
      toast({
        title: "Service updated",
        description: "Your service has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services', profile?.id] });
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      toast({
        title: "Service deleted",
        description: "Your service has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddService = (data: z.infer<typeof serviceSchema>) => {
    data.providerId = profile?.id;
    
    // Convert string values to numbers
    if (data.priceType === 'fixed') {
      data.price = Number(data.price);
      data.percentageRate = 0;
      data.minPrice = 0;
    } else {
      data.percentageRate = Number(data.percentageRate);
      data.minPrice = Number(data.minPrice);
      data.price = 0;
    }

    if (serviceToEdit) {
      updateServiceMutation.mutate({ id: serviceToEdit.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEditService = (service: any) => {
    setServiceToEdit(service);
    setIsAddServiceDialogOpen(true);
  };

  const handleDeleteService = (id: number) => {
    setServiceToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete);
    }
  };

  // Format price based on user's country currency
  const formatServicePrice = (service: any) => {
    const userCountry = getUserCountry();
    
    if (service.priceType === 'fixed') {
      return formatPrice(service.price, userCountry);
    } else {
      const minPriceFormatted = formatPrice(service.minPrice, userCountry);
      return `${service.percentageRate}% (min. ${minPriceFormatted})`;
    }
  };

  const formatBookingStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (profileLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              You need to complete your provider profile setup first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/profile/setup')}>
              Set Up Provider Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your services, bookings, and profile settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Provider Type</span>
                  <Badge variant="outline" className="capitalize">{profile.providerType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed Services</span>
                  <span className="font-medium">{profile.completedServices || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="font-medium">{profile.yearsOfExperience} years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Provider Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Ratings</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Top Rated Status</span>
                  <Badge variant={profile.isTopRated ? "default" : "outline"}>
                    {profile.isTopRated ? "Yes" : "Not Yet"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Working Hours</span>
                  <span className="font-medium">{profile.workingHours || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">24/7 Availability</span>
                  <Badge variant={profile.is24_7 ? "default" : "outline"}>
                    {profile.is24_7 ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Service Radius</span>
                  <span className="font-medium">{profile.serviceRadius / 1000} km</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-none md:flex">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Services</CardTitle>
                  <CardDescription>
                    Manage the services you offer to clients
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setServiceToEdit(null);
                    setIsAddServiceDialogOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't added any services yet.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddServiceDialogOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service: any) => (
                        <TableRow 
                          key={service.id} 
                          className="group cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEditService(service)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {service.title}
                              <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                (Click to edit)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {service.priceType === 'fixed' ? 'Fixed Price' : 'Percentage Rate'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatServicePrice(service)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditService(service);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="hidden md:inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteService(service.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden md:inline">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  Manage your appointments and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You don't have any bookings yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.clientName}</TableCell>
                          <TableCell>{booking.serviceName}</TableCell>
                          <TableCell>{formatDate(booking.appointmentTime)}</TableCell>
                          <TableCell>{formatBookingStatus(booking.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="h-8 gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-xs">Confirm</span>
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 gap-1">
                                <AlarmClock className="h-3.5 w-3.5" />
                                <span className="text-xs">Reschedule</span>
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 gap-1" disabled={booking.status === 'cancelled'}>
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                                <span className="text-xs text-destructive">Cancel</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your provider profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    {profile.imageUrl ? (
                      <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-primary">
                        <img
                          src={profile.imageUrl}
                          alt="Profile picture"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 w-32 rounded-full bg-muted">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <Button variant="outline" className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" /> Update Profile Picture
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Edit your personal and professional details
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Provider Type</label>
                        <p className="capitalize">{profile.providerType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Years of Experience</label>
                        <p>{profile.yearsOfExperience}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm">{profile.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Education</label>
                        <p>{profile.education}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Languages</label>
                        <p>{profile.languages}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Location Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your office location and service area
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Office Location</label>
                        <p>{profile.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Service Radius</label>
                        <p>{profile.serviceRadius / 1000} km</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Availability Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure your working hours and availability
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Working Hours</label>
                        <p>{profile.workingHours || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Available 24/7</label>
                        <p>{profile.is24_7 ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/profile/edit')}>
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="sm:max-w-[550px] transition-all duration-300 ease-in-out">
          <DialogHeader className={`${serviceToEdit ? "bg-blue-50 p-4 rounded-md mb-4" : ""}`}>
            <DialogTitle className="flex items-center gap-2">
              {serviceToEdit ? (
                <>
                  <Edit className="h-5 w-5 text-blue-600" />
                  <span>Edit Service: <span className="text-blue-600">{serviceToEdit?.title}</span></span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Add New Service</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {serviceToEdit 
                ? "Update the details of your existing service"
                : "Add a new service that you can offer to clients"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(handleAddService)} className="space-y-6">
              <FormField
                control={serviceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Document Notarization" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title for your service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this service includes..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed explanation of what clients can expect
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select price type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="percentage">Percentage Rate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how you want to charge for this service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serviceForm.watch('priceType') === 'fixed' ? (
                <FormField
                  control={serviceForm.control}
                  name="price"
                  render={({ field }) => {
                    // Get the user's country
                    const userCountry = getUserCountry();
                    const currency = getCurrencyForCountry(userCountry);
                    
                    // Convert cents to full units for display
                    const displayValue = field.value ? formatPriceValue(field.value, userCountry) : '';
                    
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          Fixed Price in {currency.symbol}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step="1"
                            placeholder={`e.g., 150 ${currency.symbol}`}
                            value={displayValue}
                            onChange={(e) => {
                              // Parse input value and convert to RON cents for storage
                              const parsedValue = parsePrice(e.target.value, userCountry);
                              field.onChange(parsedValue);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter price in full {currency.name} units (e.g., 150 {currency.symbol})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              ) : (
                <>
                  <FormField
                    control={serviceForm.control}
                    name="percentageRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="e.g., 1.5 for 1.5%"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the percentage rate (e.g., 1.5 for 1.5%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="minPrice"
                    render={({ field }) => {
                      // Get the user's country
                      const userCountry = getUserCountry();
                      const currency = getCurrencyForCountry(userCountry);
                      
                      // Convert cents to full units for display
                      const displayValue = field.value ? formatPriceValue(field.value, userCountry) : '';
                      
                      return (
                        <FormItem>
                          <FormLabel>Minimum Fee in {currency.symbol}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              placeholder={`e.g., 100 ${currency.symbol}`}
                              value={displayValue}
                              onChange={(e) => {
                                // Parse input value and convert to RON cents for storage
                                const parsedValue = parsePrice(e.target.value, userCountry);
                                field.onChange(parsedValue);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum fee in full {currency.name} units (e.g., 100 {currency.symbol})
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </>
              )}

              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  className={serviceToEdit ? "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" : ""}
                >
                  {serviceToEdit && !updateServiceMutation.isPending && <Edit className="h-4 w-4" />}
                  {(createServiceMutation.isPending || updateServiceMutation.isPending) 
                    ? "Saving..." 
                    : serviceToEdit ? "Update Service" : "Add Service"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteService}
              disabled={deleteServiceMutation.isPending}
            >
              {deleteServiceMutation.isPending ? "Deleting..." : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}