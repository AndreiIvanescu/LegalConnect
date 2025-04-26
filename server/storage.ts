import { users, type User, type InsertUser, 
  providerProfiles, type ProviderProfile, type InsertProviderProfile, 
  services, type Service, type InsertService,
  bookings, type Booking, type InsertBooking,
  reviews, type Review, type InsertReview,
  messages, type Message, type InsertMessage,
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
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

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
          const reviews = await db.select().from(reviews)
            .where(eq(reviews.revieweeId, profile.userId));
          
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;
          
          // Format the provider data for the client
          return {
            id: profile.id,
            name: userData?.fullName || 'Unknown Provider',
            type: profile.providerType,
            rating: avgRating,
            reviewCount: reviews.length,
            location: profile.location || 'Unknown',
            education: profile.education || '',
            specializations: specializationsList.map(s => s.name),
            startingPrice: servicesList.length > 0 
              ? `${Math.min(...servicesList.map(s => s.price || 0)) / 100} RON`
              : 'Contact for pricing',
            isTopRated: profile.isTopRated,
            isAvailable24_7: profile.is24_7,
            imageUrl: userData?.avatar || '/placeholder-avatar.jpg',
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
      const reviews = await db.select().from(reviews)
        .where(eq(reviews.revieweeId, profile.userId));
      
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;
      
      // Format the provider data for the client
      return {
        id: profile.id,
        name: userData?.fullName || 'Unknown Provider',
        type: profile.providerType,
        rating: avgRating,
        reviewCount: reviews.length,
        location: profile.location || 'Unknown',
        education: profile.education || '',
        description: profile.description || '',
        languages: profile.languages || [],
        specializations: specializationsList.map(s => s.name),
        services: servicesList,
        startingPrice: servicesList.length > 0 
          ? `${Math.min(...servicesList.map(s => s.price || 0)) / 100} RON`
          : 'Contact for pricing',
        isTopRated: profile.isTopRated,
        isAvailable24_7: profile.is24_7,
        completedServices: profile.completedServices,
        imageUrl: userData?.avatar || '/placeholder-avatar.jpg',
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
    const [profile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, userId));
    
    return profile || undefined;
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
}

// Use the database storage implementation
export const storage = new DatabaseStorage();