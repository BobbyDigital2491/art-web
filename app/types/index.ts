export interface Project {
  id: string;
  project_name: string;
  description: string | null;
  target_path: string | null;
  media_path?: string | null;
  updated_at: string;
  project_type?: string | null;
  views?: number;
  scans?: number;
  status?: string;
  user_id?: string;
}