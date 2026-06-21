import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import UserMpinCard from "@/components/settings/UserMpinCard";

const SecurityMpinPage = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 p-4 pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-lg font-bold tracking-tight">M-Pin (Login Security PIN)</h1>
      <UserMpinCard />
    </div>
  );
};

export default SecurityMpinPage;
