import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        plugins: [
          // '@svgr/plugin-svgo', 
          '@svgr/plugin-jsx'
        ],
        // svgoConfig: {
        //   multipass: true,
        //   plugins: [
        //     'removeComments',
        //     'removeMetadata',
        //     'removeXMLProcInst',
        //     'removeDoctype',
        //     'removeEditorsNSData',
        //     'removeEmptyContainers',
        //     'collapseGroups',
        //     'removeHiddenElems',
        //     'removeUselessDefs',
        //     'removeEmptyAttrs',
        //     'cleanupNumericValues',
        //     'cleanupIds',
        //     'minifyStyles',
        //     'convertPathData',
        //     'removeUnknownsAndDefaults',
        //     'removeDimensions',
        //   ],
        // },
      },
      include: '**/*.svg?react',
    }),
  ],
});