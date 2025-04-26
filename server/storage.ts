import { users, type User, type InsertUser, 
  providerProfiles, type ProviderProfile, type InsertProviderProfile, 
  services, type Service, type InsertService,
  bookings, type Booking, type InsertBooking,
  reviews, type Review, type InsertReview,
  messages, type Message, type InsertMessage,
  jobPostings, type JobPosting, type InsertJobPosting,
  jobApplications, type JobApplication, type InsertJobApplication,
  specializations
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, asc, desc, or } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  getNearbyProviders(latitude: number, longitude: number, maxDistance: number): Promise<any[]>;
  getProvider(id: number): Promise<any | undefined>;
  getProviderProfileByUserId(userId: number): Promise<ProviderProfile | undefined>;
  createProviderProfile(profile: InsertProviderProfile): Promise<ProviderProfile>;
  updateProviderProfile(userId: number, data: Partial<ProviderProfile>): Promise<ProviderProfile>;
  
  // Service methods
  createService(service: InsertService): Promise<Service>;
  getServiceById(id: number): Promise<Service | undefined>;
  updateService(id: number, data: Partial<Service>): Promise<Service>;
  deleteService(id: number): Promise<void>;
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
  
  // Job Posting methods
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  getJobPostingById(id: number): Promise<JobPosting | undefined>;
  getJobPostingsByClientId(clientId: number): Promise<JobPosting[]>;
  getJobPostingsByProviderType(providerType: string): Promise<JobPosting[]>;
  getNearbyJobPostings(latitude: number, longitude: number, maxDistance: number): Promise<JobPosting[]>;
  updateJobPosting(id: number, data: Partial<JobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: number): Promise<void>;
  
  // Job Application methods
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getJobApplicationById(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]>;
  getJobApplicationsByProviderId(providerId: number): Promise<JobApplication[]>;
  updateJobApplication(id: number, data: Partial<JobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  // Helper method to calculate minimum price from a list of services
  private calculateMinPrice(services: any[]): number {
    if (!services || services.length === 0) {
      return 0;
    }
    
    // Extract all numeric prices from services (both fixed prices and minimum prices)
    const prices: number[] = [];
    
    for (const service of services) {
      // For fixed price services
      if (service.price_type === 'fixed' && typeof service.price === 'number') {
        prices.push(service.price);
      } 
      // For percentage based services with minimum price
      else if (service.price_type === 'percentage' && typeof service.min_price === 'number') {
        prices.push(service.min_price);
      }
      // For services with directly mapped price or min_price fields (for flexibility)
      else {
        if (typeof service.price === 'number' && service.price > 0) {
          prices.push(service.price);
        }
        if (typeof service.min_price === 'number' && service.min_price > 0) {
          prices.push(service.min_price);
        }
      }
    }
    
    // If we have valid prices, return the minimum
    if (prices.length > 0) {
      return Math.min(...prices);
    }
    
    return 0;
  }

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  // Provider methods
  async getAllProviders(): Promise<any[]> {
    try {
      // Get provider profiles
      const profiles = await db.select().from(providerProfiles);
      
      // If we don't have any profiles yet, return empty array to avoid further errors
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      // Fetch additional data for each profile
      const providersWithDetails = await Promise.all(profiles.map(async (profile) => {
        try {
          // Get user data
          const [userData] = await db.select().from(users).where(eq(users.id, profile.userId));
          
          // Get specializations
          const specializationsList = await db.select().from(specializations)
            .where(eq(specializations.providerId, profile.id));
          
          // Get services
          const servicesList = await db.select().from(services)
            .where(eq(services.providerId, profile.id));
          
          // Calculate rating based on reviews
          const reviewList = await db.select().from(reviews)
            .where(eq(reviews.revieweeId, profile.userId));
          
          const avgRating = reviewList.length > 0 
            ? reviewList.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewList.length 
            : 0;
          
          // Format the provider data for the client
          return {
            id: profile.id,
            name: userData?.fullName || 'Unknown Provider',
            type: profile.providerType,
            rating: avgRating,
            reviewCount: reviewList.length,
            location: profile.location || 'Unknown',
            education: profile.education || '',
            specializations: specializationsList.map(s => s.name),
            startingPrice: servicesList.length > 0 
              ? `${this.calculateMinPrice(servicesList) / 100} RON`
              : 'Contact for pricing',
            isTopRated: profile.isTopRated,
            isAvailable24_7: profile.is24_7,
            imageUrl: profile.imageUrl || userData?.avatar || '/placeholder-avatar.jpg',
            latitude: profile.latitude,
            longitude: profile.longitude,
            serviceRadius: profile.serviceRadius
          };
        } catch (error) {
          console.error(`Error processing provider profile ${profile.id}:`, error);
          return null; // Skip this provider on error
        }
      }));
      
      // Filter out any null entries from failed processing
      return providersWithDetails.filter(provider => provider !== null);
    } catch (error) {
      console.error("Error in getAllProviders:", error);
      return []; // Return empty array on error
    }
  }
  
  async getNearbyProviders(latitude: number, longitude: number, maxDistance: number): Promise<any[]> {
    try {
      // Use PostGIS for spatial query to find providers within distance
      // We use the SQL query directly to leverage PostGIS functions
      // We'll use two different approaches for finding providers:
      // 1. First check if providers are within their own service radius
      // 2. Then check if providers are within the user's max search distance
      const { rows: nearbyProfiles } = await pool.query(`
        SELECT 
          p.*,
          ST_Distance(
            geolocation, 
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          ) as distance
        FROM provider_profiles p
        WHERE 
          -- Only return providers with valid location data
          p.latitude IS NOT NULL AND p.longitude IS NOT NULL
          AND (
            -- Check if provider is within their own service radius (if defined)
            (p.service_radius IS NOT NULL AND 
             ST_DWithin(
               geolocation,
               ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
               p.service_radius
             )
            )
            OR
            -- Or check if provider is within the specified max distance 
            ST_DWithin(
              geolocation,
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              $3
            )
          )
        ORDER BY distance ASC
      `, [latitude, longitude, maxDistance]);

      if (!nearbyProfiles || nearbyProfiles.length === 0) {
        return [];
      }
      
      // Fetch additional data for each profile
      const providersWithDetails = await Promise.all(nearbyProfiles.map(async (profile: any) => {
        try {
          // Get user data
          const [userData] = await db.select().from(users).where(eq(users.id, profile.user_id));
          
          // Get specializations
          const specializationsList = await db.select().from(specializations)
            .where(eq(specializations.providerId, profile.id));
          
          // Get services
          const servicesList = await db.select().from(services)
            .where(eq(services.providerId, profile.id));
          
          // Calculate rating based on reviews
          const reviewList = await db.select().from(reviews)
            .where(eq(reviews.revieweeId, profile.user_id));
          
          const avgRating = reviewList.length > 0 
            ? reviewList.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewList.length 
            : 0;
          
          // Format the provider data for the client
          return {
            id: profile.id,
            name: userData?.fullName || 'Unknown Provider',
            type: profile.provider_type,
            rating: avgRating,
            reviewCount: reviewList.length,
            location: profile.location || 'Unknown',
            education: profile.education || '',
            specializations: specializationsList.map((s: any) => s.name),
            startingPrice: servicesList.length > 0 
              ? `${this.calculateMinPrice(servicesList) / 100} RON`
              : 'Contact for pricing',
            isTopRated: profile.is_top_rated,
            isAvailable24_7: profile.is_24_7,
            imageUrl: profile.image_url || userData?.avatar || '/placeholder-avatar.jpg',
            latitude: profile.latitude,
            longitude: profile.longitude,
            serviceRadius: profile.service_radius,
            distance: Math.round(profile.distance) // Distance in meters
          };
        } catch (error) {
          console.error(`Error processing nearby provider profile ${profile.id}:`, error);
          return null; // Skip this provider on error
        }
      }));
      
      // Filter out any null entries from failed processing
      return providersWithDetails.filter(provider => provider !== null);
    } catch (error) {
      console.error("Error in getNearbyProviders:", error);
      return []; // Return empty array on error
    }
  }

  async getProvider(id: number): Promise<any | undefined> {
    try {
      // Get provider profile
      const [profile] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.id, id));
      
      if (!profile) {
        return undefined;
      }
      
      // Get user data
      const [userData] = await db.select().from(users).where(eq(users.id, profile.userId));
      
      // Get specializations
      const specializationsList = await db.select().from(specializations)
        .where(eq(specializations.providerId, profile.id));
      
      // Get services
      const servicesList = await db.select().from(services)
        .where(eq(services.providerId, profile.id));
      
      // Calculate rating based on reviews
      const reviewList = await db.select().from(reviews)
        .where(eq(reviews.revieweeId, profile.userId));
      
      const avgRating = reviewList.length > 0 
        ? reviewList.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewList.length 
        : 0;
      
      // Format the provider data for the client
      return {
        id: profile.id,
        name: userData?.fullName || 'Unknown Provider',
        type: profile.providerType,
        rating: avgRating,
        reviewCount: reviewList.length,
        location: profile.location || 'Unknown',
        education: profile.education || '',
        description: profile.description || '',
        languages: profile.languages || [],
        specializations: specializationsList.map(s => s.name),
        services: servicesList,
        startingPrice: servicesList.length > 0 
          ? `${this.calculateMinPrice(servicesList) / 100} RON`
          : 'Contact for pricing',
        isTopRated: profile.isTopRated,
        isAvailable24_7: profile.is24_7,
        completedServices: profile.completedServices,
        imageUrl: profile.imageUrl || userData?.avatar || '/placeholder-avatar.jpg',
        workingHours: profile.workingHours,
        latitude: profile.latitude,
        longitude: profile.longitude,
        serviceRadius: profile.serviceRadius,
        userId: profile.userId
      };
    } catch (error) {
      console.error("Error in getProvider:", error);
      return undefined;
    }
  }

  async getProviderProfileByUserId(userId: number): Promise<ProviderProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, userId));
      
      return profile || undefined;
    } catch (error) {
      console.error("Error in getProviderProfileByUserId:", error);
      return undefined;
    }
  }

  async createProviderProfile(profile: any): Promise<ProviderProfile> {    
    // Insert provider profile
    const [providerProfile] = await db
      .insert(providerProfiles)
      .values(profile)
      .returning();
    
    return providerProfile;
  }

  async updateProviderProfile(userId: number, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    const [updatedProfile] = await db
      .update(providerProfiles)
      .set(data)
      .where(eq(providerProfiles.userId, userId))
      .returning();
    
    if (!updatedProfile) {
      throw new Error("Provider profile not found");
    }
    
    return updatedProfile;
  }

  // Service methods
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    
    return newService;
  }
  
  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    
    return service || undefined;
  }
  
  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    
    if (!updatedService) {
      throw new Error("Service not found");
    }
    
    return updatedService;
  }
  
  async deleteService(id: number): Promise<void> {
    await db
      .delete(services)
      .where(eq(services.id, id));
  }

  async getServicesByProviderId(providerId: number): Promise<Service[]> {
    return db
      .select()
      .from(services)
      .where(eq(services.providerId, providerId));
  }

  // Booking methods - implementing minimal for auth to work
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    
    return newBooking;
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    
    return booking || undefined;
  }

  async getBookingsByClientId(clientId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, clientId));
  }

  async getBookingsByProviderId(providerId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.providerId, providerId));
  }

  async getBookingHistoryByClientId(clientId: number): Promise<any[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, clientId));
  }

  async getBookingHistoryByProviderId(providerId: number): Promise<any[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.providerId, providerId));
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(data)
      .where(eq(bookings.id, id))
      .returning();
    
    if (!updatedBooking) {
      throw new Error("Booking not found");
    }
    
    return updatedBooking;
  }

  // Review methods - minimal implementation
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    
    return newReview;
  }

  async getReviewsByProviderId(providerId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, providerId));
  }

  async getReviewsByRevieweeId(revieweeId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, revieweeId));
  }

  // Message methods - minimal implementation
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async getConversationsForUser(userId: number): Promise<any[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      );
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      );
  }

  // Job Posting methods
  async createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting> {
    const [newJobPosting] = await db
      .insert(jobPostings)
      .values(jobPosting)
      .returning();
    
    return newJobPosting;
  }

  async getJobPostingById(id: number): Promise<JobPosting | undefined> {
    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id));
    
    return jobPosting || undefined;
  }

  async getJobPostingsByClientId(clientId: number): Promise<JobPosting[]> {
    return await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.clientId, clientId))
      .orderBy(desc(jobPostings.createdAt));
  }

  async getJobPostingsByProviderType(providerType: string): Promise<JobPosting[]> {
    return await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.providerType, providerType as any))
      .where(eq(jobPostings.status, 'open'))
      .orderBy(desc(jobPostings.createdAt));
  }

  async getNearbyJobPostings(latitude: number, longitude: number, maxDistance: number): Promise<JobPosting[]> {
    try {
      // Use PostGIS for spatial query to find jobs within distance
      const { rows: nearbyJobs } = await pool.query(`
        SELECT 
          j.*,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(j.longitude, j.latitude), 4326)::geography, 
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          ) as distance
        FROM job_postings j
        WHERE 
          j.latitude IS NOT NULL AND j.longitude IS NOT NULL
          AND j.status = 'open'
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(j.longitude, j.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
            $3
          )
        ORDER BY distance ASC
      `, [latitude, longitude, maxDistance]);

      return nearbyJobs || [];
    } catch (error) {
      console.error("Error in getNearbyJobPostings:", error);
      return [];
    }
  }

  async updateJobPosting(id: number, data: Partial<JobPosting>): Promise<JobPosting> {
    const [updatedJobPosting] = await db
      .update(jobPostings)
      .set(data)
      .where(eq(jobPostings.id, id))
      .returning();
    
    if (!updatedJobPosting) {
      throw new Error("Job posting not found");
    }
    
    return updatedJobPosting;
  }

  async deleteJobPosting(id: number): Promise<void> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }

  // Job Application methods
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    
    return newApplication;
  }

  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    
    return application || undefined;
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId));
  }

  async getJobApplicationsByProviderId(providerId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.providerId, providerId));
  }

  async updateJobApplication(id: number, data: Partial<JobApplication>): Promise<JobApplication> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set(data)
      .where(eq(jobApplications.id, id))
      .returning();
    
    if (!updatedApplication) {
      throw new Error("Job application not found");
    }
    
    return updatedApplication;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();