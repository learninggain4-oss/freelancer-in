import { Badge } from "@/components/ui/badge";
import { useRBAC } from "@/hooks/use-rbac";

export function StabilityFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function StabilityReadOnlyBadge() {
  const { permissions } = useRBAC();
  if (permissions.canManageStabilitySettings) return null;
  return (
    <Badge variant="secondary" className="text-[10px] w-fit">
      View only
    </Badge>
  );
}

export function useCanMutateStability(): boolean {
  const { permissions } = useRBAC();
  return permissions.canManageStabilitySettings;
}

/** Shallow diff of string records for dashboard display */
export function diffSettingMaps(
  a: Record<string, string>,
  b: Record<string, string>
): { key: string; left: string; right: string }[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: { key: string; left: string; right: string }[] = [];
  keys.forEach((k) => {
    const left = a[k] ?? "";
    const right = b[k] ?? "";
    if (left !== right) out.push({ key: k, left, right });
  });
  return out.sort((x, y) => x.key.localeCompare(y.key));
}
