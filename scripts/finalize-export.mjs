import { access, copyFile, mkdir } from 'node:fs/promises';

// GitHub Pages serves /blog/ from blog/index.html. Vinext exports blog.html.
const root = new URL('../dist/client/', import.meta.url);
await access(new URL('blog.html', root));
await mkdir(new URL('blog/', root), { recursive: true });
await copyFile(new URL('blog.html', root), new URL('blog/index.html', root));
await copyFile(new URL('blog.rsc', root), new URL('blog/index.rsc', root));
console.log('Verified and packaged /blog/ for GitHub Pages');
