import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Edit, Trash2, FileText, User, Calendar, DollarSign, MapPin, Clock } from "lucide-react";

// Define the gig type
interface Gig {
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
  applications: Array<{
    id: number;
    providerId: number;
    providerName: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}

export default function MyGigsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [gigToDelete, setGigToDelete] = useState<number | null>(null);
  
  // Redirect if user is not logged in or is a provider
  if (!user) {
    navigate("/auth");
    return null;
  }

  if (user.role === "provider") {
    navigate("/");
    return null;
  }
  
  // Fetch user's gigs
  const { data: gigs, isLoading, isError } = useQuery<Gig[]>({
    queryKey: ["/api/users/me/gigs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/me/gigs");
      return response.json();
    }
  });
  
  // Delete gig mutation
  const deleteMutation = useMutation({
    mutationFn: async (gigId: number) => {
      await apiRequest("DELETE", `/api/gigs/${gigId}`);
    },
    onSuccess: () => {
      toast({
        title: "Gig Deleted",
        description: "Your gig has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/gigs"] });
      setGigToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete gig. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Accept application mutation
  const acceptApplicationMutation = useMutation({
    mutationFn: async ({ gigId, applicationId }: { gigId: number, applicationId: number }) => {
      await apiRequest("PATCH", `/api/jobs/${gigId}/application/${applicationId}`, { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Application Accepted",
        description: "You have accepted this provider's application. They have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/gigs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept application. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle delete confirmation
  const confirmDelete = (gigId: number) => {
    deleteMutation.mutate(gigId);
  };

  // Handle application acceptance
  const acceptApplication = (gigId: number, applicationId: number) => {
    acceptApplicationMutation.mutate({ gigId, applicationId });
  };

  // Filter gigs by status
  const openGigs = gigs?.filter(gig => gig.status === "open") || [];
  const inProgressGigs = gigs?.filter(gig => gig.status === "in_progress") || [];
  const closedGigs = gigs?.filter(gig => ["completed", "cancelled"].includes(gig.status)) || [];

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
            <CardDescription>Failed to load your gigs. Please try again later.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users/me/gigs"] })}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Legal Gigs</h1>
        <Button onClick={() => navigate("/post-gig")}>Post New Gig</Button>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="open">
            Open ({openGigs.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressGigs.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({closedGigs.length})
          </TabsTrigger>
        </TabsList>

        {/* Open Gigs */}
        <TabsContent value="open">
          {openGigs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Open Gigs</CardTitle>
                <CardDescription>
                  You don't have any open gigs at the moment. Post a new gig to get started.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/post-gig")}>Post a Gig</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4">
              {openGigs.map((gig) => (
                <Card key={gig.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{gig.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="mr-1 h-4 w-4" />
                          <span>Posted on {new Date(gig.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/edit-gig/${gig.id}`)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <AlertDialog open={gigToDelete === gig.id} onOpenChange={(open) => {
                          if (!open) setGigToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setGigToDelete(gig.id)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently cancel your gig and notify any providers who have applied.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => confirmDelete(gig.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Budget: {gig.budgetMin} - {gig.budgetMax} RON</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{gig.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {gig.urgency === "asap" && "As soon as possible"}
                          {gig.urgency === "within_24h" && "Within 24 hours"}
                          {gig.urgency === "specific_date" && `On ${new Date(gig.specificDate || "").toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4">{gig.description}</p>
                    
                    {gig.attachments && gig.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                        <div className="flex flex-wrap gap-2">
                          {gig.attachments.map((file, index) => (
                            <Badge key={index} variant="outline" className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Applications ({gig.applications?.length || 0}):</h4>
                      {!gig.applications || gig.applications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No applications yet. Providers will apply to your gig soon.</p>
                      ) : (
                        <div className="space-y-3">
                          {gig.applications.map((application) => (
                            <div key={application.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  <span className="font-medium">{application.providerName}</span>
                                </div>
                                <Badge>
                                  {application.status === "pending" ? "Pending" : 
                                   application.status === "accepted" ? "Accepted" : "Rejected"}
                                </Badge>
                              </div>
                              <p className="text-sm mt-2">{application.message}</p>
                              {application.status === "pending" && (
                                <div className="mt-3 flex justify-end space-x-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => acceptApplication(gig.id, application.id)}
                                    disabled={acceptApplicationMutation.isPending}
                                  >
                                    Accept
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress Gigs */}
        <TabsContent value="in-progress">
          {inProgressGigs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No In-Progress Gigs</CardTitle>
                <CardDescription>
                  You don't have any gigs currently in progress.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {inProgressGigs.map((gig) => (
                <Card key={gig.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{gig.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="mr-1 h-4 w-4" />
                          <span>Posted on {new Date(gig.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge>In Progress</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Budget: {gig.budgetMin} - {gig.budgetMax} RON</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{gig.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {gig.urgency === "asap" && "As soon as possible"}
                          {gig.urgency === "within_24h" && "Within 24 hours"}
                          {gig.urgency === "specific_date" && `On ${new Date(gig.specificDate || "").toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4">{gig.description}</p>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Assigned Provider:</h4>
                      {gig.applications && gig.applications.filter(app => app.status === "accepted").map((application) => (
                        <div key={application.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              <span className="font-medium">{application.providerName}</span>
                            </div>
                            <Badge>Working</Badge>
                          </div>
                          <Button className="mt-3" size="sm" variant="outline" onClick={() => {
                            // Navigate to chat with this provider
                            navigate(`/messages?provider=${application.providerId}`);
                          }}>
                            Message Provider
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => {
                        // Mark as completed
                        // This would need a backend endpoint
                        toast({
                          title: "Coming Soon",
                          description: "The option to mark gigs as completed will be available soon.",
                        });
                      }}
                    >
                      Mark as Completed
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Closed Gigs */}
        <TabsContent value="closed">
          {closedGigs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Closed Gigs</CardTitle>
                <CardDescription>
                  You don't have any completed or cancelled gigs yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {closedGigs.map((gig) => (
                <Card key={gig.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{gig.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="mr-1 h-4 w-4" />
                          <span>Posted on {new Date(gig.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={gig.status === "completed" ? "default" : "secondary"}>
                        {gig.status === "completed" ? "Completed" : "Cancelled"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Budget: {gig.budgetMin} - {gig.budgetMax} RON</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{gig.location}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4">{gig.description}</p>
                    
                    {gig.status === "completed" && gig.applications && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Provider:</h4>
                          {gig.applications.filter(app => app.status === "accepted").map((application) => (
                            <div key={application.id} className="border rounded-md p-3">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium">{application.providerName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                  {gig.status === "completed" && (
                    <CardFooter>
                      <Button variant="outline">
                        Leave Feedback
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}