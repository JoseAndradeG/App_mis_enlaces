"use client";

import { useState } from "react";

const SITIOS = [
  { nombre: "Wikipedia", dominio: "wikipedia.org" },
  { nombre: "YouTube", dominio: "youtube.com" },
  { nombre: "Substack", dominio: "substack.com" },
  { nombre: "BBC", dominio: "bbc.com" },
  { nombre: "El Tiempo", dominio: "eltiempo.com" },
  { nombre: "ESPN", dominio: "espn.com" },
];

function IconoSitio({ nombre, dominio }: { nombre: string; dominio: string }) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {fallo ? (
          <span className="text-2xl font-semibold text-slate-500">
            {nombre.charAt(0)}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://www.google.com/s2/favicons?domain=${dominio}&sz=64`}
            alt=""
            width={44}
            height={44}
            onError={() => setFallo(true)}
            className="h-11 w-11 object-contain"
          />
        )}
      </div>
      <span className="text-xs text-slate-600">{nombre}</span>
    </div>
  );
}

export default function IconosSitios() {
  return (
    <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-6 lg:grid-cols-2">
      {SITIOS.map((s) => (
        <IconoSitio key={s.dominio} {...s} />
      ))}
    </div>
  );
}
