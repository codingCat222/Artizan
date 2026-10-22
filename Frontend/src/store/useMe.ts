import { Artisan } from "../types/entities";
import { useAuth } from "./AuthContext";
import { useStore } from "./AppStore";

/**
 * The signed-in artisan's record. Only valid inside the artisan portal.
 *
 * TODO: replace with a call to the artisans API (GET /api/artisans/me) once that
 * module exists. Until then, real accounts (whose ids come from the database) are
 * not in the mock store, so we fall back to a minimal record built from the session
 * instead of crashing the portal.
 */
export function useMe(): Artisan {
  const { session } = useAuth();
  const { artisans } = useStore();
  const mock = artisans.find((a) => a.id === session?.artisanId);
  if (mock) return mock;
  if (!session || !session.artisanId) throw new Error("No artisan session");
  return {
    id: session.artisanId,
    name: session.name,
    email: session.email,
    avatarInitials: session.initials,
    association: session.association ?? "",
    category: "",
    town: "",
    area: "",
    phone: "",
    status: "Active",
    verification: "Unverified",
    joined: "",
    businessName: session.name,
    businessDescription: "",
    createdAt: new Date().toISOString(),
    createdBy: "—",
    mustChangePassword: false,
    documents: [],
  };
}