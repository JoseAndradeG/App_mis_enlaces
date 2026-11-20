"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Enlace = {
  id: string;
  url: string;
  nombre: string;
  categoria: string;
  categoriaId: string;
  resumen?: string;
};
type CatFila = { id: string; nombre: string; activada_en: string | null };
type EnlaceFila = {
  id: string;
  url: string;
  nombre: string;
  resumen: string | null;
  categoria_id: string;
};
type Local = {
  enlaces: { url: string; nombre: string; categoria: string; resumen?: string }[];
  orden: string[];
};

const CATEGORIAS_BASE = [
  "Programación",
  "Noticias",
  "Aprendizaje",
  "Compras",
  "Otros",
];
const CLAVE = "mis-enlaces:v2";
const CLAVE_ANTIGUA = "mis-enlaces:v1";
const NUEVA = "__nueva__";

function normalizarUrl(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;
  const conProtocolo = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(conProtocolo);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Icono({ url, nombre }: { url: string; nombre: string }) {
  const [fallo, setFallo] = useState(false);
  if (fallo) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500">
        {nombre.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${dominio(url)}&sz=64`}
      alt=""
      width={36}
      height={36}
      onError={() => setFallo(true)}
      className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 object-contain p-1"
    />
  );
}

function leerLocal(): Local | null {
  try {
    const nuevo = localStorage.getItem(CLAVE);
    if (nuevo) {
      const d = JSON.parse(nuevo) as Local;
      return d.enlaces?.length ? d : null;
    }
    const viejo = localStorage.getItem(CLAVE_ANTIGUA);
    if (viejo) {
      const lista = JSON.parse(viejo) as Local["enlaces"];
      if (!lista.length) return null;
      const vistas: string[] = [];
      [...lista].reverse().forEach((e) => {
        if (!vistas.includes(e.categoria)) vistas.push(e.categoria);
      });
      return { enlaces: lista, orden: vistas.reverse() };
    }
  } catch {
    // sin datos locales
  }
  return null;
}

export default function Enlaces({
  usuarioId,
  onSalir,
}: {
  usuarioId: string;
  onSalir: () => void;
}) {
  const [enlaces, setEnlaces] = useState<Enlace[]>([]);
  const [cats, setCats] = useState<CatFila[]>([]);
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [local, setLocal] = useState<Local | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [porBorrar, setPorBorrar] = useState<Enlace | null>(null);
  const pedidos = useRef<Set<string>>(new Set());

  const [url, setUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_BASE[0]);
  const [categoriaNueva, setCategoriaNueva] = useState("");
  const [error, setError] = useState("");

  function aEnlace(f: EnlaceFila, lista: CatFila[]): Enlace {
    return {
      id: f.id,
      url: f.url,
      nombre: f.nombre,
      categoria: lista.find((c) => c.id === f.categoria_id)?.nombre ?? "Otros",
      categoriaId: f.categoria_id,
      resumen: f.resumen ?? undefined,
    };
  }

  async function cargar() {
    const r1 = await supabase.from("categorias").select("id,nombre,activada_en");
    if (r1.error) {
      setAviso("No pude cargar tus datos. ¿Ya ejecutaste el archivo supabase.sql?");
      setListo(true);
      return;
    }
    let cs: CatFila[] = r1.data ?? [];
    if (cs.length === 0) {
      await supabase.from("categorias").upsert(
        CATEGORIAS_BASE.map((n) => ({ nombre: n, user_id: usuarioId })),
        { onConflict: "user_id,nombre", ignoreDuplicates: true }
      );
      const r = await supabase.from("categorias").select("id,nombre,activada_en");
      cs = r.data ?? [];
    }
    const r2 = await supabase
      .from("enlaces")
      .select("id,url,nombre,resumen,categoria_id")
      .order("created_at", { ascending: false });
    if (r2.error) {
      setAviso("No pude cargar tus enlaces. Intenta recargar la página.");
      setListo(true);
      return;
    }
    setCats(cs);
    setEnlaces(((r2.data ?? []) as EnlaceFila[]).map((f) => aEnlace(f, cs)));
    setListo(true);
  }

  useEffect(() => {
    cargar();
    setLocal(leerLocal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listo) return;
    enlaces.forEach((e) => {
      if (e.resumen !== undefined || pedidos.current.has(e.id)) return;
      pedidos.current.add(e.id);
      fetch(`/api/resumen?url=${encodeURIComponent(e.url)}`)
        .then((r) => r.json())
        .then(async (d: { descripcion?: string }) => {
          const texto = d.descripcion ?? "";
          setEnlaces((prev) =>
            prev.map((x) => (x.id === e.id ? { ...x, resumen: texto } : x))
          );
          await supabase.from("enlaces").update({ resumen: texto }).eq("id", e.id);
        })
        .catch(() => pedidos.current.delete(e.id));
    });
  }, [enlaces, listo]);

  const categorias = [...cats]
    .sort((a, b) => {
      const ra = CATEGORIAS_BASE.indexOf(a.nombre);
      const rb = CATEGORIAS_BASE.indexOf(b.nombre);
      return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || a.nombre.localeCompare(b.nombre);
    })
    .map((c) => c.nombre);

  const grupos = cats
    .map((c) => ({
      nombre: c.nombre,
      activada: c.activada_en ?? "",
      items: enlaces.filter((e) => e.categoriaId === c.id),
    }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.activada.localeCompare(a.activada));

  function abrirFormulario() {
    setUrl("");
    setNombre("");
    setCategoria(CATEGORIAS_BASE[0]);
    setCategoriaNueva("");
    setError("");
    setAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const urlLimpia = normalizarUrl(url);
    if (!urlLimpia) {
      setError("La dirección no parece válida. Ejemplo: www.ejemplo.com");
      return;
    }
    const categoriaFinal = (categoria === NUEVA ? categoriaNueva : categoria).trim();
    if (!categoriaFinal) {
      setError("Escribe el nombre de la nueva categoría.");
      return;
    }
    setTrabajando(true);
    setError("");
    let cat = cats.find((c) => c.nombre.toLowerCase() === categoriaFinal.toLowerCase());
    if (!cat) {
      const r = await supabase
        .from("categorias")
        .insert({ nombre: categoriaFinal, user_id: usuarioId })
        .select("id,nombre,activada_en")
        .single();
      if (r.error || !r.data) {
        setError("No pude crear la categoría. Intenta de nuevo.");
        setTrabajando(false);
        return;
      }
      cat = r.data as CatFila;
    }
    const catFinal: CatFila = cat;
    const r = await supabase
      .from("enlaces")
      .insert({
        user_id: usuarioId,
        categoria_id: catFinal.id,
        url: urlLimpia,
        nombre: nombre.trim() || dominio(urlLimpia),
      })
      .select("id,url,nombre,resumen,categoria_id")
      .single();
    if (r.error || !r.data) {
      setError("No pude guardar el enlace. Intenta de nuevo.");
      setTrabajando(false);
      return;
    }
    let listaCats = cats.some((c) => c.id === catFinal.id) ? cats : [...cats, catFinal];
    if (!enlaces.some((x) => x.categoriaId === catFinal.id)) {
      const ahora = new Date().toISOString();
      await supabase.from("categorias").update({ activada_en: ahora }).eq("id", catFinal.id);
      listaCats = listaCats.map((c) =>
        c.id === catFinal.id ? { ...c, activada_en: ahora } : c
      );
    }
    setCats(listaCats);
    setEnlaces((prev) => [aEnlace(r.data as EnlaceFila, listaCats), ...prev]);
    setTrabajando(false);
    setAbierto(false);
  }

  async function borrar() {
    if (!porBorrar) return;
    const { id, categoriaId } = porBorrar;
    const r = await supabase.from("enlaces").delete().eq("id", id);
    if (r.error) {
      setAviso("No pude borrar el enlace. Intenta de nuevo.");
      setPorBorrar(null);
      return;
    }
    const quedan = enlaces.filter((e) => e.id !== id);
    setEnlaces(quedan);
    if (!quedan.some((e) => e.categoriaId === categoriaId)) {
      await supabase.from("categorias").update({ activada_en: null }).eq("id", categoriaId);
      setCats((prev) =>
        prev.map((c) => (c.id === categoriaId ? { ...c, activada_en: null } : c))
      );
    }
    setPorBorrar(null);
  }

  async function importar() {
    if (!local) return;
    setTrabajando(true);
    setAviso("");
    try {
      const nombres = Array.from(
        new Set([...local.orden, ...local.enlaces.map((e) => e.categoria)])
      );
      const r1 = await supabase.from("categorias").upsert(
        nombres.map((n) => ({ nombre: n, user_id: usuarioId })),
        { onConflict: "user_id,nombre", ignoreDuplicates: true }
      );
      if (r1.error) throw r1.error;
      const r2 = await supabase.from("categorias").select("id,nombre,activada_en");
      const todas = (r2.data ?? []) as CatFila[];
      const idDe = (n: string) => {
        const c = todas.find((x) => x.nombre === n);
        if (!c) throw new Error("categoría no encontrada");
        return c.id;
      };
      const base = Date.now() - local.enlaces.length * 1000;
      const filas = [...local.enlaces].reverse().map((e, i) => ({
        user_id: usuarioId,
        categoria_id: idDe(e.categoria),
        url: e.url,
        nombre: e.nombre,
        resumen: e.resumen ?? null,
        created_at: new Date(base + i * 1000).toISOString(),
      }));
      const r3 = await supabase.from("enlaces").insert(filas);
      if (r3.error) throw r3.error;
      for (let i = 0; i < local.orden.length; i++) {
        await supabase
          .from("categorias")
          .update({ activada_en: new Date(Date.now() - i * 1000).toISOString() })
          .eq("id", idDe(local.orden[i]));
      }
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_ANTIGUA);
      const total = local.enlaces.length;
      setLocal(null);
      await cargar();
      setAviso(`Listo: importé ${total} enlaces a tu cuenta.`);
    } catch {
      setAviso("No pude importar tus enlaces. Intenta de nuevo.");
    }
    setTrabajando(false);
  }

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-acento focus:ring-2 focus:ring-acento/30";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
        <svg
          viewBox="0 0 32 32"
          width="44"
          height="44"
          role="img"
          aria-label="Logotipo"
          className="shrink-0"
        >
          <rect width="32" height="32" rx="9" fill="#3B5BDB" />
          <path
            d="M14.5 11.5l1.2-1.2a3.5 3.5 0 015 5l-1.2 1.2M17.5 20.5l-1.2 1.2a3.5 3.5 0 01-5-5l1.2-1.2M13.5 18.5l5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Mis enlaces
          </h1>
          <p className="text-sm text-slate-600 sm:text-base">
            Las páginas web que quieres volver a visitar.
          </p>
        </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onSalir}
            className="rounded-full border border-slate-400 bg-white px-4 py-3 text-sm font-medium"
          >
            Cerrar sesión
          </button>
          <button
            onClick={abrirFormulario}
            className="rounded-full bg-acento px-5 py-3 text-sm font-medium text-white active:opacity-80"
          >
            Agregar enlace
          </button>
        </div>
      </header>

      {aviso && (
        <p className="mb-4 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
          {aviso}
        </p>
      )}

      {local && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
          <p className="text-sm">
            Tienes {local.enlaces.length} enlaces guardados en este navegador.
          </p>
          <button
            onClick={importar}
            disabled={trabajando}
            className="rounded-full bg-acento px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Importar mis enlaces de este navegador
          </button>
        </div>
      )}

      {listo && grupos.length === 0 && (
        <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-400 bg-white px-6 py-12 text-center">
          <p className="text-lg font-medium">Aún no hay enlaces guardados</p>
          <p className="mt-2 text-sm text-slate-600">
            Toca el botón y agrega el primero.
          </p>
        </section>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map((g) => (
          <section
            key={g.nombre}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="mb-3 text-lg font-semibold">
              {g.nombre}{" "}
              <span className="text-sm font-normal text-slate-500">
                ({g.items.length})
              </span>
            </h2>
            <ul className="space-y-2">
              {g.items.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-1 rounded-xl bg-slate-50 pr-1 ring-1 ring-slate-100"
                >
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-start gap-3 p-3"
                  >
                    <Icono url={e.url} nombre={e.nombre} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {e.nombre}
                      </span>
                      <span className="block truncate text-sm text-acento">
                        {dominio(e.url)}
                      </span>
                      {e.resumen && (
                        <span className="mt-1 line-clamp-2 block text-sm text-slate-600">
                          {e.resumen}
                        </span>
                      )}
                    </span>
                  </a>
                  <button
                    onClick={() => setPorBorrar(e)}
                    aria-label={`Borrar ${e.nombre}`}
                    className="mt-2 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {porBorrar && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-5"
          onClick={() => setPorBorrar(null)}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6"
          >
            <h2 className="text-lg font-semibold">¿Seguro que quieres borrarlo?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Se borrará el enlace «{porBorrar.nombre}». No se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPorBorrar(null)}
                className="flex-1 rounded-full border border-slate-300 px-5 py-3 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={borrar}
                className="flex-1 rounded-full bg-red-600 px-5 py-3 font-medium text-white"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setAbierto(false)}
        >
          <form
            onSubmit={guardar}
            onClick={(ev) => ev.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-3xl"
          >
            <h2 className="text-xl font-semibold">Agregar enlace</h2>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Dirección web
              </span>
              <input
                autoFocus
                inputMode="url"
                autoCapitalize="none"
                placeholder="www.ejemplo.com"
                value={url}
                onChange={(ev) => setUrl(ev.target.value)}
                className={campo}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Nombre</span>
              <input
                placeholder="Web de Programación"
                value={nombre}
                onChange={(ev) => setNombre(ev.target.value)}
                className={campo}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Categoría</span>
              <select
                value={categoria}
                onChange={(ev) => setCategoria(ev.target.value)}
                className={campo}
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={NUEVA}>+ Crear categoría nueva</option>
              </select>
            </label>

            {categoria === NUEVA && (
              <input
                placeholder="Nombre de la nueva categoría"
                value={categoriaNueva}
                onChange={(ev) => setCategoriaNueva(ev.target.value)}
                className={campo}
              />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex-1 rounded-full border border-slate-300 px-5 py-3 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={trabajando}
                className="flex-1 rounded-full bg-acento px-5 py-3 font-medium text-white disabled:opacity-50"
              >
                Guardar enlace
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
