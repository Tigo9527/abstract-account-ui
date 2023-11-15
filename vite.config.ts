import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// import {nodePolyfills} from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  //   nodePolyfills({
  //   globals: {
  //     Buffer: false, // can also be 'build', 'dev', or false
  //     // global: true,
  //     // process: true,
  //   },
  // }),
  ],
  server: {
    proxy: {
      '/nft-house': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(
                "Sending Request:",
                req.method,
                req.url,
                " => TO THE TARGET =>  ",
                proxyReq.method,
                proxyReq.protocol,
                proxyReq.host,
                proxyReq.path,
                // JSON.stringify(proxyReq.getHeaders()),
            );
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
                "Received Response from the Target:",
                proxyRes.statusCode,
                req.url,
                JSON.stringify(proxyRes.headers),
            );
          });
        },
      },
      '/proxy': {
        target: "https://evmtestnet.confluxrpc.com",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api': {
        target: "https://evmapi-testnet.confluxscan.io",
        changeOrigin: true,
      }
    },
  },
})
