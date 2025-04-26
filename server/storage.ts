import { users, type User, type InsertUser, 
  providerProfiles, type ProviderProfile, type InsertProviderProfile, 
  services, type Service, type InsertService,
  bookings, type Booking, type InsertBooking,
  reviews, type Review, type InsertReview,
  messages, type Message, type InsertMessage,
  specializations, type providerTypeEnum
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Provider methods
  getAllProviders(): Promise<any[]>;
  getProvider(id: number): Promise<any | undefined>;
  getProviderProfileByUserId(userId: number): Promise<ProviderProfile | undefined>;
  createProviderProfile(profile: InsertProviderProfile): Promise<ProviderProfile>;
  updateProviderProfile(userId: number, data: Partial<ProviderProfile>): Promise<ProviderProfile>;
  
  // Service methods
  createService(service: InsertService): Promise<Service>;
  getServicesByProviderId(providerId: number): Promise<Service[]>;
  
  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingsByClientId(clientId: number): Promise<Booking[]>;
  getBookingsByProviderId(providerId: number): Promise<Booking[]>;
  getBookingHistoryByClientId(clientId: number): Promise<any[]>;
  getBookingHistoryByProviderId(providerId: number): Promise<any[]>;
  updateBooking(id: number, data: Partial<Booking>): Promise<Booking>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProviderId(providerId: number): Promise<Review[]>;
  getReviewsByRevieweeId(revieweeId: number): Promise<Review[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationsForUser(userId: number): Promise<any[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private providerProfiles: Map<number, ProviderProfile>;
  private services: Map<number, Service>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  private messages: Map<number, Message>;
  private specializations: Map<number, { id: number, providerId: number, name: string }>;
  
  currentId: number;
  currentProviderProfileId: number;
  currentServiceId: number;
  currentBookingId: number;
  currentReviewId: number;
  currentMessageId: number;
  currentSpecializationId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.providerProfiles = new Map();
    this.services = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    this.messages = new Map();
    this.specializations = new Map();
    
    this.currentId = 1;
    this.currentProviderProfileId = 1;
    this.currentServiceId = 1;
    this.currentBookingId = 1;
    this.currentReviewId = 1;
    this.currentMessageId = 1;
    this.currentSpecializationId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add some initial users for testing
    this.seedUsers();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Provider methods
  async getAllProviders(): Promise<any[]> {
    const providers = [];
    
    for (const profile of this.providerProfiles.values()) {
      const user = this.users.get(profile.userId);
      if (user) {
        const providerSpecs = Array.from(this.specializations.values())
          .filter(spec => spec.providerId === profile.id)
          .map(spec => spec.name);
        
        const reviews = Array.from(this.reviews.values())
          .filter(review => review.revieweeId === user.id);
        
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;
        
        // Get some services to determine starting price
        const providerServices = Array.from(this.services.values())
          .filter(service => service.providerId === profile.id);
        
        let startingPrice = "Contact for pricing";
        if (providerServices.length > 0) {
          // Find the minimum price
          const minPriceService = providerServices.reduce((min, service) => {
            if (service.priceType === "fixed" && service.price) {
              return (!min.price || service.price < min.price) ? service : min;
            }
            return min;
          }, providerServices[0]);
          
          if (minPriceService.priceType === "fixed" && minPriceService.price) {
            startingPrice = `${(minPriceService.price / 100).toFixed(2)} RON`;
          } else if (minPriceService.priceType === "hourly" && minPriceService.price) {
            startingPrice = `${(minPriceService.price / 100).toFixed(2)} RON/hour`;
          } else if (minPriceService.priceType === "percentage" && minPriceService.percentageRate) {
            startingPrice = `${minPriceService.percentageRate}% of claim`;
          }
        }
        
        providers.push({
          id: profile.id,
          userId: user.id,
          name: user.fullName,
          type: this.getProviderTypeString(profile.providerType),
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: reviews.length,
          location: user.city && user.country ? `${user.city}, ${user.country}` : "Unknown location",
          education: profile.education || "Not specified",
          graduationYear: profile.graduationYear,
          yearsOfExperience: profile.yearsOfExperience || 0,
          specializations: providerSpecs,
          startingPrice,
          isTopRated: profile.isTopRated,
          isAvailable24_7: profile.is24_7,
          imageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Default image
        });
      }
    }
    
    return providers;
  }
  
  async getProvider(id: number): Promise<any | undefined> {
    const profile = this.providerProfiles.get(id);
    if (!profile) {
      return undefined;
    }
    
    const user = this.users.get(profile.userId);
    if (!user) {
      return undefined;
    }
    
    const providerSpecs = Array.from(this.specializations.values())
      .filter(spec => spec.providerId === profile.id)
      .map(spec => spec.name);
    
    const providerServices = Array.from(this.services.values())
      .filter(service => service.providerId === profile.id)
      .map(service => {
        let priceStr = "Contact for pricing";
        if (service.priceType === "fixed" && service.price) {
          priceStr = `${(service.price / 100).toFixed(2)} RON`;
        } else if (service.priceType === "hourly" && service.price) {
          priceStr = `${(service.price / 100).toFixed(2)} RON/hour`;
        } else if (service.priceType === "percentage" && service.percentageRate) {
          priceStr = `${service.percentageRate}% of claim`;
        }
        
        return {
          id: service.id,
          title: service.title,
          description: service.description,
          price: priceStr,
          priceType: service.priceType,
          rawPrice: service.price,
          percentageRate: service.percentageRate,
        };
      });
    
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.revieweeId === user.id)
      .map(async (review) => {
        const reviewer = await this.getUser(review.reviewerId);
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
          author: reviewer?.fullName || "Anonymous",
          authorId: review.reviewerId,
        };
      });
    
    const resolvedReviews = await Promise.all(reviews);
    
    const avgRating = resolvedReviews.length > 0 
      ? resolvedReviews.reduce((sum, review) => sum + review.rating, 0) / resolvedReviews.length 
      : 0;
    
    return {
      id: profile.id,
      userId: user.id,
      name: user.fullName,
      type: this.getProviderTypeString(profile.providerType),
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: resolvedReviews.length,
      location: user.city && user.country ? `${user.city}, ${user.country}` : "Unknown location",
      address: profile.address,
      education: profile.education || "Not specified",
      graduationYear: profile.graduationYear,
      yearsOfExperience: profile.yearsOfExperience || 0,
      description: profile.description,
      languages: profile.languages || ["Romanian", "English"],
      specializations: providerSpecs,
      services: providerServices,
      reviews: resolvedReviews,
      is24_7: profile.is24_7,
      isTopRated: profile.isTopRated,
      workingHours: profile.workingHours,
      completedServices: profile.completedServices,
      imageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Default image
    };
  }
  
  async getProviderProfileByUserId(userId: number): Promise<ProviderProfile | undefined> {
    return Array.from(this.providerProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }
  
  async createProviderProfile(profile: InsertProviderProfile): Promise<ProviderProfile> {
    const id = this.currentProviderProfileId++;
    
    // If specializations are provided, create them
    const specializations = profile.specializations || [];
    delete profile.specializations;
    
    const providerProfile: ProviderProfile = { ...profile, id };
    this.providerProfiles.set(id, providerProfile);
    
    // Create specializations
    if (Array.isArray(specializations)) {
      for (const spec of specializations) {
        const specId = this.currentSpecializationId++;
        this.specializations.set(specId, {
          id: specId,
          providerId: id,
          name: spec
        });
      }
    }
    
    return providerProfile;
  }
  
  async updateProviderProfile(userId: number, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    const profile = await this.getProviderProfileByUserId(userId);
    if (!profile) {
      throw new Error("Provider profile not found");
    }
    
    // If specializations are provided, update them
    const specializations = data.specializations;
    delete data.specializations;
    
    const updatedProfile = { ...profile, ...data };
    this.providerProfiles.set(profile.id, updatedProfile);
    
    // Update specializations if provided
    if (Array.isArray(specializations)) {
      // Delete existing specializations
      for (const [key, spec] of this.specializations.entries()) {
        if (spec.providerId === profile.id) {
          this.specializations.delete(key);
        }
      }
      
      // Create new specializations
      for (const spec of specializations) {
        const specId = this.currentSpecializationId++;
        this.specializations.set(specId, {
          id: specId,
          providerId: profile.id,
          name: spec
        });
      }
    }
    
    return updatedProfile;
  }
  
  // Service methods
  async createService(service: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  async getServicesByProviderId(providerId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.providerId === providerId
    );
  }
  
  // Booking methods
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const createdAt = new Date();
    const newBooking: Booking = { ...booking, id, createdAt };
    this.bookings.set(id, newBooking);
    
    // Increment completedServices for the provider if status is completed
    if (booking.status === 'completed') {
      const profile = this.providerProfiles.get(booking.providerId);
      if (profile) {
        profile.completedServices = (profile.completedServices || 0) + 1;
        this.providerProfiles.set(booking.providerId, profile);
      }
    }
    
    return newBooking;
  }
  
  async getBookingById(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async getBookingsByClientId(clientId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.clientId === clientId
    );
  }
  
  async getBookingsByProviderId(providerId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.providerId === providerId
    );
  }
  
  async getBookingHistoryByClientId(clientId: number): Promise<any[]> {
    const bookings = await this.getBookingsByClientId(clientId);
    return Promise.all(bookings.map(async (booking) => {
      const provider = await this.getProvider(booking.providerId);
      const service = booking.serviceId ? await this.services.get(booking.serviceId) : null;
      
      // Check if user has left a review
      const hasReviewed = Array.from(this.reviews.values()).some(
        (review) => review.bookingId === booking.id && review.reviewerId === clientId
      );
      
      return {
        id: booking.id,
        providerName: provider?.name || "Unknown Provider",
        providerId: booking.providerId,
        serviceName: service?.title || "Custom Service",
        serviceId: booking.serviceId,
        date: booking.startTime,
        status: booking.status,
        amount: booking.totalAmount ? `${(booking.totalAmount / 100).toFixed(2)} RON` : "N/A",
        rawAmount: booking.totalAmount,
        reviewed: hasReviewed,
      };
    }));
  }
  
  async getBookingHistoryByProviderId(providerId: number): Promise<any[]> {
    const bookings = await this.getBookingsByProviderId(providerId);
    return Promise.all(bookings.map(async (booking) => {
      const client = await this.getUser(booking.clientId);
      const service = booking.serviceId ? await this.services.get(booking.serviceId) : null;
      
      // Check if provider has left a review
      const hasReviewed = Array.from(this.reviews.values()).some(
        (review) => review.bookingId === booking.id && review.reviewerId === client?.id
      );
      
      return {
        id: booking.id,
        clientName: client?.fullName || "Unknown Client",
        clientId: booking.clientId,
        serviceName: service?.title || "Custom Service",
        serviceId: booking.serviceId,
        date: booking.startTime,
        status: booking.status,
        amount: booking.totalAmount ? `${(booking.totalAmount / 100).toFixed(2)} RON` : "N/A",
        rawAmount: booking.totalAmount,
        platformFee: booking.platformFee ? `${(booking.platformFee / 100).toFixed(2)} RON` : "N/A",
        reviewed: hasReviewed,
      };
    }));
  }
  
  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    
    const previousStatus = booking.status;
    const updatedBooking = { ...booking, ...data };
    this.bookings.set(id, updatedBooking);
    
    // If status changed to completed, increment completedServices for the provider
    if (previousStatus !== 'completed' && updatedBooking.status === 'completed') {
      const profile = this.providerProfiles.get(booking.providerId);
      if (profile) {
        profile.completedServices = (profile.completedServices || 0) + 1;
        this.providerProfiles.set(booking.providerId, profile);
      }
    }
    
    return updatedBooking;
  }
  
  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const createdAt = new Date();
    const newReview: Review = { ...review, id, createdAt };
    this.reviews.set(id, newReview);
    
    // Update provider's isTopRated if they have a high average rating
    if (review.revieweeId) {
      const profile = await this.getProviderProfileByUserId(review.revieweeId);
      if (profile) {
        const reviews = await this.getReviewsByRevieweeId(review.revieweeId);
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        if (avgRating >= 4.8 && reviews.length >= 5) {
          profile.isTopRated = true;
          this.providerProfiles.set(profile.id, profile);
        }
      }
    }
    
    return newReview;
  }
  
  async getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const profile = await this.providerProfiles.get(providerId);
    if (!profile) {
      return [];
    }
    
    return Array.from(this.reviews.values()).filter(
      (review) => review.revieweeId === profile.userId
    );
  }
  
  async getReviewsByRevieweeId(revieweeId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.revieweeId === revieweeId
    );
  }
  
  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const newMessage: Message = { ...message, id, createdAt, read: false };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async getConversationsForUser(userId: number): Promise<any[]> {
    // Get all messages sent by or to the user
    const allMessages = Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
    
    // Group by the other user
    const conversations = new Map<number, { userId: number, lastMessage: string, date: Date, unreadCount: number }>();
    
    for (const message of allMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message.content,
          date: message.createdAt,
          unreadCount: message.senderId !== userId && !message.read ? 1 : 0
        });
      } else {
        const convo = conversations.get(otherUserId)!;
        if (message.createdAt > convo.date) {
          convo.lastMessage = message.content;
          convo.date = message.createdAt;
        }
        if (message.senderId !== userId && !message.read) {
          convo.unreadCount++;
        }
      }
    }
    
    // Convert to array and add user details
    const result = await Promise.all(Array.from(conversations.values()).map(async (convo) => {
      const user = await this.getUser(convo.userId);
      return {
        userId: convo.userId,
        userName: user ? user.fullName : "Unknown User",
        lastMessage: convo.lastMessage,
        date: convo.date,
        unreadCount: convo.unreadCount
      };
    }));
    
    // Sort by date (most recent first)
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
    );
    
    // Mark messages as read if they were sent to userId1
    for (const message of messages) {
      if (message.receiverId === userId1 && !message.read) {
        message.read = true;
        this.messages.set(message.id, message);
      }
    }
    
    // Sort by date (oldest first)
    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  // Helper methods
  private getProviderTypeString(type: any): string {
    switch (type) {
      case 'notary':
        return 'Notary Public';
      case 'judicial_executor':
        return 'Judicial Executor';
      case 'lawyer':
        return 'Lawyer';
      case 'judge':
        return 'Judge';
      default:
        return 'Legal Professional';
    }
  }
  
  private async seedUsers() {
    // This is just for development purposes to have some initial data
    // Default password is "password" (would be hashed in real app)
    const defaultPassword = "password";
    
    // Create client user
    const client1 = await this.createUser({
      username: "johndoe",
      password: defaultPassword,
      fullName: "John Doe",
      email: "john@example.com",
      role: "client",
      city: "Bucharest",
      country: "Romania"
    });
    
    // Create provider users
    const provider1 = await this.createUser({
      username: "alexnotary",
      password: defaultPassword,
      fullName: "Alexandru Popescu",
      email: "alex@example.com",
      role: "provider",
      city: "Bucharest",
      country: "Romania"
    });
    
    const provider2 = await this.createUser({
      username: "mariaexec",
      password: defaultPassword,
      fullName: "Maria Ionescu",
      email: "maria@example.com",
      role: "provider",
      city: "Bucharest",
      country: "Romania"
    });
    
    const provider3 = await this.createUser({
      username: "andrei_law",
      password: defaultPassword,
      fullName: "Andrei Dumitrescu",
      email: "andrei@example.com",
      role: "provider",
      city: "Bucharest",
      country: "Romania"
    });
    
    // Create provider profiles
    const profile1 = await this.createProviderProfile({
      userId: provider1.id,
      providerType: "notary",
      education: "University of Bucharest, Faculty of Law",
      graduationYear: 2005,
      yearsOfExperience: 15,
      description: "With over 15 years of experience as a Notary Public, I specialize in real estate transactions, property transfers, and estate planning. My office is committed to providing efficient, accurate, and professional notarial services to individuals and businesses throughout Bucharest.",
      languages: ["Romanian", "English", "French"],
      location: "Bucharest, Sector 1",
      address: "Calea Victoriei 25, Sector 1, Bucharest",
      workingHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "10:00", close: "14:00" },
        sunday: { open: null, close: null }
      },
      is24_7: false,
      isTopRated: true,
      completedServices: 342,
      specializations: ["Real Estate Transactions", "Property Transfer", "Wills & Estate Planning", "Business Contracts", "Power of Attorney"]
    });
    
    const profile2 = await this.createProviderProfile({
      userId: provider2.id,
      providerType: "judicial_executor",
      education: "University of Bucharest, Faculty of Law",
      graduationYear: 2012,
      yearsOfExperience: 10,
      description: "Specialized in debt enforcement and property seizure procedures. I work efficiently to ensure my clients receive the amounts they are legally entitled to.",
      languages: ["Romanian", "English"],
      location: "Bucharest, Sector 3",
      address: "Bd. Unirii 15, Sector 3, Bucharest",
      workingHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: null, close: null },
        sunday: { open: null, close: null }
      },
      is24_7: false,
      isTopRated: false,
      completedServices: 87,
      specializations: ["Debt Collection", "Enforcement", "Property Seizure"]
    });
    
    const profile3 = await this.createProviderProfile({
      userId: provider3.id,
      providerType: "lawyer",
      education: "Nicolae Titulescu University, Faculty of Law",
      graduationYear: 2008,
      yearsOfExperience: 14,
      description: "Corporate lawyer with expertise in business law, contracts, and legal consulting for both startups and established companies.",
      languages: ["Romanian", "English", "German"],
      location: "Bucharest, Sector 2",
      address: "Str. Armeneasca 10, Sector 2, Bucharest",
      workingHours: null,
      is24_7: true,
      isTopRated: false,
      completedServices: 156,
      specializations: ["Corporate Law", "Contracts", "Consulting"]
    });
    
    // Create services
    await this.createService({
      providerId: profile1.id,
      title: "Real Estate Transaction Authentication",
      description: "Official notarization and authentication of real estate sale-purchase contracts.",
      priceType: "fixed",
      price: 23000, // 230 RON in smallest currency unit
      percentageRate: null,
      minPrice: null
    });
    
    await this.createService({
      providerId: profile1.id,
      title: "Will Drafting and Authentication",
      description: "Preparation and notarization of legally binding wills.",
      priceType: "fixed",
      price: 30000, // 300 RON
      percentageRate: null,
      minPrice: null
    });
    
    await this.createService({
      providerId: profile2.id,
      title: "Debt Collection (up to 50,000 RON)",
      description: "Enforcement of court decisions for monetary claims up to 50,000 RON.",
      priceType: "percentage",
      price: null,
      percentageRate: 10,
      minPrice: 50000
    });
    
    await this.createService({
      providerId: profile3.id,
      title: "Legal Consultation",
      description: "General legal advice for individuals and businesses.",
      priceType: "hourly",
      price: 35000, // 350 RON per hour
      percentageRate: null,
      minPrice: null
    });
    
    // Create some reviews
    await this.createReview({
      bookingId: 1,
      reviewerId: client1.id,
      revieweeId: provider1.id,
      rating: 5,
      comment: "Excellent service! Alexandru was professional, efficient, and explained everything clearly.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    });
    
    // Create some messages
    await this.createMessage({
      senderId: client1.id,
      receiverId: provider1.id,
      content: "Hello, I'm interested in your real estate notarization services. Do you have availability next week?",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });
    
    await this.createMessage({
      senderId: provider1.id,
      receiverId: client1.id,
      content: "Hello John, yes I have availability on Tuesday and Thursday next week. Would either of those work for you?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
  }
}

export const storage = new MemStorage();
