
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Waves } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function ManageWavesPage() {
  const { waves, addWave, currentUser } = useAppContext();
  const [newWaveName, setNewWaveName] = useState('');
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

  const handleAddWave = () => {
    if (newWaveName.trim()) {
      const nextWaveNumber = waves.length > 0 ? Math.max(...waves.map(w => w.number)) + 1 : 1;
      addWave(newWaveName.trim(), nextWaveNumber);
      setNewWaveName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Waves className="mr-2 h-8 w-8 text-primary" />Manage Waves</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add New Wave</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-2">
           <Input 
            type="text" 
            placeholder="New wave name (e.g., Q3 Review)" 
            value={newWaveName}
            onChange={(e) => setNewWaveName(e.target.value)}
            className="w-auto flex-grow"
          />
          <Button onClick={handleAddWave} disabled={!newWaveName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Wave
          </Button>
        </CardContent>
      </Card>
      
      {waves.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {waves.sort((a,b) => a.number - b.number).map(wave => (
              <Card key={wave.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><Waves className="mr-2 h-5 w-5 text-primary"/>{wave.name}</CardTitle>
                  <CardDescription>Wave Number: {wave.number}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Created: {format(new Date(wave.createdAt), "PPp")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><List className="mr-2 h-6 w-6 text-muted-foreground" />No Waves Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first wave using the form above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
