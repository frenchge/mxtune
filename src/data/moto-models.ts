// Base de données des modèles de motos par marque
// Années disponibles de 1970 à 2026 pour supporter les motos anciennes
const FULL_YEARS = Array.from({ length: 57 }, (_, i) => 2026 - i); // 2026 à 1970

// Suspensions d'origine par marque (généralisées par marque, peut être affiné par modèle)
export interface StockSuspension {
  forkBrand: string;
  forkModel: string;
  shockBrand: string;
  shockModel: string;
  notes?: string;
  // Default click ranges (standard for most bikes)
  maxForkCompression: number;
  maxForkRebound: number;
  maxShockCompressionLow: number;
  maxShockCompressionHigh: number;
  maxShockRebound: number;
  // Stock baseline settings (middle-ish values)
  baseForkCompression: number;
  baseForkRebound: number;
  baseShockCompressionLow: number;
  baseShockCompressionHigh: number;
  baseShockRebound: number;
}

// Suspensions stock par marque (valeurs par défaut pour la marque)
export const STOCK_SUSPENSIONS: Record<string, StockSuspension> = {
  KTM: {
    forkBrand: "WP",
    forkModel: "XACT 48",
    shockBrand: "WP",
    shockModel: "XACT",
    notes: "Suspensions WP XACT d'origine sur tous les modèles récents",
    maxForkCompression: 25,
    maxForkRebound: 25,
    maxShockCompressionLow: 25,
    maxShockCompressionHigh: 2, // Tours HV
    maxShockRebound: 25,
    baseForkCompression: 12,
    baseForkRebound: 12,
    baseShockCompressionLow: 12,
    baseShockCompressionHigh: 1,
    baseShockRebound: 12,
  },
  Husqvarna: {
    forkBrand: "WP",
    forkModel: "XACT 48",
    shockBrand: "WP",
    shockModel: "XACT",
    notes: "Suspensions WP XACT d'origine (même groupe que KTM)",
    maxForkCompression: 25,
    maxForkRebound: 25,
    maxShockCompressionLow: 25,
    maxShockCompressionHigh: 2,
    maxShockRebound: 25,
    baseForkCompression: 12,
    baseForkRebound: 12,
    baseShockCompressionLow: 12,
    baseShockCompressionHigh: 1,
    baseShockRebound: 12,
  },
  GasGas: {
    forkBrand: "WP",
    forkModel: "XACT 48",
    shockBrand: "WP",
    shockModel: "XACT",
    notes: "Suspensions WP XACT d'origine (même groupe que KTM)",
    maxForkCompression: 25,
    maxForkRebound: 25,
    maxShockCompressionLow: 25,
    maxShockCompressionHigh: 2,
    maxShockRebound: 25,
    baseForkCompression: 12,
    baseForkRebound: 12,
    baseShockCompressionLow: 12,
    baseShockCompressionHigh: 1,
    baseShockRebound: 12,
  },
  Yamaha: {
    forkBrand: "KYB",
    forkModel: "SSS 48",
    shockBrand: "KYB",
    shockModel: "SSS",
    notes: "Suspensions Kayaba (KYB) SSS d'origine",
    maxForkCompression: 20,
    maxForkRebound: 20,
    maxShockCompressionLow: 20,
    maxShockCompressionHigh: 2,
    maxShockRebound: 20,
    baseForkCompression: 10,
    baseForkRebound: 10,
    baseShockCompressionLow: 10,
    baseShockCompressionHigh: 1,
    baseShockRebound: 10,
  },
  Honda: {
    forkBrand: "Showa",
    forkModel: "SFF-Air TAC / Coil",
    shockBrand: "Showa",
    shockModel: "Balance Free Rear Cushion",
    notes: "Suspensions Showa d'origine",
    maxForkCompression: 22,
    maxForkRebound: 22,
    maxShockCompressionLow: 22,
    maxShockCompressionHigh: 2,
    maxShockRebound: 22,
    baseForkCompression: 11,
    baseForkRebound: 11,
    baseShockCompressionLow: 11,
    baseShockCompressionHigh: 1,
    baseShockRebound: 11,
  },
  Kawasaki: {
    forkBrand: "Showa",
    forkModel: "SFF-Air TAC 49mm",
    shockBrand: "Showa",
    shockModel: "Uni-Trak",
    notes: "Suspensions Showa d'origine",
    maxForkCompression: 22,
    maxForkRebound: 22,
    maxShockCompressionLow: 22,
    maxShockCompressionHigh: 2,
    maxShockRebound: 22,
    baseForkCompression: 11,
    baseForkRebound: 11,
    baseShockCompressionLow: 11,
    baseShockCompressionHigh: 1,
    baseShockRebound: 11,
  },
  Suzuki: {
    forkBrand: "Showa",
    forkModel: "BFF 49mm",
    shockBrand: "Showa",
    shockModel: "BFRC",
    notes: "Suspensions Showa Balance Free d'origine",
    maxForkCompression: 22,
    maxForkRebound: 22,
    maxShockCompressionLow: 22,
    maxShockCompressionHigh: 2,
    maxShockRebound: 22,
    baseForkCompression: 11,
    baseForkRebound: 11,
    baseShockCompressionLow: 11,
    baseShockCompressionHigh: 1,
    baseShockRebound: 11,
  },
  Beta: {
    forkBrand: "Sachs",
    forkModel: "48mm",
    shockBrand: "Sachs",
    shockModel: "Monoshock",
    notes: "Suspensions Sachs (ZF) d'origine",
    maxForkCompression: 25,
    maxForkRebound: 25,
    maxShockCompressionLow: 25,
    maxShockCompressionHigh: 2,
    maxShockRebound: 25,
    baseForkCompression: 12,
    baseForkRebound: 12,
    baseShockCompressionLow: 12,
    baseShockCompressionHigh: 1,
    baseShockRebound: 12,
  },
  Sherco: {
    forkBrand: "KYB",
    forkModel: "48mm",
    shockBrand: "KYB",
    shockModel: "Monoshock",
    notes: "Suspensions KYB d'origine (Factory: WP)",
    maxForkCompression: 20,
    maxForkRebound: 20,
    maxShockCompressionLow: 20,
    maxShockCompressionHigh: 2,
    maxShockRebound: 20,
    baseForkCompression: 10,
    baseForkRebound: 10,
    baseShockCompressionLow: 10,
    baseShockCompressionHigh: 1,
    baseShockRebound: 10,
  },
  TM: {
    forkBrand: "Kayaba",
    forkModel: "48mm",
    shockBrand: "Kayaba",
    shockModel: "Monoshock",
    notes: "Suspensions Kayaba d'origine",
    maxForkCompression: 20,
    maxForkRebound: 20,
    maxShockCompressionLow: 20,
    maxShockCompressionHigh: 2,
    maxShockRebound: 20,
    baseForkCompression: 10,
    baseForkRebound: 10,
    baseShockCompressionLow: 10,
    baseShockCompressionHigh: 1,
    baseShockRebound: 10,
  },
  Autre: {
    forkBrand: "Non spécifié",
    forkModel: "À renseigner",
    shockBrand: "Non spécifié",
    shockModel: "À renseigner",
    notes: "Renseigne les suspensions manuellement",
    maxForkCompression: 25,
    maxForkRebound: 25,
    maxShockCompressionLow: 25,
    maxShockCompressionHigh: 2,
    maxShockRebound: 25,
    baseForkCompression: 12,
    baseForkRebound: 12,
    baseShockCompressionLow: 12,
    baseShockCompressionHigh: 1,
    baseShockRebound: 12,
  }
};

// Fonction pour obtenir les suspensions stock d'une marque
export function getStockSuspension(brand: string): StockSuspension {
  return STOCK_SUSPENSIONS[brand] || STOCK_SUSPENSIONS["Autre"];
}

export const MOTO_DATA: Record<string, { models: string[]; years: number[] }> = {
  KTM: {
    models: [
      "125 SX", "150 SX", "250 SX", "250 SX-F", "350 SX-F", "450 SX-F",
      "125 XC", "250 XC", "250 XC-F", "300 XC", "350 XC-F", "450 XC-F",
      "150 XC-W", "250 XC-W", "300 XC-W", "350 XCF-W", "450 XCF-W", "500 XCF-W",
      "125 EXC", "250 EXC", "300 EXC", "350 EXC-F", "450 EXC-F", "500 EXC-F",
      "250 EXC TPI", "300 EXC TPI",
      "690 Enduro R", "790 Adventure", "890 Adventure",
      "50 SX", "65 SX", "85 SX",
      "Freeride 250 F", "Freeride 350", "Freeride E-XC",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Husqvarna: {
    models: [
      "TC 125", "TC 250", "FC 250", "FC 350", "FC 450",
      "TE 150i", "TE 250i", "TE 300i", "FE 250", "FE 350", "FE 450", "FE 501",
      "TX 125", "TX 300i", "FX 350", "FX 450",
      "TC 50", "TC 65", "TC 85",
      "701 Enduro", "701 Supermoto",
      "Norden 901",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  GasGas: {
    models: [
      "MC 125", "MC 250", "MC 250F", "MC 350F", "MC 450F",
      "EC 250", "EC 300", "EC 250F", "EC 350F", "EC 450F", "EC 500F",
      "EX 250", "EX 300", "EX 250F", "EX 350F", "EX 450F",
      "MC 50", "MC 65", "MC 85",
      "ES 700", "SM 700",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Yamaha: {
    models: [
      "YZ125", "YZ250", "YZ250F", "YZ450F",
      "YZ125X", "YZ250X", "YZ250FX", "YZ450FX",
      "WR250F", "WR450F",
      "WR250R", "WR250X",
      "YZ65", "YZ85",
      "TT-R50E", "TT-R110E", "TT-R125LE", "TT-R230",
      "Ténéré 700", "Ténéré 700 World Raid",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Honda: {
    models: [
      "CRF150R", "CRF250R", "CRF450R", "CRF450RWE",
      "CRF250RX", "CRF450RX",
      "CRF250X", "CRF450X",
      "CRF250L", "CRF300L",
      "CRF50F", "CRF110F", "CRF125F", "CRF230F",
      "CRF450RL",
      "XR650L",
      "Africa Twin CRF1100L",
      "XR250R", "XR400R", "XR600R",
      "CR125", "CR250", "CR500",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Kawasaki: {
    models: [
      "KX65", "KX85", "KX112", "KX250", "KX450",
      "KX250X", "KX450X",
      "KLX110R", "KLX140R", "KLX230R", "KLX300R",
      "KLX230", "KLX300",
      "KLR650",
      "KX125", "KX500",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Suzuki: {
    models: [
      "RM-Z250", "RM-Z450",
      "RM85",
      "DR-Z125L", "DR-Z250", "DR-Z400S", "DR-Z400SM",
      "DR650S",
      "V-Strom 650", "V-Strom 1050",
      "RM125", "RM250",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Beta: {
    models: [
      "RR 125 2T", "RR 200 2T", "RR 250 2T", "RR 300 2T",
      "RR 350 4T", "RR 390 4T", "RR 430 4T", "RR 480 4T",
      "X-Trainer 250", "X-Trainer 300",
      "RR 125 4T Racing",
      "EVO 125", "EVO 200", "EVO 250", "EVO 300",
      "Xtrainer 250", "Xtrainer 300",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  Sherco: {
    models: [
      "SE 125 Factory", "SE 250 Factory", "SE 300 Factory",
      "SEF 250 Factory", "SEF 300 Factory", "SEF 450 Factory", "SEF 500 Factory",
      "SC 125", "SC 250", "SC 300",
      "SCF 250", "SCF 300", "SCF 450",
      "Trial ST 125", "Trial ST 250", "Trial ST 300",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  TM: {
    models: [
      "MX 85", "MX 100", "MX 125", "MX 144", "MX 250", "MX 300",
      "MX 250 Fi", "MX 300 Fi", "MX 450 Fi", "MX 530 Fi",
      "EN 125", "EN 144", "EN 250", "EN 300",
      "EN 250 Fi", "EN 300 Fi", "EN 450 Fi", "EN 530 Fi",
      "Autre modèle"
    ],
    years: FULL_YEARS
  },
  // Marque générique pour les motos non listées
  Autre: {
    models: ["Modèle personnalisé"],
    years: FULL_YEARS
  }
};

export const BRANDS = Object.keys(MOTO_DATA);

export function getModelsForBrand(brand: string): string[] {
  return MOTO_DATA[brand]?.models || ["Autre modèle"];
}

export function getYearsForBrand(brand: string): number[] {
  return MOTO_DATA[brand]?.years || FULL_YEARS;
}
