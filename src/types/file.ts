export type FileResponse = {
  id: string;
  user_id: string;
  bucket: string;
  object_path: string;
  file_name: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
};
