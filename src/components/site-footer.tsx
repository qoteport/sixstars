import { Hexagon } from 'lucide-react';
import Link from 'next/link';
import { paths } from '@/lib/paths';

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
        <div className="flex items-center space-x-2">
          <Hexagon className="h-6 w-6 text-primary" />
          <span className="font-bold">sixstars</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sixstars Inc. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link href={paths.terms} className="text-sm hover:underline">
            Terms of Service
          </Link>
          <Link href={paths.privacy} className="text-sm hover:underline">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
