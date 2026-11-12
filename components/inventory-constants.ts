export interface PhotoStep {
  idx: number;
  label: string;
  indicator: string;
  type: "catalog" | "stamp";
}

export const CAPTURE_STEPS: PhotoStep[] = [
  { idx: 1, label: "CAPTURE FRAME FRONT ANGLE (Saves to Database)", indicator: "Front View", type: "catalog" },
  { idx: 2, label: "CAPTURE FRAME SIDE PROFILE (Saves to Database)", indicator: "Side Profile", type: "catalog" },
  { idx: 3, label: "VIEWING INNER LEFT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Left Temple", type: "stamp" },
  { idx: 4, label: "VIEWING INNER RIGHT TEMPLE STAMP (Temporary - Use to fill form)", indicator: "Right Temple", type: "stamp" }
];

export interface Snapshot {
  stepIdx: number;
  label: string;
  blobUrl: string | null;
  cloudinaryUrl: string | null;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadError?: string;
}

export interface SavedRecord {
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

export interface MaterialItem {
  name: string;
  description: string;
}

export interface MaterialCategory {
  categoryName: string;
  categoryDesc: string;
  items: MaterialItem[];
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
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

export const STATIC_INITIAL_SAMPLES = [
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

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function generateTmpId(): string {
  return `tmp-${Date.now()}`;
}
