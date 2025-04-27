const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { db } = require('../server/db');
const { users, providerProfiles, services, specializations, reviews } = require('../shared/schema');
const { eq } = require('drizzle-orm');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Sample Romanian cities with their coordinates
const romanianCities = [
  { name: "Bucharest", lat: 44.4268, lon: 26.1025 },
  { name: "Cluj-Napoca", lat: 46.7667, lon: 23.5950 },
  { name: "Timișoara", lat: 45.7538, lon: 21.2258 },
  { name: "Iași", lat: 47.1608, lon: 27.5886 },
  { name: "Constanța", lat: 44.1766, lon: 28.6350 },
  { name: "Craiova", lat: 44.3182, lon: 23.7966 },
  { name: "Brașov", lat: 45.6428, lon: 25.5886 },
  { name: "Galați", lat: 45.4353, lon: 28.0425 },
  { name: "Ploiești", lat: 44.9401, lon: 26.0408 },
  { name: "Oradea", lat: 47.0468, lon: 21.9279 },
  { name: "Brăila", lat: 45.2692, lon: 27.9575 },
  { name: "Arad", lat: 46.1866, lon: 21.3123 },
  { name: "Pitești", lat: 44.8560, lon: 24.8691 },
  { name: "Sibiu", lat: 45.7985, lon: 24.1487 },
  { name: "Bacău", lat: 46.5671, lon: 26.9146 },
  { name: "Târgu Mureș", lat: 46.5455, lon: 24.5625 },
  { name: "Baia Mare", lat: 47.6531, lon: 23.5691 },
  { name: "Buzău", lat: 45.1502, lon: 26.8351 },
  { name: "Satu Mare", lat: 47.7927, lon: 22.8790 },
  { name: "Botoșani", lat: 47.7487, lon: 26.6694 }
];

// Romanian universities
const romanianUniversities = [
  "University of Bucharest, Faculty of Law",
  "Babeș-Bolyai University, Law School",
  "West University of Timișoara, Faculty of Law",
  "Alexandru Ioan Cuza University, Faculty of Law",
  "Ovidius University of Constanța, Faculty of Law",
  "University of Craiova, Faculty of Law",
  "Transilvania University of Brașov, Faculty of Law",
  "Lucian Blaga University, Faculty of Law",
  "Nicolae Titulescu University, Faculty of Law",
  "Titu Maiorescu University, Faculty of Law",
  "Dimitrie Cantemir University, Faculty of Law",
  "Vasile Goldiș Western University, Faculty of Law",
  "Oradea University, Faculty of Law",
  "Hyperion University, Faculty of Law",
  "Spiru Haret University, Faculty of Law",
  "Romanian-American University, Faculty of Law",
  "Ecological University of Bucharest, Faculty of Law",
  "Danubius University, Faculty of Law",
  "Mihail Kogălniceanu University, Faculty of Law",
  "George Bacovia University, Faculty of Law"
];

// Sample Romanian names for providers
const romanianNames = [
  { first: "Maria", last: "Popescu" },
  { first: "Andrei", last: "Ivanescu" },
  { first: "Elena", last: "Dumitru" },
  { first: "Mihai", last: "Constantin" },
  { first: "Cristina", last: "Vasile" },
  { first: "Alexandru", last: "Stan" },
  { first: "Ioana", last: "Gheorghe" },
  { first: "Nicolae", last: "Ionescu" },
  { first: "Ana", last: "Popa" },
  { first: "Gabriel", last: "Marin" },
  { first: "Simona", last: "Stoica" },
  { first: "Tudor", last: "Radu" },
  { first: "Laura", last: "Diaconu" },
  { first: "Vlad", last: "Dumitrescu" },
  { first: "Daniela", last: "Ilie" },
  { first: "Bogdan", last: "Nistor" },
  { first: "Carmen", last: "Florescu" },
  { first: "Marius", last: "Stanescu" },
  { first: "Diana", last: "Preda" },
  { first: "Radu", last: "Cojocaru" },
  { first: "Alina", last: "Badea" },
  { first: "Sorin", last: "Enache" },
  { first: "Mihaela", last: "Niculescu" },
  { first: "Lucian", last: "Serban" },
  { first: "Monica", last: "Lungu" },
  { first: "Adrian", last: "Manea" },
  { first: "Roxana", last: "Dragomir" },
  { first: "Ciprian", last: "Sandu" },
  { first: "Mirela", last: "Dobre" },
  { first: "Cosmin", last: "Marinescu" }
];

// Sample reviewer names for realistic reviews
const reviewerNames = [
  "Ioana Mihai", "Victor Popescu", "Raluca Stan", "Cristian Dinu", "Gabriela Neagu", 
  "Marian Balan", "Alina Stoica", "Daniel Toma", "Andreea Pascu", "Razvan Mocanu",
  "Carmen Barbu", "Lucian Ene", "Nicoleta Rus", "Florin Pavel", "Adriana Sava",
  "Bogdan Nica", "Simona Tudor", "Alexandru Andrei", "Dana Cretu", "Ion Vasilescu",
  "Mihaela Voicu", "George Avram", "Ileana Lazar", "Sorin Bucur", "Roxana Olteanu",
  "Catalin Draghici", "Oana Paun", "Liviu Mincu", "Ramona Bratu", "Paul Coman"
];

// Sample review content for various legal services
const reviewContents = [
  "Very professional service, helped me complete my real estate transaction without any issues.",
  "Excellent knowledge of the law. Managed to resolve my case efficiently.",
  "Prompt and responsive. Handled all my documentation properly and within the timeframe promised.",
  "Great attention to detail. Spotted potential issues in my contract that could have caused problems later.",
  "Highly professional and explained everything in terms I could understand.",
  "The service was good, but took a bit longer than expected. Still, the quality of work was excellent.",
  "Extremely knowledgeable in their field. Gave me valuable advice that saved me money.",
  "Handled my case with utmost confidentiality and professionalism. Will definitely use again.",
  "Very helpful throughout the entire process. Made what seemed complicated very simple.",
  "Fair pricing for the high quality service provided. Would recommend to others.",
  "Exceptional communication skills. Kept me informed at every step of the process.",
  "Efficient service with great attention to legal details. Very satisfied with the outcome.",
  "Helped me navigate a complex legal situation with clear explanations and sound advice.",
  "Professional demeanor and expert knowledge made a potentially stressful situation much easier.",
  "Quick response times and thorough explanations. Exactly what I needed.",
  "Resolved my issue much faster than I expected. Very impressed with their expertise.",
  "Extensive knowledge in their specialized area. Provided options I hadn't considered.",
  "The service exceeded my expectations. Will definitely be my go-to legal professional in the future.",
  "Well-organized office and efficient process. Made everything straightforward.",
  "Handled a complex legal matter with expertise. The outcome was better than I hoped for."
];

// Sample specializations for different provider types
const specializations = {
  notary: [
    "Real Estate Transactions", "Business Contracts", "Powers of Attorney", "Succession",
    "Family Documents", "Corporate Documents", "Wills and Testaments", "Document Authentication",
    "Apostille Services", "Property Titles", "Inheritance", "Prenuptial Agreements",
    "Company Formation", "Digital Certification", "International Documents", "Estate Planning"
  ],
  judicial_executor: [
    "Debt Recovery", "Court Decision Enforcement", "Asset Seizure", "Property Evictions",
    "Commercial Enforcement", "Legal Notifications", "Asset Investigation", "Payment Orders",
    "Cross-Border Enforcement", "Mortgage Enforcement", "Real Estate Enforcement", "Attachment Procedures",
    "Corporate Debt Recovery", "Execution of Judgments", "Sequestration", "Inventory Procedures"
  ],
  lawyer: [
    "Corporate Law", "Family Law", "Criminal Defense", "Intellectual Property",
    "Tax Law", "Real Estate Law", "Labor Law", "Banking & Finance",
    "Environmental Law", "Immigration Law", "Maritime Law", "Competition Law",
    "Insurance Law", "Medical Malpractice", "Civil Litigation", "Administrative Law",
    "Energy Law", "Bankruptcy Law", "Construction Law", "Data Protection & Privacy"
  ],
  judge: [
    "Legal Consultation", "Case Evaluation", "Arbitration", "Mediation",
    "Expert Opinions", "Commercial Dispute Resolution", "Constitutional Analysis", "Human Rights Assessment",
    "Judicial Review", "Legislative Analysis", "Contract Dispute Resolution", "Administrative Appeal Analysis",
    "Ethics Consultation", "Legal Strategy", "Moot Court Training", "Academic Legal Research"
  ]
};

// Sample services for each provider type
const services = {
  notary: [
    {
      title: "Real Estate Transaction Processing",
      description: "Complete notarial services for property sales, purchases, and transfers including title verification, contract authentication, and registration.",
      priceType: "Percentage",
      priceRange: ["0.5% of property value", "1% of property value", "€250 - €500", "€300 - €800"]
    },
    {
      title: "Will Drafting and Authentication",
      description: "Creation and legal authentication of testamentary documents that ensure your assets are distributed according to your wishes.",
      priceType: "Fixed Price",
      priceRange: ["€150", "€200", "€250", "€300"]
    },
    {
      title: "Business Contract Authentication",
      description: "Official verification and certification of commercial agreements, ensuring legal validity and compliance with Romanian law.",
      priceType: "Fixed Price",
      priceRange: ["€100", "€150", "€200", "€250"]
    },
    {
      title: "Power of Attorney",
      description: "Legal documentation authorizing another person to act on your behalf in specified matters, whether personal, financial, or business-related.",
      priceType: "Fixed Price",
      priceRange: ["€80", "€100", "€120", "€150"]
    },
    {
      title: "Document Apostille Processing",
      description: "Authentication of documents for international use, including obtaining apostille certification from the relevant authorities.",
      priceType: "Fixed Price",
      priceRange: ["€70 per document", "€90 per document", "€120 per document", "€150 per document"]
    },
    {
      title: "Inheritance Procedure",
      description: "Complete notarial handling of succession matters, including heir identification, asset inventory, and property transfer documentation.",
      priceType: "Mixed",
      priceRange: ["€300 + 0.5% of estate value", "€400 + 1% of estate value", "€500 + 1.5% of estate value"]
    }
  ],
  judicial_executor: [
    {
      title: "Debt Recovery",
      description: "Professional enforcement of payment obligations through legal means, including debtor notification, asset identification, and collection procedures.",
      priceType: "Percentage",
      priceRange: ["7% of recovered amount", "8% of recovered amount", "10% of recovered amount", "12% of recovered amount"]
    },
    {
      title: "Court Decision Enforcement",
      description: "Execution of final court judgments and other enforceable titles according to Romanian procedural law.",
      priceType: "Fixed Price",
      priceRange: ["€250 + expenses", "€300 + expenses", "€400 + expenses", "€500 + expenses"]
    },
    {
      title: "Property Eviction",
      description: "Legal execution of eviction orders for residential or commercial properties, conducted with proper documentation and procedure.",
      priceType: "Fixed Price",
      priceRange: ["€350", "€400", "€500", "€600"]
    },
    {
      title: "Asset Seizure",
      description: "Identification, inventory, and legal seizure of debtor assets as directed by court enforcement orders.",
      priceType: "Fixed Price",
      priceRange: ["€300", "€350", "€400", "€450"]
    },
    {
      title: "Official Document Service",
      description: "Professional delivery of legal notices, summons, and other official documents with verification of receipt.",
      priceType: "Fixed Price",
      priceRange: ["€50 per document", "€60 per document", "€75 per document", "€100 per document"]
    },
    {
      title: "Asset Investigation",
      description: "Thorough investigation to identify and locate debtor assets available for potential seizure and recovery.",
      priceType: "Fixed Price",
      priceRange: ["€200", "€250", "€300", "€350"]
    }
  ],
  lawyer: [
    {
      title: "Legal Consultation",
      description: "Expert advice on legal matters including case evaluation, rights assessment, and strategic guidance for your specific situation.",
      priceType: "Hourly Rate",
      priceRange: ["€80/hour", "€100/hour", "€150/hour", "€200/hour"]
    },
    {
      title: "Contract Drafting & Review",
      description: "Creation or analysis of legal agreements to ensure proper terms, legal compliance, and protection of your interests.",
      priceType: "Fixed Price",
      priceRange: ["€300", "€500", "€800", "€1000"]
    },
    {
      title: "Court Representation",
      description: "Full legal representation in court proceedings, including case preparation, document filing, and advocacy at hearings.",
      priceType: "Fixed Price",
      priceRange: ["€1000", "€1500", "€2000", "€3000"]
    },
    {
      title: "Divorce & Family Matters",
      description: "Legal assistance with divorce proceedings, child custody arrangements, alimony negotiations, and other family law issues.",
      priceType: "Fixed Price",
      priceRange: ["€800", "€1200", "€1500", "€2000"]
    },
    {
      title: "Business Legal Package",
      description: "Comprehensive legal services for businesses including formation documents, contracts, compliance advice, and dispute resolution.",
      priceType: "Monthly Retainer",
      priceRange: ["€400/month", "€600/month", "€800/month", "€1000/month"]
    },
    {
      title: "Property Law Services",
      description: "Legal assistance with real estate matters including property purchases, lease agreements, boundary disputes, and development regulations.",
      priceType: "Fixed Price",
      priceRange: ["€500", "€750", "€1000", "€1500"]
    }
  ],
  judge: [
    {
      title: "Legal Expert Opinion",
      description: "Authoritative analysis and opinion on complex legal matters from a judicial perspective, suitable for case preparation or dispute resolution.",
      priceType: "Fixed Price",
      priceRange: ["€500", "€750", "€1000", "€1500"]
    },
    {
      title: "Private Arbitration",
      description: "Impartial resolution of disputes outside the court system, resulting in a binding decision based on legal principles.",
      priceType: "Fixed Price",
      priceRange: ["€1500", "€2000", "€2500", "€3000"]
    },
    {
      title: "Mediation Services",
      description: "Neutral facilitation of negotiations between disputing parties to reach a mutually acceptable resolution without litigation.",
      priceType: "Fixed Price",
      priceRange: ["€800", "€1000", "€1200", "€1500"]
    },
    {
      title: "Case Evaluation",
      description: "Thorough assessment of case strengths and weaknesses from a judicial perspective, helping to determine optimal legal strategy.",
      priceType: "Hourly Rate",
      priceRange: ["€150/hour", "€200/hour", "€250/hour", "€300/hour"]
    },
    {
      title: "Mock Trial Presiding",
      description: "Experienced judicial oversight for mock trials and moot court proceedings, providing realistic courtroom experience and feedback.",
      priceType: "Fixed Price",
      priceRange: ["€600", "€800", "€1000", "€1200"]
    },
    {
      title: "Constitutional Law Analysis",
      description: "Expert assessment of constitutional issues affecting legislation, administrative actions, or individual rights.",
      priceType: "Fixed Price",
      priceRange: ["€1000", "€1500", "€2000", "€2500"]
    }
  ]
};

// Sample language combinations commonly spoken in Romania
const languageCombinations = [
  ["Romanian", "English"],
  ["Romanian", "English", "French"],
  ["Romanian", "English", "German"],
  ["Romanian", "English", "Hungarian"],
  ["Romanian", "English", "Italian"],
  ["Romanian", "English", "Spanish"],
  ["Romanian", "French", "German"],
  ["Romanian", "Hungarian"],
  ["Romanian", "German"],
  ["Romanian", "French"]
];

// Function to generate a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get a random element from an array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to get multiple random elements from an array
function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to generate a username from a name
function generateUsername(firstName, lastName) {
  return (firstName.charAt(0) + lastName).toLowerCase();
}

// Function to download an image placeholder if it doesn't exist
async function downloadImage(username, index) {
  const filename = `${username}.jpg`;
  const filepath = path.join(uploadsDir, filename);
  
  // If file already exists, don't download again
  if (fs.existsSync(filepath)) {
    console.log(`Image for ${username} already exists`);
    return `/uploads/${filename}`;
  }
  
  // Generate a unique seed for consistent images
  const seed = username.length * 5 + index;
  
  // Use a seed-based placeholder service for consistent images per provider
  const url = `https://picsum.photos/seed/${seed}/400/400`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`Downloaded image for ${username}`);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error(`Error downloading image for ${username}:`, error);
    return `/uploads/default-profile.jpg`; // Fallback to default if download fails
  }
}

// Function to generate a review with a specific rating
function generateReview(providerId, rating) {
  const reviewerName = getRandomElement(reviewerNames);
  const content = getRandomElement(reviewContents);
  
  // Generate a date within the last year
  const date = new Date();
  date.setMonth(date.getMonth() - getRandomInt(0, 11));
  date.setDate(getRandomInt(1, 28));
  
  return {
    providerId,
    reviewerId: null, // We don't have actual reviewer IDs
    reviewerName,
    rating,
    comment: content,
    date: date.toISOString().split('T')[0]
  };
}

// Function to generate reviews with a target average
function generateReviews(providerId, targetAverage, count) {
  let reviews = [];
  let totalRating = 0;
  
  // Generate most reviews around the target rating
  for (let i = 0; i < count - 2; i++) {
    // Stay within +/- 1 of target rating for most reviews
    const deviation = getRandomInt(-1, 1);
    let rating = Math.max(1, Math.min(5, Math.round(targetAverage + deviation)));
    reviews.push(generateReview(providerId, rating));
    totalRating += rating;
  }
  
  // Add 1-2 outlier reviews to make it realistic
  if (count > 3) {
    // Add a very positive review
    reviews.push(generateReview(providerId, 5));
    totalRating += 5;
    
    // Maybe add a more critical review
    if (getRandomInt(1, 3) === 1) {
      reviews.push(generateReview(providerId, getRandomInt(1, 3)));
      totalRating += getRandomInt(1, 3);
    } else {
      reviews.push(generateReview(providerId, getRandomInt(4, 5)));
      totalRating += getRandomInt(4, 5);
    }
  }
  
  return reviews;
}

// Function to generate a provider profile
async function generateProvider(index) {
  // Select provider type
  const providerTypes = ["notary", "judicial_executor", "lawyer", "judge"];
  const providerType = providerTypes[index % providerTypes.length]; // Distribute types evenly
  
  // Select name
  const name = romanianNames[index % romanianNames.length];
  const fullName = `${name.first} ${name.last}`;
  const username = generateUsername(name.first, name.last);
  
  // Select location
  const city = romanianCities[index % romanianCities.length];
  
  // Select education
  const education = `${getRandomElement(romanianUniversities)}`;
  
  // Select specializations
  const specCount = getRandomInt(3, 5);
  const providerSpecializations = getRandomElements(specializations[providerType], specCount);
  
  // Select languages
  const languages = getRandomElement(languageCombinations);
  
  // Generate experience years
  const yearsOfExperience = getRandomInt(5, 30);
  
  // Determine availability
  const is24_7 = Math.random() < 0.2; // 20% chance of 24/7 availability
  
  // Generate rating data
  const targetRating = getRandomInt(40, 50) / 10; // Between 4.0 and 5.0
  const reviewCount = getRandomInt(15, 150);
  
  // Generate service radius
  const serviceRadius = getRandomInt(10, 50);
  
  // Generate services
  const serviceCount = getRandomInt(2, 4);
  const providerServices = getRandomElements(services[providerType], serviceCount).map(service => {
    const isTopRated = Math.random() < 0.3; // 30% chance of being top rated
    return {
      title: service.title,
      description: service.description,
      price: getRandomElement(service.priceRange),
      priceType: service.priceType,
      isTopRated
    };
  });
  
  // Generate profile description based on specializations and experience
  const description = `Experienced ${providerType.replace("_", " ")} with ${yearsOfExperience} years of practice, specializing in ${providerSpecializations.join(", ")}. Based in ${city.name}, I provide professional legal services with a focus on client satisfaction and effective outcomes.`;
  
  return {
    username,
    password: "password123", // In a real app, this would be properly hashed
    fullName,
    email: `${username}@example.com`,
    type: providerType,
    profileData: {
      imageUrl: await downloadImage(username, index),
      location: city.name,
      education,
      description,
      yearsOfExperience,
      specializations: providerSpecializations,
      languages,
      address: `${getRandomInt(1, 100)} Main Street, ${city.name}, Romania`,
      is24_7,
      latitude: city.lat + (Math.random() * 0.01 - 0.005), // Add small variation to coordinates
      longitude: city.lon + (Math.random() * 0.01 - 0.005),
      serviceRadius,
      rating: targetRating,
      reviewCount
    },
    services: providerServices,
    reviewCount,
    targetRating
  };
}

// Main seeding function
async function seedProviders() {
  try {
    console.log('Starting provider seeding...');
    
    // Install node-fetch if needed
    try {
      require('node-fetch');
    } catch (e) {
      console.log('Installing node-fetch...');
      const { execSync } = require('child_process');
      execSync('npm install node-fetch@2');
    }
    
    // Generate 20 providers
    const providers = [];
    for (let i = 0; i < 20; i++) {
      providers.push(await generateProvider(i));
    }
    
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, provider.username));
      
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
        role: 'provider'
      }).returning();
      
      // Create provider profile
      console.log(`Creating provider profile for ${provider.fullName}...`);
      const [profile] = await db.insert(providerProfiles).values({
        userId: user.id,
        providerType: provider.type,
        imageUrl: provider.profileData.imageUrl,
        location: provider.profileData.location,
        education: provider.profileData.education,
        description: provider.profileData.description,
        yearsOfExperience: provider.profileData.yearsOfExperience,
        languages: provider.profileData.languages,
        address: provider.profileData.address,
        is24_7: provider.profileData.is24_7,
        latitude: provider.profileData.latitude,
        longitude: provider.profileData.longitude,
        serviceRadius: provider.profileData.serviceRadius,
        rating: provider.profileData.rating,
        reviewCount: provider.profileData.reviewCount
      }).returning();
      
      // Add specializations
      for (const spec of provider.profileData.specializations) {
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
          isTopRated: service.isTopRated
        });
      }
      
      // Add reviews
      const reviewsList = generateReviews(profile.id, provider.targetRating, provider.reviewCount);
      
      // Insert reviews in batches to avoid overloading the database
      const BATCH_SIZE = 20;
      for (let j = 0; j < reviewsList.length; j += BATCH_SIZE) {
        const batch = reviewsList.slice(j, j + BATCH_SIZE);
        await db.insert(reviews).values(batch);
      }
      
      console.log(`Completed setup for ${provider.fullName} with ${reviewsList.length} reviews`);
    }
    
    console.log('Provider seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding providers:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedProviders();