export interface GalleryItem {
    src: string;
    alt: string;
    caption: string;
    /** "contain" for collages and posters that shouldn't be cropped. */
    fit?: "cover" | "contain";
}

/** Captions are descriptive and easy to change; edit them freely. */
export const gallery: GalleryItem[] = [
    {
        src: "/gallery/speaker-and-president.webp",
        alt: "The Speaker of the Ogun State House of Assembly seated beside the President of the Association",
        caption: "Rt Hon. Elemide, Speaker of the Ogun State House of Assembly, with Comrade Anthony Ayodele, President of the Association",
    },
    { src: "/gallery/artisan-day-2022.webp", alt: "Artisan Day 2022 collage", caption: "Artisan Day 2022", fit: "contain" },
    { src: "/gallery/leaders-with-guests.webp", alt: "Association leaders posing with guests", caption: "Leaders of the Association with guests" },
    { src: "/gallery/certificate-presentation.webp", alt: "A certificate being presented to an Association member", caption: "A certificate presentation" },
    { src: "/gallery/members-applaud.webp", alt: "Members applauding during a certificate presentation", caption: "Members applaud at a certificate presentation" },
    { src: "/gallery/leaders-in-session.webp", alt: "Association leaders in a meeting", caption: "Association leaders in session" },
    { src: "/gallery/ministry-of-health.webp", alt: "Association delegation in a meeting at the Ministry of Health", caption: "A delegation at the Ministry of Health" },
    { src: "/gallery/stadium-group.webp", alt: "Members in Association uniform gathered at a stadium", caption: "Members gathered at a stadium event" },
    { src: "/gallery/stadium-crowd.webp", alt: "A large crowd of artisans in Association uniform", caption: "Artisans gathered in large numbers" },
];