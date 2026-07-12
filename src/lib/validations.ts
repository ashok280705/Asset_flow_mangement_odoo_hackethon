import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  serialNumber: z.string().optional(),
  acquisitionDate: z.string().min(1, 'Acquisition date is required'),
  acquisitionCost: z.number().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']),
  location: z.string().optional(),
  departmentId: z.string().optional(),
  isBookable: z.boolean().default(false),
  notes: z.string().optional(),
})

export const allocationSchema = z.object({
  assetId: z.string().min(1),
  userId: z.string().min(1),
  expectedReturn: z.string().optional(),
  conditionOut: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']),
})

export const bookingSchema = z.object({
  assetId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  purpose: z.string().optional(),
})

export const maintenanceSchema = z.object({
  assetId: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})
