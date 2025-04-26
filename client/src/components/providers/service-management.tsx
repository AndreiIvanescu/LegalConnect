import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { InsertService } from '@shared/schema';

// UI Components
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';

// Service form schema with validation
const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a more detailed description"),
  priceType: z.enum(["fixed", "hourly", "percentage"]),
  price: z.coerce.number().optional(),
  percentageRate: z.coerce.number().min(0).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.priceType === "fixed" || data.priceType === "hourly") {
    return data.price !== undefined && data.price > 0;
  }
  if (data.priceType === "percentage") {
    return data.percentageRate !== undefined && data.percentageRate > 0;
  }
  return false;
}, {
  message: "Please provide valid pricing information",
  path: ["price"],
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceManagementProps {
  providerId: number;
}

interface Service extends ServiceFormValues {
  id: number;
  providerId: number;
}

// Format currency to RON (Romanian Leu)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 0,
  }).format(amount / 100); // Convert from bani to lei
};

const ServiceManagement: React.FC<ServiceManagementProps> = ({ providerId }) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/providers/${providerId}/services`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/providers/${providerId}/services`);
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      priceType: 'fixed',
      price: 0,
      percentageRate: 0,
      minPrice: 0,
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const res = await apiRequest('POST', '/api/services', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${providerId}/services`] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: editingService ? "Service updated successfully" : "Service created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const res = await apiRequest('DELETE', `/api/services/${serviceId}`);
      return res.status === 204 ? {} : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${providerId}/services`] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ServiceFormValues) => {
    // Create a clean object with only the needed fields based on price type
    const serviceData: Partial<InsertService> = {
      providerId,
      title: data.title,
      description: data.description,
      priceType: data.priceType,
    };

    // Add pricing fields based on the selected price type
    if (data.priceType === 'fixed' || data.priceType === 'hourly') {
      serviceData.price = data.price ? data.price * 100 : undefined; // Convert to bani (cents)
    } else if (data.priceType === 'percentage') {
      serviceData.percentageRate = data.percentageRate;
      serviceData.minPrice = data.minPrice ? data.minPrice * 100 : undefined; // Convert to bani (cents)
    }

    if (editingService) {
      // Update existing service
      apiRequest('PATCH', `/api/services/${editingService.id}`, serviceData)
        .then(() => {
          refetch();
          setIsDialogOpen(false);
          resetForm();
          toast({
            title: "Success",
            description: "Service updated successfully",
          });
        })
        .catch(error => {
          toast({
            title: "Error",
            description: error.message || "Failed to update service",
            variant: "destructive",
          });
        });
    } else {
      // Create new service
      createServiceMutation.mutate(data as ServiceFormValues);
    }
  };

  // Reset form and editing state
  const resetForm = () => {
    form.reset({
      title: '',
      description: '',
      priceType: 'fixed',
      price: 0,
      percentageRate: 0,
      minPrice: 0,
    });
    setEditingService(null);
  };

  // Open dialog for editing a service
  const handleEditService = (service: Service) => {
    setEditingService(service);
    
    // Set form values
    form.reset({
      title: service.title,
      description: service.description,
      priceType: service.priceType,
      price: service.price ? service.price / 100 : undefined, // Convert from bani to lei
      percentageRate: service.percentageRate,
      minPrice: service.minPrice ? service.minPrice / 100 : undefined, // Convert from bani to lei
    });
    
    setIsDialogOpen(true);
  };

  // Confirm and delete a service
  const handleDeleteService = (serviceId: number) => {
    if (window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  // Format price display based on price type
  const formatServicePrice = (service: Service) => {
    if (service.priceType === 'fixed') {
      return service.price ? formatCurrency(service.price) : 'N/A';
    } else if (service.priceType === 'hourly') {
      return service.price ? `${formatCurrency(service.price)}/hour` : 'N/A';
    } else if (service.priceType === 'percentage') {
      return service.percentageRate ? 
        `${service.percentageRate}% (min. ${service.minPrice ? formatCurrency(service.minPrice) : 'N/A'})` : 
        'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>Manage the services you offer to clients</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
                <DialogDescription>
                  {editingService 
                    ? "Update your service information below" 
                    : "Fill in the details to add a new service to your profile"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Contract Review" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive title for your service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your service in detail..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed explanation of what this service includes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Price Type */}
                  <FormField
                    control={form.control}
                    name="priceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset price fields when changing price type
                            if (value === 'fixed' || value === 'hourly') {
                              form.setValue('percentageRate', undefined);
                              form.setValue('minPrice', undefined);
                            } else if (value === 'percentage') {
                              form.setValue('price', undefined);
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pricing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="hourly">Hourly Rate</SelectItem>
                            <SelectItem value="percentage">Percentage-based</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How you want to price this service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Price Fields - shown based on price type */}
                  {(form.watch('priceType') === 'fixed' || form.watch('priceType') === 'hourly') && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch('priceType') === 'fixed' ? 'Fixed Price (RON)' : 'Hourly Rate (RON)'}
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={0.01} {...field} />
                          </FormControl>
                          <FormDescription>
                            {form.watch('priceType') === 'fixed' 
                              ? 'The fixed price for this service in RON' 
                              : 'Your hourly rate for this service in RON'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch('priceType') === 'percentage' && (
                    <>
                      <FormField
                        control={form.control}
                        name="percentageRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentage Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={100} step={0.1} {...field} />
                            </FormControl>
                            <FormDescription>
                              The percentage you charge based on transaction value
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="minPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Fee (RON)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step={0.01} {...field} />
                            </FormControl>
                            <FormDescription>
                              The minimum fee you'll charge regardless of percentage calculation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createServiceMutation.isPending}
                    >
                      {createServiceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingService ? "Update Service" : "Add Service"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No services added yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Add your first service to appear in search results and start receiving booking requests
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setIsDialogOpen(true)}
              >
                Add Your First Service
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service: Service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatServicePrice(service)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
    </div>
  );
};

export default ServiceManagement;