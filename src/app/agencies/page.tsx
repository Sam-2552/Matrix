"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tags, Link2 } from 'lucide-react';
import { useSession } from "next-auth/react";

export default function ViewAgenciesPage() {
  const { agencies, getUrlsForAgency } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  // In a real app, filter agencies based on user's tasks/permissions
  const accessibleAgencies = agencies; 

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center"><Tags className="mr-2 h-8 w-8 text-primary"/>View Agencies</h1>
      <p className="text-muted-foreground">Browse available agencies and their associated URLs.</p>

      {accessibleAgencies.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accessibleAgencies.map(agency => (
              <Card key={agency.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><Tags className="mr-2 h-5 w-5 text-primary"/>{agency.name}</CardTitle>
                  <CardDescription>ID: {agency.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2 flex items-center"><Link2 className="mr-1 h-4 w-4 text-muted-foreground"/>Associated URLs:</h4>
                  {getUrlsForAgency(agency.id).length > 0 ? (
                    <ScrollArea className="h-40">
                    <ul className="space-y-1 text-sm">
                      {getUrlsForAgency(agency.id).map(url => (
                        <li key={url.id} className="flex items-center">
                          <Link2 className="mr-2 h-3 w-3 text-primary flex-shrink-0"/>
                          <a href={url.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:underline truncate" title={url.link}>
                            {url.link}
                          </a>
                        </li>
                      ))}
                    </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No URLs associated with this agency.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><Tags className="mr-2 h-6 w-6 text-muted-foreground" />No Agencies Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">There are currently no agencies accessible to you.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
