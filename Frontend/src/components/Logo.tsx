export default function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return <img src="/aaon-logo.svg" alt="Artisans Association of Ogun" className={className} />;
}