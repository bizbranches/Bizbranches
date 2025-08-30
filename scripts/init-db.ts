#!/usr/bin/env tsx

/**
 * Database Initialization Script
 * Run this script to set up the database with indexes and default data
 * 
 * Usage: npx tsx scripts/init-db.ts
 */

import { getModels } from "../lib/models"

async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database...")
    
    const models = await getModels()
    
    // Create indexes
    console.log("📊 Creating database indexes...")
    await models.createIndexes()
    
    // Initialize default data
    console.log("📝 Setting up default categories and cities...")
    await models.initializeDefaultData()
    
    console.log("✅ Database initialization completed successfully!")
    console.log("\nDefault categories added:")
    console.log("- Restaurants 🍽️")
    console.log("- Healthcare 🏥") 
    console.log("- Education 🎓")
    console.log("- Automotive 🚗")
    console.log("- Beauty & Salon 💄")
    console.log("- Shopping 🛍️")
    
    console.log("\nDefault cities added:")
    console.log("- Karachi, Sindh")
    console.log("- Lahore, Punjab")
    console.log("- Islamabad, Federal Capital")
    console.log("- Rawalpindi, Punjab")
    console.log("- Faisalabad, Punjab")
    console.log("- Multan, Punjab")
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  }
}

// Run the initialization
initializeDatabase()
