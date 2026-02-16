
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trackSoftwareClick } from '@/lib/actions';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { SoftwareProduct } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/lib/paths';
import { SoftwareCopilot } from '@/components/software-copilot';

export default function SoftwarePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copilotOpen, setCopilotOpen] = useState(false);

  const { firestore } = useFirebase();

  const softwareProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'softwareProducts'), where('status', '==', 'Published'));
  }, [firestore]);

  const { data: products, isLoading } = useCollection<SoftwareProduct>(softwareProductsQuery);
  
  const categories = useMemo(() => {
      if (!products) return ['All'];
      const uniqueCategories = new Set(products.map(p => p.category));
      return ['All', ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory, products]);

  const handleProductClick = (productId: string) => {
    trackSoftwareClick(productId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-8 lg:py-12 px-4 md:px-6 mx-auto">
        <div className="mb-12 space-y-4">
          <div className="flex lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for software..."
                className="w-full rounded-md border pl-10 pr-4 py-2 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Sheet open={copilotOpen} onOpenChange={setCopilotOpen}>
              <SheetTrigger asChild>
                <Button className="w-[100px] md:w-auto">
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span className='hidden md:block'>Product</span>Copilot
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full md:max-w-[500px]  p-0 flex flex-col border-l">
                <SoftwareCopilot closeSheet={() => setCopilotOpen(false)}/>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
              <TabsList className="bg-transparent p-0">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs border data-[state=active]:border-transparent"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="flex flex-col">
                <Skeleton className="h-48 w-full" />
                <CardContent className="flex-grow p-6">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
                <CardFooter className="bg-secondary/30 p-4 flex justify-between items-center">
                   <Skeleton className="h-6 w-20" />
                   <Skeleton className="h-6 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden border bg-background/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 flex flex-col">
                <div className="relative bg-gradient-to-br from-secondary/20 to-background/50 h-48">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    style={{"objectFit":"cover"}}
                    className="transition-transform duration-500 group-hover:scale-105"
                    data-ai-hint={product.imageHint || 'software image'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
                </div>
                
                <CardContent className="flex-grow p-6">
                  <CardTitle className="mb-2 text-xl">{product.name}</CardTitle>
                  <CardDescription className="mb-4 line-clamp-2">{product.description}</CardDescription>
                  <Badge variant="outline">{product.category}</Badge>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-secondary/30 p-4">
                  <Badge variant={product.model === 'Subscription' ? 'default' : 'secondary'}>{product.model}</Badge>
                   <Link href={paths.software(product.id)} onClick={() => handleProductClick(product.id)} className="text-primary font-semibold flex items-center text-sm">
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-16 col-span-full">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/30">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery ? (
                  <>No results found for "<span className="font-medium text-foreground">{searchQuery}</span>". Try different keywords or use our AI recommender.</>
                ) : (
                  "No products match your current filters. Try adjusting your criteria."
                )}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-lg text-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
