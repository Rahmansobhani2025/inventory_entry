"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Sparkles, 
  ArrowLeft, 
  Mail, 
  Database, 
  DollarSign, 
  Clock, 
  Tag, 
  Filter, 
  Check, 
  AlertCircle, 
  Globe, 
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Crown,
  Eye,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence } from "motion/react";

interface LeadRecord {
  id: string;
  created_at: string;
  match_score: number;
  reasoning: string;
  reasoning_ar: string;
  is_purchased: boolean;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  inventory: {
    frame_name: string;
    brand: string;
    price: number | null;
    model_name?: string | null;
    material?: string | null;
    image_url?: string | null;
    front_size?: number | null;
    bridge_size?: number | null;
    temple_length?: number | null;
  } | null;
}

const getEyeglassImage = (record: LeadRecord) => {
  const customUrl = record.inventory?.image_url;
  if (customUrl && !customUrl.includes("dkzznbzes")) {
    return customUrl;
  }
  
  const brand = (record.inventory?.brand || "").toLowerCase();
  if (brand.includes("tom ford")) {
    return "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=600";
  }
  if (brand.includes("cartier")) {
    return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600";
  }
  if (brand.includes("oliver")) {
    return "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600";
  }
  if (brand.includes("oakley")) {
    return "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=600";
  }
  
  return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600";
};

export default function LeadsDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  // Default to 'en' during initial server and client render to guarantee matched hydration
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get("lang");
        if (urlLang === "ar" || urlLang === "en") {
          setLanguage(urlLang);
          return;
        }
        const savedLang = localStorage.getItem("envision_language");
        if (savedLang === "ar" || savedLang === "en") {
          setLanguage(savedLang);
        }
      } catch {
        // Fallback to default
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Store all fetched records
  const [allLeads, setAllLeads] = useState<LeadRecord[]>([]);
  // Current view state: 'leads' is default
  const [currentView, setCurrentView] = useState<"all" | "leads">("leads");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<any>(null);

  const handleLanguageToggle = () => {
    const next = language === "en" ? "ar" : "en";
    setLanguage(next);
    try {
      localStorage.setItem("envision_language", next);
    } catch {
      // Ignore local storage errors
    }
  };
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [recommendationSearchQuery, setRecommendationSearchQuery] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Clean, high-quality luxury mock database fallback for sandbox environment
  const getMockLeads = useCallback((): LeadRecord[] => [
    {
      id: "mock-lead-101",
      created_at: new Date(Date.now() - 3600000 * 1.2).toISOString(), // 1.2 hours ago
      match_score: 98,
      reasoning: "EXECUTIVE STYLE MAPPING: Strong rectangular acetate rims match robust lower-jaw traits. Extremely handsome choice for Saudi executive wear.",
      reasoning_ar: "مخطط الطابع التنفيذي: إطار مستطيل متين يبرز زوايا الفك السفلي القوية. اختيار فاخر للمظهر العملي الرسمي.",
      is_purchased: false,
      profiles: {
        full_name: "Faisal Al-Harthi",
        email: "faisal.harthi@optic.sa"
      },
      inventory: {
        frame_name: "Tom Ford TF5488-B Gold",
        brand: "Tom Ford",
        price: 380.00,
        model_name: "TF5488-B",
        material: "Acetate",
        image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400",
        front_size: 52,
        bridge_size: 18,
        temple_length: 145
      }
    },
    {
      id: "mock-lead-102",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
      match_score: 95,
      reasoning: "MINIMALIST TITANIUM FIT: Perfect match for oval profiles. Crafted from lightweight medical-grade titanium for elite daily comfort.",
      reasoning_ar: "تعديل التيتانيوم البسيط: مثالي للملامح البيضاوية. صُنِع من تيتانيوم طبي خفيف للغاية لراحة يومية استثنائية.",
      is_purchased: false,
      profiles: {
        full_name: "Leena Jaradat",
        email: "leena.jaradat@vision.jo"
      },
      inventory: {
        frame_name: "Cartier CT0011O Rimless",
        brand: "Cartier",
        price: 980.00,
        model_name: "CT0011O",
        material: "Titanium Gold",
        image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400",
        front_size: 53,
        bridge_size: 18,
        temple_length: 140
      }
    },
    {
      id: "mock-lead-103",
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      match_score: 91,
      reasoning: "VINTAGE ACETATE VIBE: Classic round tortoise frame balances defined high cheekbone structure.",
      reasoning_ar: "مظهر أسيتات كلاسيكي: إطار دائري مرقط متناسق مميز يخلق توازناً جميلاً مع عظام الخد البارزة والمحددة.",
      is_purchased: true,
      profiles: {
        full_name: "Rahman Sobhani",
        email: "rahman.sobhani@gmail.com"
      },
      inventory: {
        frame_name: "Gregory Peck Tortoise",
        brand: "Oliver Peoples",
        price: 395.00,
        model_name: "Gregory Peck Classic",
        material: "Acetate Frame",
        image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400",
        front_size: 47,
        bridge_size: 23,
        temple_length: 150
      }
    },
    {
      id: "mock-lead-104",
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      match_score: 89,
      reasoning: "TR90 PERFORMANCE DESIGN: Durable memory thermopolymer structure engineered for active operations.",
      reasoning_ar: "تصميم الأداء العالي TR90: هيكل مرن مقاوم للصدمات والحرارة مصمم للمغامرات وأسلوب الحياة الرياضي الديناميكي.",
      is_purchased: false,
      profiles: {
        full_name: "Maha Obeidat",
        email: "maha.obeidat@gmail.com"
      },
      inventory: {
        frame_name: "Oakley Holbrook Matte Black",
        brand: "Oakley",
        price: 152.00,
        model_name: "OO9102 Black",
        material: "O Matter (R) Active",
        image_url: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400",
        front_size: 55,
        bridge_size: 18,
        temple_length: 137
      }
    }
  ], []);

  // Primary Data Fetching Logic (The Complete List with Nested Relations)
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Primary: Fetch through robust same-origin server API route
      const res = await fetch("/api/shop/leads", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAllLeads(result.data);
      } else {
        setAllLeads(getMockLeads());
      }
    } catch (err: any) {
      console.warn("Could not fetch leads via API route, checking local storage / mocks:", err?.message || err);
      try {
        const localSaved = localStorage.getItem("envision_interactive_leads");
        if (localSaved) {
          setAllLeads(JSON.parse(localSaved));
        } else {
          const initial = getMockLeads();
          localStorage.setItem("envision_interactive_leads", JSON.stringify(initial));
          setAllLeads(initial);
        }
      } catch {
        setAllLeads(getMockLeads());
      }
    } finally {
      setLoading(false);
    }
  }, [getMockLeads]);

  // Handle lead conversion toggle ("MARK AS PURCHASED")
  const handleConversion = async (recommendationId: string) => {
    // 1. Optimistic local state update for instant client responsiveness
    const updated = allLeads.map((item) => {
      if (item.id === recommendationId) {
        return { ...item, is_purchased: true };
      }
      return item;
    });
    setAllLeads(updated);
    try {
      localStorage.setItem("envision_interactive_leads", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    setUpdatingId(recommendationId);

    try {
      const res = await fetch("/api/shop/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recommendationId, is_purchased: true }),
      });
      if (!res.ok) {
        console.warn("Failed updating recommendation on server");
      }
    } catch (err: any) {
      console.warn("Network error during lead conversion:", err?.message || err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle current purchase status back and forth (Bonus diagnostic action)
  const togglePurchaseStatus = async (recommendationId: string, currentStatus: boolean) => {
    const targetStatus = !currentStatus;

    // Optimistic Update
    const updated = allLeads.map((item) => {
      if (item.id === recommendationId) {
        return { ...item, is_purchased: targetStatus };
      }
      return item;
    });
    setAllLeads(updated);
    try {
      localStorage.setItem("envision_interactive_leads", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    setUpdatingId(recommendationId);

    try {
      const res = await fetch("/api/shop/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recommendationId, is_purchased: targetStatus }),
      });
      if (!res.ok) {
        console.warn("Failed toggling recommendation status on server");
      }
    } catch (err: any) {
      console.warn("Network error during status toggle:", err?.message || err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Synchronize filtering/viewing display whenever leads or active view changes (dynamic computed array)
  const displayedLeads = React.useMemo(() => {
    let filtered = [...allLeads];
    
    // Apply View Mode
    if (currentView === "leads") {
      filtered = filtered.filter(l => l.is_purchased === false);
    }

    // Apply optional Search Term
    if (recommendationSearchQuery.trim()) {
      const q = recommendationSearchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        return (
          l.id.toLowerCase().includes(q) ||
          (l.profiles?.full_name || "").toLowerCase().includes(q) ||
          (l.profiles?.email || "").toLowerCase().includes(q) ||
          (l.inventory?.frame_name || "").toLowerCase().includes(q) ||
          (l.inventory?.brand || "").toLowerCase().includes(q) ||
          l.reasoning.toLowerCase().includes(q) ||
          l.reasoning_ar.includes(q)
        );
      });
    }

    return filtered;
  }, [allLeads, currentView, recommendationSearchQuery]);

  // Initial Fetch Effect
  useEffect(() => {
    let active = true;
    const loadState = async () => {
      if (active) {
        await fetchLeads();
      }
    };
    loadState();
    return () => {
      active = false;
    };
  }, [fetchLeads]);

  // Calculated Analytics metrics for top cards
  const totalCount = allLeads.length;
  const activeLeadsCount = allLeads.filter(l => !l.is_purchased).length;
  const purchasedCount = allLeads.filter(l => l.is_purchased).length;
  const conversionRate = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
  
  const estimatedRevenue = allLeads.reduce((sum, item) => {
    return sum + (item.inventory?.price || 0);
  }, 0);

  const convertedRevenue = allLeads.filter(l => l.is_purchased).reduce((sum, item) => {
    return sum + (item.inventory?.price || 0);
  }, 0);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center font-sans gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-[#EAB308] border-t-transparent rounded-full" />
        <span 
          className="text-xs font-mono text-neutral-400 tracking-widest uppercase"
          suppressHydrationWarning
        >
          Initializing Operator Portal...
        </span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#121212] text-white py-10 px-4 md:px-12 font-sans" 
      id="leads-dashboard-container"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* TOP BRAND BRANDING & NAV BANNER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 mb-8 gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 bg-neutral-900 border border-neutral-800 hover:border-[#EAB308] rounded-xl text-neutral-300 hover:text-[#EAB308] transition-all flex items-center justify-center cursor-pointer"
              title={language === "ar" ? "العودة للوحة التحكم الرئيسية" : "Return to Showcase Operator"}
            >
              <ArrowLeft className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#EAB308] animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#EAB308] uppercase bg-[#EAB308]/5 border border-[#EAB308]/15 px-2.5 py-0.5 rounded font-black">
                  {language === "ar" ? "صالات عرض إنفيجن" : "Envision Showrooms"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-widest text-[#EAB308] uppercase mt-1">
                {language === "ar" ? "لوحة العملاء المحتملين والمبيعات" : "Interactive Showroom Manager"}
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 font-sans mt-1.5 max-w-2xl leading-relaxed">
                {language === "ar" 
                  ? "تختص هذه الصفحة بمتابعة وإدارة العملاء المهتمين بشراء النظارات المقترحة لهم عبر الذكاء الاصطناعي في صالة العرض؛ حيث تعرض كل عميل، مواصفات الإطار الموصى به ومقاساته ونسبة التطابق، وتتيح لموظفي المتجر متابعة حالة الشراء وتحويلها لمبيعات منجزة وتتبع الإيرادات لحظياً."
                  : "This page manages showroom eyewear leads and AI-driven frame recommendations; track each prospective customer alongside their matched luxury frame specifications, fit scores, pricing, and purchase conversions to close sales and monitor revenue in real time."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            {/* Supabase status verification badge */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-1.5 text-xs font-mono">
              <span className={`h-2.5 w-2.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-[10px] uppercase text-neutral-400">
                {isSupabaseConfigured 
                  ? (language === "ar" ? "مزامنة مباشرة" : "Live Sync") 
                  : (language === "ar" ? "بيئة تجريبية محلية" : "Local Sandbox")}
              </span>
            </div>

            {/* Language switcher */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border border-[#EAB308]/30 rounded-xl transition-all font-mono text-xs text-[#EAB308] uppercase cursor-pointer text-center"
            >
              <Globe className="h-4 w-4" />
              <span>{language === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </div>

        {/* METRICS & OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900/60 flex flex-col gap-1">
            <span className="text-xs text-neutral-500 font-mono tracking-wider uppercase block">
              {language === "ar" ? "طلب توصية إجمالي" : "Total Showroom Records"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black font-display text-white">{totalCount}</span>
              <span className="text-xs text-neutral-600 font-mono">{language === "ar" ? "سجل" : "rows"}</span>
            </div>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900/60 flex flex-col gap-1">
            <span className="text-xs text-amber-500 font-mono tracking-wider uppercase block">
              {language === "ar" ? "المبيعات النشطة / غير المكتملة" : "Active Customers Leads"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black font-display text-[#EAB308]">{activeLeadsCount}</span>
              <span className="text-xs text-[#EAB308]/50 font-mono">{language === "ar" ? "عميل" : "leads"}</span>
            </div>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900/60 flex flex-col gap-1">
            <span className="text-xs text-emerald-400 font-mono tracking-wider uppercase block">
              {language === "ar" ? "نسبة تحويل المبيعات" : "Closed Conversions"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black font-display text-emerald-400">{purchasedCount}</span>
              <span className="text-xs text-emerald-600 font-mono">
                {conversionRate}% {language === "ar" ? "معدل التحويل" : "rate"}
              </span>
            </div>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900/60 flex flex-col gap-1">
            <span className="text-xs text-neutral-500 font-mono tracking-wider uppercase block">
              {language === "ar" ? "إيرادات المبيعات المحققة" : "Converted Revenue"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black font-display text-neutral-200">${convertedRevenue.toFixed(2)}</span>
              <span className="text-xs text-neutral-600 font-mono">
                / ${estimatedRevenue.toFixed(0)} {language === "ar" ? "إجمالي" : "total"}
              </span>
            </div>
          </div>

        </div>

        {/* CONTROLS AREA (FROM IMAGE_0.PNG REQUIREMENT) */}
        <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-900 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          
          {/* Main Controls - Logical Connection with Interactive States */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            
            {/* VIEW LEADS DASHBOARD button (Stars icon) */}
            <button
              onClick={() => setCurrentView("leads")}
              className={`px-6 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentView === "leads"
                  ? "bg-[#EAB308] text-black border-2 border-[#EAB308] font-black shadow-[0_0_15px_rgba(234,179,8,0.25)]"
                  : "bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border-2 border-neutral-800"
              }`}
            >
              <Sparkles className={`h-4.5 w-4.5 ${currentView === "leads" ? "text-black animate-pulse" : "text-amber-500"}`} />
              <span>{language === "ar" ? "لوحة العملاء والمبيعات" : "View Leads Dashboard"}</span>
              {currentView === "leads" && (
                <span className="ml-1 h-2 w-2 rounded-full bg-black block" />
              )}
            </button>

            {/* VIEW ALL RECOMMENDATIONS button (Eye icon) */}
            <button
              onClick={() => setCurrentView("all")}
              className={`px-6 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentView === "all"
                  ? "bg-[#D4AF37] text-black border-2 border-[#D4AF37] font-black shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  : "bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border-2 border-neutral-800"
              }`}
            >
              <Eye className={`h-4.5 w-4.5 ${currentView === "all" ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{language === "ar" ? "عرض جميع التوصيات" : "View All Recommendations"}</span>
              {currentView === "all" && (
                <span className="ml-1 h-2 w-2 rounded-full bg-black block" />
              )}
            </button>

          </div>

          <div className="flex items-center gap-4 w-full md:w-auto self-stretch shrink-0">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder={language === "ar" ? "البحث بالاسم، البريد أو الموديل..." : "Filter results locally..."}
                value={recommendationSearchQuery}
                onChange={(e) => setRecommendationSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308] rounded-xl py-2.5 px-4 text-xs font-mono text-white placeholder-neutral-500 transition-all outline-none"
              />
            </div>

            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white cursor-pointer transition-colors"
              title={language === "ar" ? "تحديث ومزامنة البيانات" : "Sync Data"}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

        </div>

        {/* VIEW DESCRIPTIONS HEADER BAR */}
        <div className="mb-4 flex items-center justify-between text-xs font-mono text-neutral-500 uppercase px-2">
          <div>
            {language === "ar" ? "المعروض: " : "Showing: "}
            <span className="text-[#EAB308] font-bold">
              {currentView === "leads" 
                ? (language === "ar" ? "العملاء المحتملون النشطون فقط (غير المشترى)" : "Active Leads Only (Unpurchased)") 
                : (language === "ar" ? "جميع السجلات في النظام (100% من الحجم)" : "All System Records (100% Volume)")}
            </span>
          </div>
          <div>
            {language === "ar" ? "العدد: " : "Count: "}
            <span className="text-white font-bold">{displayedLeads.length}</span> {language === "ar" ? "سجلات" : "records"}
          </div>
        </div>

        {/* MAIN DATA RENDER VIEW CONTAINER */}
        <div className="bg-neutral-950 rounded-2xl border border-neutral-900 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-12 w-12 text-[#EAB308] animate-spin" />
              <div className="font-mono text-sm text-neutral-400">
                {language === "ar" ? "جاري الاستعلام من قاعدة البيانات..." : "Querying public recommendations schema..."}
              </div>
            </div>
          ) : errorStatus && allLeads.length === 0 ? (
            <div className="p-8 text-center text-red-400 font-mono flex flex-col items-center gap-3">
              <AlertTriangle className="h-12 w-12 text-amber-500 animate-pulse" />
              <span className="font-bold text-lg">
                {language === "ar" ? "تم اكتشاف خطأ في قاعدة البيانات" : "Relational Database Error Detected"}
              </span>
              <p className="text-xs text-neutral-500 max-w-lg mb-4">
                {errorStatus.message || (language === "ar" ? "حدث خطأ أثناء ربط جداول قاعدة البيانات. يتم استخدام بيانات تجريبية محفوظة." : "An error occurred with database schema joins. Using cached database mock rows.")}
              </p>
              <button 
                onClick={fetchLeads} 
                className="px-5 py-2 bg-neutral-900 border border-neutral-800 hover:text-white rounded-lg text-xs"
              >
                {language === "ar" ? "إعادة المحاولة" : "Retry Request"}
              </button>
            </div>
          ) : displayedLeads.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 text-neutral-500 font-mono">
              <ShoppingBag className="h-16 w-16 text-neutral-850" />
              <span className="text-base font-bold text-neutral-400">
                {language === "ar" ? "لا توجد سجلات مطابقة" : "No showroom entries found"}
              </span>
              <span className="text-xs text-neutral-600 max-w-sm">
                {language === "ar"
                  ? "جرب تعديل كلمة البحث للتصفية."
                  : "Try clearing your search filters to view recorded recommendations."}
              </span>
            </div>
          ) : (
            <>
              {/* LAPTOPS AND TABLETS VIEW (md breakpoint and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-900 bg-neutral-900/40 text-neutral-450 uppercase font-mono text-[11px] tracking-wider">
                      <th className="py-4 px-6 font-semibold">{language === "ar" ? "العميل والملف الشخصي" : "Customer / Client Profile"}</th>
                      <th className="py-4 px-6 font-semibold text-center">{language === "ar" ? "صورة الإطار" : "Frame Thumbnail"}</th>
                      <th className="py-4 px-6 font-semibold">{language === "ar" ? "تفاصيل ومواصفات الإطار" : "Frame Technical Specs"}</th>
                      <th className="py-4 px-6 font-semibold text-right">{language === "ar" ? "المبلغ" : "Price"}</th>
                      <th className="py-4 px-6 font-semibold text-center">{language === "ar" ? "الحالة" : "Status"}</th>
                      <th className="py-4 px-6 font-semibold text-center">{language === "ar" ? "الإجراءات المتاحة" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {displayedLeads.map((record) => {
                      const clientName = record.profiles?.full_name || (language === "ar" ? "ضيف إنفيجن" : "Envision Guest");
                      const clientEmail = record.profiles?.email || "guest@optic.sa";
                      const frameName = record.inventory?.frame_name || (language === "ar" ? "إطار نظارة فاخر" : "Premium Custom Frame");
                      const brandName = record.inventory?.brand || (language === "ar" ? "علامة تجارية" : "Designer Brand");
                      const priceValue = record.inventory?.price;
                      const isBought = record.is_purchased;
                      const frameMediaUrl = getEyeglassImage(record);

                      // Helper to get styled style badge text
                      const getStyleBadge = (rec: LeadRecord) => {
                        if (language === "ar") {
                          if (rec.reasoning_ar) {
                            const partsAr = rec.reasoning_ar.split(":");
                            if (partsAr.length > 0 && partsAr[0].length < 40) {
                              return partsAr[0].trim();
                            }
                          }
                          return "النمط الموصى به";
                        }
                        if (!rec.reasoning) return "Recommended Style";
                        const parts = rec.reasoning.split(":");
                        if (parts.length > 0 && parts[0].length < 40) {
                          return parts[0].trim();
                        }
                        return "Recommended Style";
                      };

                      return (
                        <tr 
                          key={record.id}
                          className={`transition-all duration-300 ${
                            isBought 
                              ? "bg-neutral-950/20 opacity-60 hover:opacity-100" 
                              : "bg-neutral-950/95 hover:bg-neutral-900/30"
                          }`}
                        >
                          {/* CUSTOMER PROFILE COLUMN */}
                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                                👤 {clientName}
                              </span>
                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5 text-neutral-500" />
                                {clientEmail}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-600">
                                {new Date(record.created_at).toLocaleString()}
                              </span>
                            </div>
                          </td>

                          {/* FRAME THUMBNAIL COLUMN */}
                          <td className="py-6 px-6 min-w-[340px] text-center">
                            <div className="flex justify-center items-center bg-neutral-950/30 border border-neutral-850/50 rounded-xl p-3.5 shadow-inner">
                              <img 
                                src={frameMediaUrl || "/placeholder-frame.png"} 
                                alt="Recommended Eyewear" 
                                onClick={() => frameMediaUrl && setLightboxImage(frameMediaUrl)}
                                className="w-80 h-52 object-contain rounded bg-neutral-900 border border-neutral-800 filter brightness-95 cursor-zoom-in hover:scale-105 transition-transform duration-300" 
                                loading="lazy" 
                                title={language === "ar" ? "اضغط للتكبير" : "Click to view full screen"}
                              />
                            </div>
                          </td>

                          {/* FRAME TECHNICAL SPECIFICATIONS COLUMN */}
                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-2 max-w-xs">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#EAB308] font-black">
                                    {brandName}
                                  </span>
                                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30 rounded">
                                    {record.match_score}% {language === "ar" ? "تطابق" : "Match"}
                                  </span>
                                  <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-400 font-bold">
                                    {getStyleBadge(record)}
                                  </span>
                                </div>
                                <h3 className="text-xs font-bold text-neutral-150 leading-snug">
                                  {frameName}
                                </h3>
                                {record.inventory?.model_name && (
                                  <span className="text-[10px] font-mono text-neutral-500">
                                    {language === "ar" ? "موديل: " : "Model: "} {record.inventory.model_name}
                                  </span>
                                )}
                              </div>
                              
                              {/* Structural sizing measurements */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-neutral-400 border-t border-neutral-900/60 pt-1.5">
                                {record.inventory?.front_size && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="text-neutral-500">{language === "ar" ? "العرض:" : "Front:"}</span>
                                    <span className="text-amber-500 font-bold">{record.inventory.front_size}mm</span>
                                  </span>
                                )}
                                {record.inventory?.bridge_size && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="text-neutral-500">{language === "ar" ? "الجسر:" : "Bridge:"}</span>
                                    <span className="text-amber-500 font-bold">{record.inventory.bridge_size}mm</span>
                                  </span>
                                )}
                                {record.inventory?.temple_length && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="text-neutral-500">{language === "ar" ? "الذراع:" : "Temple:"}</span>
                                    <span className="text-amber-500 font-bold">{record.inventory.temple_length}mm</span>
                                  </span>
                                )}
                                {record.inventory?.material && (
                                  <span className="text-neutral-500 italic block">
                                    ({record.inventory.material})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* PRICE COLUMN */}
                          <td className="py-5 px-6 text-right font-mono">
                            {priceValue ? (
                              <div className="inline-block px-2.5 py-1 text-xs font-black text-[#EAB308] bg-[#EAB308]/5 border border-[#EAB308]/15 rounded-lg shadow-inner">
                                ${priceValue.toFixed(2)} USD
                              </div>
                            ) : (
                              <span className="text-neutral-600 text-xs">-</span>
                            )}
                          </td>

                          {/* STATUS BADGE COLUMN */}
                          <td className="py-5 px-6 text-center">
                            {isBought ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/50 rounded-full font-bold text-[10px] uppercase tracking-wider font-mono">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                <span>{language === "ar" ? "تم البيع" : "Purchased"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-950/25 text-[#EAB308] border border-[#EAB308]/40 rounded-full font-bold text-[10px] uppercase tracking-wider font-mono animate-pulse">
                                <Sparkles className="h-3 w-3 text-[#EAB308] shrink-0" />
                                <span>{language === "ar" ? "عميل نشط" : "Active Lead"}</span>
                              </span>
                            )}
                          </td>

                          {/* ACTIONS COLUMN */}
                          <td className="py-5 px-6 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {/* MARK AS PURCHASED ACTION BUTTON */}
                              {isBought ? (
                                <button
                                  disabled
                                  className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-600 border border-neutral-900 text-xs font-mono font-extrabold uppercase tracking-wide cursor-not-allowed"
                                >
                                  {language === "ar" ? "تم الشراء" : "PURCHASED"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConversion(record.id)}
                                  disabled={updatingId === record.id}
                                  className="px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-[#c99a07] text-black text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(234,179,8,0.15)] flex items-center gap-1"
                                >
                                  {updatingId === record.id ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 animate-spin text-black" />
                                      <span>{language === "ar" ? "جاري المزامنة..." : "Syncing..."}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3.5 w-3.5 stroke-[2.5px]" />
                                      <span>{language === "ar" ? "تحديد كـ مباع" : "MARK AS PURCHASED"}</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Back and Forth Status flip for granular operational testing */}
                              {isBought && (
                                <button
                                  onClick={() => togglePurchaseStatus(record.id, isBought)}
                                  disabled={updatingId === record.id}
                                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-mono cursor-pointer"
                                  title={language === "ar" ? "إعادة الحالة إلى نشط" : "Revert back to active"}
                                >
                                  {language === "ar" ? "تراجع للنشط" : "Revert Active"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE SMARTPHONES VIEW (below md breakpoint) */}
              <div className="md:hidden p-4">
                <div className="grid grid-cols-1 gap-4">
                  {displayedLeads.map((record) => {
                    const clientName = record.profiles?.full_name || (language === "ar" ? "ضيف إنفيجن" : "Envision Guest");
                    const clientEmail = record.profiles?.email || "guest@optic.sa";
                    const frameName = record.inventory?.frame_name || (language === "ar" ? "إطار نظارة فاخر" : "Premium Custom Frame");
                    const brandName = record.inventory?.brand || (language === "ar" ? "علامة تجارية" : "Designer Brand");
                    const priceValue = record.inventory?.price;
                    const isBought = record.is_purchased;
                    const frameMediaUrl = getEyeglassImage(record);

                    // Helper to get styled style badge text
                    const getStyleBadge = (rec: LeadRecord) => {
                      if (language === "ar") {
                        if (rec.reasoning_ar) {
                          const partsAr = rec.reasoning_ar.split(":");
                          if (partsAr.length > 0 && partsAr[0].length < 40) {
                            return partsAr[0].trim();
                          }
                        }
                        return "النمط الموصى به";
                      }
                      if (!rec.reasoning) return "Recommended Style";
                      const parts = rec.reasoning.split(":");
                      if (parts.length > 0 && parts[0].length < 40) {
                        return parts[0].trim();
                      }
                      return "Recommended Style";
                    };

                    return (
                      <div 
                        key={record.id}
                        className={`bg-neutral-900/40 border border-neutral-850/80 rounded-2xl p-4 flex flex-col gap-4 relative shadow-lg overflow-hidden transition-all duration-300 ${
                          isBought ? "opacity-75 bg-neutral-950/40" : ""
                        }`}
                      >
                        {/* Aspect Ratio Frame Snapshot Box */}
                        <div 
                          onClick={() => frameMediaUrl && setLightboxImage(frameMediaUrl)}
                          className="relative w-full aspect-[16/10] bg-neutral-950/45 border border-neutral-800/80 rounded-xl overflow-hidden flex items-center justify-center p-3 shadow-inner cursor-zoom-in hover:border-[#EAB308]/30 transition-all"
                          title={language === "ar" ? "اضغط للتكبير" : "Click to view full screen"}
                        >
                          <img 
                            src={frameMediaUrl || "/placeholder-frame.png"} 
                            alt={language === "ar" ? "النظارة الموصى بها" : "Recommended Eyewear"} 
                            className="w-full h-full object-contain filter brightness-95 hover:scale-105 transition-transform duration-300" 
                            loading="lazy" 
                          />
                          <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 text-[9px] font-mono bg-black/80 text-white border border-white/10 rounded font-bold">
                              {brandName}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-mono bg-[#EAB308]/90 text-black rounded font-black shadow animate-pulse">
                              {record.match_score}% {language === "ar" ? "تطابق" : "Match"}
                            </span>
                          </div>
                        </div>

                        {/* Customer Metadata and Details Stack */}
                        <div className="flex flex-col gap-3">
                          {/* Client Profile Section */}
                          <div className="flex items-start justify-between border-b border-neutral-900 pb-2.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                                👤 {clientName}
                              </span>
                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1 truncate max-w-[200px]">
                                <Mail className="h-3 w-3 text-neutral-500 shrink-0" />
                                {clientEmail}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-500 text-right rtl:text-left shrink-0 mt-0.5">
                              {new Date(record.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Eyeglass Specs and Style Info */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-200">
                                {frameName}
                              </span>
                              {priceValue ? (
                                <span className="text-xs font-black text-[#EAB308] font-mono shrink-0">
                                  ${priceValue.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-neutral-600 text-xs shrink-0">-</span>
                              )}
                            </div>

                            {record.inventory?.model_name && (
                              <span className="text-[10px] font-mono text-neutral-500">
                                {language === "ar" ? "موديل: " : "Model: "} {record.inventory.model_name}
                              </span>
                            )}

                            {/* Styled style badge and status */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[9px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850 text-neutral-400 flex items-center gap-1">
                                <Tag className="h-3 w-3 text-[#EAB308] shrink-0" />
                                <span className="text-neutral-300 font-bold truncate max-w-[150px]">
                                  {getStyleBadge(record)}
                                </span>
                              </span>
                              
                              {/* Status Badge */}
                              {isBought ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/50 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                  <span>{language === "ar" ? "تم البيع" : "Purchased"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/25 text-[#EAB308] border border-[#EAB308]/40 rounded text-[9px] font-bold uppercase tracking-wider font-mono animate-pulse">
                                  <Sparkles className="h-2.5 w-2.5 text-[#EAB308] shrink-0" />
                                  <span>{language === "ar" ? "عميل نشط" : "Active"}</span>
                                </span>
                              )}
                            </div>

                            {/* Sizing measurements row */}
                            <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 bg-neutral-950/50 p-2 rounded-lg border border-neutral-900/80 mt-1.5">
                              {record.inventory?.front_size && (
                                <span className="flex items-center gap-0.5">
                                  <span>{language === "ar" ? "العرض:" : "F:"}</span>
                                  <span className="text-amber-500 font-bold">{record.inventory.front_size}mm</span>
                                </span>
                              )}
                              {record.inventory?.bridge_size && (
                                <span className="flex items-center gap-0.5">
                                  <span>{language === "ar" ? "الجسر:" : "B:"}</span>
                                  <span className="text-amber-500 font-bold">{record.inventory.bridge_size}mm</span>
                                </span>
                              )}
                              {record.inventory?.temple_length && (
                                  <span className="flex items-center gap-0.5">
                                    <span>{language === "ar" ? "الذراع:" : "T:"}</span>
                                    <span className="text-amber-500 font-bold">{record.inventory.temple_length}mm</span>
                                  </span>
                                )}
                              {record.inventory?.material && (
                                <span className="text-neutral-500 italic block truncate">
                                  ({record.inventory.material})
                                </span>
                              )}
                            </div>

                            {/* Reasoning */}
                            {record.reasoning && (
                              <p className="text-[10px] text-neutral-400 leading-relaxed font-mono bg-neutral-950/30 p-2 rounded border border-neutral-900 mt-1">
                                {language === "ar" && record.reasoning_ar ? record.reasoning_ar : record.reasoning}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Massive Full-Width Touch Button */}
                        <div className="mt-auto pt-2 flex flex-col gap-2">
                          {isBought ? (
                            <div className="flex gap-2">
                              <button
                                disabled
                                className="flex-1 py-3 rounded-xl bg-neutral-900 text-neutral-600 border border-neutral-900 text-xs font-mono font-extrabold uppercase tracking-wide cursor-not-allowed text-center"
                              >
                                {language === "ar" ? "تم الشراء" : "PURCHASED"}
                              </button>
                              <button
                                onClick={() => togglePurchaseStatus(record.id, isBought)}
                                disabled={updatingId === record.id}
                                className="px-4 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-mono cursor-pointer flex items-center justify-center"
                                title={language === "ar" ? "إعادة الحالة إلى نشط" : "Revert back to active"}
                              >
                                {language === "ar" ? "تراجع" : "Revert"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleConversion(record.id)}
                              disabled={updatingId === record.id}
                              className="w-full py-3 rounded-xl bg-[#EAB308] hover:bg-[#c99a07] text-black text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_12px_rgba(234,179,8,0.2)] flex items-center justify-center gap-1.5"
                            >
                              {updatingId === record.id ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                                  <span>{language === "ar" ? "جاري المزامنة..." : "Syncing..."}</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 stroke-[2.5px]" />
                                  <span>{language === "ar" ? "تحديد كـ مباع" : "MARK AS PURCHASED"}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* COMPREHENSIVE RECONCILIATION FOOTER NOTES */}
        <div className="mt-8 text-center text-xs font-mono text-neutral-600 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span>
              {language === "ar"
                ? "تتم مزامنة العملاء المحتملين وسجلات صالة العرض لحظيًا بين العميل والخادم."
                : "Showroom leads and active indices are synchronized client-to-server."}
            </span>
          </div>
          <span className="hidden sm:inline text-neutral-800">|</span>
          <div>
            {language === "ar"
              ? "مبني وفق أعلى بروتوكولات التوافق البيومتري لإدارة متاجر النظارات الفاخرة."
              : "Built with supreme biometric alignment protocols for luxury eyeglasses store management."}
          </div>
        </div>

        {/* LIGHTBOX OVERLAY MODAL */}
        <AnimatePresence>
          {lightboxImage && (
            <div 
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8 cursor-zoom-out backdrop-blur-md animate-fade-in"
              id="leads-lightbox"
            >
              <button 
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-6 right-6 p-3 bg-neutral-900/80 hover:bg-neutral-800 text-white rounded-full border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center pointer-events-none">
                <img 
                  src={lightboxImage} 
                  alt="Recommended Eyewear Zoomed Preview" 
                  className="max-w-full max-h-full object-contain filter brightness-105 rounded-lg select-none animate-scale-up"
                />
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
