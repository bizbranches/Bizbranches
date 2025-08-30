import { Collection, Db, MongoClient } from "mongodb"
import { Business, Category, City, Review } from "./schemas"

// Database Models Class
export class DatabaseModels {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  // Business Collection
  get businesses(): Collection<Business> {
    return this.db.collection<Business>("businesses")
  }

  // Categories Collection
  get categories(): Collection<Category> {
    return this.db.collection<Category>("categories")
  }

  // Cities Collection
  get cities(): Collection<City> {
    return this.db.collection<City>("cities")
  }

  // Reviews Collection
  get reviews(): Collection<Review> {
    return this.db.collection<Review>("reviews")
  }

  // Create indexes for better performance
  async createIndexes(): Promise<void> {
    try {
      // Business indexes
      await this.businesses.createIndex({ category: 1, city: 1 })
      await this.businesses.createIndex({ status: 1 })
      await this.businesses.createIndex({ createdAt: -1 })
      await this.businesses.createIndex(
        { slug: 1 },
        { unique: true, partialFilterExpression: { slug: { $exists: true } } }
      )
      await this.businesses.createIndex({ name: "text", description: "text" })

      // Category indexes
      await this.categories.createIndex({ slug: 1 }, { unique: true })
      await this.categories.createIndex({ isActive: 1 })

      // City indexes
      await this.cities.createIndex({ slug: 1 }, { unique: true })
      await this.cities.createIndex({ isActive: 1 })

      // Review indexes
      await this.reviews.createIndex({ businessId: 1, createdAt: -1 })
      await this.reviews.createIndex({ businessId: 1, rating: -1 })

      console.log("Database indexes created successfully")
    } catch (error) {
      console.error("Error creating indexes:", error)
    }
  }

  // Initialize default data
  async initializeDefaultData(): Promise<void> {
    try {
      // Check if categories exist
      const categoryCount = await this.categories.countDocuments()
      if (categoryCount === 0) {
        const defaultCategories: Category[] = [
          {
            name: "Restaurants",
            slug: "restaurants",
            icon: "🍽️",
            description: "Food and dining establishments",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Healthcare",
            slug: "healthcare",
            icon: "🏥",
            description: "Medical and healthcare services",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Education",
            slug: "education",
            icon: "🎓",
            description: "Educational institutions and services",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Automotive",
            slug: "automotive",
            icon: "🚗",
            description: "Car services and automotive businesses",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Beauty & Salon",
            slug: "beauty-salon",
            icon: "💄",
            description: "Beauty and salon services",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Shopping",
            slug: "shopping",
            icon: "🛍️",
            description: "Retail and shopping centers",
            count: 0,
            isActive: true,
            createdAt: new Date(),
          },
        ]

        await this.categories.insertMany(defaultCategories)
        console.log("Default categories inserted")
      }

      // Check if cities exist
      const cityCount = await this.cities.countDocuments()
      if (cityCount === 0) {
        const defaultCities: City[] = [
          {
            name: "Karachi",
            slug: "karachi",
            province: "Sindh",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Lahore",
            slug: "lahore",
            province: "Punjab",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Islamabad",
            slug: "islamabad",
            province: "Federal Capital",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Rawalpindi",
            slug: "rawalpindi",
            province: "Punjab",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Faisalabad",
            slug: "faisalabad",
            province: "Punjab",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
          {
            name: "Multan",
            slug: "multan",
            province: "Punjab",
            country: "Pakistan",
            isActive: true,
            createdAt: new Date(),
          },
        ]

        await this.cities.insertMany(defaultCities)
        console.log("Default cities inserted")
      }
    } catch (error) {
      console.error("Error initializing default data:", error)
    }
  }
}

// Helper function to get models instance
export async function getModels(): Promise<DatabaseModels> {
  const { getDb } = await import("./mongodb")
  const db = await getDb()
  return new DatabaseModels(db)
}
