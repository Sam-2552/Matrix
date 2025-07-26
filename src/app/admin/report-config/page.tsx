
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Trash2, ClipboardList, Waves, ShieldCheck, ShieldX, GitBranch } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Wave, WaveStatus } from '@/types';

export default function ManageReportConfigPage() {
  const { 
    reportCategories, addReportCategory, deleteReportCategory, 
    waves, addWave, updateWaveStatus,
    currentUser 
  } = useAppContext();
  
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addReportCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    deleteReportCategory(categoryId);
  };

  const handleAddWave = () => {
    if (newWaveName.trim()) {
      const nextWaveNumber = waves.length > 0 ? Math.max(...waves.map(w => w.number)) + 1 : 1;
      addWave(newWaveName.trim(), nextWaveNumber);
      setNewWaveName('');
    }
  };

  const handleUpdateWaveStatus = (wave: Wave, newStatus: WaveStatus) => {
    updateWaveStatus(wave.id, newStatus);
  };

  const getStatusBadge = (status: WaveStatus) => {
    switch(status) {
      case 'draft': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'published': return <Badge variant="secondary" className="bg-green-100 text-green-800">Published</Badge>;
      case 'frozen': return <Badge variant="destructive">Frozen</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><ClipboardList className="mr-2 h-8 w-8 text-primary" />Report Configuration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manage Report Categories Section */}
        <div className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Manage Report Categories</CardTitle>
              <CardDescription>Add or remove categories for report sections.</CardDescription>
            </CardHeader>
            <CardContent className="flex space-x-2">
              <Input 
                type="text" 
                placeholder="e.g., Social Media" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-auto flex-grow"
              />
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </CardContent>
          </Card>
          
          {reportCategories.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="space-y-3 pr-4">
                {reportCategories.map(category => (
                  <Card key={category.id} className="shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-3 flex items-center justify-between">
                      <p className="font-medium">{category.name}</p>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the "{category.name}" category.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="text-center py-12 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-xl"><List className="mr-2 h-6 w-6 text-muted-foreground" />No Categories Yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Add your first category.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Manage Waves Section */}
        <div className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Manage Waves</CardTitle>
              <CardDescription>Add or view reporting waves.</CardDescription>
            </CardHeader>
            <CardContent className="flex space-x-2">
              <Input 
                type="text" 
                placeholder="New wave name (e.g., Q3)" 
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
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="space-y-3 pr-4">
                {waves.sort((a,b) => b.number - a.number).map(wave => (
                  <Card key={wave.id} className="shadow-sm hover:shadow-md transition-shadow duration-300">
                     <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center"><Waves className="mr-2 h-5 w-5 text-primary"/>{wave.name}</span>
                        {getStatusBadge(wave.status)}
                      </CardTitle>
                      <CardDescription>Wave Number: {wave.number}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Created: {format(new Date(wave.createdAt), "PPp")}</p>
                        <div className="flex justify-end gap-2">
                            {wave.status === 'draft' && (
                                <Button size="sm" onClick={() => handleUpdateWaveStatus(wave, 'published')}>
                                    <ShieldCheck className="mr-2 h-4 w-4"/> Publish
                                </Button>
                            )}
                            {wave.status === 'published' && (
                                <Button size="sm" variant="destructive" onClick={() => handleUpdateWaveStatus(wave, 'frozen')}>
                                    <ShieldX className="mr-2 h-4 w-4"/> Freeze
                                </Button>
                            )}
                        </div>
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
                <p className="text-muted-foreground">Add your first wave.</p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
