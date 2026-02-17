
'use client';
import { useState, useMemo, useEffect, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Star, Edit, Trash, CheckCircle, Loader2, DollarSign, X, Upload } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { SoftwareProduct, Partner, PricingTier, SoftwareCategory } from '@/lib/types';
import { collection, deleteDoc, doc, updateDoc, setDoc, writeBatch, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const softwareFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description is required'),
  details: z.string().min(20, 'Details are required'),
  imageUrl: z.string().url('A valid image URL is required').optional().or(z.literal('')),
  productUrl: z.string().url('A valid product URL is required').optional().or(z.literal('')),
  imageHint: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  model: z.string().min(2, 'Sales model is required'),
  status: z.enum(['Published', 'Draft']),
  isFeatured: z.boolean().default(false),
  features: z.array(z.string()).optional(),
});


function SoftwareForm({ product, categories, onComplete }: { product?: SoftwareProduct, categories: SoftwareCategory[], onComplete: () => void }) {
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const form = useForm<z.infer<typeof softwareFormSchema>>({
    resolver: zodResolver(softwareFormSchema),
    defaultValues: product || {
        name: '',
        description: '',
        details: '',
        imageUrl: '',
        productUrl: '',
        imageHint: '',
        category: '',
        model: 'Subscription',
        status: 'Draft',
        isFeatured: false,
        features: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });
  const [newFeature, setNewFeature] = useState("");


  useEffect(() => {
    form.reset(product || {
        name: '',
        description: '',
        details: '',
        imageUrl: '',
        productUrl: '',
        imageHint: '',
        category: '',
        model: 'Subscription',
        status: 'Draft',
        isFeatured: false,
        features: [],
    });
    setImageFile(null);
    setUploadProgress(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [product, form]);

  async function onSubmit(values: z.infer<typeof softwareFormSchema>) {
    if (!firestore || !storage) return;
    setIsSubmitting(true);
    setUploadProgress(null);

    let finalImageUrl = values.imageUrl;

    if (imageFile) {
        const storageRef = ref(storage, `software-images/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        try {
            finalImageUrl = await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Image upload failed.' });
            setIsSubmitting(false);
            return;
        }
    }


    if (!finalImageUrl) {
        toast({ variant: 'destructive', title: 'Image URL is required.', description: 'Please provide a URL or upload an image.' });
        setIsSubmitting(false);
        return;
    }

    try {
      const dataToSave = {
        ...values,
        imageUrl: finalImageUrl,
      };

      if (product) {
        // Update existing product
        const productRef = doc(firestore, 'softwareProducts', product.id);
        await updateDoc(productRef, dataToSave);
        toast({ title: 'Software updated successfully!' });
      } else {
        // Create new product
        const newProductRef = doc(collection(firestore, 'softwareProducts'));
        const newProductData = {
          ...dataToSave,
          id: newProductRef.id,
          rating: 0,
          reviewCount: 0,
          clicks: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(newProductRef, newProductData);
        toast({ title: 'Software added successfully!' });
      }
      onComplete();
    } catch (error) {
      console.error('Error saving software:', error);
      toast({ variant: 'destructive', title: 'Failed to save software.' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
      setImageFile(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col bg-card">
        <SheetHeader className="p-6">
          <SheetTitle>{product ? 'Edit Software' : 'Add New Software'}</SheetTitle>
          <SheetDescription>
            Fill out the details below. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
           <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="details" render={({ field }) => (
                <FormItem><FormLabel>Detailed Description</FormLabel><FormControl><Textarea {...field} className="min-h-32" /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="https://... Paste a URL" disabled={!!imageFile} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <div>
                <FormLabel>Upload an Image</FormLabel>
                <div className="mt-2 flex items-center gap-4">
                    <FormControl>
                        <Input 
                            id="image-upload"
                            type="file" 
                            accept="image/*"
                            className="flex-1"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setImageFile(file);
                                if (file) {
                                    form.setValue('imageUrl', ''); // Clear URL if file is chosen
                                }
                            }} 
                        />
                    </FormControl>
                    {imageFile && (
                        <Button variant="ghost" size="icon" onClick={() => {
                            setImageFile(null);
                            const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                        }}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
            </div>

            <FormField control={form.control} name="productUrl" render={({ field }) => (
                <FormItem><FormLabel>Product Website URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="imageHint" render={({ field }) => (
                <FormItem><FormLabel>Image Hint</FormLabel><FormControl><Input {...field} placeholder="e.g. technology abstract" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem><FormLabel>Sales Model</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a model" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Subscription">Subscription</SelectItem>
                        <SelectItem value="Freemium">Freemium</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage /></FormItem>
            )} />
             <div>
              <Label>Key Features</Label>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input {...form.register(`features.${index}` as const)} className="flex-1"/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                 <div className="flex items-center gap-2">
                   <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="New feature..."/>
                    <Button type="button" onClick={() => { append(newFeature); setNewFeature(""); }}>
                      Add Feature
                    </Button>
                 </div>
              </div>
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormMessage/>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
        </div>
        <SheetFooter className="p-6 mt-auto">
          <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </form>
    </Form>
  )
}

const pricingTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Tier name is required"),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Price must be a positive number")
  ),
  frequency: z.string().min(2, "Frequency is required (e.g., /month)"),
  features: z.array(z.string().min(1, "Feature cannot be empty")).min(1, "At least one feature is required"),
});


function PricingForm({ product, onComplete }: { product: SoftwareProduct, onComplete: () => void }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);

  const form = useForm<z.infer<typeof pricingTierSchema>>({
    resolver: zodResolver(pricingTierSchema),
    defaultValues: { name: "", price: 0, frequency: "/month", features: [""] }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "features"
  });

  const tiersCollectionRef = useMemo(() => firestore ? collection(firestore, 'softwareProducts', product.id, 'pricingTiers') : null, [firestore, product.id]);

  useEffect(() => {
    async function fetchTiers() {
      if (!tiersCollectionRef) return;
      setIsLoading(true);
      const querySnapshot = await getDocs(tiersCollectionRef);
      const tiers = querySnapshot.docs.map(doc => doc.data() as PricingTier);
      setPricingTiers(tiers);
      setIsLoading(false);
    }
    fetchTiers();
  }, [tiersCollectionRef]);

  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier);
    form.reset({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      frequency: tier.frequency,
      features: tier.features,
    });
  }

  const handleCancelEdit = () => {
    setEditingTier(null);
    form.reset({ name: "", price: 0, frequency: "/month", features: [""] });
  }

  async function onSubmit(values: z.infer<typeof pricingTierSchema>) {
    if (!tiersCollectionRef) return;
    setIsSubmitting(true);

    try {
      if (editingTier) {
        // Update
        const tierRef = doc(tiersCollectionRef, editingTier.id);
        await updateDoc(tierRef, values);
        setPricingTiers(tiers => tiers.map(t => t.id === editingTier.id ? { ...t, ...values } : t));
        toast({ title: "Pricing tier updated!" });
      } else {
        // Create
        const newTierRef = doc(tiersCollectionRef);
        const newTier = { ...values, id: newTierRef.id };
        await setDoc(newTierRef, newTier);
        setPricingTiers(tiers => [...tiers, newTier]);
        toast({ title: "Pricing tier added!" });
      }
      handleCancelEdit();
    } catch (error) {
      console.error("Error saving pricing tier:", error);
      toast({ variant: 'destructive', title: "Failed to save pricing tier." });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDelete(tierId: string) {
      if (!tiersCollectionRef || !confirm("Are you sure?")) return;
      
      try {
        await deleteDoc(doc(tiersCollectionRef, tierId));
        setPricingTiers(tiers => tiers.filter(t => t.id !== tierId));
        toast({ title: "Tier deleted" });
      } catch (error) {
        toast({ variant: 'destructive', title: "Failed to delete tier." });
      }
  }

  return (
    <div className="h-full flex flex-col bg-card">
       <SheetHeader className="p-6">
          <SheetTitle>Manage Pricing for {product.name}</SheetTitle>
          <SheetDescription>
            Add, edit, or remove pricing tiers for this software.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Current Tiers</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {isLoading && <Skeleton className="h-10 w-full" />}
                    {pricingTiers.map(tier => (
                        <div key={tier.id} className="flex justify-between items-center p-2 rounded-md border">
                            <div>
                               <p className="font-semibold">{tier.name} - ${tier.price}{tier.frequency}</p>
                               <p className="text-xs text-muted-foreground">{tier.features.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tier)}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tier.id)}>
                                    <Trash className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                    {!isLoading && pricingTiers.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No pricing tiers yet.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{editingTier ? "Edit Tier" : "Add New Tier"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Tier Name</FormLabel><FormControl><Input placeholder="e.g., Basic" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" placeholder="29" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="frequency" render={({ field }) => (
                                    <FormItem><FormLabel>Frequency</FormLabel><FormControl><Input placeholder="/month" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                             </div>
                             <div>
                                 <Label>Features</Label>
                                 <div className="space-y-2 mt-2">
                                     {fields.map((item, index) => (
                                         <div key={item.id} className="flex items-center gap-2">
                                             <Input {...form.register(`features.${index}` as const)} />
                                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
                                         </div>
                                     ))}
                                     <Button type="button" size="sm" variant="outline" onClick={() => append("")}>Add Feature</Button>
                                 </div>
                                 <FormMessage>{form.formState.errors.features?.root?.message}</FormMessage>
                             </div>
                             <div className="flex justify-end gap-2 pt-4">
                                {editingTier && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
                                <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                  {editingTier ? 'Save Changes' : 'Add Tier'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>

        <SheetFooter className="p-6 mt-auto">
          <SheetClose asChild><Button variant="outline" onClick={onComplete}>Done</Button></SheetClose>
        </SheetFooter>
    </div>
  );
}

export default function SoftwareAdminPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [sheetState, setSheetState] = useState<{ open: boolean, product?: SoftwareProduct, view: 'edit' | 'pricing' }>({ open: false, view: 'edit' });

  const softwareProductsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'softwareProducts') : null),
    [firestore]
  );
  const { data: products, isLoading: productsLoading } = useCollection<SoftwareProduct>(softwareProductsQuery);

  const partnersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'partners') : null),
    [firestore]
  );
  const { data: partners, isLoading: partnersLoading } = useCollection<Partner>(partnersQuery);
  
  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'softwareCategories') : null),
    [firestore]
  );
  const { data: categories, isLoading: categoriesLoading } = useCollection<SoftwareCategory>(categoriesQuery);

  const partnersMap = useMemo(() => {
    if (!partners) return new Map();
    return new Map(partners.map(p => [p.id, p.companyName]));
  }, [partners]);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this product? This will also delete all associated pricing and reviews.')) {
        const batch = writeBatch(firestore);
        
        const productRef = doc(firestore, 'softwareProducts', id);
        batch.delete(productRef);
        
        await batch.commit();
        toast({ title: "Software Deleted" });
    }
  };

  const handleStatusChange = async (id: string, status: SoftwareProduct['status']) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'softwareProducts', id);
    await updateDoc(productRef, { status });
    toast({ title: `Status changed to ${status}` });
  };
  
  const handleFeatureToggle = async (id: string, isFeatured: boolean) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'softwareProducts', id);
    await updateDoc(productRef, { isFeatured: !isFeatured });
    toast({ title: `Featured status updated!` });
  }

  const handleOpenSheet = (view: 'edit' | 'pricing', product?: SoftwareProduct) => {
    setSheetState({ open: true, product, view });
  }

  const handleCloseSheet = () => {
    setSheetState({ open: false, product: undefined, view: 'edit' });
  }

  const isLoading = productsLoading || partnersLoading || categoriesLoading;

  return (
    <Fragment>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Manage Software
          </h1>
          <p className="text-muted-foreground">
            Add, edit, or remove software products from the platform.
          </p>
        </div>
        <Button onClick={() => handleOpenSheet('edit')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Software
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Software Products</CardTitle>
          <CardDescription>
            A list of all software products in your catalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-10 w-10 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                     <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                       <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.imageUrl}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'Published' ? 'default' : 'secondary'}>
                        {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.partnerId ? partnersMap.get(product.partnerId) || 'N/A' : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.model}</Badge>
                  </TableCell>
                   <TableCell>
                    {product.clicks || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleOpenSheet('edit', product)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit Software
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleOpenSheet('pricing', product)}>
                            <DollarSign className="mr-2 h-4 w-4"/> Manage Pricing
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleFeatureToggle(product.id, !!product.isFeatured)}>
                            <Star className="mr-2 h-4 w-4"/> {product.isFeatured ? 'Un-feature' : 'Feature'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.status !== 'Published' && (
                            <DropdownMenuItem onSelect={() => handleStatusChange(product.id, 'Published')}>
                                Publish
                            </DropdownMenuItem>
                        )}
                        {product.status === 'Published' && (
                            <DropdownMenuItem onSelect={() => handleStatusChange(product.id, 'Draft')}>
                                Unpublish
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
     <Sheet open={sheetState.open} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="sm:max-w-2xl w-full p-0">
            {sheetState.view === 'edit' && categories && <SoftwareForm product={sheetState.product} categories={categories} onComplete={handleCloseSheet} />}
            {sheetState.view === 'pricing' && sheetState.product && <PricingForm product={sheetState.product} onComplete={handleCloseSheet} />}
        </SheetContent>
    </Sheet>
    </Fragment>
  );
}

    
