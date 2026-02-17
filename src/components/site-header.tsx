
'use client';

import Link from 'next/link';
import { Hexagon, Menu, Briefcase, Handshake, LayoutGrid, LifeBuoy, UserCircle, DollarSign } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

const mainNavLinks = [
  { href: paths.software(), label: 'Software', icon: LayoutGrid },
  { href: paths.sales, label: 'Sales', icon: DollarSign },
];

const secondaryNavLinks = [
  { href: paths.support, label: 'Support', icon: LifeBuoy },
  { href: paths.partners, label: 'Partners', icon: Handshake },
  { href: paths.account, label: 'Account', icon: UserCircle },
];

const allNavLinks = [...mainNavLinks, ...secondaryNavLinks];


export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => user ? firestore ? doc(firestore, 'users', user.uid) : null : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6 md:mx-auto">
        <div className="mr-4 flex">
          <Link href={paths.home} className="mr-6 flex items-center space-x-2">
            <Hexagon className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">sixstars</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {allNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname.startsWith(href) ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {label}
              </Link>
            ))}
            {isClient && userProfile?.role === 'seller' && (
                 <Link
                    key={paths.partner.management}
                    href={paths.partner.management}
                    className={cn(
                        'transition-colors hover:text-foreground/80',
                        pathname.startsWith('/partner') ? 'text-foreground' : 'text-foreground/60'
                    )}
                >
                    Partner Portal
                </Link>
            )}
            {isClient && userProfile?.isAdmin && (
                 <Link
                    key={paths.admin.dashboard}
                    href={paths.admin.dashboard}
                    className={cn(
                        'transition-colors hover:text-foreground/80',
                        pathname.startsWith('/admin') ? 'text-foreground' : 'text-foreground/60'
                    )}
                >
                    Admin
                </Link>
            )}
          </nav>
        </div>

        {/* Mobile Nav items */}
        <nav className="flex items-center gap-4 text-sm md:hidden">
            {mainNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname.startsWith(href) ? 'text-foreground font-semibold' : 'text-foreground/60'
                )}
              >
                {label}
              </Link>
            ))}
        </nav>

        <div className="flex flex-1 items-center justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col space-y-4">
                <Link href={paths.home} className="mr-6 flex items-center space-x-2">
                  <Hexagon className="h-6 w-6 text-primary" />
                  <span className="font-bold">sixstars</span>
                </Link>
                <div className="flex flex-col space-y-2">
                  {/* Render only secondary links in the sheet now */}
                  {secondaryNavLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-2 rounded-md p-2 text-sm',
                        pathname.startsWith(href)
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  ))}
                  {isClient && userProfile?.role === 'seller' && (
                     <Link
                        key={paths.partner.management}
                        href={paths.partner.management}
                        className={cn(
                            'flex items-center gap-2 rounded-md p-2 text-sm',
                            pathname.startsWith('/partner')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50'
                        )}
                    >
                        <Briefcase className="h-5 w-5" />
                        Partner Portal
                    </Link>
                   )}
                   {isClient && userProfile?.isAdmin && (
                     <Link
                        key={paths.admin.dashboard}
                        href={paths.admin.dashboard}
                        className={cn(
                            'flex items-center gap-2 rounded-md p-2 text-sm',
                            pathname.startsWith('/admin')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50'
                        )}
                    >
                        <Briefcase className="h-5 w-5" />
                        Admin
                    </Link>
                   )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
