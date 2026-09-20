import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seed, personas, handleRequest } from '../src/demo/engine.ts';
const [admin, supervisor, intern] = personas;
const call = (db, method, path, body = {}, user = admin) => handleRequest(db, method, path, body, user);
test('seed is independent and dashboards match assigned sample work', () => {
  const db = seed(); db.projects[0].title = 'Changed';
  assert.notEqual(seed().projects[0].title, 'Changed');
  assert.equal(call(db, 'GET', '/admin/stats').activeProjects, 2);
  assert.equal(call(db, 'GET', '/intern/tasks', {}, intern).totalElements, 5);
  assert.equal(call(db, 'GET', '/supervisor/projects', {}, supervisor).totalElements, 3);
});
test('local API blocks unknown routes, wrong roles and external URLs', () => {
  const db = seed();
  for (const path of ['/missing', 'https://example.com/api', '//example.com/api']) assert.throws(() => call(db, 'GET', path));
  assert.throws(() => call(db, 'GET', '/admin/users', {}, intern));
  assert.throws(() => handleRequest(db, 'GET', '/admin/users', {}, null));
});
test('project creation, task assignment, submission, discussion and review', () => {
  const db = seed();
  const project = call(db, 'POST', '/admin/projects', { title: 'Demo project', supervisorId: supervisor.id, internIds: [intern.id] });
  const task = call(db, 'POST', '/supervisor/tasks', { title: 'Prepare prototype', description: 'Sample', projectId: project.id, assignedToId: intern.id, deadline: '2027-01-01' }, supervisor);
  call(db, 'PATCH', '/intern/tasks/' + task.id, { status: 'IN_REVIEW', submissionUrl: 'https://example.com/work' }, intern);
  call(db, 'POST', '/supervisor/tasks/' + task.id + '/comments', { content: 'Looks good.' }, supervisor);
  assert.equal(call(db, 'GET', '/intern/tasks/' + task.id + '/comments', {}, intern)[0].content, 'Looks good.');
  call(db, 'PUT', '/supervisor/tasks/' + task.id, { status: 'COMPLETED' }, supervisor);
  assert.equal(db.tasks.find(t => t.id === task.id).status, 'COMPLETED');
  call(db, 'DELETE', '/admin/projects/' + project.id);
  assert.ok(!db.tasks.some(t => t.projectId === project.id));
  assert.equal(db.comments[task.id], undefined);
});
test('simulated drafts become local projects and tasks', () => {
  const db = seed();
  const draft = call(db, 'POST', '/admin/projects/ai/draft', { prompt: 'Team onboarding' });
  assert.match(draft.description, /Simulated/);
  const p = call(db, 'POST', '/admin/projects/ai/confirm', { draft, supervisorId: supervisor.id, internIds: [intern.id] });
  assert.equal(db.tasks.filter(t => t.projectId === p.id).length, 3);
});
test('passwords are discarded and built-in personas remain available', () => {
  const db = seed();
  const u = call(db, 'POST', '/admin/users/register', { firstName: 'Sample', lastName: 'Person', email: 'sample@example.com', password: 'do-not-store', role: 'INTERN' });
  assert.ok(!JSON.stringify(db).includes('do-not-store'));
  assert.throws(() => call(db, 'DELETE', '/admin/users/' + admin.id));
  call(db, 'DELETE', '/admin/users/' + u.id);
  assert.ok(!db.users.some(x => x.id === u.id));
});
test('unsafe deliverable URLs are rejected and task ownership is scoped', () => {
  const db = seed();
  assert.throws(() => call(db, 'PATCH', '/intern/tasks/t3', { submissionUrl: 'javascript:alert(1)' }, intern));
  assert.throws(() => call(db, 'PATCH', '/intern/tasks/t4', { status: 'COMPLETED' }, intern));
});
test('notification mutations and pagination remain local and consistent', () => {
  const db = seed();
  const notes = call(db, 'GET', '/notifications/unread', {}, intern);
  assert.equal(notes.length, 1);
  call(db, 'PUT', '/notifications/' + notes[0].id + '/read', {}, intern);
  assert.equal(call(db, 'GET', '/notifications/unread', {}, intern).length, 0);
  const page = call(db, 'GET', '/admin/users?page=1&size=2');
  assert.equal(page.content.length, 2); assert.equal(page.isLast, true);
});
test('production transport and deployment routes are absent', () => {
  const api = readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
  const notifications = readFileSync(new URL('../src/context/NotificationContext.tsx', import.meta.url), 'utf8');
  const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8');
  const pipeline = readFileSync(new URL('../../Jenkinsfile', import.meta.url), 'utf8');
  assert.match(api, /adapter: demoAdapter/);
  assert.doesNotMatch(api, /baseURL|VITE_API/);
  assert.doesNotMatch(notifications, /new Client|WebSocket\(/);
  assert.doesNotMatch(nginx, /proxy_pass/);
  assert.doesNotMatch(pipeline, /credentials\(|docker rm|8082|3003|my-app-/);
});
