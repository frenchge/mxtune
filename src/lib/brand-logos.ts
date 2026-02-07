// Mapping des logos de marques de motos via logo.dev API

const LOGO_DEV_PUBLIC_KEY = 'pk_DSwzvvdvSTedT76mfmT1UA';

// Domaines des marques pour logo.dev
export const BRAND_DOMAINS: Record<string, string> = {
  KTM: "ktm.com",
  Husqvarna: "husqvarna-motorcycles.com",
  GasGas: "gasgas.com",
  Yamaha: "yamaha.com",
  Honda: "global.honda",
  Kawasaki: "kawasaki.eu",
  Suzuki: "globalsuzuki.com",
  Beta: "betamotor.com",
  Sherco: "sherco.com",
  TM: "tmracing.it",
};

export function getBrandLogo(brand: string): string | null {
  const domain = BRAND_DOMAINS[brand];
  if (!domain) return null;
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`;
}

// Couleurs de marque pour le fallback
export const BRAND_COLORS: Record<string, string> = {
  KTM: "#FF6600",
  Husqvarna: "#FECE00",
  GasGas: "#E41E2C",
  Yamaha: "#0033A0",
  Honda: "#CC0000",
  Kawasaki: "#6ABF4B",
  Suzuki: "#004D9F",
  Beta: "#E30613",
  Sherco: "#0057A6",
  TM: "#0066CC",
};

export function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] || "#a855f7"; // Default to purple
}

// Initiales pour le fallback
export function getBrandInitials(brand: string): string {
  if (brand === "GasGas") return "GG";
  if (brand === "Husqvarna") return "HQ";
  return brand.slice(0, 2).toUpperCase();
}
