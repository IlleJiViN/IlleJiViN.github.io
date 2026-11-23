import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePost } from './sync-blog.mjs';
const issue = {number: 12, title: '작업 일기', user: {login: 'IlleJiViN'}, labels: [{name:'blog'}], state:'open', created_at:'2026-10-20T01:00:00Z', updated_at:'2026-10-20T02:00:00Z', html_url:'https://github.com/IlleJiViN/IlleJiViN.github.io/issues/12', body:'### 프로젝트\n\nMalSight\n\n### 날짜\n\n2026-10-19\n\n### 한 줄 소개\n\n오늘의 기록\n\n### 본문\n\n## 구현\n\n내용\n\n![사진](https://github.com/user-attachments/assets/example)\n\n### 후기\n\n배운 점'};
test('issue form preserves markdown and photos', () => { const post = parsePost(issue); assert.equal(post.project, 'MalSight'); assert.equal(post.date,'2026-10-19'); assert.match(post.body,/### 후기/); assert.match(post.body,/!\[사진\]/); });
test('only open owner-authored labeled issues publish', () => { for (const change of [{user:{login:'someone'}}, {labels:[]}, {state:'closed'}, {pull_request:{}}]) assert.equal(parsePost({...issue,...change}),null); });
test('missing content rejected and invalid date falls back', () => { assert.equal(parsePost({...issue,body:'### 프로젝트\nMalSight'}),null); assert.equal(parsePost({...issue,body:issue.body.replace('2026-10-19','2026-02-31')}).date,'2026-10-20'); });
test('GitHub pasted HTML images become safe markdown', () => { const post = parsePost({...issue,body:issue.body+'\n<img width="800" src="https://github.com/user-attachments/assets/photo" />\n<img src="javascript:alert(1)" />'}); assert.match(post.body,/!\[프로젝트 사진\]\(https:\/\/github.com\/user-attachments\/assets\/photo\)/); assert.ok(!post.body.includes('javascript:')); });

test('manual chapter order is optional for old posts', () => {
  assert.equal(parsePost(issue).order, null);
  const body = issue.body.replace('### 본문', '### 차시 순서\n\n2\n\n### 본문');
  const post = parsePost({ ...issue, body });
  assert.equal(post.order, 2);
  assert.equal(post.body, parsePost(issue).body);
});

test('chapter order accepts only positive safe integers', () => {
  for (const [value, expected] of [['1', 1], ['001', 1], ['9007199254740991', Number.MAX_SAFE_INTEGER], ['', null], ['_No response_', null], ['0', null], ['-1', null], ['1.5', null], ['1e2', null], ['+1', null], ['Infinity', null], ['9007199254740992', null], ['첫 번째', null]]) {
    const post = parsePost({ ...issue, body: issue.body.replace('### 본문', `### 차시 순서\n\n${value}\n\n### 본문`) });
    assert.equal(post.order, expected, value);
  }
});

test('order metadata appended after the body does not leak into markdown', () => {
  const original = parsePost(issue);
  const post = parsePost({ ...issue, body: `${issue.body}\n\n### 차시 순서\n\n7` });
  assert.equal(post.order, 7);
  assert.equal(post.body, original.body);
  assert.match(post.body, /### 후기/);
  assert.match(post.body, /!\[사진\]/);
  assert.ok(!post.body.includes('### 차시 순서'));
});

test('removed projects do not publish through legacy issues', () => {
  for (const project of ['mission1', 'mission2', 'Portfolio', 'MISSION1', ' portfolio ']) {
    assert.equal(parsePost({ ...issue, body: issue.body.replace('MalSight', project) }), null, project);
  }
  assert.equal(parsePost({ ...issue, body: issue.body.replace('MalSight', 'mission') }).project, 'mission');
});

test('optional TAB fields are parsed from the GitHub form without altering the post', () => {
  const original = parsePost(issue);
  assert.ok(!('tab' in original));
  const tabFields = [
    '### TAB 난이도', '', '3', '',
    '### TAB 기분', '', '차분하게, 끝은 묵직하게', '',
    '### TAB 악보', '', '```text', '| 4:E0 8:A2+D2 8:r |', '4:e3 |', '```', '',
  ].join('\n');
  const post = parsePost({ ...issue, body: issue.body.replace('### 본문', `${tabFields}\n### 본문`) });
  assert.equal(post.body, original.body);
  assert.deepEqual(post.tab, {
    score: { measures: [
      [{ duration: 4, notes: { E: 0 } }, { duration: 8, notes: { A: 2, D: 2 } }, { duration: 8, notes: {} }],
      [{ duration: 4, notes: { e: 3 } }],
    ] },
    difficulty: 3,
    mood: '차분하게, 끝은 묵직하게',
  });
});

test('TAB fields appended to existing issues ignore exact headings inside fenced markdown', () => {
  const sample = '~~~~md\n### TAB 난이도\n\n2\n### 본문\n예시\n~~~\n~~~~\n\n글의 끝';
  const metadata = '### TAB 기분\n\n느긋하게\n\n### TAB 악보\n\n8:E0 16:B2 16:r';
  const body = [issue.body, sample, metadata].join('\n\n').replaceAll('\n', '\r\n');
  const post = parsePost({ ...issue, body });
  assert.ok(post.body.endsWith(sample.replaceAll('\n', '\r\n')));
  assert.deepEqual(post.tab, {
    score: { measures: [[{ duration: 8, notes: { E: 0 } }, { duration: 16, notes: { B: 2 } }, { duration: 16, notes: {} }]] },
    difficulty: null,
    mood: '느긋하게',
  });
});

test('omitted TAB values and invalid scores do not affect the article', () => {
  const post = parsePost({ ...issue, body: `${issue.body}\n\n### TAB 난이도\n\n6\n\n### TAB 기분\n\n_No response_\n\n### TAB 악보\n\n4:e25` });
  assert.deepEqual(post, parsePost(issue));
});

test('mood and difficulty can be published before notation is written', () => {
  const mood = '🎸'.repeat(81);
  const post = parsePost({ ...issue, body: `${issue.body}\n\n### TAB 난이도\n\n5\n\n### TAB 기분\n\n${mood}` });
  assert.deepEqual(post.tab, { score: null, difficulty: 5, mood: '🎸'.repeat(80) });
});
