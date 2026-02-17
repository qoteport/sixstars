
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { Customer, Partner, SoftwareProduct, UserProfile } from '@/lib/types';
import { paths } from '@/lib/paths';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileClock, Handshake, Briefcase, Building, Loader2, LogOut, ExternalLink, User, Mail, Save, X, Edit, LayoutGrid } from "lucide-react";
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { toast } from '@/hooks/use-toast';

function PartnerSoftware({ partner }: { partner: Partner }) {
    const { firestore } = useFirebase();
    const softwareQuery = useMemoFirebase(() => {
        if (!firestore || !partner) return null;
        return query(collection(firestore, 'softwareProducts'), where('partnerId', '==', partner.id));
    }, [firestore, partner]);

    const { data: software, isLoading } = useCollection<SoftwareProduct>(softwareQuery);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
        )
    }

    if (!software || software.length === 0) {
        return (
            <div className="text-center py-10">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Software Listed</h3>
                <p className="text-muted-foreground mt-2 mb-4">You have not listed any software on our platform yet.</p>
                <Button asChild>
                    <Link href={paths.partner.management}>List Your Software</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {software.map(product => (
                <Link key={product.id} href={paths.software(product.id)}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-4 flex items-start gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-muted/50 group-hover:bg-muted transition-colors">
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover"/>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-semibold group-hover:text-primary transition-colors">{product.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

function CustomerInfo({ customer }: { customer: Customer }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <FileClock className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold">Account Status</h3>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                                    customer.status === 'Active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {customer.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Last Contacted</p>
                                    {isClient ? <p className="font-medium">{new Date(customer.lastContacted).toLocaleDateString()}</p> : <Skeleton className="h-5 w-24 mt-1"/>}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Customer Since</p>
                                    {isClient ? <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p> : <Skeleton className="h-5 w-24 mt-1"/>}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {customer.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Notes from our team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ProfileForm({ 
    userProfile, 
    user, 
    onSave 
}: { 
    userProfile: UserProfile; 
    user: any; 
    onSave: (data: Partial<UserProfile>) => Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        companyName: userProfile.companyName || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            setIsEditing(false);
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: userProfile.firstName || '',
            lastName: userProfile.lastName || '',
            companyName: userProfile.companyName || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                    </Label>
                    <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter your first name"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter your last name"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                </Label>
                <Input
                    id="company"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter your company name"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                </Label>
                <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="bg-muted/50"
                />
                <p className="text-sm text-muted-foreground">
                    Contact support to change your email address
                </p>
            </div>

            {isEditing && (
                <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function AccountPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const auth = getAuth();
    
    const [associatedPartner, setAssociatedPartner] = useState<Partner | null>(null);
    const [associatedCustomer, setAssociatedCustomer] = useState<Customer | null>(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);


    const userProfileRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push(paths.login);
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
        // Wait until both user and profile are checked
        if (!isUserLoading && !isProfileLoading) {
            if (user && !userProfile) {
                // If user is logged in but has no profile, redirect
                router.push(paths.onboarding);
            } else {
                setIsCheckingProfile(false);
            }
        }
    }, [user, isUserLoading, userProfile, isProfileLoading, router]);
    
    useEffect(() => {
        const findAssociations = async () => {
            if (!firestore || !user?.email || !userProfile) return;

            // --- Check for Partner Association ---
            if (userProfile.role === 'seller') {
                const partnerQuery = query(collection(firestore, 'partners'), where('contactEmail', '==', user.email), where('status', '==', 'Published'));
                const partnerSnap = await getDocs(partnerQuery);
                if (!partnerSnap.empty) {
                    const partnerData = partnerSnap.docs[0].data() as Partner;
                    setAssociatedPartner(partnerData);
                    
                    // If partnerId is not yet linked on user profile, link it.
                    if (userProfile.partnerId !== partnerData.id) {
                        const userRef = doc(firestore, 'users', user.uid);
                        await updateDoc(userRef, { partnerId: partnerData.id });
                    }
                    return; // Stop after finding a partner association
                }
            }

            // --- Check for Customer Association ---
            const customerQuery = query(collection(firestore, 'customers'), where('email', '==', user.email));
            const customerSnap = await getDocs(customerQuery);
            if (!customerSnap.empty) {
                const customerDoc = customerSnap.docs[0];
                const customerData = customerDoc.data() as Customer;
                setAssociatedCustomer(customerData);

                // If customer exists but is not linked to a user, link it.
                if (!customerData.userId && user.uid) {
                    const customerRef = doc(firestore, 'customers', customerDoc.id);
                    await updateDoc(customerRef, { userId: user.uid });
                }
            }
        };

        findAssociations();
    }, [firestore, user, userProfile]);

    const handleSaveProfile = async (data: Partial<UserProfile>) => {
        if (!user || !firestore || !userProfileRef) return;

        try {
            // Update Firestore user profile
            await updateDoc(userProfileRef, data);

            // Update Firebase Auth display name if names changed
            if ((data.firstName || data.lastName) && user) {
                const displayName = `${data.firstName || userProfile?.firstName || ''} ${data.lastName || userProfile?.lastName || ''}`.trim();
                await updateProfile(user, { displayName });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push(paths.home);
    };

    if (isUserLoading || isProfileLoading || isCheckingProfile || !user || !userProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
                <div className="container max-w-5xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                </div>
            </div>
        );
    }
    
    const displayName = userProfile.firstName && userProfile.lastName 
        ? `${userProfile.firstName} ${userProfile.lastName}` 
        : user.displayName || user.email?.split('@')[0] || 'User';
    const fallback = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
            <div className="container max-w-5xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tighter font-headline sm:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        My Account
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Manage your profile, preferences, and platform activity in one place.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="sticky top-6">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback className="text-lg font-semibold">
                                            {fallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold">{displayName}</h2>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        {userProfile.companyName && (
                                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-2">
                                                <Building size={14}/>
                                                {userProfile.companyName}
                                            </p>
                                        )}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleLogout} 
                                        className="w-full"
                                    >
                                        <LogOut className="h-4 w-4 mr-2"/> 
                                        Sign Out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-6">
                                <Tabs defaultValue="profile" className="w-full">
                                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 bg-muted/50 p-1 rounded-lg">
                                        <TabsTrigger 
                                            value="profile" 
                                            className="flex items-center gap-2 data-[state=active]:shadow-sm"
                                        >
                                            <User className="h-4 w-4" />
                                            Profile
                                        </TabsTrigger>
                                        {associatedPartner && (
                                            <TabsTrigger 
                                                value="partner" 
                                                className="flex items-center gap-2 data-[state=active]:shadow-sm"
                                            >
                                                <Briefcase className="h-4 w-4" />
                                                My Software
                                            </TabsTrigger>
                                        )}
                                        {associatedCustomer && (
                                            <TabsTrigger 
                                                value="customer" 
                                                className="flex items-center gap-2 data-[state=active]:shadow-sm"
                                            >
                                                <FileClock className="h-4 w-4" />
                                                My Account
                                            </TabsTrigger>
                                        )}
                                    </TabsList>

                                    <div className="mt-6">
                                        <TabsContent value="profile" className="space-y-6">
                                            <ProfileForm 
                                                userProfile={userProfile} 
                                                user={user}
                                                onSave={handleSaveProfile}
                                            />
                                             {userProfile.role === 'seller' && !associatedPartner && (
                                                <Card className="bg-muted/50 border-dashed mt-6">
                                                    <CardContent className="p-8 text-center">
                                                        <Handshake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                                        <h3 className="text-xl font-semibold mb-2">Ready to List Your Software?</h3>
                                                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                            Complete your partner profile to start listing products. If you've already submitted, your application may be under review.
                                                        </p>
                                                        <Button asChild size="lg">
                                                            <Link href={paths.partners}>
                                                                Become a Partner 
                                                                <ExternalLink className="ml-2 h-4 w-4"/>
                                                            </Link>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                             )}
                                        </TabsContent>

                                        {associatedPartner && (
                                            <TabsContent value="partner">
                                                <div className="space-y-6">
                                                    <Card className="bg-blue-50 border-blue-200">
                                                        <CardHeader>
                                                            <CardTitle>Partner Dashboard</CardTitle>
                                                            <CardDescription>Manage your software listings and view your partner details.</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                             <Button asChild>
                                                                <Link href={paths.partner.management}>
                                                                    <LayoutGrid className="mr-2 h-4 w-4"/> Manage My Software
                                                                </Link>
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                    <h3 className="text-lg font-semibold">Your Software Products</h3>
                                                    <PartnerSoftware partner={associatedPartner} />
                                                </div>
                                            </TabsContent>
                                        )}

                                        {associatedCustomer && (
                                            <TabsContent value="customer">
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-semibold">Customer Information</h3>
                                                    <CustomerInfo customer={associatedCustomer}/>
                                                </div>
                                            </TabsContent>
                                        )}
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
