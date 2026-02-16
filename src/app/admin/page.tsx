
'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Handshake, LayoutGrid, MessageSquareQuote, Users } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Inquiry, Customer, Partner, SoftwareProduct } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { paths } from "@/lib/paths";

export default function AdminDashboard() {
  const { firestore } = useFirebase();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const thirtyDaysAgoISO = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }, []);

  // Queries
  const newInquiriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'inquiries'), where('createdAt', '>=', thirtyDaysAgoISO)) : null, [firestore, thirtyDaysAgoISO]);
  const newCustomersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'customers'), where('createdAt', '>=', thirtyDaysAgoISO)) : null, [firestore, thirtyDaysAgoISO]);
  const recentInquiriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'inquiries'), orderBy('createdAt', 'desc'), limit(5)) : null, [firestore]);
  const partnersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'partners') : null, [firestore]);
  const softwareQuery = useMemoFirebase(() => firestore ? collection(firestore, 'softwareProducts') : null, [firestore]);

  // Data fetching
  const { data: newInquiries, isLoading: inquiriesLoading } = useCollection<Inquiry>(newInquiriesQuery);
  const { data: newCustomers, isLoading: customersLoading } = useCollection<Customer>(newCustomersQuery);
  const { data: recentInquiries, isLoading: recentInquiriesLoading } = useCollection<Inquiry>(recentInquiriesQuery);
  const { data: partners, isLoading: partnersLoading } = useCollection<Partner>(partnersQuery);
  const { data: software, isLoading: softwareLoading } = useCollection<SoftwareProduct>(softwareQuery);

  const isLoading = inquiriesLoading || customersLoading || recentInquiriesLoading || partnersLoading || softwareLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Inquiries (30d)</CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-bold">{newInquiries?.length ?? 0}</div>}
             <p className="text-xs text-muted-foreground">
              New leads from the past 30 days.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers (30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-bold">{newCustomers?.length ?? 0}</div>}
             <p className="text-xs text-muted-foreground">
              New customers signed up in the last 30 days.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Software</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-bold">{software?.length ?? 0}</div>}
             <p className="text-xs text-muted-foreground">
              Total products on the platform.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4"/> : <div className="text-2xl font-bold">{partners?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">
              Total partners in the ecosystem.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inquiries</CardTitle>
          <CardDescription>
            New customer requests from the support form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Inquiry Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(5)].map((_, i) => (
                 <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24 mb-1"/>
                      <Skeleton className="h-3 w-32"/>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell>
                    <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto"/></TableCell>
                </TableRow>
              ))}
              {!isLoading && recentInquiries?.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="font-medium">{inquiry.firstName} {inquiry.lastName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {inquiry.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inquiry.status === 'New' ? 'default' : 'secondary'}>{inquiry.status}</Badge>
                  </TableCell>
                  <TableCell>{isClient ? new Date(inquiry.createdAt).toLocaleDateString() : <Skeleton className="h-4 w-20"/>}</TableCell>
                  <TableCell className="text-right">{inquiry.inquiryType}</TableCell>
              </TableRow>
              ))}
              {!isLoading && recentInquiries?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recent inquiries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    