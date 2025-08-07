export interface Project {
  id: string;
  project_name: string;
  description: string | null;
  target_path: string;
  media_path: string | null;
  status: string;
  user_id: string;
}