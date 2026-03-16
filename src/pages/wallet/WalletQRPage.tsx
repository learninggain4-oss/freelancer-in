import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const WalletQRPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  const walletNumber = profile?.wallet_number;
  const name = Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "";

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      if (ctx) {
        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 500);

        // QR code centered
        ctx.drawImage(img, 50, 30, 300, 300);

        // Name
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 20px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, 200, 370);

        // Wallet number
        ctx.font = "16px Inter, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(`Wallet: ${walletNumber}`, 200, 400);

        // FlexPay branding
        ctx.font = "12px Inter, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("FlexPay Wallet", 200, 440);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement("a");
          link.download = `FlexPay-QR-${walletNumber}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          toast.success("QR code downloaded!");
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleShare = async () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = async () => {
      canvas.width = 400;
      canvas.height = 500;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 500);
        ctx.drawImage(img, 50, 30, 300, 300);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 20px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, 200, 370);
        ctx.font = "16px Inter, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(`Wallet: ${walletNumber}`, 200, 400);
        ctx.font = "12px Inter, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("FlexPay Wallet", 200, 440);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share) {
          try {
            const file = new File([blob], `FlexPay-QR-${walletNumber}.png`, { type: "image/png" });
            await navigator.share({
              title: "My FlexPay Wallet QR",
              text: `Send money to my FlexPay wallet: ${walletNumber}`,
              files: [file],
            });
          } catch {
            toast.info("Share cancelled");
          }
        } else {
          // Fallback: copy wallet number
          if (walletNumber) {
            navigator.clipboard.writeText(walletNumber);
            toast.success("Wallet number copied to clipboard!");
          }
        }
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleCopy = () => {
    if (walletNumber) {
      navigator.clipboard.writeText(walletNumber);
      toast.success("Wallet number copied!");
    }
  };

  if (!walletNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-muted-foreground">No wallet number assigned yet.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 pb-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="w-full flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">My QR Code</h1>
      </div>

      {/* QR Card */}
      <div className="w-full max-w-xs">
        <div className="rounded-2xl bg-card shadow-lg ring-1 ring-border/50 overflow-hidden">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-4 text-center">
            <p className="text-primary-foreground text-sm font-medium opacity-80">FlexPay Wallet</p>
            <p className="text-primary-foreground text-lg font-bold mt-1">{name}</p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center px-6 py-6" ref={qrRef}>
            <QRCodeSVG
              value={walletNumber}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#1e293b"
            />
          </div>

          {/* Wallet number */}
          <div className="px-6 pb-5 text-center space-y-1">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {walletNumber}
              <Copy className="h-3.5 w-3.5" />
            </button>
            <p className="text-[11px] text-muted-foreground">Scan this QR code to send money to this wallet</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs flex gap-3">
        <Button className="flex-1 h-12" variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button className="flex-1 h-12" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default WalletQRPage;
