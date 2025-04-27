import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Apply migrations (or create tables if they don't exist)
async function main() {
  try {
    console.log('Creating database schema with Drizzle ORM...');
    
    // Run schema creation
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create enums if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('client', 'provider');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_type') THEN
          CREATE TYPE provider_type AS ENUM ('notary', 'judicial_executor', 'lawyer', 'judge');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
          CREATE TYPE job_status AS ENUM ('open', 'assigned', 'completed', 'cancelled');
        END IF;
        
        -- Create tables if they don't exist
        -- Users Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            role user_role NOT NULL DEFAULT 'client',
            avatar TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            city TEXT,
            country TEXT
          );
        END IF;
        
        -- Provider Profiles Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_profiles') THEN
          CREATE TABLE provider_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            provider_type provider_type NOT NULL,
            education TEXT,
            graduation_year INTEGER,
            years_of_experience INTEGER,
            description TEXT,
            languages TEXT[],
            location TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            service_radius INTEGER,
            working_hours JSONB,
            is_24_7 BOOLEAN DEFAULT FALSE,
            is_top_rated BOOLEAN DEFAULT FALSE,
            completed_services INTEGER DEFAULT 0,
            image_url TEXT
          );
        END IF;
        
        -- Specializations Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specializations') THEN
          CREATE TABLE specializations (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
            name TEXT NOT NULL
          );
        END IF;
        
        -- Services Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
          CREATE TABLE services (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
            title TEXT NOT NULL,
            description TEXT,
            price_type TEXT NOT NULL,
            price INTEGER,
            percentage_rate INTEGER,
            min_price INTEGER
          );
        END IF;
        
        -- Bookings Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
          CREATE TABLE bookings (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL REFERENCES users(id),
            provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
            service_id INTEGER REFERENCES services(id),
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'pending',
            total_amount INTEGER,
            platform_fee INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Reviews Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
          CREATE TABLE reviews (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL REFERENCES bookings(id),
            reviewer_id INTEGER NOT NULL REFERENCES users(id),
            reviewee_id INTEGER NOT NULL REFERENCES users(id),
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Job Postings Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_postings') THEN
          CREATE TABLE job_postings (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            provider_type provider_type NOT NULL,
            price_type TEXT NOT NULL,
            budget INTEGER,
            hourly_rate INTEGER,
            location TEXT,
            latitude REAL,
            longitude REAL,
            urgency TEXT,
            deadline TIMESTAMP,
            status job_status NOT NULL DEFAULT 'open',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Job Applications Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
          CREATE TABLE job_applications (
            id SERIAL PRIMARY KEY,
            job_id INTEGER NOT NULL REFERENCES job_postings(id),
            provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
            cover_letter TEXT,
            proposed_price INTEGER,
            proposed_deadline TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Messages Table
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
          CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL REFERENCES users(id),
            receiver_id INTEGER NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
      END $$;
    `);
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
  } finally {
    await pool.end();
  }
}

main();