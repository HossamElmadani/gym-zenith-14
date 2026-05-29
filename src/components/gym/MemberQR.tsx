import { QRCodeSVG } from "qrcode.react";
import { memberQrPayload, type Member } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

type Props = {
  member: Pick<Member, "id" | "cin" | "name">;
  size?: number;
  className?: string;
  withCaption?: boolean;
};

export function MemberQR({ member, size = 160, className, withCaption = true }: Props) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG value={memberQrPayload(member)} size={size} level="M" includeMargin={false} />
      </div>
      {withCaption && (
        <div className="text-center">
          <div className="text-sm font-semibold leading-tight">{member.name}</div>
          <div className="text-[11px] font-mono text-muted-foreground">{member.id} · {member.cin}</div>
        </div>
      )}
    </div>
  );
}
