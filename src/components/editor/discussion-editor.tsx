"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Comment } from "@/types";

interface DiscussionEditorProps {
  projectId: string;
  comments: Comment[];
  currentUserId?: string;
}

export function DiscussionEditor({ projectId, comments, currentUserId }: DiscussionEditorProps) {
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    startTransition(async () => {
      const fakeComment: Comment = {
        id: crypto.randomUUID(),
        project_id: projectId,
        target_type: "project",
        target_id: null,
        parent_id: null,
        author_id: currentUserId || "",
        content: newComment,
        mentions: [],
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalComments((prev) => [...prev, fakeComment]);
      setNewComment("");
      toast.success("Commentaire ajouté");
    });
  };

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-pink-400" />
          Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="max-h-[400px] space-y-4 overflow-y-auto">
          {localComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-10 w-10 text-neutral-600" />
              <p className="mt-3 text-sm text-neutral-400">
                Aucun commentaire. Lancez la discussion !
              </p>
            </div>
          ) : (
            localComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400">
                    {comment.author_id === currentUserId ? "Vous" : "Membre"}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(comment.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="min-h-[80px] flex-1 border-white/10 bg-white/5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={isPending || !newComment.trim()}
            className="self-end bg-pink-600 hover:bg-pink-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-neutral-500">
          Appuyez sur ⌘+Enter pour envoyer
        </p>
      </CardContent>
    </Card>
  );
}
