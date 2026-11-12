"use client";

import React from "react";
import { X, Trash2, CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";
import { SavedRecord } from "./inventory-constants";

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: SavedRecord[];
  onDeleteItem: (id: string) => void;
  language: "en" | "ar";
}

export function SessionDrawer({
  isOpen,
  onClose,
  historyItems,
  onDeleteItem,
  language
}: SessionDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Card */}
      <div className="relative z-10 w-full max-w-2xl mx-auto bg-neutral-950 border-t border-x border-neutral-800 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Handle Bar & Header */}
        <div className="p-4 border-b border-neutral-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D4AF37]/15 rounded-xl border border-[#D4AF37]/30">
              <Layers className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
                {language === "ar" ? "سجل وردية العمل الحالية" : "Current Shift Session Log"}
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                {historyItems.length} {language === "ar" ? "إطارات تم مسحها وحفظها" : "frames entered during this shift"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-slider-scroll">
          {historyItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 font-mono text-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-850 rounded-2xl">
              <Layers className="h-8 w-8 text-neutral-700" />
              <span>
                {language === "ar"
                  ? "لم يتم إدخال أي إطارات في هذه الجلسة بعد."
                  : "No frames entered in this terminal shift yet."}
              </span>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#D4AF37] uppercase">
                      {item.brand}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate mt-0.5">
                    {item.frame_name}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-neutral-400">
                    <span className="px-1.5 py-0.5 bg-neutral-950 rounded border border-neutral-850">
                      {item.front_size || "?"}-{item.bridge_size || "?"}-{item.temple_length || "?"} mm
                    </span>
                    <span className="text-[#D4AF37] font-bold">
                      ${item.price.toFixed(2)}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full ${
                        item.synced
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900"
                          : "bg-blue-950/40 text-blue-400 border border-blue-900"
                      }`}
                    >
                      {item.synced
                        ? (language === "ar" ? "مزامَن" : "Synced")
                        : (language === "ar" ? "محلي" : "Local")}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 hover:text-red-200 transition-colors cursor-pointer shrink-0"
                  title="Delete from shift log"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
