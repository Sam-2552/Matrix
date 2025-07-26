"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const NO_AGENCY_ITEM_VALUE = "__NO_AGENCY_SELECTED__"; // Ensure this is not an empty string

export default function ManageUrlsPage() {
  const { urls, addUrl, agencies, currentUser } = useAppContext();
  const [newUrlLink, setNewUrlLink] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
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

  const handleAddUrl = () => {
    if (newUrlLink.trim()) {
      if (!newUrlLink.startsWith('http://') && !newUrlLink.startsWith('https://')) {
        alert('Please enter a valid URL (starting with http:// or https://)');
        return;
      }
      addUrl(newUrlLink.trim(), selectedAgencyId);
      setNewUrlLink('');
      setSelectedAgencyId(null); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Link2 className="mr-2 h-8 w-8 text-primary"/>Manage URLs</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add New URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-0 md:flex md:space-x-4 md:items-end">
          <div className="flex-grow">
            <label htmlFor="urlLink" className="block text-sm font-medium text-muted-foreground mb-1">URL Link</label>
            <Input
              id="urlLink"
              type="url"
              placeholder="https://example.com"
              value={newUrlLink}
              onChange={(e) => setNewUrlLink(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <label htmlFor="agencySelect" className="block text-sm font-medium text-muted-foreground mb-1">Assign to Agency (Optional)</label>
            <Select
              value={selectedAgencyId || NO_AGENCY_ITEM_VALUE} 
              onValueChange={(value) => {
                if (value === NO_AGENCY_ITEM_VALUE) {
                  setSelectedAgencyId(null);
                } else {
                  setSelectedAgencyId(value);
                }
              }}
            >
              <SelectTrigger id="agencySelect" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_AGENCY_ITEM_VALUE}>No Agency</SelectItem>
                {agencies.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddUrl} disabled={!newUrlLink.trim()} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add URL
          </Button>
        </CardContent>
      </Card>

      {urls.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {urls.map(url => {
              const agency = agencies.find(a => a.id === url.agencyId);
              return (
                <Card key={url.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg truncate flex items-center">
                      <Link2 className="mr-2 h-5 w-5 text-primary flex-shrink-0"/>
                      <a href={url.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{url.link}</a>
                    </CardTitle>
                    <CardDescription>ID: {url.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agency ? (
                      <p className="text-sm text-muted-foreground">Agency: <span className="font-semibold text-foreground">{agency.name}</span></p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No agency assigned.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
         <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><List className="mr-2 h-6 w-6 text-muted-foreground" />No URLs Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first URL using the form above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
