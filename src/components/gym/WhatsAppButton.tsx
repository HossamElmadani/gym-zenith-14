import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Member } from "@/lib/gym-data";
import { daysRemaining } from "@/lib/gym-data";

type Tone = "renew" | "churn" | "denied" | "welcome";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden>
    <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.5 2 2 6.5 2 12c0 1.76.46 3.47 1.34 4.98L2 22l5.16-1.35A10 10 0 0 0 22 12a9.94 9.94 0 0 0-2.95-7.09Zm-7 15.42a8.34 8.34 0 0 1-4.25-1.16l-.3-.18-3.06.8.82-2.98-.2-.31A8.32 8.32 0 1 1 20.36 12a8.36 8.36 0 0 1-8.31 8.33Zm4.57-6.24c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13s-.65.81-.79.97c-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.42.06-.65.32s-.85.83-.85 2.02.87 2.34 1 2.5c.13.17 1.72 2.62 4.16 3.67.58.25 1.04.4 1.39.51.59.18 1.12.16 1.55.1.47-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.11-.23-.17-.48-.3Z" />
  </svg>
);

// const greeting = (m: Member, tone: Tone) => {
//   const d = daysRemaining(m.subEnd);
//   switch (tone) {
//     case "renew":
//       return `Hi ${m.name.split(" ")[0]}, this is PULSE Gym 👋 Your ${m.plan} subscription expires in ${d} day${d === 1 ? "" : "s"}. Renew today and keep your streak alive — reply YES and we'll handle it in 30 seconds.`;
//     case "churn":
//       return `Hey ${m.name.split(" ")[0]}, we miss you at PULSE 💪 You haven't checked in for a while. Want us to book your next session or pause your plan? Just reply.`;
//     case "denied":
//       return `Hi ${m.name.split(" ")[0]}, you tried to check in today but our schedule is reserved for the other group. Your next allowed day is tomorrow — see you then!`;
//     case "welcome":
//       return `Welcome to PULSE Gym, ${m.name.split(" ")[0]}! 🎉 Your access is active. Save this number — we'll send your schedule, reminders and rewards here.`;
//   }
// };

const greeting = (m: Member, tone: Tone) => {
  const d = daysRemaining(m.subEnd);
  const name = m.name.split(" ")[0];
  
  switch (tone) {
    case "renew":
      if (d <= 0) {
        return `مرحباً ${name}، نذكرك في PULSE Gym 👋 لقد انتهت صلاحية اشتراكك. لا تدع انقطاعك يطول! جدد اشتراكك للعودة إلى تداريبك — أجب بـ "نعم" وسنتكفل بالأمر.`;
      }
      return `مرحباً ${name}، نذكرك في PULSE Gym 👋 اشتراكك الحالي سينتهي خلال ${d} يوم. جدد اشتراكك اليوم وحافظ على تقدمك — أجب بـ "نعم" وسنتكفل بالأمر خلال 30 ثانية.`;
    
    case "churn":
      return `أهلاً ${name}، اشتقنا لك في PULSE 💪 لم نرك منذ مدة. هل تريد منا حجز حصتك القادمة أو تجميد اشتراكك؟ فقط أجبنا هنا.`;
    
    case "denied":
      return `مرحباً ${name}، حاولت الدخول اليوم ولكن توقيت الحصة مخصص للمجموعة الأخرى. يومك المسموح به هو غداً — نراك حينها!`;
    
    case "welcome":
      return `أهلاً بك في PULSE Gym يا ${name}! 🎉 اشتراكك مفعل الآن. احفظ هذا الرقم، سنرسل لك عبره جدول الحصص والتذكيرات ومكافآت خاصة.`;
  }
};

export function buildWaLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

type Props = {
  member: Member;
  tone?: Tone;
  size?: "sm" | "icon";
  label?: string;
  className?: string;
};

export function WhatsAppButton({ member, tone = "renew", size = "icon", label, className }: Props) {
  const href = buildWaLink(member.phone, greeting(member, tone));
  const handleClick = () =>
    toast.success("WhatsApp opened", {
      description: `Pre-filled message ready for ${member.name}`,
    });

  if (size === "sm") {
    return (
      <Button
        asChild
        size="sm"
        onClick={handleClick}
        className={cn(
          "gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-black font-medium shadow-[0_6px_20px_-6px_rgba(37,211,102,0.55)]",
          className,
        )}
      >
        <a href={href} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${member.name}`}>
          <WhatsAppIcon /> {label ?? "WhatsApp"}
        </a>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="icon"
      onClick={handleClick}
      className={cn(
        "size-9 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-black shadow-[0_6px_20px_-6px_rgba(37,211,102,0.55)]",
        className,
      )}
    >
      <a href={href} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${member.name}`}>
        <WhatsAppIcon />
      </a>
    </Button>
  );
}
