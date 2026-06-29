"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Search, User, X, Menu, LogOut, LogIn, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { m as motion, AnimatePresence } from "framer-motion";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { useStore } from "@/store/useStore";
import { getProducts, type FrontendProduct } from "@/lib/productAdapter";
import { Price } from "@/components/shared/Price";
import logo from "@/images/logo.png";
import beautyLogo from "@/images/beauty.png";
import type { HomeSectionLink } from "@/lib/homepageData";

import skin_menu_1 from "@/images/skin_hover_1.png";
import skin_menu_2 from "@/images/skin_hover_2.png";
import skin_menu_3 from "@/images/skin_hover_3.png";
import skin_menu_4 from "@/images/skin_hover_4.png";
import skin_menu_5 from "@/images/skin_hover_5.png";

import makeup_menu_1 from "@/images/makeup_hover_1.png";
import makeup_menu_2 from "@/images/makeup_hover_2.png";
import makeup_menu_3 from "@/images/makeup_hover_3.png";
import makeup_menu_4 from "@/images/makeup_hover_4.png";
import makeup_menu_5 from "@/images/makeup_hover_5.png";

const skinMenuItems = [
  { label: "New Launches", image: skin_menu_1, href: "/shop/skin/new-launches" },
  { label: "Bestsellers", image: skin_menu_2, href: "/shop/skin/bestsellers" },
  { label: "Face", image: skin_menu_3, href: "/shop/skin/face" },
  { label: "Lips", image: skin_menu_4, href: "/shop/skin/lips" },
  { label: "Eyes", image: skin_menu_5, href: "/shop/skin/eyes" },
];

const makeupMenuItems = [
  { label: "New Launches", image: makeup_menu_1, href: "/shop/makeup/new-launches" },
  { label: "Bestsellers", image: makeup_menu_2, href: "/shop/makeup/bestsellers" },
  { label: "Face", image: makeup_menu_3, href: "/shop/makeup/face" },
  { label: "Lips", image: makeup_menu_4, href: "/shop/makeup/lips" },
  { label: "Eyes", image: makeup_menu_5, href: "/shop/makeup/eyes" },
];



type NavDropdownConfig = {
  menuItems: { label: string; image: any; href: string }[];
};

const DROPDOWN_CONFIG: Record<string, NavDropdownConfig> = {
  "Skin": { menuItems: skinMenuItems },
  "Makeup": { menuItems: makeupMenuItems },
};

type NavbarProps = {
  links: HomeSectionLink[];
};

const CustomCartIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 8h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8z" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
  </svg>
);

export function Navbar({ links }: NavbarProps) {
  const { favoriteCount } = useCommerce();
  const cartItems = useStore((s) => s.cart.items);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const user = useStore((s) => s.user);
  const logoutUser = useStore((s) => s.logoutUser);
  const openAuthModal = useStore((s) => s.openAuthModal);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FrontendProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const products = await getProducts({ search: searchQuery.trim(), limit: 5 });
        setSearchResults(products);
      } catch (err) {
        console.error("Search query fetch error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<Record<string, boolean>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMobileMenu = (label: string) => {
    setMobileMenuOpen(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveHover(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveHover(null);
    }, 150);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMenuMouseLeave = () => {
    setActiveHover(null);
  };

  return (
    <div className="w-full h-[80px] bg-white/90 backdrop-blur-md border-b border-transparent transition-all duration-300 flex items-center px-5 lg:px-12 font-sans">
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Left Navigation Links & Mobile Menu */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button aria-label="Menu" className="p-2 -ml-2 text-black hover:opacity-70 transition-opacity">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] flex flex-col pt-10 px-8">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="mb-8 mt-2">
                  <Link href="/">
                    <Image
                      src={logo}
                      alt="LILAA"
                      width={100}
                      height={30}
                      className="object-contain"
                      priority
                    />
                  </Link>
                </div>
                <div className="flex flex-col gap-6">
                  {links.map((link) => {
                    const dropdown = DROPDOWN_CONFIG[link.label];
                    if (dropdown) {
                      const isOpen = mobileMenuOpen[link.label];
                      return (
                        <div key={link.label} className="flex flex-col">
                          <button
                            onClick={() => toggleMobileMenu(link.label)}
                            className="flex items-center justify-between w-full text-[22px] font-medium text-black transition-colors hover:text-brand-primary outline-none"
                          >
                            <span>{link.label}</span>
                            <span className="text-xl font-light">{isOpen ? "−" : "+"}</span>
                          </button>
                          {isOpen && (
                            <div className="flex flex-col pl-4 mt-2 gap-3 border-l border-gray-100">
                              {dropdown.menuItems.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  className="text-lg text-gray-600 hover:text-brand-primary transition-colors"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-[22px] font-medium text-black transition-colors hover:text-brand-primary"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="h-px bg-gray-100 w-full my-2" />
                  {user && (user.role === "manager" || user.role === "admin") && (
                    <>
                      <Link href="/manager/dashboard" className="flex items-center gap-4 text-lg font-medium text-black">
                        <User className="w-5 h-5" />
                        Manager Dashboard
                      </Link>
                      <div className="h-px bg-gray-100 w-full my-2" />
                    </>
                  )}
                  {user && user.role === "admin" && (
                    <>
                      <Link href="/admin" className="flex items-center gap-4 text-lg font-medium text-black">
                        <User className="w-5 h-5" />
                        Admin Panel
                      </Link>
                      <div className="h-px bg-gray-100 w-full my-2" />
                    </>
                  )}
                  {user ? (
                    <Link href="/account/orders" className="flex items-center gap-4 text-lg font-medium text-black">
                      <ShoppingBag className="w-5 h-5" />
                      My Orders
                    </Link>
                  ) : (
                    <Link href="/login" className="flex items-center gap-4 text-lg font-medium text-black">
                      <User className="w-5 h-5" />
                      Account
                    </Link>
                  )}
                  <Link href="/favorites" className="flex items-center gap-4 text-lg font-medium text-black">
                    <div className="relative">
                      <Heart className="w-5 h-5" />
                      {favoriteCount > 0 && (
                        <span className="absolute -right-2 -top-2 min-w-4 h-4 rounded-full bg-black text-white text-[10px] leading-4 text-center px-1">
                          {favoriteCount}
                        </span>
                      )}
                    </div>
                    Wishlist
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 h-full">
            {links.map((link) => {
              const dropdown = DROPDOWN_CONFIG[link.label];
              const isActive = dropdown && activeHover === link.label;
              
              return (
                <div
                  key={link.label}
                  onMouseEnter={dropdown ? () => handleMouseEnter(link.label) : undefined}
                  onMouseLeave={dropdown ? handleMouseLeave : undefined}
                  className="flex items-center h-[80px]"
                >
                  <Link
                    href={link.href}
                    className={`text-[24px] font-medium transition-colors ${
                      isActive ? "text-brand-primary" : "text-black hover:text-brand-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Link href="/">
            <Image
              src={activeHover ? beautyLogo : logo}
              alt={activeHover ? "Beauty" : "LILAA"}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Right Utility Icons */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search products"
            className="hover:opacity-70 transition-opacity p-2 -mr-2 lg:p-0 lg:mr-0 cursor-pointer focus:outline-none"
          >
            <Search className="w-6 h-6" />
          </button>
          {/* User Avatar / Auth — Desktop */}
          <div className="relative hidden lg:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold uppercase">
                    {user.identityString[0]}
                  </div>
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50"
                    >
                      <div className="px-3 py-2 flex flex-col gap-1">
                        <p className="text-xs text-gray-500 font-medium truncate">{user.identityString}</p>
                        {user.role && user.role !== "customer" && (
                          <span className={`inline-block w-fit px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                            user.role === "admin"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="h-px bg-gray-100 my-1" />
                      {user && (user.role === "manager" || user.role === "admin") && (
                        <>
                          <Link
                            href="/manager/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" /> Manager Dashboard
                          </Link>
                          <div className="h-px bg-gray-100 my-1" />
                        </>
                      )}
                      {user.role === "admin" && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" /> Admin Panel
                          </Link>
                          <div className="h-px bg-gray-100 my-1" />
                        </>
                      )}
                      <Link
                        href="/account/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" /> My Orders
                      </Link>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={async () => {
                          logoutUser();
                          localStorage.removeItem("lilla-auth-token");
                          try {
                            await fetch("/api/auth/session", { method: "DELETE" });
                          } catch (err) {
                            console.error("Error clearing session cookie:", err);
                          }
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("PHONE_INPUT")}
                aria-label="Sign in"
                className="hover:opacity-70 transition-opacity"
              >
                <LogIn className="w-6 h-6" />
              </button>
            )}
          </div>
          <Link
            href="/favorites"
            aria-label="Wishlist"
            className="hidden lg:flex relative hover:opacity-70 transition-opacity"
          >
            <Heart className="w-6 h-6" />
            {favoriteCount > 0 && (
              <span className="absolute -right-2 -top-2 min-w-5 h-5 rounded-full bg-black text-white text-[11px] leading-5 text-center px-1">
                {favoriteCount}
              </span>
            )}
          </Link>
          <div className="relative group">
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative hover:opacity-70 transition-opacity flex items-center h-full py-4"
            >
              <CustomCartIcon className="w-[26px] h-[26px] text-black" />
              {cartCount > 0 && (
                <span className="absolute -right-2 top-2 min-w-5 h-5 rounded-full bg-black text-white text-[11px] leading-5 text-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Cart Popover */}
            <div className="absolute top-[100%] right-0 w-[360px] max-h-[500px] bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-5 transform translate-y-2 group-hover:translate-y-0 cursor-default flex flex-col">
              
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-gray-500 font-medium">
                  Your cart is empty.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 mb-6 overflow-y-auto max-h-[240px] pr-2 custom-scrollbar">
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <Link href={`/products/${item.slug}`} className="w-16 h-16 bg-brand-bg-light rounded-md relative flex-shrink-0 flex items-center justify-center border border-gray-50 p-2 cursor-pointer hover:opacity-80 transition-opacity">
                          <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                        </Link>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <Link href={`/products/${item.slug}`}>
                              <p className="text-sm font-medium text-black leading-tight line-clamp-2 pr-2 hover:text-brand-primary transition-colors">{item.name}</p>
                            </Link>
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <Price amount={item.price} className="font-semibold text-base" />
                            <div className="flex items-center border border-gray-200 rounded-full px-1.5 py-0.5">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-5 text-center text-gray-500 hover:text-black font-medium leading-none pb-[2px]">-</button>
                              <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-5 text-center text-gray-500 hover:text-black font-medium leading-none pb-[2px]">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <div className="text-center text-sm text-gray-500 mt-2 font-medium">
                        +{cartItems.length - 3} more items
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 mb-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-medium">Subtotal</span>
                    <Price amount={cartTotal} className="font-bold text-[18px] text-black" />
                  </div>
                </>
              )}
              
              <div className="flex gap-3">
                <Link href="/checkout" className="flex-1 bg-black text-white text-center py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  Checkout
                </Link>
                <Link href="/cart" className="flex-1 bg-white text-black border border-gray-200 text-center py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Hover Menu Overlay */}
      <AnimatePresence>
        {activeHover && DROPDOWN_CONFIG[activeHover] && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
            className="absolute left-0 top-[80px] w-full bg-brand-bg-pink shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-b border-gray-100 z-40 overflow-hidden"
            style={{ height: "369px" }}
          >
            <div className="w-full max-w-[1440px] mx-auto h-full flex items-center justify-between px-12 lg:px-24">
              {DROPDOWN_CONFIG[activeHover].menuItems.map((item, idx) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-6 group/item cursor-pointer"
                >
                  <div className="relative w-[225px] h-[225px] rounded-full overflow-hidden transition-transform duration-300 group-hover/item:scale-105 shadow-sm border border-gray-200/10">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      className="object-cover"
                      priority={idx < 2}
                    />
                  </div>
                  <span
                    className="text-black font-normal transition-colors group-hover/item:text-brand-primary"
                    style={{
                      fontFamily: "var(--font-serif), 'Nyght Serif', serif",
                      fontWeight: 400,
                      fontSize: "30px",
                      lineHeight: "38px",
                      letterSpacing: "0%",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-start pt-[100px]"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-[700px] rounded-3xl shadow-2xl p-6 border border-gray-100 font-sans mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Input Area */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or ingredient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-base text-black placeholder-gray-400 font-medium"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Suggestions / Results */}
              <div className="max-h-[350px] overflow-y-auto pr-1">
                {searchLoading ? (
                  <div className="flex flex-col gap-3 py-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex gap-4 items-center animate-pulse">
                        <div className="w-14 h-14 bg-gray-100 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col gap-3 py-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1">Products Found</p>
                    {searchResults.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/products/${prod.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex gap-4 items-center hover:bg-gray-50 p-2 rounded-2xl transition-all group border border-transparent hover:border-gray-100"
                      >
                        <div className="w-12 h-12 bg-brand-bg-image rounded-xl relative flex-shrink-0 flex items-center justify-center p-1.5">
                          <Image
                            src={prod.image as any}
                            alt={prod.name}
                            fill
                            className="object-contain p-0.5 mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-black leading-tight group-hover:text-brand-primary transition-colors truncate">{prod.name}</h4>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{prod.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Price amount={prod.price} className="text-sm font-bold text-black" />
                          {prod.originalPrice && (
                            <Price amount={prod.originalPrice} className="text-[11px] text-gray-400 font-medium line-through block decoration-1" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="py-12 text-center text-gray-400 text-sm font-medium font-sans">
                    No products found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-sm font-medium font-sans">
                    Type a query to search the catalogue...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
