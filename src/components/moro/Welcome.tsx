import { useEffect, useState } from "react";
import { FolderPlus, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "moro-welcome-seen";

export function Welcome() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/90 backdrop-blur">
      <div className="w-full max-w-[30rem] rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-card">
        <h2 className="text-2xl font-semibold tracking-tight">Bienvenue dans Moro.iMac</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rangez vos photos, vidéos et PDF en quelques gestes.
        </p>

        <ul className="mt-5 space-y-4 text-sm">
          <li className="flex gap-3">
            <FolderPlus className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>Créez des dossiers colorés avec une image de couverture.</span>
          </li>
          <li className="flex gap-3">
            <Layers className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>Importez vos fichiers puis triez-les un par un, très vite.</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>Tout reste sur cet appareil : aucun compte, aucun envoi.</span>
          </li>
        </ul>

        <Button
          className="mt-6 w-full"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setShow(false);
          }}
        >
          Commencer
        </Button>
      </div>
    </div>
  );
}
