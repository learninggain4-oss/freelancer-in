import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  IndianRupee,
  Calendar,
  Users,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const myProjects = [
  { id: "1", name: "E-Commerce Website", amount: 25000, applicants: 3, status: "active", deadline: "2026-03-01" },
  { id: "2", name: "Logo Redesign", amount: 8000, applicants: 5, status: "completed", deadline: "2026-02-15" },
];

const employeeRequests = [
  { id: "1", employeeName: "Amit Kumar", code: "EMP00001", project: "E-Commerce Website", experience: "3 years", status: "pending" },
  { id: "2", employeeName: "Sneha Reddy", code: "EMP00002", project: "E-Commerce Website", experience: "5 years", status: "pending" },
  { id: "3", employeeName: "Ravi Verma", code: "EMP00003", project: "Logo Redesign", experience: "2 years", status: "approved" },
];

const validations = [
  { id: "1", projectName: "Logo Redesign", employee: "Ravi Verma", status: "awaiting_review", lastMessage: "Final deliverables attached" },
];

const statusColor: Record<string, string> = {
  active: "bg-accent/10 text-accent",
  completed: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  awaiting_review: "bg-warning/10 text-warning",
};

const ClientProjects = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleAction = (id: string, action: "approve" | "reject") => {
    // placeholder
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <Button size="sm" onClick={() => navigate("/client/projects/create")}>
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="projects" className="flex-1 text-xs">My Projects</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 text-xs">Requests</TabsTrigger>
          <TabsTrigger value="validation" className="flex-1 text-xs">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-3">
          {myProjects.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <Badge className={statusColor[p.status]}>{p.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{p.amount.toLocaleString("en-IN")}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.applicants} applied</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.deadline}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {employeeRequests.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{r.employeeName}</h3>
                    <p className="text-xs text-muted-foreground">{r.code} • {r.experience}</p>
                  </div>
                  <Badge className={statusColor[r.status]}>{r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Project: {r.project}</p>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleAction(r.id, "approve")}>Approve</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => handleAction(r.id, "reject")}>Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="validation" className="mt-4 space-y-3">
          {validations.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-foreground">{v.projectName}</h3>
                  <p className="text-xs text-muted-foreground">{v.employee}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> {v.lastMessage}
                  </p>
                </div>
                <Badge className={statusColor[v.status]}>Review</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProjects;
