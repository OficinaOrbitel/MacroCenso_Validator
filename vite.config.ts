import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig({
    plugins: [
        react(),
        viteSingleFile(),
        {
            name: 'fix-file-protocol',
            closeBundle() {
                const distDir = path.resolve(__dirname, 'dist');
                const htmlFile = path.join(distDir, 'index.html');
                if (!fs.existsSync(htmlFile)) return;

                let html = fs.readFileSync(htmlFile, 'utf-8');

                    // Remove type="module crossorigin"
                    html = html.replace('<script type="module" crossorigin>', '<script>');

                    // Wrap entire inline script in DOMContentLoaded listener
                    // Pattern: find <script>...</script>, prepend listener wrapper
                    html = html.replace(
                        /(<script>)([\s\S]*?)(<\/script>)/,
                        (_, open, content, close) => {
                            return `${open}document.addEventListener("DOMContentLoaded",function(){${content}});${close}`;
                        }
                    );

                fs.writeFileSync(htmlFile, html, 'utf-8');
            },
        },
    ],
    build: {
        outDir: 'dist',
        target: 'es2015',
        rollupOptions: {
            output: {
                format: 'iife',
                inlineDynamicImports: true,
            },
        },
    },
});
