
'use server';

/**
 * @fileOverview Flow to process and save a new user testimonial.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeServerFirebase } from '@/migrations/001-migrate-software';
import { collection, addDoc, getFirestore } from 'firebase/firestore';

const SubmitTestimonialRequestSchema = z.object({
  authorName: z.string(),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
  content: z.string(),
  category: z.string(),
});
export type SubmitTestimonialRequest = z.infer<typeof SubmitTestimonialRequestSchema>;

const SubmitTestimonialResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitTestimonialResponse = z.infer<typeof SubmitTestimonialResponseSchema>;

export const submitTestimonialFlow = ai.defineFlow(
  {
    name: 'submitTestimonialFlow',
    inputSchema: SubmitTestimonialRequestSchema,
    outputSchema: SubmitTestimonialResponseSchema,
  },
  async (request) => {
    try {
      const app = await initializeServerFirebase();
      const firestore = getFirestore(app);
      
      const newTestimonial = {
        authorName: request.authorName,
        authorTitle: request.authorTitle || '',
        authorCompany: request.authorCompany || '',
        authorAvatarUrl: `https://picsum.photos/seed/${request.authorName.replace(/\s/g, '')}/100/100`, // Placeholder avatar
        content: request.content,
        category: request.category,
        status: 'Pending', // All testimonials need approval
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'testimonials'), newTestimonial);

      return {
        success: true,
        message: 'Testimonial submitted successfully and is pending review.',
      };
    } catch (error) {
      console.error('Error in submitTestimonialFlow:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to submit testimonial: ${errorMessage}`,
      };
    }
  }
);

    