import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { gallery } from "../../data/gallery";

/** Photo gallery with a keyboard-friendly lightbox (Esc closes, arrow keys move). */
export default function Gallery() {
    const [open, setOpen] = useState<number | null>(null);
    const close = useCallback(() => setOpen(null), []);
    const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + gallery.length) % gallery.length)), []);

    useEffect(() => {
        if (open === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [open, close, step]);

    const current = open === null ? null : gallery[open];

    return (
        <section id="gallery" className="scroll-mt-24 bg-white py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-block rounded-full bg-forest-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-600">Gallery</span>
                    <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">Moments from the Association</h2>
                    <p className="mt-3 text-forest-700/70">Meetings, recognitions and gatherings of artisans across Ogun State.</p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gallery.map((g, i) => (
                        <button key={g.src} onClick={() => setOpen(i)} aria-label={`Open photo: ${g.caption}`}
                            className="group relative overflow-hidden rounded-2xl border border-forest-100 bg-forest-50 text-left shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500">
                            <img src={g.src} alt={g.alt} loading="lazy" decoding="async"
                                className={`h-64 w-full transition-transform duration-500 group-hover:scale-105 ${g.fit === "contain" ? "object-contain" : "object-cover object-top"}`} />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-900/85 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white">
                                {g.caption}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {current && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={current.caption} onClick={close}>
                    <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} /></button>
                    <button onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo" className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft size={26} /></button>
                    <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <img src={current.src} alt={current.alt} className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain" />
                        <figcaption className="mt-3 text-center text-sm text-white/90">{current.caption}</figcaption>
                    </figure>
                    <button onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo" className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight size={26} /></button>
                </div>
            )}
        </section>
    );
}