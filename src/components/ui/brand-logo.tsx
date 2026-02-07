"use client";

import { useState } from "react";
import Image from "next/image";
import { getBrandLogo, getBrandColor, getBrandInitials } from "@/lib/brand-logos";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

const imageSizes = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export function BrandLogo({ brand, size = "md", className }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getBrandLogo(brand);
  const brandColor = getBrandColor(brand);
  const initials = getBrandInitials(brand);

  if (!logoUrl || hasError) {
    // Fallback: afficher les initiales avec la couleur de la marque
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center text-white font-bold shadow-md",
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: brandColor }}
      >
        <span className={cn(
          size === "sm" && "text-[10px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
          size === "xl" && "text-base",
        )}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden shadow-md",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src={logoUrl}
        alt={`${brand} logo`}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className="object-cover w-full h-full"
        onError={() => setHasError(true)}
        unoptimized // Pour les images externes
      />
    </div>
  );
}
