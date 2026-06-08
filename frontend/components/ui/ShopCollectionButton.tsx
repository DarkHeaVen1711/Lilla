import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes } from "react";

interface ShopCollectionButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

export function ShopCollectionButton({
  href = "/collection",
  className,
  ...props
}: ShopCollectionButtonProps) {
  return (
    <Button
      asChild
      variant="default"
      size="lg"
      className={cn(
        "bg-[#000000] text-white hover:bg-gray-800 transition-colors shadow-sm rounded-[8px] w-[208px] h-[60px] flex items-center justify-center text-[26px] font-medium leading-[120%] tracking-normal",
        className
      )}
      
    >
      <Link href={href} {...props}>
        Shop Collection
      </Link>
    </Button>
  );
}
