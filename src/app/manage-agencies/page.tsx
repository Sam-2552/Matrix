"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Tags, Loader2 } from 'lucide-react';
import type { Agency } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { CommentEditor } from '@/components/comment-editor';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';

interface AgencyComment {
  text: string;
  timestamp: number;
}

interface AgencyWithComments extends Agency {
  comments?: string;
}

export default function ManageAgenciesPage() {
  const { agencies: allAgencies } = useAppContext();
  const router = useRouter();
  const [agencies, setAgencies] = useState<AgencyWithComments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch comments for each agency
        const agenciesWithComments = await Promise.all(
          allAgencies.map(async (agency) => {
            try {
              const response = await fetch('/api/db', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'getAgencyComments',
                  agencyId: agency.id
                })
              });

              if (!response.ok) {
                throw new Error('Failed to fetch comments');
              }

              const data = await response.json();
              return { ...agency, comments: data.comments || '' };
            } catch (error) {
              console.error(`Error fetching comments for agency ${agency.id}:`, error);
              return { ...agency, comments: '' };
            }
          })
        );

        setAgencies(agenciesWithComments);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch agency data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [allAgencies, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
        <Building2 className="mr-2 h-8 w-8 text-primary"/>Manage Agencies
      </h1>
      <p className="text-muted-foreground">View and manage all agencies in the system.</p>

      {agencies.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map(agency => (
              <Card key={agency.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-primary flex-shrink-0"/>
                    {agency.name}
                  </CardTitle>
                  <CardDescription>ID: {agency.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  {agency.comments && agency.comments.trim() !== '' && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-semibold mb-2">Comments:</h4>
                      <ScrollArea className="h-40">
                        <div 
                          className="text-xs bg-background p-2 rounded border prose prose-sm max-w-none prose-headings:my-2 prose-p:my-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline"
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(agency.comments, {
                                ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'prompt', 'img'],
                                ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style', 'onerror']
                              })
                          }}
                        />
                      </ScrollArea>
                    </div>
                  )}
                  <div className="mt-4">
                    <CommentEditor
                      onSave={async (comment) => {
                        try {
                          const response = await fetch('/api/db', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              action: 'updateAgencyComments',
                              agencyId: agency.id,
                              comments: comment
                            })
                          });

                          if (!response.ok) {
                            throw new Error('Failed to save comment');
                          }

                          setAgencies(prev => prev.map(a =>
                            a.id === agency.id ? { ...a, comments: comment } : a
                          ));

                          toast({
                            title: "Success",
                            description: "Comment saved successfully",
                          });
                        } catch (error) {
                          console.error('Error saving comment:', error);
                          toast({
                            title: "Error",
                            description: error instanceof Error ? error.message : "Failed to save comment",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <Building2 className="mr-2 h-6 w-6 text-muted-foreground" />No Agencies Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">There are no agencies in the system yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 