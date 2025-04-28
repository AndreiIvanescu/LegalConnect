import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, AlertCircle, CheckCircle2, Clock, User, FileText, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/currency";
import { Redirect } from "wouter";
import { cleanDescription } from "@/lib/utils";

// Form schema for job posting
const jobPostingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  providerType: z.enum(["notary", "judicial_executor", "lawyer", "judge"]),
  location: z.string().min(3, "Location is required"),
  budget: z.coerce.number().min(1, "Budget must be at least 1 RON"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  deadline: z.string().optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

function JobStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open":
      return <Badge className="bg-green-500">{status}</Badge>;
    case "assigned":
      return <Badge className="bg-blue-500">{status}</Badge>;
    case "completed":
      return <Badge className="bg-purple-500">{status}</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function NewJobDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      description: "",
      providerType: "notary",
      location: "",
      budget: 0,
      latitude: undefined,
      longitude: undefined,
      deadline: undefined,
    },
  });
  
  const createJobMutation = useMutation({
    mutationFn: async (data: JobPostingFormValues) => {
      // Convert budget from RON to bani (cents)
      const dataToSend = {
        ...data,
        budget: Math.round(data.budget * 100),
      };
      const res = await apiRequest("POST", "/api/jobs", dataToSend);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job posted successfully",
        description: "Your job posting is now visible to providers",
      });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to post job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: JobPostingFormValues) {
    createJobMutation.mutate(data);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">Post a new job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Post a new legal job</DialogTitle>
          <DialogDescription>
            Describe what legal service you need. Providers matching your criteria will be able to apply.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Need notary services for property purchase" {...field} />
                  </FormControl>
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
                      placeholder="Describe in detail what legal service you need..." 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="providerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (RON)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="0.01"
                        placeholder="Budget in RON" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Full amount in RON</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bucharest, Romania" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createJobMutation.isPending}
                className="w-full"
              >
                {createJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Job
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function JobPostingCard({ job, onUpdate }: { job: any, onUpdate: () => void }) {
  const { toast } = useToast();
  
  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/jobs/${job.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Job deleted",
        description: "Your job posting has been deleted",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Format the dates for display
  const createdAt = new Date(job.createdAt).toLocaleDateString();
  const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline";
  
  // Query for applications for this job
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/jobs", job.id, "applications"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: job.status !== "open", // Only fetch applications if job is not open
  });
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </CardDescription>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-gray-600">{cleanDescription(job.description)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" />
                Provider Type
              </h4>
              <p className="text-sm text-gray-600 capitalize">{job.providerType.replace('_', ' ')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Budget
              </h4>
              <p className="text-sm text-gray-600">{formatPrice(job.budget, 'RO')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Posted On
              </h4>
              <p className="text-sm text-gray-600">{createdAt}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Deadline
              </h4>
              <p className="text-sm text-gray-600">{deadline}</p>
            </div>
          </div>
          
          {job.status !== "open" && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Applications ({isLoadingApplications ? "..." : applications.length})
              </h4>
              {isLoadingApplications ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-sm text-gray-500">No applications yet</p>
              ) : (
                <div className="space-y-2">
                  {applications.map((app: any) => (
                    <Card key={app.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{app.providerName || "Provider"}</div>
                          <div className="text-sm text-gray-500">{app.message}</div>
                        </div>
                        <Button size="sm" variant={app.status === 'accepted' ? 'default' : 'outline'}>
                          {app.status === 'pending' ? 'Review' : 
                           app.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => deleteJobMutation.mutate()} disabled={deleteJobMutation.isPending || job.status !== 'open'}>
          {deleteJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Delete
        </Button>
        <Button size="sm" disabled={job.status !== 'open'}>
          View Applications
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function JobPostingPage() {
  const { user, isLoading } = useAuth();
  
  // Redirect if not authenticated or not a client
  if (!isLoading && (!user || user.role !== 'client')) {
    return <Redirect to="/auth" />;
  }
  
  const { data: myJobs = [], isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ["/api/jobs/my"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Filter jobs by status
  const openJobs = myJobs.filter((job: any) => job.status === 'open');
  const assignedJobs = myJobs.filter((job: any) => job.status === 'assigned');
  const completedJobs = myJobs.filter((job: any) => job.status === 'completed');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Job Postings</h1>
        <NewJobDialog onSuccess={refetchJobs} />
      </div>
      
      <Tabs defaultValue="open">
        <TabsList className="mb-4">
          <TabsTrigger value="open">Open ({openJobs.length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({assignedJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open">
          {isLoadingJobs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : openJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No open job postings</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                You haven't posted any jobs that are currently open. Click the "Post a new job" button to create one.
              </p>
            </div>
          ) : (
            openJobs.map((job: any) => (
              <JobPostingCard key={job.id} job={job} onUpdate={refetchJobs} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="assigned">
          {isLoadingJobs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : assignedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No assigned job postings</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                You don't have any jobs that are currently assigned to providers.
              </p>
            </div>
          ) : (
            assignedJobs.map((job: any) => (
              <JobPostingCard key={job.id} job={job} onUpdate={refetchJobs} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {isLoadingJobs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : completedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No completed job postings</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                You don't have any completed jobs yet.
              </p>
            </div>
          ) : (
            completedJobs.map((job: any) => (
              <JobPostingCard key={job.id} job={job} onUpdate={refetchJobs} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}