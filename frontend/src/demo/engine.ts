import { seed, personas } from './data.ts';
import type { DemoState } from './data.ts';
import type { UserDTO, ProjectDTO, TaskDTO } from '../types/api';
import type { User } from '../types/auth';
export { seed, personas };
export const id = () => crypto.randomUUID();
function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { response: { status, data: { message } } }); }
function requireItem<T>(item: T | undefined): T { return item ?? fail('This sample record no longer exists.', 404); }
function page<T>(items: T[], url: URL) {
  const number = Math.max(0, Number(url.searchParams.get('page')) || 0);
  const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 10));
  return { content: items.slice(number * size, (number + 1) * size), pageNumber: number, pageSize: size,
    totalElements: items.length, totalPages: Math.ceil(items.length / size), isLast: (number + 1) * size >= items.length };
}
export function handleRequest(db: DemoState, method: string, target: string, body: Record<string, any> = {}, user?: User | null): any {
  if (/^[a-z]+:/i.test(target) || target.startsWith('//')) fail('External requests are disabled in this demo.');
  if (!user) fail('Choose a demo role first.', 401);
  const url = new URL(target, 'https://demo.invalid');
  const path = url.pathname;
  const verb = method.toUpperCase();
  const allowed = path.startsWith('/admin/') ? 'SUPER_ADMIN' : path.startsWith('/supervisor/') ? 'SUPERVISOR' : path.startsWith('/intern/') ? 'INTERN' : user.role;
  if (allowed !== user.role) fail('Switch to the matching demo role.', 403);
  const userById = (key: string) => requireItem(db.users.find(u => u.id === key));
  const projects = user.role === 'SUPER_ADMIN' ? db.projects : db.projects.filter(p => user.role === 'SUPERVISOR' ? p.supervisor.id === user.id : p.interns.some(u => u.id === user.id));
  const tasks = db.tasks.filter(t => projects.some(p => p.id === t.projectId) && (user.role !== 'INTERN' || t.assignedTo?.id === user.id));
  const changed = (label: string) => {
    db.activities.unshift({ id: id(), actorName: user.firstName + ' ' + user.lastName, action: 'updated', target: label, timestamp: new Date().toISOString() });
    db.activities = db.activities.slice(0, 50);
    db.notifications.unshift({ id: id(), recipientId: user.id, message: label + ' updated in your demo.', read: false, createdAt: new Date().toISOString() });
    db.notifications = db.notifications.slice(0, 50);
  };
  if (path === '/admin/stats' && verb === 'GET') return { activeProjects: db.projects.filter(p => p.status === 'ACTIVE').length, teamMembers: db.users.length, tasksCompleted: db.tasks.filter(t => t.status === 'COMPLETED').length };
  if (path === '/admin/activities' && verb === 'GET') return db.activities.slice(0, Number(url.searchParams.get('limit')) || 5);
  if (path === '/admin/users' && verb === 'GET') return page(db.users, url);
  if (path === '/admin/users/register' && verb === 'POST') {
    if (db.users.length >= 50) fail('Sample workspace is full. Reset the demo to start again.');
    if (db.users.some(u => u.email === body.email)) fail('This email already exists.', 409);
    if (!['SUPER_ADMIN', 'SUPERVISOR', 'INTERN'].includes(body.role)) fail('Choose a valid role.');
    const u: UserDTO = { id: id(), firstName: body.firstName, lastName: body.lastName, email: body.email, role: body.role, isActive: true };
    db.users.push(u); changed('Team'); return u; // Password input is deliberately discarded.
  }
  const userMatch = path.match(/^\/admin\/users\/([^/]+)$/);
  if (userMatch && ['PUT', 'DELETE'].includes(verb)) {
    const u = userById(userMatch[1]);
    if (personas.some(p => p.id === u.id)) fail('The three demo personas are reserved for role switching.');
    if (verb === 'DELETE') {
      if (db.projects.some(p => p.supervisor.id === u.id || p.interns.some(i => i.id === u.id)) || db.tasks.some(t => t.assignedTo?.id === u.id)) fail('Remove project and task assignments first.', 409);
      db.users = db.users.filter(x => x.id !== u.id);
    } else {
      for (const field of ['firstName', 'lastName', 'email', 'isActive'] as const) if (body[field] !== undefined) Object.assign(u, { [field]: body[field] });
      for (const p of db.projects) { if (p.supervisor.id === u.id) p.supervisor = u; p.interns = p.interns.map(i => i.id === u.id ? u : i); }
      for (const t of db.tasks) if (t.assignedTo?.id === u.id) t.assignedTo = u;
    }
    changed('Team'); return u;
  }
  if (path === '/admin/projects/ai/draft' && verb === 'POST') return {
    title: String(body.prompt || 'New project').trim().slice(0, 80),
    description: 'Simulated AI draft: ' + String(body.prompt || '').slice(0, 500),
    tasks: [{ title: 'Discover user needs', description: 'Define the audience and acceptance criteria.' }, { title: 'Build a prototype', description: 'Explore the main workflow with sample data.' }, { title: 'Review and iterate', description: 'Collect feedback and improve the experience.' }],
  };
  if ((path === '/admin/projects' || path === '/supervisor/projects') && verb === 'GET') return page(projects, url);
  if ((path === '/admin/projects' || path === '/admin/projects/ai/confirm') && verb === 'POST') {
    if (db.projects.length >= 25) fail('Sample workspace is full. Reset to start again.');
    const draft = body.draft || body;
    const supervisor = userById(body.supervisorId);
    if (supervisor.role !== 'SUPERVISOR') fail('Choose a supervisor.');
    const interns = (body.internIds || []).map(userById);
    const p: ProjectDTO = { id: id(), title: draft.title, description: draft.description || '', createdAt: new Date().toISOString(), status: 'ACTIVE', supervisor, interns };
    db.projects.unshift(p);
    for (const task of (draft.tasks || []).slice(0, 20)) db.tasks.push({ id: id(), title: task.title, description: task.description, status: 'TODO', deadline: new Date(Date.now() + 7 * 86400000).toISOString(), projectId: p.id, assignedTo: interns[0] ?? null });
    changed(p.title); return p;
  }
  const projectMatch = path.match(/^\/(admin|supervisor)\/projects\/([^/]+)$/);
  if (projectMatch) {
    const p = requireItem(projects.find(x => x.id === projectMatch[2]));
    if (verb === 'GET') return p;
    if (verb === 'PUT') {
      const supervisor = body.supervisorId ? userById(body.supervisorId) : p.supervisor;
      const interns = body.internIds ? body.internIds.map(userById) : p.interns;
      Object.assign(p, { title: body.title ?? p.title, description: body.description ?? p.description, status: body.status ?? p.status, supervisor, interns });
      changed(p.title); return p;
    }
    if (verb === 'DELETE') {
      for (const t of db.tasks.filter(t => t.projectId === p.id)) delete db.comments[t.id];
      db.tasks = db.tasks.filter(t => t.projectId !== p.id); db.projects = db.projects.filter(x => x.id !== p.id);
      changed(p.title); return { message: 'Project removed.' };
    }
  }
  if (path === '/supervisor/dashboard/overview') {
    const p = projects[0]; const ownTasks = tasks.filter(t => t.projectId === p?.id);
    return { featuredProject: p ? { ...p, teamMembers: p.interns, progressPercentage: ownTasks.length ? Math.round(100 * ownTasks.filter(t => t.status === 'COMPLETED').length / ownTasks.length) : 0 } : null, actionRequiredTasks: tasks.filter(t => t.status === 'IN_REVIEW').length };
  }
  if (path === '/supervisor/dashboard/ongoing-tasks') return tasks.filter(t => t.status !== 'COMPLETED');
  if (path === '/supervisor/team-directory') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    return projects.map(p => { const interns = p.interns.filter(u => (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(search)); return { id: p.id, title: p.title, internCount: interns.length, interns }; });
  }
  if (path === '/intern/dashboard') return { assignedTasks: tasks.length, completedDeliverables: tasks.filter(t => t.status === 'COMPLETED').length,
    upcomingDeadlines: tasks.filter(t => t.status !== 'COMPLETED' && Date.parse(t.deadline) < Date.now() + 7 * 86400000).length, urgentTasks: tasks.filter(t => t.status !== 'COMPLETED').slice(0, 4) };
  if (path === '/intern/tasks' && verb === 'GET') return page(tasks, url);
  const projectTasks = path.match(/^\/supervisor\/projects\/([^/]+)\/tasks$/);
  if (projectTasks && verb === 'GET') return page(tasks.filter(t => t.projectId === projectTasks[1]), url);
  if (path === '/supervisor/tasks' && verb === 'POST') {
    const p = requireItem(projects.find(p => p.id === body.projectId));
    if (db.tasks.length >= 150) fail('Sample workspace is full. Reset to start again.');
    const assignedTo = body.assignedToId ? requireItem(p.interns.find(u => u.id === body.assignedToId)) : null;
    const t: TaskDTO = { id: id(), title: body.title, description: body.description, deadline: body.deadline, projectId: p.id, status: 'TODO', assignedTo };
    db.tasks.unshift(t); changed(t.title); return t;
  }
  const taskMatch = path.match(/^\/(supervisor|intern)\/tasks\/([^/]+)(\/comments)?$/);
  if (taskMatch) {
    const t = requireItem(tasks.find(t => t.id === taskMatch[2]));
    if (taskMatch[3]) {
      if (verb === 'GET') return db.comments[t.id] || [];
      if (verb === 'POST') {
        if (!String(body.content || '').trim()) fail('Write a comment first.');
        const comment = { id: id(), content: String(body.content).slice(0, 2000), createdAt: new Date().toISOString(), authorName: user.firstName + ' ' + user.lastName, authorRole: user.role };
        db.comments[t.id] = [...(db.comments[t.id] || []).slice(-49), comment]; changed(t.title); return comment;
      }
    }
    if (verb === 'GET') return t;
    if (verb === 'PUT' || verb === 'PATCH') {
      if (body.status && !['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'].includes(body.status)) fail('Invalid task status.');
      if (body.submissionUrl && !/^https?:\/\//i.test(body.submissionUrl)) fail('Use an http or https deliverable URL.');
      if (user.role === 'SUPERVISOR') {
        for (const key of ['title', 'description', 'deadline'] as const) if (body[key] !== undefined) t[key] = body[key];
        if (body.assignedToId !== undefined) {
          const p = requireItem(projects.find(p => p.id === t.projectId));
          t.assignedTo = body.assignedToId ? requireItem(p.interns.find(u => u.id === body.assignedToId)) : null;
        }
      }
      if (body.status) t.status = body.status;
      if (body.submissionUrl !== undefined) t.submissionUrl = body.submissionUrl;
      changed(t.title); return t;
    }
    if (verb === 'DELETE' && user.role === 'SUPERVISOR') { db.tasks = db.tasks.filter(x => x.id !== t.id); delete db.comments[t.id]; changed(t.title); return {}; }
  }
  if (path === '/notifications/unread' && verb === 'GET') return db.notifications.filter(n => n.recipientId === user.id && !n.read);
  if (path === '/notifications/read-all' && verb === 'PUT') { db.notifications.filter(n => n.recipientId === user.id).forEach(n => { n.read = true; }); return {}; }
  const notificationMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notificationMatch && verb === 'PUT') { requireItem(db.notifications.find(n => n.id === notificationMatch[1] && n.recipientId === user.id)).read = true; return {}; }
  return fail('This action is not available in the demo.', 404);
}
