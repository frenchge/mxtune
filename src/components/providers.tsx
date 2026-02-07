"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { frFR } from "@clerk/localizations";
import { SidebarStateProvider } from "@/hooks/use-sidebar-state";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={frFR}
      appearance={{
        variables: {
          colorPrimary: "#a855f7",
          colorBackground: "#18181b",
          colorInputBackground: "#27272a",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextOnPrimaryBackground: "#ffffff",
          colorTextSecondary: "#a1a1aa",
          colorDanger: "#ef4444",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorNeutral: "#ffffff",
        },
        elements: {
          formButtonPrimary: "bg-purple-500 hover:bg-purple-600",
          card: "bg-zinc-900 border-zinc-800",
          userButtonPopoverCard: "bg-zinc-900 border-zinc-800",
          userButtonPopoverActionButton: "text-white hover:bg-zinc-800",
          userButtonPopoverActionButtonText: "text-white",
          userButtonPopoverFooter: "hidden",
          userButtonPopoverMain: "bg-zinc-900",
          userPreviewMainIdentifier: "text-white",
          userPreviewSecondaryIdentifier: "text-zinc-400",
          menuList: "bg-zinc-900",
          menuItem: "text-white hover:bg-zinc-800",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SidebarStateProvider>
          {children}
        </SidebarStateProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
