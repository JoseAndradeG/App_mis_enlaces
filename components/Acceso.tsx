"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import CampoClave from "@/components/CampoClave";
import BotonTema from "@/components/BotonTema";
import GuiaInicio from "@/components/GuiaInicio";
import IconosSitios from "@/components/IconosSitios";

type Modo = "entrar" | "crear" | "olvide";

function traducir(msg: string): string {
  if (/invalid login/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/already registered/i.test(msg)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/not confirmed/i.test(msg)) return "Primero confirma tu correo (revisa tu bandeja).";
  if (/at least/i.test(msg)) return "La contraseña es demasiado corta.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Espera un momento.";
  return `No se pudo completar: ${msg}`;
}

export default function Acceso() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(false);

  function cambiar(m: Modo) {
    setModo(m);
    setClave("");
    setError("");
    setInfo("");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setCargando(true);
    if (modo === "crear") {
      const { data, error: err } = await supabase.auth.signUp({
        email: correo.trim(),
        password: clave,
      });
      if (err) setError(traducir(err.message));
      else if (!data.session)
        setInfo("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
    } else if (modo === "entrar") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: clave,
      });
      if (err) setError(traducir(err.message));
    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
        redirectTo: window.location.origin,
      });
      if (err && /rate limit/i.test(err.message)) setError(traducir(err.message));
      else setInfo("Si ese correo tiene cuenta, te enviamos un enlace para crear una contraseña nueva.");
    }
    setCargando(false);
  }

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-acento focus:ring-2 focus:ring-acento/30";
  const titulo = { entrar: "Iniciar sesión", crear: "Crear cuenta", olvide: "Recuperar contraseña" }[modo];
  const boton = { entrar: "Entrar", crear: "Crear cuenta", olvide: "Enviar enlace" }[modo];

  return (
    <div className="relative flex min-h-screen flex-col">
    <div className="absolute right-4 top-4 z-10">
      <BotonTema />
    </div>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-8">
      <div className="grid grid-cols-1 justify-items-center gap-6 lg:grid-cols-[auto_24rem_auto] lg:justify-center lg:gap-x-14">
      <div className="flex w-full max-w-sm items-center gap-3 lg:col-start-2 lg:row-start-1 lg:max-w-none">
        <svg viewBox="0 0 32 32" width="44" height="44" role="img" aria-label="Logotipo">
          <rect width="32" height="32" rx="9" fill="#3B5BDB" />
          <path
            d="M14.5 11.5l1.2-1.2a3.5 3.5 0 015 5l-1.2 1.2M17.5 20.5l-1.2 1.2a3.5 3.5 0 01-5-5l1.2-1.2M13.5 18.5l5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <h1 className="text-3xl font-semibold tracking-tight">Mis Enlaces</h1>
      </div>

      <form onSubmit={enviar} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-start-2 lg:row-start-2 lg:max-w-none">
        <h2 className="text-xl font-semibold">{titulo}</h2>
        {modo === "olvide" && (
          <p className="text-sm text-slate-600">
            Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
          </p>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Correo</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(ev) => setCorreo(ev.target.value)}
            className={campo}
          />
        </label>
        {modo !== "olvide" && (
          <CampoClave
            etiqueta="Contraseña"
            valor={clave}
            onCambio={setClave}
            sugerir={modo === "crear"}
            autoComplete={modo === "crear" ? "new-password" : "current-password"}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-acento px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {cargando ? "Un momento..." : boton}
        </button>
        {modo === "entrar" && (
          <button type="button" onClick={() => cambiar("olvide")} className="w-full text-sm text-slate-600">
            ¿Olvidaste tu contraseña?
          </button>
        )}
        <button
          type="button"
          onClick={() => cambiar(modo === "crear" || modo === "olvide" ? "entrar" : "crear")}
          className="w-full text-sm text-acento"
        >
          {modo === "entrar" ? "No tengo cuenta: crear una" : "Volver a iniciar sesión"}
        </button>
      </form>
      <div className="w-full max-w-[17rem] lg:col-start-1 lg:row-start-2 lg:w-[17rem] lg:self-center">
        <GuiaInicio />
      </div>
      <div className="lg:col-start-3 lg:row-start-2 lg:self-center">
        <IconosSitios />
      </div>
      </div>
    </main>
    <footer className="bg-slate-800 px-5 py-5 text-center text-sm text-white">
      Mi App de Enlaces está creada con el apoyo de Claude Code · Mi GitHub:{" "}
      <a
        href="https://github.com/JoseAndradeG"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        https://github.com/JoseAndradeG
      </a>{" "}
      ©
    </footer>
    </div>
  );
}
