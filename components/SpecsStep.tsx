"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  ChevronDown, 
  ShieldAlert, 
  FileText, 
  HelpCircle,
  Eye,
  Info,
  X
} from "lucide-react";

interface SpecsStepProps {
  language: "en" | "ar";
  brand: string;
  onBrandChange: (val: string) => void;
  modelName: string;
  onModelChange: (val: string) => void;
  frameName: string;
  onFrameNameChange: (val: string) => void;
  onRestoreDefaultFrameName: () => void;
  frontSize: string;
  onFrontSizeChange: (val: string) => void;
  bridgeSize: string;
  onBridgeSizeChange: (val: string) => void;
  templeLength: string;
  onTempleLengthChange: (val: string) => void;
  altText: string;
  onAltTextChange: (val: string) => void;
  agentInstruction: string;
  onAgentInstructionChange: (val: string) => void;
  isExtractingWithAI: boolean;
  aiError: string | null;
  aiFilledFields: Set<string>;
  onRunAIExtraction: () => void;
  onClearAiError: () => void;
}

export function SpecsStep({
  language,
  brand,
  onBrandChange,
  modelName,
  onModelChange,
  frameName,
  onFrameNameChange,
  onRestoreDefaultFrameName,
  frontSize,
  onFrontSizeChange,
  bridgeSize,
  onBridgeSizeChange,
  templeLength,
  onTempleLengthChange,
  altText,
  onAltTextChange,
  agentInstruction,
  onAgentInstructionChange,
  isExtractingWithAI,
  aiError,
  aiFilledFields,
  onRunAIExtraction,
  onClearAiError
}: SpecsStepProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const hasInspectionAlert = Boolean(agentInstruction && agentInstruction.trim().length > 0);
  const hasSecondaryContent = Boolean(altText || agentInstruction);

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-6">
      {/* 1. AI EXTRACTION STATUS & ANIMATION BANNER */}
      {isExtractingWithAI ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border border-[#D4AF37]/60 p-4 rounded-2xl shadow-[0_0_25px_rgba(212,175,55,0.15)]">
          {/* Shimmer sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent animate-[shimmer_2s_infinite]" />
          
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-[#D4AF37] animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{language === "ar" ? "الذكاء الاصطناعي يحلل أبعاد الإطار والنصوص..." : "AI analyzing frame geometry & text..."}</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                </h4>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  {language === "ar" ? "يمكنك التعديل أو كتابة البيانات في أي وقت؛ لن يتم استبدال ما تكتبه." : "You can type anytime; entered values are never overwritten."}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black/50 border border-neutral-800 rounded-lg text-xs font-mono text-[#D4AF37]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{language === "ar" ? "معالجة بصرية" : "Scanning"}</span>
            </div>
          </div>
        </div>
      ) : aiError ? (
        /* Friendly Inline Error Alert with Retry & Manual Note */
        <div className="p-4 bg-neutral-950 border border-amber-800/60 rounded-2xl text-xs sm:text-sm text-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-400 block mb-0.5">
                {language === "ar" ? "تنبيه فحص الذكاء الاصطناعي:" : "AI Inspection Notice:"}
              </span>
              <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                {aiError}
              </p>
              <p className="font-mono text-[11px] text-neutral-400 mt-1">
                {language === "ar" ? "يمكنك إدخال المواصفات يدوياً أدناه دون أي تعطيل." : "You can fill in the specifications manually below without waiting."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onRunAIExtraction}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{language === "ar" ? "إعادة المحاولة" : "Retry AI"}</span>
            </button>
            <button
              type="button"
              onClick={onClearAiError}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Ready state banner with Re-run AI option */
        <div className="bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span>
              {aiFilledFields.size > 0
                ? (language === "ar" ? `تم استخراج ${aiFilledFields.size} حقول بواسطة الذكاء الاصطناعي` : `${aiFilledFields.size} fields populated from optical analysis`)
                : (language === "ar" ? "فحص الإطار والمواصفات البصرية" : "Frame specifications & optical measurements")}
            </span>
          </div>

          <button
            type="button"
            onClick={onRunAIExtraction}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-[#D4AF37]/40 text-[#D4AF37] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Re-run AI Extraction"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{language === "ar" ? "إعادة الفحص" : "Re-run AI"}</span>
          </button>
        </div>
      )}

      {/* 2. SPECIFICATION FORM CONTAINER */}
      <div className="bg-neutral-950 p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-5">
        
        {/* Brand & Model SKU (2 Columns on tablet/desktop) */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2 mb-3">
            <h3 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <span>{language === "ar" ? "١. تعريف المنتج والماركة" : "1. Product Identification"}</span>
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">
              * {language === "ar" ? "مطلوب للمتابعة" : "Required"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Brand Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="brand-field" className="text-xs font-mono font-bold text-neutral-300">
                  {language === "ar" ? "العلامة التجارية / المصمم *" : "Brand Name / Designer *"}
                </label>
                {aiFilledFields.has("brand") && (
                  <span className="text-[10px] font-mono bg-[#D4AF37]/15 text-[#D4AF37] px-1.5 py-0.2 rounded border border-[#D4AF37]/30 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </span>
                )}
              </div>

              {isExtractingWithAI && !brand ? (
                <div className="h-10 w-full bg-neutral-900 animate-pulse rounded-xl border border-neutral-800 flex items-center px-3">
                  <span className="text-xs font-mono text-neutral-600">AI reading brand...</span>
                </div>
              ) : (
                <input
                  id="brand-field"
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  placeholder={language === "ar" ? "مثال: Tom Ford, Gucci, Ray-Ban" : "e.g. Tom Ford, Gucci, Ray-Ban"}
                  className={`min-h-[44px] bg-neutral-900 border rounded-xl px-3.5 py-2.5 text-sm font-sans text-white placeholder-neutral-600 focus:outline-none transition-all ${
                    aiFilledFields.has("brand")
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                      : "border-neutral-800 focus:border-[#D4AF37]"
                  }`}
                />
              )}
            </div>

            {/* Model Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="model-field" className="text-xs font-mono font-bold text-neutral-300">
                  {language === "ar" ? "رقم الموديل / الكود *" : "Model Number / Code *"}
                </label>
                {aiFilledFields.has("model_name") && (
                  <span className="text-[10px] font-mono bg-[#D4AF37]/15 text-[#D4AF37] px-1.5 py-0.2 rounded border border-[#D4AF37]/30 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </span>
                )}
              </div>

              {isExtractingWithAI && !modelName ? (
                <div className="h-10 w-full bg-neutral-900 animate-pulse rounded-xl border border-neutral-800 flex items-center px-3">
                  <span className="text-xs font-mono text-neutral-600">AI reading model...</span>
                </div>
              ) : (
                <input
                  id="model-field"
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => onModelChange(e.target.value)}
                  placeholder={language === "ar" ? "مثال: TF5488, GG0024S" : "e.g. TF5488, GG0024S"}
                  className={`min-h-[44px] bg-neutral-900 border rounded-xl px-3.5 py-2.5 text-sm font-sans text-white placeholder-neutral-600 focus:outline-none transition-all ${
                    aiFilledFields.has("model_name")
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                      : "border-neutral-800 focus:border-[#D4AF37]"
                  }`}
                />
              )}
            </div>
          </div>

          {/* Autogenerated Frame Label */}
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <label htmlFor="frame-name-field" className="font-semibold">
                {language === "ar" ? "تسمية إطار المخزون:" : "Inventory Frame Label:"}
              </label>
              <button
                type="button"
                onClick={onRestoreDefaultFrameName}
                className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{language === "ar" ? "استعادة التلقائي" : "Default"}</span>
              </button>
            </div>
            <input
              id="frame-name-field"
              type="text"
              value={frameName}
              onChange={(e) => onFrameNameChange(e.target.value)}
              placeholder={language === "ar" ? "توليد تلقائي للاسم (الماركة + الموديل)" : "Envision Brand Model sequence"}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* 3-ACROSS COMPACT OPTICAL MEASUREMENTS (Stays 3-across even on small mobile) */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2 mb-3">
            <h3 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
              {language === "ar" ? "٢. الأبعاد والقياسات البصرية" : "2. Optical Measurements"}
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              {language === "ar" ? "العدسة - الجسر - الذراع (مم)" : "Lens - Bridge - Temple (mm)"}
            </span>
          </div>

          {/* SINGLE COMPACT ROW OF THREE INPUTS: [ Lens ] - [ Bridge ] - [ Temple ] */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Lens Width */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="lens-width-field" className="text-[11px] font-mono font-bold text-neutral-300 truncate" title="Lens Width">
                  {language === "ar" ? "العدسة" : "Lens W"}
                </label>
                {aiFilledFields.has("front_size") && (
                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                )}
              </div>

              {isExtractingWithAI && !frontSize ? (
                <div className="h-11 bg-neutral-900 animate-pulse rounded-xl border border-neutral-800" />
              ) : (
                <div className="relative">
                  <input
                    id="lens-width-field"
                    type="number"
                    min="1"
                    value={frontSize}
                    onChange={(e) => onFrontSizeChange(e.target.value)}
                    placeholder="54"
                    className={`min-h-[44px] w-full bg-neutral-900 border rounded-xl py-2 pl-3 pr-8 rtl:pl-8 rtl:pr-3 text-sm font-mono font-bold text-center text-white placeholder-neutral-600 focus:outline-none transition-all ${
                      aiFilledFields.has("front_size")
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        : "border-neutral-800 focus:border-[#D4AF37]"
                    }`}
                  />
                  <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-3 text-[10px] font-mono text-neutral-500 pointer-events-none">
                    mm
                  </span>
                </div>
              )}
            </div>

            {/* Bridge Width */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="bridge-width-field" className="text-[11px] font-mono font-bold text-neutral-300 truncate" title="Bridge Width (DBL)">
                  {language === "ar" ? "الجسر" : "Bridge"}
                </label>
                {aiFilledFields.has("bridge_size") && (
                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                )}
              </div>

              {isExtractingWithAI && !bridgeSize ? (
                <div className="h-11 bg-neutral-900 animate-pulse rounded-xl border border-neutral-800" />
              ) : (
                <div className="relative">
                  <input
                    id="bridge-width-field"
                    type="number"
                    min="1"
                    value={bridgeSize}
                    onChange={(e) => onBridgeSizeChange(e.target.value)}
                    placeholder="18"
                    className={`min-h-[44px] w-full bg-neutral-900 border rounded-xl py-2 pl-3 pr-8 rtl:pl-8 rtl:pr-3 text-sm font-mono font-bold text-center text-white placeholder-neutral-600 focus:outline-none transition-all ${
                      aiFilledFields.has("bridge_size")
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        : "border-neutral-800 focus:border-[#D4AF37]"
                    }`}
                  />
                  <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-3 text-[10px] font-mono text-neutral-500 pointer-events-none">
                    mm
                  </span>
                </div>
              )}
            </div>

            {/* Temple Length */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="temple-length-field" className="text-[11px] font-mono font-bold text-neutral-300 truncate" title="Temple Length">
                  {language === "ar" ? "الذراع" : "Temple"}
                </label>
                {aiFilledFields.has("temple_length") && (
                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                )}
              </div>

              {isExtractingWithAI && !templeLength ? (
                <div className="h-11 bg-neutral-900 animate-pulse rounded-xl border border-neutral-800" />
              ) : (
                <div className="relative">
                  <input
                    id="temple-length-field"
                    type="number"
                    min="1"
                    value={templeLength}
                    onChange={(e) => onTempleLengthChange(e.target.value)}
                    placeholder="145"
                    className={`min-h-[44px] w-full bg-neutral-900 border rounded-xl py-2 pl-3 pr-8 rtl:pl-8 rtl:pr-3 text-sm font-mono font-bold text-center text-white placeholder-neutral-600 focus:outline-none transition-all ${
                      aiFilledFields.has("temple_length")
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        : "border-neutral-800 focus:border-[#D4AF37]"
                    }`}
                  />
                  <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-3 text-[10px] font-mono text-neutral-500 pointer-events-none">
                    mm
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. COLLAPSIBLE ACCORDION FOR SECONDARY CONTENT & AUDIT ALERTS */}
        <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/40">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full px-4 py-3 min-h-[44px] flex items-center justify-between gap-3 text-left rtl:text-right bg-neutral-900/60 hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span className="text-xs font-mono font-bold text-neutral-200">
                {language === "ar" ? "ملاحظات الفحص والوصف الذكي" : "Inspection Alerts & Alt Text"}
              </span>

              {/* Badge if there's an inspection alert for operator to check */}
              {hasInspectionAlert && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0 animate-pulse">
                  <ShieldAlert className="h-3 w-3" />
                  <span>{language === "ar" ? "تنبيه فحص" : "Check Alert"}</span>
                </span>
              )}
            </div>

            <ChevronDown
              className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                isAccordionOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAccordionOpen && (
            <div className="p-4 border-t border-neutral-850 flex flex-col gap-3.5 bg-neutral-950/70">
              {/* Agent Quality Audit Alert */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="agent-instruction-field" className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{language === "ar" ? "تنبيه فحص الجودة الميداني" : "AI Inspection & Quality Audit Alert"}</span>
                  </label>
                  {aiFilledFields.has("agent_instruction") && (
                    <span className="text-[10px] font-mono text-[#D4AF37]">AI generated</span>
                  )}
                </div>
                <input
                  id="agent-instruction-field"
                  type="text"
                  value={agentInstruction}
                  onChange={(e) => onAgentInstructionChange(e.target.value)}
                  placeholder={language === "ar" ? "مراجعة عاجلة يطلبها الفحص الآلي من المندوب الميداني" : "Immediate check requested of field operators"}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Alt Text Descriptor */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="alt-text-field" className="text-xs font-mono font-bold text-neutral-300">
                    {language === "ar" ? "الوصف البصري والسمات (Alt Text)" : "Visual Alt Text Vector Embedding"}
                  </label>
                  {aiFilledFields.has("alt_text") && (
                    <span className="text-[10px] font-mono text-[#D4AF37]">AI generated</span>
                  )}
                </div>
                <textarea
                  id="alt-text-field"
                  rows={2}
                  value={altText}
                  onChange={(e) => onAltTextChange(e.target.value)}
                  placeholder={language === "ar" ? "مثال: نظارة طيار ذهبية كلاسيكية بمظهر مهني متميز وبسيط..." : "e.g. Classic gold aviator with a minimalist professional look..."}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
