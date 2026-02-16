
'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Bot, CheckCircle, ArrowLeft, Sparkles, LifeBuoy, Users, Check, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useFirebase } from '@/firebase';
import { doc, collection, query, where, limit, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import type { SoftwareProduct, PricingTier, SoftwareReview } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/lib/paths';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SoftwareCopilot } from '@/components/software-copilot';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


// A simple markdown renderer
function SimpleMarkdown({ content }: { content: string }) {
  return (
    <div>
      {content.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('* ')) {
          return <li key={index} className="ml-5 list-disc text-muted-foreground">{line.substring(2)}</li>;
        }
        return <p key={index} className="text-muted-foreground mb-4">{line}</p>;
      })}
    </div>
  );
}

const StarRatingDisplay = ({ rating, totalReviews, showTotal = true }: { rating: number, totalReviews: number, showTotal?: boolean }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
        {halfStar && <Star key="half" className="w-5 h-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />)}
      </div>
      {showTotal && <span className="text-muted-foreground text-sm">({totalReviews} reviews)</span>}
    </div>
  );
};


const RateSoftware = ({ productId, onReviewSubmit }: { productId: string, onReviewSubmit: (newReview: SoftwareReview) => void }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const [currentRating, setCurrentRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const handleRatingSubmit = async () => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'You must be logged in to post a review.' });
            return;
        }
        if (currentRating === 0) {
            toast({ variant: 'destructive', title: 'Please select a star rating.' });
            return;
        }
         if (!comment.trim()) {
            toast({ variant: 'destructive', title: 'Please write a comment for your review.' });
            return;
        }
        setIsSubmitting(true);
        

        try {
            const productRef = doc(firestore, 'softwareProducts', productId);
            const reviewsColRef = collection(firestore, 'softwareProducts', productId, 'reviews');
            const newReviewRef = doc(reviewsColRef);

            const newReviewData: SoftwareReview = {
                id: newReviewRef.id,
                author: user.displayName || 'Anonymous',
                rating: currentRating,
                comment,
                createdAt: new Date().toISOString(),
            };

            await runTransaction(firestore, async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw "Document does not exist!";
                }

                // Add new review
                transaction.set(newReviewRef, newReviewData);

                // Update aggregate rating on product
                const currentReviewCount = productDoc.data().reviewCount || 0;
                const currentRatingSum = (productDoc.data().rating || 0) * currentReviewCount;
                const newReviewCount = currentReviewCount + 1;
                const newRating = (currentRatingSum + currentRating) / newReviewCount;
                
                transaction.update(productRef, {
                    reviewCount: newReviewCount,
                    rating: newRating,
                });
            });

            toast({ title: 'Thank you for your review!' });
            onReviewSubmit(newReviewData);
            setCurrentRating(0);
            setComment('');
        } catch (e) {
            console.error("Error submitting review: ", e);
            toast({ variant: 'destructive', title: 'Failed to submit review.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div
                className="flex items-center mx-auto"
                onMouseLeave={() => setHoverRating(0)}
            >
                {[...Array(5)].map((_, i) => {
                    const ratingValue = i + 1;
                    return (
                        <button
                            key={i}
                            onClick={() => setCurrentRating(ratingValue)}
                            onMouseEnter={() => setHoverRating(ratingValue)}
                            disabled={isSubmitting}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Star
                                className={cn("w-6 h-6 transition-colors",
                                    ratingValue <= (hoverRating || currentRating)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                )}
                            />
                        </button>
                    );
                })}
            </div>
            <Textarea 
                placeholder="Share your experience..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
            />
            <Button onClick={handleRatingSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Post Review'}
            </Button>
        </div>
    );
};


export default function SoftwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise using React.use()
  const { id } = use(params);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInitialMessage, setCopilotInitialMessage] = useState<string | undefined>(undefined);

  const [product, setProduct] = useState<SoftwareProduct | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[] | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SoftwareProduct[] | null>(null);
  const [reviews, setReviews] = useState<SoftwareReview[] | null>(null);
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [comparisonPricing, setComparisonPricing] = useState<Record<string, PricingTier[]>>({});

  const { firestore } = useFirebase();

  useEffect(() => {
    if (!id || !firestore) return;

    const fetchProductData = async () => {
      setIsProductLoading(true);
      try {
        const productRef = doc(firestore, "softwareProducts", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data() as SoftwareProduct;
          setProduct(productData);
          
          // Fetch data in parallel
          await Promise.all([
            fetchPricingTiers(id),
            fetchReviews(id),
            fetchSimilarProducts(productData)
          ]);

        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setIsProductLoading(false);
      }
    };
    
    const fetchPricingTiers = async (productId: string) => {
      if (!firestore) return [];
      try {
        const tiersQuery = query(collection(firestore, 'softwareProducts', productId, 'pricingTiers'));
        const tiersSnap = await getDocs(tiersQuery);
        const tiersData = tiersSnap.docs.map(d => d.data() as PricingTier);
        if (productId === id) {
          setPricingTiers(tiersData);
        }
        return tiersData;
      } catch (error) {
        console.error(`Error fetching pricing for ${productId}:`, error);
        return [];
      }
    };

    const fetchReviews = async (productId: string) => {
      if (!firestore) return;
      try {
        const reviewsQuery = query(collection(firestore, 'softwareProducts', productId, 'reviews'));
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(d => d.data() as SoftwareReview).sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    const fetchSimilarProducts = async (currentProduct: SoftwareProduct) => {
      if (!firestore) return;
      try {
        const similarQuery = query(
          collection(firestore, 'softwareProducts'),
          where('model', '==', currentProduct.model),
          where('id', '!=', currentProduct.id),
          limit(2)
        );
        const similarSnap = await getDocs(similarQuery);
        const similarData = similarSnap.docs.map(d => d.data() as SoftwareProduct);
        setSimilarProducts(similarData);
        
        // Fetch pricing for all comparison products (current + similar)
        const allIds = [currentProduct.id, ...similarData.map(p => p.id)];
        const pricingPromises = allIds.map(pid => fetchPricingTiers(pid));
        const allPricings = await Promise.all(pricingPromises);
        
        const pricingMap: Record<string, PricingTier[]> = {};
        allIds.forEach((pid, index) => {
          pricingMap[pid] = allPricings[index];
        });
        setComparisonPricing(pricingMap);

      } catch (error) {
        console.error("Error fetching similar products:", error);
      }
    };

    fetchProductData();
  }, [id, firestore]);

  const [initialLoadFinished, setInitialLoadFinished] = useState(false);
  useEffect(() => {
    if (!isProductLoading) {
      setInitialLoadFinished(true);
    }
  }, [isProductLoading]);

  if (!product && initialLoadFinished) {
    notFound();
  }
  
  const handleCopilotOpen = (initialMessage: string) => {
    setCopilotInitialMessage(initialMessage);
    setCopilotOpen(true);
  };
  
  const allComparisonProducts = [product, ...(similarProducts || [])].filter((p): p is SoftwareProduct => p !== null);
  const allFeatures = [...new Set(allComparisonProducts.flatMap(p => p.features || []))];


  if (isProductLoading || !product) {
    return (
      <div className="bg-secondary/20">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <Skeleton className="h-10 w-40 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-7 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-96 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary/20">
      <Sheet open={copilotOpen} onOpenChange={setCopilotOpen}>
        <SheetContent className="w-full md:max-w-[500px] sm:max-w-2xl p-0 flex flex-col border-l">
            <SoftwareCopilot 
              closeSheet={() => setCopilotOpen(false)}
              // initialMessage={copilotInitialMessage}
              storageKey={`copilot_chat_history_${product.id}`}
            />
        </SheetContent>
      </Sheet>

      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href={paths.software()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Software
            </Link>
          </Button>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{product.name}</h1>
          <p className="text-xl text-muted-foreground mb-4">{product.description}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <StarRatingDisplay rating={product.rating || 0} totalReviews={reviews?.length || 0} />
            <Badge variant="outline">{product.category}</Badge>
            <Badge variant={product.model === 'Subscription' ? 'default' : 'secondary'}>{product.model}</Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative h-96 w-full overflow-hidden rounded-lg">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={product.imageHint}
                priority
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <SimpleMarkdown content={product.details} />
                </div>
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Key Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {product.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-6" />
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="flex-1">
                        <Link href={paths.support}><LifeBuoy/>Get Purchase Help</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="flex-1">
                       <Link href={paths.support}><Users/>Speak to an Expert</Link>
                    </Button>
                 </div>
              </CardContent>
            </Card>

            {pricingTiers && pricingTiers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Plans</CardTitle>
                  <CardDescription>Choose the plan that's right for you.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pricingTiers.map(tier => (
                    <Card key={tier.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle>{tier.name}</CardTitle>
                        <div className="flex items-baseline space-x-1 pt-2">
                          <p className="text-3xl font-bold">${tier.price}</p>
                          <p className="text-sm text-muted-foreground">{tier.frequency}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3">
                        <ul className="space-y-2">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <div className="p-6 pt-0">
                        <Button className="w-full">Get Started</Button>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

             <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>See what others are saying about {product.name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="flex gap-4">
                        <Avatar>
                           <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{review.author}</p>
                                <StarRatingDisplay rating={review.rating} totalReviews={0} showTotal={false} />
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                       <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                       <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot />Copilot</CardTitle>
              </CardHeader>
              <CardContent>
                 <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleCopilotOpen(`Tell me about ${product.name}.`)}
                  >
                  <Sparkles className="mr-2 h-4 w-4" /> Ask about this product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compare Products</CardTitle>
                <CardDescription>See how this product stacks up against similar options.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full" disabled={!similarProducts || similarProducts.length === 0}>
                      Compare Products
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Product Comparison</DialogTitle>
                      <DialogDescription>
                        Here's a side-by-side comparison with similar software.
                      </DialogDescription>
                    </DialogHeader>
                     <Tabs defaultValue="features" className="w-full flex-grow flex flex-col min-h-0">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                      </TabsList>
                      <ScrollArea className="flex-grow mt-4">
                        <TabsContent value="features">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[200px]">Feature</TableHead>
                                  {allComparisonProducts.map(p => (
                                    <TableHead key={p.id} className="text-center">{p.name}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-semibold">Rating</TableCell>
                                  {allComparisonProducts.map(p => (
                                    <TableCell key={p.id} className="text-center">
                                      <div className="flex items-center justify-center gap-1">
                                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                          <span>{(p.rating || 0).toFixed(1)}</span>
                                          <span className="text-xs text-muted-foreground">({p.reviewCount || 0})</span>
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">Model</TableCell>
                                  {allComparisonProducts.map(p => (
                                    <TableCell key={p.id} className="text-center">
                                      <Badge variant="outline">{p.model}</Badge>
                                    </TableCell>
                                  ))}
                                </TableRow>
                                {allFeatures.map(feature => (
                                  <TableRow key={feature}>
                                    <TableCell className="font-semibold text-muted-foreground">{feature}</TableCell>
                                    {allComparisonProducts.map(p => (
                                      <TableCell key={p.id} className="text-center">
                                        {p.features?.includes(feature) ? (
                                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        <TabsContent value="pricing">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {allComparisonProducts.map(p => (
                                <div key={p.id} className="border rounded-lg">
                                  <h3 className="font-bold text-center p-3 border-b bg-muted/50">{p.name}</h3>
                                  <div className="p-4 space-y-4">
                                    {(comparisonPricing[p.id] || []).length > 0 ? (
                                      (comparisonPricing[p.id] || []).map(tier => (
                                        <div key={tier.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                                          <p className="font-semibold">{tier.name}</p>
                                          <p className="text-2xl font-bold">${tier.price}<span className="text-sm font-normal text-muted-foreground">{tier.frequency}</span></p>
                                          <ul className="mt-2 space-y-1">
                                            {tier.features.map((feature, i) => (
                                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <Check className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-8">No pricing tiers available.</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </TabsContent>
                      </ScrollArea>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                  <CardDescription>Share your experience with this software.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RateSoftware 
                    productId={product.id} 
                    onReviewSubmit={(newReview) => {
                       setReviews(prev => prev ? [newReview, ...prev] : [newReview]);
                       // Also optimistically update product rating state
                       setProduct(prev => {
                         if (!prev) return null;
                         const newCount = (prev.reviewCount || 0) + 1;
                         const newRating = (((prev.rating || 0) * (prev.reviewCount || 0)) + newReview.rating) / newCount;
                         return { ...prev, reviewCount: newCount, rating: newRating };
                       });
                    }}
                  />
                </CardContent>
              </Card>

          </div>
        </div>

        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold tracking-tight mb-8">Similar Software</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProducts.map((p) => (
                <Card key={p.id} className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                  <Link href={paths.software(p.id)} className="block h-full">
                    <CardHeader className="p-0">
                      <div className="relative h-48 w-full">
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-500 group-hover:scale-105"
                          priority={false}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription className="text-sm mt-1 line-clamp-2">{p.description}</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
