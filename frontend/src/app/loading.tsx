import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-black" />
      <p className="text-sm text-gray-500 font-medium tracking-wide">Loading...</p>
    </div>
  );
}
