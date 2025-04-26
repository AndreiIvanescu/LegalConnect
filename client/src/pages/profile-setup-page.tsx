import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { insertProviderProfileSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Upload, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Award, MapPin, School, Languages, Clock } from 'lucide-react';

// Extend the provider profile schema with additional validations
// Create a custom schema for the form that uses string for languages
const providerProfileFormSchema = insertProviderProfileSchema
  .extend({
    description: z.string().min(50, {
      message: "Description must be at least 50 characters long",
    }),
    education: z.string().min(5, {
      message: "Education information is required",
    }),
    // Use string for the form, we'll convert it to array before submission
    languages: z.string().min(2, {
      message: "Please provide spoken languages",
    }),
    location: z.string().min(2, {
      message: "Location is required",
    }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    serviceRadius: z.number().min(1000, {
      message: "Service radius must be at least 1000 meters",
    }),
  });

export default function ProfileSetupPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing provider profile
  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/profile/provider'],
    enabled: !!user && user.role === 'provider',
  });

  const form = useForm<z.infer<typeof providerProfileFormSchema>>({
    resolver: zodResolver(providerProfileFormSchema),
    defaultValues: {
      userId: user?.id,
      providerType: 'notary',
      description: '',
      education: '',
      yearsOfExperience: 0,
      languages: '',
      location: '',
      workingHours: '',
      is24_7: false,
      isTopRated: false,
      completedServices: 0,
      serviceRadius: 5000, // 5km default
      imageUrl: '',
    },
  });

  // When existing profile data is loaded, set form values
  useEffect(() => {
    if (existingProfile && Object.keys(existingProfile).length > 0) {
      setIsEditMode(true);
      
      // Convert languages array to comma-separated string
      const languagesString = Array.isArray(existingProfile.languages) 
        ? existingProfile.languages.join(', ') 
        : '';
        
      // Set image preview if available
      if (existingProfile.imageUrl) {
        setImagePreview(existingProfile.imageUrl);
      }
      
      // Reset form with existing profile data
      form.reset({
        userId: user?.id,
        providerType: existingProfile.providerType || 'notary',
        description: existingProfile.description || '',
        education: existingProfile.education || '',
        yearsOfExperience: existingProfile.yearsOfExperience || 0,
        languages: languagesString,
        location: existingProfile.location || '',
        workingHours: existingProfile.workingHours || '',
        is24_7: existingProfile.is24_7 || false,
        isTopRated: existingProfile.isTopRated || false,
        completedServices: existingProfile.completedServices || 0,
        serviceRadius: existingProfile.serviceRadius || 5000,
        imageUrl: existingProfile.imageUrl || '',
        latitude: existingProfile.latitude,
        longitude: existingProfile.longitude,
      });
    }
  }, [existingProfile, form, user]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Use PATCH to update if in edit mode, otherwise POST to create
      const method = isEditMode ? 'PATCH' : 'POST';
      const response = await apiRequest(method, '/api/profile/provider', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Profile updated successfully" : "Profile created successfully",
        description: "You can now manage your provider profile",
      });
      navigate('/provider/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: isEditMode ? "Failed to update profile" : "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      
      // Update the form value - prefix with '/uploads/' to ensure correct path
      form.setValue('imageUrl', `/uploads/${file.name}`);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  function onSubmit(data: z.infer<typeof providerProfileFormSchema>) {
    // If location is provided but coordinates are missing, use geocoding here
    // For now, we'll use default coordinates for demonstration
    if (!data.latitude || !data.longitude) {
      data.latitude = 44.4268; // Bucharest latitude
      data.longitude = 26.1025; // Bucharest longitude
    }
    
    // Convert languages from string to array before submission
    const formattedData = {
      ...data,
      // Split the comma-separated languages string into an array
      languages: data.languages.split(',').map(lang => lang.trim())
    };
    
    // If we have a file selected, ensure we're using the correct path format
    if (selectedFile) {
      // In a real app, you would upload the file to a server first
      // and then use the returned URL
      
      // Make sure image URL has the correct format with /uploads prefix
      formattedData.imageUrl = formattedData.imageUrl.startsWith('/uploads/') 
        ? formattedData.imageUrl 
        : `/uploads/${selectedFile.name}`;

      console.log("Saving image URL:", formattedData.imageUrl);
    }
    
    mutation.mutate(formattedData);
  }

  if (isLoadingProfile) {
    return (
      <div className="container py-8 max-w-3xl flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {isEditMode ? 'Edit Your Provider Profile' : 'Complete Your Provider Profile'}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update your professional information to better serve your clients' 
              : 'Set up your professional profile to start offering legal services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="providerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="notary">Notary</SelectItem>
                          <SelectItem value="judicial_executor">Judicial Executor</SelectItem>
                          <SelectItem value="lawyer">Lawyer</SelectItem>
                          <SelectItem value="judge">Judge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of legal services you provide
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="50"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many years have you been practicing?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your professional background, expertise, and services offered..." 
                        className="resize-none min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed to potential clients
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        Education
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Law Degree, University of Bucharest" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Languages className="h-4 w-4" />
                        Languages Spoken
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Romanian, English, French" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Office Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Bucharest, Sector 1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Radius (meters)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1000" 
                          step="1000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How far are you willing to travel to provide services?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Working Hours
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Mon-Fri: 9:00-17:00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is24_7"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Available 24/7</FormLabel>
                        <FormDescription>
                          Check if you offer emergency services
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <ImagePlus className="h-4 w-4" />
                      Profile Picture
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        {imagePreview ? (
                          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary">
                            <img
                              src={imagePreview}
                              alt="Profile preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // If image fails to load, show placeholder
                                e.currentTarget.src = "https://via.placeholder.com/100x100?text=Error";
                                // Also clear the stored URL to avoid persisting bad URLs
                                form.setValue('imageUrl', '');
                                setImagePreview(null);
                                // Alert the user
                                toast({
                                  title: "Image Error",
                                  description: "Failed to load the image. Please try uploading again.",
                                  variant: "destructive"
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
                            <User className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col w-full items-center gap-2">
                          {/* Hidden file input */}
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          
                          {/* Custom file upload button */}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex gap-2 items-center justify-center"
                            onClick={handleUploadClick}
                          >
                            <Upload className="h-4 w-4" />
                            {selectedFile ? 'Change Image' : 'Upload Image'}
                          </Button>
                          
                          {/* Show selected filename */}
                          {selectedFile && (
                            <p className="text-sm text-gray-500 mt-1">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                          
                          {/* Hidden actual input for form handling */}
                          <Input
                            type="hidden"
                            {...field}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a profile picture from your device (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="px-0 pb-0 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting..." : (isEditMode ? "Save Changes" : "Complete Profile Setup")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}