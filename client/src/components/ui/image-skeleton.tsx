import { cn } from "@/lib/utils";

interface ImageSkeletonProps {
  className?: string;
  aspectRatio?: "square" | "video" | "portrait";
}

export function ImageSkeleton({ className, aspectRatio = "square" }: ImageSkeletonProps) {
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    portrait: "aspect-[3/4]"
  };

  return (
    <div className={cn(
      "loading-skeleton rounded-lg",
      aspectRatioClasses[aspectRatio],
      className
    )}>
      <div className="w-full h-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l2.5-3.15L14 17H9zm0-12h6v6H9V5z"/>
        </svg>
      </div>
    </div>
  );
}