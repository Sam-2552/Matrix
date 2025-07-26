
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const { login, currentUser, isLoading: isAppLoading } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [currentUser, router]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Login Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    setIsLoggingIn(true);
    const success = login(username, password);
    
    if (!success) {
      setIsLoggingIn(false);
    }
    // Redirect is handled by useEffect
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };


  // Show a loading screen while the app is loading initial data or if redirecting
  if (isAppLoading || currentUser) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">{currentUser ? 'Redirecting...' : 'Loading application...'}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Matrix</CardTitle>
          <CardDescription>Please sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</label>
                <Input 
                    id="username" 
                    placeholder="e.g., admin" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoggingIn}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password"  className="text-sm font-medium text-muted-foreground">Password</label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoggingIn}
                />
            </div>
          </div>
          <Button onClick={handleLogin} className="w-full" disabled={!username || !password || isLoggingIn}>
            {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-y-2 text-xs p-6 pt-0">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Hint:</span> You can use one of the default accounts:
          </p>
          <ul className="list-disc list-inside text-muted-foreground w-full space-y-1">
            <li><span className="font-medium">Admin:</span> admin / password</li>
            <li><span className="font-medium">User 1:</span> user1 / password</li>
            <li><span className="font-medium">User 2:</span> user2 / password</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}

    