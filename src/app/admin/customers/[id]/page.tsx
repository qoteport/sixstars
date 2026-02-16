
'use client';
import { use, useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, deleteDoc, doc, updateDoc, orderBy, query, addDoc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Customer, Interaction } from '@/lib/types';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, PlusCircle, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/lib/paths';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '../_components/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CustomerForm } from '../_components/customer-form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

function InteractionLog({ interaction, onDelete }: { interaction: Interaction, onDelete: (id: string) => void }) {
    const { user } = useFirebase();
    // In a real app, you'd fetch the author's name from a users collection
    const authorName = user?.uid === interaction.authorId ? 'You' : 'Another User';

    return (
        <div className="flex gap-4">
            <Avatar className="h-9 w-9">
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                        {interaction.type}
                        <span className="font-normal text-muted-foreground text-xs ml-2">by {authorName} on {new Date(interaction.date).toLocaleDateString()}</span>
                    </p>
                    {user?.uid === interaction.authorId &&
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(interaction.id)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    }
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.notes}</p>
            </div>
        </div>
    )
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore, user: currentUser } = useFirebase();
  const { toast } = useToast();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<'Call' | 'Email' | 'Meeting' | 'Note'>('Note');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !firestore) return;

    const fetchCustomerData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch customer
        const customerDocRef = doc(firestore, 'customers', id);
        const customerSnap = await getDoc(customerDocRef);
        
        if (customerSnap.exists()) {
          setCustomer(customerSnap.data() as Customer);
        } else {
          setCustomer(null);
        }

        // Fetch interactions
        const interactionsQuery = query(collection(firestore, `customers/${id}/interactions`), orderBy('date', 'desc'));
        const interactionsSnap = await getDocs(interactionsQuery);
        const interactionsData = interactionsSnap.docs.map(doc => doc.data() as Interaction);
        setInteractions(interactionsData);
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();

  }, [id, firestore]); 


  const handleAddInteraction = async () => {
      if (!firestore || !id || !currentUser || !interactionNotes.trim()) return;
      
      setIsSubmitting(true);
      const newInteractionRef = doc(collection(firestore, `customers/${id}/interactions`));
      
      try {
          const newInteraction: Interaction = {
              id: newInteractionRef.id,
              type: interactionType,
              notes: interactionNotes,
              date: new Date().toISOString(),
              authorId: currentUser.uid,
          };
          
          await setDoc(newInteractionRef, newInteraction);

          // After successful write, update the parent customer's lastContacted date
          await updateDoc(doc(firestore, 'customers', id), { lastContacted: newInteraction.date });
          
          // Optimistically update the UI
          setInteractions(prev => [newInteraction, ...prev]);
          if(customer) {
            setCustomer({...customer, lastContacted: newInteraction.date});
          }

          setInteractionNotes('');
          toast({ title: "Interaction logged." });
      } catch (error) {
          console.error("Error logging interaction:", error);
          toast({ variant: 'destructive', title: "Failed to log interaction." });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!firestore || !id) return;
    if (confirm('Are you sure you want to delete this log?')) {
        await deleteDoc(doc(firestore, `customers/${id}/interactions`, interactionId));
        setInteractions(prev => prev.filter(i => i.id !== interactionId));
        toast({ title: 'Interaction deleted' });
    }
  }

  const handleFormSubmit = (updatedCustomer?: Customer) => {
    setIsSheetOpen(false);
    if(updatedCustomer) {
      setCustomer(updatedCustomer);
    }
  }

  if (isLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-8 w-40"/>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-64 w-full"/>
                   </div>
                   <div className="md:col-span-2 space-y-6">
                       <Skeleton className="h-96 w-full"/>
                   </div>
              </div>
          </div>
      )
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href={paths.admin.customers()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
          <Button onClick={() => setIsSheetOpen(true)}>
             <Edit className="h-4 w-4 mr-2"/> Edit Customer
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
             <Card>
                <CardHeader className="flex flex-row items-start gap-4">
                    <Avatar className="h-16 w-16 rounded-md">
                        <AvatarImage src={customer.logoUrl} alt={customer.company || `${customer.firstName} ${customer.lastName}`} />
                        <AvatarFallback className="rounded-md">
                            {customer.company?.charAt(0) || customer.firstName?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">{customer.firstName} {customer.lastName}</CardTitle>
                        <CardDescription>{customer.email}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                         <p className="font-medium text-muted-foreground">Status</p>
                         <Badge style={{ backgroundColor: getStatusColor(customer.status) }} className="text-white">
                            {customer.status}
                        </Badge>
                    </div>
                     <div>
                         <p className="font-medium text-muted-foreground">Phone</p>
                         <p>{customer.phone || 'Not provided'}</p>
                    </div>
                     <div>
                         <p className="font-medium text-muted-foreground">Company</p>
                         <p>{customer.company || 'Not provided'}</p>
                    </div>
                     <div>
                         <p className="font-medium text-muted-foreground">Website</p>
                         {customer.website ? <a href={customer.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{customer.website}</a> : <p>Not provided</p>}
                    </div>
                    <div>
                         <p className="font-medium text-muted-foreground">Last Contacted</p>
                         <p>{new Date(customer.lastContacted).toLocaleString()}</p>
                    </div>
                    <div>
                         <p className="font-medium text-muted-foreground">Customer Since</p>
                         <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
                    </div>
                </CardContent>
            </Card>
            {customer.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">General Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Interaction History</CardTitle>
                    <CardDescription>Log calls, meetings, and other notes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="relative">
                            <Textarea 
                                placeholder={`Log a ${interactionType.toLowerCase()}...`}
                                value={interactionNotes}
                                onChange={(e) => setInteractionNotes(e.target.value)}
                                className="flex-1 pr-32 min-h-[80px]"
                            />
                             <div className="absolute top-2 right-2 flex items-center gap-2">
                                <Select value={interactionType} onValueChange={(val: any) => setInteractionType(val)}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Note">Note</SelectItem>
                                        <SelectItem value="Call">Call</SelectItem>
                                        <SelectItem value="Email">Email</SelectItem>
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddInteraction} disabled={isSubmitting || !interactionNotes.trim()}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Log Interaction
                            </Button>
                        </div>
                    </div>

                    <Separator/>

                    <div className="space-y-6">
                        {isLoading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
                        {!isLoading && interactions?.map(int => (
                            <InteractionLog key={int.id} interaction={int} onDelete={handleDeleteInteraction} />
                        ))}
                        {!isLoading && interactions?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No interactions logged yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
            <CustomerForm customer={customer} onFormSubmit={(c) => handleFormSubmit(c)} />
        </SheetContent>
    </Sheet>
    </div>
  );
}
