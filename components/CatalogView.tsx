"use client";

import React from "react";
import { Search, RefreshCw, Trash2, Maximize2, Layers, AlertCircle } from "lucide-react";

interface CatalogViewProps {
  language: "en" | "ar";
  shopInventory: any[];
  inventorySearchQuery: string;
  onSearchChange: (q: string) => void;
  isLoadingShopInventory: boolean;
  onRefresh: () => void;
  onUpdateStock: (id: string | number, amount: number) => void;
  onDeleteShopItem: (id: string | number) => void;
  onSetLightboxImage: (url: string | null) => void;
}

export function CatalogView({
  language,
  shopInventory,
  inventorySearchQuery,
  onSearchChange,
  isLoadingShopInventory,
  onRefresh,
  onUpdateStock,
  onDeleteShopItem,
  onSetLightboxImage
}: CatalogViewProps) {
  const filteredInventory = React.useMemo(() => {
    if (!inventorySearchQuery.trim()) return shopInventory;
    const q = inventorySearchQuery.toLowerCase();
    return shopInventory.filter((item) => {
      return (
        item.brand?.toLowerCase().includes(q) ||
        item.model_name?.toLowerCase().includes(q) ||
        item.frame_name?.toLowerCase().includes(q) ||
        String(item.id)?.toLowerCase().includes(q) ||
        item.material?.toLowerCase().includes(q) ||
        item.color_code?.toLowerCase().includes(q)
      );
    });
  }, [shopInventory, inventorySearchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 pb-12 animate-fade-in">
      {/* Top Search & Filter Bar */}
      <div className="bg-neutral-950 p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            {language === "ar" ? "كتالوج المخزون الكامل للإطارات" : "Complete Eyewear Inventory Catalog"}
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">
            {language === "ar" ? "قاعدة البيانات المركزية لجميع الإطارات المسجلة" : "Central database catalog of all active digitalized frames"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <span className="absolute inset-y-0 left-3 rtl:left-auto rtl:right-3 flex items-center text-neutral-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={language === "ar" ? "ابحث عن ماركة، موديل..." : "Search brand, model..."}
              value={inventorySearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full min-h-[44px] bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-xs font-mono text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          <span className="text-xs font-mono bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] py-2 px-3 rounded-xl font-bold whitespace-nowrap">
            {filteredInventory.length} {language === "ar" ? "إطاراً" : "Items"}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] px-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-[#D4AF37]/40 text-neutral-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reload Registry"
          >
            {isLoadingShopInventory ? (
              <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-[#D4AF37]" />
            )}
            <span className="hidden sm:inline">{language === "ar" ? "تحديث" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Listing Container */}
      <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl">
        {filteredInventory.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 font-mono text-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-850 rounded-2xl">
            <Layers className="h-10 w-10 text-neutral-700" />
            <span className="text-sm font-bold text-neutral-400">
              {language === "ar" ? "لا توجد إطارات مطابقة لبحثك" : "No matching frames found"}
            </span>
            <p className="text-neutral-500 max-w-sm">
              {language === "ar"
                ? "جرب البحث بكلمات أخرى أو انتقل إلى تبويب 'إضافة إطار' لتصوير إطار جديد."
                : "Try a different search query or switch to 'Add Frame' to register a new frame."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (md breakpoint and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left rtl:text-right font-mono border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase">
                    <th className="pb-3.5 font-bold">{language === "ar" ? "الموديل والتفاصيل" : "Brand & Model"}</th>
                    <th className="pb-3.5 font-bold text-center">{language === "ar" ? "كود اللون" : "Color"}</th>
                    <th className="pb-3.5 font-bold text-center">{language === "ar" ? "الأبعاد (L-N-A)" : "Sizes (L-N-A)"}</th>
                    <th className="pb-3.5 font-bold text-center">{language === "ar" ? "المخزون" : "Stock"}</th>
                    <th className="pb-3.5 font-bold text-right rtl:text-left pr-4 rtl:pr-0 rtl:pl-4">{language === "ar" ? "السعر" : "Price"}</th>
                    <th className="pb-3.5 font-bold text-right rtl:text-left">{language === "ar" ? "الإجراء" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredInventory.map((item) => {
                    const colorCode = item.color_code || "C-101";
                    const stockVal = item.stock !== undefined ? item.stock : 12;

                    return (
                      <tr key={item.id} className="text-gray-300 hover:bg-neutral-900/50 transition-colors group">
                        {/* Photo / Brand / Model */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3.5">
                            <div
                              onClick={() => item.preview_url && onSetLightboxImage(item.preview_url)}
                              className="h-16 w-24 relative bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0 cursor-zoom-in hover:border-[#D4AF37]/50 transition-colors"
                              title="Click to zoom preview"
                            >
                              {item.preview_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.preview_url}
                                  alt={item.frame_name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Layers className="h-6 w-6 text-neutral-700" />
                              )}
                            </div>

                            <div className="overflow-hidden">
                              <span className="font-extrabold text-white text-sm block group-hover:text-[#D4AF37] transition-colors truncate max-w-[240px]">
                                {item.brand} {item.model_name}
                              </span>
                              <span className="text-[11px] text-neutral-400 block uppercase font-medium mt-0.5">
                                {item.material || "Acetate"} • ID: {String(item.id).substring(0, 10)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Color Code */}
                        <td className="py-3.5 text-center">
                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300">
                            {colorCode}
                          </span>
                        </td>

                        {/* Sizes */}
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-1 bg-neutral-900/70 border border-neutral-800 rounded-lg text-xs text-neutral-200 font-bold">
                            {item.front_size || "?"} - {item.bridge_size || "?"} - {item.temple_length || "?"} mm
                          </span>
                        </td>

                        {/* Stock Counter with Increment/Decrement */}
                        <td className="py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="min-w-[20px] text-center font-bold text-white text-xs">
                              {stockVal}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#D4AF37] font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Retail Price */}
                        <td className="py-3.5 text-right rtl:text-left pr-4 rtl:pr-0 rtl:pl-4 text-sm font-bold text-[#D4AF37]">
                          ${typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
                        </td>

                        {/* Delete Action Button */}
                        <td className="py-3.5 text-right rtl:text-left">
                          <button
                            type="button"
                            onClick={() => onDeleteShopItem(item.id)}
                            className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/50 border border-red-900/30 text-red-400 hover:text-red-100 transition-colors cursor-pointer"
                            title="Delete Frame from database"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (below md breakpoint) */}
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredInventory.map((item) => {
                const colorCode = item.color_code || "C-101";
                const stockVal = item.stock !== undefined ? item.stock : 12;

                return (
                  <div
                    key={item.id}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3.5 flex flex-col gap-3"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div
                        onClick={() => item.preview_url && onSetLightboxImage(item.preview_url)}
                        className="w-24 h-20 shrink-0 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center cursor-zoom-in"
                      >
                        {item.preview_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.preview_url}
                            alt={item.frame_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Layers className="h-6 w-6 text-neutral-700" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 overflow-hidden">
                        <span className="text-[10px] font-mono uppercase text-[#D4AF37] font-black block">
                          {item.brand}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">
                          {item.model_name}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                          {item.material || "Acetate"} • {colorCode}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850 inline-block mt-1">
                          {item.front_size || "?"}-{item.bridge_size || "?"}-{item.temple_length || "?"} mm
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Stock, Price & Delete */}
                    <div className="flex items-center justify-between border-t border-neutral-850 pt-2 text-xs font-mono">
                      <span className="text-[#D4AF37] font-extrabold">
                        ${typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
                      </span>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => onUpdateStock(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="min-w-[18px] text-center font-bold text-white text-[11px]">
                            {stockVal}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateStock(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 text-[#D4AF37]"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteShopItem(item.id)}
                          className="p-1.5 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
