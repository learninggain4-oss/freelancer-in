import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Plus, X, Save } from "lucide-react";

interface LegalDoc {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

const AdminLegalDocuments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: docs, isLoading } = useQuery({
    queryKey: ["admin-legal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .order("title");
      if (error) throw error;
      return data as LegalDoc[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, slug, content }: { id: string; title: string; slug: string; content: string }) => {
      const { error } = await supabase
        .from("legal_documents")
        .update({ title, slug, content, updated_at: new Date().toISOString(), updated_by: profile?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-legal-documents"] });
      setEditingId(null);
      toast({ title: "Document updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("legal_documents")
        .insert({ title: newTitle, slug: newSlug, content: newContent, updated_by: profile?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-legal-documents"] });
      setIsCreating(false);
      setNewTitle("");
      setNewSlug("");
      setNewContent("");
      toast({ title: "Document created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-legal-documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const startEdit = (doc: LegalDoc) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditSlug(doc.slug);
    setEditContent(doc.content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Legal Documents</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Document
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input
              placeholder="Slug (e.g. privacy-policy)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
            />
            <Textarea placeholder="Content" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={10} />
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!newTitle || !newSlug || createMutation.isPending} size="sm">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} size="sm">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {docs?.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {editingId === doc.id ? (
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="max-w-xs" />
            ) : (
              <CardTitle className="text-lg">{doc.title}</CardTitle>
            )}
            <Badge variant="secondary" className="text-xs">{doc.slug}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingId === doc.id ? (
              <>
                <Input
                  placeholder="Slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                />
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate({ id: doc.id, title: editTitle, slug: editSlug, content: editContent })}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">{doc.content}</p>
                <p className="text-xs text-muted-foreground">Updated: {new Date(doc.updated_at).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(doc)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{doc.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(doc.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {docs?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No legal documents yet.</p>
      )}
    </div>
  );
};

export default AdminLegalDocuments;
