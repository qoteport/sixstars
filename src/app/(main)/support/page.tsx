
'use client';
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import { Loader2, CheckCircle } from "lucide-react";

const faqs = [
    {
        question: "How do I purchase or use a software?",
        answer: "You have a couple of options. You can either use the 'Talk to Sales' or 'Get Support' forms on our website to have one of our experts call you back, or you can navigate to the software's detail page and find a link to the provider's website to continue your purchase or trial from there."
    },
    {
        question: "Can I list my own software on your platform?",
        answer: "Yes! We are always looking for new software partners. Please visit our Partner Onboarding page to register your business and submit your products for review. We'll guide you through the process of getting your software listed in our portfolio."
    },
    {
        question: "How does the Needs Analyzer work?",
        answer: "Our AI-powered Needs Analyzer takes your natural language description of your requirements and compares it against our extensive database of software products. It identifies the best matches based on features, pricing, and integrations, providing you with a curated list of recommendations."
    },
    {
        question: "What kind of support can I expect after purchase?",
        answer: "We offer comprehensive support packages including installation assistance, team training sessions, and ongoing technical support. Our admin team interface allows for direct communication to resolve any issues you may encounter."
    },
    {
        question: "How is my customer data managed?",
        answer: "We take data privacy seriously. Your user profile stores your preferences and interaction history securely. This allows us to provide personalized recommendations and support while ensuring your data is protected. You can manage your data at any time in your account settings."
    }
];

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  companySize: z.string().optional(),
  inquiryType: z.string({ required_error: "Please select an inquiry type."}),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const { firestore } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      companySize: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
    const inquiriesCol = collection(firestore, 'inquiries');
    try {
      await addDocumentNonBlocking(inquiriesCol, {
        ...values,
        createdAt: new Date().toISOString(),
        status: 'New',
      });
      setIsSubmitSuccessful(true);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      // You would typically show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter font-headline sm:text-5xl">Reach out to Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          We're here to help. Find answers to common questions or get in touch with our support team.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-6 text-2xl font-bold font-headline">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i + 1}`}>
                <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="lg:col-span-2">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Can't find an answer? Fill out the form below and we'll get back to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitSuccessful ? (
                  <div className="text-center py-10">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Message Sent!</h3>
                    <p className="text-muted-foreground mt-2">Thank you for reaching out. Our team will get back to you shortly.</p>
                  </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-1000">201-1000 employees</SelectItem>
                              <SelectItem value="1000+">1000+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inquiryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inquiry Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sales">Sales Inquiry</SelectItem>
                              <SelectItem value="support">Technical Support</SelectItem>
                              <SelectItem value="installation">Installation Help</SelectItem>
                              <SelectItem value="billing">Billing Question</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please describe your issue..." className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Message
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
