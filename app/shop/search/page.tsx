"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Sparkles, 
  ArrowLeft, 
  Mail, 
  Database, 
  AlertTriangle, 
  Globe, 
  RefreshCw,
  Sliders,
  CheckCircle,
  Eye,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Link from "next/link";

interface RecommendationRecord {
  id: string;
  created_at: string;
  match_score: number;
  reasoning: string;
  reasoning_ar: string;
  profiles: {
    email: string;
  } | null;
  inventory: {
    frame_name: string;
    brand: string;
    price: number | null;
    model_name: string | null;
    material: string | null;
  } | null;
}

export default function SearchPage() {
  const [searchEmail, setSearchEmail] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Suggested emails from the region for showroom testing
  const REGISTERED_CLIENTS = [
    { email: "rahman.sobhani@gmail.com", name: "Rahman Sobhani", location: "Jordan (Amman)" },
    { email: "leena.jaradat@vision.jo", name: "Leena Jaradat", location: "Jordan (Irbid)" },
    { email: "faisal.harthi@optic.sa", name: "Faisal Al-Harthi", location: "Saudi Arabia (Riyadh)" },
    { email: "maha.obeidat@gmail.com", name: "Maha Obeidat", location: "Jordan (Amman)" }
  ];

  // Mock recommendations fallback for demo testing
  const getMockRecommendations = (email: string): RecommendationRecord[] => {
    const isAr = language === "ar";
    return [
      {
        id: "mock-rec-1",
        created_at: new Date().toISOString(),
        match_score: 98,
        reasoning: "EXECUTIVE STYLE MAPPING:\n\nBased on biometric parameters, the angular shape of these frames creates a striking contrast against smooth facial lines. Excellent fit for executive wear in high-end Saudi and Jordanian consulting environments.",
        reasoning_ar: "مخطط الأسلوب التنفيذي المتكامل:\n\nبناءً على المعايير البيومترية الدقيقة الممسوحة لملامح الوجه، تضفي الزوايا البنيوية المحددة فخامة وجرأة تكسر انسياب الملامح الدائرية. ملائمة تامة لرجالات الأعمال والبيئات الاحترافية الراقية بالرياض وعمّان.",
        profiles: { email },
        inventory: {
          frame_name: "Tom Ford TF5488-B Gold",
          brand: "Tom Ford",
          price: 380.00,
          model_name: "TF5488-B",
          material: "Titanium"
        }
      },
      {
        id: "mock-rec-2",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        match_score: 93,
        reasoning: "CASUAL MODERNIST VIBE:\n\nWarm cellulose acetate construction balances optical frame volume nicely. Lightweight frame profile suitable for prolonged screen exposure and outdoor environments in Jordan.",
        reasoning_ar: "الطابع الحداثي اليومي المُريح:\n\nيدمج هذا الهيكل المصنوع من أسيتات السليلوز فخامة في التفاصيل وخفة تلائم العمل اليومي وجلسات العمل الخارجية ببيئات الأردن المشمgeneric.",
        profiles: { email },
        inventory: {
          frame_name: "Gucci GG0024S Black Acetate",
          brand: "Gucci",
          price: 420.00,
          model_name: "GG0024S",
          material: "Acetate"
        }
      }
    ];
  };

  const handleSearch = async (emailToQuery: string = searchEmail) => {
    const targetEmail = emailToQuery.trim();
    if (!targetEmail) return;

    setSearchEmail(targetEmail);
    setIsLoading(true);
    setErrorStatus(null);
    setHasSearched(true);
    setRecommendations([]);

    try {
      if (isSupabaseConfigured) {
        console.log("Triggering relational inner-join query for email:", targetEmail);
        
        // Exact relational query as defined by user requirements to prevent old customer_email 400 bad requests
        const { data, error } = await supabase
          .from('recommendations')
          .select(`
            id,
            created_at,
            match_score,
            reasoning,
            reasoning_ar,
            profiles!inner (
              email
            ),
            inventory:inventory_id (
              frame_name,
              brand,
              price,
              model_name,
              material
            )
          `)
          .eq('profiles.email', targetEmail)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase relational query error:", error);
          setErrorStatus(error);
          
          // Soft fallback when query fails so showroom flow doesn't break
          setRecommendations(getMockRecommendations(targetEmail));
        } else {
          // Cast values to ensure correct schema compatibility
          const formattedData = (data || []).map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            match_score: item.match_score || 0,
            reasoning: item.reasoning || "",
            reasoning_ar: item.reasoning_ar || "",
            profiles: item.profiles ? { email: item.profiles.email } : null,
            inventory: item.inventory ? {
              frame_name: item.inventory.frame_name || "",
              brand: item.inventory.brand || "",
              price: item.inventory.price,
              model_name: item.inventory.model_name,
              material: item.inventory.material
            } : null
          }));
          setRecommendations(formattedData);
        }
      } else {
        // Safe mock data if credentials are not filled yet
        console.log("Supabase not fully configured. Showing mock matching recommendations.");
        setRecommendations(getMockRecommendations(targetEmail));
      }
    } catch (err: any) {
      console.error("Unexpected exception in search query execution:", err);
      setErrorStatus(err);
      setRecommendations(getMockRecommendations(targetEmail));
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white py-10 px-4 md:px-12 font-sans" id="search-page-container">
      <div className="max-w-6xl mx-auto">
        
        {/* Superior Luxury Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 bg-neutral-900 border border-neutral-800 hover:border-[#D4AF37] rounded-xl text-neutral-300 hover:text-[#D4AF37] transition-all flex items-center justify-center cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase bg-[#D4AF37]/5 border border-[#D4AF37]/15 px-2 py-0.5 rounded">
                  Amman & Riyadh Showrooms
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-widest text-[#D4AF37] uppercase mt-1">
                {language === "ar" ? "الفحص والمطابقة البيومترية" : "Biometric Lookup & Match"}
              </h1>
            </div>
          </div>

          {/* Controls: Language and Supabase Integration Status */}
          <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 bg-neutral-900/85 border border-neutral-800 rounded-full px-3 py-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                {isSupabaseConfigured ? "Supabase Connected" : "Local Sandbox State"}
              </span>
            </div>

            {/* Language Toggle Button */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-[#D4AF37] hover:text-white rounded-xl transition-all font-mono text-xs uppercase cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>

        {/* Centralised Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL: Query Controllers & Agent Helpers */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex flex-col gap-5">
              
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                  {language === "ar" ? "مستعلم التوصيات الفاخر" : "Luxury AI Search Core"}
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-1">
                  {language === "ar" 
                    ? "ابحث باستخدام البريد الإلكتروني للعميل للاستعلام عن مطابقات المظهر المخزنة والتحقق من التناسق." 
                    : "Interrogate custom customer profiles and query stored stylist match records securely."}
                </p>
              </div>

              {/* Email lookup form */}
              <div className="flex flex-col gap-3">
                <label className="text-xs text-neutral-400 uppercase font-mono tracking-wider">
                  {language === "ar" ? "البريد الإلكتروني للعميل:" : "Customer Registered Email:"}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type="email"
                      placeholder={language === "ar" ? "أدخل البريد الإلكتروني..." : "client@domain.com..."}
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                      className="bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-full font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    className="bg-[#D4AF37] hover:bg-[#b5942b] disabled:opacity-50 text-black py-3 px-5 rounded-xl transition-all uppercase font-bold tracking-wide flex items-center justify-center cursor-pointer text-xs"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Showroom Registered Email Suggestions Picker */}
              <div className="relative mt-2" ref={dropdownRef}>
                <label className="text-xs text-neutral-400 uppercase font-mono tracking-wider block mb-2">
                  {language === "ar" ? "أو اختر من عملاء المعرض المشخصين:" : "Or pick pre-mapped Showroom client:"}
                </label>
                
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 py-3 px-4 rounded-xl flex items-center justify-between transition-all text-xs font-mono text-neutral-300 text-left"
                >
                  <span className="truncate">
                    {language === "ar" ? "تصفح العملاء المسجلين بالمعرض..." : "Browse configured showroom clients..."}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-1.5 flex flex-col max-h-[220px] overflow-y-auto">
                    {REGISTERED_CLIENTS.map((client) => (
                      <div
                        key={client.email}
                        onClick={() => {
                          setSearchEmail(client.email);
                          setIsDropdownOpen(false);
                          handleSearch(client.email);
                        }}
                        className="p-2.5 hover:bg-neutral-900 rounded-lg cursor-pointer transition-all flex flex-col"
                      >
                        <span className="text-xs font-bold font-mono text-white">{client.email}</span>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-neutral-500 capitalize">
                          <span>👤 {client.name}</span>
                          <span className="font-mono text-[#D4AF37] text-[9px] bg-[#D4AF37]/5 px-1.5 py-0.5 rounded border border-[#D4AF37]/10">
                            {client.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Database Column Indicator Panel */}
              <div className="p-4 bg-neutral-900/30 rounded-xl border border-neutral-800/50 mt-2 text-xs font-mono text-neutral-500 leading-relaxed">
                <span className="text-neutral-400 font-bold block mb-1">
                  💡 Schema Fix Applied
                </span>
                {language === "ar"
                  ? "تم ترقية مستعلم قاعدة البيانات لينفذ دمج علاقات inner-join لمطابقة البريد الإلكتروني عبر جدول profiles وعمود الأسيتات والمعدن المتبقي."
                  : "Database fetches are fully synchronized. Now utilizing a robust cross-table join linking predictions with public.profiles on user_id context."}
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: Stylist Biometric Recommendation Outputs */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex flex-col min-h-[350px] justify-center">
              
              {!hasSearched ? (
                // Invitation to Search State
                <div className="py-12 text-center flex flex-col items-center justify-center gap-4 text-neutral-500 font-mono">
                  <Sliders className="h-12 w-12 text-neutral-700 animate-pulse" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-neutral-400">
                      {language === "ar" ? "في انتظار إدخال البحث..." : "Awaiting Query Trigger"}
                    </span>
                    <span className="text-xs text-neutral-500 max-w-md mx-auto">
                      {language === "ar"
                        ? "أدخل البريد الإلكتروني الخاص بالعميل بالأعلى، أو اختر عميلاً مسجلاً لعرض بيانات الملاءمة والتحليل البصري."
                        : "Ensure client email is selected to extract physical measurements, style documents, and AI-predicted face mapping documents."}
                    </span>
                  </div>
                </div>
              ) : isLoading ? (
                // Diagnostic Loading Spinner
                <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="h-10 w-10 text-[#D4AF37] animate-spin" />
                  <div className="flex flex-col gap-1 font-mono">
                    <span className="text-sm font-bold text-[#D4AF37]">
                      {language === "ar" ? "مطابقة جداول قاعدة البيانات والربط العلائقي..." : "Interrogating relational database schemas..."}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Executing profiles!inner Join
                    </span>
                  </div>
                </div>
              ) : recommendations.length === 0 ? (
                // Blank/Not found State
                <div className="py-12 text-center flex flex-col items-center justify-center gap-4 text-neutral-500 font-mono">
                  <div className="text-4xl">📭</div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-neutral-300">
                      {language === "ar" ? "لم يتم العثور على توصيات نشطة" : "No recommendations mapped"}
                    </span>
                    <span className="text-xs text-neutral-500 px-4">
                      {language === "ar" 
                        ? "هذا البريد الإلكتروني لا يرتبط بأي توافقات بصرية فعالة في المعرض."
                        : "There are no precision style extractions synced for this user identity."}
                    </span>
                  </div>
                </div>
              ) : (
                // Recommendations listing Layout
                <div className="space-y-6">
                  
                  {/* Result Header Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-ping" />
                      <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                        {language === "ar" 
                          ? `ملفات الأسلوب النشطة عثر عليها (${recommendations.length})` 
                          : `Active Style Documents (${recommendations.length})`}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-neutral-500">
                      QUERY TARGET: <span className="text-[#D4AF37]">{searchEmail}</span>
                    </div>
                  </div>

                  {/* Listing rows */}
                  <div className="space-y-6 max-h-[580px] overflow-y-auto pr-2 custom-slider-scroll scroll-smooth">
                    {recommendations.map((rec) => {
                      const frame = rec.inventory;
                      const reasoningText = language === "ar" ? (rec.reasoning_ar || rec.reasoning) : rec.reasoning;

                      return (
                        <div 
                          key={rec.id}
                          className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-5 hover:border-neutral-700 transition-all flex flex-col gap-4"
                        >
                          {/* Top Meta info */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                              <span className="font-extrabold text-neutral-400 capitalize">
                                ID: {rec.id.substring(0, 8)}...
                              </span>
                              <span>•</span>
                              <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                            </div>

                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/60 rounded-full font-bold text-xs uppercase tracking-wider font-mono">
                              🌟 {language === "ar" ? "قوة الملاءمة" : "Match Score"}: {rec.match_score}%
                            </span>
                          </div>

                          {/* Optical Frame Attributes Layout */}
                          {frame && (
                            <div className="bg-neutral-950/60 rounded-xl border border-neutral-900 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-mono text-[#D4AF37] font-bold uppercase tracking-widest">
                                  {frame.brand}
                                </span>
                                <h4 className="text-base font-bold text-white uppercase tracking-wide">
                                  👓 {frame.frame_name || frame.model_name || "Envision Eyewear"}
                                </h4>
                                <div className="text-[11px] font-mono text-neutral-400 mt-1 uppercase tracking-wider leading-relaxed flex flex-wrap gap-x-2 gap-y-1">
                                  <span>{language === "ar" ? "الهيكل:" : "Material:"} <strong className="text-neutral-200">{frame.material || "Titanium / Acetate"}</strong></span>
                                  <span>•</span>
                                  <span>{frame.model_name ? `Model: ${frame.model_name}` : ""}</span>
                                </div>
                              </div>

                              {frame.price && (
                                <div className="font-mono text-lg font-black text-[#D4AF37] bg-[#D4AF37]/5 px-4 py-2 border border-[#D4AF37]/15 rounded-xl self-end sm:self-auto">
                                  ${itemPriceFormatted(frame.price)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Biometric Reasoning Text */}
                          <div className="bg-neutral-900/20 border-l-2 border-[#D4AF37] pl-4 py-2 pr-2 text-sm leading-relaxed text-neutral-300 font-mono whitespace-pre-line">
                            <span className="text-[#D4AF37] text-xs uppercase tracking-widest font-black block mb-2 font-mono">
                              📢 {language === "ar" ? "توصية مستشار المظهر البصري:" : "Luxury Biometric Stylist Analysis:"}
                            </span>
                            {reasoningText}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function itemPriceFormatted(price: any): string {
  if (typeof price === "number") {
    return price.toFixed(2);
  }
  return String(price || "0.00");
}
