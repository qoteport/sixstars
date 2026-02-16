
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Testimonial } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TestimonialCard } from '@/components/testimonial-card';

const salesInquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  company: z.string().min(2, 'Company name is required'),
  productInterest: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});


export default function SalesPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  
  const inquiryForm = useForm<z.infer<typeof salesInquirySchema>>({
    resolver: zodResolver(salesInquirySchema),
    defaultValues: { name: '', email: '', company: '', productInterest: '', message: '' },
  });
  
  const testimonialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'testimonials'), 
        where('category', '==', 'sales'), 
        where('status', '==', 'Approved')
    );
  }, [firestore]);

  const { data: testimonials, isLoading: testimonialsLoading } = useCollection<Testimonial>(testimonialsQuery);


  async function onInquirySubmit(values: z.infer<typeof salesInquirySchema>) {
    if (!firestore) return;
    setIsSubmittingInquiry(true);
    try {
      await addDoc(collection(firestore, 'salesInquiries'), {
        ...values,
        createdAt: new Date().toISOString(),
        status: 'New',
      });
      setIsInquirySubmitted(true);
    } catch (error) {
      console.error('Error submitting sales inquiry:', error);
      toast({ variant: 'destructive', title: 'Failed to send message.' });
    } finally {
      setIsSubmittingInquiry(false);
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12 lg:mb-16">
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">Talk to Sales</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Let's talk about how our software can solve your problems. Fill out the form and we'll be in touch.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 lg:gap-16 items-start">
        <div className="space-y-8 mb-12 lg:mb-0">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tighter">What Our Customers Say</h2>
            <p className="mx-auto mt-2 max-w-2xl text-md text-muted-foreground lg:mx-0">
              Real stories from businesses that trust our solutions.
            </p>
          </div>
          <ScrollArea className="lg:h-[650px] lg:pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                {testimonialsLoading && [...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-20 w-full mb-4" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {testimonials?.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
            </div>
          </ScrollArea>
      </div>

        <div className="w-full">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle>Contact Our Sales Team</CardTitle>
              <CardDescription>
                We're ready to help you find the perfect solution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isInquirySubmitted ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">Thank You!</h3>
                  <p className="text-muted-foreground mt-2">A sales representative will contact you shortly.</p>
                </div>
              ) : (
                <Form {...inquiryForm}>
                  <form onSubmit={inquiryForm.handleSubmit(onInquirySubmit)} className="space-y-4">
                    <FormField control={inquiryForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Work Email</FormLabel><FormControl><Input type="email" placeholder="jane.doe@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="company" render={({ field }) => (
                      <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Acme Corporation" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="productInterest" render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product of Interest <span className="text-xs text-muted-foreground">(Optional)</span>
                        </FormLabel>
                        <FormControl><Input placeholder="e.g., ConnectSphere" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="message" render={({ field }) => (
                      <FormItem><FormLabel>How can we help?</FormLabel><FormControl><Textarea placeholder="Tell us about your needs..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isSubmittingInquiry}>
                      {isSubmittingInquiry && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Request
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
