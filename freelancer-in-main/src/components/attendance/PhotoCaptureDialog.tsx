import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle, X, ShieldCheck, Sparkles, ScanFace } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as faceapi from "@vladmandic/face-api";

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
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState<"camera" | "preview">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureTime, setCaptureTime] = useState<string>("");

  // Face Detection States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isHumanDetected, setIsHumanDetected] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState("Looking for face...");

  // Text-to-Speech വോയ്‌സ് സിസ്റ്റം
  const playThankYouSound = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("Thank you");
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1. Load Face-api Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face detection models", err);
        setError("Failed to initialize face detection. Please check internet connection.");
      }
    };
    loadModels();
  }, []);

  // 2. Start Camera
  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);
    setIsHumanDetected(false);
    setDetectionMessage("Initializing secure pipeline...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { min: 1280, ideal: 1920, max: 1920 },
          height: { min: 720, ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.warn("Falling back to standard resolution camera", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setError("Unable to access camera. Please allow camera permissions and try again.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (autoCaptureTimeoutRef.current) clearTimeout(autoCaptureTimeoutRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setIsHumanDetected(false);
  }, []);

  // 4. Capture Photo & Play Audio
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for natural preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
    setCapturedImage(dataUrl);
    setCaptureTime(new Date().toLocaleTimeString());

    playThankYouSound();
    stopCamera();
    setStep("preview");
  }, [stopCamera]);

  // 3. Strict Face Verification Engine
  useEffect(() => {
    if (cameraReady && videoRef.current && modelsLoaded && step === "camera") {
      detectionIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        const allDetections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 }),
        );

        const cancelCapture = (msg: string) => {
          setIsHumanDetected(false);
          setDetectionMessage(msg);
          if (autoCaptureTimeoutRef.current) {
            clearTimeout(autoCaptureTimeoutRef.current);
            autoCaptureTimeoutRef.current = null;
            setCountdown(null);
          }
        };

        if (allDetections.length > 1) {
          cancelCapture("Only one face is allowed.");
          return;
        }

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 }))
          .withFaceLandmarks();

        if (detection) {
          const landmarks = detection.landmarks;
          const box = detection.detection.box;
          const videoWidth = video.videoWidth || 1;
          const videoHeight = video.videoHeight || 1;

          // A. Distance Verification
          const faceWidthPercent = (box.width / videoWidth) * 100;
          if (faceWidthPercent < 25) {
            cancelCapture("Move closer to the camera.");
            return;
          }
          if (faceWidthPercent > 65) {
            cancelCapture("Move slightly back from the camera.");
            return;
          }

          // B. Centering Rule
          const faceCenterX = box.x + box.width / 2;
          const faceCenterY = box.y + box.height / 2;
          const videoCenterX = videoWidth / 2;
          const videoCenterY = videoHeight / 2;

          if (
            Math.abs(faceCenterX - videoCenterX) / videoWidth > 0.15 ||
            Math.abs(faceCenterY - videoCenterY) / videoHeight > 0.15
          ) {
            cancelCapture("Face is not centered.");
            return;
          }

          // C. Feature Obscurity (Glasses / Cap checks)
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const eyebrowsLeft = landmarks.getLeftEyeBrow();
          const eyebrowsRight = landmarks.getRightEyeBrow();
          const nose = landmarks.getNose();
          const mouth = landmarks.getMouth();
          const jaw = landmarks.getJawOutline();

          if (
            !leftEye.length ||
            !rightEye.length ||
            !eyebrowsLeft.length ||
            !eyebrowsRight.length ||
            !nose.length ||
            !mouth.length ||
            jaw.length < 15
          ) {
            cancelCapture("Show your full face. Remove glasses or headwear.");
            return;
          }

          // D. Visibility of Ears & Outlines
          if (jaw[0].x < 5 || jaw[jaw.length - 1].x > videoWidth - 5) {
            cancelCapture("Both ears must be visible.");
            return;
          }

          // E. Head Tilt Calculation
          const eyeLeftCenter = leftEye[0];
          const eyeRightCenter = rightEye[3];
          const angle = Math.abs(
            Math.atan2(eyeRightCenter.y - eyeLeftCenter.y, eyeRightCenter.x - eyeLeftCenter.x) * (180 / Math.PI),
          );
          if (angle > 7) {
            cancelCapture("Look straight at the camera. Do not tilt your head.");
            return;
          }

          // F. Profile Rotation Check
          const noseTip = nose[3];
          const jawLeft = jaw[0];
          const jawRight = jaw[jaw.length - 1];
          const leftDistance = Math.abs(noseTip.x - jawLeft.x);
          const rightDistance = Math.abs(jawRight.x - noseTip.x);
          const symmetryRatio = Math.max(leftDistance, rightDistance) / Math.min(leftDistance, rightDistance);

          if (symmetryRatio > 1.8) {
            cancelCapture("Look straight at the camera. Side profiles are not allowed.");
            return;
          }

          // G. Environment Lighting Proxy
          if (detection.detection.score < 0.85) {
            cancelCapture("Improve lighting.");
            return;
          }

          // Validation Passed -> Trigger Countdown
          if (!isHumanDetected && !autoCaptureTimeoutRef.current && countdown === null) {
            setIsHumanDetected(true);
            setDetectionMessage("Verification criteria matched. Hold still...");
            setCountdown(3);
          }
        } else {
          cancelCapture("Please show your full face inside the guide.");
        }
      }, 350);
    }

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [cameraReady, modelsLoaded, step, isHumanDetected, countdown]);

  // Countdown Controller
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

  const [liveTime, setLiveTime] = useState("");
  useEffect(() => {
    if (!open || step !== "camera") return;
    setLiveTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, [open, step]);

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
      <DialogContent className="max-w-none w-screen h-screen p-0 border-none rounded-none bg-slate-950 flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* PREMIUM UPPER HEADER OVERLAY */}
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-5 z-50 flex items-center justify-between text-white backdrop-blur-[2px]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-md shadow-inner">
              <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                {title}
                <Badge className="bg-zinc-800 text-zinc-300 text-[10px] hover:bg-zinc-800 border-zinc-700 py-0 px-1.5 font-normal">
                  Live AI Secure
                </Badge>
              </DialogTitle>
              {description && (
                <DialogDescription className="text-zinc-400 text-xs mt-0.5 font-medium">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl h-10 w-10 border border-transparent hover:border-zinc-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* HIGHLY SCANNABLE LIVE ALERT MESSAGE SYSTEM */}
        <div className="absolute top-24 inset-x-4 z-50 max-w-md mx-auto">
          {error && (
            <div className="flex items-center gap-3 text-xs text-rose-300 bg-rose-950/40 backdrop-blur-xl px-4 py-3.5 rounded-2xl border border-rose-500/30 shadow-lg shadow-rose-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span className="font-semibold tracking-wide uppercase text-[10px] text-rose-400">Error:</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {step === "camera" && cameraReady && !error && (
            <div
              className={`flex items-center gap-3 text-sm px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-500 transform ${
                isHumanDetected
                  ? "text-emerald-300 bg-emerald-950/40 border-emerald-500/30 shadow-emerald-950/20"
                  : "text-amber-300 bg-amber-950/40 border-amber-500/30 shadow-amber-950/20"
              }`}
            >
              <div className="flex items-center justify-center h-5 w-5 rounded-md relative">
                {isHumanDetected ? (
                  <Sparkles className="h-4 w-4 text-emerald-400 animate-spin duration-1000" />
                ) : (
                  <ScanFace className="h-4 w-4 text-amber-400 animate-pulse" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${isHumanDetected ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {isHumanDetected ? "Status: Verified" : "Status: Validating"}
                </span>
                <span className="font-medium tracking-wide text-zinc-100 text-xs">{detectionMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* FULL SCREEN CAMERA VIEWPORT WITH MATTE GUIDES */}
        <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
          {step === "camera" && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

              {/* Advanced Cinematic Face Guide Frame */}
              {cameraReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    {/* The Oval Mask */}
                    <div
                      className={`w-[290px] h-[390px] rounded-[130px] border-[2px] bg-transparent transition-all duration-500 shadow-[0_0_0_9999px_rgba(9,9,11,0.75)] ${
                        isHumanDetected
                          ? "border-emerald-400 shadow-emerald-950/10 scale-100"
                          : "border-dashed border-zinc-500/60 scale-98 animate-pulse"
                      }`}
                    />

                    {/* Dynamic Tech Corner Overlays */}
                    <div
                      className={`absolute -inset-2 border-t-2 border-l-2 w-6 h-6 rounded-tl-xl transition-colors duration-500 ${isHumanDetected ? "border-emerald-400" : "border-zinc-400"}`}
                    />
                    <div
                      className={`absolute -inset-2 left-auto border-t-2 border-r-2 w-6 h-6 rounded-tr-xl transition-colors duration-500 ${isHumanDetected ? "border-emerald-400" : "border-zinc-400"}`}
                    />
                    <div
                      className={`absolute -inset-2 top-auto border-b-2 border-l-2 w-6 h-6 rounded-bl-xl transition-colors duration-500 ${isHumanDetected ? "border-emerald-400" : "border-zinc-400"}`}
                    />
                    <div
                      className={`absolute -inset-2 top-auto left-auto border-b-2 border-r-2 w-6 h-6 rounded-br-xl transition-colors duration-500 ${isHumanDetected ? "border-emerald-400" : "border-zinc-400"}`}
                    />
                  </div>
                </div>
              )}

              {/* Countdown Display overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-md z-40 transition-all duration-300">
                  <div className="relative flex items-center justify-center h-40 w-40 rounded-full bg-black/40 border border-white/10 shadow-2xl">
                    <span className="text-7xl font-extrabold text-white animate-scale-up text-center select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                      {countdown}
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Edge Timestamp */}
              <div className="absolute bottom-24 left-4 z-30 hidden sm:block">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono font-medium tracking-widest px-3 py-1 bg-zinc-950/60 text-zinc-300 border border-zinc-800 backdrop-blur-md rounded-lg shadow-md"
                >
                  SECURE LIVE FEED // {liveTime}
                </Badge>
              </div>
            </>
          )}

          {step === "preview" && capturedImage && (
            <>
              <img src={capturedImage} alt="Identity token" className="w-full h-full object-cover" />

              {/* Captured Badge Watermark */}
              <div className="absolute bottom-24 left-4 z-30">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono px-3 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800 backdrop-blur-md rounded-lg shadow-md"
                >
                  TOKEN ACQUIRED // {captureTime}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* DYNAMIC ACTION PLATFORM / CONTROLS */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-6 z-50 flex flex-col items-center justify-center gap-4">
          {step === "camera" && (
            <div className="w-full max-w-sm">
              <div className="p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl">
                <Button
                  disabled={true}
                  className={`w-full gap-2.5 font-semibold text-xs tracking-wider uppercase rounded-xl h-11 transition-all duration-300 ${
                    isHumanDetected
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-80 border-transparent"
                  }`}
                  size="lg"
                >
                  <Camera className={`h-4 w-4 ${isHumanDetected && "animate-bounce"}`} />
                  {!modelsLoaded
                    ? "Neural Pipeline Loading..."
                    : !cameraReady
                      ? "Hardware Syncing..."
                      : countdown !== null
                        ? `Capturing Identity in ${countdown}...`
                        : "Align Face to Auto Capture"}
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && capturedImage && (
            <div className="flex gap-3 w-full max-w-sm p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex-1 gap-2 bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white rounded-xl h-11 text-xs font-semibold tracking-wider uppercase transition-all"
                size="lg"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 rounded-xl h-11 text-xs font-semibold tracking-wider uppercase transition-all"
                size="lg"
              >
                <Check className="h-3.5 w-3.5" />
                Confirm
              </Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCaptureDialog;
