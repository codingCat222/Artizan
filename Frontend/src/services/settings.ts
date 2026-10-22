import { api } from "../lib/api";
import { Settings } from "../types/entities";

export const settingsApi = {
    get: async () => (await api<{ settings: Settings }>("/settings")).settings,
    update: async (s: Settings) => (await api<{ settings: Settings }>("/settings", { method: "PUT", body: s })).settings,
};