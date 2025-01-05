import { defineConfig } from "@rsbuild/core";
import { pluginPreact } from "@rsbuild/plugin-preact";


export default defineConfig({
  resolve: {
    alias: {
      "react": "./node_modules/preact/compat",
      "react-dom": "./node_modules/preact/compat",
      "@shared": "./src/shared",
      "@extension": "./src/extension",
      "@webview-ui": "./src/webview-ui"
    }
  },
  output: {
    externals: ["vscode"]
  },
  performance: {
    chunkSplit: {
      strategy: "all-in-one"
    }
  },
  environments: {
    extension: {
      source: {
        entry: {
          index: "./src/extension/index.ts"
        }
      },
      output: {
        target: "node",
        filename: {
          js: "extension.js"
        },
        distPath: {
          root: "dist",
          js: "",
          jsAsync: "",
          css: "css",
          cssAsync: "css",
          svg: "imgs",
          font: "fonts",
          html: "",
          wasm: "wasm",
          image: "imgs",
          media: "assets",
          assets: "assets"
        }
      }
    },
    webview: {
      source: {
        entry: {
          index: "./src/webview-ui/index.tsx"
        }
      },
      output: {
        target: "web-worker",
        emitCss: true,
        filename: {
          js: "webview.js",
          css: "webview.css"
        },
        distPath: {
          root: "dist",
          js: "",
          jsAsync: "",
          css: "css",
          cssAsync: "css",
          svg: "imgs",
          font: "fonts",
          html: "",
          wasm: "wasm",
          image: "imgs",
          media: "assets",
          assets: "assets"
        }
      },
      plugins: [pluginPreact()]
    }
  },
  tools: {
    rspack: {
      output: {
        asyncChunks: false
      }
    },
    bundlerChain: (chain) => {
      chain.module
        .rule("RULE.WASM")
        .test(/\.wasm$/)
        .type("asset/resource");
    }
  }
});