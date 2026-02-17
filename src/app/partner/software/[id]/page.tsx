
'use client'

import { useFirebase, useUser } from "@/firebase";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SoftwareProduct, SoftwareReview, UserProfile, Partner } from "@/lib/types";
import { Loader2, ArrowLeft, BarChart as BarChartIcon, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { paths } from "@/lib/paths";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

const StarRatingDisplay = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
        {halfStar && <Star key="half" className="w-4 h-4 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />)}
      </div>
    );
};

export default function SoftwareAnalyticsPage() {
    const { id } = useParams() as { id: string };
    const { firestore, user } = useFirebase();
    const router = useRouter();

    const [product, setProduct] = useState<SoftwareProduct | null>(null);
    const [reviews, setReviews] = useState<SoftwareReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const chartData = useMemo(() => {
        const ratingCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
            const rating = Math.round(review.rating);
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating]++;
            }
        });

        return [
            { rating: "1 Star", count: ratingCounts[1] },
            { rating: "2 Stars", count: ratingCounts[2] },
            { rating: "3 Stars", count: ratingCounts[3] },
            { rating: "4 Stars", count: ratingCounts[4] },
            { rating: "5 Stars", count: ratingCounts[5] },
        ];
    }, [reviews]);

    const chartConfig = {
        count: {
            label: "Reviews",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig;

    useEffect(() => {
        const verifyOwnershipAndFetch = async () => {
            if (!firestore || !user || !id) return;
            setIsLoading(true);

            // Verify partner owns this product
            const userProfileRef = doc(firestore, 'users', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (!userProfileSnap.exists()) {
                router.push(paths.login);
                return;
            }
            const userProfile = userProfileSnap.data() as UserProfile;

            const productRef = doc(firestore, 'softwareProducts', id);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists() || productSnap.data().partnerId !== userProfile.partnerId) {
                // Product doesn't exist or doesn't belong to this partner
                notFound();
                return;
            }
            setProduct(productSnap.data() as SoftwareProduct);

            // Fetch reviews
            const reviewsQuery = query(collection(firestore, 'softwareProducts', id, 'reviews'), orderBy('createdAt', 'desc'));
            const reviewsSnap = await getDocs(reviewsQuery);
            setReviews(reviewsSnap.docs.map(d => d.data() as SoftwareReview));

            setIsLoading(false);
        };
        verifyOwnershipAndFetch();
    }, [id, firestore, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!product) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" asChild>
                    <Link href={paths.partner.management} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Management
                    </Link>
                </Button>
            </div>

            <header className="flex items-start gap-4">
                 <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="rounded-lg border" />
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{product.name} Analytics</h1>
                    <p className="text-muted-foreground">
                        Performance and feedback for your product.
                    </p>
                 </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{product.clicks || 0}</p>
                        <p className="text-sm text-muted-foreground">From "View Details" buttons.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold">{product.rating?.toFixed(1) || '0.0'}</p>
                            <Star className="h-7 w-7 text-yellow-400 fill-yellow-400" />
                         </div>
                        <p className="text-sm text-muted-foreground">Across {product.reviewCount || 0} reviews.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{product.reviewCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Customer feedback submitted.</p>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                    <CardDescription>Distribution of ratings from customer reviews.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="rating"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <Fragment key={review.id}>
                            <div className="flex gap-4">
                                <Avatar>
                                <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{review.author}</p>
                                        <StarRatingDisplay rating={review.rating} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(review.createdAt!).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                             <Separator className="last:hidden"/>
                            </Fragment>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No reviews yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
