
'use client';
import { useMemo, useState } from 'react';
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
import { MoreHorizontal, MessageSquareQuote, UserPlus, Loader2 } from 'lucide-react';
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { SalesInquiry } from '@/lib/types';
import { collection, deleteDoc, doc, updateDoc, writeBatch, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function SalesInquiriesPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);

  const inquiriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'salesInquiries') : null),
    [firestore]
  );
  const { data: inquiries, isLoading } = useCollection<SalesInquiry>(inquiriesQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this inquiry?')) {
      await deleteDoc(doc(firestore, 'salesInquiries', id));
      toast({ title: 'Inquiry Deleted' });
    }
  };

  const handleStatusChange = async (id: string, status: SalesInquiry['status']) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'salesInquiries', id), { status });
    toast({ title: 'Status Updated', description: `Inquiry marked as ${status}.` });
  };

  const handleViewInquiry = (inquiry: SalesInquiry) => {
    setSelectedInquiry(inquiry);
    setIsSheetOpen(true);
  };
  
  const handleQualifyCustomer = async () => {
    if (!firestore || !selectedInquiry) return;

    setIsQualifying(true);
    const batch = writeBatch(firestore);

    // Find existing user by email
    let userId: string | undefined = undefined;
    const usersQuery = query(collection(firestore, 'users'), where('email', '==', selectedInquiry.email));
    const userSnap = await getDocs(usersQuery);
    if (!userSnap.empty) {
        userId = userSnap.docs[0].id; // The user's UID is the document ID
    }

    const [firstName, ...lastNameParts] = selectedInquiry.name.split(' ');
    const lastName = lastNameParts.join(' ');

    const newCustomerRef = doc(collection(firestore, 'customers'));
    const now = new Date().toISOString();
    
    const customerData: DocumentData = {
      id: newCustomerRef.id,
      firstName: firstName,
      lastName: lastName,
      email: selectedInquiry.email,
      company: selectedInquiry.company || '',
      status: 'Lead',
      lastContacted: now,
      createdAt: now,
    };

    if (userId) {
        customerData.userId = userId;
    }

    batch.set(newCustomerRef, customerData);

    const inquiryRef = doc(firestore, 'salesInquiries', selectedInquiry.id);
    batch.update(inquiryRef, { status: 'Qualified' });

    try {
      await batch.commit();
      toast({
        title: 'Customer Qualified',
        description: `${selectedInquiry.name} has been added to customers.`,
      });
      setIsSheetOpen(false);
      setSelectedInquiry(null);
    } catch (error) {
       console.error("Error qualifying customer: ", error);
       toast({
         variant: 'destructive',
         title: 'Something went wrong',
         description: 'Could not qualify the customer. Please try again.',
       });
    } finally {
        setIsQualifying(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Sales Inquiries</h1>
        <Card>
          <CardHeader>
            <CardTitle>Manage Sales Inquiries</CardTitle>
            <CardDescription>
              Review and respond to leads from the sales page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
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
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                {!isLoading && inquiries?.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell>
                      <div className="font-medium">{inquiry.name}</div>
                      <div className="text-sm text-muted-foreground">{inquiry.email}</div>
                    </TableCell>
                    <TableCell>{inquiry.company}</TableCell>
                    <TableCell>
                      <Badge variant={inquiry.status === 'New' ? 'default' : 'secondary'}>{inquiry.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem onSelect={() => handleViewInquiry(inquiry)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {inquiry.status !== 'Qualified' && (
                             <DropdownMenuItem onSelect={() => handleStatusChange(inquiry.id, 'Contacted')}>Mark as Contacted</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleDelete(inquiry.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && inquiries?.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center">
                              <MessageSquareQuote className="h-16 w-16 text-muted-foreground mb-4"/>
                              <h3 className="text-xl font-semibold">No New Sales Inquiries</h3>
                              <p className="text-muted-foreground">New leads from customers will appear here.</p>
                          </div>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
            {selectedInquiry && (
                <>
                <SheetHeader>
                    <SheetTitle>Inquiry from {selectedInquiry.name}</SheetTitle>
                    <SheetDescription>
                        {selectedInquiry.email} &bull; {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-4">
                    <div className="text-sm">
                        <p className="font-medium text-muted-foreground">Company</p>
                        <p>{selectedInquiry.company || 'Not provided'}</p>
                    </div>
                     <div className="text-sm">
                        <p className="font-medium text-muted-foreground">Product of Interest</p>
                        <p>{selectedInquiry.productInterest || 'Not specified'}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-muted-foreground">Message</p>
                        <p className="whitespace-pre-wrap bg-secondary/50 p-3 rounded-md">{selectedInquiry.message}</p>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Close</Button>
                    </SheetClose>
                    {selectedInquiry.status !== 'Qualified' && (
                        <Button onClick={handleQualifyCustomer} disabled={isQualifying}>
                            {isQualifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <UserPlus className="mr-2 h-4 w-4" /> Qualify as Customer
                        </Button>
                    )}
                </SheetFooter>
                </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}

    