import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "dark" = farbiges Logo für helle Hintergründe; "light" = weißes Logo für dunkle Hintergründe */
  variant?: "dark" | "light";
  className?: string;
}

export default function Logo({ variant = "dark", className }: LogoProps) {
  return (
    <Image
      src={variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="PLENIUM"
      width={160}
      height={40}
      priority
      className={cn("object-contain object-left", className)}
    />
  );
}
