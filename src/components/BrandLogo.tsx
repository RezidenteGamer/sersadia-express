import logo from "@/assets/ser-sadia-express-logo.png";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function BrandLogo({ className, alt }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt={alt ?? "Logo Ser Sadia Express"}
      className={cn("h-20 w-auto select-none", className)}
      loading="eager"
      draggable={false}
    />
  );
}
