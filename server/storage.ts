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
    return db.select().from(providerProfiles);
  }

  async getProvider(id: number): Promise<any | undefined> {
    const [profile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id));
    return profile || undefined;
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
          eq(messages.recipientId, userId)
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
            eq(messages.recipientId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.recipientId, userId1)
          )
        )
      );
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();