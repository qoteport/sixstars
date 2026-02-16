
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
import { MoreHorizontal, Quote, PlusCircle, Edit } from 'lucide-react';
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
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Testimonial } from '@/lib/types';
import { collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TestimonialForm } from './_components/testimonial-form';

export default function TestimonialsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [sheetState, setSheetState] = useState<{ open: boolean, testimonial?: Testimonial }>({ open: false });

  const testimonialsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'testimonials') : null),
    [firestore]
  );
  const { data: testimonials, isLoading } = useCollection<Testimonial>(testimonialsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this testimonial?')) {
      await deleteDoc(doc(firestore, 'testimonials', id));
      toast({ title: 'Testimonial Deleted' });
    }
  };

  const handleStatusChange = async (id: string, status: Testimonial['status']) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'testimonials', id), { status });
    toast({ title: 'Status Updated', description: `Testimonial marked as ${status}.` });
  };
  
  const getStatusColor = (status: Testimonial['status']) => {
    switch (status) {
        case 'Approved': return 'bg-green-500';
        case 'Pending': return 'bg-yellow-500';
        case 'Rejected': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
  }

  const handleOpenSheet = (testimonial?: Testimonial) => {
    setSheetState({ open: true, testimonial });
  }

  const handleCloseSheet = () => {
    setSheetState({ open: false });
  }


  return (
    <>
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight font-headline">Testimonials</h1>
                 <p className="text-muted-foreground">
                    Review, approve, or reject customer testimonials.
                </p>
            </div>
             <Button onClick={() => handleOpenSheet()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Testimonial
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Testimonials</CardTitle>
            <CardDescription>
              Review, approve, or reject customer testimonials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Testimonial</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
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
                           <div className="space-y-1">
                               <Skeleton className="h-4 w-24" />
                               <Skeleton className="h-3 w-32" />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                {!isLoading && testimonials?.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={testimonial.authorAvatarUrl} />
                            <AvatarFallback>{testimonial.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{testimonial.authorName}</div>
                            <div className="text-sm text-muted-foreground">{testimonial.authorCompany}</div>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                        <p className="max-w-md truncate">{testimonial.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{testimonial.category}</Badge>
                    </TableCell>
                     <TableCell>
                      <Badge className="text-white" style={{ backgroundColor: getStatusColor(testimonial.status)}}>
                        {testimonial.status}
                      </Badge>
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
                          <DropdownMenuItem onSelect={() => handleOpenSheet(testimonial)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {testimonial.status !== 'Approved' && 
                            <DropdownMenuItem onSelect={() => handleStatusChange(testimonial.id, 'Approved')}>
                                Approve
                            </DropdownMenuItem>
                          }
                          {testimonial.status !== 'Rejected' && 
                            <DropdownMenuItem onSelect={() => handleStatusChange(testimonial.id, 'Rejected')}>
                                Reject
                            </DropdownMenuItem>
                          }
                           {testimonial.status !== 'Pending' && 
                            <DropdownMenuItem onSelect={() => handleStatusChange(testimonial.id, 'Pending')}>
                                Mark as Pending
                            </DropdownMenuItem>
                          }
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleDelete(testimonial.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && testimonials?.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center">
                              <Quote className="h-16 w-16 text-muted-foreground mb-4"/>
                              <h3 className="text-xl font-semibold">No Testimonials Yet</h3>
                              <p className="text-muted-foreground">New testimonials will appear here for approval.</p>
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
          <TestimonialForm testimonial={sheetState.testimonial} onFormSubmit={handleCloseSheet} />
        </SheetContent>
      </Sheet>
    </>
  );
}
