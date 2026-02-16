
'use client';

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
  LifeBuoy,
  MessageSquareQuote,
  Settings,
  Users,
  LayoutGrid,
  DatabaseZap,
  Handshake,
  Quote,
  DollarSign,
  FolderKanban
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { paths } from '@/lib/paths';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                isActive={pathname === paths.admin.dashboard}
                tooltip="Dashboard"
              >
                <Link href={paths.admin.dashboard}>
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.software)}
                tooltip="Software"
              >
                <Link href={paths.admin.software}>
                  <LayoutGrid />
                  <span>Software</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.categories)}
                tooltip="Categories"
              >
                <Link href={paths.admin.categories}>
                  <FolderKanban />
                  <span>Categories</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.partners)}
                tooltip="Partners"
              >
                <Link href={paths.admin.partners}>
                  <Handshake />
                  <span>Partners</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.inquiries)}
                tooltip="Inquiries"
              >
                <Link href={paths.admin.inquiries}>
                  <MessageSquareQuote />
                  <span>Support Inquiries</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.salesInquiries)}
                tooltip="Sales Inquiries"
              >
                <Link href={paths.admin.salesInquiries}>
                  <DollarSign />
                  <span>Sales Inquiries</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.customers())}
                tooltip="Customers"
              >
                <Link href={paths.admin.customers()}>
                  <Users />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.testimonials)}
                tooltip="Testimonials"
              >
                <Link href={paths.admin.testimonials}>
                  <Quote />
                  <span>Testimonials</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(paths.admin.users)}
                tooltip="Users"
              >
                <Link href={paths.admin.users}>
                  <Users />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith(paths.admin.migrate)} tooltip="Migrate Data">
                  <Link href={paths.admin.migrate}>
                    <DatabaseZap />
                    <span>Data Migration</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === paths.admin.settings} tooltip="Settings">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
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
            <AvatarImage src="https://picsum.photos/seed/admin-avatar/100/100" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
