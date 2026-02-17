
'use server';

// import { softwareCopilotFlow } from '@/ai/flows/software-copilot-flow';
// import type { CopilotRequestBody, CopilotResponseMessage } from '@/ai/flows/software-copilot-flow';
// import { submitTestimonialFlow, type SubmitTestimonialRequest } from '@/ai/flows/submit-testimonial-flow';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import { initializeServerFirebase } from '@/migrations/001-migrate-software';
import type { CopilotRequestBody, CopilotResponseMessage, SubmitTestimonialRequest } from '@/lib/types';


export async function getCopilotResponse(body: CopilotRequestBody): Promise<CopilotResponseMessage> {
  try {
    // const response = await softwareCopilotFlow(body);
    // return response;
    return {
      role: 'assistant',
      content: [{text: "The AI copilot is temporarily unavailable. Please try again later."}]
    }
  } catch (error) {
    console.error('Error in getCopilotResponse. The original error was:', error);
    // In a real app, you'd handle this more gracefully
    throw new Error('Failed to get response from AI.');
  }
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

    
