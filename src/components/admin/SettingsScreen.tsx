import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NrcInput } from "@/components/NrcInput";
import { PhoneInput } from "@/components/PhoneInput";
import { profilesApi, usersApi } from "@/lib/admin/api";
import type { ChangePasswordPayload, UpdateProfilePayload } from "@/lib/admin/types";
import { useAuth } from "@/store/useAuth";
import { BirthDateInput } from "@/components/BirthDateInput";
import { isValidBirthDate } from "@/lib/birthDate";
import { Field, Spinner } from "./parts";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function ProfileSettingsTab() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const profileQ = useQuery({
    queryKey: ["admin", "me", "profile"],
    queryFn: () => profilesApi.mine(),
  });

  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [passport, setPassport] = useState("");
  const [nrc, setNrc] = useState("");
  const [address, setAddress] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);

  if (!hydrated && !profileQ.isLoading) {
    const p = profileQ.data;
    setPhone(p?.phone_number ?? "");
    setGender(p?.gender ?? "");
    setDateOfBirth(p?.date_of_birth ?? "");
    setNationality(p?.nationality ?? "");
    setPassport(p?.passport ?? "");
    setNrc(p?.nrc ?? "");
    setAddress(p?.address ?? "");
    setProfileUrl(p?.profile_url ?? "");
    setHydrated(true);
  }

  const saveM = useMutation({
    mutationFn: async () => {
      if (dateOfBirth && !isValidBirthDate(dateOfBirth)) {
        throw new Error("Please select a valid date of birth");
      }
      const trimmedUrl = profileUrl.trim();
      const profileBody: UpdateProfilePayload = {
        phone_number: phone.trim(),
        gender,
        nationality: nationality.trim(),
        passport: passport.trim(),
        nrc: nrc.trim(),
        address: address.trim(),
        profile_url: trimmedUrl,
        date_of_birth: dateOfBirth || undefined,
      };
      const [updatedUser] = await Promise.all([
        usersApi.updateMe({ name: name.trim(), fullname: fullname.trim(), email: email.trim() }),
        profilesApi.upsertMine(profileBody),
      ]);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      qc.invalidateQueries({ queryKey: ["admin", "me", "profile"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Username and email are required");
      return;
    }
    saveM.mutate();
  };

  if (profileQ.isLoading) return <Spinner />;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SectionCard title="Account" description="Your sign-in identity and display name.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Full name">
            <Input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal details" description="Optional contact and KYC information.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number">
            <PhoneInput value={phone} onChange={setPhone} />
          </Field>
          <Field label="Gender">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Date of birth">
              <BirthDateInput value={dateOfBirth} onChange={setDateOfBirth} />
            </Field>
          </div>
          <Field label="Nationality">
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </Field>
          <Field label="Passport / ID">
            <Input value={passport} onChange={(e) => setPassport(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="NRC">
              <NrcInput value={nrc} onChange={setNrc} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Avatar URL">
              <Input
                type="url"
                placeholder="https://…"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saveM.isPending} className="gap-2">
          {saveM.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveM.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export function SecuritySettingsTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const changeM = useMutation({
    mutationFn: (body: ChangePasswordPayload) => usersApi.changePassword(body),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (next === current) {
      toast.error("New password must differ from the current one");
      return;
    }
    changeM.mutate({ current_password: current, new_password: next });
  };

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Change password"
        description="Use at least 8 characters. You'll stay signed in after changing it."
      >
        <div className="space-y-4">
          <Field label="Current password">
            <PasswordInput
              value={current}
              onChange={setCurrent}
              show={show}
              onToggle={() => setShow((v) => !v)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              value={next}
              onChange={setNext}
              show={show}
              onToggle={() => setShow((v) => !v)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              show={show}
              onToggle={() => setShow((v) => !v)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={changeM.isPending} className="gap-2">
            {changeM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {changeM.isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
