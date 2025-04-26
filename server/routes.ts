import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './websocket';
import { insertProviderProfileSchema, insertServiceSchema, insertBookingSchema, insertReviewSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get all providers
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      // Return an empty array instead of error to prevent frontend crashes
      res.json([]);
    }
  });
  
  // Get providers by location proximity
  app.get("/api/providers/nearby", async (req, res) => {
    try {
      const { latitude, longitude, maxDistance = 10000 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const distance = parseInt(maxDistance as string);
      
      if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
        return res.status(400).json({ message: "Invalid location parameters" });
      }
      
      const providers = await storage.getNearbyProviders(lat, lng, distance);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching nearby providers:", error);
      res.status(500).json({ message: "Failed to fetch nearby providers" });
    }
  });

  // Get provider by ID
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Create provider profile
  app.post("/api/profile/provider", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can create profiles" });
    }

    try {
      const validatedData = insertProviderProfileSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const profile = await storage.createProviderProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Update provider profile
  app.patch("/api/profile/provider", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can update profiles" });
    }

    try {
      const profile = await storage.updateProviderProfile(req.user.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get provider profile for current user
  app.get("/api/profile/provider", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const profile = await storage.getProviderProfileByUserId(req.user.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider profile" });
    }
  });

  // Create a service
  app.post("/api/services", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can create services" });
    }

    try {
      const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
      
      if (!providerProfile) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const validatedData = insertServiceSchema.parse({
        ...req.body,
        providerId: providerProfile.id
      });
      
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  // Update a service
  app.patch("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can update services" });
    }
    
    try {
      const serviceId = parseInt(req.params.id);
      
      // Check if service exists
      const existingService = await storage.getServiceById(serviceId);
      if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if service belongs to the provider
      const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
      if (!providerProfile || existingService.providerId !== providerProfile.id) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      const updatedService = await storage.updateService(serviceId, req.body);
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  // Delete a service
  app.delete("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can delete services" });
    }
    
    try {
      const serviceId = parseInt(req.params.id);
      
      // Check if service exists
      const existingService = await storage.getServiceById(serviceId);
      if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if service belongs to the provider
      const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
      if (!providerProfile || existingService.providerId !== providerProfile.id) {
        return res.status(403).json({ message: "You don't have permission to delete this service" });
      }
      
      await storage.deleteService(serviceId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });
  
  // Get a service by ID
  app.get("/api/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Get services for a provider by provider ID
  app.get("/api/providers/:id/services", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const services = await storage.getServicesByProviderId(providerId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  
  // Get services for a provider by provider profile ID (for dashboard)
  app.get("/api/services/provider/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const services = await storage.getServicesByProviderId(providerId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Create a booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertBookingSchema.parse({
        ...req.body,
        clientId: req.user.id
      });
      
      // Calculate platform fee (10%)
      if (validatedData.totalAmount) {
        validatedData.platformFee = Math.round(validatedData.totalAmount * 0.1);
      }
      
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get bookings for the current user
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      let bookings;
      
      if (req.user.role === 'client') {
        bookings = await storage.getBookingsByClientId(req.user.id);
      } else if (req.user.role === 'provider') {
        const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
        
        if (!providerProfile) {
          return res.status(404).json({ message: "Provider profile not found" });
        }
        
        bookings = await storage.getBookingsByProviderId(providerProfile.id);
      } else {
        return res.status(403).json({ message: "Invalid user role" });
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get booking history
  app.get("/api/bookings/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      let bookings;
      
      if (req.user.role === 'client') {
        bookings = await storage.getBookingHistoryByClientId(req.user.id);
      } else if (req.user.role === 'provider') {
        const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
        
        if (!providerProfile) {
          return res.status(404).json({ message: "Provider profile not found" });
        }
        
        bookings = await storage.getBookingHistoryByProviderId(providerProfile.id);
      } else {
        return res.status(403).json({ message: "Invalid user role" });
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking history" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if user has permission to update this booking
      if (req.user.role === 'client' && booking.clientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      } else if (req.user.role === 'provider') {
        const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
        
        if (!providerProfile || booking.providerId !== providerProfile.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Create a review
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user.id
      });
      
      // Check if the booking exists and belongs to the current user
      const booking = await storage.getBookingById(validatedData.bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (req.user.role === 'client' && booking.clientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      } else if (req.user.role === 'provider') {
        const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
        
        if (!providerProfile || booking.providerId !== providerProfile.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get reviews for a provider
  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProviderId(providerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get reviews received (for providers)
  app.get("/api/reviews/received", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'provider') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const providerProfile = await storage.getProviderProfileByUserId(req.user.id);
      
      if (!providerProfile) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const reviews = await storage.getReviewsByRevieweeId(req.user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get conversations for current user
  app.get("/api/messages/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const conversations = await storage.getConversationsForUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time communication
  const wss = setupWebSocketServer(httpServer);

  return httpServer;
}
