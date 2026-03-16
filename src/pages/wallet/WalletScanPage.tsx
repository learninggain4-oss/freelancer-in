import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Flashlight, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

const WalletScanPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (hasNavigated.current) return;
          // Validate: should be a 12-digit wallet number
          const cleaned = decodedText.trim();
          if (/^\d{12}$/.test(cleaned)) {
            hasNavigated.current = true;
            scanner.stop().catch(() => {});
            toast.success(`Wallet found: ${cleaned}`);
            // Navigate back with wallet number
            const basePath = window.location.pathname.includes("/client/") ? "/client/wallet" : "/employee/wallet";
            navigate(basePath, { state: { scannedWallet: cleaned } });
          } else {
            toast.error("Invalid QR code. Expected a 12-digit wallet number.");
          }
        },
        () => {} // ignore errors during scanning
      );
      setScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(
        err?.message?.includes("NotAllowedError") || err?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : "Unable to start camera. Please check your device settings."
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center p-4 pb-8 space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="w-full flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            stopScanner();
            navigate(-1);
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Scan QR Code</h1>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Point your camera at a FlexPay wallet QR code to send money
      </p>

      {/* Scanner Container */}
      <div className="w-full max-w-xs mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-lg ring-1 ring-border/50">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full"
            style={{ minHeight: 300 }}
          />

          {/* Scan overlay corners */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="w-full max-w-xs space-y-3">
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive text-center">
            {error}
          </div>
          <Button className="w-full" onClick={startScanner}>
            <Camera className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="w-full max-w-xs space-y-2 pt-2">
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
          <span>Ask the recipient to show their FlexPay wallet QR code</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
          <span>Align the QR code within the scanner frame</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
          <span>Enter the amount and confirm the transfer</span>
        </div>
      </div>
    </div>
  );
};

export default WalletScanPage;
