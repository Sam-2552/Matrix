
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChartSquare, CheckCircle, User, Briefcase, Link2, PlusCircle, Trash2, Waves, Save, Check, X } from 'lucide-react';
import type { AppUser, Agency, UrlItem, Wave, WaveAssignment } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- Reusable MultiSelect Component ---
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  onDeselect: (value: string) => void;
  placeholder?: string;
  className?: string;
  // New prop to filter out options that are globally assigned
  globallySelectedValues?: string[];
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onSelect, onDeselect, placeholder = "Select items...", className, globallySelectedValues = [] }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setOpen(false); // Close on select
  };

  // Options available for selection in the dropdown
  // It should show items already selected for the current context
  // And items that are not globally selected by anyone else
  const availableOptions = options.filter(option => 
    selectedValues.includes(option.value) || !globallySelectedValues.includes(option.value)
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="truncate">{placeholder}</span>
            <PlusCircle className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
       <div className="space-x-1 space-y-1">
        {selectedValues.map(value => {
            // Now, we use the original 'options' prop which contains all possible items
            // to find the label. This ensures we always find it, even if it's assigned.
            const label = options.find(o => o.value === value)?.label || value;
            return (
                <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                    <span className="truncate" title={label}>{label}</span>
                    <button onClick={() => onDeselect(value)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                        <X className="h-3 w-3"/>
                    </button>
                </span>
            );
        })}
       </div>
    </div>
  );
};


export default function AssignTaskPage() {
  const { users, agencies, urls, waves, addWave, tasks, saveWaveAssignments, currentUser } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedWaveId, setSelectedWaveId] = useState<string>('');
  const [waveDescription, setWaveDescription] = useState('');
  const [newWaveName, setNewWaveName] = useState('');
  const [assignments, setAssignments] = useState<Record<string, WaveAssignment>>({});

  const availableUsers = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.role !== 'admin') {
      router.replace('/dashboard'); 
    }
  }, [currentUser, router]);
  
  // Effect to load existing assignments when a wave is selected
  useEffect(() => {
    if (selectedWaveId) {
      const waveTasks = tasks.filter(t => t.waveId === selectedWaveId);
      const existingAssignments: Record<string, WaveAssignment> = {};
      waveTasks.forEach(task => {
        existingAssignments[task.userId] = {
          assignedAgencyIds: task.assignedAgencyIds || [],
          assignedUrlIds: task.assignedUrlIds || []
        };
      });
      setAssignments(existingAssignments);
      
      const wave = waves.find(w => w.id === selectedWaveId);
      setWaveDescription(wave?.description || '');

    } else {
      setAssignments({});
      setWaveDescription('');
    }
  }, [selectedWaveId, tasks, waves]);

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  // --- Memoized calculations for available items ---
  const allAssignedAgencyIds = useMemo(() => Object.values(assignments).flatMap(a => a.assignedAgencyIds), [assignments]);
  const allAssignedUrlIds = useMemo(() => Object.values(assignments).flatMap(a => a.assignedUrlIds), [assignments]);
  
  const allAgencyOptions = useMemo(() => agencies.map(a => ({ value: a.id, label: a.name })), [agencies]);
  
  const allUrlOptions = useMemo(() => {
    const assignedAgencyUrlIds = new Set(urls.filter(u => u.agencyId && allAssignedAgencyIds.includes(u.agencyId)).map(u => u.id));
    // URLs that are assigned via an agency are not available for specific assignment.
    return urls
        .filter(u => !assignedAgencyUrlIds.has(u.id))
        .map(u => ({ value: u.id, label: u.link }));
  }, [urls, allAssignedAgencyIds]);


  // --- Handlers for assignment changes ---
  const handleAssignItem = (userId: string, itemType: 'agency' | 'url', itemId: string) => {
    setAssignments(prev => {
      const userAssignment = prev[userId] || { assignedAgencyIds: [], assignedUrlIds: [] };
      const field = itemType === 'agency' ? 'assignedAgencyIds' : 'assignedUrlIds';
      
      if (!userAssignment[field].includes(itemId)) {
        return {
          ...prev,
          [userId]: {
            ...userAssignment,
            [field]: [...userAssignment[field], itemId]
          }
        };
      }
      return prev;
    });
  };

  const handleDeselectItem = (userId: string, itemType: 'agency' | 'url', itemId: string) => {
    setAssignments(prev => {
      const userAssignment = prev[userId];
      if (!userAssignment) return prev;

      const field = itemType === 'agency' ? 'assignedAgencyIds' : 'assignedUrlIds';
      const updatedAssignments = {
        ...prev,
        [userId]: {
          ...userAssignment,
          [field]: userAssignment[field].filter(id => id !== itemId)
        }
      };

      // If user has no assignments left, remove them from the assignments object
      if (updatedAssignments[userId].assignedAgencyIds.length === 0 && updatedAssignments[userId].assignedUrlIds.length === 0) {
        delete updatedAssignments[userId];
      }

      return updatedAssignments;
    });
  };

  const handleAddWave = async () => {
    if (newWaveName.trim()) {
      const nextWaveNumber = waves.length > 0 ? Math.max(...waves.map(w => w.number)) + 1 : 1;
      const newWaveId = await addWave(newWaveName.trim(), nextWaveNumber, ''); // Add empty description initially
      if (newWaveId) {
          setSelectedWaveId(newWaveId);
          setNewWaveName('');
      }
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedWaveId) {
      toast({ title: "No Wave Selected", description: "Please select a wave before saving.", variant: "destructive"});
      return;
    }
    await saveWaveAssignments(selectedWaveId, waveDescription, assignments);
  };
  
  const sortedWaves = useMemo(() => waves.sort((a, b) => b.number - a.number), [waves]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><GanttChartSquare className="mr-2 h-8 w-8 text-primary"/>Manage Wave Assignments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Step 1: Select or Create a Wave</CardTitle>
              <CardDescription>All assignments are grouped under a wave. Select an existing one or create a new one to begin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedWaveId} onValueChange={setSelectedWaveId}>
                    <SelectTrigger><SelectValue placeholder="Select an existing wave..." /></SelectTrigger>
                    <SelectContent>
                    {sortedWaves.map(wave => (
                        <SelectItem key={wave.id} value={wave.id}>Wave {wave.number}: {wave.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <div className="flex space-x-2">
                    <Input 
                        placeholder="Or create new wave name..." 
                        value={newWaveName}
                        onChange={(e) => setNewWaveName(e.target.value)}
                    />
                    <Button onClick={handleAddWave} disabled={!newWaveName.trim()}><PlusCircle className="mr-2 h-4 w-4"/>Create</Button>
                </div>
              </div>
              {selectedWaveId && (
                 <div>
                    <label htmlFor="waveDescription" className="block text-sm font-medium text-muted-foreground mb-1">Wave Description (Common for all users)</label>
                    <Textarea id="waveDescription" placeholder="Add a description or instructions for this wave..." value={waveDescription} onChange={(e) => setWaveDescription(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>
           {selectedWaveId && (
              <div className="flex justify-end pt-6">
                  <Button onClick={handleSaveAssignments} className="w-full md:w-auto">
                      <Save className="mr-2 h-4 w-4" /> Save All Assignments for this Wave
                  </Button>
              </div>
            )}
        </div>

        {selectedWaveId && (
          <Card className="shadow-md">
              <CardHeader>
                  <CardTitle>Step 2: Assign Work to Users for "{waves.find(w => w.id === selectedWaveId)?.name}"</CardTitle>
                  <CardDescription>Assign available agencies and URLs to users. Assigned items will be removed from the selection lists.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-[calc(100vh-32rem)] pr-4">
                      <div className="space-y-6">
                          {availableUsers.map(user => (
                              <Card key={user.id} className="bg-muted/50">
                                  <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary"/>{user.name}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                      <div>
                                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4"/>Assign Agencies</h4>
                                          <MultiSelect
                                              options={allAgencyOptions}
                                              selectedValues={assignments[user.id]?.assignedAgencyIds || []}
                                              onSelect={(agencyId) => handleAssignItem(user.id, 'agency', agencyId)}
                                              onDeselect={(agencyId) => handleDeselectItem(user.id, 'agency', agencyId)}
                                              placeholder="Select agencies..."
                                              globallySelectedValues={allAssignedAgencyIds}
                                          />
                                      </div>
                                      <div>
                                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Link2 className="h-4 w-4"/>Assign Specific URLs</h4>
                                          <MultiSelect
                                              options={allUrlOptions}
                                              selectedValues={assignments[user.id]?.assignedUrlIds || []}
                                              onSelect={(urlId) => handleAssignItem(user.id, 'url', urlId)}
                                              onDeselect={(urlId) => handleDeselectItem(user.id, 'url', urlId)}
                                              placeholder="Select URLs..."
                                              globallySelectedValues={allAssignedUrlIds}
                                          />
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                  </ScrollArea>
              </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
