import { useState } from "react";
import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  mode?: "single" | "type";
  typeToConfirm?: string;
  loading?: boolean;
}

export function ConfirmActionDialog({
  open, onOpenChange, onConfirm, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "default", mode = "single", typeToConfirm = "CONFIRM", loading = false,
}: ConfirmActionDialogProps) {
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState(1);
  const [executing, setExecuting] = useState(false);

  const variantColor = variant === "danger" ? "#f87171" : variant === "warning" ? "#fbbf24" : "#6366f1";
  const variantBg = variant === "danger" ? "rgba(248,113,113,.1)" : variant === "warning" ? "rgba(251,191,36,.1)" : "rgba(99,102,241,.1)";

  const canConfirm = mode === "type" ? typed.trim().toUpperCase() === typeToConfirm.toUpperCase() : true;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setExecuting(true);
    try { await onConfirm(); } finally { setExecuting(false); setTyped(""); setStep(1); }
  };

  const handleClose = () => {
    setTyped(""); setStep(1); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent style={{ background: "#0d0d24", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, maxWidth: 420 }}>
        <DialogHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: variantBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {variant === "danger" ? <ShieldAlert size={20} color={variantColor} /> : <AlertTriangle size={20} color={variantColor} />}
            </div>
            <DialogTitle style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</DialogTitle>
          </div>
          <DialogDescription style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{description}</DialogDescription>
        </DialogHeader>

        {mode === "type" && step === 1 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
              Type <span style={{ fontFamily: "monospace", fontWeight: 700, color: variantColor, background: variantBg, padding: "1px 6px", borderRadius: 4 }}>{typeToConfirm}</span> to confirm this action:
            </p>
            <Input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={typeToConfirm}
              autoFocus
              style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#e2e8f0", borderRadius: 10 }}
            />
          </div>
        )}

        <DialogFooter style={{ gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={handleClose} disabled={executing || loading}
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", borderRadius: 10 }}>
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || executing || loading}
            style={{ background: canConfirm ? `linear-gradient(135deg,${variantColor},${variantColor}cc)` : "rgba(255,255,255,.06)", color: canConfirm ? "#fff" : "#94a3b8", borderRadius: 10, minWidth: 100, border: "none" }}>
            {(executing || loading) ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
