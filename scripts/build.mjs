import { readFileSync, writeFileSync, readdirSync, statSync, cpSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const distDir = join(root, 'dist');
const typesDir = join(root, 'types');

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

const jsExtensions = new Set(['.js']);
const copyExtensions = new Set(['.svelte', '.d.ts']);

let total = 0;

function walkAndBuild(dir, relativeDir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relativeDir ? join(relativeDir, entry) : entry;

    if (statSync(full).isDirectory()) {
      const targetDir = join(distDir, rel);
      if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
      walkAndBuild(full, rel);
      continue;
    }

    const ext = extname(entry);
    const outPath = join(distDir, rel);

    if (jsExtensions.has(ext)) {
      const code = readFileSync(full, 'utf8');
      const result = esbuild.transformSync(code, {
        loader: 'js',
        minifySyntax: true,
        minifyWhitespace: true,
        minifyIdentifiers: false,
        legalComments: 'none',
        target: 'es2022',
      });
      writeFileSync(outPath, result.code, 'utf8');
      total += code.length - result.code.length;
    } else if (copyExtensions.has(ext)) {
      cpSync(full, outPath);
    }
  }
}

walkAndBuild(srcDir, '');

// Clean up .d.ts.map files from types/ (used for dev, not needed in npm)
if (existsSync(typesDir)) {
  let removed = 0;
  for (const entry of readdirSync(typesDir, { recursive: true })) {
    if (entry.endsWith('.d.ts.map')) {
      rmSync(join(typesDir, entry));
      removed++;
    }
  }
  if (removed > 0) console.log(`Removed ${removed} .d.ts.map files from types/`);
}

console.log(`Built dist/ — saved ${total} bytes vs source`);
