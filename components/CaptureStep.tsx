"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  RotateCcw, 
  Check, 
  RefreshCw, 
  Maximize2, 
  Video, 
  ShieldAlert, 
  HelpCircle, 
  UploadCloud, 
  Tag, 
  Info, 
  AlertTriangle,
  ArrowRight,
  Eye
} from "lucide-react";
import { Snapshot, CAPTURE_STEPS, STATIC_INITIAL_SAMPLES } from "./inventory-constants";

interface CaptureStepProps {
  language: "en" | "ar";
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  isSimulatingCamera: boolean;
  simulatedSampleIdx: number;
  currentStepIndex: number; // 0..3 active slot, or 4 if all taken
  snapshots: Snapshot[];
  isUploadingImages: boolean;
  onSnapPhoto: () => void;
  onSelectSlot: (slotIdx: number) => void;
  onResetCapture: () => void;
  onImageFileUpload: (file: File, stepIdx?: number) => void;
  onRetryUpload?: (stepIdx: number) => void;
  onSetLightboxImage: (url: string | null) => void;
  onSwitchToCamera: () => void;
  onSwitchToSimulation: () => void;
  onPrevSimSample: () => void;
  onNextSimSample: () => void;
  onAdvanceToStep2: () => void;
  onStartCamera: () => void;
}

export function CaptureStep({
  language,
  videoRef,
  canvasRef,
  cameraStream,
  cameraError,
  isSimulatingCamera,
  simulatedSampleIdx,
  currentStepIndex,
  snapshots,
  isUploadingImages,
  onSnapPhoto,
  onSelectSlot,
  onResetCapture,
  onImageFileUpload,
  onRetryUpload,
  onSetLightboxImage,
  onSwitchToCamera,
  onSwitchToSimulation,
  onPrevSimSample,
  onNextSimSample,
  onAdvanceToStep2,
  onStartCamera
}: CaptureStepProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState<number | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const slotFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetSlotIdx, setTargetSlotIdx] = useState<number | null>(null);

  const allCaptured = snapshots.every((s) => !!s.blobUrl);
  const activeSlot = Math.min(Math.max(0, currentStepIndex), 3);

  // Auto-advance logic: When all 4 photos are captured, start a ~650ms countdown to move to Step 2
  useEffect(() => {
    if (allCaptured && currentStepIndex >= 4) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const left = Math.max(0, 600 - elapsed);
        setAutoAdvanceRemaining(left);
        if (left <= 0) {
          clearInterval(interval);
        }
      }, 50);

      const timer = setTimeout(() => {
        clearInterval(interval);
        setAutoAdvanceRemaining(null);
        onAdvanceToStep2();
      }, 650);

      autoAdvanceRef.current = timer;

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    } else {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    }
  }, [allCaptured, currentStepIndex, onAdvanceToStep2]);

  const cancelAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceRemaining(null);
  };

  const currentSample = STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length];

  const slotLabels = language === "ar" ? [
    { name: "الواجهة الأمامية", tag: "صورة الكتالوج", hint: "الزاوية الأمامية للإطار" },
    { name: "الملف الجانبي", tag: "صورة الكتالوج", hint: "الجانب الأيمن أو الأيسر" },
    { name: "الذراع الأيسر", tag: "ختم مؤقت", hint: "ختم القياسات بالذراع" },
    { name: "الذراع الأيمن", tag: "ختم مؤقت", hint: "ختم الموديل أو الماركة" }
  ] : [
    { name: "Front Angle", tag: "Catalog Photo", hint: "Frame Front View" },
    { name: "Side Profile", tag: "Catalog Photo", hint: "Side temple view" },
    { name: "Left Temple", tag: "Stamp Photo", hint: "Inner sizing stamp" },
    { name: "Right Temple", tag: "Stamp Photo", hint: "Brand/model stamp" }
  ];

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            cancelAutoAdvance();
            onImageFileUpload(f, activeSlot);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={slotFileInputRef}
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && targetSlotIdx !== null) {
            cancelAutoAdvance();
            onImageFileUpload(f, targetSlotIdx);
            e.target.value = "";
          }
        }}
      />

      {/* Auto-advance banner when all 4 are captured */}
      {autoAdvanceRemaining !== null && (
        <div className="bg-[#D4AF37]/15 border border-[#D4AF37] p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono shadow-[0_0_20px_rgba(212,175,55,0.2)] animate-pulse">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <span className="text-white font-bold">
              {language === "ar" ? "اكتملت اللقطات الـ 4! الانتقال للمواصفات..." : "All 4 photos captured! Moving to specs..."}
            </span>
          </div>
          <button
            type="button"
            onClick={cancelAutoAdvance}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] border border-[#D4AF37]/40 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            {language === "ar" ? "مراجعة الصور" : "Review Photos"}
          </button>
        </div>
      )}

      {/* Top Controls: Mode Switcher & Quick Reset */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
            {language === "ar" ? "المنفذ البصري:" : "Viewfinder:"}
          </span>
          <span className="text-xs font-mono text-neutral-400">
            {CAPTURE_STEPS[activeSlot]?.indicator} ({activeSlot + 1}/4)
          </span>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={onSwitchToCamera}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              !isSimulatingCamera
                ? "bg-[#D4AF37] text-black shadow"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Use Hardware Camera"
          >
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "ar" ? "كاميرا" : "Camera"}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-all cursor-pointer"
            title="Upload File"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "ar" ? "رفع" : "Upload"}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToSimulation}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isSimulatingCamera
                ? "bg-[#D4AF37] text-black shadow"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Simulation Demo Preset"
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "ar" ? "محاكاة" : "Simulate"}</span>
          </button>
        </div>
      </div>

      {/* COMPACT VIEWFINDER VIEW (Sized so grid fits without phone scrolling) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            cancelAutoAdvance();
            onImageFileUpload(files[0], activeSlot);
          }
        }}
        className={`relative w-full rounded-2xl border bg-neutral-950 overflow-hidden shadow-xl aspect-[16/10] sm:aspect-[16/9] max-h-[260px] flex items-center justify-center transition-all ${
          isDraggingOver
            ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 bg-neutral-900/90"
            : cameraError && !isSimulatingCamera
              ? "border-amber-500/50"
              : "border-neutral-800"
        }`}
      >
        {/* Hidden internal canvas for snapshot extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Status Overlay Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-neutral-800 text-[11px] font-mono flex items-center gap-1.5 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${
              !isSimulatingCamera && cameraStream
                ? "bg-emerald-500 animate-pulse"
                : isSimulatingCamera
                  ? "bg-[#D4AF37]"
                  : "bg-amber-500"
            }`}
          />
          <span className="text-neutral-300 font-bold uppercase">
            {!isSimulatingCamera && cameraStream ? "LIVE LENS" : isSimulatingCamera ? "PRESET" : "STANDBY"}
          </span>
        </div>

        {/* Current target slot indicator */}
        <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 bg-[#D4AF37] text-black text-xs font-mono font-extrabold rounded-lg shadow pointer-events-none">
          {CAPTURE_STEPS[activeSlot]?.indicator} (P{activeSlot + 1})
        </div>

        {/* Drag and Drop Active Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#D4AF37] rounded-2xl">
            <UploadCloud className="h-10 w-10 text-[#D4AF37] animate-bounce mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">
              {language === "ar" ? "أفلت صورة الإطار هنا" : "Drop Frame Image Here"}
            </h4>
            <p className="text-xs text-neutral-300 font-mono">
              {language === "ar"
                ? `سيتم حفظها للخانة: ${CAPTURE_STEPS[activeSlot]?.indicator}`
                : `Target: ${CAPTURE_STEPS[activeSlot]?.indicator}`}
            </p>
          </div>
        )}

        {/* Always mounted video element for stream binding */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-100 transition-opacity duration-200 ${
            isSimulatingCamera || cameraError || !cameraStream
              ? "opacity-0 absolute inset-0 pointer-events-none"
              : "opacity-100"
          }`}
        />

        {/* 1. Simulation Viewport */}
        {isSimulatingCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 z-10">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-1.5">
                <Camera className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-mono text-[#D4AF37] font-bold">
                {currentSample.brand.toUpperCase()} {currentSample.model_name}
              </span>
              <p className="text-[11px] text-neutral-400 font-mono">
                {currentSample.material} • {currentSample.front_size}[] {currentSample.bridge_size}-{currentSample.temple_length}
              </p>
            </div>

            {/* Bottom sample switcher */}
            <div className="w-full bg-black/80 px-3 py-1.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-neutral-300 truncate font-semibold text-[11px]">
                {currentSample.frame_name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onPrevSimSample}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-bold cursor-pointer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={onNextSimSample}
                  className="px-2 py-0.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-xs font-bold cursor-pointer"
                >
                  {language === "ar" ? "التالي" : "Next"} ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Permission Denied / Blocked / Error UI */}
        {!isSimulatingCamera && cameraError && (
          <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-neutral-950 z-20 overflow-y-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {language === "ar" ? "تعذر تشغيل الكاميرا المباشرة" : "Camera Access Unavailable"}
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm mb-3 font-mono leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onStartCamera}
                className="min-h-[38px] px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#ffe380] text-black text-xs font-mono font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{language === "ar" ? "إعادة المحاولة" : "Try again"}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[38px] px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-xs font-mono font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{language === "ar" ? "رفع صورة" : "Upload Image"}</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToSimulation}
                className="min-h-[38px] px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-mono font-bold rounded-lg cursor-pointer"
              >
                <span>{language === "ar" ? "استخدام المحاكاة" : "Use Preset"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Idle / Standby State (Waiting to Start Camera on iOS / gesture) */}
        {!isSimulatingCamera && !cameraError && !cameraStream && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-2.5">
              <Camera className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {language === "ar" ? "تشغيل الكاميرا المباشرة" : "Enable Live Camera"}
            </h4>
            <p className="text-xs text-neutral-400 max-w-xs mb-3 font-mono leading-relaxed">
              {language === "ar"
                ? "اضغط لتفعيل الكاميرا والبدء بالتقاط زوايا الإطار للرقمنة البصرية."
                : "Tap below to start camera stream and begin sequential frame captures."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onStartCamera}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#ffe380] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Video className="h-4 w-4 text-black" />
                <span>{language === "ar" ? "تشغيل الكاميرا" : "Enable Camera"}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4 text-neutral-400" />
                <span>{language === "ar" ? "رفع صورة" : "Upload Photo"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Optical Scanning Shimmer Line (Only when video stream is live) */}
        {!isSimulatingCamera && !cameraError && cameraStream && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[#D4AF37]/40 pointer-events-none shadow-[0_0_10px_#D4AF37] animate-[bounce_4.5s_infinite]" />
        )}
      </div>

      {/* Snap Primary Action Button Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            cancelAutoAdvance();
            onSnapPhoto();
          }}
          className="flex-1 min-h-[48px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#ffe380] active:scale-[0.99] text-black font-mono font-bold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(212,175,55,0.25)] cursor-pointer"
        >
          <Camera className="h-5 w-5 text-black" />
          <span>
            {snapshots[activeSlot]?.blobUrl
              ? `${language === "ar" ? "إعادة تصوير" : "Retake"} ${CAPTURE_STEPS[activeSlot]?.indicator}`
              : `${language === "ar" ? "التقاط" : "Snap"} ${CAPTURE_STEPS[activeSlot]?.indicator}`}
          </span>
          <span className="text-xs px-2 py-0.5 bg-black/15 rounded-full font-extrabold ml-1">
            {activeSlot + 1}/4
          </span>
        </button>

        {/* Upload Button for this slot */}
        <button
          type="button"
          onClick={() => {
            setTargetSlotIdx(activeSlot);
            slotFileInputRef.current?.click();
          }}
          className="min-h-[48px] px-3.5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#D4AF37]/50 text-neutral-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          title="Upload image file for this slot"
        >
          <Upload className="h-4 w-4 text-[#D4AF37]" />
          <span className="hidden sm:inline">{language === "ar" ? "رفع ملف" : "Upload"}</span>
        </button>

        {/* Full Reset Sequence */}
        <button
          type="button"
          onClick={() => {
            cancelAutoAdvance();
            onResetCapture();
          }}
          className="min-h-[48px] px-3.5 py-3 bg-neutral-900 border border-neutral-800 hover:border-red-900/50 text-neutral-400 hover:text-red-300 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={language === "ar" ? "إعادة ضبط جميع الخطوات" : "Reset All 4 Angles"}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* 2x2 GRID OF FOUR SLOTS: Front, Side, Left, Right */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {language === "ar" ? "شبكة زوايا الإطار (٤ زوايا)" : "4-Angle Frame Slots"}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[#D4AF37] font-bold">
              {snapshots.filter((s) => !!s.blobUrl).length}/4
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400">
            {language === "ar" ? "اضغط على أي زاوية لإعادة تصويرها منفردة" : "Tap slot to retake that angle"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {snapshots.map((snap, idx) => {
            const stepDef = CAPTURE_STEPS[idx];
            const meta = slotLabels[idx];
            const isActive = activeSlot === idx;
            const isCaptured = !!snap.blobUrl;
            const isUploading = snap.uploadStatus === "uploading";
            const isUploaded = snap.uploadStatus === "success";
            const isError = snap.uploadStatus === "error";

            return (
              <div
                key={snap.stepIdx}
                onClick={() => {
                  cancelAutoAdvance();
                  onSelectSlot(idx);
                  if (!cameraStream && !isSimulatingCamera) {
                    onStartCamera();
                  }
                }}
                className={`relative rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer min-h-[135px] group ${
                  isActive
                    ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_16px_rgba(212,175,55,0.25)] ring-1 ring-[#D4AF37]/50"
                    : isCaptured
                      ? "border-neutral-700/80 bg-neutral-900/90 hover:border-neutral-500"
                      : "border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                {/* Header Tag in Slot: Type & Indicator */}
                <div className="flex items-center justify-between mb-1.5 gap-1">
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      stepDef.type === "catalog"
                        ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                        : "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                    }`}
                  >
                    {meta.tag}
                  </span>

                  <span className="text-[10px] font-mono font-bold text-neutral-400">
                    P{snap.stepIdx}
                  </span>
                </div>

                {/* Body: Thumbnail or Empty State Placeholder */}
                {isCaptured && snap.blobUrl ? (
                  <div className="relative w-full flex-1 rounded-lg overflow-hidden bg-black/60 aspect-[4/3] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={snap.blobUrl}
                      alt={meta.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />

                    {/* Hover Overlay with Preview & Replace */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded-lg">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetLightboxImage(snap.blobUrl);
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg cursor-pointer"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelAutoAdvance();
                          setTargetSlotIdx(idx);
                          slotFileInputRef.current?.click();
                        }}
                        className="p-1.5 bg-[#D4AF37] hover:bg-[#ffe380] text-black rounded-lg cursor-pointer"
                        title="Replace from File"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Upload spinner */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center rounded-lg pointer-events-none gap-1">
                        <RefreshCw className="h-4 w-4 text-[#D4AF37] animate-spin" />
                        <span className="text-[9px] font-mono text-neutral-300">Syncing...</span>
                      </div>
                    )}

                    {/* Upload Status Badge */}
                    <div className="absolute top-1 right-1 pointer-events-none">
                      {isUploaded && (
                        <div className="bg-emerald-500 text-black p-0.5 rounded-full shadow" title="Synced">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                      {isError && (
                        <div className="bg-amber-500 text-black p-0.5 rounded-full shadow" title="Local Buffer Fallback">
                          <Info className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-2 text-center text-neutral-500 group-hover:text-neutral-300 transition-colors">
                    <Camera className="h-5 w-5 mb-1 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                    <span className="text-[11px] font-mono font-bold text-neutral-300">
                      {meta.name}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 leading-tight mt-0.5">
                      {language === "ar" ? "انقر للالتقاط" : "Tap to capture"}
                    </span>
                  </div>
                )}

                {/* Footer slot indicator */}
                <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-neutral-850 pt-1">
                  <span className="truncate font-semibold text-neutral-300">
                    {meta.name}
                  </span>
                  {isCaptured && (
                    <span className="text-[#D4AF37] text-[9px] hover:underline cursor-pointer">
                      {language === "ar" ? "إعادة" : "Retake"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fallback notification if Cloudinary failed but offline buffer is ready */}
        {snapshots.some((s) => s.uploadStatus === "error") && (
          <div className="mt-3 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-xl text-xs font-mono text-amber-300/90 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {language === "ar"
                ? "تم الاحتفاظ باللقطات في الذاكرة المؤقتة للوردية. سيتم الحفظ بنجاح."
                : "Cloudinary upload buffered locally. Images will submit cleanly."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
