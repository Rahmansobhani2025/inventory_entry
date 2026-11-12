"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  Database, 
  Globe, 
  RefreshCw, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Sparkles,
  Layers,
  ChevronRight,
  Maximize2,
  Check
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence } from "motion/react";

interface RecommendationRecord {
  id: string;
  created_at: string;
  brand: string;
  frame_name: string;
  model_name: string;
  front_size: number;
  bridge_size: number;
  temple_length: number;
  material: string;
  price: number;
  image_url: string;
  inventory_media?: any[];
}

const INVENTORY_PRESETS: Record<string, {
  brand: string;
  frame_name: string;
  model_name: string;
  front_size: number;
  bridge_size: number;
  temple_length: number;
  material: string;
  price: number;
  image_url: string;
}> = {
  "tf-gold": {
    brand: "Tom Ford",
    frame_name: "Tom Ford TF5488-B Gold",
    model_name: "TF5488-B",
    front_size: 52,
    bridge_size: 18,
    temple_length: 145,
    material: "Titanium",
    price: 380.00,
    image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=600"
  },
  "cartier-rimless": {
    brand: "Cartier",
    frame_name: "Cartier CT0011O Rimless",
    model_name: "CT0011O",
    front_size: 53,
    bridge_size: 18,
    temple_length: 140,
    material: "Titanium Gold",
    price: 980.00,
    image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600"
  },
  "oliver-peoples-greg": {
    brand: "Oliver Peoples",
    frame_name: "Gregory Peck Tortoise Acetate",
    model_name: "Gregory Peck Classic",
    front_size: 47,
    bridge_size: 23,
    temple_length: 150,
    material: "Acetate Frame",
    price: 395.00,
    image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600"
  },
  "oakley-holbrook": {
    brand: "Oakley",
    frame_name: "Oakley Holbrook Matte Black",
    model_name: "OO9102 Black",
    front_size: 55,
    bridge_size: 18,
    temple_length: 137,
    material: "O Matter (R) Active",
    price: 152.00,
    image_url: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=600"
  },
  "rayban-aviator": {
    brand: "Ray-Ban",
    frame_name: "Ray-Ban Classic Aviator",
    model_name: "Aviator RB3025",
    front_size: 58,
    bridge_size: 14,
    temple_length: 135,
    material: "Metal Chassis",
    price: 160.00,
    image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600"
  }
};

export default function RecommendationsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<any>(null);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Modal / Modify States
  const [editingItem, setEditingItem] = useState<RecommendationRecord | null>(null);
  const [editFrameName, setEditFrameName] = useState("");
  const [editModelName, setEditModelName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editFrontSize, setEditFrontSize] = useState("");
  const [editBridgeSize, setEditBridgeSize] = useState("");
  const [editTempleLength, setEditTempleLength] = useState("");
  const [editMaterial, setEditMaterial] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const showToastMsg = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const getMockRecommendations = useCallback((): RecommendationRecord[] => {
    return Object.entries(INVENTORY_PRESETS).map(([id, p]) => ({
      id,
      created_at: new Date().toISOString(),
      brand: p.brand,
      frame_name: p.frame_name,
      model_name: p.model_name,
      front_size: p.front_size,
      bridge_size: p.bridge_size,
      temple_length: p.temple_length,
      material: p.material,
      price: p.price,
      image_url: p.image_url,
      inventory_media: [
        {
          id: `media-${id}`,
          media_url: p.image_url,
          is_primary: true
        }
      ]
    }));
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            id,
            created_at,
            frame_name,
            brand,
            price,
            model_name,
            material,
            front_size,
            bridge_size,
            temple_length,
            inventory_media (
              id,
              media_url,
              media_type,
              is_primary
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Database error occurred while fetching inventory:", error);
          setErrorStatus(error);
          
          const saved = localStorage.getItem("envision_flat_inventory_only");
          if (saved) {
            setRecommendations(JSON.parse(saved));
          } else {
            const rawMock = getMockRecommendations();
            setRecommendations(rawMock);
          }
        } else {
          const parsed: RecommendationRecord[] = (data || []).map((item: any) => {
            const mediaList = item.inventory_media || [];
            let image_url = "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=600";
            
            const primary = mediaList.find((m: any) => m.is_primary === true);
            if (primary && primary.media_url && !primary.media_url.includes("dkzznbzes")) {
              image_url = primary.media_url;
            } else if (mediaList[0] && mediaList[0].media_url && !mediaList[0].media_url.includes("dkzznbzes")) {
              image_url = mediaList[0].media_url;
            }

            return {
              id: String(item.id),
              created_at: item.created_at || new Date().toISOString(),
              frame_name: item.frame_name || "Envision Style Frame",
              brand: item.brand || "Envision",
              model_name: item.model_name || "ENV-CLASSIC",
              front_size: item.front_size || 50,
              bridge_size: item.bridge_size || 18,
              temple_length: item.temple_length || 140,
              material: item.material || "Premium Acetate",
              price: item.price ? Number(item.price) : 199.00,
              image_url: image_url,
              inventory_media: mediaList
            };
          });
          setRecommendations(parsed);
          localStorage.setItem("envision_flat_inventory_only", JSON.stringify(parsed));
        }
      } else {
        const saved = localStorage.getItem("envision_flat_inventory_only");
        if (saved) {
          setRecommendations(JSON.parse(saved));
        } else {
          const fallback = getMockRecommendations();
          localStorage.setItem("envision_flat_inventory_only", JSON.stringify(fallback));
          setRecommendations(fallback);
        }
      }
    } catch (err: any) {
      console.error("error fetching inventory:", err);
      setErrorStatus(err);
      const fallback = getMockRecommendations();
      setRecommendations(fallback);
    } finally {
      setLoading(false);
    }
  }, [getMockRecommendations]);

  useEffect(() => {
    let active = true;
    const deferLoad = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (active) {
        fetchRecommendations();
      }
    };
    deferLoad();
    return () => {
      active = false;
    };
  }, [fetchRecommendations]);

  // Open Edit Modal with current values
  const handleStartEdit = (item: RecommendationRecord) => {
    setEditingItem(item);
    setEditFrameName(item.frame_name || "");
    setEditModelName(item.model_name || "");
    setEditBrand(item.brand || "");
    setEditFrontSize(String(item.front_size || ""));
    setEditBridgeSize(String(item.bridge_size || ""));
    setEditTempleLength(String(item.temple_length || ""));
    setEditMaterial(item.material || "");
    setEditPrice(String(item.price || ""));
    setEditImageUrl(item.image_url || "");
  };

  // Save the modified record
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const priceNum = editPrice ? parseFloat(editPrice) : 199.00;
    const frontNum = editFrontSize ? parseInt(editFrontSize) : 50;
    const bridgeNum = editBridgeSize ? parseInt(editBridgeSize) : 18;
    const templeNum = editTempleLength ? parseInt(editTempleLength) : 140;

    const updatedItem: RecommendationRecord = {
      ...editingItem,
      frame_name: editFrameName,
      model_name: editModelName,
      brand: editBrand,
      front_size: frontNum,
      bridge_size: bridgeNum,
      temple_length: templeNum,
      material: editMaterial,
      price: priceNum,
      image_url: editImageUrl
    };

    // Update in State
    const nextRecs = recommendations.map(item => item.id === editingItem.id ? updatedItem : item);
    setRecommendations(nextRecs);
    localStorage.setItem("envision_flat_inventory_only", JSON.stringify(nextRecs));

    if (isSupabaseConfigured) {
      try {
        const { error: invErr } = await supabase
          .from('inventory')
          .update({
            frame_name: editFrameName,
            model_name: editModelName,
            brand: editBrand,
            front_size: frontNum,
            bridge_size: bridgeNum,
            temple_length: templeNum,
            material: editMaterial,
            price: priceNum
          })
          .eq('id', editingItem.id);

        if (invErr) {
          console.error("Error updating inventory:", invErr);
        }

        // Check if there is a primary file in inventory_media
        if (editImageUrl && editImageUrl !== editingItem.image_url) {
          const mediaList = editingItem.inventory_media || [];
          const primaryMedia = mediaList.find((m: any) => m.is_primary === true);
          
          if (primaryMedia) {
            const { error: mediaErr } = await supabase
              .from('inventory_media')
              .update({ media_url: editImageUrl })
              .eq('id', primaryMedia.id);
            if (mediaErr) console.error("Error updating media:", mediaErr);
          } else {
            const { error: mediaErr } = await supabase
              .from('inventory_media')
              .insert({
                inventory_id: editingItem.id,
                media_url: editImageUrl,
                media_type: 'image',
                is_primary: true
              });
            if (mediaErr) console.error("Error inserting media:", mediaErr);
          }
        }
      } catch (err) {
        console.warn("Supabase database sync error for edit:", err);
      }
    }

    setEditingItem(null);
    showToastMsg(
      language === "ar" ? "تم تعديل مواصفات الإطارات بنجاح!" : "Eyeglass specifications updated successfully!",
      "success"
    );
    
    await fetchRecommendations();
  };

  // Delete the record immediately
  const handleDeleteRecord = async (id: string) => {
    const confirmMsg = language === "ar"
      ? "هل أنت متأكد من حذف هذا الإطار نهائياً؟"
      : "Are you sure you want to permanently delete this eyeglass frame?";
    if (!window.confirm(confirmMsg)) return;

    // Filter out in State
    const nextRecs = recommendations.filter(item => item.id !== id);
    setRecommendations(nextRecs);
    localStorage.setItem("envision_flat_inventory_only", JSON.stringify(nextRecs));

    // If Supabase is configured, delete from database
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('inventory_media')
          .delete()
          .eq('inventory_id', id);

        await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn("Database sync error for deletion", err);
      }
    }

    showToastMsg(
      language === "ar" ? "تم حذف الإطار بنجاح!" : "Inventory record deleted successfully!",
      "info"
    );
    
    await fetchRecommendations();
  };

  const filteredRecs = recommendations.filter(rec => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      (rec.frame_name || "").toLowerCase().includes(q) ||
      (rec.model_name || "").toLowerCase().includes(q) ||
      (rec.brand || "").toLowerCase().includes(q) ||
      (rec.material || "").toLowerCase().includes(q)
    );
  });

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center font-sans gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-[#EAB308] border-t-transparent rounded-full" />
        <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">Initializing Showroom Showcase...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white py-10 px-4 md:px-12 font-sans relative overflow-hidden" id="recommendations-viewport-container">
      {/* Background Ambience Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#eab30807_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* TOP BAR / NAVIGATION AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-850 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 bg-neutral-900 border border-neutral-800 hover:border-[#EAB308] rounded-xl text-neutral-300 hover:text-[#EAB308] transition-all flex items-center justify-center cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#EAB308] font-mono tracking-wider uppercase font-extrabold">
                <Layers className="h-3.5 w-3.5" />
                <span>Showroom Showcase</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-widest text-[#EAB308] uppercase mt-1">
                {language === "ar" ? "استعراض ومواصفات النظارات" : "Eyeglass Showcase Registry"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-start">
            {/* Database status tag */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3.5 py-1.5 text-xs font-mono">
              <span className={`h-2.5 w-2.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-[10px] uppercase text-neutral-400">
                {isSupabaseConfigured ? "Supabase Live" : "Local Showcase Cache"}
              </span>
            </div>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EAB308]/10 hover:bg-[#EAB308]/25 border border-[#EAB308]/30 hover:border-[#EAB308]/60 text-[#EAB308] rounded-xl transition-all font-mono text-xs uppercase cursor-pointer"
            >
              <Globe className="h-4 w-4" />
              <span>{language === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </div>

        {/* TOAST SYSTEM */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-bounce">
            <div className={`px-5 py-3 rounded-xl border font-mono text-xs shadow-xl flex items-center gap-3 bg-neutral-950 ${
              toast.type === "success" ? "border-emerald-500/50 text-emerald-400" :
              toast.type === "error" ? "border-red-500/50 text-red-400" : "border-amber-500/50 text-amber-400"
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* SEARCH AND REFRESH TOOL SECTION */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={language === "ar" ? "البحث باسم النظارة، الموديل أو الماركة..." : "Search generic name, model, style or brand..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308] rounded-xl py-2.5 px-4 text-xs font-mono text-white placeholder-neutral-500 transition-all outline-none"
            />
          </div>
          
          <button
            onClick={() => fetchRecommendations()}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-all font-mono text-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#EAB308]" : ""}`} />
            <span>{language === "ar" ? "تحديث السجلات" : "Sync Showcase"}</span>
          </button>
        </div>

        {/* EYEGLASS CARDS GRID: Renders only the large image and gorgeous specifications sheet */}
        {loading ? (
          <div className="bg-neutral-950 rounded-2xl border border-neutral-900 py-32 text-center flex flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 text-[#EAB308] animate-spin" />
            <div className="font-mono text-xs text-neutral-400">
              {language === "ar" ? "جاري تعبئة بيانات الإطارات ومقاساتها..." : "Loading catalog records and frame specifications..."}
            </div>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="bg-neutral-950 rounded-2xl border border-neutral-900 py-24 text-center flex flex-col items-center justify-center gap-4 text-neutral-500 font-mono">
            <AlertCircle className="h-12 w-12 text-neutral-800" />
            <span className="text-base font-bold text-neutral-450">
              {language === "ar" ? "لا توجد سجلات مطابقة" : "No Showcase Records Registered"}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="recommendations-viewport-container-inner">
            {filteredRecs.map((rec) => {
              return (
                <div 
                  key={rec.id} 
                  className="bg-neutral-950/80 border border-neutral-850 hover:border-[#EAB308]/40 rounded-2xl p-6 transition-all duration-300 relative group flex flex-col justify-between"
                >
                  {/* Outer glow hover effect */}
                  <div className="absolute inset-0 bg-[#eab308]/[0.01] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

                  <div>
                    {/* Eyeglass Premium Large Image */}
                    <div 
                      onClick={() => setLightboxImage(rec.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400")}
                      className="relative w-full h-80 bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden flex items-center justify-center p-4 group-hover:border-[#EAB308]/35 transition-all mb-6 cursor-zoom-in"
                      title="Click to view full screen"
                    >
                      <Image 
                        src={rec.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400"} 
                        alt={rec.frame_name || "Eyeglass Style"}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain filter brightness-95 group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Brand Tag Top Right */}
                      <div className="absolute top-3 right-3 px-3 py-1 bg-black/90 border border-neutral-800 rounded text-[10px] font-mono font-black text-[#EAB308] uppercase tracking-wider">
                        {rec.brand || "Envision"}
                      </div>
                    </div>

                    {/* Branding Titles */}
                    <div className="border-b border-neutral-900 pb-4 mb-4">
                      <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                        {rec.frame_name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono mt-1">
                        Model SKU: <span className="text-[#EAB308] font-bold">{rec.model_name || "Style v1"}</span>
                      </p>
                    </div>

                    {/* Symmetrical Tech Spec Sheet Grid (Mandatory metrics highlighted) */}
                    <div className="grid grid-cols-3 gap-2.5 mb-5 select-text">
                      
                      {/* Metric 1: Front Size */}
                      <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-850/80 flex flex-col items-center text-center">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-1">
                          📏 {language === "ar" ? "عرض الإطار (Front)" : "Front size"}
                        </span>
                        <span className="text-sm font-black text-neutral-100 font-mono">
                          {rec.front_size || "?"} <span className="text-[10px] text-neutral-500">mm</span>
                        </span>
                      </div>

                      {/* Metric 2: Bridge Size */}
                      <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-850/80 flex flex-col items-center text-center">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-1">
                          🌉 {language === "ar" ? "جسر الأنف (Bridge)" : "Bridge size"}
                        </span>
                        <span className="text-sm font-black text-neutral-100 font-mono">
                          {rec.bridge_size || "?"} <span className="text-[10px] text-neutral-500">mm</span>
                        </span>
                      </div>

                      {/* Metric 3: Temple Length */}
                      <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-850/80 flex flex-col items-center text-center">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mb-1">
                          📐 {language === "ar" ? "طول الذراع" : "Temple length"}
                        </span>
                        <span className="text-sm font-black text-neutral-100 font-mono">
                          {rec.temple_length || "?"} <span className="text-[10px] text-neutral-500">mm</span>
                        </span>
                      </div>

                    </div>

                    {/* Any Other Information Display (Material, Price, AI Analysis Segment) */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-xs font-mono border-b border-neutral-900/40 pb-2">
                        <span className="text-neutral-500 uppercase text-[10px]">
                          {language === "ar" ? "المواد الفاخرة" : "Premium Material"}
                        </span>
                        <span className="text-neutral-200 font-bold">
                          {rec.material || "Premium Engineered"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono border-b border-neutral-900/40 pb-2">
                        <span className="text-neutral-500 uppercase text-[10px]">
                          {language === "ar" ? "سعر التجزئة" : "Value Assessment"}
                        </span>
                        <span className="text-[#EAB308] font-black">
                          ${rec.price?.toFixed(2) || "199.00"} USD
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM ACTION RAIL: Quick Modify & Instant Delete Buttons */}
                  <div className="flex gap-3 border-t border-neutral-900/80 pt-4 mt-2">
                    
                    {/* Modify Button */}
                    <button
                      onClick={() => handleStartEdit(rec)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs uppercase font-extrabold cursor-pointer border border-[#EAB308]/30 hover:border-[#EAB308]/90 text-[#EAB308] hover:bg-[#EAB308]/5 transition-all"
                      title="Edit specifications"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{language === "ar" ? "تعديل تفاصيل الإطار" : "Modify Specs"}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="flex-none px-4 rounded-xl border border-red-900/40 hover:border-red-500/80 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DIALOG: Floating specs modifier editor */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all animate-fadeIn">
            <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-850 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-[#EAB308] animate-spin" />
                  <h3 className="font-bold text-[#EAB308] uppercase tracking-wider font-mono text-xs">
                    {language === "ar" ? "تعديل مواصفات القياسات البصرية" : "Modify Frame Architecture Specs"}
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll text-sm">
                
                {/* Visual Image presets */}
                <div>
                  <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1.5">
                    {language === "ar" ? "تصميم وصورة النظارة" : "Frame Image Layout Preset"}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { name: "TF Gold", url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400" },
                      { name: "Cartier Rimless", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400" },
                      { name: "Gregory Tortoise", url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400" },
                      { name: "Oakley Holbrook", url: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400" },
                      { name: "Classic Ray-Ban", url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400" }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditImageUrl(opt.url)}
                        className={`p-1.5 rounded-lg border text-[9px] truncate transition-all flex flex-col items-center gap-1 bg-neutral-950 ${
                          editImageUrl === opt.url ? "border-[#EAB308] text-[#EAB308]" : "border-neutral-850 hover:border-neutral-700 text-neutral-400"
                        }`}
                      >
                        <span className="relative w-full h-8 flex items-center justify-center">
                          <Image src={opt.url} alt={opt.name} fill className="object-contain" referrerPolicy="no-referrer" />
                        </span>
                        <span className="block max-w-full font-mono">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="mt-2 w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-lg p-2 text-xs font-mono text-neutral-300 outline-none"
                    placeholder="Or enter custom unsplash URL..."
                  />
                </div>

                {/* Line grid 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                      {language === "ar" ? "اسم النظارة والموديل" : "Eyeglass Name"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-xl p-3 text-xs text-white outline-none font-bold"
                      value={editFrameName}
                      onChange={(e) => setEditFrameName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                      {language === "ar" ? "رقم الموديل (SKU)" : "Model Code / SKU"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-xl p-3 text-xs text-white outline-none font-mono"
                      value={editModelName}
                      onChange={(e) => setEditModelName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Brand & Material & Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                      {language === "ar" ? "الماركة" : "Brand"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-xl p-3 text-xs text-white outline-none"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                      {language === "ar" ? "مادة الصنع" : "Material"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-xl p-3 text-xs text-white outline-none"
                      value={editMaterial}
                      onChange={(e) => setEditMaterial(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                      {language === "ar" ? "سعر التقييم ($)" : "Value Price ($)"}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-[#EAB308] rounded-xl p-3 text-xs text-white outline-none font-mono"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dimensional Spec Inputs (Front, Bridge, Temple) */}
                <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-xl space-y-3">
                  <span className="block text-[10px] uppercase tracking-wider font-mono font-bold text-[#EAB308] mb-1">
                    📐 {language === "ar" ? "مواصفات المقاسات الهندسية (ملم)" : "Geometric Specifications (mm)"}
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-neutral-500 mb-1">
                        {language === "ar" ? "عرض العدسة (Front)" : "Front size"}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#EAB308] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                        value={editFrontSize}
                        onChange={(e) => setEditFrontSize(e.target.value)}
                        placeholder="e.g. 52"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-neutral-500 mb-1">
                        {language === "ar" ? "جسر الأنف (Bridge)" : "Bridge size"}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#EAB308] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                        value={editBridgeSize}
                        onChange={(e) => setEditBridgeSize(e.target.value)}
                        placeholder="e.g. 18"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-neutral-500 mb-1">
                        {language === "ar" ? "طول الذراع (Temple)" : "Temple length"}
                      </label>
                      <input
                        type="number"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#EAB308] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                        value={editTempleLength}
                        onChange={(e) => setEditTempleLength(e.target.value)}
                        placeholder="e.g. 145"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer action rail */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-850 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-mono border border-neutral-800 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 cursor-pointer"
                >
                  {language === "ar" ? "إلغاء التعديل" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 text-xs font-mono bg-[#EAB308] hover:bg-yellow-500 text-black rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>{language === "ar" ? "حفظ التغييرات" : "Save Specifications"}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* FOOTER COOPERATIVE FOOTNOTE */}
        <div className="mt-12 text-center text-[11px] font-mono text-neutral-600 flex flex-col items-center justify-center gap-1 border-t border-neutral-900/60 pt-6">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#EAB308]" />
            <span>
              {language === "ar"
                ? "يتم تتبع وتعديل مواصفات العدسات المضمنة بشكل فوري وربطها مع معرف الجلسة بمرونة تامة."
                : "Frame metrics adjustments represent precise viewport values stored locally on this client session."}
            </span>
          </div>
          <p className="text-[10px] text-neutral-700">Envision Showroom Portal Engine v3.2</p>
        </div>

        {/* LIGHTBOX OVERLAY MODAL */}
        <AnimatePresence>
          {lightboxImage && (
            <div 
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8 cursor-zoom-out backdrop-blur-md animate-fade-in"
              id="recommendations-lightbox"
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={lightboxImage} 
                  alt="Eyeglass Preview Zoomed" 
                  className="max-w-full max-h-full object-contain filter brightness-105 rounded-lg select-none"
                />
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
