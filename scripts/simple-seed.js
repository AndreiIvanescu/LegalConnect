import { db } from '../server/db.js';
import { users, providerProfiles, services, specializations, reviews } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Sample provider data
const providers = [
  {
    username: "mpopescu",
    password: "password123",
    fullName: "Maria Popescu",
    email: "maria.popescu@example.com",
    role: "provider",
    profile: {
      providerType: "notary",
      imageUrl: "/uploads/test-profile2.jpg",
      location: "Bucharest",
      education: "University of Bucharest, Law School",
      description: "With over 10 years of experience as a notary, I specialize in real estate transactions and business contracts. My office provides efficient, accurate, and professional services.",
      yearsOfExperience: 10,
      languages: ["Romanian", "English", "French"],
      address: "Strada Academiei 35, Bucharest, Romania",
      is24_7: false,
      latitude: 44.4342,
      longitude: 26.0975,
      serviceRadius: 10,
      rating: 4.8,
      reviewCount: 12
    },
    specializations: [
      "Real Estate Transactions", "Business Contracts", "Powers of Attorney", "Succession"
    ],
    services: [
      {
        title: "Real Estate Transactions",
        description: "Complete legal verification and documentation for buying, selling, or transferring property. Includes title checks, contract drafting, and official registration.",
        price: "€250 - €500",
        priceType: "Fixed Price",
        isTopRated: true
      },
      {
        title: "Business Contracts",
        description: "Drafting and authenticating business contracts including partnerships, joint ventures, and corporate agreements with complete legal validity.",
        price: "€150 - €300",
        priceType: "Fixed Price"
      },
      {
        title: "Powers of Attorney",
        description: "Creating legally binding representation documents that allow someone to act on your behalf in specified legal or financial matters.",
        price: "€100",
        priceType: "Fixed Price"
      }
    ],
    reviews: [
      {
        reviewerName: "Alexandru Mihai",
        rating: 5,
        comment: "Very professional service, helped me complete my real estate transaction without any issues.",
        date: "2025-03-15"
      },
      {
        reviewerName: "Carmen Stoica",
        rating: 4,
        comment: "Good service, but took a bit longer than expected. Still, the quality of work was excellent.",
        date: "2025-02-10"
      },
      {
        reviewerName: "Vlad Dumitrescu",
        rating: 5,
        comment: "Excellent knowledge of the law. Managed to resolve my case efficiently.",
        date: "2025-01-20"
      }
    ]
  },
  {
    username: "aivanescu",
    password: "password123",
    fullName: "Andrei Ivanescu",
    email: "andrei.ivanescu@example.com",
    role: "provider",
    profile: {
      providerType: "notary",
      imageUrl: "/uploads/Screenshot_2025-01-15_222045.png",
      location: "Cluj-Napoca",
      education: "Babeș-Bolyai University, Doctor of Law",
      description: "I provide high-quality notarial services with a focus on business and corporate law. My clients appreciate my attention to detail and prompt service delivery.",
      yearsOfExperience: 8,
      languages: ["Romanian", "English", "Hungarian"],
      address: "Strada Napoca 25, Cluj-Napoca, Romania",
      is24_7: false,
      latitude: 46.7693,
      longitude: 23.5901,
      serviceRadius: 15,
      rating: 4.9,
      reviewCount: 9
    },
    specializations: [
      "Corporate Documents", "Inheritance", "Real Estate", "Authentication"
    ],
    services: [
      {
        title: "Corporate Document Authentication",
        description: "Official authentication of business and corporate documents including company registrations, changes in shareholding, and board decisions.",
        price: "€180",
        priceType: "Fixed Price",
        isTopRated: true
      },
      {
        title: "Inheritance Processing",
        description: "Complete handling of inheritance matters including will verification, heir identification, and property transfer documentation.",
        price: "2.5%",
        priceType: "Percentage",
        isTopRated: true
      }
    ],
    reviews: [
      {
        reviewerName: "Diana Preda",
        rating: 5,
        comment: "Extremely professional and knowledgeable. Made the inheritance process much smoother than expected.",
        date: "2025-04-05"
      },
      {
        reviewerName: "Razvan Mocanu",
        rating: 5,
        comment: "Very helpful throughout the entire process. Made what seemed complicated very simple.",
        date: "2025-03-12"
      },
      {
        reviewerName: "Nicoleta Rus",
        rating: 4,
        comment: "Great service for corporate documentation. Fast and efficient.",
        date: "2025-02-18"
      }
    ]
  },
  {
    username: "mpetru",
    password: "password123",
    fullName: "Mihai Petru",
    email: "mihai.petru@example.com",
    role: "provider",
    profile: {
      providerType: "judicial_executor",
      imageUrl: "/uploads/test-profile1.jpg",
      location: "Bucharest",
      education: "Romanian-American University, Legal Studies",
      description: "Efficient and professional judicial executor with expertise in debt recovery and enforcement of court decisions for both individuals and businesses.",
      yearsOfExperience: 15,
      languages: ["Romanian", "English"],
      address: "Calea Victoriei 120, Bucharest, Romania",
      is24_7: true,
      latitude: 44.4396,
      longitude: 26.0962,
      serviceRadius: 30,
      rating: 4.6,
      reviewCount: 8
    },
    specializations: [
      "Debt Recovery", "Court Decision Enforcement", "Property Seizure", "Asset Investigations"
    ],
    services: [
      {
        title: "Debt Recovery - Standard",
        description: "Complete service for recovering debts through legal channels, including document preparation, debtor notification, and payment collection.",
        price: "10% of recovered amount",
        priceType: "Percentage",
        isTopRated: true
      },
      {
        title: "Court Decision Enforcement",
        description: "Execution of court judgments and other enforceable titles, ensuring that legal decisions are properly implemented according to Romanian law.",
        price: "€300 + expenses",
        priceType: "Fixed Price"
      },
      {
        title: "Asset Investigation",
        description: "Thorough research to identify and locate debtor assets that can be subject to enforcement procedures.",
        price: "€200",
        priceType: "Fixed Price"
      }
    ],
    reviews: [
      {
        reviewerName: "Adrian Manea",
        rating: 5,
        comment: "Excellent service. Recovered a debt I thought was lost. Very persistent and professional.",
        date: "2025-04-10"
      },
      {
        reviewerName: "Sorin Bucur",
        rating: 4,
        comment: "Good service for court decision enforcement. Clear communication throughout the process.",
        date: "2025-03-15"
      },
      {
        reviewerName: "Ileana Lazar",
        rating: 5,
        comment: "Thorough asset investigation that revealed hidden assets. Worth every penny.",
        date: "2025-02-22"
      }
    ]
  },
  {
    username: "cstan",
    password: "password123",
    fullName: "Catalin Stan",
    email: "catalin.stan@example.com",
    role: "provider",
    profile: {
      providerType: "lawyer",
      imageUrl: "/uploads/test-profile3.jpg",
      location: "Bucharest",
      education: "University of Bucharest, Law School",
      description: "Experienced corporate lawyer with a strong background in business law, mergers and acquisitions, and international commercial agreements.",
      yearsOfExperience: 18,
      languages: ["Romanian", "English", "French", "German"],
      address: "Bulevardul Unirii 70, Bucharest, Romania",
      is24_7: false,
      latitude: 44.4268,
      longitude: 26.1025,
      serviceRadius: 20,
      rating: 4.9,
      reviewCount: 15
    },
    specializations: [
      "Corporate Law", "Mergers & Acquisitions", "Contract Negotiation", "International Business"
    ],
    services: [
      {
        title: "Corporate Legal Consultation",
        description: "Expert advice on corporate structure, governance, compliance issues, and business strategy from a legal perspective.",
        price: "€150/hour",
        priceType: "Hourly Rate",
        isTopRated: true
      },
      {
        title: "Contract Drafting & Review",
        description: "Creation and analysis of business contracts with attention to legal protection, risk management, and favorable terms.",
        price: "€800 - €2000",
        priceType: "Fixed Price Range"
      },
      {
        title: "M&A Legal Support",
        description: "Comprehensive legal guidance throughout mergers and acquisitions, including due diligence, negotiation, and transaction documentation.",
        price: "0.5-1% of transaction value",
        priceType: "Percentage"
      }
    ],
    reviews: [
      {
        reviewerName: "Ion Vasilescu",
        rating: 5,
        comment: "Top-tier corporate lawyer. His advice helped our company navigate a complex merger successfully.",
        date: "2025-04-12"
      },
      {
        reviewerName: "Mihaela Voicu",
        rating: 5,
        comment: "Exceptional contract review service. Found several issues that would have caused problems later.",
        date: "2025-03-20"
      },
      {
        reviewerName: "George Avram",
        rating: 4,
        comment: "Great corporate consultation, though fees are on the higher side. Worth it for the expertise.",
        date: "2025-02-15"
      }
    ]
  },
  {
    username: "cdumitru",
    password: "password123",
    fullName: "Constantin Dumitru",
    email: "constantin.dumitru@example.com",
    role: "provider",
    profile: {
      providerType: "judge",
      imageUrl: "/uploads/test-profile4.jpg",
      location: "Bucharest",
      education: "University of Bucharest, Judicial Studies",
      description: "Retired High Court judge with 30 years on the bench. Now offering legal consultation, arbitration, and expert opinions on complex legal matters.",
      yearsOfExperience: 30,
      languages: ["Romanian", "English", "French"],
      address: "Bulevardul Carol I 25, Bucharest, Romania",
      is24_7: false,
      latitude: 44.4365,
      longitude: 26.1025,
      serviceRadius: 15,
      rating: 5.0,
      reviewCount: 7
    },
    specializations: [
      "Legal Consultation", "Arbitration", "Mediation", "Expert Opinions"
    ],
    services: [
      {
        title: "Legal Expert Opinion",
        description: "Authoritative legal opinions on complex matters based on extensive judicial experience, suitable for case preparation or resolution strategy.",
        price: "€500 - €1500",
        priceType: "Fixed Price Range",
        isTopRated: true
      },
      {
        title: "Private Arbitration",
        description: "Impartial resolution of disputes outside the court system, resulting in a binding decision based on legal principles and case merits.",
        price: "€2000 per case",
        priceType: "Fixed Price",
        isTopRated: true
      },
      {
        title: "Legal Strategy Consultation",
        description: "High-level advice on case strategy from a judicial perspective, offering unique insights on approach, argumentation, and presentation.",
        price: "€250/hour",
        priceType: "Hourly Rate"
      }
    ],
    reviews: [
      {
        reviewerName: "Catalin Draghici",
        rating: 5,
        comment: "His expert opinion completely changed our case strategy. Invaluable judicial perspective.",
        date: "2025-04-05"
      },
      {
        reviewerName: "Oana Paun",
        rating: 5,
        comment: "The arbitration process was fair, thorough, and efficient. Highly recommend.",
        date: "2025-03-10"
      },
      {
        reviewerName: "Liviu Mincu",
        rating: 5,
        comment: "Exceptional legal mind. His strategic advice was game-changing for our case.",
        date: "2025-02-22"
      }
    ]
  }
];

// Main seeding function
async function seedProviders() {
  try {
    console.log('Starting provider seeding...');
    
    for (const provider of providers) {
      try {
        // Check if user already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.username, provider.username));
          
        if (existingUser.length > 0) {
          console.log(`User ${provider.username} already exists, skipping...`);
          continue;
        }
        
        // Create the user
        console.log(`Creating user for ${provider.fullName}...`);
        const [user] = await db.insert(users).values({
          username: provider.username,
          password: provider.password,
          fullName: provider.fullName,
          email: provider.email,
          role: provider.role
        }).returning();
        
        // Create provider profile
        console.log(`Creating provider profile for ${provider.fullName}...`);
        const [profile] = await db.insert(providerProfiles).values({
          userId: user.id,
          providerType: provider.profile.providerType,
          imageUrl: provider.profile.imageUrl,
          location: provider.profile.location,
          education: provider.profile.education,
          description: provider.profile.description,
          yearsOfExperience: provider.profile.yearsOfExperience,
          languages: provider.profile.languages,
          address: provider.profile.address,
          is24_7: provider.profile.is24_7,
          latitude: provider.profile.latitude,
          longitude: provider.profile.longitude,
          serviceRadius: provider.profile.serviceRadius,
          rating: provider.profile.rating,
          reviewCount: provider.profile.reviewCount
        }).returning();
        
        // Add specializations
        for (const spec of provider.specializations) {
          await db.insert(specializations).values({
            providerId: profile.id,
            name: spec
          });
        }
        
        // Add services
        for (const service of provider.services) {
          await db.insert(services).values({
            providerId: profile.id,
            title: service.title,
            description: service.description,
            price: service.price,
            priceType: service.priceType,
            isTopRated: service.isTopRated || false
          });
        }
        
        // Add reviews
        for (const review of provider.reviews) {
          await db.insert(reviews).values({
            providerId: profile.id,
            reviewerName: review.reviewerName,
            rating: review.rating,
            comment: review.comment,
            date: review.date
          });
        }
        
        console.log(`Completed setup for ${provider.fullName} with ${provider.reviews.length} reviews`);
      } catch (providerError) {
        console.error(`Error processing provider ${provider.fullName}:`, providerError);
      }
    }
    
    console.log('Provider seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding providers:', error);
  }
}

// Run the seeding
seedProviders().catch(err => {
  console.error('Failed to seed providers:', err);
});