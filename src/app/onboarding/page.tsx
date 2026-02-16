'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Hexagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { paths } from '@/lib/paths';
import Link from 'next/link';

const onboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  role: z.enum(['buyer', 'seller'], {
    required_error: 'You need to select a role.',
  }),
});

export default function OnboardingPage() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Add the form initialization here
  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
    },
  });

  useEffect(() => {
    // If user auth state is still loading, do nothing.
    if (isUserLoading) {
      return;
    }

    // If user is not logged in, redirect to login page.
    if (!user) {
      router.push(paths.login);
      return;
    }
    
    // If user and firestore are available, check for an existing profile.
    if (user && firestore) {
      const userProfileRef = doc(firestore, 'users', user.uid);
      getDoc(userProfileRef).then((docSnap) => {
        if (docSnap.exists()) {
          // Profile already exists, user doesn't need to be here.
          router.push(paths.account);
        } else {
          // No profile found, it's safe to show the onboarding form.
          setIsCheckingProfile(false);
        }
      });
    }
  }, [user, isUserLoading, firestore, router]);

  const onSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    if (!firestore || !user) return;

    setIsSubmitting(true);
    const userProfileRef = doc(firestore, 'users', user.uid);

    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        role: values.role,
        createdAt: new Date().toISOString(),
        isAdmin: false, // Default to not admin
      };

      await setDoc(userProfileRef, userProfile);
      toast({ title: 'Profile created!', description: 'Welcome to sixstars.' });
      router.push(paths.account);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Something went wrong', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="absolute top-8 left-8">
        <Link href={paths.home} className="flex items-center space-x-2">
          <Hexagon className="h-6 w-6 text-primary" />
          <span className="font-bold">sixstars</span>
        </Link>
      </div>

      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">Welcome to sixstars!</CardTitle>
          <CardDescription>Let's get your profile set up. Just a few more details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select your account type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[:checked]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="buyer" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            I want to find software solutions for my business.
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[:checked]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="seller" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            I want to sell software on the platform.
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
