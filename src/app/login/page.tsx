
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Hexagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paths } from '@/lib/paths';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export default function LoginPage() {
    const { auth } = useFirebase();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [emailForSignIn, setEmailForSignIn] = useState('');
    const [isLoading, setIsLoading] = useState<'google' | 'email' | 'checking' | false>(false);
    const [emailSent, setEmailSent] = useState(false);

    // Redirect if user is already logged in
    useEffect(() => {
        if (!isUserLoading && user) {
            router.push(paths.account);
        }
    }, [user, isUserLoading, router]);

    // Handle email link sign-in on component mount
    useEffect(() => {
        if (auth && isSignInWithEmailLink(auth, window.location.href)) {
            setIsLoading('checking');
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            if(email) {
                signInWithEmailLink(auth, email, window.location.href)
                .then(() => {
                    window.localStorage.removeItem('emailForSignIn');
                    router.push(paths.account);
                })
                .catch((error) => {
                    toast({ variant: 'destructive', title: 'Sign-in failed', description: error.message });
                    setIsLoading(false);
                });
            } else {
                 toast({ variant: 'destructive', title: 'Sign-in failed', description: 'Email is required to complete sign-in.' });
                 setIsLoading(false);
            }
        }
    }, [auth, router, toast]);

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setIsLoading('google');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push(paths.account);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Google sign-in failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLinkSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !emailForSignIn) return;
        setIsLoading('email');

        const actionCodeSettings = {
            url: window.location.origin + paths.login,
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, emailForSignIn, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', emailForSignIn);
            setEmailSent(true);
            toast({ title: 'Check your email', description: 'A sign-in link has been sent to your email address.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to send email', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (isUserLoading || isLoading === 'checking' || user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
             <div className="absolute top-8 left-8">
                 <Link href={paths.home} className="flex items-center space-x-2">
                    <Hexagon className="h-6 w-6 text-primary" />
                    <span className="font-bold">sixstars</span>
                </Link>
             </div>

            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                     <Image src="https://picsum.photos/seed/login/400/200" data-ai-hint="abstract texture" width={400} height={200} alt="Login header" className="rounded-t-lg -mt-6 -mx-6 w-[calc(100%+48px)] max-w-none"/>
                     <div className="p-6 pb-0">
                        <CardTitle className="text-2xl font-extrabold">Welcome Back</CardTitle>
                        <CardDescription>Sign in to manage your account and software.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button 
                        variant="outline" 
                        className="w-full h-12 text-base" 
                        onClick={handleGoogleSignIn}
                        disabled={!!isLoading}
                    >
                        {isLoading === 'google' ? <Loader2 className="animate-spin"/> : <GoogleIcon />}
                        <span className="ml-3">Sign in with Google</span>
                    </Button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    
                    {emailSent ? (
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <Mail className="mx-auto h-10 w-10 text-green-600 mb-2"/>
                            <h3 className="font-semibold text-green-800">Check Your Inbox</h3>
                            <p className="text-sm text-green-700">A sign-in link has been sent to <span className="font-bold">{emailForSignIn}</span>. Click the link to complete your sign in.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailLinkSignIn} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={emailForSignIn}
                                onChange={(e) => setEmailForSignIn(e.target.value)}
                                required
                                className="h-12 text-base"
                            />
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base"
                                disabled={!!isLoading}
                            >
                                {isLoading === 'email' ? <Loader2 className="animate-spin" /> : "Sign in with Email"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
