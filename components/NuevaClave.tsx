"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import CampoClave from "@/components/CampoClave";

export default function NuevaClave({ onListo }: { onListo: () => void }) {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (clave !== repetir) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password: clave });
    setCargando(false);
    if (err) {
      setError(
        /different|same/i.test(err.message)
          ? "Elige una contraseña distinta a la anterior."
          : `No se pudo guardar: ${err.message}`
      );
      return;
    }
    onListo();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-8">
      <form onSubmit={guardar} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Crea tu nueva contraseña</h1>
        <CampoClave
          etiqueta="Contraseña nueva"
          valor={clave}
          onCambio={setClave}
          onSugerida={setRepetir}
          sugerir
          autoComplete="new-password"
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Repite la contraseña</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={repetir}
            onChange={(ev) => setRepetir(ev.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-base outline-none focus:border-acento focus:ring-2 focus:ring-acento/30"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-acento px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {cargando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
