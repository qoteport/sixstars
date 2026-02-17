
// 'use server';

// /**
//  * @fileOverview A sophisticated AI copilot for software recommendations.
//  *
//  * This flow acts as an intelligent agent that can search for software,
//  * compare products, and provide detailed recommendations based on user queries.
//  * It uses a tool (`searchSoftware`) to interact with the live product database.
//  */

// import { ai } from '@/ai/genkit';
// import { z } from 'zod';
// import { softwareProductSchema } from '@/lib/types';
// import { searchSoftware } from '@/lib/ai-tools';

// // Define the schema for a single part of a message (text or product)
// const ContentPartSchema = z.union([
//   z.object({ text: z.string() }),
//   z.object({ product: softwareProductSchema }),
// ]);

// // A message in the chat history
// const MessageSchema = z.object({
//   role: z.enum(['user', 'model']),
//   content: z.array(ContentPartSchema),
// });

// // The request body for the flow
// const CopilotRequestBodySchema = z.object({
//   history: z.array(MessageSchema),
//   prompt: z.string(),
// });
// export type CopilotRequestBody = z.infer<typeof CopilotRequestBodySchema>;

// // The response message from the flow
// const CopilotResponseMessageSchema = MessageSchema;
// export type CopilotResponseMessage = z.infer<typeof CopilotResponseMessageSchema>;

// // Helper function to convert Genkit content to our schema
// function convertToOurContent(genkitContent: any[]): Array<{ text: string } | { product: any }> {
//   return genkitContent.map(part => {
//     // Handle text content
//     if (part.text) {
//       return { text: part.text };
//     }
//     // Handle product content (if present in Genkit response)
//     if (part.product) {
//       return { product: part.product };
//     }
//     // Handle tool responses or other content by converting to text
//     if (part.toolResponse) {
//       return { text: `Tool response: ${JSON.stringify(part.toolResponse)}` };
//     }
//     if (part.toolRequest) {
//       return { text: `Tool request: ${JSON.stringify(part.toolRequest)}` };
//     }
//     // Fallback: convert any other content to text
//     return { text: JSON.stringify(part) };
//   });
// }

// // Helper function to convert our content to Genkit format
// function convertToGenkitContent(ourContent: Array<{ text: string } | { product: any }>): any[] {
//   return ourContent.map(part => {
//     if ('text' in part) {
//       return { text: part.text };
//     }
//     if ('product' in part) {
//       return { product: part.product };
//     }
//     return { text: JSON.stringify(part) };
//   });
// }

// // Logging utility
// class SoftwareCopilotLogger {
//   private static formatLog(level: string, message: string, data?: any): string {
//     const timestamp = new Date().toISOString();
//     const dataStr = data ? ` | data: ${JSON.stringify(data, null, 2)}` : '';
//     return `[${timestamp}] [${level}] [softwareCopilotFlow] ${message}${dataStr}`;
//   }

//   static info(message: string, data?: any): void {
//     console.log(this.formatLog('INFO', message, data));
//   }

//   static error(message: string, error?: any): void {
//     console.error(this.formatLog('ERROR', message, error));
//   }

//   static warn(message: string, data?: any): void {
//     console.warn(this.formatLog('WARN', message, data));
//   }

//   static debug(message: string, data?: any): void {
//     if (process.env.NODE_ENV === 'development') {
//       console.debug(this.formatLog('DEBUG', message, data));
//     }
//   }
// }

// // Define the main Genkit flow
// export const softwareCopilotFlow = ai.defineFlow(
//   {
//     name: 'softwareCopilotFlow',
//     inputSchema: CopilotRequestBodySchema,
//     outputSchema: CopilotResponseMessageSchema,
//   },
//   async (body) => {
//     const requestId = Math.random().toString(36).substring(2, 9);
    
//     SoftwareCopilotLogger.info(`Starting flow execution`, { 
//       requestId, 
//       promptLength: body.prompt?.length,
//       historyLength: body.history?.length 
//     });

//     try {
//       // Input validation
//       if (!body.prompt || typeof body.prompt !== 'string') {
//         throw new Error('Invalid prompt: prompt must be a non-empty string');
//       }

//       if (!Array.isArray(body.history)) {
//         throw new Error('Invalid history: history must be an array');
//       }

//       SoftwareCopilotLogger.debug('Input validation passed', { requestId });

//       // Convert history to Genkit message format
//       const messages = body.history.map(msg => ({
//         role: msg.role,
//         content: convertToGenkitContent(msg.content)
//       }));

//       // Add the new user prompt
//       messages.push({
//         role: 'user',
//         content: [{ text: body.prompt }]
//       });

//       SoftwareCopilotLogger.debug('Constructed messages for LLM', {
//         requestId,
//         totalMessages: messages.length,
//         lastMessageType: 'user'
//       });

//       // Generate the response using the correct Genkit API format
//       SoftwareCopilotLogger.info('Calling AI generate', { requestId });
      
//       const generateStartTime = Date.now();
//       const result = await ai.generate({
//        system: `You are an expert AI assistant for 'sixstars', a software marketplace. Your goal is to help users find perfect software solutions.

// IMPORTANT INSTRUCTIONS:
// - ALWAYS use the searchSoftware tool to find products from our live database
// - When you find relevant products, use the 'product' content type to display them
// - Provide informative comparisons when multiple products are found
// - Give specific recommendations based on user needs
// - Explain why you're recommending certain products
// - Be helpful, knowledgeable, and concise

// RESPONSE STRUCTURE:
// 1. Start with a brief summary of what you found
// 2. Compare products when multiple are relevant (highlight key differences)
// 3. Provide clear recommendations with justifications
// 4. Use product cards for each recommended software
// 5. End with helpful next steps or questions

// Always base your answers on actual product data from our database.`,
//         messages: messages,
//         tools: [searchSoftware],
//         output: {
//           format: 'json',
//           schema: z.object({
//             response: z.array(z.union([
//               z.object({ text: z.string() }),
//               z.object({ product: softwareProductSchema })
//             ]))
//           }),
//         },
//       });
//       const generateEndTime = Date.now();

//       SoftwareCopilotLogger.info('AI generate completed', {
//         requestId,
//         duration: `${generateEndTime - generateStartTime}ms`,
//         hasOutput: !!result.text
//       });

//       if (!result.text && !result.output) {
//         SoftwareCopilotLogger.error('AI model returned no output', { requestId });
//         throw new Error("The AI model did not return a response.");
//       }

//       let output: CopilotResponseMessage;
      
//       if (result.output) {
//         // Handle structured output
//         const responseData = result.output as { response: Array<{ text: string } | { product: any }> };
//         output = {
//           role: 'model',
//           content: responseData.response
//         };
//       } else if (result.message) {
//         // Handle message format
//         output = {
//           role: 'model',
//           content: convertToOurContent(result.message.content)
//         };
//       } else {
//         // Handle text-only response
//         output = {
//           role: 'model',
//           content: [{ text: result.text || 'No response generated' }]
//         };
//       }

//       SoftwareCopilotLogger.debug('Generated response content', {
//         requestId,
//         responseRole: output.role,
//         contentParts: output.content.length,
//         hasProducts: output.content.some(part => 'product' in part)
//       });

//       SoftwareCopilotLogger.info('Flow execution completed successfully', {
//         requestId,
//         responseSummary: `Generated response with ${output.content.length} content parts`
//       });

//       return output;

//     } catch (error) {
//       SoftwareCopilotLogger.error('Flow execution failed', {
//         requestId,
//         error: error instanceof Error ? error.message : 'Unknown error',
//         stack: error instanceof Error ? error.stack : undefined
//       });

//       // Re-throw the error with additional context
//       const enhancedError = new Error(
//         `Software copilot flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
//       );
//       if (error instanceof Error && error.stack) {
//         enhancedError.stack = error.stack;
//       }
//       throw enhancedError;
//     }
//   }
// );
