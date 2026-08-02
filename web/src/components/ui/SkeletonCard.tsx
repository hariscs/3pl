import { Card } from "./Card";

const CARD_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function SkeletonCard() {
  return (
    <Card>
      <div className="animate-pulse py-3 text-center" aria-hidden>
        <div className="mx-auto h-5 w-16 rounded bg-manila" />
        <div className="mx-auto mt-1.5 h-3 w-20 rounded bg-manila" />
      </div>
    </Card>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARD_IDS.slice(0, count).map((id) => (
        <SkeletonCard key={id} />
      ))}
    </div>
  );
}
