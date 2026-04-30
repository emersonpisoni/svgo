import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          multipass: true,
          plugins: [
            // Remove XML comments (<!-- Generator: Adobe Illustrator ... -->)
            'removeComments',
            // Remove <metadata> with RDF/Dublin Core
            'removeMetadata',
            // Remove <?xml version="1.0"?>
            'removeXMLProcInst',
            // Remove DOCTYPE declaration
            'removeDoctype',
            // Remove xmlns from Illustrator, Sketch, Inkscape, Sodipodi
            'removeEditorsNSData',
            // Remove empty <g>, <defs> and other containers
            'removeEmptyContainers',
            // Flatten unnecessary wrapping <g> elements
            'collapseGroups',
            // Remove elements with display="none" or visibility="hidden"
            'removeHiddenElems',
            // Remove unreferenced filters, clipPaths, gradients
            'removeUselessDefs',
            // Remove attributes with empty values
            'removeEmptyAttrs',
            // Remove unnecessary zeros (50.0000 → 50)
            'cleanupNumericValues',
            // Remove or minify unreferenced IDs
            'cleanupIds',
            // Minify <style> blocks inside SVG
            'minifyStyles',
            // Simplify <path> commands (M, L, C → shorter forms)
            'convertPathData',
            // Remove attributes with values that are already the default
            'removeUnknownsAndDefaults',
            // Remove width/height and rely on viewBox for scaling
            'removeDimensions',
          ],
        },
      },
      include: '**/*.svg?react',
    }),
  ],
});