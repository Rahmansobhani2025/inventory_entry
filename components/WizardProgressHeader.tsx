"use client";

import React from "react";
import { Camera, Sparkles, CheckCircle2, ChevronRight, Check } from "lucide-react";

interface WizardProgressHeaderProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  language: "en" | "ar";
  maxVisitedStep: number;
  isStep1Complete: boolean;
  isStep2Complete: boolean;
}

export function WizardProgressHeader({
  currentStep,
  onStepClick,
  language,
  maxVisitedStep,
  isStep1Complete,
  isStep2Complete
}: WizardProgressHeaderProps) {
  const steps = [
    {
      id: 1 as const,
      labelEn: "Capture",
      fullEn: "Capture Angles",
      labelAr: "الالتقاط",
      fullAr: "التقاط الصور",
      icon: Camera,
      isCompleted: isStep1Complete
    },
    {
      id: 2 as const,
      labelEn: "AI & Specs",
      fullEn: "AI Review & Specs",
      labelAr: "المواصفات",
      fullAr: "الفحص والمواصفات",
      icon: Sparkles,
      isCompleted: isStep2Complete
    },
    {
      id: 3 as const,
      labelEn: "Pricing & Save",
      fullEn: "Pricing & Stock",
      labelAr: "التسعير والحفظ",
      fullAr: "التسعير والمخزون",
      icon: CheckCircle2,
      isCompleted: false
    }
  ];

  return (
    <div className="sticky top-0 z-20 bg-[#0c0c0c]/95 backdrop-blur-md border-b border-neutral-800/80 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Progress Bar Line */}
        <div className="relative w-full h-1 bg-neutral-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37]/80 via-[#D4AF37] to-[#ffe380] transition-all duration-300 ease-out"
            style={{
              width: currentStep === 1 ? "33.3%" : currentStep === 2 ? "66.6%" : "100%"
            }}
          />
        </div>

        {/* Steps navigation buttons */}
        <div className="grid grid-cols-3 gap-2">
          {steps.map((s) => {
            const isActive = currentStep === s.id;
            const isClickable = s.id <= maxVisitedStep || s.id < currentStep || (s.id === 2 && isStep1Complete) || (s.id === 3 && isStep1Complete && isStep2Complete);
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => isClickable && onStepClick(s.id)}
                disabled={!isClickable}
                className={`min-h-[44px] flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-mono select-none cursor-pointer ${
                  isActive
                    ? "bg-[#D4AF37]/15 border border-[#D4AF37]/60 text-white shadow-[0_0_12px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/30"
                    : s.isCompleted
                      ? "bg-neutral-900/90 border border-emerald-900/50 text-neutral-300 hover:border-emerald-700/60 hover:text-white"
                      : isClickable
                        ? "bg-neutral-900/50 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                        : "bg-neutral-950/40 border border-neutral-900 text-neutral-600 cursor-not-allowed"
                }`}
                title={language === "ar" ? s.fullAr : s.fullEn}
              >
                {/* Step indicator circle */}
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px] transition-colors ${
                    isActive
                      ? "bg-[#D4AF37] text-black font-extrabold"
                      : s.isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {s.isCompleted && !isActive ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.id
                  )}
                </span>

                <div className="flex flex-col text-left rtl:text-right overflow-hidden">
                  <span className="hidden sm:inline text-[10px] text-neutral-400 font-semibold uppercase tracking-wider leading-none">
                    {language === "ar" ? `الخطوة ${s.id}` : `Step ${s.id}`}
                  </span>
                  <span className={`truncate font-bold ${isActive ? "text-[#D4AF37]" : "text-neutral-300"}`}>
                    {language === "ar" ? s.labelAr : s.labelEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
