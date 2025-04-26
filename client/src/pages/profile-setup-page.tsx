import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { providerTypeEnum } from '@shared/schema';
import { Redirect } from 'wouter';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Provider profile schema
const providerProfileSchema = z.object({
  userId: z.number(),
  providerType: z.enum(providerTypeEnum.enumValues),
  education: z.string().min(5, "Please provide your educational background"),
  graduationYear: z.coerce.number().min(1950).max(new Date().getFullYear()),
  yearsOfExperience: z.coerce.number().min(0).max(80),
  description: z.string().min(20, "Please provide a detailed description of your services"),
  languages: z.array(z.string()),
  location: z.string().min(2, "Please provide your location"),
  address: z.string().min(5, "Please provide your address"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadius: z.coerce.number().min(1, "Minimum radius is 1 km").max(200, "Maximum radius is 200 km"),
  is24_7: z.boolean().default(false),
});

type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

// Common languages in Romania
const commonLanguages = [
  { id: "romanian", label: "Romanian" },
  { id: "hungarian", label: "Hungarian" },
  { id: "german", label: "German" },
  { id: "english", label: "English" },
  { id: "french", label: "French" },
  { id: "italian", label: "Italian" },
  { id: "spanish", label: "Spanish" },
  { id: "russian", label: "Russian" },
];

const ProfileSetupPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

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

  // Form
  const form = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      userId: user?.id,
      providerType: profile?.providerType || 'lawyer',
      education: profile?.education || '',
      graduationYear: profile?.graduationYear || new Date().getFullYear() - 5,
      yearsOfExperience: profile?.yearsOfExperience || 1,
      description: profile?.description || '',
      languages: profile?.languages || [],
      location: profile?.location || '',
      address: profile?.address || '',
      latitude: profile?.latitude || 0,
      longitude: profile?.longitude || 0,
      serviceRadius: profile?.serviceRadius || 10,
      is24_7: profile?.is24_7 || false,
    },
  });

  // Create/update provider profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProviderProfileFormValues) => {
      // If profile exists, update it, otherwise create a new one
      const method = profile ? 'PATCH' : 'POST';
      const endpoint = '/api/providers/profile';
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/provider'] });
      toast({
        title: profile ? "Profile Updated" : "Profile Created",
        description: profile ? "Your provider profile has been updated successfully." : "Your provider profile has been created successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error processing your request",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProviderProfileFormValues) => {
    // Add selected languages to form data
    data.languages = selectedLanguages;
    profileMutation.mutate(data);
  };

  // Handle language selection
  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  // Redirect if user is not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If user is a client, show client profile page
  if (user.role === 'client') {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Client Profile</CardTitle>
            <CardDescription>
              Your profile information as a client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This information will be visible to service providers you contact.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={user.fullName} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled className="mt-1" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Account Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your account preferences
                </p>
                <div className="space-y-4">
                  <Button variant="outline">Change Password</Button>
                  <p className="text-sm text-muted-foreground">
                    To become a service provider, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Provider profile setup
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Provider Profile Setup</CardTitle>
          <CardDescription>
            Complete your profile to start offering legal services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  {/* Provider Type */}
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
                              <SelectValue placeholder="Select your provider type" />
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
                          Select the type of legal service you provide
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Education */}
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Law Degree, University of Bucharest" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your educational background and qualifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Graduation Year */}
                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input type="number" min={1950} max={new Date().getFullYear()} {...field} />
                        </FormControl>
                        <FormDescription>
                          The year you completed your professional education
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Years of Experience */}
                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={80} {...field} />
                        </FormControl>
                        <FormDescription>
                          How many years of professional experience you have
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex justify-end">
                    <Button type="button" onClick={() => setStep(2)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Professional Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Professional Details</h3>
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your services, expertise, and professional background..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your profile page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Languages */}
                  <div className="space-y-2">
                    <Label>Languages Spoken</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {commonLanguages.map((language) => (
                        <div className="flex items-center space-x-2" key={language.id}>
                          <Checkbox 
                            id={`language-${language.id}`} 
                            checked={selectedLanguages.includes(language.id)}
                            onCheckedChange={() => toggleLanguage(language.id)}
                          />
                          <label
                            htmlFor={`language-${language.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {language.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedLanguages.length === 0 && (
                      <p className="text-sm text-destructive">Please select at least one language</p>
                    )}
                  </div>
                  
                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(3)} disabled={selectedLanguages.length === 0}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Location & Availability */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Location & Availability</h3>
                  
                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City/Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bucharest" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main city or area where you provide services
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your office address" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your office address will be visible to clients who book your services
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Service Radius */}
                  <FormField
                    control={form.control}
                    name="serviceRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Radius (km)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={200} {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum distance you're willing to travel to provide services (in kilometers)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* 24/7 Availability */}
                  <FormField
                    control={form.control}
                    name="is24_7"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Available 24/7</FormLabel>
                          <FormDescription>
                            Check this if you provide emergency services and are available 24/7
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={profileMutation.isPending}
                    >
                      {profileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        profile ? "Update Profile" : "Complete Setup"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetupPage;