import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Customers</h1>
       <Card>
        <CardHeader>
          <CardTitle>Manage Customers</CardTitle>
          <CardDescription>
            This is a placeholder page for managing customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-96">
            <Users className="h-16 w-16 text-muted-foreground mb-4"/>
            <h3 className="text-xl font-semibold">No Customers Yet</h3>
            <p className="text-muted-foreground">New customers will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
