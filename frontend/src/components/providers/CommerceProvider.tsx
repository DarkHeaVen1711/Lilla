"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";

import type { CommerceProduct } from "@/lib/homepageData";

type CommerceContextValue = {
  favoriteItems: CommerceProduct[];
  favoriteCount: number;
  toggleFavorite: (product: CommerceProduct) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

const FAVORITES_STORAGE_KEY = "adb-cosmetic-theme-favorites";

function readStorage<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, value: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

export function CommerceProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [favoriteItems, setFavoriteItems] = useState<CommerceProduct[]>([]);
  const user = useStore((s) => s.user);

  useEffect(() => {
    const syncFavorites = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const dbFavorites = await res.json();
        const dbProductIds = dbFavorites.map((f: any) => f.product.id);

        const localFavs = readStorage<CommerceProduct>(FAVORITES_STORAGE_KEY);
        for (const localFav of localFavs) {
          if (!dbProductIds.includes(localFav.id)) {
            await fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product_id: localFav.id }),
            });
          }
        }

        const finalRes = await fetch("/api/favorites");
        if (finalRes.ok) {
          const finalFavs = await finalRes.json();
          setFavoriteItems(finalFavs.map((f: any) => f.product));
        }
      } catch (err) {
        console.error("Failed to sync favorites:", err);
      }
    };
    syncFavorites();
  }, [user]);

  useEffect(() => {
    setFavoriteItems(readStorage<CommerceProduct>(FAVORITES_STORAGE_KEY));
  }, []);

  useEffect(() => {
    writeStorage(FAVORITES_STORAGE_KEY, favoriteItems);
  }, [favoriteItems]);



  const toggleFavorite = async (product: CommerceProduct) => {
    const exists = favoriteItems.some((item) => item.id === product.id);
    setFavoriteItems((current) =>
      exists
        ? current.filter((item) => item.id !== product.id)
        : [...current, product],
    );

    if (user) {
      try {
        if (exists) {
          await fetch(`/api/favorites/${product.id}`, { method: "DELETE" });
        } else {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: product.id }),
          });
        }
      } catch (err) {
        console.error("Failed to update favorite on backend:", err);
      }
    }
  };

  const clearFavorites = async () => {
    setFavoriteItems([]);
    if (user) {
      try {
        await fetch("/api/favorites", { method: "DELETE" });
      } catch (err) {
        console.error("Failed to clear favorites on backend:", err);
      }
    }
  };

  const value = useMemo<CommerceContextValue>(
    () => ({
      favoriteItems,
      favoriteCount: favoriteItems.length,
      toggleFavorite,
      isFavorite: (productId: string) =>
        favoriteItems.some((item) => item.id === productId),
      clearFavorites,
    }),
    [favoriteItems],
  );

  return (
    <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);

  if (!context) {
    throw new Error("useCommerce must be used within a CommerceProvider");
  }

  return context;
}
