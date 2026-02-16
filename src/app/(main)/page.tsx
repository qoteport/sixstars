
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Rocket, Target, Handshake, Briefcase, Users, TrendingUp, Shield, Zap, Quote } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { SoftwareProduct, Testimonial } from '@/lib/types';
import { collection, query, where, limit } from 'firebase/firestore';
import { paths } from '@/lib/paths';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TestimonialCard } from '@/components/testimonial-card';

export default function Home() {
  const { firestore } = useFirebase();
  const featuredProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'softwareProducts'), where('isFeatured', '==', true), where('status', '==', 'Published'));
  }, [firestore]);
  
  const { data: featuredProducts, isLoading: productsLoading } = useCollection<SoftwareProduct>(featuredProductsQuery);

  const testimonialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'testimonials'), 
        where('status', '==', 'Approved'),
        limit(4)
    );
  }, [firestore]);
  const { data: testimonials, isLoading: testimonialsLoading } = useCollection<Testimonial>(testimonialsQuery);

  const isLoading = productsLoading || testimonialsLoading;


  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        {/* <div className="absolute inset-0 h-[600px] lg:h-[700px]">
             <Image
              src="https://images.unsplash.com/photo-1600880292203-94280e8387ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHN0cmF0ZWd5fGVufDB8fHx8MTc2MjE5ODU2OXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Business professionals strategizing around a table with laptops"
              fill
              className="object-cover"
              data-ai-hint="business strategy"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-background"></div>
        </div> */}
        <div className="container relative mx-auto grid grid-cols-1 items-center gap-12 px-4 pt-20 pb-10 text-center lg:grid-cols-2 lg:gap-24 lg:py-32 lg:pt-5 lg:text-left">
          <div className="space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl md:text-7xl">
              Find the Right Software, Right Now.
            </h1>
            <p className="mx-auto max-w-xl text-xl text-muted-foreground lg:mx-0">
              Stop searching, start succeeding. We connect you with top-tier software solutions tailored to your unique business needs.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={paths.software()}>
                  Explore All Software <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href={paths.support}>Get Expert Advice</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-80 mb-5 w-full overflow-hidden rounded-2xl shadow-2xl lg:h-[450px]">
            <Image
              src="/hero.jpeg"
              alt="Customer interacting with a sales representative at a modern POS system"
              fill
              style={{objectFit:"cover"}}
              data-ai-hint="business sales"
              className="rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-20 bg-background py-16 shadow-2xl lg:-mt-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary lg:text-5xl">100+</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground lg:text-base">Software Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary lg:text-5xl">20+</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground lg:text-base">Businesses Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary lg:text-5xl">98%</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground lg:text-base">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary lg:text-5xl">24/7</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground lg:text-base">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="relative py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20"></div>
        </div>
        <div className="container mx-auto px-8">
          <div className="mx-auto mb-20 max-w-4xl text-center">
            <h2 className="text-5xl font-extrabold tracking-tight">Enterprise-Grade Software Solutions</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              We bridge the gap between complex business needs and cutting-edge technology solutions. 
              Our curated platform delivers measurable results for organizations of all sizes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Accelerated Discovery</h3>
                  <p className="mt-3 text-muted-foreground">
                    Reduce software evaluation time by 80% with our intelligent matching algorithm and expert vetting process.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Vendor Verification</h3>
                  <p className="mt-3 text-muted-foreground">
                    Every solution undergoes rigorous security, compliance, and performance validation before listing.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative h-96 w-full overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="/how-we-work.jpeg"
                  alt="Modern business technology dashboard"
                  fill
                  style={{objectFit:"cover"}}
                  className="rounded-3xl"
                />
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">ROI Focused</h3>
                  <p className="mt-3 text-muted-foreground">
                    Our recommendations are backed by data-driven insights and proven implementation strategies.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Dedicated Support</h3>
                  <p className="mt-3 text-muted-foreground">
                    Access to industry experts and technical specialists throughout your software journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative bg-secondary/30 py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background to-secondary/10"></div>
        <div className="container mx-auto px-8">
          <div className="mx-auto mb-20 max-w-4xl text-center">
            <h2 className="text-5xl font-extrabold tracking-tight">Streamlined Software Selection</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Our proven methodology ensures you find the perfect technology fit for your organization's unique requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <div className="space-y-12">
              <div className="flex items-start gap-8">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
                  01
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Strategic Assessment</h3>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Comprehensive analysis of your business objectives, technical requirements, and operational constraints to define precise selection criteria.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-8">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
                  02
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Curated Matching</h3>
                  <p className="mt-4 text-lg text-muted-foreground">
                    AI-powered platform cross-references thousands of solutions against your specific needs to deliver targeted recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-8">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
                  03
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Implementation Success</h3>
                  <p className="mt-4 text-lg text-muted-foreground">
                    End-to-end support from vendor negotiation to deployment and optimization, ensuring seamless integration and maximum value.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative h-[600px] w-full overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="/setupfor-sucess-with-powerful-softwares.jpeg"
                alt="Business analysis meeting with data visualization"
                fill
                style={{objectFit:"cover"}}
                className="rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Solutions */}
      <section className="py-32">
        <div className="container mx-auto px-8">
          <div className="mx-auto mb-20 max-w-4xl text-center">
            <h2 className="text-5xl font-extrabold tracking-tight">Featured Software Portfolio</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Discover industry-leading solutions trusted by Industry leading companies and growing businesses alike.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {isLoading && [...Array(3)].map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-64 w-full"/></CardHeader><CardContent className="p-8 space-y-4"><Skeleton className="h-8 w-3/4"/><Skeleton className="h-6 w-full"/><Skeleton className="h-6 w-1/2"/></CardContent><CardFooter><Skeleton className="h-12 w-full"/></CardFooter></Card>
            ))}
            {featuredProducts?.map((product) => (
              <Card key={product.id} className="group overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-2xl">
                <Link href={paths.software(product.id)} className="block">
                  <CardHeader className="p-0">
                    <div className="relative h-64 w-full">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        style={{objectFit:"cover"}}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      {/* <Badge variant={product.model === 'Subscription' ? 'default' : 'secondary'} className="text-sm">
                        {product.model}
                      </Badge> */}
                    </div>
                    <CardDescription className="text-lg">{product.description}</CardDescription>
                  </CardContent>
                </Link>
                <CardFooter className="bg-secondary/20 p-6">
                  <Button size="lg" className="w-full" asChild>
                    <Link href={paths.software(product.id)}>
                      View Details <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href={paths.software()}>
                View Complete Portfolio <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="bg-gradient-to-br from-primary/20 via-background to-background py-32">
        <div className="container mx-auto grid grid-cols-1 items-center gap-20 px-8 md:grid-cols-2">
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-5xl font-extrabold tracking-tight">Partner with Industry Leaders</h2>
            <p className="text-xl text-muted-foreground">
              Join our exclusive network of software providers and connect with enterprise clients actively seeking innovative solutions.
            </p>
            <ul className="space-y-4 text-lg text-muted-foreground md:text-left">
              <li className="flex items-center justify-center md:justify-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span>Access to qualified enterprise leads</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span>Streamlined sales and integration process</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span>Comprehensive market intelligence</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-4">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span>Dedicated partnership management</span>
              </li>
            </ul>
            <div className="pt-6">
              <Button asChild size="lg">
                <Link href={paths.partners}>
                  Explore Partnership Opportunities <Briefcase className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative h-96 w-full overflow-hidden rounded-3xl shadow-2xl lg:h-[500px]">
            <Image
              src="/partnerships.jpeg"
              alt="Business partners shaking hands in a modern office"
              fill
              style={{objectFit:"cover"}}
              data-ai-hint="partnership business"
              className="rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background py-32">
        <div className="container mx-auto px-8">
          <div className="mb-20 max-w-4xl text-start">
            <h2 className="text-5xl font-extrabold tracking-tight">Trusted by Businesses Worldwide</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Hear what our customers have to say about their success with solutions found on sixstars.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonialsLoading && [...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-8 space-y-4"><Skeleton className="h-20 w-full"/><Skeleton className="h-10 w-full mt-4"/><Skeleton className="h-6 w-1/2"/></CardContent></Card>
            ))}
            {testimonials?.map(testimonial => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 py-32">
        <div className="absolute inset-0 -z-10 bg-grid-pattern"></div>
        <div className="container mx-auto px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-5xl font-extrabold tracking-tight">Ready to Transform Your Business?</h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Whether you need to find the right software, get expert advice, or partner with us, we're here to help you succeed.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button asChild size="lg" className="min-w-48">
                <Link href={paths.sales}>
                  Talk to Sales
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-48">
                <Link href={paths.support}>
                  Get Support
                </Link>
              </Button>
               <Button asChild size="lg" variant="secondary" className="min-w-48">
                <Link href={paths.partners}>
                  Become a Partner
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
