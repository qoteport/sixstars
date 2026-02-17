
'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Building, Zap, Users, Loader2, CheckCircle, ArrowRight, X, UserCircle2 } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Separator } from "@/components/ui/separator";
import type { Partner, SoftwareProduct, SoftwareCategory } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/lib/paths";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }),
  logoUrl: z.string().url({ message: "Please enter a valid URL for your logo." }).optional().or(z.literal('')),
  companyDescription: z.string().min(20, { message: "Description must be at least 20 characters."}),
  productName: z.string().min(2, { message: "Product name is required."}),
  productDescription: z.string().min(20, { message: "Description must be at least 20 characters."}),
  productCategory: z.string({ required_error: "Please select a category." }),
  productUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  pricingModel: z.string().min(2, { message: "Pricing model is required."}),
});

export default function PartnerRegisterPage() {
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { firestore, storage } = useFirebase();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partners'), where('status', '==', 'Published')) : null, [firestore]);
  const { data: partners, isLoading: partnersLoading } = useCollection<Partner>(partnersQuery);
  
  const softwareProductsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'softwareProducts'), where('status', '==', 'Published')) : null, [firestore]);
  const { data: softwareProducts } = useCollection<SoftwareProduct>(softwareProductsQuery);

  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'softwareCategories') : null, [firestore]);
  const { data: categories } = useCollection<SoftwareCategory>(categoriesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactEmail: user?.email || "",
      websiteUrl: "",
      logoUrl: "",
      companyDescription: "",
      productName: "",
      productDescription: "",
      productCategory: "",
      productUrl: "",
      pricingModel: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !storage) return;

    setIsSubmitting(true);
    setUploadProgress(null);
    
    let finalLogoUrl = values.logoUrl;

    if (imageFile) {
        const storageRef = ref(storage, `partner-logos/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        try {
            finalLogoUrl = await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error("Upload failed:", error);
            toast({
                variant: "destructive",
                title: "Image Upload Failed",
                description: "There was an issue uploading your logo. Please try again.",
            });
            setIsSubmitting(false);
            return;
        }
    }

    if (!finalLogoUrl) {
      toast({
          variant: "destructive",
          title: "Logo Required",
          description: "Please provide a logo URL or upload a logo image.",
      });
      setIsSubmitting(false);
      return;
    }
    
    const batch = writeBatch(firestore);
    
    try {
      // 1. Create Partner Document
      const partnerDocRef = doc(collection(firestore, 'partners'));
      batch.set(partnerDocRef, {
        id: partnerDocRef.id,
        companyName: values.companyName,
        contactEmail: values.contactEmail,
        websiteUrl: values.websiteUrl,
        logoUrl: finalLogoUrl,
        companyDescription: values.companyDescription,
        status: 'Draft', // Applications start as drafts
        createdAt: new Date().toISOString(),
      });
      
      // 2. Create Software Product Document
      const softwareProductDocRef = doc(collection(firestore, 'softwareProducts'));
      batch.set(softwareProductDocRef, {
        id: softwareProductDocRef.id,
        partnerId: partnerDocRef.id, // Link to the new partner
        name: values.productName,
        description: values.productDescription,
        details: values.productDescription, // Use short description as details for now
        category: values.productCategory,
        model: values.pricingModel,
        productUrl: values.productUrl || '',
        status: 'Draft',
        // Default values for a new product
        imageUrl: 'https://picsum.photos/seed/new-software/600/400',
        imageHint: 'software product',
        rating: 0,
        reviewCount: 0,
        clicks: 0,
        features: [],
        isFeatured: false,
        createdAt: new Date().toISOString(),
      });

      // 3. Commit the batch
      await batch.commit();
      
      setIsSubmitSuccessful(true);
    } catch(error) {
       console.error("Error submitting partner application:", error);
       toast({
           variant: "destructive",
           title: "Submission Failed",
           description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
       });
    } finally {
       setIsSubmitting(false);
       setUploadProgress(null);
       setImageFile(null);
    }
  }

  const getPartnerSoftware = (partnerId: string) => {
    return softwareProducts?.filter(p => p.partnerId === partnerId) || [];
  }

  return (
    <>
       <section className="container mx-auto py-12 lg:py-20 text-center px-4 md:px-6">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl">Partner with sixstars</h1>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-muted-foreground">
              Join our ecosystem of innovators. Showcase your software to a motivated audience and accelerate your growth.
            </p>
        </section>

      <section className="bg-secondary/50 py-12 lg:py-20">
        <div className="container mx-auto px-4 md:px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">Trusted by Industry Leaders</h2>
             <div className="flex flex-wrap items-start justify-center gap-x-12 gap-y-10">
              {partnersLoading && [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-36" />)}
              {partners?.map((partner) => (
                <button 
                  key={partner.id} 
                  onClick={() => setSelectedPartner(partner)} 
                  className="flex flex-col items-center gap-3 w-36 group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2"
                >
                  <div className="relative h-16 w-full">
                     <Image 
                      src={partner.logoUrl} 
                      alt={`${partner.companyName} Logo`}
                      fill
                      className="object-contain grayscale group-hover:grayscale-0 group-focus:grayscale-0 transition-all"
                      />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{partner.companyName}</span>
                </button>
              ))}
            </div>
        </div>
      </section>

       <section className="container mx-auto py-12 lg:py-20 px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Why Partner With Us?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Becoming a sixstars partner means more than just listing your product. It's about joining a community dedicated to mutual success.
            </p>
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Reach a Qualified Audience</h3>
                  <p className="text-muted-foreground">Connect with thousands of businesses actively searching for software solutions like yours.</p>
                </div>
              </div>
               <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Streamline Your Sales Cycle</h3>
                  <p className="text-muted-foreground">Get high-intent leads delivered directly to your sales team through our platform.</p>
                </div>
              </div>
               <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Gain Market Insights</h3>
                  <p className="text-muted-foreground">Leverage our data to understand customer needs and market trends better.</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="w-full max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Let's Get Started</CardTitle>
              </div>
              <CardDescription>
                Fill out the form below to begin the partnership process. Our team will review your application and be in touch shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUserLoading && <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>}
              {!isUserLoading && !user && (
                <div className="text-center py-10">
                    <UserCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold">Please Sign In</h3>
                    <p className="text-muted-foreground mt-2 mb-6">You need an account to apply as a partner.</p>
                    <Button asChild>
                        <Link href={paths.login}>Sign In or Create Account</Link>
                    </Button>
                </div>
              )}
             {!isUserLoading && user && isSubmitSuccessful ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">Application Submitted!</h3>
                  <p className="text-muted-foreground mt-2">Thank you. Our team will review your submission and get back to you soon.</p>
                </div>
              ) : (
                !isUserLoading && user && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="logoUrl" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Company Logo URL</FormLabel>
                          <FormControl><Input {...field} placeholder="https://... Paste a URL" disabled={!!imageFile} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />

                    <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div></div>

                    <div>
                      <Label htmlFor="logo-upload-public">Upload a Logo</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <FormControl>
                          <Input id="logo-upload-public" type="file" accept="image/*" className="flex-1" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setImageFile(file);
                            if (file) form.setValue('logoUrl', '');
                          }} />
                        </FormControl>
                        {imageFile && <Button variant="ghost" size="icon" onClick={() => {
                          setImageFile(null);
                          const fileInput = document.getElementById('logo-upload-public') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}><X className="h-4 w-4" /></Button>}
                      </div>
                      {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
                    </div>
                     <FormField
                      control={form.control}
                      name="companyDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description</FormLabel>
                          <FormControl>
                             <Textarea placeholder="Tell us about your company..." {...field} className="min-h-24"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Separator className="my-4" />
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Software Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Awesome App" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Software Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe what your software does..." {...field} className="min-h-24"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="productCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories?.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                      control={form.control}
                      name="productUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Software Website URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://yourcompany.com/product" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                       <FormField
                        control={form.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Subscription, One-time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </form>
                </Form>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <SheetContent className="sm:max-w-lg p-0">
          {selectedPartner && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b">
                 <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image src={selectedPartner.logoUrl} alt={`${selectedPartner.companyName} logo`} fill className="object-contain"/>
                    </div>
                    <div>
                        <SheetTitle className="text-2xl">{selectedPartner.companyName}</SheetTitle>
                        <SheetDescription className="text-base mt-1">
                          <a href={selectedPartner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(selectedPartner.websiteUrl).hostname}</a>
                        </SheetDescription>
                    </div>
                </div>
              </SheetHeader>
              <ScrollArea className="flex-grow">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">About</h3>
                        <p className="text-muted-foreground">{selectedPartner.companyDescription}</p>
                    </div>

                     <div>
                        <h3 className="font-semibold text-lg mb-4">Software on sixstars</h3>
                         <div className="space-y-4">
                            {getPartnerSoftware(selectedPartner.id).map(product => (
                                <Link key={product.id} href={paths.software(product.id)} className="group block">
                                <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                                    <div className="flex items-start gap-4 p-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-base">{product.name}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                                        </div>
                                        <div className="self-center">
                                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1"/>
                                        </div>
                                    </div>
                                </Card>
                                </Link>
                            ))}
                            {getPartnerSoftware(selectedPartner.id).length === 0 && (
                                <p className="text-muted-foreground text-sm text-center py-4">No software from this partner is currently listed.</p>
                            )}
                         </div>
                    </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
