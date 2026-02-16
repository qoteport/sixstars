
'use client';
import { useState } from 'react';
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
import { MoreHorizontal, Users, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Customer } from '@/lib/types';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CustomerForm } from './_components/customer-form';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from './_components/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [sheetState, setSheetState] = useState<{ open: boolean, customer?: Customer }>({ open: false });

  const customersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'customers') : null),
    [firestore]
  );
  const { data: customers, isLoading } = useCollection<Customer>(customersQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteDoc(doc(firestore, 'customers', id));
      toast({ title: 'Customer Deleted' });
    }
  };

  const handleOpenSheet = (customer?: Customer) => {
    setSheetState({ open: true, customer });
  }

  const handleCloseSheet = () => {
    setSheetState({ open: false });
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight font-headline">Customers</h1>
            <p className="text-muted-foreground">
                View and manage customer accounts.
            </p>
        </div>
        <Button onClick={() => handleOpenSheet()}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Customer
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Customers</CardTitle>
          <CardDescription>
            A list of all customer accounts in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Contacted</TableHead>
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                     <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && customers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                     <Link href={paths.admin.customers(customer.id)} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.logoUrl} alt={`${customer.firstName} ${customer.lastName}`} />
                            <AvatarFallback>{customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {customer.firstName} {customer.lastName}
                     </Link>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: getStatusColor(customer.status) }} className="text-white">
                        {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                   <TableCell>
                    {new Date(customer.lastContacted).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={paths.admin.customers(customer.id)}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleOpenSheet(customer)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(customer.id)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && customers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold">No Customers Found</h3>
                      <p className="text-muted-foreground">New customers will appear here as they are created.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <Sheet open={sheetState.open} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="sm:max-w-lg">
            <CustomerForm customer={sheetState.customer} onFormSubmit={handleCloseSheet} />
        </SheetContent>
    </Sheet>
    </>
  );
}
