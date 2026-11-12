"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Camera, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Database, 
  Globe, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Coins, 
  ChevronRight, 
  Package, 
  RefreshCw,
  Info,
  Trash2,
  Mail,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  Tag,
  X,
  Upload,
  UploadCloud,
  Video,
  VideoOff,
  ShieldAlert,
  HelpCircle,
  Maximize2,
  FileImage,
  Store,
  User,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCredentials, getServerTimestamp } from "./actions";
import Link from "next/link";

// UUID validator helper
const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Sequential Photo Steps interface
interface PhotoStep {
  idx: number;
  label: string;
  indicator: string;
}

const CAPTURE_STEPS: PhotoStep[] = [
  { idx: 1, label: "CAPTURE FRAME FRONT ANGLE (Saves to Database)", indicator: "Front View" },
  { idx: 2, label: "CAPTURE FRAME SIDE PROFILE (Saves to Database)", indicator: "Side Profile" },
  { idx: 3, label: "VIEWING INNER LEFT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Left Temple" },
  { idx: 4, label: "VIEWING INNER RIGHT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Right Temple" }
];

// Snapshot data structure
interface Snapshot {
  stepIdx: number;
  label: string;
  blobUrl: string | null;
  cloudinaryUrl: string | null;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadError?: string;
}

// Local scan history listing
interface SavedRecord {
  id: string;
  brand: string;
  model: string;
  frame_name: string;
  front_size: number;
  bridge_size: number;
  temple_length: number;
  price: number;
  material: string;
  images_count: number;
  timestamp: string;
  synced: boolean;
}

// Generate temporary ID outside of render cycles to satisfy strict react purity linters
function generateTmpId(): string {
  return `tmp-${Date.now()}`;
}

const STATIC_INITIAL_SAMPLES = [
  {
    id: "local-sample-1",
    brand: "Tom Ford",
    model_name: "TF5488-B",
    frame_name: "Tom Ford TF5488-B Gold",
    front_size: 52,
    bridge_size: 18,
    temple_length: 145,
    price: 380.00,
    material: "Titanium",
    preview_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T13:40:00.000Z"
  },
  {
    id: "local-sample-2",
    brand: "Gucci",
    model_name: "GG0024S",
    frame_name: "Gucci GG0024S Black Acetate",
    front_size: 54,
    bridge_size: 20,
    temple_length: 140,
    price: 420.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T13:30:00.000Z"
  },
  {
    id: "local-sample-3",
    brand: "Prada",
    model_name: "PR17WS",
    frame_name: "Prada PR17WS White",
    front_size: 49,
    bridge_size: 20,
    temple_length: 145,
    price: 360.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T13:20:00.000Z"
  },
  {
    id: "local-sample-4",
    brand: "Ray-Ban",
    model_name: "Aviator RB3025",
    frame_name: "Ray-Ban Classic Aviator",
    front_size: 58,
    bridge_size: 14,
    temple_length: 135,
    price: 160.00,
    material: "Metal",
    preview_url: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T13:10:00.000Z"
  },
  {
    id: "local-sample-5",
    brand: "Oliver Peoples",
    model_name: "Gregory Peck OV5217",
    frame_name: "Gregory Peck Tortoise Acetate",
    front_size: 47,
    bridge_size: 23,
    temple_length: 150,
    price: 395.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T13:00:00.000Z"
  },
  {
    id: "local-sample-6",
    brand: "Oakley",
    model_name: "Holbrook OO9102",
    frame_name: "Oakley Holbrook Matte Black",
    front_size: 55,
    bridge_size: 18,
    temple_length: 137,
    price: 152.00,
    material: "TR90",
    preview_url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:50:00.000Z"
  },
  {
    id: "local-sample-7",
    brand: "Persol",
    model_name: "PO0714 Folding",
    frame_name: "Persol PO0714 Folding Aviator",
    front_size: 54,
    bridge_size: 21,
    temple_length: 140,
    price: 490.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:40:00.000Z"
  },
  {
    id: "local-sample-8",
    brand: "Dior",
    model_name: "DiorSignature S5U",
    frame_name: "DiorSignature Acetate Butterfly",
    front_size: 53,
    bridge_size: 22,
    temple_length: 145,
    price: 480.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:30:00.000Z"
  },
  {
    id: "local-sample-9",
    brand: "Cartier",
    model_name: "CT0011O",
    frame_name: "Cartier CT0011O Rimless",
    front_size: 53,
    bridge_size: 18,
    temple_length: 140,
    price: 980.00,
    material: "Titanium",
    preview_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:20:00.000Z"
  },
  {
    id: "local-sample-10",
    brand: "Mykita",
    model_name: "Lite-Tami",
    frame_name: "Mykita Lite-Tami Minimalist",
    front_size: 47,
    bridge_size: 21,
    temple_length: 140,
    price: 525.00,
    material: "Titanium",
    preview_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:10:00.000Z"
  },
  {
    id: "local-sample-11",
    brand: "Jacques Marie Mage",
    model_name: "Dealan Noir",
    frame_name: "Jacques Marie Mage Dealan",
    front_size: 50,
    bridge_size: 20,
    temple_length: 142,
    price: 795.00,
    material: "Acetate",
    preview_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T12:00:00.000Z"
  },
  {
    id: "local-sample-12",
    brand: "Silhouette",
    model_name: "TMA Must 5515",
    frame_name: "Silhouette Titan Minimal Art",
    front_size: 51,
    bridge_size: 19,
    temple_length: 145,
    price: 340.00,
    material: "Titanium",
    preview_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400",
    created_at: "2026-05-25T11:50:00.000Z"
  }
];

interface MaterialItem {
  name: string;
  description: string;
}

interface MaterialCategory {
  categoryName: string;
  categoryDesc: string;
  items: MaterialItem[];
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    categoryName: "1. Acetate & Plastics (The High-Volume & Luxury Classics)",
    categoryDesc: "Acetate and high-grade polymers form the bedrock of the eyewear industry due to their deep color luster, flexibility, and ease of adjustment.",
    items: [
      { name: "Pure Cellulose Acetate", description: "The industry standard; premium plant-based plastic known for rich color depth and gloss." },
      { name: "Bio-Acetate", description: "A 100% biodegradable, eco-friendly polymer made without traditional phthalate plasticizers." },
      { name: "TR90 (Grilamid)", description: "A highly flexible, ultra-lightweight, and impact-resistant Swiss homopolymer nylon used heavily in sports and activewear." },
      { name: "Ultem (PEI)", description: "An aerospace-grade thermoplastic known for extreme flexibility, heat resistance, and shape memory, allowing for ultra-thin frames." },
      { name: "Nylon (Polyamide)", description: "High-performance, durable, and flexible plastic primarily used for sports wrap frames and safety glasses." },
      { name: "Optyl", description: "An epoxy resin that is hypoallergenic, incredibly lightweight, and possesses a \"shape memory\" property that molds to the wearer's face when heated." },
      { name: "Recycled Ocean Plastics (PET/RPET)", description: "Sustainable polymers derived from upcycled marine waste, appealing to eco-conscious demographics." },
      { name: "Acetate & Metal Core Hybrid", description: "Cellulose acetate outer rims reinforced by a visible, structurally necessary metal inner wire core or chassis." },
      { name: "Acetate & Titanium Combo", description: "Luxury acetate front chassis paired with pure titanium or beta-titanium temples and bridges." },
      { name: "Acetate & Wood Veneer Hybrid", description: "A structural fusion where high-grade acetate is layered or faced with a thin natural wood exterior veneer." },
      { name: "Acetate & Carbon Fiber Hybrid", description: "Multi-layered frames where a thin layer of carbon fiber is sandwiched between sheets of acetate to reduce weight and thickness while adding strength." },
      { name: "Bio-Acetate & Plant-Based Wood Fiber Composite", description: "An eco-friendly material where microscopic wood particles are embedded into organic bio-acetate, giving a distinct speckled texture." }
    ]
  },
  {
    categoryName: "2. Premium & Precious Metals (The High-Margin Architectural Materials)",
    categoryDesc: "Metals drive structural minimalism, lightweight comfort, and high-end executive aesthetics.",
    items: [
      { name: "Pure Titanium", description: "Exceptionally lightweight, highly durable, completely corrosion-resistant, and 100% hypoallergenic." },
      { name: "Beta-Titanium (\u03b2-Titanium)", description: "A flexible titanium alloy that allows for ultra-thin, springy temples that bend without breaking or losing shape." },
      { name: "Stainless Steel", description: "High-tensile, budget-friendly, and highly resilient metal capable of being cut into incredibly thin, sleek profiles." },
      { name: "Monel (Nickel-Copper Alloy)", description: "A highly malleable, traditional eyewear metal used for intricate frame shaping, typically coated to protect sensitive skin." },
      { name: "Aluminum", description: "Lightweight, structurally rigid, and completely recyclable, offering a distinct matte industrial finish." },
      { name: "Memory Metal (Beta-NiTi / Flexon)", description: "A titanium-nickel alloy that can be severely bent or twisted and instantly return to its original shape." },
      { name: "18k / 24k Solid Gold", description: "Ultra-luxury, heavy-weight precious metal used exclusively for bespoke, high-net-worth tier pricing models." },
      { name: "Sterling Silver (925)", description: "Used for heavy, artisanal fashion frames, often oxidized for vintage, gothic, or high-fashion detailing." },
      { name: "Titanium & Acetate Hybrid", description: "A premium architecture combining a titanium skeleton or bridge with acetate rim inserts (Windsor rings)." },
      { name: "Titanium & Wood Hybrid", description: "Pure titanium structural chassis paired with hand-carved solid wood or wood veneer temple tips and front accents." },
      { name: "Stainless Steel & TR90 Combo", description: "Ultra-thin stainless steel chassis or bridges structurally bound with flexible TR90 injection-molded rims." },
      { name: "Gold-Plated Titanium", description: "Pure or beta-titanium electroplated with 18k or 24k gold, combining elite durability with precious metal prestige." },
      { name: "Metal & Buffalo Horn Hybrid", description: "Precious metals or titanium acting as the chassis, bridge, and temples to support fragile natural horn front plates." }
    ]
  },
  {
    categoryName: "3. Exotic & Natural Elements (The Artisanal Eco-Luxury Tier)",
    categoryDesc: "These materials command the highest retail markups because they are positionable as unique, artisanal, and sustainable masterpieces.",
    items: [
      { name: "Natural Hardwoods (Walnut, Ebony, Rosewood, Zebrawood, Mahogany)", description: "Hand-carved, rich-grained timbers offering distinct textures and colors." },
      { name: "Bamboo", description: "Eco-friendly, exceptionally lightweight, and strong grass timber with a distinct linear grain." },
      { name: "Natural Buffalo Horn", description: "Harvested ethically as a byproduct; lightweight, hypoallergenic, and featuring completely unique organic grain streaks in white, brown, or black." },
      { name: "Real Stone / Slate Veneer", description: "Ultra-thin layers of genuine slate or quartzite rock bonded to a flexible backing structure." },
      { name: "Recycled Skateboard Wood", description: "Multi-layered, cross-grained maple sheets dyed in vibrant, contrasting colors for an edgy, action-sports style." },
      { name: "Wood & Carbon Fiber Core (Laminated)", description: "Natural wood veneers sandwiching a hidden carbon fiber sheet to prevent snapping and allow for ultra-thin rims." },
      { name: "Wood & Buffalo Horn Combo", description: "Pinnacle luxury frames featuring a hand-polished horn inner layer for facial comfort and an exotic wood exterior faceplate." },
      { name: "Buffalo Horn & Titanium Hybrid", description: "Natural horn rims supported by a pure titanium bridge, hinges, and core wires for adjustability." },
      { name: "Stone Veneer & Carbon Fiber Hybrid", description: "Thin genuine stone faceplate supported by a rigid carbon fiber backing to prevent rock fracturing." },
      { name: "Wood & Gold-Plated Metal Combo", description: "Exotic hardwood front rims accented or held together by intricate 18k or 24k gold-plated metal bridges and hardware." }
    ]
  },
  {
    categoryName: "4. Advanced Composites & 3D-Printed Tech (The Future-Proof Disruptors)",
    categoryDesc: "Ideal for modern direct-to-consumer (DTC) brands and high-tech startups focusing on custom fitment, speed-to-market, and high strength-to-weight ratios.",
    items: [
      { name: "Carbon Fiber", description: "Layers of carbon weave bonded with resin; incredibly strong, lightweight, and synonymous with high-tech racing performance." },
      { name: "3D-Printed Polyamide (PA12 / Nylon)", description: "Sintered laser-printed nylon powder that allows for completely customized, zero-waste, lightweight geometries." },
      { name: "Kevlar Composite", description: "High-strength aramid fiber matrix offering extreme impact resistance and a distinct woven aesthetic." },
      { name: "Fiberglass Composite", description: "Lightweight woven glass fibers in a resin matrix, offering translucent depth and rugged strength." },
      { name: "Carbon Fiber & Titanium Hybrid", description: "Carbon fiber front chassis paired with ultra-flexible beta-titanium temples." },
      { name: "3D-Printed Nylon & Stainless Steel Hybrid", description: "Additively manufactured PA12 front rims fitted with sleek, snap-in stainless steel temple arms." },
      { name: "Carbon Fiber & Wood Veneer Combo", description: "Advanced engineering where carbon fiber provides the unbreakable inner spine, and a wood veneer provides an organic exterior finish." }
    ]
  }
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Translation & Language Toggle States
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const dict = {
    en: {
      operatorTerminal: "INVENTORY ENTRY",
      highSpeedOptical: "High-Speed Optical Metadata Extraction Portal",
      transitLab: "TRANSIT LAB:",
      jordanLab: "JORDAN LAB (AMM)",
      saudiCourier: "SAUDI COURIER (RUH)",
      streamingActive: "STREAMING ACTIVE",
      stage: "STAGE",
      complete: "COMPLETE",
      simulatedViewfinder: "VIEWFINDER SIMULATED",
      simulatedDesc: "A real camera stream is blocked or unavailable on this machine. Utilizing simulated smart frames context for seamless system evaluation.",
      presets: "EYEGLASS MODEL PRESETS:",
      rotateBarcode: "ROTATE BARCODE",
      operatorProtocolActive: "OPERATOR PROTOCOL ACTIVE",
      snapFramePhoto: "Snap Frame Photo",
      resetStage: "Reset Stage",
      reShootStep: "Re-Shoot Step",
      pipelineDeckImages: "PIPELINE DECK IMAGES",
      autoplayEngine: "AUTOPLAY CLOUDINARY ENGINE",
      cloudinaryMissing: "Cloudinary presets missing or offline. Secure base64 payloads locally fallback armed. Submit still operational.",
      agentPipelineInfo: "AGENT PIPELINE INFORMATION",
      pipelineDesc: "For 100% Vector Search accuracy, ensure photo captures align with sizing stamps. Gemini reads these templates in order (P1 to P5) to match appropriate metadata attributes.",
      mimeTypes: "Mime Types Supported:",
      specificationSchemas: "SPECIFICATIONS",
      opticalMetrics: "Extract the Frame information from the images, Click:",
      runGeminiInspect: "Run Gemini AI Inspect",
      analyzingFrames: "Analyzing Frames...",
      aiInspectionError: "AI Inspection Notice:",
      productIdentification: "1. Product Identification",
      brandNameLabel: "Brand Name / Designer *",
      brandPlaceholder: "e.g. Tom Ford, Gucci",
      modelSkuLabel: "Model Number *",
      modelPlaceholder: "e.g. TF5488, GG0024S",
      inventoryFrameLabel: "Inventory Frame Label",
      restoreDefault: "Restore Default",
      autoNameSequence: "Inventory Entry Sequence",
      opticalMeasurements: "2. Optical Measurements (mm)",
      frontSizeLabel: "Front size (Lens W)",
      frontSizePlaceholder: "e.g. 52",
      bridgeWidthLabel: "Bridge width (DBL)",
      bridgeWidthPlaceholder: "e.g. 18",
      templeLengthLabel: "Temple length",
      templeLengthPlaceholder: "e.g. 145",
      attributesPriceMatrices: "3. Attributes & Price",
      frameMaterialLabel: "Frame Material",
      priceUsdLabel: "Price USD (if on tag)",
      discountPriceLabel: "Discounted Price",
      optionalPlaceholder: "Optional",
      intelligentDescriptions: "4. Frame Description by our Intelligent AI",
      vectorAltTextLabel: "Saved Information",
      altTextPlaceholder: "e.g. Classic gold aviator with a minimalist professional look...",
      agentInstructionLabel: "AI Inspection & Quality Audit Alerts",
      agentInstructionPlaceholder: "Immediate check requested of field operators",
      supabaseOnline: "ACTIVE",
      supabaseOffline: "SANDBOX OFFLINE BUFFER: LocalStorage armed",
      syncingPayload: "Syncing Inventory Payload...",
      uploadingProfiles: "Uploading front/side profiles...",
      completeStartNext: "Complete & Start Next Frame",
      syncingOverlayTitle: "Syncing Inventory Payload",
      syncingOverlayDesc: "Committing optical sequences, price matrix, design attributes, and Cloudinary coordinates to production catalogs...",
      sessionBatchLog: "THIS SESSION",
      trackingRecent: "Recent frame entry",
      scannedThisShift: "scanned this shift",
      noFramesScanned: "No frames scanned or serialized in this current terminal session yet.",
      tableFrameDetail: "Frame Detail",
      tableMeasurements: "Measurements",
      tableMedia: "Media",
      tablePrice: "Price",
      tableStatus: "Status",
      tableAction: "Action",
      deleteButton: "Delete",
      footerCopy: "Inventory Entry Optical digitalization Agent",
      footerPorts: "Jordan Amman Transit Port & Riyadh Central Storage Services active.",
      toastDeleted: "Record deleted from terminal session logs.",
      toastSuccessReset: "Success! Form Reset. Payload uploaded successfully.",
      toastSampleRotated: "Iterated preset frame stamp values",
      loginTitle: "OPERATOR WORKSPACE LOGIN",
      loginSub: "Inventory Entry Secure Verification System",
      emailLabel: "Operator Email Address",
      passwordLabel: "Security Password",
      loginButton: "ACCESS WORKSPACE",
      activeOperator: "OPERATOR:",
      signedInShop: "SHOP:",
      logout: "Log Out",
      step1WorkflowTitle: "1. Frame Optical Capture",
      step1WorkflowSubtitle: "4 angles: Front, Side, Left & Right Temple Stamps",
      step2WorkflowTitle: "2. Frame Specifications",
      step2WorkflowSubtitle: "AI Extraction, Dimensions, Material, Price & Save",
      proceedToSpecsBtn: "Proceed to Specifications (Step 2) →",
      proceedWithCurrentBtn: "Continue to Step 2 with Current Photos →",
      backToCaptureBtn: "← Back to Frame Capture",
      allPhotosCapturedBanner: "All 4 optical photos captured! Ready to inspect stamps and enter specifications.",
      opticalReferenceBarTitle: "Captured Optical Reference (Click to zoom stamps):",
      skipToSpecsBtn: "Manual Entry (Skip to Step 2) →"
    },
    ar: {
      operatorTerminal: "إدخال المخزون - INVENTORY ENTRY",
      highSpeedOptical: "بوابة استخراج البيانات الوصفية البصرية عالية السرعة",
      transitLab: "موقع العبور:",
      jordanLab: "مختبر الأردن (AMM)",
      saudiCourier: "البريد السعودي (RUH)",
      streamingActive: "البث المباشر نشط",
      stage: "الخطوة",
      complete: "مكتمل",
      simulatedViewfinder: "منفذ العرض محاكى",
      simulatedDesc: "كاميرا الفيديو الحقيقية غير متوفرة حالياً. يتم استخدام قوالب الإطارات الذكية وتعديل القيم بسلاسة محاكاةً للنظام الواقعي.",
      presets: "نماذج إطارات جاهزة:",
      rotateBarcode: "تدوير الرمز الشريطي",
      operatorProtocolActive: "بروتوكول التشغيل نشط",
      snapFramePhoto: "التقاط صورة الإطار",
      resetStage: "إعادة تعيين كافة الخطوات",
      reShootStep: "إعادة تصوير الخطوة",
      pipelineDeckImages: "صور لوحة المعالجة",
      autoplayEngine: "محرك رفع كلاوديناري تلقائي",
      cloudinaryMissing: "كلاوديناري غير متصل حالياً. تم تشغيل الرفع المحلي الاحتياطي base64 بنجاح.",
      agentPipelineInfo: "معلومات خط المعالجة للوكلاء",
      pipelineDesc: "لكي تحقق المزامنة ونتائج البحث دقة 100٪، يرجى التأكد من محاذاة اللقطات للرموز الداخلية. يقرأ Gemini هذه النماذج بالترتيب من P1 إلى P5 لاستخراج السمات.",
      mimeTypes: "تنسيقات الصور المدعومة:",
      specificationSchemas: "المواصفات",
      opticalMetrics: "استخرج معلومات الإطار من الصور، اضغط:",
      runGeminiInspect: "تشغيل فحص الذكاء الاصطناعي (Gemini)",
      analyzingFrames: "جاري تحليل الإطارات...",
      aiInspectionError: "تنبيه فحص الذكاء الاصطناعي:",
      productIdentification: "١. تحديد تفاصيل المنتج",
      brandNameLabel: "اسم العلامة التجارية / المصمم *",
      brandPlaceholder: "مثال: Tom Ford, Gucci",
      modelSkuLabel: "رقم الموديل *",
      modelPlaceholder: "مثال: TF5488, GG0024S",
      inventoryFrameLabel: "تسمية إطار المخزون",
      restoreDefault: "استعادة الافتراضي",
      autoNameSequence: "توليد تلقائي للاسم",
      opticalMeasurements: "٢. القياسات البصرية (بالمليمتر)",
      frontSizeLabel: "حجم العدسة الأمامية (Lens W)",
      frontSizePlaceholder: "مثال: 52",
      bridgeWidthLabel: "عرض جسر الأنف (DBL)",
      bridgeWidthPlaceholder: "مثال: 18",
      templeLengthLabel: "طول ذراع النظارة (Temple)",
      templeLengthPlaceholder: "مثال: 145",
      attributesPriceMatrices: "٣. سمات الإطار والأسعار",
      frameMaterialLabel: "مادة الإطار",
      priceUsdLabel: "السعر الأصلي بالدولار ($)",
      discountPriceLabel: "السعر بعد الخصم ($)",
      optionalPlaceholder: "اختياري",
      intelligentDescriptions: "٤. وصف الإطار بالذكاء الاصطناعي الذكي",
      vectorAltTextLabel: "المعلومات المحفوظة",
      altTextPlaceholder: "مثال: نظارة طيار ذهبية كلاسيكية بمظهر مهني متميز وبسيط...",
      agentInstructionLabel: "تنبيهات حالة النظارة بعد الفحص والتدقيق من الذكاء الاصطناعي",
      agentInstructionPlaceholder: "مراجعة عاجلة يطلبها المشغل من المندوب الميداني",
      supabaseOnline: "نشط",
      supabaseOffline: "وضع العمل المحلي غير المتصل: الاحتفاظ بالبيانات محلياً",
      syncingPayload: "جاري مزامنة بيانات المخزون الحالية...",
      uploadingProfiles: "جاري رفع اللقطات الأمامية والجانبية...",
      completeStartNext: "اعتماد وحفظ والبدء بالإطار التالي",
      syncingOverlayTitle: "جاري الحفظ والمزامنة المباشرة",
      syncingOverlayDesc: "يتم الآن ترحيل القياسات والأبعاد والأسعار وتعليمات الفحص والروابط السحابية إلى الكتالوج الرئيسي بنجاح وبسرعة...",
      sessionBatchLog: "هذه الجلسة",
      trackingRecent: "الإدخالات الأخيرة للإطارات",
      scannedThisShift: "إطارات مسحت بوردية العمل",
      noFramesScanned: "لم يتم حفظ أو مزامنة أي إطارات في جلسة العمل الحالية بعد.",
      tableFrameDetail: "تفاصيل الإطار",
      tableMeasurements: "القياسات والأبعاد",
      tableMedia: "اللقطات والوسائط",
      tablePrice: "السعر",
      tableStatus: "الحالة",
      tableAction: "الإجراء",
      deleteButton: "حذف",
      footerCopy: "Envision Eyewear Corp. Optical digitalization Agent",
      footerPorts: "ميناء الأردن عمّان الترانزيت ومركز الرياض للخدمات اللوجستية مفعّلة حالياً.",
      toastDeleted: "تم حذف السجل من سجلات الذاكرة المؤقتة للوردية الحالية.",
      toastSuccessReset: "تم النجاح! تم تصفير النموذج ورفع البيانات بنجاح.",
      toastSampleRotated: "تم تحديث باركود الإطار والترميز المحاكى بنجاح",
      loginTitle: "تسجيل دخول مشغل النظام",
      loginSub: "نظام إدخال المخزون والتحقق الآمن - Inventory Entry",
      emailLabel: "البريد الإلكتروني للمشغل",
      passwordLabel: "كلمة مرور الأمان الخاص بالموقع",
      loginButton: "تسجيل الدخول إلى النظام",
      activeOperator: "المشغل:",
      signedInShop: "المتجر:",
      logout: "تسجيل الخروج",
      step1WorkflowTitle: "١. التقاط صور الإطار",
      step1WorkflowSubtitle: "٤ زوايا: الواجهة، الجانب، والختم الداخلي للذراعين",
      step2WorkflowTitle: "٢. إدخال مواصفات الإطار",
      step2WorkflowSubtitle: "فحص الذكاء الاصطناعي، الأبعاد، الخامة، السعر والمخزون",
      proceedToSpecsBtn: "الانتقال إلى إدخال المواصفات (الخطوة ٢) ←",
      proceedWithCurrentBtn: "المتابعة إلى الخطوة ٢ بالصور الحالية ←",
      backToCaptureBtn: "→ العودة لالتقاط صور الإطار",
      allPhotosCapturedBanner: "تم التقاط جميع الصور الـ 4 بنجاح! جاهز لفحص الأختام وتعبئة المواصفات.",
      opticalReferenceBarTitle: "الصور المرجعية الملتقطة (انقر للتكبير وفحص أختام الذراع):",
      skipToSpecsBtn: "إدخال يدوي (تخطي إلى الخطوة ٢) ←"
    }
  };

  const t = (key: keyof typeof dict.en) => {
    return dict[language][key] || dict.en[key];
  };

  const localizedSteps = language === "ar" ? [
    { idx: 1, label: "التقاط الزاوية الأمامية للإطار (يتم حفظها بقاعدة البيانات)", indicator: "الواجهة الأمامية" },
    { idx: 2, label: "التقاط الملف الجانبي للإطار (يتم حفظها بقاعدة البيانات)", indicator: "الجانب الأيمن/الأيسر" },
    { idx: 3, label: "عرض الختم الداخلي للذراع الأيسر (مؤقت - لتعبئة النموذج)", indicator: "الذراع الأيسر" },
    { idx: 4, label: "عرض الختم الداخلي للذراع الأيمن (مؤقت - لتعبئة النموذج)", indicator: "الذراع الأيمن" }
  ] : [
    { idx: 1, label: "CAPTURE FRAME FRONT ANGLE (Saves to Database)", indicator: "Front View" },
    { idx: 2, label: "CAPTURE FRAME SIDE PROFILE (Saves to Database)", indicator: "Side Profile" },
    { idx: 3, label: "VIEWING INNER LEFT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Left Temple" },
    { idx: 4, label: "VIEWING INNER RIGHT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Right Temple" }
  ];

  // Navigation & General Portal States
  // Two-step workflow state: 1 = Frame Capture, 2 = Frame Specifications Entry
  const [workflowStep, setWorkflowStep] = useState<1 | 2>(1);
  
  // Camera & viewfinders
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 to 3 mapping (Step 1/4 to 4/4)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(
    CAPTURE_STEPS.map((step) => ({
      stepIdx: step.idx,
      label: step.indicator,
      blobUrl: null,
      cloudinaryUrl: null,
      uploadStatus: "idle"
    }))
  );
  
  // Simulation Fallback & File Upload States
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const [simulatedSampleIdx, setSimulatedSampleIdx] = useState(0);
  const [captureMode, setCaptureMode] = useState<"camera" | "upload" | "simulation">("camera");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [targetUploadStepIdx, setTargetUploadStepIdx] = useState<number | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stepFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Controls
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [frameName, setFrameName] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [frameMaterial, setFrameMaterial] = useState("Pure Cellulose Acetate");
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const materialDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        materialDropdownRef.current &&
        !materialDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMaterialDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [frontSize, setFrontSize] = useState("");
  const [bridgeSize, setBridgeSize] = useState("");
  const [templeLength, setTempleLength] = useState("");
  const [altText, setAltText] = useState("");
  const [agentInstruction, setAgentInstruction] = useState("");

  // Explicit states to prevent rapid-fire capture overwriting
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [sideImageUrl, setSideImageUrl] = useState<string | null>(null);

  // Highlight fields returned from AI
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Processing Diagnostics
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [isExtractingWithAI, setIsExtractingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  
  // Custom toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "error">("success");

  // Local shift history logs
  const [historyItems, setHistoryItems] = useState<SavedRecord[]>([]);

  // Authenticated Operator Session & Coordinator States
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shopId, setShopId] = useState<string | number | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [availableShops, setAvailableShops] = useState<any[]>([]);
  const isFetchingShopRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isExplicitLogoutRef = useRef(false);
  const [inventoryDebugBox, setInventoryDebugBox] = useState<{
    isSupabaseConfigured: boolean;
    resolvedShopId: any;
    isUuid: boolean;
    userId: string | null;
    error?: {
      message: string | null;
      code: string | null;
      details: string | null;
      hint: string | null;
    } | null;
  } | null>(null);

  // Shop database inventory logs
  const [shopInventory, setShopInventory] = useState<any[]>([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLoadingShopInventory, setIsLoadingShopInventory] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(10);



  // Filtered shop catalog inventory tracking inventorySearchQuery
  const filteredInventory = useMemo(() => {
    if (!inventorySearchQuery.trim()) return shopInventory;
    const query = inventorySearchQuery.toLowerCase();
    return shopInventory.filter((item) => {
      return (
        item.brand?.toLowerCase().includes(query) ||
        item.model_name?.toLowerCase().includes(query) ||
        item.frame_name?.toLowerCase().includes(query) ||
        String(item.id)?.toLowerCase().includes(query) ||
        item.material?.toLowerCase().includes(query) ||
        item.color_code?.toLowerCase().includes(query)
      );
    });
  }, [shopInventory, inventorySearchQuery]);


  // Video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const uploadSessionRef = useRef<number>(1);
  const uploadedUrlsRef = useRef<(string | null)[]>([null, null]);

  // Synchronize helper: Update Brand & update corresponding frameName manually
  const updateBrandAndName = (newBrand: string) => {
    setBrand(newBrand);
    setFrameName(modelName ? `${newBrand} ${modelName}`.trim() : newBrand);
  };

  // Synchronize helper: Update Model & update corresponding frameName manually
  const updateModelAndName = (newModel: string) => {
    setModelName(newModel);
    setFrameName(brand ? `${brand} ${newModel}`.trim() : newModel);
  };

  // Delete a scanned item from the local batch log
  const deleteHistoryItem = (id: string) => {
    const updated = historyItems.filter((item) => item.id !== id);
    setHistoryItems(updated);
    localStorage.setItem("envision_batch_scans", JSON.stringify(updated));
    showToast("Record deleted from terminal session logs.", "info");
  };

  // Fetch active Shop records from Supabase Database (or load from localStorage backup)
  const fetchShopInventory = async (targetShopId?: any) => {
    // If targetShopId is passed but is an event or other non-primitive, ignore it
    const cleanPassedId = (typeof targetShopId === 'string' || typeof targetShopId === 'number') 
      ? targetShopId 
      : null;

    const shopIdToQuery = cleanPassedId || shopId;
    if (!shopIdToQuery) {
      return; // Force immediate exit if the shop ID is not completely ready
    }

    setIsLoadingShopInventory(true);
    try {
      if (isSupabaseConfigured && isUuid(shopIdToQuery)) {
        const { data, error } = await supabase
          .from("inventory")
          .select(`
            id,
            created_at,
            frame_name,
            brand,
            model_name,
            price,
            discounted_price,
            material,
            front_size,
            bridge_size,
            temple_length,
            inventory_media!inventory_media_inventory_id_fkey(id,media_url,media_type,is_primary)
          `)
          .eq("shop_id", shopIdToQuery)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching Supabase inventory:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          loadLocalShopInventory();
        } else if (data) {
          const formatted = data.map((item: any) => {
            const mediaList = item["inventory_media!inventory_media_inventory_id_fkey"] || item.inventory_media || [];
            let previewUrl = null;
            if (mediaList.length > 0) {
              const primary = mediaList.find((m: any) => m.is_primary === true);
              if (primary) {
                previewUrl = primary.media_url;
              } else {
                const sorted = [...mediaList].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                previewUrl = sorted[0]?.media_url || null;
              }
            }
            return {
              id: item.id,
              brand: item.brand || "Unknown Brand",
              model_name: item.model_name || "Unknown Model",
              frame_name: item.frame_name || `${item.brand} ${item.model_name}`,
              front_size: item.front_size || 0,
              bridge_size: item.bridge_size || 0,
              temple_length: item.temple_length || 0,
              price: item.price || 0,
              material: item.material || "Acetate",
              preview_url: previewUrl,
              created_at: item.created_at,
              color_code: item.color_code || `C-${Math.floor(Math.random() * 800) + 100}`,
              stock: item.stock !== undefined ? item.stock : 12
            };
          });
          
          formatted.sort((a, b) => {
            if (typeof a.id === 'number' && typeof b.id === 'number') {
              return b.id - a.id;
            }
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          setShopInventory(formatted);
          localStorage.setItem("envision_shop_inventory", JSON.stringify(formatted));
        }
      } else {
        loadLocalShopInventory();
      }
    } catch (err: any) {
      console.error("Supabase load exception:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      loadLocalShopInventory();
    } finally {
      setIsLoadingShopInventory(false);
    }
  };

  const loadLocalShopInventory = () => {
    const rawLocale = localStorage.getItem("envision_shop_inventory");
    if (rawLocale) {
      try {
        const parsed = JSON.parse(rawLocale);
        const mapped = parsed.map((item: any, idx: number) => ({
          ...item,
          color_code: item.color_code || `C-0${(idx % 9) + 1}`,
          stock: item.stock !== undefined ? item.stock : 12
        }));
        setShopInventory(mapped);
      } catch (e) {
        setShopInventory([]);
      }
    } else {
      const mapped = STATIC_INITIAL_SAMPLES.map((item: any, idx) => ({
        ...item,
        color_code: item.color_code || `C-0${idx + 1}`,
        stock: 12
      }));
      setShopInventory(mapped);
      localStorage.setItem("envision_shop_inventory", JSON.stringify(mapped));
    }
  };

  // Delete Frame from the Shop Database
  const deleteShopItem = async (id: string | number) => {
    try {
      if (isSupabaseConfigured && !String(id).startsWith("local-sample-") && !String(id).startsWith("tmp-")) {
        const dbId = typeof id === "string" && /^\d+$/.test(id) ? parseInt(id, 10) : id;
        
        // First delete from inventory_media
        const { error: mediaErr } = await supabase
          .from("inventory_media")
          .delete()
          .eq("inventory_id", dbId);
        
        if (mediaErr) {
          console.warn("Could not delete child media columns:", {
            message: mediaErr.message,
            code: mediaErr.code,
            details: mediaErr.details,
            hint: mediaErr.hint
          });
        }

        // Then delete from main inventory table
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", dbId);
        
        if (error) throw error;
      }
      
      const updated = shopInventory.filter((item) => item.id !== id);
      setShopInventory(updated);
      localStorage.setItem("envision_shop_inventory", JSON.stringify(updated));
      
      showToast(
        language === "ar" 
          ? "تم حذف النظارة من قاعدة البيانات بنجاح." 
          : "Frame deleted from shop database successfully.", 
        "success"
      );
    } catch (err: any) {
      console.error("Failed to delete shop item:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      showToast(
        language === "ar"
          ? `عذرًا، فشل حذف النظارة: ${err.message || ""}`
          : `Failed to delete frame: ${err.message || ""}`,
        "error"
      );
    }
  };

  // Touch-friendly increment/decrement adjustment for active inventory items
  const updateStock = (id: string | number, amount: number) => {
    const updated = shopInventory.map((item) => {
      if (item.id === id) {
        const currentStock = typeof item.stock === "number" ? item.stock : 12;
        const newStock = Math.max(0, currentStock + amount);
        return { ...item, stock: newStock };
      }
      return item;
    });
    setShopInventory(updated);
    localStorage.setItem("envision_shop_inventory", JSON.stringify(updated));
  };

  // Parser to extract public ID from Cloudinary upload URL
  const getCloudinaryPublicId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      
      const uploadParts = parts[1].split('/');
      let startIndex = 0;
      for (let i = 0; i < uploadParts.length; i++) {
        const segment = uploadParts[i];
        if (segment.startsWith('v') && /^\d+$/.test(segment.slice(1))) {
          startIndex = i + 1;
          break;
        }
        if (segment.includes(',') || (segment.includes('_') && !segment.includes(' ') && segment.length < 30)) {
          startIndex = i + 1;
        }
      }
      
      const publicIdWithExt = uploadParts.slice(startIndex).join('/');
      const lastDotIndex = publicIdWithExt.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        return publicIdWithExt.substring(0, lastDotIndex);
      }
      return publicIdWithExt;
    } catch (err) {
      console.error("Error parsing Cloudinary public ID:", err);
      return null;
    }
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const stopCameraStream = () => {
    // 1. Stop track from state
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    // 2. Stop track from ref to handle stale closures during unmount
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    // 3. Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initCameraStream = async () => {
    setCameraError(null);
    stopCameraStream();

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Camera mediaDevices API is unavailable in this environment.");
      setCameraError(
        language === "ar"
          ? "واجهة الكاميرا غير متوفرة في بيئة التصفح الحالية. يمكنك رفع ملفات الصور مباشرة أو استخدام المحاكاة."
          : "Camera API not supported in this browser context. You can upload photo files directly or use simulation mode."
      );
      setIsSimulatingCamera(true);
      setCaptureMode("upload");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          advanced: [
            { focusMode: "macro" },
            { focusMode: "continuous" }
          ] as any
        }
      });
      setCameraStream(stream);
      cameraStreamRef.current = stream;
      setIsSimulatingCamera(false);
      setCaptureMode("camera");
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Proactively request macro/continuous focus on the video track if supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track as any).getCapabilities?.() || {};
          const constraintsToApply: any = {};
          if (capabilities.focusMode) {
            if (capabilities.focusMode.includes("macro")) {
              constraintsToApply.focusMode = "macro";
            } else if (capabilities.focusMode.includes("continuous")) {
              constraintsToApply.focusMode = "continuous";
            }
          }
          if (Object.keys(constraintsToApply).length > 0) {
            await track.applyConstraints(constraintsToApply);
            console.log("Operational focus constraints applied:", constraintsToApply);
          }
        } catch (capErr) {
          console.warn("Unable to apply macro-focus constraints directly on the active track:", capErr);
        }
      }
    } catch (err: any) {
      console.warn("Environmental Rear lens not available or denied. Falling back to default user lens.", err?.name || err);
      try {
        // Fallback to average camera if environment unavailable
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setCameraStream(stream);
        cameraStreamRef.current = stream;
        setIsSimulatingCamera(false);
        setCaptureMode("camera");
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            const capabilities = (track as any).getCapabilities?.() || {};
            const constraintsToApply: any = {};
            if (capabilities.focusMode) {
              if (capabilities.focusMode.includes("macro")) {
                constraintsToApply.focusMode = "macro";
              } else if (capabilities.focusMode.includes("continuous")) {
                constraintsToApply.focusMode = "continuous";
              }
            }
            if (Object.keys(constraintsToApply).length > 0) {
              await track.applyConstraints(constraintsToApply);
            }
          } catch (capErr) {
            console.warn("Unable to apply fallback focus constraints directly on the active track:", capErr);
          }
        }
      } catch (fallbackErr: any) {
        const isPermissionDenied = fallbackErr?.name === "NotAllowedError" || fallbackErr?.name === "PermissionDeniedError" || fallbackErr?.name === "SecurityError";
        console.warn("Camera access unavailable/denied:", fallbackErr?.name, fallbackErr?.message);
        
        setCameraError(
          isPermissionDenied
            ? (language === "ar" 
                ? "تم حظر إذن الوصول إلى الكاميرا من قِبل المتصفح. يمكنك منح الإذن من شريط العنوان، أو رفع صور الإطارات مباشرة، أو استخدام المحاكاة."
                : "Camera access permission was denied. You can enable camera in your browser settings, upload frame photos directly, or use simulation mode.")
            : (language === "ar"
                ? "الكاميرا غير متوفرة أو قيد الاستخدام بواسطة تطبيق آخر. يمكنك رفع الصور أو استخدام المحاكاة."
                : "Camera blocked or unavailable. You can upload photo files directly or use simulated frames.")
        );
        setIsSimulatingCamera(true);
        setCaptureMode("upload");
      }
    }
  };

  // Switch active shop operator view (admin only)
  const handleSwitchShop = (targetId: string) => {
    const chosen = availableShops.find((s) => String(s.id) === String(targetId));
    if (chosen && isUuid(chosen.id)) {
      setShopId(chosen.id);
      setShopName(chosen.shop_name);
      try {
        localStorage.setItem("envision_active_shop_id", String(chosen.id));
      } catch {}
      showToast(
        language === "ar"
          ? `تم التبديل إلى: ${chosen.shop_name}`
          : `Switched to: ${chosen.shop_name}`,
        "info"
      );
      fetchShopInventory(chosen.id);
    }
  };

  // Fetch Shop Coordinates associated with active session user ID or owner email
  const fetchShopCoordinates = async (uSession: any) => {
    if (!isSupabaseConfigured || !uSession?.user) return;

    const userEmail = (uSession.user.email || "").trim();
    const userId = uSession.user.id;

    // Guard so this runs once per login (no repeated calls on every re-render, and use a ref or an in-flight flag)
    if (isFetchingShopRef.current) return;
    if (lastFetchedUserIdRef.current === userId && shopId) return;

    isFetchingShopRef.current = true;

    try {
      // 1. Read ONLY the logged-in user's own row
      const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("shop_id, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (meErr) {
        console.error("Step 1 - Error fetching user profile:", {
          message: meErr.message,
          code: meErr.code,
          details: meErr.details,
          hint: meErr.hint
        });
      } else if (!me) {
        console.log("Step 1 - No user profile row found for id:", userId);
      } else {
        if (me?.full_name) {
          setStaffName(me.full_name);
        }
        if (isUuid(me?.shop_id)) {
          let resolvedShopName = language === "ar" ? "صالة عرض إنفيجن" : "Envision Showroom";
          try {
            const { data: shop, error: shopErr } = await supabase
              .from("shops")
              .select("id, shop_name")
              .eq("id", me.shop_id)
              .maybeSingle();

            if (shopErr) {
              console.error("Step 1 - Error fetching shop by profile shop_id:", {
                message: shopErr.message,
                code: shopErr.code,
                details: shopErr.details,
                hint: shopErr.hint
              });
            } else if (!shop) {
              console.log("Step 1 - No shop row found for profile shop_id:", me.shop_id);
            } else if (shop?.shop_name) {
              resolvedShopName = shop.shop_name;
            }
          } catch {}

          const resolvedShopId = me.shop_id;
          console.log("Step 1 - Resolved shop id =", resolvedShopId, typeof resolvedShopId);
          lastFetchedUserIdRef.current = userId;
          setShopId(resolvedShopId);
          setShopName(resolvedShopName);
          setAvailableShops([{ id: resolvedShopId, shop_name: resolvedShopName }]);
          try {
            localStorage.setItem("envision_active_shop_id", String(resolvedShopId));
          } catch {}
          showToast(
            language === "ar"
              ? `تم ربط المشغل بنجاح مع: ${resolvedShopName}`
              : `Operator successfully linked to: ${resolvedShopName}`,
            "success"
          );
          fetchShopInventory(resolvedShopId);
          return;
        }
      }

      // 2. Fallback for shop owners: shops where auth_user_id = userId, then shops where owner_email = the logged-in email
      let ownerShop: { id: string; shop_name: string } | null = null;

      if (userId) {
        const { data: shopByAuthUser, error: authUserShopErr } = await supabase
          .from("shops")
          .select("id, shop_name")
          .eq("auth_user_id", userId)
          .maybeSingle();

        if (authUserShopErr) {
          console.error("Step 2 - Error fetching shop by auth_user_id:", {
            message: authUserShopErr.message,
            code: authUserShopErr.code,
            details: authUserShopErr.details,
            hint: authUserShopErr.hint
          });
        } else if (!shopByAuthUser) {
          console.log("Step 2 - No shop row found for auth_user_id:", userId);
        } else if (shopByAuthUser && isUuid(shopByAuthUser.id)) {
          ownerShop = shopByAuthUser;
        }
      }

      if (!ownerShop && userEmail) {
        const { data: shopByEmail, error: emailShopErr } = await supabase
          .from("shops")
          .select("id, shop_name")
          .eq("owner_email", userEmail)
          .maybeSingle();

        if (emailShopErr) {
          console.error("Step 2 - Error fetching shop by owner_email:", {
            message: emailShopErr.message,
            code: emailShopErr.code,
            details: emailShopErr.details,
            hint: emailShopErr.hint
          });
        } else if (!shopByEmail) {
          console.log("Step 2 - No shop row found for owner_email:", userEmail);
        } else if (shopByEmail && isUuid(shopByEmail.id)) {
          ownerShop = shopByEmail;
        }
      }

      if (ownerShop && isUuid(ownerShop.id)) {
        console.log("Step 2 - Resolved shop id =", ownerShop.id, typeof ownerShop.id);
        lastFetchedUserIdRef.current = userId;
        setShopId(ownerShop.id);
        setShopName(ownerShop.shop_name);
        setAvailableShops([ownerShop]);
        try {
          localStorage.setItem("envision_active_shop_id", String(ownerShop.id));
        } catch {}

        // Ensure owner profile and shop records have shop_id / auth_user_id linked for RLS
        if (userId) {
          try {
            await supabase.from("profiles").update({ shop_id: ownerShop.id }).eq("id", userId);
          } catch {}
          try {
            await supabase.from("shops").update({ auth_user_id: userId }).eq("id", ownerShop.id).is("auth_user_id", null);
          } catch {}
        }

        showToast(
          language === "ar"
            ? `تم ربط المشغل بنجاح مع: ${ownerShop.shop_name}`
            : `Operator successfully linked to: ${ownerShop.shop_name}`,
          "success"
        );
        fetchShopInventory(ownerShop.id);
        return;
      }

      // 3. Only if all fail, show the existing "account isn't linked to a shop" message
      console.log("Shop resolution failed - no linked shop found for operator.");
      lastFetchedUserIdRef.current = null;
      setShopId(null);
      setShopName(null);
      setAvailableShops([]);
      try {
        localStorage.removeItem("envision_active_shop_id");
      } catch {}
      showToast(
        language === "ar"
          ? "حسابك غير مرتبط بصالة عرض. يرجى مراجعة مسؤول النظام."
          : "Your account isn't linked to a shop. Contact your administrator.",
        "error"
      );
    } catch (err: any) {
      console.error("Exception during fetchShopCoordinates:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      lastFetchedUserIdRef.current = null;
      setShopId(null);
      setShopName(null);
      setAvailableShops([]);
      showToast(
        language === "ar"
          ? "حسابك غير مرتبط بصالة عرض. يرجى مراجعة مسؤول النظام."
          : "Your account isn't linked to a shop. Contact your administrator.",
        "error"
      );
    } finally {
      isFetchingShopRef.current = false;
    }
  };

  // Perform Email/Password authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError(language === "ar" ? "يرجى إدخال البريد الإلكتروني وكلمة المرور." : "Please enter both email and password.");
      return;
    }
    
    setIsLoggingIn(true);
    setAuthError(null);
    isExplicitLogoutRef.current = false;

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim()
        });

        if (error) {
          setAuthError(
            language === "ar"
              ? "بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور."
              : "Invalid credentials. Please verify your email and password."
          );
          showToast(
            language === "ar"
              ? "تعذر تسجيل الدخول. يرجى التحقق من البيانات."
              : "Login failed. Please check your credentials.",
            "error"
          );
        } else if (data && data.session) {
          setSession(data.session);
          showToast(language === "ar" ? "تم تسجيل الدخول بنجاح!" : "Access Granted! Welcome to workspace.", "success");
          setTimeout(() => {
            fetchShopCoordinates(data.session);
          }, 0);
        }
      } else {
        // Mock fallback login for sandbox preview offline evaluation
        const mockSess = {
          user: {
            id: "sandbox-operator-id",
            email: authEmail.trim()
          }
        };
        const mockShopId = 12;
        const mockShopName = language === "ar" ? "مختبر الأردن الفخيم - AMM" : "Jordanian Transit Lab - AMM";
        const mockStaffName = language === "ar" ? "د. أحمد (أخصائي بصريات)" : "Dr. Ahmad (Optometrist)";

        setSession(mockSess);
        setShopId(mockShopId);
        setShopName(mockShopName);
        setStaffName(mockStaffName);
        
        localStorage.setItem("envision_mock_session", JSON.stringify({
          session: mockSess,
          shopId: mockShopId,
          shopName: mockShopName,
          staffName: mockStaffName
        }));

        showToast(language === "ar" ? "وردية عمل تجريبية نشطة!" : "Sandbox test session initiated successfully!", "success");
        fetchShopInventory(mockShopId);
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      setAuthError(language === "ar" ? "حدث خطأ أثناء تسجيل الدخول." : "An error occurred during authentication.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Perform operational workspace logout
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    isExplicitLogoutRef.current = true;

    // 1. Immediately stop any active camera stream
    try {
      stopCameraStream();
    } catch (e) {
      console.warn("Failed to stop camera stream during logout:", e);
    }

    // 2. Synchronously wipe all reactive operational states so UI immediately switches to the login gate
    lastFetchedUserIdRef.current = null;
    isFetchingShopRef.current = false;
    setSession(null);
    setShopId(null);
    setShopName(null);
    setStaffName(null);
    setAvailableShops([]);
    setAuthEmail("");
    setAuthPassword("");
    setAuthError(null);

    // 3. Purge all tokens and cached credentials from localStorage and sessionStorage
    try {
      localStorage.removeItem("envision_mock_session");
      localStorage.removeItem("envision_active_shop_id");
      // Remove all Supabase auth storage keys (e.g. sb-*-auth-token) to guarantee session termination
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase") || key.includes("auth-token"))) {
          localStorage.removeItem(key);
        }
      }
    } catch (storageErr) {
      console.warn("Failed to clear local auth storage during logout:", storageErr);
    }
    try {
      sessionStorage.clear();
    } catch {}

    // 4. Safely trigger Supabase client signout with a non-blocking timeout
    if (isSupabaseConfigured) {
      try {
        await Promise.race([
          (async () => {
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch {}
            try {
              await supabase.auth.signOut({ scope: "global" });
            } catch {}
          })(),
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);
      } catch (apiErr) {
        console.warn("Supabase auth.signOut() API error (bypassing to clear local states):", apiErr);
      }
    }

    setIsLoggingOut(false);
    showToast(
      language === "ar"
        ? "تم تسجيل الخروج بنجاح."
        : "Logged out successfully from operational workspace.",
      "info"
    );
  };

  // 1. Initial configuration mount checker & local cache reloader
  useEffect(() => {
    const localSaved = localStorage.getItem("envision_batch_scans");
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        setTimeout(() => {
          setHistoryItems(parsed);
        }, 0);
      } catch (err) {
        console.error("Failed to parse local history logs", err);
      }
    }

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (initialSession && !isExplicitLogoutRef.current) {
            setSession(initialSession);
            await fetchShopCoordinates(initialSession);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (isExplicitLogoutRef.current) {
              setSession(null);
              setShopId(null);
              setShopName(null);
              return;
            }
            setSession(currentSession);
            if (currentSession) {
              setTimeout(() => {
                fetchShopCoordinates(currentSession);
              }, 0);
            } else {
              setShopId(null);
              setShopName(null);
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Fallback static mock recovery for client review
          const mockSess = localStorage.getItem("envision_mock_session");
          if (mockSess) {
            try {
              const parsed = JSON.parse(mockSess);
              setSession(parsed.session);
              setShopId(parsed.shopId);
              setShopName(parsed.shopName);
              if (parsed.staffName) {
                setStaffName(parsed.staffName);
              }
              fetchShopInventory(parsed.shopId);
            } catch (err) {
              console.error("Failed to parse local mock session storage", err);
            }
          }
        }
      } catch (err) {
        console.error("Operator Auth verification failed on startup:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Reactive side-effects listening to changes on the operator session
  useEffect(() => {
    if (session) {
      const startTimer = setTimeout(() => {
        initCameraStream();
      }, 60);

      const dbTimer = setTimeout(() => {
        fetchShopInventory();
      }, 100);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(dbTimer);
        setTimeout(() => {
          stopCameraStream();
        }, 0);
      };
    } else {
      setTimeout(() => {
        stopCameraStream();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, shopId]);

  // File Upload Handler for manual selection or drag-and-drop
  const handleImageFileUpload = async (file: File, explicitStepIdx?: number) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast(language === "ar" ? "يرجى اختيار ملف صورة صالح (JPEG, PNG, WEBP)." : "Please select a valid image file (JPEG, PNG, WEBP).", "error");
      return;
    }

    const stepIdx = explicitStepIdx !== undefined ? explicitStepIdx : (currentStepIndex < 4 ? currentStepIndex : 0);
    const tempBlobUrl = URL.createObjectURL(file);

    // Immediately update local snapshot preview
    setSnapshots((prev) => {
      const next = [...prev];
      next[stepIdx] = {
        ...next[stepIdx],
        blobUrl: tempBlobUrl,
        cloudinaryUrl: null,
        uploadStatus: stepIdx < 2 ? "uploading" : "success"
      };
      return next;
    });

    // Provide base64 data URL for steps 2 and 3 so Gemini AI inspect can read inner temple stamps
    if (stepIdx >= 2) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setSnapshots((prev) => {
          const next = [...prev];
          if (next[stepIdx]) {
            next[stepIdx] = {
              ...next[stepIdx],
              cloudinaryUrl: b64,
              uploadStatus: "success"
            };
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    }

    if (explicitStepIdx === undefined && currentStepIndex < 3) {
      setCurrentStepIndex(stepIdx + 1);
    } else if (explicitStepIdx === undefined && currentStepIndex === 3) {
      setCurrentStepIndex(4);
    }

    showToast(
      language === "ar" 
        ? `تم تحميل صورة الخطوة ${stepIdx + 1} (${CAPTURE_STEPS[stepIdx].indicator}) بنجاح.` 
        : `Uploaded Step ${stepIdx + 1} (${CAPTURE_STEPS[stepIdx].indicator}) photo.`, 
      "success"
    );

    // Cloudinary pipeline upload for Steps 1 & 2
    if (stepIdx < 2) {
      uploadAssetToCloudinary(file, stepIdx, uploadSessionRef.current);
    }
  };

  // Snaps visual frame and saves to status array
  const snapPhoto = async () => {
    if (currentStepIndex >= 4) {
      showToast("All 4 photos captured. Reset or submit frame.", "info");
      return;
    }

    try {
      let imageBlob: Blob | null = null;
      let tempBlobUrl = "";

      if (isSimulatingCamera) {
        // High-fidelity luxury frame simulation with realistic optical stamps
        const sample = STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length];
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Background canvas
          ctx.fillStyle = "#18181b";
          ctx.fillRect(0, 0, 640, 480);
          
          // Outer subtle frame container
          ctx.strokeStyle = "#3f3f46";
          ctx.lineWidth = 2;
          ctx.strokeRect(20, 20, 600, 440);

          // Draw metallic/acetate golden eyewear graphic
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(210, 220, 75, 0, Math.PI * 2);
          ctx.arc(430, 220, 75, 0, Math.PI * 2);
          ctx.stroke();

          // Bridge bar
          ctx.beginPath();
          ctx.moveTo(285, 210);
          ctx.lineTo(355, 210);
          ctx.stroke();

          // Temple arms
          ctx.beginPath();
          ctx.moveTo(135, 215);
          ctx.lineTo(60, 200);
          ctx.moveTo(505, 215);
          ctx.lineTo(580, 200);
          ctx.stroke();

          // Brand and Step Header
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px monospace";
          ctx.fillText(`BRAND: ${sample.brand.toUpperCase()}`, 40, 65);
          
          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 16px monospace";
          ctx.fillText(`MODEL: ${sample.model_name} | ${sample.material}`, 40, 95);

          ctx.fillStyle = "#a1a1aa";
          ctx.font = "14px monospace";
          ctx.fillText(`ANGLE: ${CAPTURE_STEPS[currentStepIndex].indicator.toUpperCase()}`, 40, 120);
          
          // Sizing stamp on temple/bridge
          ctx.fillStyle = "#fef08a";
          ctx.font = "bold 18px monospace";
          if (currentStepIndex === 0) {
            ctx.fillText(`FRONT VIEW: ${sample.frame_name}`, 40, 390);
            ctx.fillText(`TAG PRICE: $${sample.price.toFixed(2)} USD`, 40, 420);
          } else if (currentStepIndex === 1) {
            ctx.fillText(`SIDE PROFILE: ${sample.brand} ${sample.model_name}`, 40, 390);
            ctx.fillText(`MATERIAL: ${sample.material}`, 40, 420);
          } else if (currentStepIndex === 2) {
            ctx.fillText(`LEFT TEMPLE STAMP: ${sample.front_size}[]${sample.bridge_size}-${sample.temple_length}`, 40, 390);
            ctx.fillText(`CE MADE IN ITALY`, 40, 420);
          } else {
            ctx.fillText(`RIGHT TEMPLE STAMP: ${sample.brand} ${sample.model_name}`, 40, 390);
            ctx.fillText(`AUTHENTIC OPTICAL LUXURY`, 40, 420);
          }
        }

        // Convert simulated canvas to blob
        imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
        });
        
        if (imageBlob) {
          tempBlobUrl = URL.createObjectURL(imageBlob);
        }
      } else {
        // Live stream capture
        if (!videoRef.current || !canvasRef.current) {
          throw new Error("Embedded stream components missing");
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Match camera aspect ratio dynamically
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not acquire 2D canvas context");

        // Force fresh canvas rendering directly from active live video element
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert captured context to Blob payload
        imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
        });

        if (imageBlob) {
          tempBlobUrl = URL.createObjectURL(imageBlob);
        }
      }

      if (!imageBlob || !tempBlobUrl) {
        throw new Error("Could not generate valid photographic assets");
      }

      const activeStepIndex = currentStepIndex;

      // Immediately write local snapshot preview so operator has feedback.
      // Photos 3 and 4 are local temporary aids and bypass Cloudinary uploading.
      setSnapshots((prev) => {
        const next = [...prev];
        next[activeStepIndex] = {
          ...next[activeStepIndex],
          blobUrl: tempBlobUrl,
          cloudinaryUrl: null,
          uploadStatus: activeStepIndex < 2 ? "uploading" : "success"
        };
        return next;
      });

      // Provide base64 data URL for steps 2 and 3 so Gemini AI inspect can read inner temple stamps
      if (activeStepIndex >= 2 && imageBlob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          setSnapshots((prev) => {
            const next = [...prev];
            if (next[activeStepIndex]) {
              next[activeStepIndex] = {
                ...next[activeStepIndex],
                cloudinaryUrl: b64,
                uploadStatus: "success"
              };
            }
            return next;
          });
        };
        reader.readAsDataURL(imageBlob);
      }

      // Automatically cascade camera step to accelerate pipeline, unless already at max
      if (currentStepIndex < 3) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        // Locked at 4 images
        setCurrentStepIndex(4);
        showToast(
          language === "ar"
            ? "اكتمل التقاط جميع الصور الـ 4! اضغط 'الانتقال إلى إدخال المواصفات' للمتابعة."
            : "All 4 photos captured! Click 'Proceed to Specifications' to continue.",
          "success"
        );
      }

      // Only Upload to Cloudinary if it is Photo 1 (Front View) or Photo 2 (Side profile)
      if (activeStepIndex < 2) {
        uploadAssetToCloudinary(imageBlob, activeStepIndex, uploadSessionRef.current);
      }

    } catch (err: any) {
      console.error("Snapshot capture failure", err);
      showToast(`Snapshot failure: ${err.message || err}`, "error");
    }
  };

  // Immediate Cloudinary Pipeline Upload
  const uploadAssetToCloudinary = async (fileBlob: Blob, stepIndex: number, sessionAtStart: number) => {
    try {
      const timestamp = new Date().getTime();
      const filename = `frame_${timestamp}_step_${stepIndex}.jpg`;
      const file = new File([fileBlob], filename, { type: "image/jpeg" });

      const uploaderData = new FormData();
      uploaderData.append("file", file);
      uploaderData.append("upload_preset", "inventory_preset");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkzznbzes/image/upload", {
        method: "POST",
        body: uploaderData
      });

      if (!res.ok) {
        throw new Error(`Upload Failed: HTTP Status ${res.status}`);
      }

      if (sessionAtStart !== uploadSessionRef.current) {
        console.warn("Discarding stale Cloudinary success callback for previous session.");
        return;
      }

      const data = await res.json();
      const secureUrl = data.secure_url;

      // Update immediate local ref array to bypass React state race conditions
      if (stepIndex === 0) {
        uploadedUrlsRef.current[0] = secureUrl;
        setFrontImageUrl(secureUrl);
      } else if (stepIndex === 1) {
        uploadedUrlsRef.current[1] = secureUrl;
        setSideImageUrl(secureUrl);
      }

      setSnapshots((prev) => {
        const next = [...prev];
        next[stepIndex] = {
          ...next[stepIndex],
          cloudinaryUrl: secureUrl,
          uploadStatus: "success"
        };
        return next;
      });
    } catch (err: any) {
      console.error(`Asset index ${stepIndex} upload to Cloudinary failed:`, err);
      
      // Fallback: Use base64 data-url locally so operators can proceed in sandbox-offline
      const reader = new FileReader();
      reader.onloadend = () => {
        if (sessionAtStart !== uploadSessionRef.current) {
          console.warn("Discarding stale Cloudinary error callback for previous session.");
          return;
        }

        const base64data = reader.result as string;
        
        // Save fallback locally for the correct slots and update ref immediately
        if (stepIndex === 0) {
          uploadedUrlsRef.current[0] = base64data;
          setFrontImageUrl(base64data);
        } else if (stepIndex === 1) {
          uploadedUrlsRef.current[1] = base64data;
          setSideImageUrl(base64data);
        }

        setSnapshots((prev) => {
          const next = [...prev];
          next[stepIndex] = {
            ...next[stepIndex],
            cloudinaryUrl: base64data, // locally available payload fallback
            uploadStatus: "error",
            uploadError: "Cloudinary Preset blocked. Preserved locally as raw stream payload."
          };
          return next;
        });
      };
      reader.readAsDataURL(fileBlob);
      showToast("Cloudinary Preset error. Secured snapshot in regional offline buffer.", "info");
    }
  };

  // AI OCR and Auto-fill extraction via Gemini API
  const runAIExtraction = async () => {
    // Collect non-empty media urls
    const availableUrls = snapshots
      .map((snap) => snap.cloudinaryUrl)
      .filter((url) => !!url);

    if (availableUrls.length === 0) {
      showToast("Please capture at least 1 photo for state inspection.", "error");
      return;
    }

    setIsExtractingWithAI(true);
    setAiError(null);
    setAiFilledFields(new Set());

    try {
      const res = await fetch("/api/gemini/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: availableUrls })
      });

      if (!res.ok) {
        let errorMsg = "";
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.message || "";
        } catch {
          errorMsg = await res.text().catch(() => "");
        }

        // Clean any raw JSON wrapper
        let cleanMsg = errorMsg;
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed?.error?.message) {
            cleanMsg = parsed.error.message;
          }
        } catch {}

        if (/503|unavailable|high demand|overloaded/i.test(cleanMsg) || res.status === 503) {
          throw new Error(
            language === "ar"
              ? "خدمة فحص الذكاء الاصطناعي مشغولة حالياً نظراً لزيادة الطلب المؤقتة. يرجى إعادة المحاولة بعد لحظات، أو يمكنك إدخال قياسات الإطار يدوياً في النموذج أدناه."
              : "The AI inspection service is currently experiencing high demand. Please try again in a few moments, or feel free to enter the frame measurements manually below."
          );
        } else if (/429|quota|rate limit/i.test(cleanMsg) || res.status === 429) {
          throw new Error(
            language === "ar"
              ? "تم الوصول إلى الحد المؤقت للطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى."
              : "The AI service request limit has been temporarily reached. Please wait a moment and try again."
          );
        } else {
          throw new Error(
            language === "ar"
              ? "تعذر إكمال الفحص الآلي في الوقت الحالي. يرجى إعادة المحاولة بعد لحظات أو كتابة القياسات يدوياً."
              : "The AI service is momentarily unavailable. Please try again in a moment, or enter the frame details manually."
          );
        }
      }

      const aiData = await res.json();

      // Successfully retrieved JSON mapping
      const filled = new Set<string>();

      const sanitizeExtractedVal = (val: any): string => {
        if (val === undefined || val === null) return "";
        const s = String(val).trim();
        const lower = s.toLowerCase();
        if (
          lower === "unknown" ||
          lower === "n/a" ||
          lower === "na" ||
          lower === "none" ||
          lower === "undefined" ||
          lower === "null" ||
          lower === "unspecified"
        ) {
          return "";
        }
        return s;
      };

      const cleanBrand = sanitizeExtractedVal(aiData.brand);
      const cleanModel = sanitizeExtractedVal(aiData.model_name);

      setBrand(cleanBrand);
      if (cleanBrand) {
        filled.add("brand");
      }

      setModelName(cleanModel);
      if (cleanModel) {
        filled.add("model_name");
      }

      // Automatically construct and update the joined frameName
      const constructedName = `${cleanBrand} ${cleanModel}`.trim();
      setFrameName(constructedName);
      if (constructedName) {
        filled.add("frame_name");
      }

      if (aiData.frame_material) {
        setFrameMaterial(aiData.frame_material);
        filled.add("frame_material");
      }
      if (aiData.front_size !== undefined && aiData.front_size !== null) {
        setFrontSize(aiData.front_size.toString());
        filled.add("front_size");
      }
      if (aiData.bridge_size !== undefined && aiData.bridge_size !== null) {
        setBridgeSize(aiData.bridge_size.toString());
        filled.add("bridge_size");
      }
      if (aiData.temple_length !== undefined && aiData.temple_length !== null) {
        setTempleLength(aiData.temple_length.toString());
        filled.add("temple_length");
      }
      if (aiData.price !== undefined && aiData.price !== null) {
        setPrice(aiData.price.toString());
        filled.add("price");
      } else {
        // Explicitly clear the price if not found on dynamic tags to comply with instructions
        setPrice("");
      }
      if (aiData.alt_text) {
        setAltText(aiData.alt_text);
        filled.add("alt_text");
      }
      if (aiData.agent_instruction) {
        setAgentInstruction(aiData.agent_instruction);
        filled.add("agent_instruction");
      }

      setAiFilledFields(filled);
      showToast("Gold AI inspection parsed lens & sizing stamps!", "success");

      // Flash golden highlight timer
      setTimeout(() => {
        setAiFilledFields(new Set());
      }, 5000);

    } catch (err: any) {
      console.warn("AI Generation Notice:", err);
      let displayMessage = err?.message || "";
      // Handle any raw JSON strings if they somehow bypassed
      try {
        const parsed = JSON.parse(displayMessage);
        if (parsed?.error?.message) {
          displayMessage = parsed.error.message;
        }
      } catch {}

      if (/503|high demand|unavailable|overloaded/i.test(displayMessage)) {
        displayMessage = language === "ar"
          ? "خدمة فحص الذكاء الاصطناعي مشغولة حالياً نظراً لزيادة الطلب المؤقتة. يرجى إعادة المحاولة بعد لحظات، أو يمكنك إدخال قياسات الإطار يدوياً في النموذج أدناه."
          : "The AI inspection service is currently experiencing high demand. Please try again in a few moments, or feel free to enter the frame measurements manually below.";
      }

      setAiError(displayMessage);
      showToast(
        language === "ar"
          ? "خدمة الذكاء الاصطناعي مشغولة حالياً، يرجى المحاولة بعد قليل أو الإدخال يدوياً."
          : "AI service is currently busy. Please try again shortly or enter details manually.",
        "info"
      );
    } finally {
      setIsExtractingWithAI(false);
    }
  };

  // Re-shoots/Clears current steps
  const resetCameraStage = () => {
    // Increment session ID to invalidate any outstanding background upload resolutions
    uploadSessionRef.current = uploadSessionRef.current + 1;
    uploadedUrlsRef.current = [null, null]; // Explicitly wipe array/Ref clean to avoid stale captures

    snapshots.forEach((snap) => {
      if (snap.blobUrl && snap.blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(snap.blobUrl);
      }
    });

    setSnapshots(
      CAPTURE_STEPS.map((step) => ({
        stepIdx: step.idx,
        label: step.indicator,
        blobUrl: null,
        cloudinaryUrl: null,
        uploadStatus: "idle"
      }))
    );
    setFrontImageUrl(null);
    setSideImageUrl(null);
    setCurrentStepIndex(0);
    setWorkflowStep(1);
    setAiError(null);

    // Explicitly clear canvas draw cache on reset
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Explicitly stop all active video tracks, set video source to null, and spin up a fresh hardware camera instance to unlock the stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    stopCameraStream();
    initCameraStream();

    showToast("Viewfinder sequence reset. Ready for next frame front angle.", "info");
  };

  // Core submission mapping Transaction Logic
  const handleSubmitInventory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim()) {
      showToast(language === "ar" ? "خطأ في التحقق: يرجى كتابة تفاصيل العلامة التجارية." : "Validation Error: Please configure Brand details.", "error");
      return;
    }
    if (!modelName.trim()) {
      showToast(language === "ar" ? "خطأ في التحقق: يرجى كتابة كود أو اسم المويل." : "Validation Error: Please configure Eyewear Model Name / Code.", "error");
      return;
    }

    // Helper to keep original Cloudinary URLs without background removal or normalization
    const modifyCloudinaryUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
      return url;
    };

    const availableMedia = snapshots
      .slice(0, 2)
      .map((snap) => snap.cloudinaryUrl)
      .filter((u) => !!u) as string[];

    setIsSyncingSupabase(true);

    try {
      let resolvedShopId = shopId;

      // Check cached active shop if not in state
      if (!isUuid(resolvedShopId) && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("envision_active_shop_id");
          if (isUuid(stored)) {
            resolvedShopId = stored;
          }
        } catch {}
      }

      if (!isUuid(resolvedShopId) && availableShops.length > 0 && isUuid(availableShops[0]?.id)) {
        resolvedShopId = availableShops[0].id;
      }

      const schemaPayload = {
        frame_name: frameName || `${brand} ${modelName}`,
        brand: brand.trim(),
        model_name: modelName.trim(),
        price: price ? parseFloat(price) : null,
        discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
        material: frameMaterial,
        front_size: frontSize ? parseInt(frontSize) : null,
        bridge_size: bridgeSize ? parseInt(bridgeSize) : null,
        temple_length: templeLength ? parseInt(templeLength) : null,
        shop_id: resolvedShopId,
        alt_text: altText?.trim() || "Envision Eyewear"
      };

      let recordId = generateTmpId();
      let isLiveSynced = false;
      let frontUrl: string | null = null;
      let sideUrl: string | null = null;

      // Use the session already in React state instead of calling supabase.auth.getSession()
      const currentSessionUserId: string | null = session?.user?.id ?? null;

      // Show red box on screen (and console.log) with these values right before inserting into "inventory"
      console.log("isSupabaseConfigured:", isSupabaseConfigured);
      console.log("resolvedShopId:", resolvedShopId);
      console.log("isUuid(resolvedShopId):", isUuid(resolvedShopId));
      console.log("current Supabase session user id:", currentSessionUserId);

      setInventoryDebugBox({
        isSupabaseConfigured,
        resolvedShopId,
        isUuid: isUuid(resolvedShopId),
        userId: currentSessionUserId,
        error: null
      });

      // Wrap the inventory insert and the inventory_media inserts with a 20-second timeout
      let saveTimedOut = false;
      try {
        let timer: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            saveTimedOut = true;
            reject(new Error("Save timed out"));
          }, 20000);
        });

        const performDbInserts = async () => {
          // Insert into the "inventory" table
          const { data: invData, error: invError } = await supabase
            .from("inventory")
            .insert([schemaPayload])
            .select("id")
            .maybeSingle();

          // If the inventory insert returns an error or no id, show the exact Supabase error in the red box
          // and do NOT show a success message, do NOT save to localStorage and do NOT reset the form
          if (invError || !invData?.id) {
            const exactError = {
              message: invError?.message ?? "No ID returned from inventory insertion.",
              code: invError?.code ?? null,
              details: invError?.details ?? null,
              hint: invError?.hint ?? null
            };

            console.log("Exact Supabase error:", exactError);

            setInventoryDebugBox({
              isSupabaseConfigured,
              resolvedShopId,
              isUuid: isUuid(resolvedShopId),
              userId: currentSessionUserId,
              error: exactError
            });

            setIsSyncingSupabase(false);
            return false;
          }

          recordId = invData.id;
          isLiveSynced = true;

          // Table 2: Sequential TWO separate row inserts into 'public.inventory_media'
          const rawFrontUrl = uploadedUrlsRef.current[0] || frontImageUrl || snapshots[0]?.cloudinaryUrl;
          const rawSideUrl = uploadedUrlsRef.current[1] || sideImageUrl || snapshots[1]?.cloudinaryUrl;

          frontUrl = modifyCloudinaryUrl(rawFrontUrl);
          sideUrl = modifyCloudinaryUrl(rawSideUrl);

          if (frontUrl) {
            try {
              await supabase
                .from("inventory_media")
                .insert({
                  inventory_id: recordId,
                  media_url: frontUrl,
                  media_type: "image"
                });
            } catch (mErr) {
              console.warn("Front media insert warning:", mErr);
            }
          }

          if (sideUrl) {
            try {
              await supabase
                .from("inventory_media")
                .insert({
                  inventory_id: recordId,
                  media_url: sideUrl,
                  media_type: "image"
                });
            } catch (mErr) {
              console.warn("Side media insert warning:", mErr);
            }
          }

          return true;
        };

        const success = await Promise.race([performDbInserts(), timeoutPromise]).finally(() => {
          clearTimeout(timer!);
        });

        if (!success) {
          setIsSyncingSupabase(false);
          return;
        }
      } catch (err: any) {
        if (err?.message === "Save timed out" || saveTimedOut) {
          console.error("Save timed out");
          setInventoryDebugBox({
            isSupabaseConfigured,
            resolvedShopId,
            isUuid: isUuid(resolvedShopId),
            userId: currentSessionUserId,
            error: {
              message: "Save timed out",
              code: "TIMEOUT",
              details: "The database save operation exceeded 20 seconds.",
              hint: "Please check your network connection and Supabase availability."
            }
          });
          setIsSyncingSupabase(false);
          return;
        }
        throw err;
      }

      // Append record to historical logs state for agent reassurance
      const catalogRecord: SavedRecord = {
        id: recordId,
        brand: brand.trim(),
        model: modelName.trim(),
        frame_name: frameName || `${brand} ${modelName}`,
        front_size: frontSize ? parseInt(frontSize) : 0,
        bridge_size: bridgeSize ? parseInt(bridgeSize) : 0,
        temple_length: templeLength ? parseInt(templeLength) : 0,
        price: price ? parseFloat(price) : 0,
        material: frameMaterial,
        images_count: availableMedia.length,
        timestamp: new Date().toLocaleTimeString(),
        synced: isLiveSynced
      };

      const nextHistory = [catalogRecord, ...historyItems].slice(0, 50);
      setHistoryItems(nextHistory);
      localStorage.setItem("envision_batch_scans", JSON.stringify(nextHistory));

      // Append live or fallback created entry straight to shop inventory database state

      const freshShopItem = {
        id: recordId,
        brand: brand.trim(),
        model_name: modelName.trim(),
        frame_name: frameName || `${brand} ${modelName}`,
        front_size: frontSize ? parseInt(frontSize) : 0,
        bridge_size: bridgeSize ? parseInt(bridgeSize) : 0,
        temple_length: templeLength ? parseInt(templeLength) : 0,
        price: price ? parseFloat(price) : 0,
        material: frameMaterial,
        preview_url: frontUrl || sideUrl || null,
        created_at: new Date().toISOString(),
        shop_id: resolvedShopId
      };
      const updatedShopList = [freshShopItem, ...shopInventory];
      setShopInventory(updatedShopList);
      localStorage.setItem("envision_shop_inventory", JSON.stringify(updatedShopList));

      if (isLiveSynced) {
        showToast(
          language === "ar"
            ? "تم بنجاح! تم حفظ البيانات ومزامنتها مع قاعدة البيانات وتصفير النموذج."
            : "Success! Item synced to live database and form reset.",
          "success"
        );
      } else {
        showToast(
          language === "ar"
            ? "تم حفظ السجل محلياً في المخزون وتصفير النموذج بنجاح."
            : "Item saved to local inventory and form reset successfully.",
          "info"
        );
      }

      // COMPLETE CLEAN SLATE PORTAL RESET
      uploadSessionRef.current = uploadSessionRef.current + 1;
      uploadedUrlsRef.current = [null, null]; // Explicitly wipe array/Ref clean to bypass duplicate photo uploads across frames
      setBrand("");
      setModelName("");
      setFrameName("");
      setPrice("");
      setDiscountedPrice("");
      setFrameMaterial("Acetate");
      setFrontSize("");
      setBridgeSize("");
      setTempleLength("");
      setAltText("");
      setAgentInstruction("");
      setFrontImageUrl(null);
      setSideImageUrl(null);
      setAiFilledFields(new Set());
      setAiError(null);

      // Clean snapshots and explicitly stop & re-initialize the camera stream to prevent browser hardware buffer lock
      setSnapshots(
        CAPTURE_STEPS.map((step) => ({
          stepIdx: step.idx,
          label: step.indicator,
          blobUrl: null,
          cloudinaryUrl: null,
          uploadStatus: "idle"
        }))
      );

      // Explicitly stop all active video tracks, set video source to null, and spin up a fresh hardware camera instance to unlock the stream
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
      }
      stopCameraStream();
      initCameraStream();

      // Explicitly clear canvas draw cache on submit/reset
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      setCurrentStepIndex(0);
      setSimulatedSampleIdx((prev) => prev + 1);
      setWorkflowStep(1);

    } catch (err: any) {
      if (err?.code !== "42501") {
        console.error("Database Save Failure:", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
      } else {
        console.warn("Database Save RLS Policy Note:", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
      }
      showToast(`Database Error: ${err.message || "Failed transaction sync."}`, "error");
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const getStepInstruction = () => {
    if (currentStepIndex < 4) {
      return localizedSteps[currentStepIndex].label;
    }
    return language === "ar" ? "تم التقاط جميع الإحداثيات الـ 4 للنظارة ✔" : "All 4 Eyeglass Coordinates Snapped ✔";
  };

  const isUploadingImages = snapshots.slice(0, 2).some((snap) => snap.uploadStatus === "uploading");

  if (!isMounted || isAuthLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-100 bg-[#0c0c0c] font-sans">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="bg-[#D4AF37]/10 p-6 rounded-2xl border border-[#D4AF37]/30">
            <Layers className="h-20 w-20 text-[#D4AF37] animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold font-display tracking-wider text-white">
            INVENTORY <span className="text-[#D4AF37]">ENTRY</span>
          </h1>
          <p className="text-xl font-mono text-gray-400 animate-pulse uppercase">
            {language === "ar" ? "جاري تشغيل بوابة المشغل الفاخرة..." : "Initializing Luxury Operator Portal..."}
          </p>
        </div>
      </div>
    );
  }

  // OPERATOR AUTHENTICATION GATE INTERCEPTOR
  if (!session) {
    return (
      <div className={`flex flex-col min-h-screen text-gray-100 bg-[#121212] font-sans items-center justify-center p-6 relative overflow-hidden ${language === "ar" ? "rtl" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
        {/* Abstract background ambient lights */}
        <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[220px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-neutral-900/40 blur-[200px]" />
        
        {/* Language selector in corner */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <Globe className="h-6 w-6 text-neutral-500" />
          <button
            onClick={() => {
              const next = language === "en" ? "ar" : "en";
              setLanguage(next);
              showToast(next === "ar" ? "تم تحويل النظام إلى العربية" : "System set to English", "info");
            }}
            type="button"
            className="text-lg font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold border border-neutral-800 px-5 py-3 rounded transition-all cursor-pointer"
          >
            {language === "en" ? "العربية (AR)" : "English (EN)"}
          </button>
        </div>

        <div className="w-full max-w-2xl z-10">
          <div className="flex flex-col items-center mb-10">
            <img 
              src="https://i.imgur.com/wf6xiJJ.png" 
              alt="Envision AI Logo"
              className="h-56 w-auto object-contain mb-4"
            />
            <div className="text-center">
              <h2 className="text-xl font-mono tracking-[0.25em] text-[#D4AF37] uppercase animate-pulse">
                {language === "ar" ? "بوابة المشغلين الآمنة" : "OPERATOR VERIFICATION ENGINE"}
              </h2>
              <p className="text-base font-mono text-neutral-400 uppercase tracking-widest mt-2">
                {language === "ar" ? "مخزون تجربة الذكاء الاصطناعي وبحث المتجهات" : "AI Try-On & Vector Showroom digitalizer"}
              </p>
            </div>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-neutral-800/80 p-12 shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
            
            <div className="mb-10 text-center">
              <span className="inline-block p-4 rounded-xl bg-neutral-900 border border-neutral-800 mb-4">
                <Lock className="h-8 w-8 text-[#D4AF37]" />
              </span>
              <h3 className="text-2xl font-bold tracking-widest text-white uppercase font-display">
                {t("loginTitle")}
              </h3>
              <p className="text-lg text-neutral-400 mt-2">
                {t("loginSub")}
              </p>
            </div>

            {authError && (
              <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded-lg text-lg font-mono mb-8 flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-base font-mono uppercase tracking-wider text-neutral-300 block mb-2">
                  {t("emailLabel")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 rtl:left-auto rtl:right-4 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="h-6 w-6" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="operator@envision.com"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl py-4 pl-12 pr-6 rtl:pl-6 rtl:pr-12 text-base font-mono text-white placeholder-neutral-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-base font-mono uppercase tracking-wider text-neutral-300 block mb-2">
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 rtl:left-auto rtl:right-4 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="h-6 w-6" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl py-4 pl-12 pr-12 rtl:pl-12 rtl:pr-12 text-base font-mono text-white placeholder-neutral-600 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 rtl:right-auto rtl:left-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#D4AF37] hover:bg-[#c49e2e] disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-bold font-mono tracking-widest text-lg uppercase py-4 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(212,175,55,0.15)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.25)]"
              >
                {isLoggingIn ? (
                  <>
                    <span className="inline-block animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
                    <span>{language === "ar" ? "التحقق..." : "VERIFYING..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6 text-black" />
                    <span>{t("loginButton")}</span>
                  </>
                )}
              </button>
            </form>

            {!isSupabaseConfigured && (
              <div className="mt-8 border-t border-neutral-900 pt-6 text-center">
                <span className="text-sm font-mono text-[#D4AF37]/80 block uppercase tracking-wider">
                  ⚠️ {language === "ar" ? "بيئة معاينة تجريبية" : "PREVIEW SANDBOX ACTIVE"}
                </span>
                <p className="text-xs font-mono text-neutral-400 mt-2 leading-normal">
                  {language === "ar" ? "اكتب أي إيميل وكلمة سر لتسجيل الدخول الفوري وتجربة كامل مميزات النظام." : "Enter any operator email & password to bypass and unlock the complete operational interface."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen text-gray-100 bg-[#0c0c0c] font-sans ${language === "ar" ? "rtl" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-slider-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-slider-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 999px;
        }
        .custom-slider-scroll::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 999px;
          border: 1px solid #0c0c0c;
        }
        .custom-slider-scroll::-webkit-scrollbar-thumb:hover {
          background: #ffe380;
        }
      `}} />
      {/* Dynamic Gold Custom Portal Header */}
      <header className="border-b border-neutral-850 bg-[#121212] px-6 py-3 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center">
            <img 
              src="https://i.imgur.com/wf6xiJJ.png" 
              alt="Inventory Entry"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block border-l border-neutral-800 pl-5 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-5">
            <h1 className="text-xl md:text-2xl font-mono tracking-wider text-[#D4AF37] uppercase font-bold">
              {t("operatorTerminal")}
            </h1>
          </div>
        </div>

        {/* Active Operator Status & Actions */}
        <div className="flex flex-wrap items-center gap-4">
          {session?.user && (
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 rounded-lg bg-neutral-950/90 border border-neutral-800 font-mono text-xs">
              {/* Logged in Staff Name */}
              <div className="flex items-center gap-1.5 text-neutral-300">
                <User className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                <span className="text-neutral-400 font-medium">
                  {language === "ar" ? "الموظف:" : "Staff:"}
                </span>
                <span className="text-white font-bold tracking-wide">
                  {staffName || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || (language === "ar" ? "المشغل" : "Operator")}
                </span>
              </div>

              <span className="hidden sm:inline-block h-3.5 w-[1px] bg-neutral-800" />

              {/* Shop Name */}
              {availableShops.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                  <span className="text-neutral-400 font-medium">
                    {language === "ar" ? "الصالة:" : "Shop:"}
                  </span>
                  <select
                    value={shopId || ""}
                    onChange={(e) => handleSwitchShop(e.target.value)}
                    className="bg-neutral-900 text-[#D4AF37] font-bold border border-neutral-700/60 rounded px-2 py-0.5 outline-none cursor-pointer focus:border-[#D4AF37]"
                    title={language === "ar" ? "تغيير صالة العرض" : "Switch Showroom"}
                  >
                    {availableShops.map((s) => (
                      <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                        {s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold">
                  <Store className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                  <span className="text-neutral-400 font-medium font-mono">
                    {language === "ar" ? "الصالة:" : "Shop:"}
                  </span>
                  <span className="text-[#D4AF37]">
                    {shopName || (language === "ar" ? "صالة عرض إنفيجن" : "Envision Showroom")}
                  </span>
                </div>
              )}
            </div>
          )}

          <a
            href={`/shop/leads?lang=${language}`}
            className="text-xs px-4 py-2 font-mono font-bold tracking-wider rounded-lg border border-amber-500/25 hover:border-amber-500/60 text-amber-500 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1.5 uppercase cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>{language === "ar" ? "المبيعات المحتمله" : "Potential Leads"}</span>
          </a>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => {
              const nextLang = language === "en" ? "ar" : "en";
              setLanguage(nextLang);
              try {
                localStorage.setItem("envision_language", nextLang);
              } catch {
                // Ignore localStorage errors
              }
              showToast(nextLang === "ar" ? "تم تحويل اللغة إلى العربية" : "System language set to English", "info");
            }}
            className="text-xs px-4 py-2 font-mono rounded border border-[#D4AF37]/30 transition-colors flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#D4AF37]/15 text-[#D4AF37] cursor-pointer"
            title="Switch Language / تغيير اللغة"
          >
            <Globe className="h-4 w-4" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>

          {/* Secure logout action */}
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLogout();
            }}
            className="text-xs px-4 py-2 font-mono rounded border border-red-900/30 transition-colors flex items-center gap-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("logout")}
          >
            {isLoggingOut ? (
              <>
                <span className="inline-block animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full pointer-events-none" />
                <span className="hidden sm:inline pointer-events-none">
                  {language === "ar" ? "جاري الخروج..." : "Logging out..."}
                </span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 pointer-events-none" />
                <span className="hidden sm:inline pointer-events-none">{t("logout")}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Two-Step Workflow Stepper Navigation */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 bg-neutral-950/80 p-2 sm:p-3 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-md">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setWorkflowStep(1)}
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all cursor-pointer text-left rtl:text-right ${
              workflowStep === 1
                ? "bg-[#D4AF37]/15 border-2 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                : "bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-white"
            }`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-sm sm:text-base ${
              workflowStep === 1 ? "bg-[#D4AF37] text-black" : "bg-neutral-800 text-neutral-300"
            }`}>
              <Camera className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#D4AF37]">
                  {language === "ar" ? "الخطوة ١" : "STEP 1"}
                </span>
                {snapshots.filter((s) => s.blobUrl).length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono font-bold">
                    {snapshots.filter((s) => s.blobUrl).length}/4
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold truncate">
                {t("step1WorkflowTitle")}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono truncate hidden sm:block">
                {t("step1WorkflowSubtitle")}
              </div>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => setWorkflowStep(2)}
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all cursor-pointer text-left rtl:text-right ${
              workflowStep === 2
                ? "bg-[#D4AF37]/15 border-2 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                : "bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-white"
            }`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-sm sm:text-base ${
              workflowStep === 2 ? "bg-[#D4AF37] text-black" : "bg-neutral-800 text-neutral-300"
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#D4AF37]">
                  {language === "ar" ? "الخطوة ٢" : "STEP 2"}
                </span>
                {brand && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-mono font-bold truncate max-w-[80px]">
                    {brand}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold truncate">
                {t("step2WorkflowTitle")}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono truncate hidden sm:block">
                {t("step2WorkflowSubtitle")}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Two-Step Engine Workspace Layout */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 py-4 md:py-6 flex flex-col gap-8">
        
        {/* STEP 1 VIEW: EYEGLASSES FRAME OPTICAL CAPTURE */}
        {workflowStep === 1 && (
          <div id="capture-console" className="w-full max-w-4xl mx-auto flex flex-col gap-5">
          
          {/* Hidden File Upload Elements */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/jpeg,image/png,image/webp,image/*" 
            className="hidden" 
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleImageFileUpload(f);
                e.target.value = "";
              }
            }} 
          />
          <input 
            type="file" 
            ref={stepFileInputRef} 
            accept="image/jpeg,image/png,image/webp,image/*" 
            className="hidden" 
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && targetUploadStepIdx !== null) {
                handleImageFileUpload(f, targetUploadStepIdx);
                e.target.value = "";
              }
            }} 
          />

          {/* Active Step Guide Banner & Mode Toggles */}
          <div className="flex flex-col gap-2 pb-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono tracking-wider text-[#D4AF37] uppercase font-bold">
                {language === "ar" ? "التقاط صور الفريم" : "Frame Capture"}
              </p>

              {/* Mode Badges */}
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode("camera");
                    setIsSimulatingCamera(false);
                    initCameraStream();
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    !isSimulatingCamera 
                      ? "bg-[#D4AF37] text-black font-bold" 
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Use Live Camera"
                >
                  <Video className="h-3 w-3" />
                  <span>{language === "ar" ? "كاميرا" : "Camera"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800"
                  title="Upload Image File"
                >
                  <Upload className="h-3 w-3" />
                  <span>{language === "ar" ? "رفع صورة" : "Upload"}</span>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold tracking-tight text-white leading-normal">
              {getStepInstruction()}
            </h3>
          </div>

          {/* Active Viewfinder STREAM / UPLOAD / DRAG-AND-DROP CONTAINER */}
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
                handleImageFileUpload(files[0]);
              }
            }}
            className={`relative rounded-xl border bg-neutral-950 overflow-hidden shadow-lg aspect-[4/3] flex flex-col items-center justify-center transition-all ${
              isDraggingOver 
                ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 bg-neutral-900/90" 
                : cameraError && !isSimulatingCamera
                  ? "border-amber-500/50"
                  : "border-neutral-800"
            }`}
          >
            
            {/* Viewfinder Overlay Diagnostics */}
            <div className="absolute top-3.5 left-3.5 z-10 px-3 py-1 bg-black/85 backdrop-blur-sm rounded-lg border border-neutral-800 text-xs font-mono flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${!isSimulatingCamera && cameraStream ? "bg-emerald-500 animate-ping" : isSimulatingCamera ? "bg-[#D4AF37]" : "bg-amber-500"}`} />
              <span className="text-neutral-300 font-bold uppercase">
                {!isSimulatingCamera && cameraStream ? "LIVE LENS" : isSimulatingCamera ? "SIMULATION" : "STANDBY"}
              </span>
            </div>

            <div className="absolute top-3.5 right-3.5 z-10 px-3 py-1 bg-[#D4AF37] text-black text-xs font-extrabold tracking-wider rounded-lg font-mono shadow-md">
              {currentStepIndex < 4 ? `${currentStepIndex + 1}/4` : (language === "ar" ? "اكتمل" : "DONE")}
            </div>

            {/* Simulated Canvas used to parse snapshots */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Drag and Drop Active Screen Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#D4AF37] rounded-xl">
                <UploadCloud className="h-16 w-16 text-[#D4AF37] animate-bounce mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">
                  {language === "ar" ? "أفلت صورة الإطار هنا" : "Drop Frame Image Here"}
                </h4>
                <p className="text-sm text-neutral-300 font-mono">
                  {language === "ar" 
                    ? `سيتم حفظها تلقائياً للخطوة ${currentStepIndex + 1} (${CAPTURE_STEPS[Math.min(currentStepIndex, 3)].indicator})` 
                    : `Will assign to Step ${currentStepIndex + 1} (${CAPTURE_STEPS[Math.min(currentStepIndex, 3)].indicator})`}
                </p>
              </div>
            )}

            {/* Direct Camera Feed / Emulator Visual Viewport / Permission Blocked Screen */}
            {isSimulatingCamera ? (
              <div className="w-full h-full relative flex flex-col items-center justify-between p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900">
                <div className="flex-1 flex flex-col items-center justify-center text-center mt-6">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#D4AF37] text-black text-[10px] font-mono font-bold rounded">
                      PRESET
                    </span>
                  </div>

                  <span className="text-base font-mono text-[#D4AF37] block font-bold mb-1">
                    {STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length].brand.toUpperCase()}
                  </span>
                  <p className="text-xs text-neutral-300 font-mono mb-2">
                    {STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length].model_name} • {STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length].material}
                  </p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-normal">
                    {language === "ar" 
                      ? "محاكاة عالية الدقة مزودة ببيانات وأبعاد الإطار البصرية لـ Gemini AI"
                      : "High-fidelity preset armed with optical stamps & sizing metrics for Gemini AI inspection."}
                  </p>
                </div>

                {/* Preset Switcher Bar */}
                <div className="w-full bg-black/90 px-3.5 py-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Tag className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                    <span className="text-xs font-mono text-neutral-300 truncate font-semibold">
                      {STATIC_INITIAL_SAMPLES[simulatedSampleIdx % STATIC_INITIAL_SAMPLES.length].frame_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      type="button"
                      onClick={() => {
                        setSimulatedSampleIdx(p => (p - 1 + STATIC_INITIAL_SAMPLES.length) % STATIC_INITIAL_SAMPLES.length);
                      }}
                      className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-300 px-2.5 py-1 rounded font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                      title="Previous Frame Preset"
                    >
                      ‹
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSimulatedSampleIdx(p => (p + 1) % STATIC_INITIAL_SAMPLES.length);
                        showToast(language === "ar" ? "تم تبديل نموذج الإطار التجريبي" : "Rotated luxury frame preset", "info");
                      }}
                      className="text-xs bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-3 py-1 rounded font-bold hover:bg-[#D4AF37]/35 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{language === "ar" ? "التالي" : "NEXT"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : cameraError ? (
              /* Camera Permission Denied / Blocked Fallback Interface */
              <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-neutral-950">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                
                <h4 className="text-base font-bold text-white mb-1">
                  {language === "ar" ? "تم حظر إذن الكاميرا أو تعذر الوصول" : "Camera Access Blocked / Denied"}
                </h4>
                
                <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                  {language === "ar"
                    ? "يمكنك رفع صور الإطار مباشرة من جهازك، أو استخدام وضع المحاكاة، أو منح الإذن من إعدادات المتصفح."
                    : "You can upload real frame photos directly, use simulation presets, or grant permission in your browser address bar."}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#ffe380] text-black text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{language === "ar" ? "رفع صورة من الجهاز" : "Upload Frame Photos"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraError(null);
                      initCameraStream();
                    }}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{language === "ar" ? "إعادة المحاولة" : "Retry Camera"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulatingCamera(true);
                      setCaptureMode("simulation");
                    }}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{language === "ar" ? "وضع المحاكاة" : "Simulation Mode"}</span>
                  </button>
                </div>

                {/* Help toggle */}
                <button
                  type="button"
                  onClick={() => setShowPermissionHelp(p => !p)}
                  className="text-[11px] text-neutral-400 hover:text-[#D4AF37] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{language === "ar" ? "كيفية تفعيل الكاميرا في المتصفح؟" : "How to unblock camera in browser?"}</span>
                </button>

                {showPermissionHelp && (
                  <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-left text-[11px] text-neutral-300 font-mono leading-relaxed max-w-sm">
                    <p className="font-bold text-[#D4AF37] mb-1">To enable camera:</p>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                      <li>Click the lock 🔒 or camera icon next to the URL in your browser address bar.</li>
                      <li>Set <strong>Camera</strong> to <strong>Allow</strong>.</li>
                      <li>Click <strong>Retry Camera</strong> or refresh this tab.</li>
                      <li>If viewing inside an embedded preview, click <em>Open in new tab</em>.</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-100"
              />
            )}

            {/* Scanning line animation */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-[#D4AF37]/30 opacity-40 pointer-events-none shadow-[0_0_10px_#D4AF37] animate-[bounce_4.5s_infinite]" />
          </div>

          {/* Trigger Button Deck */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={snapPhoto}
              disabled={currentStepIndex >= 4}
              className={`flex-1 py-3.5 px-5 rounded-xl flex items-center justify-center gap-2.5 font-bold transition-all relative overflow-hidden text-sm cursor-pointer shadow-lg ${
                currentStepIndex >= 4 
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700" 
                  : "bg-[#D4AF37] text-black hover:bg-[#ffe380] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              }`}
            >
              <Camera className="h-4 w-4 text-black" />
              <span className="font-mono uppercase tracking-wider">
                {isSimulatingCamera 
                  ? (language === "ar" ? "التقاط من المحاكاة" : "Capture Preset") 
                  : (language === "ar" ? "التقاط الصورة" : "Snap Photo")}
              </span>
              {currentStepIndex < 4 && (
                <span className="text-xs px-2 py-0.5 bg-black/15 rounded-full font-mono font-bold">
                  {currentStepIndex + 1}/4
                </span>
              )}
            </button>

            {/* Upload File Direct Action */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={currentStepIndex >= 4}
              className={`px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all cursor-pointer border ${
                currentStepIndex >= 4
                  ? "bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed"
                  : "bg-neutral-900 border-neutral-700 hover:border-[#D4AF37]/50 text-neutral-200 hover:text-white"
              }`}
              title="Upload Image File for current step"
            >
              <Upload className="h-4 w-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">{language === "ar" ? "رفع صورة" : "Upload File"}</span>
            </button>

            <button
              onClick={resetCameraStage}
              className="px-4 py-3.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center hover:bg-neutral-850"
              title={language === "ar" ? "إعادة ضبط الخطوات" : "Reset Capture Sequence"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Snapshot Deck (Horizontal layout row under viewfinder) */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-900 pb-2">
              <span className="text-sm font-mono font-bold text-[#D4AF37] flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {language === "ar" ? "الصور الـ 4 الملتقطة" : "Captured Snaps"} ({snapshots.filter((s) => s.blobUrl).length}/4)
              </span>

              <span className="text-[11px] text-neutral-500 font-mono">
                {language === "ar" ? "انقر على أي بطاقة لتغيير الصورة" : "Click card to replace/upload"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3.5">
              {snapshots.map((snap, sIdx) => {
                const isSelected = currentStepIndex === sIdx;
                const isUploaded = snap.uploadStatus === "success";
                const isUploading = snap.uploadStatus === "uploading";
                const isError = snap.uploadStatus === "error";

                return (
                  <div 
                    key={snap.stepIdx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        handleImageFileUpload(files[0], sIdx);
                      }
                    }}
                    className={`relative rounded-xl aspect-square border overflow-hidden flex flex-col justify-between p-1 bg-neutral-900 transition-all group ${
                      isSelected 
                        ? "border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)] bg-neutral-900 ring-1 ring-[#D4AF37]/40" 
                        : snap.blobUrl 
                          ? "border-neutral-700 hover:border-neutral-500" 
                          : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {snap.blobUrl ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={snap.blobUrl} 
                          alt={snap.label} 
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => setLightboxImage(snap.blobUrl)}
                          title="Click to view full image"
                        />
                        
                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(snap.blobUrl);
                            }}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md cursor-pointer"
                            title="Expand / Preview"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetUploadStepIdx(sIdx);
                              stepFileInputRef.current?.click();
                            }}
                            className="p-1.5 bg-[#D4AF37] hover:bg-[#ffe380] text-black rounded-md cursor-pointer"
                            title="Replace / Upload photo for this step"
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Uploading screen state overlay */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-lg pointer-events-none">
                            <RefreshCw className="h-5 w-5 text-[#D4AF37] animate-spin" />
                          </div>
                        )}

                        {/* Status tag */}
                        <div className="absolute top-1.5 right-1.5 pointer-events-none">
                          {isUploaded && (
                            <div className="bg-emerald-500 text-black p-1 rounded-full shadow-lg" title="Cloudinary Storage Synced">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          {isError && (
                            <div className="bg-amber-500 text-black p-1 rounded-full shadow-lg" title="Local Storage Buffering">
                              <Info className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetUploadStepIdx(sIdx);
                          setCurrentStepIndex(sIdx);
                          stepFileInputRef.current?.click();
                        }}
                        className="flex flex-col items-center justify-center flex-1 py-2 text-sm text-neutral-500 hover:text-neutral-300 font-mono text-center cursor-pointer transition-colors w-full h-full"
                        title={`Click to upload Step ${snap.stepIdx} (${snap.label}) photo`}
                      >
                        <Upload className="h-4 w-4 mb-1 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                        <span className="text-xs font-bold text-neutral-400">{snap.stepIdx}</span>
                        <span className="text-[10px] leading-3 uppercase text-neutral-500">{snap.label.split(" ")[0]}</span>
                      </button>
                    )}

                    {/* Step code tag */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/90 text-[10px] text-center font-mono py-0.5 text-neutral-300 font-bold select-none pointer-events-none">
                      P{snap.stepIdx}
                    </div>
                  </div>
                );
              })}
            </div>

            {snapshots.some(s => s.uploadStatus === "error") && (
              <div className="mt-3 bg-neutral-900 p-3 rounded-xl border border-neutral-800/80 text-xs font-mono text-amber-400/95 flex gap-2.5 items-start">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <span>Cloudinary direct sync fallback active. Local base64 assets armed for submission.</span>
              </div>
            )}
          </div>

          {/* Step 1 Completion & Advancement Banner */}
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-xl border ${
                snapshots.filter((s) => s.blobUrl).length === 4
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-400"
                  : snapshots.filter((s) => s.blobUrl).length > 0
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500"
              }`}>
                {snapshots.filter((s) => s.blobUrl).length === 4 ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {snapshots.filter((s) => s.blobUrl).length === 4
                    ? (language === "ar" ? "اكتمل التقاط جميع الصور الـ 4 بنجاح!" : "All 4 Optical Angles Captured!")
                    : snapshots.filter((s) => s.blobUrl).length > 0
                      ? (language === "ar" ? `تم التقاط ${snapshots.filter((s) => s.blobUrl).length} من 4 صور` : `${snapshots.filter((s) => s.blobUrl).length} of 4 Photos Captured`)
                      : (language === "ar" ? "الخطوة ١: التقط صور الإطار والختم" : "Step 1: Capture Frame Photos & Stamps")}
                </h4>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  {snapshots.filter((s) => s.blobUrl).length === 4
                    ? (language === "ar" ? "جاهز للانتقال للخطوة ٢ لاستخراج المواصفات بالذكاء الاصطناعي والمزامنة." : "Ready to proceed to Step 2 to extract specs with Gemini AI and sync.")
                    : (language === "ar" ? "يُوصى بالتقاط ختم الذراع الداخلي (P3 و P4) لتمكين القراءة التلقائية للمقاسات." : "Temple stamps (P3 & P4) enable Gemini AI to auto-read sizing and model codes.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {snapshots.filter((s) => s.blobUrl).length > 0 ? (
                <button
                  type="button"
                  onClick={() => setWorkflowStep(2)}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#ffe380] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] cursor-pointer"
                >
                  <span>{t("proceedToSpecsBtn")}</span>
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setWorkflowStep(2)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                >
                  <span>{t("skipToSpecsBtn")}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* STEP 2 VIEW: FRAME SPECIFICATIONS ENTRY & VERIFICATION APP */}
      {workflowStep === 2 && (
        <div id="specification-manifest" className="w-full max-w-5xl mx-auto flex flex-col gap-6">
          {/* Quick Action Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-md">
            <button
              type="button"
              onClick={() => setWorkflowStep(1)}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-[#D4AF37] text-neutral-200 hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer w-fit"
            >
              <ArrowLeft className="h-4 w-4 text-[#D4AF37] rtl:rotate-180" />
              <span>{t("backToCaptureBtn")}</span>
              <span className="text-[10px] px-2 py-0.5 bg-black/40 text-[#D4AF37] rounded-full">
                {snapshots.filter((s) => s.blobUrl).length}/4
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">
                {language === "ar" ? "الخطوة ٢ من ٢: إدخال مواصفات وفحص الإطار" : "Step 2 of 2: Specifications & Verification"}
              </span>
            </div>
          </div>

          {/* Captured Photos Optical Reference Bar (Zoom temple stamps while entering specs) */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-md">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-900 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                  {t("opticalReferenceBarTitle")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWorkflowStep(1)}
                className="text-[11px] font-mono text-neutral-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                {language === "ar" ? "تعديل أو إعادة التقاط الصور ←" : "Retake / Replace Photos →"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {snapshots.map((snap) => (
                <div
                  key={snap.stepIdx}
                  className="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden aspect-[4/3] group flex flex-col items-center justify-center"
                >
                  {snap.blobUrl ? (
                    <>
                      <img
                        src={snap.blobUrl}
                        alt={snap.label}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setLightboxImage(snap.blobUrl)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-[11px] font-mono text-white bg-black/80 px-2 py-1 rounded flex items-center gap-1 font-bold">
                          <Maximize2 className="h-3 w-3 text-[#D4AF37]" />
                          {language === "ar" ? "تكبير الفحص" : "Zoom Stamp"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2 text-neutral-600 font-mono text-xs">
                      <Camera className="h-5 w-5 mx-auto mb-1 opacity-40" />
                      <span>No image</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[10px] text-center font-mono py-0.5 text-neutral-300 font-bold">
                    P{snap.stepIdx}: {snap.label.split(" ")[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmitInventory} className="bg-neutral-950 p-6 md:p-8 rounded-xl border border-neutral-800 flex flex-col gap-6 shadow-xl relative">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {t("specificationSchemas")}
                </h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">
                  {t("opticalMetrics")}
                </p>
              </div>

              {/* Gemini Trigger Button */}
              <button
                type="button"
                onClick={runAIExtraction}
                disabled={isExtractingWithAI || snapshots.filter(s => s.blobUrl).length === 0}
                className={`py-2 px-4 rounded-lg flex items-center gap-2 border text-xs font-bold transition-all relative ${
                  snapshots.filter(s => s.blobUrl).length === 0
                    ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : isExtractingWithAI
                      ? "bg-neutral-900 border-[#D4AF37]/50 text-[#D4AF37]"
                      : "bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37] cursor-pointer"
                }`}
              >
                {isExtractingWithAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t("analyzingFrames")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-8 w-8 text-[#D4AF37] animate-pulse" />
                    <span>{t("runGeminiInspect")}</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Error Alert Output */}
            {aiError && (
              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-sm leading-relaxed text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-black/40">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-400 block mb-0.5">
                      {t("aiInspectionError")}
                    </span>
                    <p className="text-neutral-200 font-mono text-xs sm:text-sm leading-relaxed">
                      {aiError}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={runAIExtraction}
                    disabled={isExtractingWithAI}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isExtractingWithAI ? "animate-spin" : ""}`} />
                    <span>{language === "ar" ? "إعادة المحاولة" : "Try Again"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiError(null)}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-xs cursor-pointer"
                    title={language === "ar" ? "إغلاق" : "Dismiss"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Red Box on Screen: Pre-Check Values & Supabase Insert Error Details */}
            {inventoryDebugBox && (
              <div 
                id="inventory-debug-red-box"
                className="p-5 bg-red-950/95 border-2 border-red-500 rounded-xl text-red-100 font-mono text-xs sm:text-sm leading-relaxed shadow-2xl relative z-30 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-red-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-extrabold text-red-200 text-sm uppercase tracking-wider">
                      Inventory Insert Pre-Check & Debug Info
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInventoryDebugBox(null)}
                    className="text-red-300 hover:text-white px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 transition-colors text-xs font-bold cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/50 rounded-lg border border-red-900/60 text-xs">
                  <div>
                    <span className="text-red-400 font-bold">isSupabaseConfigured: </span>
                    <span className="text-white font-mono font-bold">{String(inventoryDebugBox.isSupabaseConfigured)}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">resolvedShopId: </span>
                    <span className="text-white font-mono font-bold break-all">{String(inventoryDebugBox.resolvedShopId)}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">isUuid(resolvedShopId): </span>
                    <span className="text-white font-mono font-bold">{String(inventoryDebugBox.isUuid)}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">session user id: </span>
                    <span className="text-white font-mono font-bold break-all">{String(inventoryDebugBox.userId)}</span>
                  </div>
                </div>

                {inventoryDebugBox.error && (
                  <div className="p-3 bg-red-900/40 border border-red-500/80 rounded-lg flex flex-col gap-1.5 text-xs">
                    <span className="font-extrabold text-red-300 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Exact Supabase Error:
                    </span>
                    <div>
                      <span className="text-red-300 font-bold">message: </span>
                      <span className="text-white font-mono font-bold">{String(inventoryDebugBox.error.message)}</span>
                    </div>
                    <div>
                      <span className="text-red-300 font-bold">code: </span>
                      <span className="text-white font-mono font-bold">{String(inventoryDebugBox.error.code)}</span>
                    </div>
                    <div>
                      <span className="text-red-300 font-bold">details: </span>
                      <span className="text-white font-mono">{String(inventoryDebugBox.error.details)}</span>
                    </div>
                    <div>
                      <span className="text-red-300 font-bold">hint: </span>
                      <span className="text-white font-mono">{String(inventoryDebugBox.error.hint)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Identification block */}
            <div className="flex flex-col gap-6">
              <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest border-b border-neutral-850 pb-1.5 font-bold">
                {t("productIdentification")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand name */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-brand" htmlFor="brand-input" className="text-xs text-neutral-400 font-mono font-bold">
                    {t("brandNameLabel")}
                  </label>
                  <input
                    id="brand-input"
                    type="text"
                    required
                    placeholder={t("brandPlaceholder")}
                    value={brand}
                    onChange={(e) => updateBrandAndName(e.target.value)}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                      aiFilledFields.has("brand") 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)] animate-[pulse_1.5s_infinite]" 
                        : "border-neutral-800 focus:border-neutral-600 focus:bg-neutral-850"
                    }`}
                  />
                </div>

                {/* Model Name SKU */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-model" htmlFor="model-input" className="text-xs text-neutral-400 font-mono font-bold">
                    {t("modelSkuLabel")}
                  </label>
                  <input
                    id="model-input"
                    type="text"
                    required
                    placeholder={t("modelPlaceholder")}
                    value={modelName}
                    onChange={(e) => updateModelAndName(e.target.value)}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                      aiFilledFields.has("model_name") 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)] animate-[pulse_1.5s_infinite]" 
                        : "border-neutral-800 focus:border-neutral-600 focus:bg-neutral-850"
                    }`}
                  />
                </div>
              </div>

              {/* Autogenerated Frame Name */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label id="label-frame" htmlFor="frame-input" className="text-xs text-neutral-400 font-mono font-bold">
                    {t("inventoryFrameLabel")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFrameName(`${brand} ${modelName}`.trim())}
                    className="text-xs font-mono text-gray-500 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Synchronic Auto name reset"
                  >
                    <RefreshCw className="h-3 w-3" /> {t("restoreDefault")}
                  </button>
                </div>
                <input
                  id="frame-input"
                  type="text"
                  placeholder={t("autoNameSequence")}
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-sm py-2.5 px-3.5 rounded-lg focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            {/* Sizing coordinates */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest border-b border-neutral-850 pb-1.5 font-bold">
                {t("opticalMeasurements")}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {/* Lens / Front size */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-front" htmlFor="front-input" className="text-xs text-neutral-400 font-mono truncate font-bold" title="Lens Width (front_size)">
                    {t("frontSizeLabel")}
                  </label>
                  <input
                    id="front-input"
                    type="number"
                    min="1"
                    placeholder={t("frontSizePlaceholder")}
                    value={frontSize}
                    onChange={(e) => setFrontSize(e.target.value)}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                      aiFilledFields.has("front_size") 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]" 
                        : "border-neutral-800 focus:border-neutral-600"
                    }`}
                  />
                </div>

                {/* Bridge size */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-bridge" htmlFor="bridge-input" className="text-xs text-neutral-400 font-mono truncate font-bold" title="Bridge Size (bridge_size)">
                    {t("bridgeWidthLabel")}
                  </label>
                  <input
                    id="bridge-input"
                    type="number"
                    min="1"
                    placeholder={t("bridgeWidthPlaceholder")}
                    value={bridgeSize}
                    onChange={(e) => setBridgeSize(e.target.value)}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                      aiFilledFields.has("bridge_size") 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]" 
                        : "border-neutral-800 focus:border-neutral-600"
                    }`}
                  />
                </div>

                {/* Temple lengths */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-temple" htmlFor="temple-input" className="text-xs text-neutral-400 font-mono truncate font-bold" title="Temple length (temple_length)">
                    {t("templeLengthLabel")}
                  </label>
                  <input
                    id="temple-input"
                    type="number"
                    min="1"
                    placeholder={t("templeLengthPlaceholder")}
                    value={templeLength}
                    onChange={(e) => setTempleLength(e.target.value)}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                      aiFilledFields.has("temple_length") 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]" 
                        : "border-neutral-800 focus:border-neutral-600"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Material & pricing */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest border-b border-neutral-850 pb-1.5 font-bold">
                {t("attributesPriceMatrices")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Material choice */}
                <div className="flex flex-col gap-1.5 md:col-span-1 relative" ref={materialDropdownRef}>
                  <label id="label-material" htmlFor="material-select-combobox" className="text-xs text-neutral-400 font-mono font-bold">
                    {t("frameMaterialLabel")}
                  </label>
                  
                  {/* Combobox Trigger Button */}
                  <div
                    id="material-select-combobox"
                    onClick={() => {
                      setIsMaterialDropdownOpen(!isMaterialDropdownOpen);
                      setMaterialSearchQuery("");
                    }}
                    className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border flex justify-between items-center cursor-pointer select-none transition-all duration-200 ${
                      isMaterialDropdownOpen
                        ? "border-[#D4AF37] ring-1 ring-[#D4AF37]"
                        : aiFilledFields.has("frame_material")
                          ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                          : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <span className="font-bold text-white truncate">
                      {frameMaterial || "Select Material..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#D4AF37] transition-transform duration-200 ${isMaterialDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {/* Hidden native select for validation and selector match tests */}
                  <select
                    id="material-select"
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    className="hidden"
                  >
                    {MATERIAL_CATEGORIES.flatMap(cat => cat.items).map(item => (
                      <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                    {frameMaterial && !MATERIAL_CATEGORIES.flatMap(cat => cat.items).some(i => i.name === frameMaterial) && (
                      <option value={frameMaterial}>{frameMaterial}</option>
                    )}
                  </select>

                  {/* Rich Search Dropdown Panel */}
                  {isMaterialDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[300px] min-w-[280px]">
                      {/* Search Bar */}
                      <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
                        <Search className="h-4 w-4 text-[#D4AF37]" />
                        <input
                          type="text"
                          placeholder="Type to filter..."
                          value={materialSearchQuery}
                          onChange={(e) => setMaterialSearchQuery(e.target.value)}
                          className="bg-transparent text-white text-xs focus:outline-none placeholder-true-gray-500 w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()} // Stop propagation to prevent trigger toggle
                        />
                        {materialSearchQuery && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMaterialSearchQuery("");
                            }}
                            className="text-[10px] text-neutral-400 hover:text-[#D4AF37] font-mono shrink-0 transition-colors"
                          >
                            ✖ Clear
                          </button>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="overflow-y-auto flex-1 p-2 custom-slider-scroll scroll-smooth max-h-[240px]">
                        {(() => {
                          let hasAnyMatches = false;
                          const elements = MATERIAL_CATEGORIES.map((category) => {
                            const matchedItems = category.items.filter(item =>
                              item.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(materialSearchQuery.toLowerCase())
                            );

                            if (matchedItems.length === 0) return null;
                            hasAnyMatches = true;

                            return (
                              <div key={category.categoryName} className="mb-3 last:mb-0">
                                <div className="text-[#D4AF37]/90 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 mb-1 border-b border-neutral-900">
                                  {category.categoryName}
                                </div>
                                {category.categoryDesc && !materialSearchQuery && (
                                  <div className="text-[10px] text-gray-400 italic font-mono px-2 mb-1.5 leading-relaxed">
                                    {category.categoryDesc}
                                  </div>
                                )}
                                <div className="space-y-1">
                                  {matchedItems.map((item) => {
                                    const isSelected = frameMaterial === item.name;
                                    return (
                                      <div
                                        key={item.name}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFrameMaterial(item.name);
                                          setIsMaterialDropdownOpen(false);
                                          setMaterialSearchQuery("");
                                        }}
                                        className={`p-2 rounded text-left select-none cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-white"
                                            : "hover:bg-neutral-900 border border-transparent text-neutral-300 hover:text-white"
                                        }`}
                                      >
                                        <div className="text-xs font-bold flex items-center gap-1">
                                          {item.name}
                                          {isSelected && (
                                            <span className="h-1 w-1 rounded-full bg-[#D4AF37] animate-pulse" />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5 leading-normal">
                                          {item.description}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });

                          if (!hasAnyMatches) {
                            return (
                              <div className="py-6 text-center text-neutral-500 font-mono text-xs leading-relaxed">
                                No matches for <span className="text-[#D4AF37] font-bold">&quot;{materialSearchQuery}&quot;</span>
                              </div>
                            );
                          }

                          return elements;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price standard */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-price" htmlFor="price-input" className="text-xs text-neutral-400 font-mono font-bold flex items-center gap-1">
                    {t("priceUsdLabel")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-mono">$</span>
                    <input
                      id="price-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={`bg-[#121212] text-sm py-2.5 pl-7 pr-3.5 rounded-lg border focus:outline-none focus:border-neutral-600 w-full ${
                        aiFilledFields.has("price") 
                          ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]" 
                          : "border-neutral-800"
                      }`}
                    />
                  </div>
                </div>

                {/* Discount price */}
                <div className="flex flex-col gap-1.5">
                  <label id="label-discount" htmlFor="discount-input" className="text-xs text-neutral-400 font-mono font-bold">
                    {t("discountPriceLabel")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono">$</span>
                    <input
                      id="discount-input"
                      type="number"
                      step="0.01"
                      placeholder={t("optionalPlaceholder")}
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-sm py-2.5 pl-7 pr-3.5 rounded-lg focus:outline-none focus:border-neutral-600 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Vector Embeddings Output descriptors */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest border-b border-neutral-850 pb-1.5 font-bold">
                {t("intelligentDescriptions")}
              </h3>

              {/* Alt Text Descriptor */}
              <div className="flex flex-col gap-1.5">
                <label id="label-alt" htmlFor="alt-textarea" className="text-xs text-neutral-400 font-mono font-bold">
                  {t("vectorAltTextLabel")}
                </label>
                <textarea
                  id="alt-textarea"
                  rows={2}
                  placeholder={t("altTextPlaceholder")}
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className={`bg-neutral-900 text-sm py-2 px-3 rounded-lg border focus:outline-none transition-all placeholder:text-neutral-600 ${
                    aiFilledFields.has("alt_text") 
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)] animate-pulse" 
                      : "border-neutral-800 focus:border-neutral-600 focus:bg-neutral-850"
                  }`}
                />
              </div>

              {/* Agent instructions verification stamp */}
              <div className="flex flex-col gap-1.5">
                <label id="label-instruction" htmlFor="instruction-textarea" className="text-xs text-neutral-400 font-mono font-bold">
                  {t("agentInstructionLabel")}
                </label>
                <input
                  id="instruction-textarea"
                  type="text"
                  placeholder={t("agentInstructionPlaceholder")}
                  value={agentInstruction}
                  onChange={(e) => setAgentInstruction(e.target.value)}
                  className={`bg-neutral-900 text-sm py-2.5 px-3.5 rounded-lg border focus:outline-none transition-all ${
                    aiFilledFields.has("agent_instruction") 
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_10px_rgba(212,175,55,0.2)]" 
                      : "border-neutral-800 focus:border-neutral-600 focus:bg-neutral-850"
                  }`}
                />
              </div>
            </div>

            {/* Core Synchronization action footer bar */}
            <div className="border-t border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setWorkflowStep(1)}
                  className="py-2.5 px-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-[#D4AF37] rtl:rotate-180" />
                  <span>{t("backToCaptureBtn")}</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-blue-500 shadow-[0_0_8px_#3b82f6]"}`} />
                  <span className="text-xs font-mono text-neutral-400 font-bold">
                    {isSupabaseConfigured 
                      ? t("supabaseOnline")
                      : t("supabaseOffline")}
                  </span>
                </div>
              </div>

              {/* Reset/Submit details */}
              <button
                type="submit"
                disabled={isSyncingSupabase || isUploadingImages}
                className="w-full sm:w-auto py-3 px-6 bg-[#D4AF37] text-black font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#ffe380] hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncingSupabase ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t("syncingPayload")}</span>
                  </>
                ) : isUploadingImages ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>{t("uploadingProfiles")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{t("completeStartNext")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Syncing Loading Overlay */}
            <AnimatePresence>
              {isSyncingSupabase && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/95 rounded-xl z-20 flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-4 border-t-[#D4AF37] animate-spin" />
                    <Database className="absolute h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-lg font-black font-display tracking-widest text-[#D4AF37] uppercase mb-1">
                    {t("syncingOverlayTitle")}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed">
                    {t("syncingOverlayDesc")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

        </div>
      )}

      {/* Global Session Records & Showroom Inventory Catalog */}
      <div className="w-full max-w-[1700px] mx-auto flex flex-col gap-6">

        {/* Historical Saved Batch Table Listing */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold font-display tracking-widest text-[#D4AF37] uppercase">
                  {t("sessionBatchLog")}
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  {t("trackingRecent")}
                </p>
              </div>

              <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 text-gray-300 py-1.5 px-3 rounded-full font-bold">
                {historyItems.length} {t("scannedThisShift")}
              </span>
            </div>

            {historyItems.length === 0 ? (
              <div className="py-12 text-center text-neutral-600 text-lg font-mono border-2 border-dashed border-neutral-800 rounded-2xl">
                {t("noFramesScanned")}
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[395px] pr-2 custom-slider-scroll">
                <table className="w-full text-left text-base font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400">
                      <th className="pb-3 font-bold uppercase text-sm">{t("tableFrameDetail")}</th>
                      <th className="pb-3 font-bold uppercase text-sm pl-4 text-center">{t("tableMeasurements")}</th>
                      <th className="pb-3 font-bold uppercase text-sm text-center">{t("tableMedia")}</th>
                      <th className="pb-3 font-bold uppercase text-sm pr-4 text-right">{t("tablePrice")}</th>
                      <th className="pb-3 font-bold uppercase text-sm text-center">{t("tableStatus")}</th>
                      <th className="pb-3 font-bold uppercase text-sm text-right">{t("tableAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {historyItems.map((item) => (
                      <tr key={item.id} className="text-gray-300 group hover:bg-neutral-900/45 transition-colors">
                        <td className="py-4 pr-3">
                          <span className="font-extrabold text-white block truncate max-w-[200px] md:max-w-[280px] text-lg">
                            {item.frame_name}
                          </span>
                          <span className="text-sm text-neutral-400 block uppercase font-bold mt-1">
                            {item.brand} • {item.material} • {item.timestamp}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-center font-bold text-neutral-100 text-lg">
                          {item.front_size || "?"}-{item.bridge_size || "?"}-{item.temple_length || "?"}
                        </td>
                        <td className="py-4 text-center text-neutral-400 text-base">
                          {item.images_count}/4 {language === "ar" ? "لقطات" : "snaps"}
                        </td>
                        <td className="py-4 pr-4 text-right font-extrabold text-neutral-200 text-lg">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${
                            item.synced 
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-950" 
                              : "bg-blue-950/40 text-blue-400 border border-blue-900/80"
                          }`}>
                            {item.synced ? (language === "ar" ? "مزامَن" : "Synced") : (language === "ar" ? "مخزن محلياً" : "Local Saved")}
                          </span>
                        </td>
                        <td className="py-4 text-right pl-4">
                          <button
                            type="button"
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-2 px-3 rounded-lg bg-red-950/45 hover:bg-red-900/60 border border-red-900/60 text-red-400 hover:text-red-100 transition-all font-mono text-xs font-black flex items-center gap-1.5 ml-auto cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                            <span>{t("deleteButton")}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>



          {/* Shop Global Inventory Section - Real persistent library */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mt-6" id="shop-catalog-inventory">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-neutral-900 pb-3 mb-4 gap-4">
              <div>
                <h3 className="text-sm font-bold font-display tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                  {language === "ar" ? "مخزون فرع المنيرالجامعه الاردنية" : "ALMONEER UNIVERSITY OF JORDAN INVENTORY"}
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  {language === "ar" 
                    ? "الكتالوج الكامل للإطارات" 
                    : "Complete Catalog of frames"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input Bar */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500 pointer-events-none">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder={language === "ar" ? "ابحث عن ماركة، موديل..." : "Search brand, model..."}
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-neutral-500 transition-all outline-none"
                  />
                </div>

                <span className="text-xs font-mono bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] py-1.5 px-3 rounded-full font-bold">
                  {filteredInventory.length} {language === "ar" ? "إطاراً مطابقاً" : "Matched"}
                </span>
                <button
                  onClick={fetchShopInventory}
                  type="button"
                  className="p-1.5 px-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reload Registry"
                >
                  {isLoadingShopInventory ? (
                    <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
                  ) : (
                    <span>🔄 {language === "ar" ? "تحديث" : "Refresh"}</span>
                  )}
                </button>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="py-16 text-center text-neutral-600 text-lg font-mono border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                {language === "ar" 
                  ? "لا توجد نظارات مطابقة في المستودع حالياً." 
                  : "No matching frames found. Refine your search query or capture a new frame above."}
              </div>
            ) : (
              <>
                {/* LAPTOPS AND TABLETS VIEW (md breakpoint and up) */}
                <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[515px] pr-2 custom-slider-scroll">
                  <table className="w-full text-left text-base font-mono border-collapse" id="shop-catalog-table">
                    <thead>
                      <tr className="border-b border-neutral-850 text-neutral-400 uppercase text-xs">
                        <th className="pb-4 font-bold">{language === "ar" ? "صورة وتفاصيل الموديل" : "Item Photo / Brand / Model"}</th>
                        <th className="pb-4 font-bold text-center">{language === "ar" ? "كود اللون" : "Color Code"}</th>
                        <th className="pb-4 font-bold text-center">{language === "ar" ? "الأبعاد والقياسات" : "Sizes (L-N-A)"}</th>
                        <th className="pb-4 font-bold text-center">{language === "ar" ? "الوحدات المتوفرة" : "Stock Units"}</th>
                        <th className="pb-4 font-bold text-right pr-6">{language === "ar" ? "السعر المعروض" : "Retail Price"}</th>
                        <th className="pb-4 font-bold text-right">{language === "ar" ? "الإجراءات" : "Database Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 border-b border-neutral-900">
                      {filteredInventory.map((item) => {
                        const colorCode = item.color_code || "C-101";
                        const stockVal = item.stock !== undefined ? item.stock : 12;
                        return (
                          <tr key={item.id} className="text-gray-300 group hover:bg-neutral-900/40 transition-colors border-b border-neutral-900/60">
                            {/* Item Photo / Brand / Model */}
                            <td className="py-4">
                              <div className="flex items-center gap-4">
                                <div 
                                  onClick={() => item.preview_url && setLightboxImage(item.preview_url)}
                                  className="h-28 w-44 relative bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0 cursor-zoom-in hover:border-[#D4AF37]/45 transition-colors"
                                  title={language === "ar" ? "اضغط للتكبير" : "Click to view full screen"}
                                >
                                  {item.preview_url ? (
                                    <img 
                                      src={item.preview_url} 
                                      alt={item.frame_name}
                                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-neutral-600 scale-90">
                                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span className="text-[8px] uppercase mt-0.5 font-bold">No Image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <span className="font-extrabold text-white text-base block group-hover:text-[#D4AF37] transition-colors truncate max-w-[200px]">
                                    {item.brand} {item.model_name}
                                  </span>
                                  <span className="text-[11px] text-neutral-400 block uppercase tracking-wider font-bold mt-0.5">
                                    ID: {item.id} • {item.material || "Acetate"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Color Code */}
                            <td className="py-4 text-center font-bold text-neutral-300">
                              <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs">
                                {colorCode}
                              </span>
                            </td>

                            {/* Sizes */}
                            <td className="py-4 text-center">
                              <div className="inline-flex flex-col items-center justify-center bg-neutral-900/50 rounded-xl px-4 py-1.5 border border-neutral-850">
                                <span className="font-extrabold text-white text-sm">
                                  {item.front_size || "?"} - {item.bridge_size || "?"} - {item.temple_length || "?"}
                                </span>
                                <span className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-widest leading-none mt-0.5 font-bold">
                                  Lens-Nose-Arm
                                </span>
                              </div>
                            </td>

                            {/* Stock Units (with Increment/Decrement) */}
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-850">
                                <button
                                  type="button"
                                  onClick={() => updateStock(item.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                                >
                                  -
                                </button>
                                <span className="min-w-[24px] text-center font-bold text-white text-xs">
                                  {stockVal}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateStock(item.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-[#D4AF37] transition-colors cursor-pointer text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-4 text-right pr-6 text-base font-bold font-mono text-[#D4AF37]">
                              ${typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
                            </td>

                            {/* Action Button */}
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => deleteShopItem(item.id)}
                                className="p-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-900/70 border border-red-900/40 text-red-400 hover:text-red-100 transition-all font-mono text-xs font-black flex items-center gap-1.5 ml-auto cursor-pointer"
                                title="Delete Frame"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{language === "ar" ? "حذف" : "Delete"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE SMARTPHONES VIEW (below md breakpoint) */}
                <div className="md:hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredInventory.map((item, idx) => {
                      const colorCode = item.color_code || "C-101";
                      const stockVal = item.stock !== undefined ? item.stock : 12;
                      return (
                        <div 
                          key={item.id} 
                          className="bg-neutral-900/40 border border-neutral-850/80 rounded-2xl p-3.5 flex flex-col gap-3 relative shadow-lg"
                        >
                          {/* Top row: Left (square thumbnail), Right (typography details) */}
                          <div className="flex gap-3">
                            {/* Left: Wide Aspect Thumbnail */}
                            <div 
                              onClick={() => item.preview_url && setLightboxImage(item.preview_url)}
                              className="w-36 h-24 shrink-0 bg-neutral-950/45 border border-neutral-800/80 rounded-xl overflow-hidden flex items-center justify-center p-1 shadow-inner cursor-zoom-in hover:border-[#D4AF37]/45 transition-colors"
                              title={language === "ar" ? "اضغط للتكبير" : "Click to view full screen"}
                            >
                              {item.preview_url ? (
                                <img 
                                  src={item.preview_url} 
                                  alt={item.frame_name}
                                  className="w-full h-full object-contain filter brightness-95 hover:scale-105 transition-transform duration-300" 
                                  loading="lazy" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-neutral-600 scale-75">
                                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span className="text-[8px] uppercase mt-1 font-bold">No Image</span>
                                </div>
                              )}
                            </div>

                            {/* Right: Descriptive Frame Typography */}
                            <div className="flex flex-col justify-between overflow-hidden">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#D4AF37] font-black block">
                                  {item.brand}
                                </span>
                                <h3 className="text-xs font-bold text-neutral-150 leading-snug truncate">
                                  {item.model_name}
                                </h3>
                                <span className="text-[10px] font-mono text-neutral-500 block truncate">
                                  {item.material || "Acetate"}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500 block">
                                  {language === "ar" ? "كود اللون: " : "Color: "} <span className="text-neutral-300 font-bold">{colorCode}</span>
                                </span>
                              </div>

                              {/* Dimension Specs */}
                              <div className="text-[9px] font-mono text-[#D4AF37] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850/60 inline-block self-start mt-1">
                                {item.front_size || "?"} - {item.bridge_size || "?"} - {item.temple_length || "?"}
                              </div>
                            </div>
                          </div>

                          {/* Price and Stock Status */}
                          <div className="flex items-center justify-between border-t border-neutral-900 pt-2 text-xs font-mono">
                            <span className="text-[#D4AF37] font-black">
                              ${typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
                            </span>
                            <span className="text-neutral-500 text-[10px]">
                              ID: <span className="text-neutral-400 font-bold">{String(item.id).substring(0, 10)}</span>
                            </span>
                          </div>

                          {/* Bottom Row: Increment Controls + Database Action Button */}
                          <div className="flex items-center justify-between gap-2 border-t border-neutral-900 pt-2.5 mt-auto">
                            {/* Stock Increment / Decrement Counter */}
                            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-850">
                              <button
                                type="button"
                                onClick={() => updateStock(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                              >
                                -
                              </button>
                              <span className="min-w-[24px] text-center font-bold text-white text-xs">
                                {stockVal}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateStock(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-[#D4AF37] transition-colors cursor-pointer text-sm font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Delete Action Button */}
                            <button
                              type="button"
                              onClick={() => deleteShopItem(item.id)}
                              className="p-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-900/60 border border-red-900/40 text-red-400 hover:text-red-100 transition-all font-mono text-xs font-black flex items-center gap-1 cursor-pointer"
                              title="Delete Frame"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{language === "ar" ? "حذف" : "Delete"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* Portal Static Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0c0c0c] px-6 py-12 text-center text-sm font-mono text-gray-400">
        <div className="max-w-[1700px] mx-auto flex flex-col items-center justify-center gap-6">
          <p>{t("footerCopy")}</p>
        </div>
      </footer>

      {/* Global Luxury Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-12 left-1/2 z-50 px-10 py-6 rounded-2xl shadow-2xl border text-xl font-bold flex items-center gap-5 backdrop-blur-md ${
              toastType === "success"
                ? "bg-emerald-950/95 text-emerald-300 border-emerald-800"
                : toastType === "error"
                  ? "bg-red-950/95 text-red-300 border-red-900"
                  : "bg-neutral-900/95 text-[#D4AF37] border-[#D4AF37]/60"
            }`}
          >
            {toastType === "success" && <CheckCircle className="h-8 w-8 text-emerald-400 shrink-0" />}
            {toastType === "error" && <AlertTriangle className="h-8 w-8 text-red-400 shrink-0" />}
            {toastType === "info" && <Sparkles className="h-8 w-8 text-[#D4AF37] shrink-0 animate-pulse" />}
            
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX OVERLAY MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8 cursor-zoom-out backdrop-blur-md animate-fade-in"
            id="global-showroom-lightbox"
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
                alt="Eyeglass Preview Zoomed" 
                className="max-w-full max-h-full object-contain filter brightness-105 rounded-lg select-none animate-scale-up"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
