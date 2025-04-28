import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cleanDescription } from "@/lib/utils";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Filter, Clock, DollarSign, MapPin, FileText, CalendarDays } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  distance?: number;
}

export default function FindContractsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState("any");
  const [onlyNearby, setOnlyNearby] = useState(false);
  
  // Application dialog state
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use useEffect to handle authentication redirects
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("User not authenticated, redirecting to auth page");
        navigate("/auth");
      } else if (user.role !== "provider") {
        console.log(`User is ${user.role}, not provider - redirecting to home`);
        navigate("/");
      }
    }
  }, [user, authLoading, navigate]);
  
  // Fetch provider profile to get provider type
  const { data: providerProfile } = useQuery({
    queryKey: ['/api/profile/provider'],
    queryFn: async () => {
      if (!user || user.role !== 'provider') {
        return null;
      }
      
      try {
        const response = await apiRequest("GET", "/api/profile/provider");
        return response.json();
      } catch (error) {
        console.error("Error fetching provider profile:", error);
        return null;
      }
    },
    enabled: !!user && user.role === 'provider'
  });
  
  // Get provider type from profile or default to 'lawyer'
  const providerType = providerProfile?.providerType || 'lawyer';
  
  // Fetch gigs
  const { data: gigs, isLoading, isError } = useQuery<Gig[]>({
    queryKey: [`/api/jobs/provider-type/${providerType}`, { searchTerm, category, budgetMin, budgetMax, urgency, onlyNearby }],
    queryFn: async () => {
      // If user is not authenticated, return an empty array
      if (!user) {
        return [];
      }
      
      // Build query params
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append("searchTerm", searchTerm);
      }
      
      if (category && category !== "all") {
        params.append("category", category);
      }
      
      if (budgetMin) {
        params.append("budgetMin", budgetMin);
      }
      
      if (budgetMax) {
        params.append("budgetMax", budgetMax);
      }
      
      if (urgency && urgency !== "any") {
        params.append("urgency", urgency);
      }
      
      if (onlyNearby) {
        params.append("nearby", "true");
      }
      
      params.append("status", "open");
      
      // Use the correct endpoint for job postings instead of gigs
      const url = `/api/jobs/provider-type/${providerType}${params.toString() ? `?${params.toString()}` : ''}`;
      try {
        const response = await apiRequest("GET", url);
        return response.json();
      } catch (error) {
        console.error("Error fetching jobs:", error);
        return [];
      }
    },
    // Skip the query if the user isn't authenticated
    enabled: !!user && user.role === 'provider'
  });

  // Apply to gig mutation
  const applyMutation = useMutation({
    mutationFn: async ({ gigId, message, rate }: { gigId: number, message: string, rate?: string }) => {
      const data = {
        message,
        ...(rate && { customRate: parseFloat(rate) })
      };
      
      await apiRequest("POST", `/api/jobs/${gigId}/applications`, data);
    },
    onSuccess: () => {
      toast({
        title: "Application Sent",
        description: "Your application has been sent to the client. You will be notified if they accept.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/provider-type/${providerType}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications/my"] });
      setDialogOpen(false);
      setProposalMessage("");
      setCustomRate("");
      setSelectedGig(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send application. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle apply submission
  const handleApply = () => {
    if (!selectedGig) return;
    
    if (!proposalMessage.trim()) {
      toast({
        title: "Missing Message",
        description: "Please provide a proposal message for the client.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate({
      gigId: selectedGig.id,
      message: proposalMessage,
      rate: customRate
    });
  };

  // Filter gigs based on search term and filters
  const filteredGigs = gigs || [];

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
            <CardDescription>Failed to load available contracts. Please try again later.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/jobs/provider-type/${providerType}`] })}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container pt-4 pb-24 md:pt-8 md:pb-8">
      <h1 className="text-2xl font-bold mb-6 px-4 md:px-0">Find Contracts</h1>
      
      {/* Search and filters */}
      <Card className="mb-6 border-0 shadow-md md:border md:shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by title, description, or location..."
                  className="pl-10 border-primary/20 focus-visible:ring-primary/30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-primary/20 focus:ring-primary/30">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                    {category ? (
                      category === "notary" ? "Notary" :
                      category === "judicial_executor" ? "Judicial Executor" :
                      category === "lawyer" ? "Lawyer" :
                      category === "judge" ? "Judge" : "All Types"
                    ) : "All Types"}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="notary">Notary</SelectItem>
                  <SelectItem value="judicial_executor">Judicial Executor</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator className="my-4 bg-primary/10" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">Budget Range (RON)</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary/30"
                />
                <span className="text-neutral-500">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">Urgency</label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="border-primary/20 focus:ring-primary/30">
                  <SelectValue placeholder="Any urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any urgency</SelectItem>
                  <SelectItem value="asap">ASAP</SelectItem>
                  <SelectItem value="within_24h">Within 24 hours</SelectItem>
                  <SelectItem value="specific_date">Specific date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">Location</label>
              <div className="flex items-center space-x-2 h-10 pt-1">
                <Switch
                  id="nearby"
                  checked={onlyNearby}
                  onCheckedChange={setOnlyNearby}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="nearby" className="font-medium text-neutral-700">Only show nearby gigs</Label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={() => {
              // Reset all filters
              setSearchTerm("");
              setCategory("all");
              setBudgetMin("");
              setBudgetMax("");
              setUrgency("any");
              setOnlyNearby(false);
            }} variant="outline" className="mr-2 border-primary/20 text-primary hover:bg-primary/5">
              Reset Filters
            </Button>
            <Button onClick={() => {
              // Force refresh with current filters
              queryClient.invalidateQueries({ queryKey: [`/api/jobs/provider-type/${providerType}`] });
            }} className="bg-primary hover:bg-primary/90">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Gigs list */}
      {filteredGigs.length === 0 ? (
        <Card className="border-0 shadow-md md:border md:shadow-sm">
          <CardHeader>
            <CardTitle>No Contracts Found</CardTitle>
            <CardDescription>
              There are no open contracts matching your filters. Try adjusting your search criteria.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" 
              className="border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => {
                // Reset all filters
                setSearchTerm("");
                setCategory("all");
                setBudgetMin("");
                setBudgetMax("");
                setUrgency("any");
                setOnlyNearby(false);
                
                // Force refresh
                queryClient.invalidateQueries({ queryKey: [`/api/jobs/provider-type/${providerType}`] });
              }}>
              Clear Filters
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2 md:px-0 md:gap-6">
          {filteredGigs.map((gig) => (
            <Card key={gig.id} className="overflow-hidden border border-slate-200 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-primary-900">{gig.title}</CardTitle>
                  {gig.urgency === "asap" && (
                    <Badge variant="destructive" className="ml-2 bg-red-500 hover:bg-red-600">ASAP</Badge>
                  )}
                  {gig.urgency === "within_24h" && (
                    <Badge variant="default" className="ml-2 bg-amber-500 hover:bg-amber-600">24h</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center mt-1 text-neutral-500">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  <span>Posted {new Date(gig.createdAt).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center border-emerald-200 text-emerald-700 bg-emerald-50">
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    {gig.budgetMin} - {gig.budgetMax} RON
                  </Badge>
                  <Badge variant="outline" className="flex items-center border-blue-200 text-blue-700 bg-blue-50">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {gig.location} {gig.distance ? `(${gig.distance.toFixed(1)} km)` : ''}
                  </Badge>
                </div>
                
                <p className="text-sm text-neutral-600 line-clamp-3 mb-3">
                  {cleanDescription(gig.description)}
                </p>
                
                {gig.attachments && gig.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {gig.attachments.slice(0, 2).map((file, index) => (
                      <Badge key={index} variant="secondary" className="text-xs flex items-center bg-slate-100 text-slate-700">
                        <FileText className="h-3 w-3 mr-1" />
                        {file.length > 15 ? file.substring(0, 15) + '...' : file}
                      </Badge>
                    ))}
                    {gig.attachments.length > 2 && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                        +{gig.attachments.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    setSelectedGig(gig);
                    setDialogOpen(true);
                  }}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Application dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary-900 font-semibold">Apply to this Contract</DialogTitle>
            <DialogDescription className="text-neutral-700 font-medium">
              {selectedGig?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGig && (
            <div className="flex flex-wrap gap-2 mt-1 mb-3">
              <Badge variant="outline" className="flex items-center border-emerald-200 text-emerald-700 bg-emerald-50">
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                {selectedGig.budgetMin} - {selectedGig.budgetMax} RON
              </Badge>
              <Badge variant="outline" className="flex items-center border-blue-200 text-blue-700 bg-blue-50">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {selectedGig.location}
              </Badge>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proposal" className="text-neutral-800 font-medium">Your Proposal</Label>
              <Textarea 
                id="proposal"
                placeholder="Explain why you're a good fit for this job..."
                className="min-h-32 border-primary/20 focus-visible:ring-primary/30"
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
              />
              <p className="text-xs text-neutral-500">
                Be specific about your qualifications and how you can help with this request.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate" className="text-neutral-800 font-medium">Custom Rate (Optional)</Label>
              <div className="flex items-center">
                <Input 
                  id="rate"
                  type="number"
                  placeholder="Enter your rate"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary/30"
                />
                <span className="ml-2 text-neutral-600 font-medium">RON</span>
              </div>
              <p className="text-xs text-neutral-500">
                Leave empty to negotiate the rate based on client's budget.
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleApply}
              disabled={applyMutation.isPending || !proposalMessage.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {applyMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                "Send Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}