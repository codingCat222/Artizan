import { useAuth } from "./AuthContext";
import { useStore } from "./AppStore";

/** The signed-in artisan's record. Only valid inside the artisan portal. */
export function useMe() {
  const { session } = useAuth();
  const { artisans } = useStore();
  const me = artisans.find((a) => a.id === session?.artisanId);
  if (!me) throw new Error("No artisan session");
  return me;
}
