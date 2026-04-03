import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

const WalletScanPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasNavigated = useRef(false);

  const handleDecodedWallet = async (decodedText: string) => {
    if (hasNavigated.current) return;

    const cleaned = decodedText.trim();
    if (!/^\d{12}$/.test(cleaned)) {
      toast.error("Invalid QR code. Expected a 12-digit wallet number.");
      return;
    }

    hasNavigated.current = true;
    await stopScanner();
    toast.success(`Wallet found: ${cleaned}`);
    const basePath = window.location.pathname.includes("/employer/") ? "/employer/wallet" : "/freelancer/wallet";
    navigate(basePath, { state: { scannedWallet: cleaned } });
  };

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void handleDecodedWallet(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
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
      try {
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handlePickFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      await stopScanner();

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      const decodedText = await scanner.scanFile(file, true);
      await handleDecodedWallet(decodedText);
    } catch {
      toast.error("Couldn't read QR from this image. Please try another image.");
      setError("Couldn't read QR from selected image. Please pick a clear QR image.");
      await startScanner();
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    void startScanner();
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center p-4 pb-8 space-y-4 animate-fade-in-up">
      <div className="w-full flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            void stopScanner();
            navigate(-1);
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Scan QR Code</h1>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Scan with camera or choose a QR image from gallery
      </p>

      <div className="w-full max-w-xs mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-lg ring-1 ring-border/50">
          <div id="qr-reader" ref={containerRef} className="w-full" style={{ minHeight: 300 }} />

          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFile}
      />

      <div className="w-full max-w-xs grid grid-cols-1 gap-2">
        <Button variant="outline" onClick={handlePickFromGallery}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Scan from Gallery
        </Button>
        {!scanning && (
          <Button onClick={() => void startScanner()}>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera Scan
          </Button>
        )}
      </div>

      {error && (
        <div className="w-full max-w-xs rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="w-full max-w-xs space-y-2 pt-2">
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
          <span>Ask the recipient to share their FlexPay wallet QR code</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
          <span>Either scan with camera or choose the QR image from gallery</span>
        </div>
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
          <span>Enter amount and confirm transfer</span>
        </div>
      </div>
    </div>
  );
};

export default WalletScanPage;
