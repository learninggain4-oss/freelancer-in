import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Globe, Wifi } from "lucide-react";

export type FullProfile = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  approval_status: string;
  mobile_number: string | null;
  whatsapp_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  education_level: string | null;
  previous_job_details: string | null;
  work_experience: string | null;
  education_background: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  registration_ip: string | null;
  registration_city: string | null;
  registration_region: string | null;
  registration_country: string | null;
  registration_latitude: number | null;
  registration_longitude: number | null;
  created_at: string;
  approval_notes: string | null;
  approved_at: string | null;
};

interface Props {
  user: FullProfile | null;
  actionType: "approve" | "reject" | "view" | null;
  notes: string;
  onNotesChange: (v: string) => void;
  processing: boolean;
  onAction: () => void;
  onClose: () => void;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-accent/15 text-accent border-accent/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={map[status] || ""}>
      {status}
    </Badge>
  );
};

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

const UserDetailDialog = ({ user, actionType, notes, onNotesChange, processing, onAction, onClose }: Props) => {
  if (!user || !actionType) return null;

  const locationStr = [user.registration_city, user.registration_region, user.registration_country]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={!!user && !!actionType} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "view" ? "User Details" : actionType === "approve" ? "Approve User" : "Reject User"}
          </DialogTitle>
          <DialogDescription>
            {user.full_name?.[0]} • {user.user_code?.[0]}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4 text-sm">
            {/* Personal Info */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" value={user.full_name?.[0]} />
                <Field label="User Code" value={user.user_code?.[0]} />
                <Field label="User Type" value={user.user_type} />
                <Field label="Gender" value={user.gender} />
                <Field label="Date of Birth" value={user.date_of_birth} />
                <Field label="Marital Status" value={user.marital_status} />
                <Field label="Education Level" value={user.education_level} />
                <Field label="Status" value={undefined} />
              </div>
              <div className="mt-1">{statusBadge(user.approval_status)}</div>
            </div>

            <Separator />

            {/* Contact */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={user.email} />
                <Field label="Mobile" value={user.mobile_number} />
                <Field label="WhatsApp" value={user.whatsapp_number} />
              </div>
            </div>

            <Separator />

            {/* Professional */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional Background</h4>
              <div className="space-y-2">
                <Field label="Previous Job Details" value={user.previous_job_details} />
                <Field label="Work Experience" value={user.work_experience} />
                <Field label="Education Background" value={user.education_background} />
              </div>
            </div>

            <Separator />

            {/* Emergency */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={user.emergency_contact_name} />
                <Field label="Phone" value={user.emergency_contact_phone} />
                <Field label="Relationship" value={user.emergency_contact_relationship} />
              </div>
            </div>

            <Separator />

            {/* IP & Location */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration IP & Location</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{user.registration_ip || "Not captured"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{locationStr || "Not captured"}</span>
                </div>
                {user.registration_latitude && user.registration_longitude && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://www.google.com/maps?q=${user.registration_latitude},${user.registration_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      View on Google Maps ({user.registration_latitude}, {user.registration_longitude})
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registered" value={new Date(user.created_at).toLocaleString()} />
                <Field label="Approved At" value={user.approved_at ? new Date(user.approved_at).toLocaleString() : null} />
                <Field label="Approval Notes" value={user.approval_notes} />
              </div>
            </div>

            {actionType !== "view" && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-muted-foreground">Notes (optional)</p>
                  <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Add notes about this decision..." />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          {actionType === "view" ? (
            <Button variant="outline" onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={onAction} disabled={processing} variant={actionType === "approve" ? "default" : "destructive"}>
                {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog;
