import { Link } from "react-router-dom";

export default function PageBanner({ title, image = "/aaon/aaon-hero-artisans.jpg" }: { title: string; image?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-800 py-16 text-white sm:py-20">
      <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_22%]" />
      <div className="absolute inset-0 -z-10 bg-forest-800/80" />
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-forest-100/80">
          <Link to="/" className="hover:text-mint">Home</Link> <span className="mx-1.5">/</span> {title}
        </p>
      </div>
    </section>
  );
}
