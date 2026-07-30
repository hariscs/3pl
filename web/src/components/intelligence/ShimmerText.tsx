export function ShimmerText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`animate-shimmer-text font-medium ${className}`}>
      {children}
    </span>
  );
}
