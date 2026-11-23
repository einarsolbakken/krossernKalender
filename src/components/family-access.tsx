import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInFamily } from "@/lib/calendar-api";

export function FamilyAccess({ onSignedIn }: { onSignedIn: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [leaving, setLeaving] = useState(false);
  const signIn = async () => {
    setBusy(true);
    setError("");
    try {
      await signInFamily(password);
      setLeaving(true);
      await new Promise((r) => setTimeout(r, 400));
      setPassword("");
      onSignedIn();
    } catch (error) { setError(error instanceof Error ? error.message : "Kunne ikke logge inn."); }
    finally { setBusy(false); }
  };
  return <div className={`mx-auto max-w-sm py-8 text-center transition-all duration-400 ease-in ${leaving ? "scale-95 opacity-0 blur-sm" : ""}`}>
    <form className="flex flex-col gap-3 text-left" onSubmit={(event) => { event.preventDefault(); void signIn(); }}>
      <label htmlFor="family-password" className="sr-only">Familiepassord</label>
      <div className="family-password-frame rounded-lg p-1.5 transition-shadow focus-within:shadow-[var(--glow-gold)]">
        <Input id="family-password" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={256} placeholder="Familiepassord" className="h-16 rounded-md border-ribbon/30 bg-paper px-5 text-center text-lg font-medium text-paper-foreground placeholder:text-paper-foreground/60 focus-visible:border-ribbon focus-visible:ring-0 md:text-lg" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      <Button disabled={busy}>{busy ? "Logger inn…" : "Åpne kalenderen"}</Button>
    </form>
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
  </div>;
}