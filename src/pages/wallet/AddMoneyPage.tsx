import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, ArrowUpRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  warm:  { bg:"#fef6e4", card:"#fffdf7", border:"rgba(180,83,9,.1)", text:"#1c1a17", sub:"#78716c", input:"#fffdf7", nav:"#fef0d0", badge:"rgba(217,119,6,.1)", badgeFg:"#b45309" },
  forest: { bg:"#f1faf4", card:"#ffffff", border:"rgba(21,128,61,.1)", text:"#0f2d18", sub:"#4b7c5d", input:"#ffffff", nav:"#dcfce7", badge:"rgba(22,163,74,.1)", badgeFg:"#15803d" },
  ocean: { bg:"#f0f9ff", card:"#ffffff", border:"rgba(14,165,233,.1)", text:"#0c4a6e", sub:"#4b83a3", input:"#ffffff", nav:"#e0f2fe", badge:"rgba(14,165,233,.1)", badgeFg:"#0369a1" },
};

const AddMoneyPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [addAmount, setAddAmount] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Provide a fallback in case theme is missing
  const { themeKey, theme } = useDashboardTheme();
  const currentThemeKey = themeKey || theme || 'black';
  const T = TH[currentThemeKey as keyof typeof TH] || TH.black;

  const addMoneyMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(addAmount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("wallet-operations", {
        body: { action: "add_money", amount },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`₹${Number(addAmount).toLocaleString("en-IN")} added to wallet`);
      setAddAmount("");
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] });
      // Go back after successful addition
      navigate(-1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 pb-24 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex items-center gap-3 animate-fade-in-up">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-2xl" style={{ color: T.text }}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: T.text }}>Deposit Funds</h1>
          <p className="text-xs font-medium" style={{ color: T.sub }}>Add money to your wallet</p>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <Card className="border-0 shadow-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          <CardHeader className="flex-row items-center gap-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <PlusCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <CardTitle className="text-lg font-black tracking-tight" style={{ color: T.text }}>Add Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: T.sub }}>Deposit Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-400">₹</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-16 pl-10 text-2xl font-black border-0 bg-white/5 rounded-2xl focus-visible:ring-indigo-500/30"
                  style={{ color: T.text, backgroundColor: T.input }}
                />
              </div>
            </div>
            <Button
              className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
              onClick={() => addMoneyMutation.mutate()}
              disabled={addMoneyMutation.isPending || !(profile as any)?.wallet_active}
            >
              <ArrowUpRight className="mr-2 h-5 w-5" />
              {addMoneyMutation.isPending ? "Processing..." : !(profile as any)?.wallet_active ? "Wallet Inactive" : "Add to Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMoneyPage;
