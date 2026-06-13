import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, User2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type Member } from "@/lib/gym-data";
import { gymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const AGE_OPTIONS = Array.from({ length: 67 }, (_, i) => String(i + 14));

export function MemberEditModal({
  member,
  open,
  onOpenChange,
  onSuccess,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updated: Member) => void;
}) {
  const { t, lang } = useI18n();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cin, setCin] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && member) {
      setName(member.name);
      setPhone(member.phone);
      setCin(member.cin);
      setGender(member.gender);
      setAge(member.age ? String(member.age) : "");
      setAvatar(member.photoUrl || null);
      setPhotoFile(null);
    }
  }, [open, member]);

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      return toast.error(t("edit.toast.onlyImages"));
    }
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!member) return;
    if (!name.trim()) {
      return toast.error(t("edit.toast.nameRequired"));
    }
    if (!phone.trim()) {
      return toast.error(t("edit.toast.phoneRequired"));
    }
    if (!cin.trim()) {
      return toast.error(t("edit.toast.cinRequired"));
    }

    setLoading(true);
    try {
      const updates: Partial<Member> = {
        name: name.trim(),
        phone: phone.trim(),
        cin: cin.trim().toUpperCase(),
        gender,
        age: age ? parseInt(age) : null,
      };

      const updatedMember = await gymStore.updateMember(
        member.id,
        updates,
        photoFile || undefined
      );

      toast.success(t("edit.toast.success"));
      onSuccess?.(updatedMember);
      onOpenChange(false);
    } catch (error) {
      toast.error(t("edit.toast.failed") + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md border-border/40 bg-card/95 backdrop-blur-xl p-6 rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">
            {t("edit.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 text-left">
          {/* Avatar Dropzone */}
          <div className="space-y-1.5">
            <Label>{t("edit.photo")}</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex items-center gap-4 rounded-xl border border-dashed p-4 cursor-pointer transition-all",
                "border-border/70 hover:border-primary/60 hover:bg-accent/30",
                dragOver && "border-primary bg-primary/10"
              )}
            >
              <Avatar className="size-14 ring-2 ring-border shrink-0">
                {avatar ? <AvatarImage src={avatar} alt="preview" className="object-cover" /> : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User2 className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Upload className="size-4 text-primary shrink-0" />
                  <span className="truncate">
                    {t("edit.uploadHelp")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("edit.uploadLimit")}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Nom complet */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">{t("edit.name")}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboard.namePlaceholder")}
              className="bg-background/50"
            />
          </div>

          {/* CIN */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-cin">{t("edit.cin")}</Label>
            <Input
              id="edit-cin"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="AB123456"
              className="bg-background/50 uppercase"
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">{t("edit.phone")}</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 600 000 000"
              className="bg-background/50"
            />
          </div>

          {/* Genre et Âge */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("edit.gender")}</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("gender.male")}</SelectItem>
                  <SelectItem value="female">{t("gender.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("edit.age")}</Label>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={t("edit.select")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {AGE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a} {t("edit.years")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full"
          >
            {t("edit.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t("edit.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
