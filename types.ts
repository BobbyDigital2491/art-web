export interface Project {
  id: string;
  project_name: string;
  description: string;
  target_path: string;
  media_path?: string | null;
  updated_at: string;
  project_type?: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  profile_picture: string | null;
  updated_at: string | null;
}