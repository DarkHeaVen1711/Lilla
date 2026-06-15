import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";

type HoverAddToCartProps = {
  product: CommerceProduct;
};

export function HoverAddToCart({ product }: HoverAddToCartProps) {
  const { addToCart } = useCommerce();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto w-full flex justify-center">
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          e.preventDefault();
          addToCart(product); 
        }}
        className="bg-black text-white px-4 py-2 text-lg md:px-[21px] md:py-[8.5px] rounded-[6px] md:rounded-[8px] md:text-[18px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-colors whitespace-nowrap w-fit flex items-center justify-center"
        
      >
        Add to cart
      </button>
    </div>
  );
}
