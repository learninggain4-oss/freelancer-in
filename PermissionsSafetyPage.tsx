import { StabilityFrame, StabilityReadOnlyBadge } from "./StabilityShared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROLE_PERMISSIONS, type AdminRole } from "@/hooks/use-rbac";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROLES: AdminRole[] = ["super_admin", "admin", "operator", "viewer"];

export default function PermissionsSafetyPage() {
  const navigate = useNavigate();

  return (
    <StabilityFrame
      title="Permission inheritance & validation"
      subtitle="Static matrix from app RBAC. Changes to role semantics happen in Security Center and admin_role app_settings."
    >
      <StabilityReadOnlyBadge />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/security-center")}>
          Security Center
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/governance")}>
          Governance
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/audit-log")}>
          Audit log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role → capability matrix</CardTitle>
          <CardDescription>Preview before assigning elevated roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[480px]">
            <div className="space-y-6">
              {ROLES.map((r) => (
                <div key={r}>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    {r.replace("_", " ")}
                    <Badge variant="secondary" className="text-[10px]">
                      {r}
                    </Badge>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(ROLE_PERMISSIONS[r])
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <Badge key={`${r}-${k}`} variant="outline" className="text-[9px]">
                          {k.replace(/^can/, "").replace(/([A-Z])/g, " $1")}
                        </Badge>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </StabilityFrame>
  );
}
