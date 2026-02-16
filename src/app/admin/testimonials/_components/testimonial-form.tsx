
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Testimonial } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const testimonialFormSchema = z.object({
  authorName: z.string().min(2, 'Author name is required'),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
  authorAvatarUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  content: z.string().min(10, 'Content must be at least 10 characters.'),
  category: z.string().min(2, 'Category is required.'),
  status: z.enum(['Pending', 'Approved', 'Rejected']),
});

export function TestimonialForm({
  testimonial,
  onFormSubmit,
}: {
  testimonial?: Testimonial | null;
  onFormSubmit: () => void;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!testimonial;

  const form = useForm<z.infer<typeof testimonialFormSchema>>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      authorName: '',
      authorTitle: '',
      authorCompany: '',
      authorAvatarUrl: '',
      content: '',
      category: 'sales',
      status: 'Pending',
    },
  });

  useEffect(() => {
    if (testimonial) {
      form.reset(testimonial);
    } else {
      form.reset({
        authorName: '',
        authorTitle: '',
        authorCompany: '',
        authorAvatarUrl: '',
        content: '',
        category: 'sales',
        status: 'Pending',
      });
    }
  }, [testimonial, form]);

  async function onSubmit(values: z.infer<typeof testimonialFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && testimonial) {
        const testimonialRef = doc(firestore, 'testimonials', testimonial.id);
        await updateDoc(testimonialRef, values);
        toast({ title: 'Testimonial Updated' });
      } else {
        const newTestimonialRef = doc(collection(firestore, 'testimonials'));
        const newTestimonialData = { 
            id: newTestimonialRef.id, 
            ...values,
            // Generate a placeholder avatar if none is provided
            authorAvatarUrl: values.authorAvatarUrl || `https://picsum.photos/seed/${values.authorName.replace(/\s/g, '')}/100/100`,
            createdAt: new Date().toISOString(),
        };
        await setDoc(newTestimonialRef, newTestimonialData);
        toast({ title: 'Testimonial Created' });
      }
      onFormSubmit();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to save testimonial data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? 'Edit Testimonial' : 'Add New Testimonial'}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? 'Update the details for this testimonial.'
              : 'Fill out the form to create a new testimonial.'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
            <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Author Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="authorTitle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Author Title</FormLabel>
                        <FormControl>
                            <Input placeholder="CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="authorCompany"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Author Company</FormLabel>
                        <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="authorAvatarUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Author Avatar URL</FormLabel>
                    <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                        <Textarea placeholder="This software is amazing..." className="min-h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. sales" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

        </div>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Testimonial'}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
