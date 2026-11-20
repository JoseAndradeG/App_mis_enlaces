export const dynamic = "force-dynamic";

function bloqueado(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h === "[::1]" ||
    /^(127|10|0)\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

function limpiar(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function buscarDescripcion(html: string): string {
  const claves = ["og:description", "description", "twitter:description"];
  const encontrados: Record<string, string> = {};
  for (const etiqueta of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const clave = etiqueta
      .match(/(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]
      ?.toLowerCase();
    const m = etiqueta.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const valor = m?.[1] ?? m?.[2];
    if (clave && valor && !encontrados[clave]) encontrados[clave] = valor;
  }
  for (const c of claves) {
    if (encontrados[c]) {
      const t = limpiar(encontrados[c]);
      return t.length > 160 ? `${t.slice(0, 157)}...` : t;
    }
  }
  return "";
}

export async function GET(request: Request) {
  const direccion = new URL(request.url).searchParams.get("url") ?? "";
  let destino: URL;
  try {
    destino = new URL(direccion);
  } catch {
    return Response.json({ descripcion: "" });
  }
  if (!/^https?:$/.test(destino.protocol) || bloqueado(destino.hostname)) {
    return Response.json({ descripcion: "" });
  }
  try {
    const res = await fetch(destino, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MisEnlaces/1.0)" },
    });
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !tipo.includes("html")) {
      return Response.json({ descripcion: "" });
    }
    const html = (await res.text()).slice(0, 300000);
    return Response.json({ descripcion: buscarDescripcion(html) });
  } catch {
    return Response.json({ descripcion: "" });
  }
}
