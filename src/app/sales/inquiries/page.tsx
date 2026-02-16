import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquareQuote } from "lucide-react";

export default function InquiriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Customer Inquiries</h1>
       <Card>
        <CardHeader>
          <CardTitle>Manage Inquiries</CardTitle>
          <CardDescription>
            This is a placeholder page for managing customer inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-96">
            <MessageSquareQuote className="h-16 w-16 text-muted-foreground mb-4"/>
            <h3 className="text-xl font-semibold">No New Inquiries</h3>
            <p className="text-muted-foreground">New inquiries from customers will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
