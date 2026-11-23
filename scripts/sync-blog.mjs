import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isHiddenProject } from '../app/blog/series.mjs';
import { parseTabScore, TAB_MOOD_MAX } from '../app/blog/tabScore.mjs';

const fieldHeading = /^### (프로젝트|날짜|차시 순서|한 줄 소개|TAB 난이도|TAB 기분|TAB 악보|본문)$/;

function parseFields(body) {
  const fields = {};
  let field;
  let value = '';
  let fence;

  function saveField() {
    if (field) fields[field] = value.trim().replace(/^_No response_$/, '');
  }

  for (const line of body.split(/(?<=\n)/)) {
    const text = line.replace(/\r?\n$/, '');
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(text);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
    } else {
      const heading = fieldHeading.exec(text);
      if (heading) {
        saveField();
        field = heading[1];
        value = '';
        continue;
      }
      if (marker && (marker[1][0] === '~' || !marker[2].includes('`'))) fence = marker[1];
    }
    if (field) value += line;
  }
  saveField();
  return fields;
}

export function parsePost(issue) {
  if (issue.pull_request || issue.user?.login?.toLowerCase() !== 'illejivin' || issue.state !== 'open' || !issue.labels?.some(label => (typeof label === 'string' ? label : label.name) === 'blog')) return null;
  const fields = parseFields(issue.body || '');
  if (!fields['본문']) return null;
  const project = fields['프로젝트'] || '일반 일기';
  if (isHiddenProject(project)) return null;
  const rawOrder = fields['차시 순서'] || '';
  const parsedOrder = /^\d+$/.test(rawOrder) ? Number(rawOrder) : NaN;
  const order = Number.isSafeInteger(parsedOrder) && parsedOrder > 0 ? parsedOrder : null;
  const date = fields['날짜'];
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  const body = fields['본문'].replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src || !/^https:\/\/(?:github\.com\/user-attachments\/assets\/|user-images\.githubusercontent\.com\/)/i.test(src)) return '';
    return `![프로젝트 사진](${src})`;
  });
  const score = parseTabScore(fields['TAB 악보'] || '');
  const difficulty = /^[1-5]$/.test(fields['TAB 난이도'] || '') ? Number(fields['TAB 난이도']) : null;
  const mood = Array.from((fields['TAB 기분'] || '').split(/\r?\n/, 1)[0].trim()).slice(0, TAB_MOOD_MAX).join('');
  const tab = score || difficulty || mood ? { score, difficulty, mood } : undefined;
  return { id: issue.number, title: issue.title, project, order, date: validDate ? date : issue.created_at.slice(0, 10), updated: issue.updated_at, excerpt: fields['한 줄 소개'] || '', body, url: issue.html_url, ...(tab ? { tab } : {}) };
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
