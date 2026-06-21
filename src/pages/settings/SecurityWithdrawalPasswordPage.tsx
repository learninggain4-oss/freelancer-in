import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import WithdrawalPasswordCard from "@/components/settings/WithdrawalPasswordCard";

const SecurityWithdrawalPasswordPage = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 p-4 pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-lg font-bold tracking-tight">Withdrawal Password</h1>
      <WithdrawalPasswordCard />
    </div>
  );
};

export default SecurityWithdrawalPasswordPage;
