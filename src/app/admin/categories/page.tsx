
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
import { MoreHorizontal, FolderKanban, PlusCircle, Edit, Loader2 } from 'lucide-react';
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
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { SoftwareCategory } from '@/lib/types';
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name is required.'),
  description: z.string().optional(),
});

function CategoryForm({ category, onFormSubmit }: { category?: SoftwareCategory | null, onFormSubmit: () => void }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!category;

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category || { name: '', description: '' },
  });

  async function onSubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && category) {
        const categoryRef = doc(firestore, 'softwareCategories', category.id);
        await updateDoc(categoryRef, values);
        toast({ title: 'Category Updated' });
      } else {
        const id = values.name.toLowerCase().replace(/\s+/g, '-');
        const newCategoryRef = doc(firestore, 'softwareCategories', id);
        const newCategoryData = { 
            id, 
            ...values,
        };
        await setDoc(newCategoryRef, newCategoryData);
        toast({ title: 'Category Created' });
      }
      onFormSubmit();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ variant: 'destructive', title: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Update the details for this category.' : 'Fill out the form to create a new category.'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 flex-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl><Input placeholder="e.g., CRM" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="A short description of the category." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SheetFooter className="mt-auto">
          <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Category'}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  )
}

export default function CategoriesPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [sheetState, setSheetState] = useState<{ open: boolean, category?: SoftwareCategory }>({ open: false });

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'softwareCategories') : null),
    [firestore]
  );
  const { data: categories, isLoading } = useCollection<SoftwareCategory>(categoriesQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteDoc(doc(firestore, 'softwareCategories', id));
      toast({ title: 'Category Deleted' });
    }
  };
  
  const handleOpenSheet = (category?: SoftwareCategory) => {
    setSheetState({ open: true, category });
  }

  const handleCloseSheet = () => {
    setSheetState({ open: false });
  }

  return (
    <>
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight font-headline">Software Categories</h1>
                 <p className="text-muted-foreground">
                    Create and manage the categories for software products.
                </p>
            </div>
             <Button onClick={() => handleOpenSheet()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Categories</CardTitle>
            <CardDescription>
              A list of all software categories on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                {!isLoading && categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                        <p className="max-w-md truncate">{category.description}</p>
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
                          <DropdownMenuItem onSelect={() => handleOpenSheet(category)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleDelete(category.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && categories?.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={3} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center">
                              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4"/>
                              <h3 className="text-xl font-semibold">No Categories Found</h3>
                              <p className="text-muted-foreground">Create your first category to get started.</p>
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
          <CategoryForm category={sheetState.category} onFormSubmit={handleCloseSheet} />
        </SheetContent>
      </Sheet>
    </>
  );
}
