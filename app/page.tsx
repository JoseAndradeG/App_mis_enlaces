"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configurado } from "@/lib/supabase";
import Acceso from "@/components/Acceso";
import Enlaces from "@/components/Enlaces";

export default function Inicio() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!configurado) {
      setListo(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setListo(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configurado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-xl font-semibold">Falta conectar Supabase</h1>
          <p className="mt-2 text-slate-600">
            Abre el archivo <b>.env.local</b>, pega tu Project URL y tu Publishable
            key, guarda y reinicia la app (Ctrl + C y luego npm run dev).
          </p>
        </div>
      </main>
    );
  }
  if (!listo) return null;
  if (!sesion) return <Acceso />;
  return (
    <Enlaces
      key={sesion.user.id}
      usuarioId={sesion.user.id}
      onSalir={() => supabase.auth.signOut()}
    />
  );
}
