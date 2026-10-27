// LETTRA COLORS - FONDO PLANO NATIVO + LOMOS Y TEXTOS (BORDE BLANCO)

// Paletas + textos de contraportada + datos en todas las páginas.

// Recursos faltantes: detección y recuperación automática, sin controles de diagnóstico.

import { Button, Rows, Select, Text, TextInput } from "@canva/app-ui-kit";

import { getTemporaryUrl, upload } from "@canva/asset";

import { openDesign } from "@canva/design";

import { useRef, useState } from "react";



type Palette = {

  label: string;

  value: string;

  light: string;

  dark: string;

  accent: string;

  strip: string;

  white?: boolean;

};



const PALETTES: Palette[] = [

  { label: "Celeste", value: "celeste", light: "#A8E0F2", dark: "#60BBDD", accent: "#168FBE", strip: "#119ACD" },

  { label: "Azul", value: "azul", light: "#9CBDF3", dark: "#4379D1", accent: "#1E4F9E", strip: "#1758B5" },

  { label: "Azul marino", value: "azul-marino", light: "#365B91", dark: "#294775", accent: "#6999D5", strip: "#173B73" },

  { label: "Rojo", value: "rojo", light: "#E95156", dark: "#D94B42", accent: "#CA242C", strip: "#C41120" },

  { label: "Morado", value: "morado", light: "#BF95E9", dark: "#8C51C6", accent: "#652A9E", strip: "#7835B6" },

  { label: "Amarillo", value: "amarillo", light: "#FFEC9B", dark: "#F5C83E", accent: "#B88C00", strip: "#FFD400" },

  { label: "Naranja", value: "naranja", light: "#FFC28B", dark: "#EB8B3F", accent: "#BD540C", strip: "#F47716" },

  { label: "Verde", value: "verde", light: "#A6DDB0", dark: "#57AD68", accent: "#216F38", strip: "#218D40" },

  { label: "Blanco", value: "blanco", light: "#FFFFFF", dark: "#FFFFFF", accent: "#D9DEE3", strip: "#F9F9F9", white: true },

  { label: "Crema", value: "crema", light: "#F3E2C8", dark: "#E9CDA6", accent: "#B48248", strip: "#D2A679" },

  { label: "Rosado", value: "rosado", light: "#F6AED2", dark: "#E77BAD", accent: "#BA347C", strip: "#E44F98" },

  { label: "Dorado", value: "dorado", light: "#F4DB89", dark: "#D5A53E", accent: "#956C08", strip: "#D6A20A" },

  { label: "Negro", value: "negro", light: "#555555", dark: "#171717", accent: "#888888", strip: "#050505" },

  { label: "Verde limón", value: "verde-limon", light: "#DCF295", dark: "#A6CF3F", accent: "#668B10", strip: "#96C91A" },

  { label: "Verde oscuro", value: "verde-oscuro", light: "#A0CBB0", dark: "#3C8C57", accent: "#155331", strip: "#176B39" },

  { label: "Verde claro", value: "verde-claro", light: "#A8E38C", dark: "#8DCF96", accent: "#57B64E", strip: "#6FB34E" },

  { label: "Turquesa", value: "turquesa", light: "#A5E7E1", dark: "#4BC7BE", accent: "#087F80", strip: "#089F9B" },

  { label: "Fucsia", value: "fucsia", light: "#EB65B5", dark: "#DA4E9B", accent: "#CD258E", strip: "#C00880" },

  { label: "Plateado", value: "plateado", light: "#E0E4EB", dark: "#A4B1C0", accent: "#A1ADBF", strip: "#8898AA" },

  { label: "Lila", value: "lila", light: "#DAC2F6", dark: "#B7A0E5", accent: "#8055B8", strip: "#9872D0" },

  { label: "Marrón", value: "marron", light: "#B98559", dark: "#9D6037", accent: "#955128", strip: "#763D1D" },

];



const PREFIX = "lettra-colors:v21:";

const OLD_PREFIXES = Array.from({ length: 14 }, (_, i) => `lettra-colors:v${20 - i}:`);

const memory = new Map<string, string>();

const svgCache = new Map<string, SvgInfo | null>();

const urlCache = new Map<string, { promise: Promise<string>; expires: number }>();

let nextRequest = 0;



//* Número de renovación. Conservamos referencias anteriores para reconocer*

//* los fondos ya colocados, pero generamos nuevos recursos cuando se solicite.*

const REFRESH_KEY = PREFIX + "asset-generation";

function readAssetGeneration(): number {

  try {

    const parsed = Number(localStorage.getItem(REFRESH_KEY) ?? "0");

    return Number.isInteger(parsed) && parsed >= 0 && parsed < 1000 ? parsed : 0;

  } catch { return 0; }

}

let assetGeneration = readAssetGeneration();

function versionedAssetKey(base: string): string {

  return assetGeneration === 0 ? base : base + ":renovado" + assetGeneration;

}

function refreshAssets(): number {

  assetGeneration += 1;

  try { localStorage.setItem(REFRESH_KEY, String(assetGeneration)); } catch { /** sesión actual **/ }

  //* No eliminamos archivos de Canva, elementos de diseño, ni datos del alumno.*

  svgCache.clear();

  urlCache.clear();

  return assetGeneration;

}





type ColorContainer = {

  ref?: { type: string; color?: string };

  set?: (value: { type: "solid"; color: string } | undefined) => void;

};

type MediaContainer = {

  ref?: { type: string; imageRef?: string };

  set?: (value: { type: "image"; imageRef: string; flipX: boolean; flipY: boolean } | undefined) => void;

};

type Fill = { colorContainer?: ColorContainer; mediaContainer?: MediaContainer };

type ElementData = {

  type: string;

  locked?: boolean;

  top: number;

  left: number;

  width: number;

  height: number;

  fill?: Fill;

  paths?: unknown;

  text?: {

    readPlaintext: () => string;

    replaceText: (bounds: { index: number; length: number }, value: string) => unknown;

    formatText: (bounds: { index: number; length: number }, formatting: { color: string }) => void;

  };

};

type PageData = {

  type: string;

  id?: string;

  locked?: boolean;

  dimensions?: { width: number; height: number };

  background?: Fill;

  elements?: {

    toArray: () => readonly ElementData[];

    insertBefore: (reference: ElementData | undefined, state: never) => ElementData | undefined;

    moveBefore: (reference: ElementData | undefined, item: ElementData) => void;

    delete: (item: ElementData) => void;

  };

};

type SvgInfo = { originalRef: string; svg: string; fingerprint: string };

type PageFiguritas = { oldRef: string; info: SvgInfo } | null;



function readSaved(key: string): string | null {

  const cached = memory.get(key);

  if (cached) return cached;

  try {

    for (const prefix of [PREFIX, ...OLD_PREFIXES]) {

      const found = localStorage.getItem(prefix + key);

      if (found) { memory.set(key, found); return found; }

    }

  } catch { /** El almacenamiento puede no estar disponible. **/ }

  return null;

}

function save(key: string, value: string): void {

  memory.set(key, value);

  try { localStorage.setItem(PREFIX + key, value); } catch { /** Continuar. **/ }

}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRateLimit = (error: unknown) => /rate.?limit|too many requests|429/i.test(String(error));



async function temporaryUrl(ref: string): Promise<string> {

  const cached = urlCache.get(ref);

  if (cached && cached.expires > Date.now()) return cached.promise;

  const promise = (async () => {

    for (let attempt = 0; attempt < 3; attempt++) {

      const now = Date.now();

      const scheduled = Math.max(now, nextRequest);

      nextRequest = scheduled + 650;

      if (scheduled > now) await sleep(scheduled - now);

      try {

        const result = await getTemporaryUrl({ type: "image", ref: ref as never });

        return result.url;

      } catch (error) {

        if (!isRateLimit(error) || attempt === 2) throw error;

        await sleep(2500 * (attempt + 1));

      }

    }

    throw new Error("No se pudo consultar el recurso de Canva.");

  })();

  urlCache.set(ref, { promise, expires: Date.now() + 120000 });

  try { return await promise; } catch (error) { urlCache.delete(ref); throw error; }

}



function svgDataUrl(svg: string): string {

  const bytes = new TextEncoder().encode(svg);

  const text = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return "data:image/svg+xml;base64," + btoa(text);

}

async function readSvg(ref: string): Promise<string> {

  const response = await fetch(await temporaryUrl(ref));

  if (!response.ok) throw new Error("No se pudo leer el SVG.");

  const svg = await response.text();

  if (!/<svg[\s>]/i.test(svg)) throw new Error("No es un archivo SVG.");

  return svg;

}

async function fingerprint(svg: string): Promise<string> {

  const normalized = svg.replace(/<\?\s*xml[\s\S]*?\?>/gi, "").replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

}

async function getSvgInfo(ref: string): Promise<SvgInfo | null> {

  const originalRef = readSaved("original:" + ref) ?? ref;

  if (svgCache.has(originalRef)) return svgCache.get(originalRef) ?? null;

  try {

    let svg: string;

    try { svg = await readSvg(originalRef); }

    catch (error) {

      if (isRateLimit(error) || ref === originalRef) throw error;

      svg = await readSvg(ref);

    }

    const pathCount = (svg.match(/<path\b/gi) ?? []).length;

    if (pathCount < 30) { svgCache.set(originalRef, null); return null; }

    const info: SvgInfo = { originalRef, svg, fingerprint: await fingerprint(svg) };

    svgCache.set(originalRef, info);

    return info;

  } catch (error) {

    if (isRateLimit(error)) throw error;

    svgCache.set(originalRef, null);

    return null;

  }

}



function backgroundKey(palette: Palette): string {

  return ["background-png", palette.value, palette.light, palette.dark, "794x1123"].join(":");

}

const PREVIOUS_PALETTES = [
  ["rojo", "#F4A39A", "#D94B42"], // Fondo PNG de la versión anterior
  ["verde-claro", "#C6EBC9", "#8DCF96"], // Fondo PNG de la versión anterior
  ["fucsia", "#F1A1D0", "#DA4E9B"], // Fondo PNG de la versión anterior
  ["plateado", "#E0E6ED", "#A4B1C0"], // Fondo PNG de la versión anterior
  ["marron", "#CDA077", "#9D6037"], // Fondo PNG de la versión anterior

  ["celeste", "#A6DCEB", "#72BAD3"], ["azul", "#B3D0F5", "#78A5E4"],

  ["rojo", "#F8C8CD", "#E88D9B"], ["morado", "#C192E9", "#9155C5"],

  ["amarillo", "#FFE9AD", "#EEC966"], ["naranja", "#FFD5B4", "#F0A66F"],

  ["verde", "#BCE9D0", "#80C7A2"], ["rosado", "#F9C9E1", "#EB93BF"],

  ["dorado", "#F9E8B4", "#DDBA65"], ["negro", "#C7C9CD", "#858991"],

  ["verde-limon", "#EBF7B9", "#C4DF70"], ["verde-oscuro", "#C6E3D1", "#75AA8D"],

  ["verde-claro", "#DDF4E0", "#A0DAB0"], ["turquesa", "#B9EEE8", "#71D0C7"],

  ["fucsia", "#F7C0E2", "#E580C3"], ["plateado", "#EEF0F2", "#B8C0C9"],

  ["celeste", "#C6E6F1", "#8FC7DB"], ["azul", "#B7D1F5", "#6598DE"],

  ["rojo", "#FCE0E2", "#F3A2A8"], ["morado", "#EDE0FA", "#BEA5E5"],

  ["amarillo", "#FFF1C2", "#F1CF72"], ["naranja", "#FFE0C7", "#F5B080"],

  ["verde", "#DDF5E6", "#99D6B4"], ["rosado", "#FDE3F0", "#F5B1D4"],

] as const;

function knownBackgroundRefs(): Set<string> {

  const keys = PALETTES.flatMap((palette) => {

    const base = backgroundKey(palette);

    return Array.from({ length: assetGeneration + 1 }, (_, n) =>

      n === 0 ? base : base + ":renovado" + n

    );

  });

  for (const [value, light, dark] of PREVIOUS_PALETTES) {

    keys.push(["background-png", value, light, dark, "794x1123"].join(":"));

  }

  return new Set(keys.map(readSaved).filter((ref): ref is string => Boolean(ref)));

}

function getImageRefs(page: PageData): string[] {

  if (page.type !== "absolute" || !page.elements) return [];

  const backgrounds = knownBackgroundRefs();

  const refs = new Set<string>();

  for (const element of page.elements.toArray()) {

    if (element.type !== "rect" || element.locked) continue;

    const media = element.fill?.mediaContainer?.ref;

    if (media?.type === "image" && media.imageRef && !backgrounds.has(media.imageRef)) {

      refs.add(media.imageRef);

    }

  }

  return [...refs];

}

async function findSvg(page: PageData): Promise<PageFiguritas> {

  for (const ref of getImageRefs(page).slice(0, 24)) {

    const info = await getSvgInfo(ref);

    if (info) return { oldRef: ref, info };

  }

  return null;

}

function recolorSvg(original: string, hex: string): string {

  let svg = original.replace(/<\?\s*xml[\s\S]*?\?>/gi, "").replace(/<!\s*DOCTYPE[\s\S]*?>/gi, "");

  svg = svg.replace(/\b(fill|stroke)\s*=\s*(["'])(.*?)\2/gi, (full, attribute: string, quote: string, value: string) => {

    const color = value.trim().toLowerCase();

    if (color === "none" || color === "transparent" || color.startsWith("url(")) return full;

    return `${attribute}=${quote}${hex}${quote}`;

  });

  svg = svg.replace(/\b(fill|stroke)\s*:\s*(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/gi, (full, attribute: string, value: string) => {

    const color = value.trim().toLowerCase();

    return color === "none" || color === "transparent" ? full : `${attribute}:${hex}`;

  });

  const match = svg.match(/<svg\b([^>]*)>/i);

  if (!match) throw new Error("El SVG no es válido.");

  const attributes = (match[1] ?? "").replace(/\sfill\s*=\s*(["'])[^"']*\1/gi, "");

  return svg.replace(/<svg\b[^>]*>/i, `<svg${attributes} fill="${hex}">`);

}

//* Comprobar si un recurso guardado sigue disponible antes de reutilizarlo.*

//* Canva no recomienda conservar ImageRef de manera indefinida.*

async function savedAssetAvailable(ref: string): Promise<boolean> {

  try {

    const url = await temporaryUrl(ref);

    const response = await fetch(url);

    if (!response.ok) urlCache.delete(ref);

    return response.ok;

  } catch (error) {

    if (isRateLimit(error)) throw error;

    urlCache.delete(ref);

    return false;

  }

}



async function getColoredRef(info: SvgInfo, hex: string): Promise<string> {

  const baseKey = "color:" + info.fingerprint + ":" + hex;

  let key = versionedAssetKey(baseKey);

  const cached = readSaved(key);

  if (cached) {

    if (await savedAssetAvailable(cached)) return cached;

    //* La referencia ya no sirve: pasar a otra generación sin destruir*

    //* el registro histórico de recursos que existen en otros diseños.*

    refreshAssets();

    key = versionedAssetKey(baseKey);

  }

  const thumbnail = `<svg xmlns="http\://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${hex}"/></svg>`;

  const asset = await upload({

    type: "image",

    mimeType: "image/svg+xml",

    url: svgDataUrl(recolorSvg(info.svg, hex)),

    thumbnailUrl: svgDataUrl(thumbnail),

    aiDisclosure: "none",

    name: "Lettra Colors - Figuritas " + hex,

  });

  await asset.whenUploaded();

  save(key, asset.ref);

  save("original:" + asset.ref, info.originalRef);

  return asset.ref;

}

// El fondo ahora es un color de página nativo; no se crean ni suben PNG.

function getPaths(value: unknown): readonly { fill?: Fill }[] {

  if (Array.isArray(value)) return value;

  if (value && typeof value === "object" && "toArray" in value) {

    const collection = value as { toArray?: () => readonly { fill?: Fill }[] };

    if (typeof collection.toArray === "function") return collection.toArray();

  }

  return [];

}

function getStrip(page: PageData): ColorContainer | null {

  if (page.type !== "absolute" || !page.elements) return null;

  const candidates = page.elements.toArray().filter((element) =>

    element.type === "shape" && !element.locked &&

    element.width > 150 && element.width < 350 &&

    element.height > 800 && element.height / element.width > 3.5

  );

  if (candidates.length !== 1) return null;

  const paths = getPaths(candidates[0]!.paths);

  if (paths.length !== 1) return null;

  const container = paths[0]?.fill?.colorContainer;

  return container?.ref?.type === "solid" && typeof container.set === "function" ? container : null;

}

function replaceFiguritas(page: PageData, oldRef: string, newRef: string): boolean {

  if (!page.elements) return false;

  if (oldRef === newRef) return true;

  for (const element of page.elements.toArray()) {

    const media = element.fill?.mediaContainer;

    if (element.type === "rect" && !element.locked && media?.ref?.imageRef === oldRef && media.set) {

      media.set({ type: "image", imageRef: newRef, flipX: false, flipY: false });

      return true;

    }

  }

  return false;

}

function findBackgroundLayers(page: PageData, excludedRef: string | null): ElementData[] {

  if (!page.elements || !page.dimensions) return [];

  const { width, height } = page.dimensions;

  const known = knownBackgroundRefs();

  return page.elements.toArray().filter((element) => {

    const media = element.fill?.mediaContainer?.ref;

    if (element.type !== "rect" || media?.type !== "image" ||

        !media.imageRef || media.imageRef === excludedRef) return false;

    const big = element.width >= width * 0.95 && element.height >= height * 0.95;

    const positioned = Math.abs(element.left) < width * 0.15 && Math.abs(element.top) < height * 0.15;

    //* Seguridad: JAMÁS borrar una ilustración solo porque esté en la primera capa.*

    return big && positioned && known.has(media.imageRef);

  });

}

// Aplica un color SOLIDO a la propia página de Canva, no a una imagen.
function nativeBase(page: PageData, color: string): void {
  const background = page.background;
  if (!background || typeof background.colorContainer?.set !== "function") {
    throw new Error("Canva no permite modificar directamente el color de esta página.");
  }
  // Primero quitar una posible imagen de fondo de Canva y luego fijar el color.
  background.mediaContainer?.set?.(undefined);
  background.colorContainer.set({ type: "solid", color: color.toLowerCase() });
}

// Negro se mantiene oscuro; las demás paletas usan un tono liso y visible.
function pageBackgroundColor(palette: Palette): string {
  if (palette.white) return "#ffffff";
  if (palette.value === "negro") return palette.dark;
  return palette.light;
}

// Solo retiramos los PNG de fondo que Lettra Colors reconoce por sus referencias
// guardadas; JAMAS borramos fotos o ilustraciones ajenas a nuestra aplicación.
function applyBackground(page: PageData, palette: Palette, figuritasRef: string | null): number {
  if (!page.elements || !page.dimensions) {
    throw new Error("Esta página no permite cambiar su fondo nativo.");
  }

  const oldLayers = findBackgroundLayers(page, figuritasRef);
  nativeBase(page, pageBackgroundColor(palette));
  for (const layer of oldLayers) page.elements.delete(layer);
  return oldLayers.length;
}

//* -------------------------------------------------------------*

//* LOMOS: cada página contiene cuatro columnas verticales.*

//* El lomo 1 corresponde a portada/contra 1-2; el 2 a 3-4, etc.*

//* Detectamos su posición sin fijar la cantidad de portadas.*

//* Solo cambiamos la figura de color. Nunca el texto ni sus efectos.*

//* -------------------------------------------------------------*



type LomoTarget = {

  element: ElementData;

  colorContainer: ColorContainer;

};



function getLomoColorContainer(element: ElementData): ColorContainer | null {

  if (element.type === "rect") {

    const container = element.fill?.colorContainer;

    return container?.ref?.type === "solid" ? container : null;

  }



  if (element.type === "shape") {

    const paths = getPaths(element.paths);

    if (paths.length !== 1) return null;

    const container = paths[0]?.fill?.colorContainer;

    return container?.ref?.type === "solid" ? container : null;

  }



  return null;

}



function getLomoCandidates(page: PageData): LomoTarget[] {

  if (page.type !== "absolute" || !page.elements || !page.dimensions) return [];



  const { width: pageWidth, height: pageHeight } = page.dimensions;

  if (pageWidth <= 0 || pageHeight <= 0) return [];



  return page.elements.toArray()

    .filter((element) => {

      const widthRatio = element.width / pageWidth;

      const heightRatio = element.height / pageHeight;

      const verticalCoverage = element.top <= pageHeight * 0.12 &&

        element.top + element.height >= pageHeight * 0.88;

      const insidePage = element.left >= -pageWidth * 0.06 &&

        element.left + element.width <= pageWidth * 1.06;



      return widthRatio >= 0.16 && widthRatio <= 0.34 &&

        heightRatio >= 0.85 && heightRatio <= 1.14 &&

        verticalCoverage && insidePage &&

        getLomoColorContainer(element) !== null;

    })

    .map((element) => ({

      element,

      colorContainer: getLomoColorContainer(element)!,

    }))

    .sort((a, b) => a.element.left - b.element.left);

}



//* Para reconocer una página completa de lomos exigimos cuatro columnas*

//* que ocupen las posiciones esperadas. No basta con encontrar cualquier*

//* rectángulo alto, pues las portadas también tienen una franja lateral.*

function isFirstLomoPage(page: PageData): boolean {

  if (!page.dimensions) return false;

  const candidates = getLomoCandidates(page);

  if (candidates.length !== 4) return false;



  const pageWidth = page.dimensions.width;

  return candidates.every((candidate, index) => {

    const center = candidate.element.left + candidate.element.width / 2;

    const expected = (index + 0.5) * pageWidth / 4;

    return Math.abs(center - expected) <= pageWidth * 0.085;

  });

}



//* Aceptamos páginas completas con cuatro lomos y una última página*

//* con uno, dos o tres. Las posiciones se verifican antes de editar.*

function isLomoPageWithColumns(page: PageData, columns: number): boolean {

  if (!page.dimensions || columns < 1 || columns > 4) return false;

  const candidates = getLomoCandidates(page);

  if (candidates.length !== columns) return false;

  const pageWidth = page.dimensions.width;

  return candidates.every((candidate, index) => {

    const center = candidate.element.left + candidate.element.width / 2;

    const expected = (index + 0.5) * pageWidth / 4;

    return Math.abs(center - expected) <= pageWidth * 0.085;

  });

}



//* Identifica únicamente el texto del lomo situado sobre la columna elegida.*

//* No modifica los demás rótulos y nunca crea un cuadro nuevo.*

function findTextForLomo(

  page: PageData,

  columns: LomoTarget[],

  position: number

): ElementData | null {

  if (!page.elements || !page.dimensions) return null;

  const target = columns[position];

  if (!target) return null;



  const texts = page.elements.toArray().filter((element) =>

    element.type === "text" &&

    !element.locked &&

    Boolean(element.text?.formatText) &&

    Boolean(element.text?.readPlaintext().trim())

  );



  //* Primero: localizar por la posición horizontal, incluso si el texto*

  //* está girado en vertical como los títulos de tus lomos.*

  const centerX = target.element.left + target.element.width / 2;

  const tolerance = page.dimensions.width * 0.12;

  const matches = texts.filter((element) =>

    Math.abs(element.left + element.width / 2 - centerX) <= tolerance

  );

  if (matches.length === 1) return matches[0]!;



  //* Alternativa segura: si hay exactamente un texto por rectángulo,*

  //* ordenar ambos grupos de izquierda a derecha.*

  if (texts.length === columns.length) {

    return [...texts].sort((a, b) =>

      (a.left + a.width / 2) - (b.left + b.width / 2)

    )[position] ?? null;

  }



  //* Si la página contiene textos extras, mejor no cambiar uno equivocado.*

  return null;

}



type LomoResult = {

  rectChanged: boolean;

  textChanged: boolean;

  warning: string;

};



//* Usa la misma sesión del botón principal y cambia solo el relleno de las*

//* letras con formatText({ color }). No toca el efecto/contorno blanco de Canva.*

async function recolorLomoInSession(

  session: {

    pageRefs: { toArray: () => readonly unknown[] };

    helpers: {

      openPage: (

        reference: never,

        callback: (result: { page: unknown }) => Promise<void>

      ) => Promise<unknown>;

    };

  },

  pairIndex: number,

  hex: string,

  textHex: string

): Promise<LomoResult> {

  const refs = session.pageRefs.toArray();

  let startIndex: number | null = null;

  let totalPairs = 0;



  //* Primera página de lomos = después de 2 páginas por cada portada.*

  //* Recorremos las ubicaciones candidatas de atrás hacia delante;*

  //* en un documento de 16 portadas probamos también la página 33.*

  for (let candidateStart = 2 * Math.floor((refs.length - 1) / 2);

       candidateStart >= 2; candidateStart -= 2) {

    const pairs = candidateStart / 2;

    const neededLomoPages = Math.ceil(pairs / 4);

    if (candidateStart + neededLomoPages > refs.length) continue;

    if (pairIndex >= pairs) continue;



    const firstRef = refs[candidateStart] as never;

    if (!firstRef) continue;



    let startsWithFourColumns = false;

    await session.helpers.openPage(firstRef, async ({ page }) => {

      startsWithFourColumns = isFirstLomoPage(page as PageData);

    });

    if (!startsWithFourColumns) continue;



    //* Si la página anterior también tiene 4 lomos, estamos dentro del*

    //* bloque, no en su inicio. Evitamos asociar lomos equivocados.*

    const precedingRef = refs[candidateStart - 1] as never;

    let precedingIsLomo = false;

    if (precedingRef) {

      await session.helpers.openPage(precedingRef, async ({ page }) => {

        precedingIsLomo = isFirstLomoPage(page as PageData);

      });

    }

    if (precedingIsLomo) continue;



    //* Confirmamos todas las páginas de lomos, incluida la última parcial.*

    let validBlock = true;

    for (let group = 0; group < neededLomoPages; group++) {

      const ref = refs[candidateStart + group] as never;

      if (!ref) { validBlock = false; break; }

      const remaining = pairs - group * 4;

      const expectedColumns = Math.min(4, remaining);

      let validPage = false;

      await session.helpers.openPage(ref, async ({ page }) => {

        const data = page as PageData;

        validPage = isLomoPageWithColumns(data, expectedColumns);

        //* Algunas plantillas dejan cuatro rectángulos en la última hoja*

        //* aunque sobren espacios; no se colorean los sobrantes.*

        if (!validPage && expectedColumns < 4) {

          validPage = isFirstLomoPage(data);

        }

      });

      if (!validPage) { validBlock = false; break; }

    }

    if (!validBlock) continue;



    startIndex = candidateStart;

    totalPairs = pairs;

    break;

  }



  if (startIndex === null) {

    return { rectChanged: false, textChanged: false, warning: "No pude reconocer el bloque de lomos. Ningún rectángulo fue modificado." };

  }

  if (pairIndex < 0 || pairIndex >= totalPairs) {

    return { rectChanged: false, textChanged: false, warning: "Esta página no corresponde a una portada con lomo." };

  }



  const lomoPageIndex = startIndex + Math.floor(pairIndex / 4);

  const position = pairIndex % 4;

  const lomoRef = refs[lomoPageIndex] as never;

  if (!lomoRef) return { rectChanged: false, textChanged: false, warning: "No existe la página del lomo correspondiente." };



  let changed = false;

  let textChanged = false;

  let problem = "";

  await session.helpers.openPage(lomoRef, async ({ page: rawPage }) => {

    const page = rawPage as PageData;

    if (page.type !== "absolute" || page.locked) {

      problem = "La página de lomos está bloqueada o no es editable.";

      return;

    }

    const candidates = getLomoCandidates(page);

    const expectedColumns = Math.min(4, totalPairs - Math.floor(pairIndex / 4) * 4);

    const aligned = isLomoPageWithColumns(page, expectedColumns) ||

      (expectedColumns < 4 && isFirstLomoPage(page));

    if (!aligned) {

      problem = "No reconozco con seguridad las columnas de esta página de lomos.";

      return;

    }



    const target = candidates[position];

    if (!target || target.element.locked || !target.colorContainer.set) {

      problem = "El rectángulo del lomo está bloqueado o no permite cambiar color.";

      return;

    }

    target.colorContainer.set({ type: "solid", color: hex.toLowerCase() });

    changed = true;



    const label = findTextForLomo(page, candidates, position);

    if (!label?.text) {

      problem = "Rectángulo actualizado, pero no pude identificar con seguridad el texto de ese lomo.";

      return;

    }



    try {

      const content = label.text.readPlaintext();

      if (!content.trim()) {

        problem = "Rectángulo actualizado, pero el texto del lomo está vacío.";

        return;

      }

      //* Solo color: no sustituye palabras, fuente, posición, rotación ni efecto.*

      label.text.formatText(

        { index: 0, length: content.length },

        { color: textHex.toLowerCase() }

      );

      textChanged = true;

    } catch (error) {

      problem = "Rectángulo actualizado; Canva no permitió recolorear el texto: " + String(error);

    }

  });



  return {

    rectChanged: changed,

    textChanged,

    warning: problem || (changed ? "" : "No se pudo actualizar el lomo."),

  };

}



//* Comparamos el contenido completo para no tocar títulos ni otros textos.*

function normalizedText(value: string): string {

  return value.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("es");

}



//* Contraportada: colorear solo Nombres y Apellidos, manteniendo su tipografía.*

//* No usar formatParagraph: en las pruebas anteriores dio errores de Canva.*

function getBackTextColor(palette: Palette): string {

  if (palette.value === "negro" || palette.value === "azul-marino") return "#ffffff";

  if (palette.white) return "#555555";



  const rgb = (hex: string): number[] =>

    [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16));



  const luminance = (hex: string): number => {

    const channels = rgb(hex).map((v) => {

      const c = v / 255;

      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

    });

    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;

  };



  const contrast = (a: string, b: string): number => {

    const l1 = luminance(a);

    const l2 = luminance(b);

    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  };



  const base = rgb(palette.accent);



  //* Oscurecer gradualmente hasta un contraste práctico, sin llegar a negro.*

  //* Para textos pequeños sobre determinados fondos puede*

  //* ser necesario revisar el contraste visualmente antes de imprimir.*

  for (let step = 0; step <= 60; step++) {

    const scale = 1 - step / 100;

    const color = "#" + base

      .map((v) => Math.round(v * scale).toString(16).padStart(2, "0"))

      .join("");



    if (contrast(color, palette.dark) >= 3 && contrast(color, palette.light) >= 3) {

      return color;

    }

  }



  //* Mantener el matiz original si el contraste resulta insuficiente.*

  return "#" + base

    .map((v) => Math.round(v * 0.4).toString(16).padStart(2, "0"))

    .join("");

}



//* Letras del lomo: mantenemos el efecto/borde BLANCO que ya esta en Canva.*

//* Solamente modificamos el color del texto; no cambiamos el efecto.*

function darkenHex(hex: string, amount: number): string {

  const digits = hex.replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(digits)) return hex.toLowerCase();

  const factor = Math.max(0, Math.min(1, 1 - amount));

  const values = [0, 2, 4].map((start) =>

    Math.round(parseInt(digits.slice(start, start + 2), 16) * factor)

      .toString(16)

      .padStart(2, "0")

  );

  return "#" + values.join("");

}



function getLomoTextColor(palette: Palette): string {

  //* Negro: letras negras, borde blanco.*

  if (palette.value === "negro") return "#050505";

  //* Blanco: plomito, porque letra y borde blancos no se distinguen.*

  if (palette.white) return "#eaeaea";

  //* Resto: mismo matiz de la franja, un tono mas oscuro.*

  return darkenHex(palette.strip, 0.28);

}



//* Solo cambia los cuadros de Nombres y Apellidos en la contraportada.*

//* Si ya fueron personalizados y son los dos únicos cuadros de texto,*

//* también los reconoce sin exigir que conserven las etiquetas originales.*

function recolorBackNames(page: PageData, color: string, names: string, surnames: string): number {

  if (!page.elements) return 0;



  const texts = page.elements.toArray().filter(

    (element) => element.type === "text" && !element.locked && element.text && element.text.readPlaintext().trim()

  );



  const expected = ["Nombres", "Apellidos", names, surnames]

    .filter((value) => value.trim())

    .map(normalizedText);



  let candidates = texts.filter((element) =>

    expected.includes(normalizedText(element.text!.readPlaintext()))

  );



  //* Solo si hay exactamente dos cuadros de texto, asumir que son*

  //* nombres y apellidos ya personalizados (como en la plantilla mostrada).*

  if (texts.length === 2) candidates = texts;



  let changed = 0;

  for (const element of candidates) {

    const content = element.text!.readPlaintext();

    try {

      element.text!.formatText({ index: 0, length: content.length }, { color });

      changed++;

    } catch {

      //* Mantener intacta la tipografía si un elemento no es editable.*

    }

  }

  return changed;

}



export const App = () => {

  const [selected, setSelected] = useState("celeste");



  //* Los textos originales son fijos en todas las plantillas.*

  //* No necesitamos pedirlos cada vez.*

  //* Lo que queremos escribir en los cuadros originales.*

  const [newNames, setNewNames] = useState("");

  const [newSurnames, setNewSurnames] = useState("");

  const [newGrade, setNewGrade] = useState("");

  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);

  const [showColorDetails, setShowColorDetails] = useState(false);

  const [showDataHelp, setShowDataHelp] = useState(false);

  const running = useRef(false);

  const palette: Palette = PALETTES.find((item) => item.value === selected) ?? PALETTES[0]!;



  const apply = async () => {

    if (running.current) return;

    running.current = true;

    setBusy(true);

    let fase = "identificar portada y contraportada";

    try {

      setMessage("Buscando la página abierta y su pareja...");

      let currentId: string | undefined;

      await openDesign({ type: "current_page" }, async (session) => {

        const page = session.page as unknown as PageData;

        if (page.type !== "absolute") throw new Error("Esta página no es compatible.");

        currentId = page.id;

      });

      if (!currentId) throw new Error("Canva no proporcionó el ID de la página.");



      let firstIndex = -1;

      let pageCount = 0;

      const svgByIndex = new Map<number, PageFiguritas>();

      await openDesign({ type: "all_pages" }, async (session) => {

        const refs = session.pageRefs.toArray();

        pageCount = refs.length;

        let currentIndex = -1;

        for (let i = 0; i < refs.length; i++) {

          const ref = refs[i];

          if (!ref || ref.type !== "absolute") continue;

          await session.helpers.openPage(ref, async ({ page }) => {

            const data = page as unknown as PageData;

            if (data.id === currentId) currentIndex = i;

          });

          if (currentIndex >= 0) break;

        }

        if (currentIndex < 0) throw new Error("No se pudo ubicar la página abierta.");

        firstIndex = Math.floor(currentIndex / 2) * 2;

        if (firstIndex + 1 >= refs.length) throw new Error("Esta página no tiene contraportada consecutiva.");

        for (const index of [firstIndex, firstIndex + 1]) {

          const ref = refs[index];

          if (!ref || ref.type !== "absolute") { svgByIndex.set(index, null); continue; }

          await session.helpers.openPage(ref, async ({ page }) => {

            const data = page as unknown as PageData;

            svgByIndex.set(index, data.locked ? null : await findSvg(data));

          });

        }

      });

      if (firstIndex < 0 || firstIndex + 1 >= pageCount) {

        throw new Error("No se pudo identificar la pareja.");

      }



      fase = "preparar figuritas y fondo plano";

      setMessage("Preparando " + palette.label + " para páginas " + (firstIndex + 1) + " y " + (firstIndex + 2) + "...");

      const refsByIndex = new Map<number, string>();

      for (const index of [firstIndex, firstIndex + 1]) {

        const match = svgByIndex.get(index);

        if (match) refsByIndex.set(index, await getColoredRef(match.info, palette.accent));

      }

      let images = 0;

      let strips = 0;

      let backgrounds = 0;

      let backNamesColored = 0;

      let lomos = 0;

      let lomoTexts = 0;

      const warnings: string[] = [];

      fase = "abrir sesión para editar";

      setMessage("Aplicando " + palette.label + " a las dos páginas...");



      await openDesign({ type: "all_pages" }, async (session) => {

        const refs = session.pageRefs.toArray();

        for (const index of [firstIndex, firstIndex + 1]) {

          const ref = refs[index];

          if (!ref || ref.type !== "absolute") {

            warnings.push("Página " + (index + 1) + " incompatible.");

            continue;

          }

          await session.helpers.openPage(ref, async (result) => {

            const page = result.page as unknown as PageData;

            if (page.type !== "absolute" || page.locked) {

              warnings.push("Página " + (index + 1) + " bloqueada o incompatible.");

              return;

            }

            const match = svgByIndex.get(index) ?? null;

            {

              fase = "fondo de la página " + (index + 1);

              try {

                const removed = applyBackground(page, palette, match?.oldRef ?? null);
                backgrounds++;
                if (removed > 0) warnings.push("Página " + (index + 1) + ": se retiraron " + removed + " fondos PNG anteriores de Lettra Colors.");

              } catch (error) {

                warnings.push("Fondo página " + (index + 1) + ": " + String(error));

              }

            }

            {

              fase = "franja de la página " + (index + 1);

              const strip = getStrip(page);

              if (strip) {

                strip.set?.({ type: "solid", color: palette.strip.toLowerCase() });

                strips++;

              } else {

                warnings.push("Página " + (index + 1) + ": tira no encontrada.");

              }

            }

            //* La página 2, 4, 6... es la contraportada.*

            if (index % 2 === 1) {

              try {

                backNamesColored += recolorBackNames(

                  page, getBackTextColor(palette), newNames, newSurnames

                );

              } catch (error) {

                warnings.push("Textos contraportada " + (index + 1) + ": " + String(error));

              }

            }

            {

              fase = "figuritas de la página " + (index + 1);

              const newSvgRef = refsByIndex.get(index);

              if (match && newSvgRef) {

                if (replaceFiguritas(page, match.oldRef, newSvgRef)) images++;

              } else {

                warnings.push("Página " + (index + 1) + ": figuritas SVG no detectadas.");

              }

            }

          });

        }

        //* LOMO: un solo rectángulo, asociado a la pareja seleccionada.*

        //* Si la estructura no coincide, conservamos el resto del diseño.*

        try {

          fase = "rectángulo del lomo correspondiente";

          const lomoResult = await recolorLomoInSession(

            session as unknown as Parameters<typeof recolorLomoInSession>[0],

            firstIndex / 2,

            palette.strip,

            getLomoTextColor(palette)

          );

          if (lomoResult.rectChanged) lomos++;

          if (lomoResult.textChanged) lomoTexts++;

          if (lomoResult.warning) warnings.push("Lomo: " + lomoResult.warning);

        } catch (error) {

          warnings.push("Lomo: " + String(error));

        }



        if (images || strips || backgrounds || backNamesColored || lomos || lomoTexts) {

          fase = "guardar cambios con session.sync()";

          setMessage("Preparado: " + images + " figuritas, " + strips + " franjas, " + backgrounds + " fondos, " + lomos + " lomo, " + lomoTexts + " texto de lomo y " + backNamesColored + " textos. Guardando...");

          await session.sync();

        }

      });

      setMessage(

        "¡Listo! 💗 Páginas " + (firstIndex + 1) + " y " + (firstIndex + 2) +

        ": " + images + " figuritas, " + strips + " tiras, " + backgrounds + " fondos, " + lomos + " lomo, " + lomoTexts + " texto de lomo y " + backNamesColored + " textos de contraportada." +

        (warnings.length ? " Avisos: " + warnings.join(" | ") : "")

      );

    } catch (error) {

      if (isRateLimit(error)) {

        setMessage("Canva limitó temporalmente las consultas. Vuelve a intentarlo después de un momento.");

      } else {

        setMessage("Error durante '" + fase + "': " + (error instanceof Error ? error.message : String(error)));

      }

    } finally {

      running.current = false;

      setBusy(false);

    }

  };



  //* Botón independiente: reemplaza los textos coincidentes en TODO el diseño.*

  //* El botón de colores sigue trabajando únicamente con la pareja seleccionada.*

  const applyTexts = async () => {

    if (running.current) return;



    //* Buscar únicamente cuadros completos con estas etiquetas de plantilla.*

    //* El grado puede aparecer como GRADO o como el ejemplo 3° A.*

    const wanted = [

      { key: "nombres", label: "Nombres", originals: ["NOMBRES"], replacement: newNames },

      { key: "apellidos", label: "Apellidos", originals: ["APELLIDOS"], replacement: newSurnames },

      { key: "grado", label: "Grado", originals: ["GRADO", "3° A", "3°A"], replacement: newGrade },

    ].filter((item) => item.replacement.trim().length > 0);



    if (wanted.length === 0) {

      setMessage("Escribe por lo menos un dato: nombres, apellidos o grado.");

      return;

    }



    running.current = true;

    setBusy(true);



    try {

      setMessage("Buscando los textos en TODAS las páginas del diseño...");



      const changed: Record<string, number> = { nombres: 0, apellidos: 0, grado: 0 };

      const touchedPages = new Set<number>();

      const warnings: string[] = [];

      let scannedPages = 0;

      let totalPages = 0;



      await openDesign({ type: "all_pages" }, async (session) => {

        const refs = session.pageRefs.toArray();

        totalPages = refs.length;



        //* Solo cambiamos cuadros enteros que contengan una etiqueta original.*

        //* No modificamos títulos ni otros textos de las plantillas.*

        for (let index = 0; index < refs.length; index++) {

          const ref = refs[index];

          if (!ref || ref.type !== "absolute") continue;



          await session.helpers.openPage(ref, async ({ page }) => {

            const data = page as unknown as PageData;

            if (data.type !== "absolute" || data.locked || !data.elements) {

              warnings.push("Página " + (index + 1) + " bloqueada o incompatible.");

              return;

            }



            for (const element of data.elements.toArray()) {

              if (element.type !== "text" || element.locked || !element.text) continue;



              const current = element.text.readPlaintext();

              const match = wanted.find(

                (item) => item.originals.some(

                  (original) => normalizedText(current) === normalizedText(original)

                )

              );

              if (!match || current === match.replacement.trim()) continue;



              element.text.replaceText(

                { index: 0, length: current.length },

                match.replacement.trim()

              );

              changed[match.key] = (changed[match.key] ?? 0) + 1;

              touchedPages.add(index + 1);

            }

          });



          scannedPages++;

          if (scannedPages % 10 === 0) {

            setMessage("Revisadas " + scannedPages + " de " + totalPages + " páginas...");

          }

        }



        if (Object.values(changed).some((count) => count > 0)) {

          await session.sync();

        }

      });



      const total = Object.values(changed).reduce((sum, count) => sum + count, 0);

      if (total === 0) {

        setMessage(

          "Revisé " + scannedPages + " páginas y no encontré esos cuadros de texto. " +

          "Busqué NOMBRES, APELLIDOS y GRADO (también 3° A). " +

          "Si ya fueron reemplazados antes, esos textos originales ya no están." +

          (warnings.length ? " Avisos: " + warnings.slice(0, 5).join(" | ") : "")

        );

        return;

      }



      const missing = wanted

        .filter((item) => (changed[item.key] ?? 0) === 0)

        .map((item) => item.label);



      setMessage(

        "¡Datos aplicados a todo el diseño! 💗 " +

        total + " cuadros actualizados en " + touchedPages.size + " páginas " +

        "(revisadas " + scannedPages + " de " + totalPages + "). " +

        (changed.nombres ?? 0) + " nombres, " +

        (changed.apellidos ?? 0) + " apellidos y " +

        (changed.grado ?? 0) + " grados." +

        (missing.length ? " Sin coincidencias para: " + missing.join(", ") + "." : "") +

        (warnings.length ? " Avisos: " + warnings.slice(0, 5).join(" | ") : "")

      );

    } catch (error) {

      setMessage(

        "Error al personalizar: " +

        (error instanceof Error ? error.message : String(error))

      );

    } finally {

      running.current = false;

      setBusy(false);

    }

  };



  return (

    <Rows spacing="2u">

      <Text>Lettra Colors 🎨</Text>



      <Text>COLOR DE LA PORTADA Y CONTRAPORTADA</Text>

      <Select

        options={[...PALETTES].sort((a, b) => a.label.localeCompare(b.label, "es")).map((item) => ({ label: item.label, value: item.value }))}

        value={selected}

        onChange={setSelected}

      />

      <Button

        variant="tertiary"

        onClick={() => setShowColorDetails((shown) => !shown)}

        stretch

      >

        {showColorDetails ? "▾ Ocultar detalles del color" : "▸ Ver detalles del color"}

      </Button>

      {showColorDetails && (

        <Rows spacing="1u">

          <Text>Color seleccionado: {palette.label}</Text>

          <Text>Figuritas: {palette.accent}</Text>

          <Text>Tira: {palette.strip}</Text>

          <Text>Fondo: {pageBackgroundColor(palette) + " (plano, nativo de Canva)"}</Text>

          <Text>Textos de contraportada: {getBackTextColor(palette)}</Text>

          <Text>Lomo: letra más oscura que la franja; Negra para Negro y plomita para Blanco. Conserva el borde blanco de Canva.</Text>

          <Text>Color interior del texto del lomo: {getLomoTextColor(palette)}</Text>

          <Text>Fondo sólido aplicado directamente a la página de Canva (sin PNG ni degradado).</Text>

        </Rows>

      )}

      <Button variant="primary" onClick={() => void apply()} disabled={busy} stretch>

        Aplicar paleta a mi portada y contraportada

      </Button>



      <Text>DATOS DEL ALUMNO — TODAS LAS PÁGINAS</Text>

      <Text>Nombres</Text>

      <TextInput value={newNames} onChange={setNewNames} placeholder="Ej. Valentina Sofía" />

      <Text>Apellidos</Text>

      <TextInput value={newSurnames} onChange={setNewSurnames} placeholder="Ej. López García" />

      <Text>Grado completo</Text>

      <TextInput value={newGrade} onChange={setNewGrade} placeholder="Ej. 5 años o 3° A" />

      <Button variant="secondary" onClick={() => void applyTexts()} disabled={busy} stretch>

        Aplicar datos en TODO el diseño

      </Button>

      <Button

        variant="tertiary"

        onClick={() => setShowDataHelp((shown) => !shown)}

        stretch

      >

        {showDataHelp ? "▾ Ocultar información de los datos" : "▸ Ver información de los datos"}

      </Button>

      {showDataHelp && (

        <Rows spacing="1u">

          <Text>Puedes dejar en blanco lo que no quieras modificar.</Text>

          <Text>El botón de datos modifica las coincidencias en TODAS las páginas del diseño abierto.</Text>

          <Text>Busca automáticamente NOMBRES, APELLIDOS y GRADO (también 3° A). No crea otros cuadros.</Text>

          <Text>El botón de colores trabaja con la pareja seleccionada, su rectángulo del lomo y el color interior del texto de ese lomo.</Text>

        </Rows>

      )}

      {message && <Text>{message}</Text>}

    </Rows>

  );

};
