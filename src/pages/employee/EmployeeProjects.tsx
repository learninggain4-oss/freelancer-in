import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  IndianRupee,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Send,
} from "lucide-react";

// Placeholder data
const inquiries = [
  { id: "1", name: "E-Commerce Website", amount: 25000, validationFees: 500, requirements: "Build a React e-commerce site", client: "Rahul Sharma", deadline: "2026-03-01", status: "open" },
  { id: "2", name: "Mobile App Design", amount: 15000, validationFees: 300, requirements: "UI/UX design for fitness app", client: "Priya Patel", deadline: "2026-03-15", status: "open" },
];

const requests = [
  { id: "1", projectName: "Logo Redesign", status: "pending", appliedDate: "2026-02-08" },
  { id: "2", projectName: "Blog Platform", status: "approved", appliedDate: "2026-02-05" },
  { id: "3", projectName: "Portfolio Site", status: "rejected", appliedDate: "2026-02-01" },
];

const submissions = [
  { id: "1", projectName: "Blog Platform", status: "in_progress", dueDate: "2026-02-20" },
];

const validations = [
  { id: "1", projectName: "Blog Platform", status: "awaiting_review", lastMessage: "Please review the homepage" },
];

const statusColor: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  pending: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  in_progress: "bg-primary/10 text-primary",
  awaiting_review: "bg-warning/10 text-warning",
};

const EmployeeProjects = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="inquiries" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="inquiries" className="flex-1 text-xs">Inquiries</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 text-xs">Requests</TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1 text-xs">Submissions</TabsTrigger>
          <TabsTrigger value="validation" className="flex-1 text-xs">Validation</TabsTrigger>
        </TabsList>

        {/* Inquiries */}
        <TabsContent value="inquiries" className="mt-4 space-y-3">
          {inquiries.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <Badge className={statusColor[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.requirements}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> ₹{p.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {p.deadline}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {p.client}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Fee: ₹{p.validationFees}
                  </span>
                </div>
                <Button size="sm" className="w-full">
                  <Send className="mr-2 h-4 w-4" /> Apply
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Requests */}
        <TabsContent value="requests" className="mt-4 space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-foreground">{r.projectName}</h3>
                  <p className="text-xs text-muted-foreground">Applied: {r.appliedDate}</p>
                </div>
                <Badge className={statusColor[r.status]}>{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Submissions */}
        <TabsContent value="submissions" className="mt-4 space-y-3">
          {submissions.length > 0 ? (
            submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.projectName}</h3>
                    <p className="text-xs text-muted-foreground">Due: {s.dueDate}</p>
                  </div>
                  <Badge className={statusColor[s.status]}>In Progress</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No submissions yet</p>
          )}
        </TabsContent>

        {/* Validation */}
        <TabsContent value="validation" className="mt-4 space-y-3">
          {validations.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-foreground">{v.projectName}</h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
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

export default EmployeeProjects;
