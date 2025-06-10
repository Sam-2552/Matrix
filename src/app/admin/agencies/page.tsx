"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Briefcase, MessageSquare, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from "next-auth/react";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

export default function ManageAgenciesPage() {
  const { agencies, addAgency, getUrlsForAgency, tasks, addTaskComment, deleteAgency } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newAgencyName, setNewAgencyName] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // Changed any to Task | null
  const [replyText, setReplyText] = useState('');

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const handleAddAgency = () => {
    if (newAgencyName.trim()) {
      addAgency(newAgencyName.trim());
      setNewAgencyName('');
    }
  };

  const handleReply = async () => {
    if (selectedTask && replyText.trim()) {
      // selectedTask.id is number, addTaskComment expects number
      await addTaskComment(selectedTask.id, replyText);
      setReplyText('');
      setSelectedTask(null);
    }
  };

  const getTasksForAgency = (agencyId: string) => {
    return tasks.filter(task => task.assignedAgencyId === agencyId);
  };

  const handleDeleteAgency = async (agencyId: string) => {
    if (window.confirm('Are you sure you want to delete this agency? This action cannot be undone.')) {
      await deleteAgency(agencyId);
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
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>{agency.name}</CardTitle>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAgency(agency.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>ID: {agency.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
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
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Task Comments:</h4>
                    {getTasksForAgency(agency.id).length > 0 ? (
                      <div className="space-y-2">
                        {getTasksForAgency(agency.id).map(task => (
                          <Dialog key={task.id}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                onClick={() => setSelectedTask(task)}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {task.title} - {task.comments.length} comments
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Task Comments</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  {task.comments.map((comment: any) => (
                                    <div key={comment.id} className={`p-2 rounded ${comment.isAdminReply ? 'bg-primary/10' : 'bg-muted'}`}>
                                      <div 
                                        className="text-sm prose prose-sm max-w-none prose-headings:my-2 prose-p:my-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline"
                                        dangerouslySetInnerHTML={{ 
                                          __html: DOMPurify.sanitize(comment.text, {
                                            ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'prompt', 'img'],
                                            ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style', 'prompt', 'onerror']
                                          })
                                        }}
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {format(comment.timestamp, 'PPpp')}
                                        {comment.isAdminReply ? ' (Admin)' : ' (User)'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                  />
                                  <Button onClick={handleReply} disabled={!replyText.trim()}>
                                    Send Reply
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tasks with comments.</p>
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
