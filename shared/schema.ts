import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, pgEnum, real, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PostGIS geospatial data is handled through raw SQL statements
// We include standard lat/long fields for easy access, while more complex spatial operations
// will be performed through SQL functions directly

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['client', 'provider']);

// Enum for provider types
export const providerTypeEnum = pgEnum('provider_type', ['notary', 'judicial_executor', 'lawyer', 'judge']);

// Enum for job status
export const jobStatusEnum = pgEnum('job_status', ['open', 'assigned', 'completed', 'cancelled']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default('client'),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  city: text("city"),
  country: text("country"),
});

// Provider profiles table
export const providerProfiles = pgTable("provider_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  providerType: providerTypeEnum("provider_type").notNull(),
  education: text("education"),
  graduationYear: integer("graduation_year"),
  yearsOfExperience: integer("years_of_experience"),
  description: text("description"),
  languages: text("languages").array(),
  location: text("location"),
  address: text("address"),
  // Geographic location (simple coordinates for now)
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Search radius in meters
  serviceRadius: integer("service_radius"),
  workingHours: json("working_hours"),
  is24_7: boolean("is_24_7").default(false),
  isTopRated: boolean("is_top_rated").default(false),
  completedServices: integer("completed_services").default(0),
  imageUrl: text("image_url"),
});

// Provider specializations
export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providerProfiles.id),
  name: text("name").notNull(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providerProfiles.id),
  title: text("title").notNull(),
  description: text("description"),
  priceType: text("price_type").notNull(), // fixed, hourly, percentage
  price: integer("price"), // in smallest currency unit (bani/cents)
  percentageRate: integer("percentage_rate"), // stored as whole number (10 = 10%)
  minPrice: integer("min_price"), // minimum price for percentage-based services
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  providerId: integer("provider_id").notNull().references(() => providerProfiles.id),
  serviceId: integer("service_id").references(() => services.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default('pending'), // pending, confirmed, completed, cancelled
  totalAmount: integer("total_amount"), // in smallest currency unit (bani)
  platformFee: integer("platform_fee"), // 10% of totalAmount
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  revieweeId: integer("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job postings table (client-initiated requests for services)
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  providerType: providerTypeEnum("provider_type").notNull(),
  priceType: text("price_type").notNull(), // fixed, hourly
  budget: integer("budget"), // in smallest currency unit (bani/cents)
  hourlyRate: integer("hourly_rate"), // in smallest currency unit (bani/cents)
  // Keep these commented out as we don't want to change the schema
  // budgetMin: integer("budget_min"), // exact user-entered min budget in RON (not bani/cents)
  // budgetMax: integer("budget_max"), // exact user-entered max budget in RON (not bani/cents)
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  urgency: text("urgency"), // normal, urgent, very urgent
  deadline: timestamp("deadline"),
  status: jobStatusEnum("status").notNull().default('open'),
  // Metadata field commented out as it doesn't exist in the actual database
  // metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications (providers applying for jobs)
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobPostings.id),
  providerId: integer("provider_id").notNull().references(() => providerProfiles.id),
  coverLetter: text("cover_letter"),
  proposedPrice: integer("proposed_price"), // in smallest currency unit (bani/cents)
  proposedDeadline: timestamp("proposed_deadline"),
  status: text("status").notNull().default('pending'), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertProviderProfileSchema = createInsertSchema(providerProfiles)
  .omit({ id: true });

export const insertServiceSchema = createInsertSchema(services)
  .omit({ id: true });

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ id: true, createdAt: true });

export const insertReviewSchema = createInsertSchema(reviews)
  .omit({ id: true, createdAt: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, createdAt: true, read: true });

export const insertJobPostingSchema = createInsertSchema(jobPostings)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true });

export const insertJobApplicationSchema = createInsertSchema(jobApplications)
  .omit({ id: true, createdAt: true, status: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = z.infer<typeof insertProviderProfileSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
