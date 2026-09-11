import Link from "next/link";
import Image from "next/image";

type BrandMarkProps = {
  href?: string;
  size?: "default" | "mobile" | "sidebar";
  tone?: "dark" | "light";
};

export function BrandMark({ href = "/", size = "default", tone = "dark" }: BrandMarkProps) {
  const surfaceClassName = tone === "light"
    ? "shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
    : "shadow-[0_8px_20px_rgba(0,0,0,0.08)]";
  const imageClassName = size === "sidebar"
    ? "h-auto w-[196px] rounded-2xl bg-white object-contain p-1.5 ring-1 ring-black/10 transition-transform duration-200 group-hover:-translate-y-0.5 lg:w-[224px]"
    : size === "mobile"
      ? "h-auto w-[128px] rounded-xl bg-white object-contain p-1 ring-1 ring-black/10 transition-transform duration-200 group-hover:-translate-y-0.5 sm:w-[180px]"
      : "h-auto w-[148px] rounded-xl bg-white object-contain p-1 transition-transform duration-200 group-hover:-translate-y-0.5 sm:w-[180px] lg:w-[200px]";
  const imageSizes = size === "sidebar"
    ? "(max-width: 1023px) 196px, 224px"
    : size === "mobile"
      ? "(max-width: 639px) 128px, 180px"
      : "(max-width: 639px) 148px, (max-width: 1023px) 180px, 200px";

  return (
    <Link aria-label="Cool Car Centrale home" className="group inline-flex items-center" href={href}>
      <Image
        alt="Cool Car Centrale"
        className={`${imageClassName} ${surfaceClassName}`}
        height={1000}
        sizes={imageSizes}
        src="/img/logo.jpg"
        width={2000}
      />
    </Link>
  );
}
