'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Loader2, CheckCircle, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Partner, SoftwareProduct } from '@/lib/types';
import { collection, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }),
  logoUrl: z.string().url({ message: "Please enter a valid URL for your logo." }),
  companyDescription: z.string().min(20, { message: "Description must be at least 20 characters." }),
  softwareProductIds: z.array(z.string()).optional(),
  status: z.enum(['Published', 'Draft']),
});


function PartnerFormSheet({ partner, allSoftware, onComplete }: { partner?: Partner, allSoftware: SoftwareProduct[], onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const { firestore } = useFirebase();

  const unassignedSoftware = useMemo(() => {
      return allSoftware?.filter(product => !product.partnerId || product.partnerId === partner?.id) || [];
  }, [allSoftware, partner]);

  const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
          companyName: "",
          contactEmail: "",
          websiteUrl: "",
          logoUrl: "",
          companyDescription: "",
          softwareProductIds: [],
          status: "Draft",
      },
  });

  useEffect(() => {
      if (partner) {
          form.reset({
              companyName: partner.companyName,
              contactEmail: partner.contactEmail,
              websiteUrl: partner.websiteUrl,
              logoUrl: partner.logoUrl,
              companyDescription: partner.companyDescription,
              softwareProductIds: allSoftware.filter(p => p.partnerId === partner.id).map(p => p.id),
              status: partner.status,
          });
      } else {
          form.reset({
              companyName: "",
              contactEmail: "",
              websiteUrl: "",
              logoUrl: "",
              companyDescription: "",
              softwareProductIds: [],
              status: "Draft"
          });
      }
  }, [partner, allSoftware, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
      if (!firestore) return;
      setIsSubmitting(true);
      
      try {
          const batch = writeBatch(firestore);

          const partnerRef = partner ? doc(firestore, 'partners', partner.id) : doc(collection(firestore, 'partners'));
          const partnerId = partnerRef.id;

          const partnerData = {
              id: partnerId,
              companyName: values.companyName,
              contactEmail: values.contactEmail,
              websiteUrl: values.websiteUrl,
              logoUrl: values.logoUrl,
              companyDescription: values.companyDescription,
              status: values.status,
          };

          if (partner) {
               batch.update(partnerRef, partnerData);
          } else {
               batch.set(partnerRef, {...partnerData, createdAt: new Date().toISOString()});
          }
          
          // Link new software
          values.softwareProductIds?.forEach(productId => {
              const productRef = doc(firestore, 'softwareProducts', productId);
              batch.update(productRef, { partnerId });
          });

          // Unlink software that was deselected (only in edit mode)
          if (partner) {
              const initialProductIds = allSoftware.filter(p => p.partnerId === partner.id).map(p => p.id);
              const deselectedProductIds = initialProductIds.filter(id => !values.softwareProductIds?.includes(id));
              deselectedProductIds.forEach(productId => {
                   const productRef = doc(firestore, 'softwareProducts', productId);
                   batch.update(productRef, { partnerId: '' }); // Use empty string to unlink
              });
          }

          await batch.commit();

          setIsSubmitSuccessful(true);
          setTimeout(() => {
              onComplete();
              setIsSubmitSuccessful(false);
          }, 1500);

      } catch(error) {
         console.error("Error saving partner:", error);
      } finally {
         setIsSubmitting(false);
      }
  }

  return (
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <SheetHeader>
                  <SheetTitle>{partner ? 'Edit Partner' : 'Add a New Partner'}</SheetTitle>
                  <SheetDescription>
                     {partner ? 'Update the details below.' : 'Fill in the details to add a new partner and link their software.'}
                  </SheetDescription>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto p-1 -mx-1 space-y-4 py-6">
                   <FormField 
                       control={form.control} 
                       name="companyName" 
                       render={({ field }) => (
                           <FormItem>
                               <FormLabel>Company Name</FormLabel>
                               <FormControl>
                                   <Input placeholder="Innovate Inc." {...field} />
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
                              <SelectItem value="Published">Published</SelectItem>
                              <SelectItem value="Draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
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
                                   <Input type="email" placeholder="contact@innovate.com" {...field} />
                               </FormControl>
                               <FormMessage />
                           </FormItem>
                       )} 
                   />
                   <FormField 
                       control={form.control} 
                       name="websiteUrl" 
                       render={({ field }) => (
                           <FormItem>
                               <FormLabel>Website URL</FormLabel>
                               <FormControl>
                                   <Input type="url" placeholder="https://innovate.com" {...field} />
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
                                   <Input type="url" placeholder="https://innovate.com/logo.png" {...field} />
                               </FormControl>
                               <FormMessage />
                           </FormItem>
                       )} 
                   />
                   <FormField
                        control={form.control}
                        name="companyDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A short description of the company." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                   
                   <FormField
                       control={form.control}
                       name="softwareProductIds"
                       render={() => (
                           <FormItem>
                               <div className="mb-4">
                                   <FormLabel className="text-base">Link to Software</FormLabel>
                                   <p className="text-sm text-muted-foreground">
                                       Select the software products associated with this partner.
                                   </p>
                               </div>
                               <ScrollArea className="h-40 rounded-md border">
                                    <div className="p-4 space-y-4">
                                        {unassignedSoftware.map((item) => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="softwareProductIds"
                                            render={({ field }) => {
                                                return (
                                                <FormItem
                                                    key={item.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item.id)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), item.id])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                (value) => value !== item.id
                                                                )
                                                            )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-sm">
                                                    {item.name}
                                                    </FormLabel>
                                                </FormItem>
                                                )
                                            }}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                               <FormMessage />
                           </FormItem>
                       )}
                   />
              </div>
              <SheetFooter className="mt-auto pt-6">
                  <SheetClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                  </SheetClose>
                   <Button type="submit" disabled={isSubmitting || isSubmitSuccessful}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitSuccessful ? <CheckCircle className="mr-2 h-4 w-4"/> : null}
                      {isSubmitSuccessful ? (partner ? "Partner Updated" : "Partner Added") : (partner ? "Save Changes" : "Save Partner")}
                  </Button>
              </SheetFooter>
          </form>
      </Form>
  );
}

export default function PartnerAdminPage() {
  const [sheetState, setSheetState] = useState<{open: boolean, partner?: Partner}>({ open: false, partner: undefined });
  const { firestore } = useFirebase();

  const partnersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'partners') : null), [firestore]);
  const { data: partners, isLoading: partnersLoading } = useCollection<Partner>(partnersQuery);

  const softwareQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'softwareProducts') : null), [firestore]);
  const { data: allSoftware, isLoading: softwareLoading } = useCollection<SoftwareProduct>(softwareQuery);

  const productCountsByPartner = useMemo(() => {
    const counts = new Map<string, number>();
    if (allSoftware) {
        for (const product of allSoftware) {
            if (product.partnerId) {
                counts.set(product.partnerId, (counts.get(product.partnerId) || 0) + 1);
            }
        }
    }
    return counts;
  }, [allSoftware]);


  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this partner? This will not unlink their software.')) {
      await deleteDoc(doc(firestore, 'partners', id));
    }
  };

  const handleStatusChange = async (id: string, status: Partner['status']) => {
    if (!firestore) return;
    const partnerRef = doc(firestore, 'partners', id);
    await updateDoc(partnerRef, { status });
  };

  const handleOpenSheet = (partner?: Partner) => {
    setSheetState({ open: true, partner });
  };
  
  const handleCloseSheet = () => {
    setSheetState({ open: false, partner: undefined });
  }

  const isLoading = partnersLoading || softwareLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Manage Partners
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your software partners and link their products.
          </p>
        </div>
         <Sheet open={sheetState.open} onOpenChange={(open) => !open && handleCloseSheet()}>
            <SheetTrigger asChild>
                <Button onClick={() => handleOpenSheet()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg flex flex-col">
                {allSoftware && (
                <PartnerFormSheet 
                    partner={sheetState.partner}
                    allSoftware={allSoftware}
                    onComplete={handleCloseSheet}
                />
                )}
            </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Partners</CardTitle>
          <CardDescription>
            A list of all partners on the platform and their linked software.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Linked Software</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell> <Skeleton className="h-6 w-20 rounded-full" /> </TableCell>
                    <TableCell> <Skeleton className="h-4 w-40" /> </TableCell>
                    <TableCell> <Skeleton className="h-4 w-16" /> </TableCell>
                    <TableCell> <Skeleton className="h-8 w-8" /> </TableCell>
                  </TableRow>
                ))}
              {!isLoading && partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <Avatar>
                        <AvatarImage src={partner.logoUrl} alt={partner.companyName} />
                        <AvatarFallback>{partner.companyName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{partner.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.status === 'Published' ? 'default' : 'secondary'}>
                        {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{partner.contactEmail}</TableCell>
                  <TableCell>{productCountsByPartner.get(partner.id) || 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleOpenSheet(partner)}>
                           <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                        {partner.status !== 'Published' && (
                            <DropdownMenuItem onSelect={() => handleStatusChange(partner.id, 'Published')}>
                                Publish
                            </DropdownMenuItem>
                        )}
                        {partner.status === 'Published' && (
                            <DropdownMenuItem onSelect={() => handleStatusChange(partner.id, 'Draft')}>
                                Unpublish
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleDelete(partner.id)} className="text-destructive" >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && partners?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                        No partners found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
