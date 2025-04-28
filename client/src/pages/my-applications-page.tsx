import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cleanDescription } from "@/lib/utils";
import { 
  Loader2, 
  User, 
  DollarSign, 
  MapPin, 
  Clock, 
  Calendar, 
  MessageSquare, 
  FileText 
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

// Define the application type
interface Application {
  id: number;
  gigId: number;
  providerId: number;
  message: string;
  customRate?: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  gig: {
    id: number;
    title: string;
    category: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    urgency: string;
    specificDate?: string;
    location: string;
    attachments: string[];
    status: "open" | "in_progress" | "completed" | "cancelled";
    createdAt: string;
    clientId: number;
    clientName: string;
  };
}

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Redirect if user is not logged in or is not a provider
  if (!user) {
    navigate("/auth");
    return null;
  }

  if (user.role !== "provider") {
    navigate("/");
    return null;
  }
  
  // Fetch user's applications with more robust error handling
  const { data: applications, isLoading, isError } = useQuery<Application[]>({
    queryKey: ["/api/job-applications/my"],
    queryFn: async () => {
      console.log("Fetching my applications for user:", user);
      try {
        const response = await apiRequest("GET", "/api/job-applications/my");
        const data = await response.json();
        console.log("Applications data:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching applications:", error);
        // Return empty array on error instead of throwing
        return [];
      }
    },
    // Return empty array as fallback data
    placeholderData: [],
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  console.log("Applications data in component:", applications);
  
  // Filter applications by status - with extra safety checks
  const pendingApplications = applications?.filter(app => app?.status === "pending") || [];
  const acceptedApplications = applications?.filter(app => app?.status === "accepted") || [];
  const rejectedApplications = applications?.filter(app => app?.status === "rejected") || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Show an empty state instead of an error
  if (isError) {
    return (
      <div className="container py-8">
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-center text-amber-800">Application History</CardTitle>
            <CardDescription className="text-center text-amber-700">
              We're having trouble loading your applications. You can try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-amber-600 text-amber-800 hover:bg-amber-100"
            >
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container pt-4 pb-24 md:pt-8 md:pb-8">
      <h1 className="text-2xl font-bold mb-6 px-4 md:px-0">My Applications</h1>
      
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-primary/5 p-1 rounded-md">
          <TabsTrigger 
            value="pending" 
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="accepted" 
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Accepted ({acceptedApplications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Applications */}
        <TabsContent value="pending">
          {pendingApplications.length === 0 ? (
            <Card className="border-0 shadow-md md:border md:shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-primary-900">No Pending Applications</CardTitle>
                <CardDescription className="text-neutral-600">
                  You don't have any pending applications at the moment.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => navigate("/find-contracts")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Find Contracts
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-5 px-2 md:px-0">
              {pendingApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Accepted Applications */}
        <TabsContent value="accepted">
          {acceptedApplications.length === 0 ? (
            <Card className="border-0 shadow-md md:border md:shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-primary-900">No Accepted Applications</CardTitle>
                <CardDescription className="text-neutral-600">
                  None of your applications have been accepted yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-5 px-2 md:px-0">
              {acceptedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Applications */}
        <TabsContent value="rejected">
          {rejectedApplications.length === 0 ? (
            <Card className="border-0 shadow-md md:border md:shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-primary-900">No Rejected Applications</CardTitle>
                <CardDescription className="text-neutral-600">
                  None of your applications have been rejected.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-5 px-2 md:px-0">
              {rejectedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Application Card Component
function ApplicationCard({ 
  application, 
  navigate 
}: { 
  application: Application, 
  navigate: (path: string) => void 
}) {
  // Badge styling based on status
  const getBadgeStyles = () => {
    switch(application.status) {
      case "pending":
        return "border-amber-200 text-amber-700 bg-amber-50";
      case "accepted":
        return "border-emerald-200 text-emerald-700 bg-emerald-50";
      case "rejected":
        return "border-neutral-200 text-neutral-600 bg-neutral-50";
      default:
        return "";
    }
  };

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary-900">{application.gig.title}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-neutral-500">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Applied on {new Date(application.createdAt).toLocaleDateString()}</span>
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`font-medium ${getBadgeStyles()}`}
          >
            {application.status === "pending" ? "Pending" :
             application.status === "accepted" ? "Accepted" : "Rejected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
              <span className="text-neutral-700 font-medium">
                {application.customRate ? 
                  `Your Rate: ${application.customRate} RON` : 
                  `Budget: ${application.gig.budgetMin} - ${application.gig.budgetMax} RON`}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-neutral-700">{application.gig.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              <span className="text-neutral-700">
                {application.gig.urgency === "asap" && "As soon as possible"}
                {application.gig.urgency === "within_24h" && "Within 24 hours"}
                {application.gig.urgency === "specific_date" && 
                  `On ${new Date(application.gig.specificDate || "").toLocaleDateString()}`}
              </span>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-primary/20 focus-within:border-primary/30">
              <AccordionTrigger className="hover:text-primary py-3 font-medium text-neutral-700">View Job Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary/70" />
                    <span className="text-neutral-700 font-medium">Client: {application.gig.clientName}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-neutral-800">Job Description:</h4>
                    <p className="text-sm text-neutral-600">{cleanDescription(application.gig.description)}</p>
                  </div>
                  
                  {application.gig.attachments && application.gig.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-neutral-800">Attachments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.gig.attachments.map((file, index) => (
                          <Badge key={index} variant="outline" className="flex items-center bg-slate-100 text-slate-700 border-slate-200">
                            <FileText className="h-3 w-3 mr-1" />
                            {file.length > 15 ? file.substring(0, 15) + '...' : file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="proposal" className="border-primary/20 focus-within:border-primary/30">
              <AccordionTrigger className="hover:text-primary py-3 font-medium text-neutral-700">Your Proposal</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 pt-1">{application.message}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      {application.status === "accepted" && (
        <CardFooter className="pt-0 pb-4">
          <Button 
            className="w-full flex items-center bg-primary hover:bg-primary/90"
            onClick={() => {
              // Navigate to chat with this client
              navigate(`/messages?client=${application.gig.clientId}`);
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Client
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}