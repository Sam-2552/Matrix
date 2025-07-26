
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileEdit, PlusCircle, Loader2, Trash2, X, Check, Waves, FolderGit2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Report, ReportStatus, ReportSection, ReportCategory, UrlPoc, PocStep } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import dynamic from 'next/dynamic';
import { uploadImage } from '@/app/actions/uploadImage';
import type { UnprivilegedEditor } from 'react-quill';

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

// --- Reusable MultiSelect Component for URLs ---
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, placeholder = "Select URLs...", className, disabled }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}
          </span>
          <X 
            className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", selectedValues.length > 0 ? "visible" : "invisible")}
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search URLs..." />
          <CommandList>
            <CommandEmpty>No URLs found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


// --- Main Reporting Page Component ---
export default function ReportingPage() {
  const { currentUser, agencies, waves, urls, getReportsForUser, saveReport, reportCategories, getTasksForUser } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const activeEditorRef = useRef<UnprivilegedEditor | null>(null);

  // State for the new report builder
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [selectedWaveId, setSelectedWaveId] = useState('');
  const [isReportingStarted, setIsReportingStarted] = useState(false);
  const [sections, setSections] = useState<ReportSection[]>([]);
  
  const userReports = currentUser ? getReportsForUser(currentUser.id) : [];
  
  const imageHandler = useCallback(async () => {
    const editor = activeEditorRef.current;
    if (!editor) {
      toast({
        title: "Editor not focused",
        description: "Please click on an editor before inserting an image.",
        variant: "destructive"
      });
      return;
    }
  
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
  
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && editor) {
        const range = editor.getSelection(true);
        editor.insertText(range.index, " [Uploading image...] ", 'user');
  
        const formData = new FormData();
        formData.append('file', file);
  
        const result = await uploadImage(formData);
  
        editor.deleteText(range.index, " [Uploading image...] ".length, 'user');
  
        if (result.success && result.url) {
          editor.insertEmbed(range.index, 'image', result.url, 'user');
        } else {
          toast({
            title: "Image Upload Failed",
            description: result.error || "An unknown error occurred.",
            variant: "destructive"
          });
        }
      }
    };
  }, [toast]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  }), [imageHandler]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const availableAgenciesForWave = useMemo(() => {
    if (!selectedWaveId || !currentUser) {
      return [];
    }
    const userTasks = getTasksForUser(currentUser.id);
    const waveTask = userTasks.find(t => t.waveId === selectedWaveId);

    if (!waveTask || !waveTask.assignedAgencyIds) {
      return [];
    }

    return agencies.filter(agency => waveTask.assignedAgencyIds.includes(agency.id));

  }, [selectedWaveId, currentUser, agencies, getTasksForUser]);

  const availableUrlsForAgency = useMemo(() => {
    return selectedAgencyId ? urls.filter(u => u.agencyId === selectedAgencyId) : [];
  }, [selectedAgencyId, urls]);

  const allSelectedUrlIds = useMemo(() => {
    return sections.flatMap(s => s.urlPocs.map(p => p.urlId));
  }, [sections]);

  const selectedCategories = useMemo(() => {
    return sections.map(s => s.category);
  }, [sections]);

  // Effect to reset agency selection if the selected wave changes
  useEffect(() => {
    setSelectedAgencyId('');
  }, [selectedWaveId]);

  const resetBuilderState = () => {
    setEditingReport(null);
    setSelectedAgencyId('');
    setSelectedWaveId('');
    setIsReportingStarted(false);
    setSections([]);
  };

  const handleCreateNew = () => {
    resetBuilderState();
    setIsDialogOpen(true);
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setSelectedAgencyId(report.agencyId);
    setSelectedWaveId(report.waveId);
    setSections(report.sections || []);
    setIsReportingStarted(true);
    setIsDialogOpen(true);
  };
  
  const handleStartReporting = () => {
    if (!selectedAgencyId || !selectedWaveId) {
      toast({ title: "Missing Information", description: "Please select an agency and a wave to start reporting.", variant: "destructive" });
      return;
    }
    setIsReportingStarted(true);
  };

  const handleAddSection = () => {
    if (reportCategories.length === 0) {
        toast({ title: "No Categories", description: "An admin needs to configure report categories first.", variant: "destructive" });
        return;
    }
    if (sections.length >= reportCategories.length) {
        toast({ title: "All Categories Used", description: "You have added a section for every available category.", variant: "default" });
        return;
    }
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      category: '',
      urlCount: 1,
      selectedUrlIds: [],
      urlPocs: [],
    };
    setSections(prev => [...prev, newSection]);
  };

  const handleUpdateSection = (sectionId: string, field: keyof ReportSection, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const updatedSection = { ...s, [field]: value };
        if (field === 'selectedUrlIds') {
            const newPocs = (value as string[]).map(urlId => {
                const existingPoc = s.urlPocs.find(p => p.urlId === urlId);
                return existingPoc || { urlId, steps: [], conclusion: '' };
            });
            updatedSection.urlPocs = newPocs;
        }
        return updatedSection;
      }
      return s;
    }));
  };
  
  const handleRemoveSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleAddPocStep = (sectionId: string, urlId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const newUrlPocs = s.urlPocs.map(poc => {
          if (poc.urlId === urlId) {
            const newStep: PocStep = { id: `step-${Date.now()}`, content: '' };
            return { ...poc, steps: [...poc.steps, newStep] };
          }
          return poc;
        });
        return { ...s, urlPocs: newUrlPocs };
      }
      return s;
    }));
  };

  const handleUpdatePocStep = (sectionId: string, urlId: string, stepId: string, content: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const newUrlPocs = s.urlPocs.map(poc => {
          if (poc.urlId === urlId) {
            const newSteps = poc.steps.map(step => {
              if (step.id === stepId) {
                return { ...step, content };
              }
              return step;
            });
            return { ...poc, steps: newSteps };
          }
          return poc;
        });
        return { ...s, urlPocs: newUrlPocs };
      }
      return s;
    }));
  };

  const handleUpdatePocConclusion = (sectionId: string, urlId: string, conclusion: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const newUrlPocs = s.urlPocs.map(poc => poc.urlId === urlId ? { ...poc, conclusion } : poc);
        return { ...s, urlPocs: newUrlPocs };
      }
      return s;
    }));
  };
  
  const handleSave = async (status: ReportStatus) => {
    if (!selectedAgencyId || !selectedWaveId) {
        toast({ title: "Cannot Save", description: "Agency and Wave must be selected.", variant: "destructive" });
        return;
    }
    
    // Validate sections
    for (const section of sections) {
        if (!section.category) {
            toast({ title: "Missing Category", description: `A section is missing its category. Please select one.`, variant: "destructive" });
            return;
        }
        if (section.selectedUrlIds.length !== section.urlCount) {
            toast({
                title: "URL Mismatch",
                description: `In the "${section.category}" section, you need to select exactly ${section.urlCount} URL(s).`,
                variant: "destructive"
            });
            return;
        }
    }

    setIsSaving(true);
    try {
      await saveReport({
        id: editingReport?.id,
        agencyId: selectedAgencyId,
        waveId: selectedWaveId,
        sections: sections,
        status: status,
      });
      setIsDialogOpen(false);
    } catch (error) {
       console.error("Error Saving Report:", error);
       // The toast for this is handled in app-provider now
    } finally {
      setIsSaving(false);
    }
  };
  
  const sortedWaves = useMemo(() => waves.sort((a, b) => b.number - a.number), [waves]);
  const publishedWaves = useMemo(() => sortedWaves.filter(w => w.status === 'published'), [sortedWaves]);
  const canAddSection = sections.length < reportCategories.length;

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><FileEdit className="mr-2 h-8 w-8 text-primary"/>My Reports</h1>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Report
        </Button>
      </div>

      {userReports.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userReports.map(report => {
              const agency = agencies.find(a => a.id === report.agencyId);
              const wave = waves.find(w => w.id === report.waveId);
              return (
                <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl truncate" title={agency?.name || 'Unknown Agency'}>
                      {agency?.name || 'Unknown Agency'}
                    </CardTitle>
                    <CardDescription>Wave: {wave?.name || 'N/A'} | Last updated: {format(new Date(report.updatedAt), "PPp")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Badge variant={report.status === 'submitted' ? 'default' : 'secondary'}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(report)}>
                      <FileEdit className="mr-2 h-4 w-4" />
                      {report.status === 'submitted' ? 'View' : 'Edit'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl"><FileEdit className="mr-2 h-6 w-6 text-muted-foreground" />No Reports Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Get started by creating your first report.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Report' : 'Create New Report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-grow flex flex-col min-h-0">
            {/* Step 1: Select Agency and Wave */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedWaveId} onValueChange={setSelectedWaveId} disabled={isReportingStarted}>
                  <SelectTrigger><SelectValue placeholder="Select Wave" /></SelectTrigger>
                  <SelectContent>
                    {publishedWaves.map(wave => <SelectItem key={wave.id} value={wave.id}>{wave.name}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId} disabled={isReportingStarted || !selectedWaveId}>
                <SelectTrigger><SelectValue placeholder="Select Agency" /></SelectTrigger>
                <SelectContent>
                  {availableAgenciesForWave.map(agency => <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!isReportingStarted && (
              <Button onClick={handleStartReporting} className="w-full">Start Reporting</Button>
            )}

            {/* Step 2: Build Report with Sections */}
            {isReportingStarted && (
              <div className="flex-grow min-h-0 space-y-4">
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-block">
                          <Button onClick={handleAddSection} disabled={!canAddSection}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!canAddSection && (
                        <TooltipContent>
                          <p>All available categories have been used.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                <ScrollArea className="h-[calc(100%-4rem)] pr-4">
                  <Accordion type="multiple" className="space-y-4">
                    {sections.map((section, index) => {
                       const availableCategories = reportCategories.filter(cat => !selectedCategories.includes(cat.name) || cat.name === section.category);
                       const availableUrlsForSection = availableUrlsForAgency.filter(url => !allSelectedUrlIds.includes(url.id) || section.selectedUrlIds.includes(url.id));

                      return (
                      <AccordionItem value={section.id} key={section.id} className="border-none">
                        <Card className="bg-muted/50">
                            <AccordionTrigger className="p-4 hover:no-underline">
                               <div className="flex items-center justify-between w-full">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FolderGit2 className="h-5 w-5 text-primary" />
                                        Section {index + 1}: {section.category || "(No category selected)"}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveSection(section.id); }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                                        <Select value={section.category} onValueChange={(val) => handleUpdateSection(section.id, 'category', val)}>
                                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                          <SelectContent>
                                            {availableCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                     </div>
                                      <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Number of URLs</label>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          value={section.urlCount}
                                          onChange={(e) => handleUpdateSection(section.id, 'urlCount', parseInt(e.target.value, 10) || 1)}
                                        />
                                      </div>
                                   </div>
                                   <div>
                                      <label className="block text-sm font-medium text-muted-foreground mb-1">Select URLs ({section.selectedUrlIds.length}/{section.urlCount})</label>
                                      <MultiSelect
                                        options={availableUrlsForSection.map(url => ({ value: url.id, label: url.link }))}
                                        selectedValues={section.selectedUrlIds}
                                        onChange={(vals) => handleUpdateSection(section.id, 'selectedUrlIds', vals)}
                                        disabled={availableUrlsForAgency.length === 0}
                                      />
                                   </div>

                                   <div className="space-y-4">
                                    {section.urlPocs.map(poc => (
                                        <Card key={poc.urlId} className="bg-background">
                                            <CardHeader>
                                                <CardTitle className="text-base truncate flex items-center justify-between">
                                                  <a href={urls.find(u => u.id === poc.urlId)?.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{urls.find(u => u.id === poc.urlId)?.link}</a>
                                                    <Button size="sm" variant="outline" onClick={() => handleAddPocStep(section.id, poc.urlId)}>
                                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                                        Add Step
                                                    </Button>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {poc.steps.map((step, stepIndex) => (
                                                    <div key={step.id} className="space-y-2 p-2 border rounded-md bg-muted/30">
                                                      <h4 className="font-semibold text-sm">Step {stepIndex + 1}</h4>
                                                      <QuillEditor
                                                        value={step.content}
                                                        onChange={(content) => {
                                                            handleUpdatePocStep(section.id, poc.urlId, step.id, content)
                                                        }}
                                                        onFocus={(range, source, editor) => {
                                                          activeEditorRef.current = editor;
                                                        }}
                                                        modules={quillModules}
                                                      />
                                                    </div>
                                                ))}

                                                {poc.steps.length > 0 && (
                                                    <div className="space-y-2 p-2 border-t mt-4">
                                                        <h4 className="font-semibold text-sm">Conclusion</h4>
                                                         <QuillEditor
                                                            value={poc.conclusion}
                                                            onChange={(content) => handleUpdatePocConclusion(section.id, poc.urlId, content)}
                                                            onFocus={(range, source, editor) => {
                                                              activeEditorRef.current = editor;
                                                            }}
                                                            modules={quillModules}
                                                         />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                   </div>
                                </div>
                            </AccordionContent>
                        </Card>
                      </AccordionItem>
                    )})}
                  </Accordion>
                </ScrollArea>
              </div>
            )}
          </div>
          {isReportingStarted && editingReport?.status !== 'submitted' && (
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
              <Button type="button" onClick={() => handleSave('draft')} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Draft</Button>
              <Button type="button" onClick={() => handleSave('submitted')} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit Report</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
