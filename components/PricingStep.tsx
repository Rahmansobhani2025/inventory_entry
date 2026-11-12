"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Search, 
  CheckCircle, 
  RefreshCw, 
  Tag, 
  AlertTriangle,
  DollarSign,
  Package,
  Sparkles,
  Layers
} from "lucide-react";
import { MaterialCategory, MATERIAL_CATEGORIES, Snapshot } from "./inventory-constants";

interface PricingStepProps {
  language: "en" | "ar";
  price: string;
  onPriceChange: (val: string) => void;
  discountedPrice: string;
  onDiscountedPriceChange: (val: string) => void;
  frameMaterial: string;
  onFrameMaterialChange: (val: string) => void;
  stockUnits: number;
  onStockChange: (amount: number) => void;
  brand: string;
  modelName: string;
  frameName: string;
  frontSize: string;
  bridgeSize: string;
  templeLength: string;
  snapshots: Snapshot[];
  isSyncingSupabase: boolean;
  isUploadingImages: boolean;
  isSupabaseConfigured: boolean;
  inventoryDebugBox: any;
  onCloseDebugBox: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PricingStep({
  language,
  price,
  onPriceChange,
  discountedPrice,
  onDiscountedPriceChange,
  frameMaterial,
  onFrameMaterialChange,
  stockUnits,
  onStockChange,
  brand,
  modelName,
  frameName,
  frontSize,
  bridgeSize,
  templeLength,
  snapshots,
  isSyncingSupabase,
  isUploadingImages,
  isSupabaseConfigured,
  inventoryDebugBox,
  onCloseDebugBox,
  onSubmit
}: PricingStepProps) {
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const previewImage = snapshots[0]?.blobUrl || snapshots[1]?.blobUrl || null;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-6">
      {/* RED DEBUG BOX IF DATABASE INSERT FAILED */}
      {inventoryDebugBox && (
        <div 
          id="inventory-debug-red-box"
          className="p-4 bg-red-950/95 border-2 border-red-500 rounded-2xl text-red-100 font-mono text-xs leading-relaxed shadow-2xl flex flex-col gap-3"
        >
          <div className="flex items-center justify-between border-b border-red-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-extrabold text-red-200 uppercase tracking-wider text-xs">
                Database Sync Error Details
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseDebugBox}
              className="text-red-300 hover:text-white px-2 py-0.5 rounded bg-red-900/60 transition-colors text-xs font-bold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-black/50 rounded-xl border border-red-900/60 text-xs">
            <div>
              <span className="text-red-400 font-bold">isSupabaseConfigured: </span>
              <span className="text-white">{String(inventoryDebugBox.isSupabaseConfigured)}</span>
            </div>
            <div>
              <span className="text-red-400 font-bold">resolvedShopId: </span>
              <span className="text-white break-all">{String(inventoryDebugBox.resolvedShopId)}</span>
            </div>
          </div>

          {inventoryDebugBox.error && (
            <div className="p-2.5 bg-red-900/40 border border-red-500/80 rounded-xl flex flex-col gap-1 text-xs">
              <div>
                <span className="text-red-300 font-bold">message: </span>
                <span className="text-white">{String(inventoryDebugBox.error.message)}</span>
              </div>
              {inventoryDebugBox.error.code && (
                <div>
                  <span className="text-red-300 font-bold">code: </span>
                  <span className="text-white">{String(inventoryDebugBox.error.code)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPACT PRICING, MATERIAL & STOCK FORM */}
      <div className="bg-neutral-950 p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
          <h3 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
            {language === "ar" ? "٣. سمات الإطار والتسعير والمخزون" : "3. Attributes, Price & Inventory"}
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            {language === "ar" ? "صالة العرض والمستودع" : "Showroom & Stock"}
          </span>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Frame Material Searchable Combobox */}
          <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-mono font-bold text-neutral-300">
              {language === "ar" ? "مادة الإطار *" : "Frame Material *"}
            </label>

            {/* Combobox Trigger Button */}
            <div
              id="material-select-combobox"
              onClick={() => {
                setIsMaterialDropdownOpen(!isMaterialDropdownOpen);
                setMaterialSearchQuery("");
              }}
              className={`min-h-[44px] bg-neutral-900 text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border flex justify-between items-center cursor-pointer select-none transition-all ${
                isMaterialDropdownOpen
                  ? "border-[#D4AF37] ring-1 ring-[#D4AF37]"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <span className="font-bold text-white truncate">
                {frameMaterial || "Select Material..."}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#D4AF37] shrink-0 transition-transform ${
                  isMaterialDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Search Dropdown Panel */}
            {isMaterialDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[300px] min-w-[280px]">
                {/* Search Header */}
                <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#D4AF37] shrink-0" />
                  <input
                    type="text"
                    placeholder={language === "ar" ? "ابحث عن خامة الإطار..." : "Type to filter materials..."}
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {materialSearchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaterialSearchQuery("");
                      }}
                      className="text-[10px] text-neutral-400 hover:text-[#D4AF37]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Material Options List */}
                <div className="overflow-y-auto flex-1 p-2 max-h-[220px]">
                  {(() => {
                    let hasAny = false;
                    const els = MATERIAL_CATEGORIES.map((cat) => {
                      const matched = cat.items.filter(
                        (i) =>
                          i.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                          i.description.toLowerCase().includes(materialSearchQuery.toLowerCase())
                      );
                      if (matched.length === 0) return null;
                      hasAny = true;

                      return (
                        <div key={cat.categoryName} className="mb-2 last:mb-0">
                          <div className="text-[#D4AF37] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-b border-neutral-900">
                            {cat.categoryName}
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {matched.map((item) => {
                              const isSel = frameMaterial === item.name;
                              return (
                                <div
                                  key={item.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onFrameMaterialChange(item.name);
                                    setIsMaterialDropdownOpen(false);
                                    setMaterialSearchQuery("");
                                  }}
                                  className={`p-2 rounded-lg cursor-pointer text-left rtl:text-right transition-colors ${
                                    isSel
                                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-white"
                                      : "hover:bg-neutral-900 text-neutral-300"
                                  }`}
                                >
                                  <div className="text-xs font-bold">{item.name}</div>
                                  <div className="text-[10px] text-neutral-500 line-clamp-1">
                                    {item.description}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });

                    if (!hasAny) {
                      return (
                        <div className="py-4 text-center text-neutral-500 font-mono text-xs">
                          {language === "ar" ? "لا توجد نتائج مطابقة" : "No matching materials"}
                        </div>
                      );
                    }
                    return els;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 2. Retail Price USD */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price-field" className="text-xs font-mono font-bold text-neutral-300">
              {language === "ar" ? "السعر بالدولار ($)" : "Retail Price USD ($)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-xs font-mono text-neutral-400">
                $
              </span>
              <input
                id="price-field"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="380.00"
                className="min-h-[44px] w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-8 pr-3.5 rtl:pl-3.5 rtl:pr-8 text-sm font-mono font-bold text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* 3. Discounted Price (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="discount-price-field" className="text-xs font-mono font-bold text-neutral-300">
              {language === "ar" ? "السعر بعد الخصم ($)" : "Discount Price ($)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-xs font-mono text-neutral-500">
                $
              </span>
              <input
                id="discount-price-field"
                type="number"
                step="0.01"
                min="0"
                value={discountedPrice}
                onChange={(e) => onDiscountedPriceChange(e.target.value)}
                placeholder={language === "ar" ? "اختياري" : "Optional"}
                className="min-h-[44px] w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-8 pr-3.5 rtl:pl-3.5 rtl:pr-8 text-sm font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Stock Units adjustment */}
        <div className="flex items-center justify-between bg-neutral-900/60 p-3 rounded-xl border border-neutral-850">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#D4AF37]" />
            <div>
              <span className="text-xs font-mono font-bold text-white block">
                {language === "ar" ? "كمية المخزون الأولي" : "Initial Stock Quantity"}
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {language === "ar" ? "الوحدات المتوفرة بصالة العرض" : "Available units in branch"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => onStockChange(-1)}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
            >
              -
            </button>
            <span className="min-w-[32px] text-center font-mono font-extrabold text-sm text-white">
              {stockUnits}
            </span>
            <button
              type="button"
              onClick={() => onStockChange(1)}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 4. FRAME SUMMARY CARD (Inspection before committing to database) */}
      <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-3">
        <span className="text-[11px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          {language === "ar" ? "ملخص بيانات الإطار المجهز للحفظ" : "Frame Manifest Summary"}
        </span>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-neutral-900/50 p-3.5 rounded-xl border border-neutral-850">
          {/* Frame Photo Thumbnail */}
          <div className="w-24 h-20 sm:w-28 sm:h-24 bg-black/60 rounded-xl overflow-hidden border border-neutral-800 shrink-0 flex items-center justify-center">
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt="Frame summary preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Layers className="h-8 w-8 text-neutral-700" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div>
              <span className="text-[11px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider block">
                {brand || "UNSPECIFIED BRAND"}
              </span>
              <h4 className="text-base font-extrabold text-white truncate">
                {modelName ? `${brand} ${modelName}` : frameName || "New Eyewear Frame"}
              </h4>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                {frameMaterial}
              </p>
            </div>

            {/* Sizing badge & Price */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono font-bold text-neutral-200">
                {frontSize || "—"} - {bridgeSize || "—"} - {templeLength || "—"} mm
              </span>
              <span className="text-sm font-mono font-extrabold text-[#D4AF37]">
                ${price ? parseFloat(price).toFixed(2) : "0.00"} USD
              </span>
              <span className="text-xs font-mono text-neutral-400">
                ({stockUnits} {language === "ar" ? "قطع" : "units"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATABASE SYNC ACTION & SUBMIT BUTTON */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isSupabaseConfigured
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-blue-500 shadow-[0_0_8px_#3b82f6]"
            }`}
          />
          <span className="text-xs font-mono text-neutral-300 font-bold">
            {isSupabaseConfigured
              ? (language === "ar" ? "قاعدة البيانات السحابية: متصلة بنجاح" : "Supabase Cloud: Ready")
              : (language === "ar" ? "الوضع التجريبي: حفظ محلي تلقائي" : "Offline Buffer: Local storage active")}
          </span>
        </div>

        {/* Primary Save Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSyncingSupabase || isUploadingImages || !brand.trim() || !modelName.trim()}
          className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#ffe380] active:scale-[0.99] text-black font-mono font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSyncingSupabase ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-black" />
              <span>{language === "ar" ? "جاري المزامنة والحفظ..." : "Syncing to Database..."}</span>
            </>
          ) : isUploadingImages ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-black" />
              <span>{language === "ar" ? "جاري رفع اللقطات..." : "Uploading Photos..."}</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-black" />
              <span>{language === "ar" ? "اعتماد وحفظ والبدء بالتالي" : "Complete & Start Next Frame"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
