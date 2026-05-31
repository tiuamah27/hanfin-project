// ============================================
// User / Profile Types
// ============================================

export type ProfileRole = 'husband' | 'wife' | 'member';

export interface Profile {
  id: string;
  name: string;
  role: ProfileRole;
  avatar_url: string | null;
  created_at: string;
}
