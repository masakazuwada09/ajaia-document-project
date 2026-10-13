export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
}

export type Permission = 'owner' | 'edit' | 'view';

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  permission: 'edit' | 'view';
  created_at: string;
  user?: User;
}

export interface DocumentAttachment {
  id: string;
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  data_url: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content_html: string;
  content_json: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  shares?: DocumentShare[];
  attachments?: DocumentAttachment[];
  currentUserPermission?: Permission;
}

export const SEEDED_USERS: User[] = [
  {
    id: 'alice',
    name: 'Alice Chen',
    email: 'alice@ajaia.internal',
    role: 'Product Lead',
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'bob',
    name: 'Bob Martinez',
    email: 'bob@ajaia.internal',
    role: 'Staff Engineer',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'charlie',
    name: 'Charlie Kim',
    email: 'charlie@ajaia.internal',
    role: 'Product Designer',
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'diana',
    name: 'Diana Ross',
    email: 'diana@ajaia.internal',
    role: 'Operations Lead',
    avatarColor: 'bg-rose-600',
  },
];
