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

test('optional drum fields are parsed from the GitHub form without altering the post', () => {
  const original = parsePost(issue);
  assert.ok(!('tab' in original));
  const tabFields = [
    '### 드럼 난이도', '', '3', '',
    '### 드럼 기분', '', '차분하게, 끝은 묵직하게', '',
    '### 드럼 악보', '', '```text', '| 4:BD 8:HH+SD 8:r |', '4:CR |', '```', '',
  ].join('\n');
  const post = parsePost({ ...issue, body: issue.body.replace('### 본문', `${tabFields}\n### 본문`) });
  assert.equal(post.body, original.body);
  assert.deepEqual(post.tab, {
    score: { measures: [
      [{ duration: 4, notes: ['BD'] }, { duration: 8, notes: ['HH', 'SD'] }, { duration: 8, notes: [] }],
      [{ duration: 4, notes: ['CR'] }],
    ] },
    difficulty: 3,
    mood: '차분하게, 끝은 묵직하게',
  });
});

test('drum fields appended to existing issues ignore exact headings inside fenced markdown', () => {
  const sample = '~~~~md\n### 드럼 난이도\n\n2\n### 본문\n예시\n~~~\n~~~~\n\n글의 끝';
  const metadata = '### 드럼 기분\n\n느긋하게\n\n### 드럼 악보\n\n8:BD 16:HH 16:r';
  const body = [issue.body, sample, metadata].join('\n\n').replaceAll('\n', '\r\n');
  const post = parsePost({ ...issue, body });
  assert.ok(post.body.endsWith(sample.replaceAll('\n', '\r\n')));
  assert.deepEqual(post.tab, {
    score: { measures: [[{ duration: 8, notes: ['BD'] }, { duration: 16, notes: ['HH'] }, { duration: 16, notes: [] }]] },
    difficulty: null,
    mood: '느긋하게',
  });
});

test('omitted drum values and invalid scores do not affect the article', () => {
  const post = parsePost({ ...issue, body: `${issue.body}\n\n### 드럼 난이도\n\n6\n\n### 드럼 기분\n\n_No response_\n\n### 드럼 악보\n\n4:XX` });
  assert.deepEqual(post, parsePost(issue));
});

test('mood and difficulty can be published before notation is written', () => {
  const mood = '🥁'.repeat(81);
  const post = parsePost({ ...issue, body: `${issue.body}\n\n### 드럼 난이도\n\n5\n\n### 드럼 기분\n\n${mood}` });
  assert.deepEqual(post.tab, { score: null, difficulty: 5, mood: '🥁'.repeat(80) });
});

test('GitHub drum score field publishes tuplets alongside the original article', () => {
  const body = `${issue.body}\n\n### 드럼 악보\n\n~~~text\n3:2[8:BD 8:r 8:SD] 4:RD\n~~~`;
  const post = parsePost({ ...issue, body });
  assert.equal(post.body, parsePost(issue).body);
  assert.deepEqual(post.tab.score.tuplets, [{ measure: 0, start: 0, length: 3, count: 3, inTimeOf: 2 }]);
  assert.deepEqual(post.tab.score.measures[0][3], { duration: 4, notes: ['RD'] });
});

test('legacy TAB metadata is preserved without treating guitar notes as drum hits', () => {
  const legacy = `${issue.body}\n\n### TAB 난이도\n\n3\n\n### TAB 기분\n\n느긋하게\n\n### TAB 악보\n\n4:E0`;
  const post = parsePost({ ...issue, body: legacy });
  assert.equal(post.body, parsePost(issue).body);
  assert.deepEqual(post.tab, { score: null, difficulty: 3, mood: '느긋하게' });
  const updated = parsePost({ ...issue, body: `${legacy}\n\n### 드럼 기분\n\n_No response_\n\n### 드럼 악보\n\n4:BD` });
  assert.deepEqual(updated.tab, { score: { measures: [[{ duration: 4, notes: ['BD'] }]] }, difficulty: 3, mood: '' });
});
