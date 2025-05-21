"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users2, UserCog, User, Trash2 } from 'lucide-react';
import type { UserRole } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManageUsersPage() {
  const { users, addUser, currentUser, deleteUser } = useAppContext();
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.role !== 'admin') {
      router.replace('/dashboard'); 
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  const handleAddUser = () => {
    if (newUserName.trim() && newUserEmail.trim() && newUserPassword.trim()) {
      addUser(newUserName.trim(), newUserEmail.trim(), newUserPassword, newUserRole);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      await deleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight flex items-center"><Users2 className="mr-2 h-8 w-8 text-primary"/>Manage Users</h1>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-0 md:flex md:space-x-4 md:items-end">
          <div className="flex-grow">
             <label htmlFor="userName" className="block text-sm font-medium text-muted-foreground mb-1">User Name</label>
            <Input 
              id="userName"
              type="text" 
              placeholder="Full name" 
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </div>
          <div className="flex-grow">
            <label htmlFor="userEmail" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <Input
              id="userEmail"
              type="email"
              placeholder="Email address"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          <div className="flex-grow">
            <label htmlFor="userPassword" className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <Input
              id="userPassword"
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <label htmlFor="userRole" className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
            <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
              <SelectTrigger id="userRole" className="w-full md:w-[150px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddUser} disabled={!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()} className="w-full md:w-auto">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </CardContent>
      </Card>

      {users.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map(user => (
              <Card key={user.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        {user.role === 'admin' ? <UserCog className="mr-2 h-5 w-5 text-primary"/> : <User className="mr-2 h-5 w-5 text-primary"/>}
                        {user.name}
                      </CardTitle>
                      <CardDescription>ID: {user.id} - Role: <span className="capitalize font-medium text-foreground">{user.role}</span></CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      className="h-8 w-8 flex-shrink-0"
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Additional user details or actions can be added here */}
                  <p className="text-sm text-muted-foreground">No tasks assigned yet.</p> 
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><Users2 className="mr-2 h-6 w-6 text-muted-foreground" />No Users Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first user using the form above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
