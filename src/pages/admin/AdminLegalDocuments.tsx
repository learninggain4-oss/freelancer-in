import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Pencil, Trash2, Plus, X, Save, ShieldCheck, Search, FileText, ExternalLink } from "lucide-react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newContent, setNewContent] = useState("");
  const [search, setSearch] = useState("");

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

  const filteredDocs = docs?.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1e1b4b 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Legal Documents</h1>
              <p className="text-white/70">Manage platform policies, terms of service and compliance</p>
            </div>
          </div>
          {!isCreating && (
            <Button 
              onClick={() => setIsCreating(true)} 
              className="gap-2 bg-white text-[#6366f1] hover:bg-white/90"
            >
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <CardHeader className="border-b" style={{ borderColor: T.border }}>
            <CardTitle className="text-lg" style={{ color: T.text }}>New Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Title</Label>
                <Input 
                  placeholder="e.g. Terms of Service" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.text }}>Slug</Label>
                <Input
                  placeholder="e.g. privacy-policy"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                  style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: T.text }}>Content</Label>
              <Textarea 
                placeholder="Enter document content here..." 
                value={newContent} 
                onChange={(e) => setNewContent(e.target.value)} 
                rows={12} 
                style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
              <Button onClick={() => createMutation.mutate()} disabled={!newTitle || !newSlug || createMutation.isPending} className="bg-[#6366f1] hover:bg-[#6366f1]/90">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} style={{ borderColor: T.border, color: T.text }}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCreating && (
        <>
          <div className="flex items-center gap-3 max-w-md mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 rounded-xl"
                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs?.map((doc) => (
              <Card 
                key={doc.id} 
                style={{ background: T.card, border: editingId === doc.id ? "1px solid #6366f1" : `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
                className="group transition-all hover:border-[#6366f1]/30 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <CardContent className="p-6 space-y-4">
                  {editingId === doc.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label style={{ color: T.text }}>Title</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} />
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: T.text }}>Slug</Label>
                        <Input
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                          style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: T.text }}>Content</Label>
                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text }} className="font-mono text-sm" />
                      </div>
                      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
                        <Button
                          className="bg-[#6366f1] hover:bg-[#6366f1]/90"
                          onClick={() => updateMutation.mutate({ id: doc.id, title: editTitle, slug: editSlug, content: editContent })}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingId(null)} style={{ borderColor: T.border, color: T.text }}>
                          <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="rounded-xl p-3 bg-white/5" style={{ color: "#a5b4fc" }}>
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => startEdit(doc)} 
                            className="h-8 w-8 hover:bg-white/5"
                            style={{ color: T.sub }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(24px)" }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: T.text }}>Delete "{doc.title}"?</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: T.sub }}>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel style={{ borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(doc.id)} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-1" style={{ color: T.text }}>{doc.title}</h3>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] uppercase font-bold px-1.5 h-5"
                          style={{ 
                            background: "rgba(99, 102, 241, 0.1)", 
                            color: "#a5b4fc", 
                            borderColor: "rgba(99, 102, 241, 0.3)" 
                          }}
                        >
                          /{doc.slug}
                        </Badge>
                      </div>

                      <p className="line-clamp-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: T.sub }}>{doc.content}</p>

                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: T.border }}>
                        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: T.sub }}>
                          Updated: {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                        <a 
                          href={`/legal/${doc.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-bold flex items-center gap-1.5 transition-colors hover:text-[#6366f1]"
                          style={{ color: T.sub }}
                        >
                          Preview <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocs?.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No legal documents found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLegalDocuments;
