
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleAdminToggle = async (user: UserProfile, isAdmin: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userRef, { isAdmin });
      toast({
        title: 'Permissions Updated',
        description: `${user.firstName} ${user.lastName} is now ${isAdmin ? 'an admin' : 'not an admin'}.`,
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update user admin status.',
      });
    }
  };

  const handleRoleChange = async (user: UserProfile, role: 'buyer' | 'seller') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userRef, { role });
      toast({
        title: 'Role Updated',
        description: `${user.firstName} ${user.lastName}'s role is now a ${role === 'buyer' ? 'Customer' : 'Partner'}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update user role.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Grant or revoke admin privileges and manage user roles.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all registered users on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Admin Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading &&
                users?.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.firstName?.charAt(0)}
                            {user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.companyName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                       <Select
                          value={user.role}
                          onValueChange={(value: 'buyer' | 'seller') => handleRoleChange(user, value)}
                          disabled={user.uid === currentUser?.uid}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">Customer</SelectItem>
                            <SelectItem value="seller">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`admin-switch-${user.uid}`}
                          checked={user.isAdmin}
                          onCheckedChange={(checked) => handleAdminToggle(user, checked)}
                          disabled={user.uid === currentUser?.uid}
                          aria-label="Admin status"
                        />
                         <Label htmlFor={`admin-switch-${user.uid}`} className="text-sm text-muted-foreground">
                            {user.isAdmin ? 'Admin' : 'User'}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && users?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-96 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <Users className="h-16 w-16 text-muted-foreground mb-4"/>
                                <h3 className="text-xl font-semibold">No Users Found</h3>
                                <p className="text-muted-foreground">New users will appear here once they sign up.</p>
                            </div>
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

    