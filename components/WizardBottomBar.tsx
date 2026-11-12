"use client";

import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";

interface WizardBottomBarProps {
  currentStep: 1 | 2 | 3;
  onBack: () => void;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isNextDisabled: boolean;
  disabledHint?: string;
  isSyncing: boolean;
  isUploading: boolean;
  language: "en" | "ar";
}

export function WizardBottomBar({
  currentStep,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled,
  disabledHint,
  isSyncing,
  isUploading,
  language
}: WizardBottomBarProps) {
  const isRtl = language === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="sticky bottom-0 z-30 w-full bg-[#0c0c0c]/95 backdrop-blur-md border-t border-neutral-800/80 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Disabled Hint or Step info */}
        <div className="w-full sm:w-auto text-center sm:text-left rtl:sm:text-right">
          {isNextDisabled && disabledHint ? (
            <span className="text-[11px] font-mono text-amber-400/90 font-medium bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-900/30 inline-block">
              ⚠️ {disabledHint}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-neutral-500">
              {language === "ar"
                ? `الخطوة ${currentStep} من ٣`
                : `Step ${currentStep} of 3`}
            </span>
          )}
        </div>

        {/* Buttons Deck */}
        <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
          {/* Back Button */}
          {currentStep > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <BackIcon className="h-4 w-4" />
              <span>{language === "ar" ? "السابق" : "Back"}</span>
            </button>
          )}

          {/* Next or Submit Button */}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={isNextDisabled}
              className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#ffe380] active:scale-[0.99] text-black font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_2px_12px_rgba(212,175,55,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{language === "ar" ? "التالي" : "Next"}</span>
              <NextIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isNextDisabled || isSyncing || isUploading}
              className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#ffe380] active:scale-[0.99] text-black font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_2px_14px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  <span>{language === "ar" ? "جاري الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-black" />
                  <span>{language === "ar" ? "اعتماد وحفظ" : "Save Frame"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
