import { Building2, CheckCircle2, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useApi } from "../../lib/useApi";
import { publicApi, whatsappLink } from "../../services/public";

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const { data: artisan, loading, error } = useApi(() => publicApi.profile(id!), [id]);

  if (loading && !artisan) return <div className="mx-auto max-w-xl px-6 py-24 text-center text-sm text-forest-700/60">Loading...</div>;

  // The server answers 404 for unknown AND unlisted artisans, so visitors can't tell the difference.
  if (!artisan)
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-forest-900">Profile not available</h1>
        <p className="mt-2 text-sm text-forest-700/60">{error || "This artisan is not currently listed in the public directory."}</p>
        <Link to="/search-results" className="mt-5 inline-block font-medium text-forest-600 hover:underline">Back to search</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/search-results" className="text-sm font-medium text-forest-600 hover:underline">← Back to results</Link>

      <div className="mt-4 rounded-2xl border border-forest-100 bg-white p-8 shadow-card">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-2xl font-bold text-white">{artisan.initials}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-forest-900">{artisan.name}</h1>
              <span className="flex items-center gap-1 rounded-full bg-fresh-50 px-2.5 py-1 text-xs font-semibold text-fresh-600">
                <CheckCircle2 size={13} /> Verified
              </span>
            </div>
            <p className="mt-1 text-forest-700/70">{artisan.businessName}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-forest-700/60">
              <span className="flex items-center gap-1.5"><Tag size={14} /> {artisan.category}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {artisan.area}, {artisan.town}</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {artisan.association}</span>
            </div>
          </div>
          <a href={`tel:${artisan.phone}`} className="shrink-0">
            <Button variant="secondary"><Phone size={15} /> Call</Button>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-forest-900">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-forest-700/70">
              {artisan.description ? `${artisan.description} ` : ""}Registered with the Artisans Association of Ogun and verified through the {artisan.association}.
            </p>
          </div>
          <div className="rounded-xl bg-forest-50 p-4">
            <h2 className="text-sm font-semibold text-forest-900">Contact Information</h2>
            <div className="mt-3 space-y-2.5 text-sm">
              <a href={`tel:${artisan.phone}`} className="flex items-center gap-2 text-forest-700/80 hover:underline"><Phone size={14} /> {artisan.phone}</a>
              {artisan.whatsapp && (
                <a href={whatsappLink(artisan.whatsapp)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 font-medium text-fresh-600 hover:underline">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {artisan.address && (
                <p className="flex items-start gap-2 text-forest-700/80"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{artisan.address}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}