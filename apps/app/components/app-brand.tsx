import Image from "next/image";
import Link from "next/link";
import { cn } from "@stky/ui/utils";

type AppBrandProps = {
  showText?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
  href?: string;
};

const sizeMap = {
  xs: {
    width: 140,
    height: 121,
    logo: "h-auto w-[clamp(1.5rem,4vw,2.25rem)]",
    text: "text-xs",
  },
  sm: {
    width: 140,
    height: 121,
    logo: "h-auto w-[clamp(2rem,5vw,3rem)]",
    text: "text-sm",
  },
  md: {
    width: 140,
    height: 121,
    logo: "h-auto w-[clamp(2.5rem,6vw,3.75rem)]",
    text: "text-base",
  },
  lg: {
    width: 180,
    height: 155,
    logo: "h-auto w-[clamp(4rem,12vw,7.5rem)]",
    text: "text-lg",
  },
} as const;

export function AppBrand({
  showText = true,
  size = "md",
  variant = "light",
  className,
  href,
}: AppBrandProps) {
  const { width, height, logo, text } = sizeMap[size];
  const logoSrc = variant === "light" ? "/darkLogo.png" : "/LightLogo.png";

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={logoSrc}
        alt="StickySites CRM"
        width={width}
        height={height}
        className={cn("shrink-0", logo)}
        priority={size === "lg"}
      />
      {showText ? (
        <span className={cn("font-semibold text-foreground", text)}>
          StickySites CRM
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
