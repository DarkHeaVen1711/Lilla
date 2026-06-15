import Image from "next/image";
import Link from "next/link";
import type { NewsPost } from "@/lib/homepageData";
import smudgeLatestNews from "@/images/smudge_latest_news.png";

type LatestNewsSectionProps = {
  news: NewsPost[];
};

export function LatestNewsSection({ news }: LatestNewsSectionProps) {
  if (!news || news.length === 0) return null;

  return (
    <section className="relative w-full bg-white py-20 px-5 lg:px-12 font-sans overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="relative mb-16 flex justify-center w-full">
          <h2 
            className="text-center text-black relative z-10"
            style={{
              fontFamily: "var(--font-serif), 'Nyght Serif', serif",
              fontWeight: 400,
              fontSize: "56px",
              lineHeight: "1",
              letterSpacing: "0",
            }}
          >
            Latest news
          </h2>

          {/* Pink Smudge Decoration bleeding off the right edge */}
          <div className="absolute top-[-90px] lg:top-[-115px] right-[-50px] lg:right-[-250px] xl:right-[-114px] z-0 w-[200px] h-[107px] lg:w-[397px] lg:h-[213px] opacity-100 pointer-events-none">
            <Image 
              src={smudgeLatestNews} 
              alt="Decoration" 
              fill 
              className="object-contain"
            />
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-full mb-16">
          {news.map((post) => (
            <div key={post.id} className="flex flex-col group">
              {/* Image */}
              <Link href={`/blog/${post.slug}`} className="w-full aspect-[4/3] md:aspect-[1.6/1] relative overflow-hidden mb-6 block bg-brand-bg-pink">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </Link>

              {/* Category */}
              <span className="text-gray-500 text-[13px] font-medium tracking-[0.15em] mb-4 uppercase">
                {post.category}
              </span>

              {/* Title */}
              <Link href={`/blog/${post.slug}`} className="block mb-6">
                <h3 
                  className="text-2xl md:text-[28px] text-black leading-snug group-hover:text-brand-primary transition-colors"
                  style={{
                    fontFamily: "var(--font-serif), 'Nyght Serif', serif",
                    fontWeight: 400,
                    letterSpacing: "0",
                  }}
                >
                  {post.title}
                </h3>
              </Link>

              {/* Read More Button */}
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-flex items-center justify-center bg-brand-primary-light text-brand-primary hover:bg-brand-primary-hover transition-colors rounded-full px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm font-medium w-fit"
              >
                Read More &gt;
              </Link>
            </div>
          ))}
        </div>

        {/* View Blogs Button */}
        <Link 
          href="/blog"
          className="bg-black text-white hover:bg-gray-800 transition-colors rounded-[14px] px-4 py-2 md:px-[21px] md:py-[8.5px] text-lg md:text-[26px] flex items-center justify-center shadow-md hover:shadow-lg"
          style={{
            fontFamily: "'Darker Grotesque', sans-serif",
            fontWeight: 400,
            lineHeight: "1.2",
          }}
        >
          View Blogs
        </Link>
      </div>
    </section>
  );
}
