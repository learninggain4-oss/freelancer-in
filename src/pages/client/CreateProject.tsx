import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CreateProject = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: "", amount: "", validationFees: "", requirements: "", remarks: "", startDate: "", endDate: ""
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (!form.name || !form.amount || !form.requirements) throw new Error("Please fill all required fields");
      const { error } = await supabase.from("projects").insert({
        client_id: profile.id,
        name: form.name,
        amount: Number(form.amount),
        validation_fees: Number(form.validationFees) || 0,
        requirements: form.requirements,
        remarks: form.remarks || null,
        start_date: form.startDate || null,
        end_date: form.endDate || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created successfully!");
      navigate("/client/projects");
    },
    onError: (e: any) => toast.error(e.message)
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-bold text-foreground">Create Jobs</h1>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input placeholder="e.g. E-Commerce Website" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Budget (₹) *</Label>
              <Input type="number" placeholder="25000" value={form.amount} onChange={(e) => update("amount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Validation Fee (₹)</Label>
              <Input type="number" placeholder="500" value={form.validationFees} onChange={(e) => update("validationFees", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Requirements *</Label>
            <Textarea placeholder="Describe your project requirements..." value={form.requirements} onChange={(e) => update("requirements", e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea placeholder="Any additional notes..." value={form.remarks} onChange={(e) => update("remarks", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Send className="mr-2 h-4 w-4" /> Publish Project
          </Button>
        </CardContent>
      </Card>
    </div>);

};

export default CreateProject;