import { useEffect, useRef } from 'react';
import * as monaco from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PythonEditorProps {
  code: string;
  onSave: (code: string) => void;
  readOnly?: boolean;
}

export function PythonEditor({ code, onSave, readOnly = false }: PythonEditorProps) {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function handleSave() {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      onSave(code);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {readOnly ? 'View Python Code' : 'Edit Python Code'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Python Code Editor</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-[60vh]">
          <monaco.Editor
            height="100%"
            defaultLanguage="python"
            defaultValue={code}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              readOnly,
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
            onMount={handleEditorDidMount}
          />
        </div>
        {!readOnly && (
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>Save Code</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 