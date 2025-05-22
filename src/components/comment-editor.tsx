import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Info } from 'lucide-react';
import DOMPurify from 'dompurify';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommentEditorProps {
  onSave: (comment: string) => void;
  isLoading?: boolean;
}

export function CommentEditor({ onSave, isLoading = false }: CommentEditorProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) return;
    
    // Sanitize HTML before saving
    const sanitizedComment = DOMPurify.sanitize(comment, {
        ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'prompt', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style', 'onerror']
      })
    onSave(sanitizedComment);
    setComment('');
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Add Comment</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="text-sm">You can use HTML tags for formatting:</p>
                  <ul className="text-xs mt-1 list-disc list-inside">
                    <li>&lt;a href="url"&gt; for links</li>
                    <li>&lt;strong&gt; for bold text</li>
                    <li>&lt;em&gt; for italic text</li>
                    <li>&lt;ul&gt; and &lt;li&gt; for lists</li>
                    <li>&lt;h1&gt; to &lt;h6&gt; for headings</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            placeholder="Write your comment... (HTML supported)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] font-mono text-sm"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !comment.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Comment'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 