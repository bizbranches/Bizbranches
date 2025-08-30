import { z } from "zod"

// Business Schema for validation
export const BusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(140, "Slug too long"),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required").max(500, "Address too long"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number too long"),
  contactPerson: z.string().optional().transform(val => val === "" ? undefined : val),
  whatsapp: z.string().optional().transform(val => val === "" ? undefined : val),
  email: z.string().email("Invalid email format"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  logoUrl: z.string().url().optional(),
  logoPublicId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  ratingAvg: z.number().optional(),
  ratingCount: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
})

// Type inference from schema
export type Business = z.infer<typeof BusinessSchema>

// Schema for business creation (without auto-generated fields)
export const CreateBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100, "Name too long"),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required").max(500, "Address too long"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number too long"),
  contactPerson: z.string().optional().transform(val => val === "" ? undefined : val),
  whatsapp: z.string().optional().transform(val => val === "" ? undefined : val),
  email: z.string().email("Invalid email format"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
})

export type CreateBusiness = z.infer<typeof CreateBusinessSchema>

// Category Schema
export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Category slug is required"),
  icon: z.string().optional(),
  description: z.string().optional(),
  count: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
})

export type Category = z.infer<typeof CategorySchema>

// City Schema
export const CitySchema = z.object({
  name: z.string().min(1, "City name is required"),
  slug: z.string().min(1, "City slug is required"),
  province: z.string().optional(),
  country: z.string().default("Pakistan"),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
})

export type City = z.infer<typeof CitySchema>

// Database Collections Interface
export interface DatabaseCollections {
  businesses: Business[]
  categories: Category[]
  cities: City[]
}

// Review Schema
export const ReviewSchema = z.object({
  businessId: z.string().min(1, "businessId is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(3, "Please add a bit more detail").max(1000, "Comment too long"),
  createdAt: z.date().default(() => new Date()),
})

export type Review = z.infer<typeof ReviewSchema>

// Review creation (no createdAt)
export const CreateReviewSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1).max(100),
  rating: z.number().min(1).max(5),
  comment: z.string().min(3).max(1000),
})

export type CreateReview = z.infer<typeof CreateReviewSchema>
