import { useMemo } from "react";
import { useStore } from "./AppStore";
import { useAuth } from "./AuthContext";

/**
 * Association heads only ever see their own association's records.
 * NOTE: this is a UI convenience. The backend must enforce the same rule (FRD 5.7, AC-006).
 */
export function useScope() {
  const { session } = useAuth();
  const { artisans, payments } = useStore();
  const isHead = session?.role === "ASSOCIATION_HEAD";
  const association = session?.association;
  return useMemo(() => {
    const a = isHead ? artisans.filter((x) => x.association === association) : artisans;
    const ids = new Set(a.map((x) => x.id));
    return {
      isHead,
      association,
      artisans: a,
      payments: isHead ? payments.filter((p) => ids.has(p.artisanId)) : payments,
      canAccess: (artisanAssociation: string) => !isHead || artisanAssociation === association,
    };
  }, [isHead, association, artisans, payments]);
}
