// Base de données des marques et modèles de suspension aftermarket

export interface SuspensionModel {
  name: string;
  type: "fork" | "shock" | "both";
  notes?: string;
}

export interface SuspensionBrand {
  name: string;
  country: string;
  forkModels: string[];
  shockModels: string[];
}

// Marques de suspension aftermarket avec leurs modèles
export const AFTERMARKET_SUSPENSION_BRANDS: SuspensionBrand[] = [
  {
    name: "WP",
    country: "Autriche",
    forkModels: [
      "XACT Pro 7548",
      "XACT Pro 7500",
      "XACT 48",
      "XACT 43",
      "Cone Valve",
      "Trax",
      "AER 48",
      "USD 48",
    ],
    shockModels: [
      "XACT Pro 8950",
      "XACT Pro 8946",
      "XACT",
      "Trax",
      "PDS",
      "Linkage Shock",
    ],
  },
  {
    name: "Öhlins",
    country: "Suède",
    forkModels: [
      "RXF 48",
      "RXF 36",
      "TTX 22",
      "FGR 300",
      "FKR 250",
      "FGRT 214",
      "NIX 30",
    ],
    shockModels: [
      "TTX Flow",
      "TTX GP",
      "TTX 36",
      "TTX 22",
      "STX 46",
      "STX 36",
      "S46DR1",
      "S46HR1",
    ],
  },
  {
    name: "KYB",
    country: "Japon",
    forkModels: [
      "PSF-2 Pro",
      "PSF-2",
      "SSS 48",
      "SSS 43",
      "Factory Kit",
      "Coil Spring Kit",
      "A-Kit",
    ],
    shockModels: [
      "Factory Shock",
      "SSS",
      "A-Kit",
      "Factory Service",
      "HPD Shock",
    ],
  },
  {
    name: "Showa",
    country: "Japon",
    forkModels: [
      "SFF-Air TAC",
      "SFF-Air",
      "A-Kit Spring",
      "Triple Air",
      "Balance Free Fork",
      "BPF-C 49",
      "BPF-C 43",
    ],
    shockModels: [
      "BFRC (Balance Free)",
      "BFRC-Lite",
      "A-Kit",
      "Factory Shock",
      "SFF Shock",
    ],
  },
  {
    name: "Sachs (ZF)",
    country: "Allemagne",
    forkModels: [
      "CC 48",
      "CC 43",
      "Closed Cartridge",
      "Open Cartridge",
    ],
    shockModels: [
      "Racing Shock",
      "Monoshock",
      "Factory Spec",
    ],
  },
  {
    name: "Kayaba",
    country: "Japon",
    forkModels: [
      "PSF-2",
      "SSS 48",
      "SSS 43",
      "Spring Fork",
    ],
    shockModels: [
      "Factory",
      "SSS",
      "Mono",
    ],
  },
  {
    name: "Marzocchi",
    country: "Italie",
    forkModels: [
      "Bomber Z1",
      "Shiver",
      "MX1",
      "USD 48",
    ],
    shockModels: [
      "Roco TST",
      "Roco",
    ],
  },
  {
    name: "RAD",
    country: "USA",
    forkModels: [
      "RAD Valve Fork",
      "RAD Factory Fork",
    ],
    shockModels: [
      "RAD Shock",
      "RAD Factory Shock",
    ],
  },
  {
    name: "Factory Connection",
    country: "USA",
    forkModels: [
      "FMGV",
      "SPGV",
      "Factory Fork Kit",
      "A-Mod Fork",
    ],
    shockModels: [
      "Factory Shock",
      "Race Shock",
      "A-Mod Shock",
    ],
  },
  {
    name: "Pro Circuit",
    country: "USA",
    forkModels: [
      "Spring Fork",
      "Factory Fork",
    ],
    shockModels: [
      "Factory Shock",
      "Race Shock",
      "Link Shock",
    ],
  },
  {
    name: "Enzo Racing",
    country: "USA",
    forkModels: [
      "ESP Fork",
      "Factory Fork",
    ],
    shockModels: [
      "Enzo Shock",
      "ESP Shock",
    ],
  },
  {
    name: "Penske",
    country: "USA",
    forkModels: [],
    shockModels: [
      "8760",
      "8770",
      "8780",
      "MX Shock",
    ],
  },
  {
    name: "Elka",
    country: "Canada",
    forkModels: [],
    shockModels: [
      "Stage 5",
      "Stage 4",
      "Stage 3",
      "Legacy",
    ],
  },
  {
    name: "Fox",
    country: "USA",
    forkModels: [
      "Podium",
      "Factory",
    ],
    shockModels: [
      "Podium RC2",
      "DHX",
      "Float X2",
    ],
  },
  {
    name: "Race Tech",
    country: "USA",
    forkModels: [
      "G3-S",
      "RT-S Cartridge",
      "Gold Valve Fork",
    ],
    shockModels: [
      "G3-S Shock",
      "Gold Valve Shock",
    ],
  },
  {
    name: "Motion Pro",
    country: "USA",
    forkModels: [
      "Fork Cartridge Kit",
    ],
    shockModels: [],
  },
  {
    name: "Andreani",
    country: "Italie",
    forkModels: [
      "Misano EVO",
      "Cartridge Kit",
      "Pressurized Fork Kit",
    ],
    shockModels: [
      "Andreani Shock",
    ],
  },
  {
    name: "Mupo",
    country: "Italie",
    forkModels: [
      "Mupo Fork Kit",
    ],
    shockModels: [
      "AB1",
      "AB1 EVO",
    ],
  },
  {
    name: "Bitubo",
    country: "Italie",
    forkModels: [
      "JBH Fork Kit",
    ],
    shockModels: [
      "XXF",
      "WME",
      "WMB",
    ],
  },
  {
    name: "YSS",
    country: "Thaïlande",
    forkModels: [
      "Fork Upgrade Kit",
    ],
    shockModels: [
      "MZ456",
      "MG456",
      "ME302",
    ],
  },
  {
    name: "Wilbers",
    country: "Allemagne",
    forkModels: [
      "Wilbers Fork Kit",
    ],
    shockModels: [
      "Wilbers 640",
      "Wilbers 641",
    ],
  },
  {
    name: "Matris",
    country: "Italie",
    forkModels: [
      "SDK Series",
    ],
    shockModels: [
      "M46K",
      "M46R",
    ],
  },
  {
    name: "Hyperpro",
    country: "Pays-Bas",
    forkModels: [
      "CSC Fork Cartridge",
      "Progressive Springs",
    ],
    shockModels: [
      "Hyperpro Shock",
      "Rising Rate",
    ],
  },
  {
    name: "K-Tech",
    country: "UK",
    forkModels: [
      "DDS Pro",
      "DDS",
      "Razor-R",
    ],
    shockModels: [
      "DDS Pro Shock",
      "35DDS",
      "Razor-R Shock",
    ],
  },
  {
    name: "Nitron",
    country: "UK",
    forkModels: [],
    shockModels: [
      "NTR R3",
      "NTR R2",
      "NTR R1",
    ],
  },
  {
    name: "EMC Suspension",
    country: "France",
    forkModels: [
      "EMC Fork Kit",
    ],
    shockModels: [
      "EMC Shock",
    ],
  },
  {
    name: "Technical Touch",
    country: "Pays-Bas",
    forkModels: [
      "TT Fork Kit",
    ],
    shockModels: [
      "TT Shock",
    ],
  },
  {
    name: "Extreme Shox",
    country: "France",
    forkModels: [
      "Extreme Fork",
    ],
    shockModels: [
      "Extreme Shock",
    ],
  },
];

// Helper functions
export function getAftermarketBrands(): string[] {
  return AFTERMARKET_SUSPENSION_BRANDS.map(b => b.name).sort();
}

export function getForkBrands(): string[] {
  return AFTERMARKET_SUSPENSION_BRANDS
    .filter(b => b.forkModels.length > 0)
    .map(b => b.name)
    .sort();
}

export function getShockBrands(): string[] {
  return AFTERMARKET_SUSPENSION_BRANDS
    .filter(b => b.shockModels.length > 0)
    .map(b => b.name)
    .sort();
}

export function getForkModelsForBrand(brand: string): string[] {
  const brandData = AFTERMARKET_SUSPENSION_BRANDS.find(b => b.name === brand);
  return brandData?.forkModels || [];
}

export function getShockModelsForBrand(brand: string): string[] {
  const brandData = AFTERMARKET_SUSPENSION_BRANDS.find(b => b.name === brand);
  return brandData?.shockModels || [];
}

// Get OEM suspension brand based on moto manufacturer
export function getOEMSuspensionBrand(motoBrand: string): { forkBrand: string; shockBrand: string } {
  const oemMapping: Record<string, { forkBrand: string; shockBrand: string }> = {
    KTM: { forkBrand: "WP", shockBrand: "WP" },
    Husqvarna: { forkBrand: "WP", shockBrand: "WP" },
    GasGas: { forkBrand: "WP", shockBrand: "WP" },
    Yamaha: { forkBrand: "KYB", shockBrand: "KYB" },
    Honda: { forkBrand: "Showa", shockBrand: "Showa" },
    Kawasaki: { forkBrand: "Showa", shockBrand: "Showa" },
    Suzuki: { forkBrand: "Showa", shockBrand: "Showa" },
    Beta: { forkBrand: "Sachs (ZF)", shockBrand: "Sachs (ZF)" },
    Sherco: { forkBrand: "KYB", shockBrand: "KYB" },
    TM: { forkBrand: "Kayaba", shockBrand: "Kayaba" },
  };
  
  return oemMapping[motoBrand] || { forkBrand: "", shockBrand: "" };
}
