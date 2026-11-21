"use client";

import { useEffect, useState } from "react";

// Sin letras que se confunden entre sí (0/O, 1/l/I)
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generarClave(largo = 12): string {
  const limite = 256 - (256 % ALFABETO.length);
  for (;;) {
    let r = "";
    while (r.length < largo) {
      const bytes = crypto.getRandomValues(new Uint8Array(largo * 2));
      for (const b of Array.from(bytes)) {
        if (b < limite && r.length < largo) r += ALFABETO[b % ALFABETO.length];
      }
    }
    if (/[A-Z]/.test(r) && /[a-z]/.test(r) && /[2-9]/.test(r)) return r;
  }
}

type Props = {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  sugerir?: boolean;
  onSugerida?: (c: string) => void;
  autoComplete?: string;
};

export default function CampoClave({
  etiqueta,
  valor,
  onCambio,
  sugerir = false,
  onSugerida,
  autoComplete,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function sugerirNueva() {
    const c = generarClave();
    onCambio(c);
    onSugerida?.(c);
    setVisible(true);
    setMensaje("");
  }

  useEffect(() => {
    if (sugerir) sugerirNueva();
    else setVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugerir]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setMensaje("Copiada");
    } catch {
      setMensaje("No se pudo copiar. Selecciónala y cópiala a mano.");
    }
    setTimeout(() => setMensaje(""), 2500);
  }

  const icono = "h-5 w-5";
  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{etiqueta}</span>
        <div className="relative">
          <input
            type={visible ? "text" : "password"}
            required
            minLength={8}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete={autoComplete}
            value={valor}
            onChange={(ev) => {
              onCambio(ev.target.value);
              setMensaje("");
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-24 font-mono text-base outline-none focus:border-acento focus:ring-2 focus:ring-acento/30"
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" className={icono} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {!visible && <path d="M4 4l16 16" />}
              </svg>
            </button>
            {valor && (
              <button
                type="button"
                onClick={copiar}
                aria-label="Copiar contraseña"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className={icono} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 012-2h10" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </label>
      <div className="mt-2 flex items-start justify-between gap-3 text-xs text-slate-600" aria-live="polite">
        <span className={mensaje === "Copiada" ? "font-medium text-green-700" : ""}>
          {mensaje || (sugerir ? "Guárdala en un lugar seguro. Puedes borrarla y escribir la tuya." : "Mínimo 8 caracteres.")}
        </span>
        {sugerir && (
          <button type="button" onClick={sugerirNueva} className="shrink-0 font-medium text-acento">
            Sugerir otra
          </button>
        )}
      </div>
    </div>
  );
}
