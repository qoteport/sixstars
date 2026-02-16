'use client';
import { useMemo } from 'react';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Partner } from '@/lib/types';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerAdminPage() {
  const { firestore } = useFirebase();
  const partnersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'partners') : null),
    [firestore]
  );
  const { data: partners, isLoading } = useCollection<Partner>(partnersQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this partner?')) {
      await deleteDoc(doc(firestore, 'partners', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Manage Partners
          </h1>
          <p className="text-muted-foreground">
            View and manage partner applications and information.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Partners</CardTitle>
          <CardDescription>
            A list of all partners on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Website</TableHead>
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
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                       <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.companyName}</TableCell>
                  <TableCell>{partner.contactEmail}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {partner.websiteUrl}
                    </a>
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
                        <DropdownMenuItem>View Application</DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleDelete(partner.id)}
                          className="text-destructive"
                        >
                          Delete
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
  );
}
