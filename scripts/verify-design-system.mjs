import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const targets = [
  { name: "panel", directory: "apps/panel/dist/assets" },
  { name: "registro", directory: "apps/registro/dist/assets" },
];

const forbiddenSelectors = [
  { label: "regla global que oculta aria-hidden", pattern: /\[aria-hidden=["']true["']\]\s*\{[^}]*display:\s*none/ },
  { label: "skip-link sin uso", pattern: /\.skip-link\s*\{/ },
];

const requiredSelectors = [
  ".bg-bg",
  ".text-text",
  ".font-display",
  ".t-fade",
  ".t-date",
  ".t-script",
  ".mark-neq",
  ".hero__neq",
  ".brush",
  ".brush--tr",
  ".brush--bl",
  ".btn--sm",
  ".btn--default",
  ".btn--lg",
  ".nav__item",
  ".nav__item--active",
  ".day-picker__grid",
];

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const contrastChecks = [
  { label: "ink sobre paper", foreground: "#0A0A0A", background: "#EDEDED", minimum: 16.9 },
  { label: "red sobre paper (solo texto grande/UI)", foreground: "#D90D0D", background: "#EDEDED", minimum: 4.4 },
  { label: "red-dark sobre paper", foreground: "#8E0B12", background: "#EDEDED", minimum: 7 },
  { label: "white sobre red", foreground: "#FFFFFF", background: "#D90D0D", minimum: 5 },
  { label: "white sobre ink", foreground: "#FFFFFF", background: "#0A0A0A", minimum: 19 },
];

let failed = false;
const failedContrast = contrastChecks.filter(
  ({ foreground, background, minimum }) => contrastRatio(foreground, background) < minimum,
);

if (failedContrast.length > 0) {
  console.error(
    `Contraste: fallaron ${failedContrast.map(({ label }) => label).join(", ")}`,
  );
  failed = true;
} else {
  console.log(
    `Contraste: ${contrastChecks
      .map(({ label, foreground, background }) => `${label} ${contrastRatio(foreground, background).toFixed(2)}:1`)
      .join(" · ")}`,
  );
}

const uiManifest = JSON.parse(await readFile("packages/ui/package.json", "utf8"));
const missingExports = [];

for (const [name, target] of Object.entries(uiManifest.exports)) {
  if (target.includes("*")) continue;
  try {
    await access(join("packages/ui", target));
  } catch {
    missingExports.push(name);
  }
}

if (missingExports.length > 0) {
  console.error(`@convencion/ui: exports sin destino: ${missingExports.join(", ")}`);
  failed = true;
} else {
  console.log("@convencion/ui: todos los exports estáticos resuelven.");
}

for (const target of targets) {
  const files = await readdir(target.directory);
  const cssFiles = files.filter((file) => file.endsWith(".css"));

  if (cssFiles.length === 0) {
    console.error(`${target.name}: no se encontró CSS compilado; ejecutá el build primero.`);
    failed = true;
    continue;
  }

  const contents = await Promise.all(
    cssFiles.map((file) => readFile(join(target.directory, file), "utf8")),
  );
  const css = contents.join("\n");
  const missing = requiredSelectors.filter((selector) => !css.includes(selector));
  const forbidden = forbiddenSelectors.filter(({ pattern }) => pattern.test(css));

  if (forbidden.length > 0) {
    console.error(
      `${target.name}: reglas no permitidas: ${forbidden.map(({ label }) => label).join(", ")}`,
    );
    failed = true;
  }

  if (missing.length > 0) {
    console.error(`${target.name}: faltan selectores requeridos: ${missing.join(", ")}`);
    failed = true;
    continue;
  }

  console.log(`${target.name}: ${requiredSelectors.length} verificaciones de diseño pasaron.`);
}

if (failed) {
  process.exitCode = 1;
}
