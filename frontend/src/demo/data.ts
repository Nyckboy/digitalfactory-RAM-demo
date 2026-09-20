import type { UserDTO, ProjectDTO, TaskDTO, CommentDTO, ActivityLog } from '../types/api';
export const personas: UserDTO[] = [
  { id: 'admin', firstName: 'Nora', lastName: 'Bennani', email: 'nora@example.com', role: 'SUPER_ADMIN', isActive: true },
  { id: 'supervisor', firstName: 'Adam', lastName: 'Idrissi', email: 'adam@example.com', role: 'SUPERVISOR', isActive: true },
  { id: 'intern', firstName: 'Lina', lastName: 'Amrani', email: 'lina@example.com', role: 'INTERN', isActive: true },
];
export interface DemoState {
  users: UserDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
  comments: Record<string, CommentDTO[]>;
  activities: ActivityLog[];
  notifications: { id: string; recipientId: string; message: string; read: boolean; createdAt: string }[];
}
export function seed(): DemoState {
  const users = structuredClone([...personas,
    { id: 'intern-2', firstName: 'Youssef', lastName: 'Fassi', email: 'youssef@example.com', role: 'INTERN', isActive: true } as UserDTO]);
  const date = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString();
  const projects: ProjectDTO[] = [
    { id: 'p1', title: 'Passenger Experience Portal', description: 'Design a clear, accessible journey from trip planning to travel updates.', status: 'ACTIVE', createdAt: date(-12), supervisor: users[1], interns: users.slice(2) },
    { id: 'p2', title: 'Maintenance Insights', description: 'Help an operations team organize maintenance requests and spot recurring issues.', status: 'ACTIVE', createdAt: date(-7), supervisor: users[1], interns: users.slice(2) },
    { id: 'p3', title: 'Digital Onboarding', description: 'Create a welcoming onboarding experience for a new internship cohort.', status: 'COMPLETED', createdAt: date(-25), supervisor: users[1], interns: users.slice(2) },
  ];
  const titles = ['Map the passenger journey', 'Build the trip overview', 'Review accessibility', 'Prototype travel notifications', 'Design the maintenance dashboard', 'Document the onboarding flow'];
  const statuses = ['COMPLETED', 'IN_PROGRESS', 'IN_REVIEW', 'TODO', 'TODO', 'COMPLETED'] as const;
  const tasks: TaskDTO[] = titles.map((title, i) => ({
    id: 't' + (i + 1), title, description: 'Explore the requirements, prepare a proposal, and share your work for team feedback.',
    status: statuses[i], deadline: date(i + 1), projectId: i < 4 ? 'p1' : i === 4 ? 'p2' : 'p3',
    assignedTo: users[i === 3 ? 3 : 2], submissionUrl: i === 2 ? 'https://example.com/demo-deliverable' : null,
  }));
  return { users, projects, tasks,
    comments: { t3: [{ id: 'c1', content: 'The navigation is clear. Please check keyboard focus before the next review.', createdAt: date(-1), authorName: 'Adam Idrissi', authorRole: 'SUPERVISOR' }] },
    activities: [{ id: 'a1', actorName: 'Adam Idrissi', action: 'created project', target: projects[0].title, timestamp: date(-1) }],
    notifications: personas.map((u, i) => ({ id: 'n' + i, recipientId: u.id, message: 'Welcome to your sample workspace. Explore a project to get started.', read: false, createdAt: date(0) })),
  };
}
