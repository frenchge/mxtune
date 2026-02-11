export const GEOGRAPHIC_ZONES = [
  { value: "idf", label: "Ile-de-France" },
  { value: "nord-france", label: "Nord France" },
  { value: "ouest-france", label: "Ouest France" },
  { value: "est-france", label: "Est France" },
  { value: "sud-france", label: "Sud France" },
  { value: "europe", label: "Europe" },
  { value: "amerique-nord", label: "Amerique du Nord" },
  { value: "amerique-sud", label: "Amerique du Sud" },
  { value: "afrique", label: "Afrique" },
  { value: "asie-oceanie", label: "Asie / Oceanie" },
] as const;

export const getGeographicZoneLabel = (value?: string) => {
  if (!value) return undefined;
  return GEOGRAPHIC_ZONES.find((zone) => zone.value === value)?.label || value;
};
