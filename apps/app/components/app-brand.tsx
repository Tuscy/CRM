import Image from "next/image";
import Link from "next/link";
import { cn } from "@stky/ui/utils";

type AppBrandProps = {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
  href?: string;
};

const sizeMap = {
  sm: { width: 100, height: 86, text: "text-sm" },
  md: { width: 140, height: 121, text: "text-base" },
  lg: { width: 180, height: 155, text: "text-lg" },
} as const;

export function AppBrand({
  showText = true,
  size = "md",
  variant = "light",
  className,
  href,
}: AppBrandProps) {
  const { width, height, text } = sizeMap[size];
  const logoSrc = variant === "light" ? "/darkLogo.png" : "/LightLogo.png";

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={logoSrc}
        alt="StickySites CRM"
        width={width}
        height={height}
        className="h-auto w-auto shrink-0"
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
