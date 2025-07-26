"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Briefcase } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManageAgenciesPage() {
  const { agencies, addAgency, getUrlsForAgency, currentUser } = useAppContext();
  const [newAgencyName, setNewAgencyName] = useState('');
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

  const handleAddAgency = () => {
    if (newAgencyName.trim()) {
      addAgency(newAgencyName.trim());
      setNewAgencyName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Briefcase className="mr-2 h-8 w-8 text-primary" />Manage Agencies</h1>
        <div className="flex space-x-2">
          <Input 
            type="text" 
            placeholder="New agency name" 
            value={newAgencyName}
            onChange={(e) => setNewAgencyName(e.target.value)}
            className="w-auto"
          />
          <Button onClick={handleAddAgency} disabled={!newAgencyName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Agency
          </Button>
        </div>
      </div>

      {agencies.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map(agency => (
              <Card key={agency.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>{agency.name}</CardTitle>
                  <CardDescription>ID: {agency.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-1">Associated URLs:</h4>
                  {getUrlsForAgency(agency.id).length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-muted-foreground max-h-32 overflow-y-auto">
                      {getUrlsForAgency(agency.id).map(url => (
                        <li key={url.id} className="truncate">{url.link}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No URLs associated.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><List className="mr-2 h-6 w-6 text-muted-foreground" />No Agencies Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first agency using the form above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
