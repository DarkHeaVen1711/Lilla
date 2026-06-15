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
        "bg-black text-white hover:bg-gray-800 transition-colors shadow-sm rounded-[6px] md:rounded-[8px] px-4 py-2 md:px-[21px] md:py-[8.5px] w-[160px] md:w-[208px] h-auto min-h-[48px] md:min-h-[60px] flex items-center justify-center text-lg md:text-[26px] font-medium leading-[120%] tracking-normal",
        className
      )}
      
    >
      <Link href={href} {...props}>
        Shop Collection
      </Link>
    </Button>
  );
}
