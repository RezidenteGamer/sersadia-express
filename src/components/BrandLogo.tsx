import logo from "@/assets/ser-sadia-express-logo.png";
import logoDark from "@/assets/ser-sadia-express-logo-dark.png";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  alt?: string;
  forceDark?: boolean;
};

export function BrandLogo({ className, alt, forceDark }: BrandLogoProps) {
  return (
    <>
      <img
        src={logo}
        alt={alt ?? "Logo Ser Sadia Express"}
        className={cn("h-20 w-auto select-none", forceDark ? "hidden" : "dark:hidden", className)}
        loading="eager"
        draggable={false}
      />
      <img
        src={logoDark}
        alt={alt ?? "Logo Ser Sadia Express"}
        className={cn("h-20 w-auto select-none", forceDark ? "block" : "hidden dark:block", className)}
        loading="eager"
        draggable={false}
      />
    </>
  );
}
