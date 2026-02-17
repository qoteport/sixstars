
'use server';

import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import { initializeServerFirebase } from '@/migrations/001-migrate-software';
import type { CopilotRequestBody, CopilotResponseMessage, SubmitTestimonialRequest } from '@/lib/types';


export async function getCopilotResponse(body: CopilotRequestBody): Promise<CopilotResponseMessage> {
    // AI Copilot is temporarily unavailable due to dependency issues.
    // Returning a user-friendly error message.
    return {
        role: 'assistant',
        content: [{ text: "The AI copilot is temporarily unavailable. Please try again later." }],
    };
}

export async function trackSoftwareClick(productId: string) {
    try {
        const app = await initializeServerFirebase();
        const firestore = getFirestore(app);
        const productRef = doc(firestore, 'softwareProducts', productId);
        
        await updateDoc(productRef, {
            clicks: increment(1)
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error tracking software click:', error);
        return { success: false, message: 'Failed to track click.' };
    }
}

export async function submitTestimonial(request: SubmitTestimonialRequest) {
    try {
        // await submitTestimonialFlow(request);
        console.log("Testimonial submission is temporarily disabled.", request);
        return { success: true };
    } catch (error) {
        console.error('Error submitting testimonial:', error);
        return { success: false, message: 'Failed to submit testimonial.' };
    }
}

    
