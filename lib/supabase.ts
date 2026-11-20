import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const configurado = url.startsWith("http") && clave.length > 10;

export const supabase = createClient(
  configurado ? url : "https://sin-configurar.supabase.co",
  configurado ? clave : "sin-configurar"
);
