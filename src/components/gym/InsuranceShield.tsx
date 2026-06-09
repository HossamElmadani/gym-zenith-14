import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { tzDaysUntil } from "@/lib/gym-tz";

/**
 * Inline indicator shown beside a member's name when annual insurance is valid.
 * - Blue shield when active (>= 30 days remaining).
 * - Yellow shield when expiring within 30 days.
 * - Renders nothing if expired/missing.
 */
export function InsuranceShield({
  insuranceEnd,
  className,
  size = 14,
}: {
  insuranceEnd?: string | null;
  className?: string;
  size?: number;
}) {
  if (!insuranceEnd) return null;
  const days = tzDaysUntil(insuranceEnd);
  if (days <= 0) return null;
  const expiring = days < 30;
  const tone = expiring ? "text-yellow-400" : "text-sky-400";
  const title = expiring
    ? `Insurance expiring in ${days} day${days === 1 ? "" : "s"}`
    : `Insurance valid · ${days} days left`;
  return (
    <span title={title} className="inline-flex items-center">
      <Shield
        aria-label="Annual insurance"
        style={{ width: size, height: size }}
        className={cn("shrink-0 inline-block", tone, className)}
      />
    </span>
  );
}
