"use client";

import { useState, useCallback } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

function ToolbarButton({ icon, label, onClick, active }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-white/10 text-white"
      )}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

export function BlockEditor({
  value,
  onChange,
  placeholder = "Commencez à écrire...",
  label,
  minHeight = "200px",
}: BlockEditorProps) {
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    saveToHistory(newValue);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector("textarea[data-block-editor]") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    
    handleChange(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertHeading = (level: 2 | 3) => {
    const prefix = level === 2 ? "## " : "### ";
    insertMarkdown(prefix);
  };

  const insertBold = () => insertMarkdown("**", "**");
  const insertItalic = () => insertMarkdown("_", "_");
  const insertBulletList = () => insertMarkdown("- ");
  const insertNumberedList = () => insertMarkdown("1. ");
  const insertQuote = () => insertMarkdown("> ");
  const insertLink = () => insertMarkdown("[", "](url)");

  // Simple markdown preview renderer
  const renderPreview = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
      .replace(/^\> (.+)$/gm, '<blockquote class="border-l-4 border-cyan-500 pl-4 italic text-neutral-300 my-2">$1</blockquote>')
      .replace(/^\- (.+)$/gm, '<li class="text-neutral-300 ml-4">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="text-neutral-300 ml-4 list-decimal">$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 hover:underline">$1</a>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.03] p-2">
          <ToolbarButton icon={<Undo className="h-4 w-4" />} label="Annuler" onClick={undo} />
          <ToolbarButton icon={<Redo className="h-4 w-4" />} label="Refaire" onClick={redo} />
          
          <div className="mx-1 h-5 w-px bg-white/10" />
          
          <ToolbarButton icon={<Type className="h-4 w-4" />} label="Paragraphe" onClick={() => {}} />
          <ToolbarButton icon={<Heading2 className="h-4 w-4" />} label="Titre 2" onClick={() => insertHeading(2)} />
          <ToolbarButton icon={<Heading3 className="h-4 w-4" />} label="Titre 3" onClick={() => insertHeading(3)} />
          
          <div className="mx-1 h-5 w-px bg-white/10" />
          
          <ToolbarButton icon={<Bold className="h-4 w-4" />} label="Gras" onClick={insertBold} />
          <ToolbarButton icon={<Italic className="h-4 w-4" />} label="Italique" onClick={insertItalic} />
          
          <div className="mx-1 h-5 w-px bg-white/10" />
          
          <ToolbarButton icon={<List className="h-4 w-4" />} label="Liste à puces" onClick={insertBulletList} />
          <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} label="Liste numérotée" onClick={insertNumberedList} />
          <ToolbarButton icon={<Quote className="h-4 w-4" />} label="Citation" onClick={insertQuote} />
          <ToolbarButton icon={<LinkIcon className="h-4 w-4" />} label="Lien" onClick={insertLink} />
        </div>

        {/* Editor with Preview */}
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/10 rounded-none h-auto p-0">
            <TabsTrigger 
              value="write" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-2"
            >
              Écrire
            </TabsTrigger>
            <TabsTrigger 
              value="preview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent py-2"
            >
              Aperçu
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="write" className="mt-0">
            <Textarea
              data-block-editor
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-neutral-200 placeholder:text-neutral-500",
                "p-4"
              )}
              style={{ minHeight }}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div 
              className="p-4 prose prose-invert prose-sm max-w-none text-neutral-300"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: renderPreview(value) || '<p class="text-neutral-500">Rien à afficher</p>' }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

