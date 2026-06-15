"use client"

type AnnouncementBarProps = {
  text: string;
};

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  return (
    <div className="w-full bg-black py-3">
      <p className="text-center text-white text-lg tracking-wide font-medium">
        {text}
      </p>
    </div>
  )
}
