import { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className = "", children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-4 bg-gray-200 rounded ${className}`} />;
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 bg-gray-200 rounded-md ${className}`} />;
}

export function SkeletonBadge({ className = "" }: { className?: string }) {
  return (
    <Skeleton className={`h-6 w-20 bg-gray-200 rounded-full ${className}`} />
  );
}

export function SkeletonCard({ children, className = "" }: SkeletonProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
  );
}
