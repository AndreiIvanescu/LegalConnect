import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cleanDescription } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define the form schema
const postGigSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.enum(["notary", "judicial_executor", "lawyer", "judge"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budgetMin: z.string().min(1, "Minimum budget is required"),
  budgetMax: z.string().min(1, "Maximum budget is required"),
  urgency: z.enum(["asap", "within_24h", "specific_date"]),
  specificDate: z.date().optional(),
  location: z.string().min(1, "Location is required"),
});

type PostGigFormValues = z.infer<typeof postGigSchema>;

export default function PostGigPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Redirect if user is not logged in or is a provider
  if (!user) {
    navigate("/auth");
    return null;
  }

  if (user.role === "provider") {
    navigate("/");
    return null;
  }

  // Set up the form
  const form = useForm<PostGigFormValues>({
    resolver: zodResolver(postGigSchema),
    defaultValues: {
      title: "",
      category: "notary",
      description: "",
      budgetMin: "",
      budgetMax: "",
      urgency: "asap",
      location: "",
    },
  });

  // Create mutation for submitting the gig
  const mutation = useMutation({
    mutationFn: async (data: PostGigFormValues) => {
      try {
        // Handle file uploads first if needed
        let attachments: string[] = [];
        
        if (selectedFiles.length > 0) {
          // For now, we'll just collect the file names as a placeholder
          // In a real implementation, you'd upload these files to your server
          attachments = selectedFiles.map(file => file.name);
        }
        
        // Combine form data with attachments and map to the expected server schema fields
        const gigData = {
          title: data.title,
          description: data.description,
          providerType: data.category, // Map category to providerType
          priceType: "fixed", // Default to fixed price
          budget: parseFloat(data.budgetMax) * 100, // Convert to smallest currency unit (bani)
          location: data.location,
          urgency: data.urgency,
          // Include other client-side specific data that we'll handle in frontend
          budgetMin: parseFloat(data.budgetMin),
          budgetMax: parseFloat(data.budgetMax),
          attachments,
        };

        const response = await apiRequest("POST", "/api/jobs", gigData);
        
        // Check if response is valid JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Get the text to show a better error message
          const text = await response.text();
          throw new Error(`Server returned invalid format: ${text.substring(0, 50)}...`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error posting gig:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to post your gig. Please try again.");
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Success!",
        description: "Your legal gig has been posted. Providers will be able to apply soon.",
        variant: "default",
      });
      
      // Refresh gigs data
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/my"] });
      
      // Navigate to my gigs page
      navigate("/my-gigs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post your gig. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: PostGigFormValues) => {
    mutation.mutate(values);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Post a Legal Gig</CardTitle>
          <CardDescription>
            Create a new legal service request for providers to apply to. Be as specific as possible about your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Need Notary for Property Sale Document" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title helps providers understand your needs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
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
                      Select the type of legal professional you need.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your legal needs in detail..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include all relevant details about your request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Budget (RON)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Budget (RON)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Urgency</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="asap" id="asap" />
                          <Label htmlFor="asap">As soon as possible</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="within_24h" id="within_24h" />
                          <Label htmlFor="within_24h">Within 24 hours</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific_date" id="specific_date" />
                          <Label htmlFor="specific_date">Specific date</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("urgency") === "specific_date" && (
                <FormField
                  control={form.control}
                  name="specificDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Needed</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bucharest" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where do you need this service?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File upload section */}
              <div className="space-y-2">
                <FormLabel>Attachments (Optional)</FormLabel>
                <div className="border rounded-md p-4">
                  <label className="flex flex-col items-center cursor-pointer p-4 border-dashed border-2 border-gray-300 rounded-md hover:bg-gray-50 transition">
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload files</span>
                    <span className="text-xs text-gray-500 mt-1">PDF, Word, Images (max 5MB each)</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                    />
                  </label>

                  {/* Display selected files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      <ul className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="flex justify-between items-center text-sm py-1 px-2 bg-gray-50 rounded">
                            <span className="truncate max-w-[90%]">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-5 w-5 p-0"
                            >
                              &times;
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Posting..." : "Post Legal Gig"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}