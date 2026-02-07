"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useCurrentUser() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      upsertUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "Utilisateur",
        username: clerkUser.username || undefined,
        imageUrl: clerkUser.imageUrl,
      });
    }
  }, [isLoaded, isSignedIn, clerkUser, upsertUser]);

  return {
    user: convexUser,
    clerkUser,
    isLoaded,
    isSignedIn,
  };
}
