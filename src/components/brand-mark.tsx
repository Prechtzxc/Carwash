import Link from "next/link";
import Image from "next/image";

type BrandMarkProps = {
  href?: string;
  tone?: "dark" | "light";
};

export function BrandMark({ href = "/", tone = "dark" }: BrandMarkProps) {
  const surfaceClassName = tone === "light"
    ? "shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
    : "shadow-[0_8px_20px_rgba(0,0,0,0.08)]";

  return (
    <Link aria-label="Cool Car Centrale home" className="group inline-flex items-center" href={href}>
      <Image
        alt="Cool Car Centrale"
        className={`h-auto w-[148px] rounded-xl bg-white object-contain p-1 transition-transform duration-200 group-hover:-translate-y-0.5 sm:w-[180px] lg:w-[200px] ${surfaceClassName}`}
        height={1000}
        sizes="(max-width: 639px) 148px, (max-width: 1023px) 180px, 200px"
        src="/img/logo.jpg"
        width={2000}
      />
    </Link>
  );
}
