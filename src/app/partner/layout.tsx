
'use client';

import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Briefcase,
  Hexagon,
  Home,
  LayoutGrid,
  Settings,
  Users,
  Loader2,
  BarChart,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { paths } from '@/lib/paths';
import type { UserProfile, Partner } from '@/lib/types';


export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoading, setIsLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
        router.push(paths.login);
        return;
    }

    const checkPartnerStatus = async () => {
        if (!firestore) return;
        const userProfileRef = doc(firestore, 'users', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
            const userProfile = userProfileSnap.data() as UserProfile;
            if (userProfile.role !== 'seller' || !userProfile.partnerId) {
                 router.push(paths.account); // Not a seller or no partnerId
                 return;
            }
            
            const partnerRef = doc(firestore, 'partners', userProfile.partnerId);
            const partnerSnap = await getDoc(partnerRef);

            if (partnerSnap.exists() && partnerSnap.data().status === 'Published') {
                setPartner(partnerSnap.data() as Partner);
                setIsLoading(false);
            } else {
                // Partner not found or not published yet
                toast({
                    title: "Application Pending",
                    description: "Your partner application is still under review. You'll get access to the portal once approved.",
                    duration: 5000,
                });
                router.push(paths.account);
            }

        } else {
            router.push(paths.onboarding); // No profile, go to onboarding
        }
    };

    checkPartnerStatus();
  }, [user, isUserLoading, firestore, router]);


  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="left">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2">
            <Hexagon className="size-6 text-primary" />
            <span className="text-lg font-semibold">sixstars</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === paths.partner.management}
                tooltip="Management"
              >
                <Link href={paths.partner.management}>
                  <LayoutGrid />
                  <span>Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Account" isActive={pathname === paths.account}>
                  <Link href={paths.account}>
                    <UserCircle />
                    <span>My Account</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Main Site">
                  <Link href={paths.home}>
                    <Briefcase />
                    <span>Back to Site</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or search here */}
          </div>
          <Avatar>
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
