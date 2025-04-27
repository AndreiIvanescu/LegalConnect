import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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
import { Loader2, Calendar, Clock, DollarSign, MapPin, User, MessageSquare, FileText } from "lucide-react";

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
  
  // Fetch user's applications
  const { data: applications, isLoading, isError } = useQuery<Application[]>({
    queryKey: ["/api/users/me/applications"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/me/applications");
      return response.json();
    }
  });
  
  // Filter applications by status
  const pendingApplications = applications?.filter(app => app.status === "pending") || [];
  const acceptedApplications = applications?.filter(app => app.status === "accepted") || [];
  const rejectedApplications = applications?.filter(app => app.status === "rejected") || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load your applications. Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>
      
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Applications */}
        <TabsContent value="pending">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Applications</CardTitle>
                <CardDescription>
                  You don't have any pending applications at the moment.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/find-contracts")}>Find Contracts</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4">
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
            <Card>
              <CardHeader>
                <CardTitle>No Accepted Applications</CardTitle>
                <CardDescription>
                  None of your applications have been accepted yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
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
            <Card>
              <CardHeader>
                <CardTitle>No Rejected Applications</CardTitle>
                <CardDescription>
                  None of your applications have been rejected.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
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
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{application.gig.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Applied on {new Date(application.createdAt).toLocaleDateString()}</span>
            </CardDescription>
          </div>
          <Badge
            variant={
              application.status === "pending" ? "outline" :
              application.status === "accepted" ? "default" : "secondary"
            }
          >
            {application.status === "pending" ? "Pending" :
             application.status === "accepted" ? "Accepted" : "Rejected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {application.customRate ? 
                  `Your Rate: ${application.customRate} RON` : 
                  `Budget: ${application.gig.budgetMin} - ${application.gig.budgetMax} RON`}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{application.gig.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {application.gig.urgency === "asap" && "As soon as possible"}
                {application.gig.urgency === "within_24h" && "Within 24 hours"}
                {application.gig.urgency === "specific_date" && 
                  `On ${new Date(application.gig.specificDate || "").toLocaleDateString()}`}
              </span>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger>View Job Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Client: {application.gig.clientName}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Job Description:</h4>
                    <p className="text-sm">{application.gig.description}</p>
                  </div>
                  
                  {application.gig.attachments && application.gig.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Attachments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.gig.attachments.map((file, index) => (
                          <Badge key={index} variant="outline" className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="proposal">
              <AccordionTrigger>Your Proposal</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">{application.message}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      {application.status === "accepted" && (
        <CardFooter>
          <Button 
            className="w-full flex items-center"
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