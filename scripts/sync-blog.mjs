import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function parsePost(issue) {
  if (issue.pull_request || issue.user?.login?.toLowerCase() !== 'illejivin' || issue.state !== 'open' || !issue.labels?.some(label => (typeof label === 'string' ? label : label.name) === 'blog')) return null;
  const fields = {};
  for (const match of (issue.body || '').matchAll(/^### (프로젝트|날짜|한 줄 소개|본문)\r?\n([\s\S]*?)(?=^### (?:프로젝트|날짜|한 줄 소개|본문)\r?$|$(?![\s\S]))/gm)) {
    fields[match[1]] = match[2].trim().replace(/^_No response_$/, '');
  }
  if (!fields['본문']) return null;
  const date = fields['날짜'];
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  const body = fields['본문'].replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src || !/^https:\/\/(?:github\.com\/user-attachments\/assets\/|user-images\.githubusercontent\.com\/)/i.test(src)) return '';
    return `![프로젝트 사진](${src})`;
  });
  return { id: issue.number, title: issue.title, project: fields['프로젝트'] || '일반 일기', date: validDate ? date : issue.created_at.slice(0, 10), updated: issue.updated_at, excerpt: fields['한 줄 소개'] || '', body, url: issue.html_url };
}

export async function syncBlog() {
  const posts = [];
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.github.com/repos/IlleJiViN/IlleJiViN.github.io/issues?labels=blog&state=open&per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) }
    });
    if (!response.ok) throw new Error(`Blog sync failed: HTTP ${response.status}`);
    const issues = await response.json();
    for (const issue of issues) { const post = parsePost(issue); if (post) posts.push(post); }
    if (issues.length < 100) break;
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  await writeFile(new URL('../app/blog/posts.json', import.meta.url), JSON.stringify(posts, null, 2) + '\n');
  console.log(`Synced ${posts.length} published blog posts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await syncBlog();
