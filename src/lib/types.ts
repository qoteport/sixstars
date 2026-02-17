
import { z } from 'zod';

// AI Flow Schemas
export const copilotRequestBodySchema = z.object({
  history: z.array(z.any()), // Simplified for now
  prompt: z.string(),
});
export type CopilotRequestBody = z.infer<typeof copilotRequestBodySchema>;

export const copilotResponseMessageSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.array(z.any()), // Simplified for now
});
export type CopilotResponseMessage = z.infer<typeof copilotResponseMessageSchema>;


export const submitTestimonialRequestSchema = z.object({
  authorName: z.string(),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
  content: z.string(),
  category: z.string(),
});
export type SubmitTestimonialRequest = z.infer<typeof submitTestimonialRequestSchema>;


export const softwareReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string().optional(),
});
export type SoftwareReview = z.infer<typeof softwareReviewSchema>;

export const pricingTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  frequency: z.string(),
  features: z.array(z.string()),
});
export type PricingTier = z.infer<typeof pricingTierSchema>;

export const softwareProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  imageHint: z.string().optional(),
  category: z.string(),
  model: z.string(),
  rating: z.number(),
  features: z.array(z.string()).optional(),
  details: z.string(),
  productUrl: z.string().url().optional(),
  createdAt: z.string().optional(),
  reviewCount: z.number().optional(),
  partnerId: z.string().optional(),
  status: z.enum(['Published', 'Draft']),
  isFeatured: z.boolean().optional(),
  clicks: z.number().optional(),
});
export type SoftwareProduct = z.infer<typeof softwareProductSchema>;


export type Partner = {
  id: string;
  companyName: string;
  contactEmail: string;
  websiteUrl: string;
  logoUrl: string;
  companyDescription: string;
  createdAt: string;
  status: 'Published' | 'Draft';
};

export type Inquiry = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    companySize?: string;
    inquiryType: string;
    message: string;
    createdAt: string;
    status: 'New' | 'Contacted' | 'Resolved' | 'Qualified';
};

export type SalesInquiry = {
    id: string;
    name: string;
    email: string;
    company: string;
    productInterest?: string;
    message: string;
    createdAt: string;
    status: 'New' | 'Contacted' | 'Qualified';
}

export type Customer = {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  logoUrl?: string;
  status: 'Lead' | 'Active' | 'Churned' | 'On Hold';
  lastContacted: string; // ISO date string
  notes?: string;
  createdAt: string;
};

export type Interaction = {
    id: string;
    type: 'Call' | 'Email' | 'Meeting' | 'Note';
    notes: string;
    date: string; // ISO date string
    authorId: string;
}

export const testimonialSchema = z.object({
    id: z.string(),
    authorName: z.string(),
    authorTitle: z.string().optional(),
    authorCompany: z.string().optional(),
    authorAvatarUrl: z.string().url().optional(),
    content: z.string(),
    category: z.string().optional(),
    status: z.enum(['Pending', 'Approved', 'Rejected']),
    createdAt: z.string(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string().optional(),
  role: z.enum(['buyer', 'seller']),
  isAdmin: z.boolean().optional().default(false),
  createdAt: z.string(),
  partnerId: z.string().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const softwareCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
});
export type SoftwareCategory = z.infer<typeof softwareCategorySchema>;
