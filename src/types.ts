export interface Todo {
  id: number;
  title: string;
  completed: number | boolean; // SQLite stores boolean as 0/1
  created_at: string;
}
