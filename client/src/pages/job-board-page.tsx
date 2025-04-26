import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { formatPrice } from "@/lib/currency";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Loader2, 
  MapPin, 
  Search, 
  User, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function JobCard({ job, onApply }: { job: any, onApply: () => void }) {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // Format the dates for display
  const createdAt = new Date(job.createdAt).toLocaleDateString();
  const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline";

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/job-applications", {
        jobId: job.id,
        message: message,
        proposedPrice: job.budget, // Default to the client's budget initially
        status: "pending"
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your application has been sent to the client",
      });
      setIsApplyOpen(false);
      setMessage("");
      onApply();
    },
    onError: (error) => {
      toast({
        title: "Failed to apply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <div className="flex items-center mt-1 text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </div>
          </div>
          <Badge className="bg-green-500">Open</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-gray-600">{job.description}</p>
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogTrigger asChild>
            <Button>Apply Now</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply for Job</DialogTitle>
              <DialogDescription>
                Send a message to the client explaining why you're the right provider for this job.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Job Title</h4>
                <p className="text-sm">{job.title}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Budget</h4>
                <p className="text-sm">{formatPrice(job.budget, 'RO')}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Your Message</h4>
                <Textarea
                  placeholder="Explain why you're the best fit for this job..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={applyMutation.isPending || !message.trim()}
                onClick={() => applyMutation.mutate()}
                className="w-full"
              >
                {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function ApplicationCard({ application }: { application: any }) {
  // Format the date for display
  const appliedDate = new Date(application.createdAt).toLocaleDateString();
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{application.jobTitle || "Job Application"}</CardTitle>
            <div className="flex items-center mt-1 text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              Applied on {appliedDate}
            </div>
          </div>
          <Badge 
            className={
              application.status === 'accepted' ? 'bg-green-500' : 
              application.status === 'rejected' ? 'bg-red-500' : 
              'bg-blue-500'
            }
          >
            {application.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Your Message</h4>
            <p className="text-sm text-gray-600">{application.message}</p>
          </div>
          
          {application.clientFeedback && (
            <div>
              <h4 className="text-sm font-medium mb-1">Client Feedback</h4>
              <p className="text-sm text-gray-600">{application.clientFeedback}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Proposed Price
              </h4>
              <p className="text-sm text-gray-600">{formatPrice(application.proposedPrice, 'RO')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" />
                Client
              </h4>
              <p className="text-sm text-gray-600">{application.clientName || "Anonymous Client"}</p>
            </div>
          </div>
        </div>
      </CardContent>
      {application.status === 'accepted' && (
        <CardFooter className="flex justify-end">
          <Button>Contact Client</Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function JobBoardPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  
  // Redirect if not authenticated or not a provider
  if (!isLoading && (!user || user.role !== 'provider')) {
    return <Redirect to="/auth" />;
  }

  // Get provider profile to determine provider type
  const { data: providerProfile } = useQuery({
    queryKey: ["/api/profile/provider"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === 'provider',
  });

  // Get open jobs based on provider type
  const { 
    data: openJobs = [],
    isLoading: isLoadingJobs,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ["/api/jobs/provider-type", providerProfile?.providerType],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!providerProfile?.providerType,
  });

  // Get my applications
  const {
    data: myApplications = [],
    isLoading: isLoadingApplications,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ["/api/job-applications/my"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === 'provider',
  });

  // Filter jobs by search term and provider type
  const filteredJobs = openJobs.filter((job: any) => {
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterType || job.providerType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleApply = () => {
    refetchJobs();
    refetchApplications();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-6">Job Board</h1>
        
        <Tabs defaultValue="browse">
          <TabsList className="mb-4">
            <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search jobs..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterType ? filterType.replace('_', ' ') : 'All Types'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All Types</SelectItem>
                  <SelectItem value="notary">Notary</SelectItem>
                  <SelectItem value="judicial_executor">Judicial Executor</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoadingJobs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No jobs found</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  {searchTerm || filterType 
                    ? "No jobs match your search criteria. Try adjusting your filters."
                    : "There are no open jobs available for your provider type at the moment."}
                </p>
              </div>
            ) : (
              filteredJobs.map((job: any) => (
                <JobCard key={job.id} job={job} onApply={handleApply} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="applications">
            {isLoadingApplications ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No applications yet</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  You haven't applied to any jobs yet. Browse the job board to find opportunities.
                </p>
              </div>
            ) : (
              myApplications.map((application: any) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}