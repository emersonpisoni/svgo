# SVGO — SVG Optimizer

https://jakearchibald.github.io/svgomg/

---

## Table of Contents

1. [What is SVG?](#what-is-svg)
2. [Why optimize SVG?](#why-optimize-svg)
3. [What is SVGO?](#what-is-svgo)
4. [How SVGO works](#how-svgo-works)
5. [Internal architecture](#internal-architecture)
6. [SVGO plugins](#svgo-plugins)
7. [Installation and basic usage](#installation-and-basic-usage)
8. [Configuration](#configuration)
9. [Programmatic API](#programmatic-api)
10. [Integrations and ecosystem](#integrations-and-ecosystem)
11. [Practical use cases](#practical-use-cases)
12. [Best practices and pitfalls](#best-practices-and-pitfalls)
13. [Study roadmap for implementation](#study-roadmap-for-implementation)
14. [References](#references)

---

## What is SVG?

**SVG (Scalable Vector Graphics)** is an XML-based vector image format standardized by the W3C. Unlike raster formats (PNG, JPEG), SVGs are described mathematically and scale without quality loss at any resolution.

### Basic SVG structure

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  <text x="50" y="55" text-anchor="middle" fill="white">Hello</text>
</svg>
```

### Main SVG elements

| Element | Description |
|---|---|
| `<svg>` | Root element, defines the viewport |
| `<path>` | Complex curves and shapes via commands (M, L, C, Z...) |
| `<rect>`, `<circle>`, `<ellipse>` | Basic geometric shapes |
| `<g>` | Element grouping |
| `<defs>` | Reusable definitions (gradients, filters, symbols) |
| `<use>` | Reuses elements defined in `<defs>` |
| `<symbol>` | Defines reusable icons/components |
| `<clipPath>`, `<mask>` | Element clipping and masking |
| `<filter>` | Visual effects (blur, shadow...) |
| `<linearGradient>`, `<radialGradient>` | Gradients |
| `<text>`, `<tspan>` | Text elements |
| `<animate>`, `<animateTransform>` | SMIL animations |

### Presentation attributes vs CSS

SVG accepts styles via inline attributes (`fill="red"`), the `style` attribute, or CSS classes. This generates redundancy that SVGO can clean up.

---

## Why optimize SVG?

Design tools like Illustrator, Figma, Inkscape, and Sketch export SVGs with a lot of "junk":

- **Editor metadata** — comments with software version, authors, timestamps
- **Invisible elements** — hidden layers, elements outside the viewport
- **Auto-generated IDs** — `id="path123456"` with no usage
- **Redundant values** — `fill="black"` when it's already the default
- **Unnecessary namespaces** — `xmlns:xlink` when there's no `xlink:href`
- **Unresolved transforms** — `translate(0,0)` or identity matrices
- **Numbers with excessive precision** — `12.34567890` can be `12.35`
- **Duplicate style attributes** — same value in `style=""` and as an attribute
- **Empty or single-child groups** — `<g><circle/></g>`

### Real-world impact

| Scenario | Original size | After SVGO | Reduction |
|---|---|---|---|
| Simple icon (Figma) | 4.2 KB | 1.8 KB | ~57% |
| Complex illustration | 280 KB | 190 KB | ~32% |
| Icon sprite | 64 KB | 28 KB | ~56% |

A 50%+ reduction is common in SVGs exported from design tools.

---

## What is SVGO?

**SVGO** (SVG Optimizer) is an open-source Node.js tool that optimizes SVG files through plugin-based transformations. It is the industry standard for SVG optimization.

- **Repository:** [github.com/svg/svgo](https://github.com/svg/svgo)
- **License:** MIT
- **Created by:** Kir Belevich (2012)
- **Current version:** 3.x (major API redesign in v2)
- **Downloads:** ~8 million/week on npm

### What SVGO does **not** do

- Does not convert SVG to other formats (use `sharp` or `librsvg` for that)
- Does not validate SVG against the W3C schema
- Does not guarantee visual compatibility in 100% of cases (some plugins are "unsafe")
- Does not minimize complex SMIL animations by default

---

## How SVGO works

SVGO operates in three main phases:

```
SVG (string)
     │
     ▼
┌─────────────┐
│   Parser    │  → Converts XML into an AST (Abstract Syntax Tree)
└─────────────┘
     │
     ▼
┌─────────────┐
│   Plugins   │  → Each plugin visits and transforms AST nodes
└─────────────┘
     │
     ▼
┌─────────────┐
│  Serializer │  → Converts AST back to XML string
└─────────────┘
     │
     ▼
Optimized SVG (string)
```

### AST (Abstract Syntax Tree)

The SVGO parser converts the SVG into a tree of JavaScript objects. Each node has a type:

```js
// Element node example
{
  type: 'element',
  name: 'circle',
  attributes: {
    cx: '50',
    cy: '50',
    r: '40',
    fill: 'blue'
  },
  children: []
}

// Text node
{
  type: 'text',
  value: 'content here'
}

// Root node
{
  type: 'root',
  children: [ /* child elements */ ]
}
```

### Visitor Pattern

Plugins receive the AST and implement visitors — functions called for each node:

```js
const myPlugin = {
  name: 'myPlugin',
  fn: (root, params, info) => {
    return {
      element: {
        enter: (node, parentNode) => {
          // called when entering each element
        },
        exit: (node, parentNode) => {
          // called when leaving each element (after children are processed)
        }
      }
    };
  }
};
```

---

## Internal architecture

```
svgo/
├── lib/
│   ├── svgo.js          # Entry point, orchestrates the pipeline
│   ├── parser.js        # Converts SVG string → AST (uses sax-parser)
│   ├── stringifier.js   # Converts AST → SVG string
│   ├── builtin.js       # List and default order of built-in plugins
│   └── xast.js          # AST manipulation helpers
├── plugins/
│   ├── cleanupIds.js
│   ├── convertColors.js
│   ├── mergePaths.js
│   └── ...              # ~30 built-in plugins
└── bin/
    └── svgo             # CLI entry point
```

### Plugin order matters

Plugins run in the order defined in the configuration. Example of dependency:

1. `collapseGroups` removes empty groups
2. `removeEmptyContainers` removes containers that became empty after step 1

Reversing this order would reduce efficiency.

---

## SVGO plugins

### Plugins enabled by default (preset-default)

| Plugin | What it does |
|---|---|
| `cleanupAttrs` | Removes attributes with default/invalid values |
| `mergeStyles` | Merges multiple `style` attributes |
| `inlineStyles` | Moves inline CSS rules to presentation attributes |
| `removeDoctype` | Removes `<!DOCTYPE svg ...>` |
| `removeXMLProcInst` | Removes `<?xml version="1.0"?>` |
| `removeComments` | Removes XML comments |
| `removeMetadata` | Removes the `<metadata>` element |
| `removeEditorsNSData` | Removes editor namespaces and data (Inkscape, Sketch, etc.) |
| `cleanupEnableBackground` | Removes `enable-background` when unnecessary |
| `removeEmptyAttrs` | Removes attributes with empty values |
| `removeHiddenElems` | Removes `display:none` elements or those with zero dimensions |
| `removeEmptyText` | Removes empty `<text>` elements |
| `removeEmptyContainers` | Removes containers (`<g>`, `<defs>`) with no children |
| `cleanupIds` | Removes unreferenced IDs, simplifies names |
| `removeUselessDefs` | Removes `<defs>` with unreferenced content |
| `cleanupNumericValues` | Reduces number precision (`1.2300` → `1.23`) |
| `convertColors` | Normalizes colors (`rgb(255,0,0)` → `red`, `#ff0000` → `red`) |
| `removeUnknowns` | Removes unknown elements and attributes |
| `removeNonInheritableGroupAttrs` | Removes non-inheritable presentation attributes from `<g>` |
| `removeUselessStrokeAndFill` | Removes stroke/fill with no visual effect |
| `removeViewBox` | Removes `viewBox` when width/height are specified |
| `convertShapeToPath` | Converts `<rect>`, `<circle>`, etc. to `<path>` |
| `convertEllipseToCircle` | Converts `<ellipse>` with rx=ry to `<circle>` |
| `moveElemsAttrsToGroup` | Moves common child attributes up to the `<g>` parent |
| `moveGroupAttrsToElems` | Does the reverse when there is only one child |
| `collapseGroups` | Removes unnecessary groups |
| `convertPathData` | Optimizes `<path>` data (reduces commands, uses relatives) |
| `convertTransform` | Simplifies and merges transforms |
| `removeUnusedNS` | Removes unused namespace declarations |
| `sortDefsChildren` | Sorts `<defs>` children for better gzip compression |
| `sortAttrs` | Sorts attributes for better gzip compression |
| `mergePaths` | Merges multiple adjacent `<path>` elements with identical styles |
| `minifyStyles` | Minifies embedded CSS with CSSO |

### Plugins disabled by default (opt-in)

| Plugin | What it does | Why disabled |
|---|---|---|
| `removeViewBox` | Removes viewBox | Breaks responsiveness |
| `cleanupListOfValues` | Reduces precision in lists | Can cause visual distortion |
| `removeStyleElement` | Removes `<style>` | Can break styling |
| `removeScriptElement` | Removes `<script>` | Removes interactivity |
| `addAttributesToSVGElement` | Adds attributes to `<svg>` | Opt-in by nature |
| `addClassesToSVGElement` | Adds classes to `<svg>` | Opt-in by nature |
| `convertOneStopGradients` | Converts single-color gradients to solid color | May alter visuals |
| `prefixIds` | Adds prefix to IDs | Useful for sprites |
| `removeDimensions` | Removes width/height from SVG | Can break layout |
| `removeOffCanvasPath` | Removes paths outside the canvas | May remove animated elements |
| `removeRasterImages` | Removes embedded raster images | May remove valid content |
| `removeXMLNS` | Removes xmlns declaration | Needed for inline HTML, not for file use |
| `reusePaths` | Creates `<defs>` + `<use>` for duplicate paths | Not always advantageous |

---

## Installation and basic usage

### Installation

```bash
# Global (CLI)
npm install -g svgo

# Local to project
npm install --save-dev svgo
```

### CLI

```bash
# Optimize a file (overwrites original)
svgo input.svg

# Specify output
svgo input.svg -o output.svg

# Optimize entire folder
svgo -f ./icons -o ./icons-optimized

# Use custom configuration
svgo input.svg --config svgo.config.js

# See result without saving (dry-run)
svgo input.svg --dry-run

# Disable specific plugin
svgo input.svg --disable=removeViewBox

# Enable a disabled-by-default plugin
svgo input.svg --enable=removeDimensions

# Show all available plugins
svgo --show-plugins

# Read from stdin / write to stdout (pipeline)
cat input.svg | svgo --stdin -o output.svg
```

### Verifying the optimization

```bash
# Compare sizes
ls -lh input.svg output.svg

# See diff visually (with svgo --pretty)
svgo input.svg -o output-pretty.svg --pretty
diff input.svg output-pretty.svg
```

---

## Configuration

SVGO automatically looks for `svgo.config.js` (or `.mjs`, `.cjs`) in the current directory.

### Configuration file structure

```js
// svgo.config.js
export default {
  // Global rounding precision (default: 3)
  floatPrecision: 2,

  // Multiple optimization passes
  multipass: true,

  plugins: [
    // Use the default preset with customizations
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Disable a plugin from the preset
          removeViewBox: false,

          // Customize a plugin's parameters
          cleanupNumericValues: {
            floatPrecision: 1,
          },

          convertPathData: {
            floatPrecision: 1,
          },
        },
      },
    },

    // Add a disabled-by-default plugin
    {
      name: 'removeDimensions',
    },

    // Plugin with parameters
    {
      name: 'prefixIds',
      params: {
        prefix: 'icon',
      },
    },

    // Inline custom plugin
    {
      name: 'myCustomPlugin',
      fn: (root, params) => {
        return {
          element: {
            enter: (node) => {
              // custom logic
            }
          }
        };
      }
    }
  ],
};
```

### Configuration for different scenarios

#### For icon sprites

```js
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,  // Required for sprites
          cleanupIds: false,     // Preserve IDs for <use>
        },
      },
    },
    {
      name: 'prefixIds',
      params: { prefix: 'icon' },
    },
  ],
};
```

#### For inline SVG in HTML

```js
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    'removeXMLNS',  // Removes unnecessary xmlns for inline SVG
  ],
};
```

#### For maximum compression (lossy)

```js
export default {
  floatPrecision: 1,
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertPathData: { floatPrecision: 1 },
          cleanupNumericValues: { floatPrecision: 1 },
        },
      },
    },
    'removeDimensions',
    'removeOffCanvasPath',
    'reusePaths',
  ],
};
```

---

## Programmatic API

### Basic usage

```js
import { optimize } from 'svgo';
import { readFileSync, writeFileSync } from 'fs';

const svgString = readFileSync('input.svg', 'utf8');

const result = optimize(svgString, {
  path: 'input.svg', // Used for error messages
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
});

writeFileSync('output.svg', result.data);
console.log(`Original: ${svgString.length} bytes`);
console.log(`Optimized: ${result.data.length} bytes`);
console.log(`Reduction: ${(100 - (result.data.length / svgString.length) * 100).toFixed(1)}%`);
```

### Batch optimization

```js
import { optimize } from 'svgo';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

async function optimizeFolder(inputDir, outputDir) {
  const files = await readdir(inputDir);
  const svgFiles = files.filter(f => extname(f) === '.svg');

  const results = await Promise.all(
    svgFiles.map(async (file) => {
      const inputPath = join(inputDir, file);
      const outputPath = join(outputDir, file);
      const content = await readFile(inputPath, 'utf8');

      const result = optimize(content, { path: inputPath, multipass: true });
      await writeFile(outputPath, result.data);

      const ratio = ((1 - result.data.length / content.length) * 100).toFixed(1);
      return { file, original: content.length, optimized: result.data.length, ratio };
    })
  );

  results.forEach(({ file, original, optimized, ratio }) => {
    console.log(`${file}: ${original}B → ${optimized}B (-${ratio}%)`);
  });
}
```

### Writing a custom plugin

```js
import { optimize } from 'svgo';

// Plugin that adds data-optimized="true" to the root element
const addAttribute = {
  name: 'addAttribute',
  params: {
    attribute: 'data-optimized',
    value: 'true',
  },
  fn: (root, params) => {
    return {
      element: {
        enter: (node) => {
          if (node.name === 'svg') {
            node.attributes[params.attribute] = params.value;
          }
        },
      },
    };
  },
};

// Plugin that removes all comments (didactic example)
const removeCommentsCustom = {
  name: 'removeCommentsCustom',
  fn: (root) => {
    return {
      comment: {
        enter: (node, parentNode) => {
          const index = parentNode.children.indexOf(node);
          parentNode.children.splice(index, 1);
        },
      },
    };
  },
};

const result = optimize(svgString, {
  plugins: [addAttribute, removeCommentsCustom],
});
```

### Available AST types to visit

```js
return {
  root: { enter, exit },          // Document root node
  element: { enter, exit },       // XML elements (<svg>, <path>, etc.)
  text: { enter, exit },          // Text nodes
  cdata: { enter, exit },         // CDATA sections
  comment: { enter, exit },       // Comments <!-- -->
  instruction: { enter, exit },   // Processing instructions <?xml ?>
  doctype: { enter, exit },       // <!DOCTYPE>
};
```

---

## Integrations and ecosystem

### Bundlers and build tools

| Tool | Package | Notes |
|---|---|---|
| Vite | `vite-plugin-svgo` | Official Vite plugin |
| Webpack | `image-minimizer-webpack-plugin` | With SVGO as minifier |
| Rollup | `@rollup/plugin-image` + SVGO | Manual configuration |
| Gulp | `gulp-svgmin` | Old wrapper but functional |
| Grunt | `grunt-svgmin` | Legacy wrapper |

### Frontend frameworks

| Framework | Package | What it does |
|---|---|---|
| React | `@svgr/webpack` + SVGO | Converts SVG into React component |
| Vue | `vite-svg-loader` | Imports SVG as Vue component |
| Next.js | `@svgr/webpack` | Configuration in `next.config.js` |
| Nuxt | `@nuxtjs/svg` | Official module |

### Design tools and CI

| Tool | Integration |
|---|---|
| Figma | Manual export + local or online SVGO |
| GitHub Actions | `ericcornelissen/svgo-action` action |
| SVGOMG | Web interface for SVGO (jakearchibald.github.io/svgomg) |
| Squoosh | SVG support via SVGO |

### Related packages

| Package | Description |
|---|---|
| `@svgr/core` | Converts SVG to React/Vue components |
| `svg-sprite` | Creates SVG sprites |
| `svgson` | Converts SVG to/from JSON |
| `sharp` | Rasterizes SVG to PNG/JPEG |
| `csso` | CSS optimizer (used by the `minifyStyles` plugin) |

---

## Practical use cases

### 1. CI pipeline for automatic optimization

```yaml
# .github/workflows/optimize-svg.yml
name: Optimize SVGs

on:
  pull_request:
    paths:
      - '**.svg'

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g svgo
      - run: svgo -f ./src/assets/icons -o ./src/assets/icons
      - name: Commit changes
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add -A
          git diff --staged --quiet || git commit -m "chore: optimize SVG files"
          git push
```

### 2. Node.js script for optimization report

```js
import { optimize } from 'svgo';
import { readdirSync, readFileSync } from 'fs';
import { join, extname } from 'path';

function analyzeSVGs(dir) {
  const files = readdirSync(dir).filter(f => extname(f) === '.svg');
  let totalOriginal = 0;
  let totalOptimized = 0;

  console.log('File'.padEnd(40) + 'Original'.padEnd(12) + 'Optimized'.padEnd(12) + 'Reduction');
  console.log('─'.repeat(75));

  files.forEach(file => {
    const path = join(dir, file);
    const content = readFileSync(path, 'utf8');
    const result = optimize(content, { multipass: true });

    const original = content.length;
    const optimized = result.data.length;
    const reduction = ((1 - optimized / original) * 100).toFixed(1);

    totalOriginal += original;
    totalOptimized += optimized;

    console.log(
      file.padEnd(40) +
      `${original}B`.padEnd(12) +
      `${optimized}B`.padEnd(12) +
      `${reduction}%`
    );
  });

  const totalReduction = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
  console.log('─'.repeat(75));
  console.log(
    'TOTAL'.padEnd(40) +
    `${totalOriginal}B`.padEnd(12) +
    `${totalOptimized}B`.padEnd(12) +
    `${totalReduction}%`
  );
}

analyzeSVGs('./icons');
```

### 3. Integration with SVGR (React)

```js
// svgr.config.js
export default {
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
    ],
  },
};
```

---

## Best practices and pitfalls

### Best practices

- **Always use `multipass: true`** — each pass can reveal new optimizations
- **Preserve `viewBox`** — essential for responsive SVGs; disable `removeViewBox`
- **Be careful with `cleanupIds`** in sprites — IDs are referenced by `<use>`
- **Test visually** before and after, especially on complex icons
- **Use `prefixIds`** when embedding multiple SVGs on the same page to avoid ID conflicts
- **Version `svgo.config.js`** alongside the project

### Common pitfalls

| Problem | Cause | Solution |
|---|---|---|
| SVG looks different visually | Aggressive plugin (e.g. `convertShapeToPath`) | Disable the problematic plugin |
| Conflicting IDs on the page | `cleanupIds` simplifies to short names | Use `prefixIds` |
| Broken responsive SVG | `removeViewBox` enabled | `overrides: { removeViewBox: false }` |
| Broken CSS animations | `cleanupIds` renamed classes | Disable `cleanupIds` |
| Lost gradients | Gradient IDs removed | Preserve IDs with `cleanupIds: false` |
| Incorrect SVG filters | Numeric precision too low | Increase `floatPrecision` |

### When NOT to use SVGO (or use with care)

- SVGs with complex SMIL animations
- Interactive SVGs with internal JavaScript
- SVGs that are edited manually frequently (optimize at build time, not in source)
- SVGs as the design source of truth (preserve the original)

---

## Study roadmap for implementation

This roadmap is progressive: each phase builds on the previous one.

### Phase 1 — Fundamentals (Week 1-2)

**Goal:** Understand SVG and the problem SVGO solves.

- [ ] Study the SVG 1.1 / SVG 2 specification (elements, attributes, coordinates)
- [ ] Learn the SVG box model (viewport, viewBox, preserveAspectRatio)
- [ ] Understand `<path>` and its commands (M, L, H, V, C, S, Q, T, A, Z)
- [ ] Study how design tools export SVG (inspect Figma vs Inkscape output)
- [ ] Install SVGO globally and explore the CLI (`--show-plugins`, `--pretty`)
- [ ] Manually optimize 10 SVGs and compare results

**Resources:**
- MDN SVG Tutorial
- SVG Essentials (book — J. David Eisenberg)
- SVGOMG — online tool for experimentation

### Phase 2 — Understanding SVGO (Week 3-4)

**Goal:** Understand the architecture and plugins internally.

- [ ] Read the SVGO source code (`lib/svgo.js`, `lib/parser.js`, `lib/stringifier.js`)
- [ ] Understand the AST format used by SVGO (xast)
- [ ] Study 5 simple plugins (e.g. `removeComments`, `removeDoctype`, `cleanupAttrs`)
- [ ] Study 3 complex plugins (e.g. `convertPathData`, `mergePaths`, `convertTransform`)
- [ ] Understand the Visitor Pattern and how it applies to plugins
- [ ] Read plugin tests to understand edge cases

**Resources:**
- Source code: `github.com/svg/svgo/tree/main/plugins`

### Phase 3 — Configuration and integration (Week 5)

**Goal:** Use SVGO in advanced ways in real projects.

- [ ] Create an `svgo.config.js` for an existing project
- [ ] Integrate SVGO into a build pipeline (Vite, Webpack, or npm script)
- [ ] Set up GitHub Actions for automatic optimization on PRs
- [ ] Explore SVGR for React projects (SVG → component conversion)
- [ ] Create optimization report scripts

### Phase 4 — Custom plugins (Week 6)

**Goal:** Extend SVGO with custom logic.

- [ ] Write a simple plugin (e.g. add attributes to `<svg>`)
- [ ] Write a plugin that removes specific elements by name/attribute
- [ ] Write a plugin that transforms colors to a specific palette
- [ ] Write a plugin that validates design rules (e.g. no hardcoded `fill`)
- [ ] Test plugins with unit tests (Jest/Vitest)

### Phase 5 — Advanced topics (Week 7-8)

**Goal:** Master optimization and contribute to the ecosystem.

- [ ] Study gzip/brotli compression of SVG and how attribute ordering impacts it
- [ ] Compare SVGO with alternatives (svgcleaner, scour)
- [ ] Study the impact of SVG on Core Web Vitals (LCP, CLS)
- [ ] Explore SVG sprites vs inline SVG vs `<img src>` — trade-offs
- [ ] Analyze the SVGO changelog v1 → v2 → v3 (API changes)
- [ ] Contribute a PR to SVGO or create a plugin published on npm

---

## References

### Official documentation

- [SVGO on GitHub](https://github.com/svg/svgo) — Source code and documentation
- [SVGO on npm](https://www.npmjs.com/package/svgo) — Versions and downloads
- [SVGOMG](https://jakearchibald.github.io/svgomg/) — Web interface for SVGO

### SVG specification

- [MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) — Complete reference
- [W3C SVG 1.1](https://www.w3.org/TR/SVG11/) — Official specification
- [W3C SVG 2](https://www.w3.org/TR/SVG2/) — Current specification

### Articles and tutorials

- [Optimizing SVGs in data URIs](https://codepen.io/tigt/post/optimizing-svgs-in-data-uris) — Taylor Hunt
- [Understanding SVG Coordinate Systems](https://www.sarasoueidan.com/blog/svg-coordinate-systems/) — Sara Soueidan
- [A Practical Guide to SVGs on the Web](https://svgontheweb.com/) — Complete practical guide

### Related tools

- [SVGR Playground](https://react-svgr.com/playground/) — Convert SVG to React
- [SVG Path Editor](https://yqnn.github.io/svg-path-editor/) — Edit paths visually
- [SVG Viewer](https://www.svgviewer.dev/) — View and optimize SVGs online

---

> **Final tip:** The best learning comes from practice. Grab real SVGs from your current project, optimize them, compare visually, and read what SVGO changed. In no time, you'll be able to predict what each plugin does just by looking at the SVG.
