import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PhotoCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptured: (blob: Blob) => void;
  title: string;
  description?: string;
}

const PhotoCaptureDialog = ({ open, onOpenChange, onCaptured, title, description }: PhotoCaptureDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<"camera" | "preview">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setError("Unable to access camera. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
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
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
    fetch(capturedImage)
      .then((r) => r.blob())
      .then((blob) => {
        onCaptured(blob);
        handleClose();
      });
  }, [capturedImage, onCaptured]);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setStep("camera");
    startCamera();
  }, [startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    setStep("camera");
    setCapturedImage(null);
    setError(null);
    setCountdown(null);
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      setStep("camera");
      setCapturedImage(null);
      setError(null);
      startCamera();
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === "camera" && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <span className="text-7xl font-bold text-white animate-pulse drop-shadow-lg">{countdown}</span>
                  </div>
                )}

                {/* Timestamp overlay */}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {new Date().toLocaleTimeString()}
                  </Badge>
                </div>
              </div>

              <Button 
                onClick={startCountdown} 
                disabled={countdown !== null || !cameraReady} 
                className="w-full gap-2" 
                size="lg"
              >
                <Camera className="h-4 w-4" />
                {!cameraReady ? "Starting Camera..." : countdown !== null ? `Capturing in ${countdown}...` : "Capture Photo"}
              </Button>
            </div>
          )}

          {step === "preview" && capturedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black shadow-xl aspect-video">
                <img 
                  src={capturedImage} 
                  alt="Captured photo" 
                  className="w-full h-full object-cover"
                />
                {/* Timestamp overlay */}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {new Date().toLocaleTimeString()}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1 gap-2" size="lg">
                  <RefreshCw className="h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleConfirm} className="flex-1 gap-2" size="lg">
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

export default PhotoCaptureDialog;
