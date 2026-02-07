"use client";

import { useId } from "react";

interface MiniGaugeProps {
  percentage: number;
  size?: "xs" | "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

/**
 * Mini gauge component displaying a semi-circular progress indicator
 * with a gradient from green (soft) to red (hard)
 */
export function MiniGauge({ 
  percentage, 
  size = "sm", 
  showLabels = false,
  className = "" 
}: MiniGaugeProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Calculate needle angle: -135° at 0%, +135° at 100% (270° total arc)
  const needleAngle = -135 + (clampedPercentage / 100) * 270;
  
  // Size configurations
  const sizeConfig = {
    xs: { width: 24, height: 24, strokeWidth: 3, needleHeight: 6, labelSize: "text-[6px]" },
    sm: { width: 36, height: 36, strokeWidth: 4, needleHeight: 10, labelSize: "text-[8px]" },
    md: { width: 56, height: 56, strokeWidth: 5, needleHeight: 16, labelSize: "text-xs" },
  };
  
  const config = sizeConfig[size];
  
  // Arc length calculation: circumference of 270° arc with radius 40
  const arcLength = (270 / 360) * 2 * Math.PI * 40; // ~188
  const progressLength = (clampedPercentage / 100) * arcLength;
  
  // Generate unique gradient ID to avoid conflicts
  const gradientId = useId();

  return (
    <div className={`relative ${className}`} style={{ width: config.width, height: config.height }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke="#27272a"
          strokeWidth={config.strokeWidth * 2}
          strokeLinecap="round"
        />
        {/* Progress arc with gradient */}
        <path
          d="M 15 75 A 40 40 0 1 1 85 75"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth * 2}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${arcLength}`}
          className="transition-all duration-300"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Needle indicator */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div 
          className="bg-white rounded-full origin-bottom"
          style={{ 
            width: size === "xs" ? 1 : 2, 
            height: config.needleHeight,
            transform: "translateY(-25%)"
          }} 
        />
      </div>
      
      {/* Labels */}
      {showLabels && size !== "xs" && (
        <>
          <span className={`absolute bottom-0 left-0 ${config.labelSize} text-emerald-400 font-medium`}>
            S
          </span>
          <span className={`absolute bottom-0 right-0 ${config.labelSize} text-red-400 font-medium`}>
            D
          </span>
        </>
      )}
    </div>
  );
}
