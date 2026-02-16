
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
import type { Customer } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const customerFormSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('A valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  status: z.enum(['Lead', 'Active', 'On Hold', 'Churned']),
  notes: z.string().optional(),
});

export function CustomerForm({
  customer,
  onFormSubmit,
}: {
  customer: Customer | null;
  onFormSubmit: (customer?: Customer) => void;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!customer;

  const form = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      website: '',
      logoUrl: '',
      status: 'Lead',
      notes: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset(customer);
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        website: '',
        logoUrl: '',
        status: 'Lead',
        notes: '',
      });
    }
  }, [customer, form]);

  async function onSubmit(values: z.infer<typeof customerFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && customer) {
        const customerRef = doc(firestore, 'customers', customer.id);
        const updatedData = { ...customer, ...values };
        await updateDoc(customerRef, values);
        toast({ title: 'Customer Updated' });
        onFormSubmit(updatedData);
      } else {
        const newCustomerRef = doc(collection(firestore, 'customers'));
        const now = new Date().toISOString();
        const newCustomerData = { 
            id: newCustomerRef.id, 
            ...values,
            createdAt: now,
            lastContacted: now,
        };
        await setDoc(newCustomerRef, newCustomerData);
        toast({ title: 'Customer Created' });
        onFormSubmit(newCustomerData);
      }
      
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to save customer data.',
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
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? 'Update the details for this customer.'
              : 'Fill out the form to create a new customer.'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
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
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
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
                <FormLabel>Phone</FormLabel>
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://acme.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://acme.com/logo.png" {...field} />
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
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Initial contact notes, customer preferences, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Customer'}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
