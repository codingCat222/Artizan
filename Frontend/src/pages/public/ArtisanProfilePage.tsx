import { Building2, CheckCircle2, Mail, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { isListed } from "../../lib/billing";
import { useStore } from "../../store/AppStore";

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const { artisans } = useStore();
  const artisan = artisans.find((a) => a.id === id);

  if (!artisan || !isListed(artisan))
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-forest-900">Profile not available</h1>
        <p className="mt-2 text-sm text-forest-700/60">This artisan is not currently listed in the public directory.</p>
        <Link to="/search-results" className="mt-5 inline-block font-medium text-forest-600 hover:underline">Back to search</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/search-results" className="text-sm font-medium text-forest-600 hover:underline">
        ← Back to results
      </Link>

      <div className="mt-4 rounded-2xl border border-forest-100 bg-white p-8 shadow-card">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-2xl font-bold text-white">
            {artisan.avatarInitials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-forest-900">{artisan.name}</h1>
              {artisan.verification === "Verified" && (
                <span className="flex items-center gap-1 rounded-full bg-fresh-50 px-2.5 py-1 text-xs font-semibold text-fresh-600">
                  <CheckCircle2 size={13} /> Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-forest-700/70">{artisan.businessName}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-forest-700/60">
              <span className="flex items-center gap-1.5">
                <Tag size={14} /> {artisan.category}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {artisan.area}, {artisan.town}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 size={14} /> {artisan.association}
              </span>
            </div>
          </div>
          <a href={`tel:${artisan.phone}`} className="shrink-0">
            <Button variant="secondary">
              <Phone size={15} /> Call
            </Button>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-forest-900">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-forest-700/70">
              {artisan.businessDescription} Registered with the Artisan
              Association of Nigeria, Ogun State Chapter, and verified through
              the {artisan.association}.
            </p>
          </div>
          <div className="rounded-xl bg-forest-50 p-4">
            <h2 className="text-sm font-semibold text-forest-900">Contact Information</h2>
            <div className="mt-3 space-y-2.5 text-sm">
              <p className="flex items-center gap-2 text-forest-700/80">
                <Phone size={14} /> {artisan.phone}
              </p>
              {artisan.whatsapp && (
                <a
                  href={`https://wa.me/234${artisan.whatsapp.replace(/^0/, "")}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 font-medium text-fresh-600 hover:underline"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {(artisan.businessAddress || artisan.shopNumber) && (
                <p className="flex items-start gap-2 text-forest-700/80">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{[artisan.shopNumber, artisan.businessAddress].filter(Boolean).join(", ")}</span>
                </p>
              )}
              <p className="flex items-center gap-2 text-forest-700/80">
                <Mail size={14} /> {artisan.email}
              </p>
            </div>
            <div className="mt-4">
              <Badge status={artisan.verification} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
