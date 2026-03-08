import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LIVENESS_PROMPTS = [
  "Please smile for the camera 😊",
  "Please blink twice 👀",
  "Please turn your head slightly to the left ↩️",
  "Please turn your head slightly to the right ↪️",
  "Please nod your head slowly 🙂",
];

interface FaceVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptured: (blob: Blob) => void;
  title: string;
}

const FaceVerificationDialog = ({ open, onOpenChange, onCaptured, title }: FaceVerificationDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<"prompt" | "camera" | "preview">("prompt");
  const [livenessPrompt, setLivenessPrompt] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const pickPrompt = useCallback(() => {
    const idx = Math.floor(Math.random() * LIVENESS_PROMPTS.length);
    setLivenessPrompt(LIVENESS_PROMPTS[idx]);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep("camera");
    } catch {
      setError("Unable to access camera. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the image for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep("preview");
  }, [stopCamera]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, capturePhoto]);

  const handleConfirm = useCallback(() => {
    if (!capturedImage) return;
    // Convert data URL to blob
    fetch(capturedImage)
      .then((r) => r.blob())
      .then((blob) => {
        onCaptured(blob);
        handleClose();
      });
  }, [capturedImage, onCaptured]);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    pickPrompt();
    startCamera();
  }, [pickPrompt, startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    setStep("prompt");
    setCapturedImage(null);
    setError(null);
    setCountdown(null);
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  // When dialog opens, pick a prompt
  useEffect(() => {
    if (open) {
      pickPrompt();
      setStep("prompt");
      setCapturedImage(null);
      setError(null);
    } else {
      stopCamera();
    }
  }, [open, pickPrompt, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Face verification is required for attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === "prompt" && (
            <div className="text-center space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">Liveness Check</p>
                <p className="text-base font-semibold text-primary mt-2">{livenessPrompt}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Follow the instruction above while taking your selfie.
              </p>
              <Button onClick={startCamera} className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Open Camera
              </Button>
            </div>
          )}

          {step === "camera" && (
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-md px-3 py-2 text-center">
                <p className="text-sm font-medium text-primary">{livenessPrompt}</p>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-6xl font-bold text-white animate-pulse">{countdown}</span>
                  </div>
                )}
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-2 border-dashed border-white/50 rounded-full" />
                </div>
              </div>
              <Button onClick={startCountdown} disabled={countdown !== null} className="w-full gap-2">
                <Camera className="h-4 w-4" />
                {countdown !== null ? `Capturing in ${countdown}...` : "Capture Photo"}
              </Button>
            </div>
          )}

          {step === "preview" && capturedImage && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleConfirm} className="flex-1 gap-2">
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default FaceVerificationDialog;
