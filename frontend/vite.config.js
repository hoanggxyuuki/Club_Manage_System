import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [
      react(),
      {
        name: 'service-worker',
        enforce: 'post',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'service-worker.js',
            source: fs.readFileSync('public/service-worker.js', 'utf-8')
          });
        }
      }
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_API_URL,
          changeOrigin: true
        }
      },
      allowedHosts: [
        'testcms.iuptit.com',
        'localhost',
        'cms.iuptit.com'            
      ]
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable sourcemaps for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@mui/material', '@emotion/react', '@emotion/styled', 'antd'],
            utils: ['axios', 'lodash', 'moment', 'date-fns'],
            charts: ['recharts', 'chart.js'],
            icons: ['@heroicons/react', 'react-icons', '@fortawesome/react-fontawesome']
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        }
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      target: 'es2015',
      cssCodeSplit: true,
      reportCompressedSize: false // Disable for faster builds
    },
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml'
        }
      }
    },
    optimizeDeps: {
      include: [
        'react-router-dom',
        'axios',
        'lodash',
        'moment',
        'date-fns',
        'hoist-non-react-statics',
        'framer-motion'
      ],
      exclude: ['@emotion/react', '@emotion/styled'],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@services': resolve(__dirname, 'src/services'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@context': resolve(__dirname, 'src/context')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },
    define: {
      global: 'globalThis'
    }
  }
})
