export interface LoginResponse {
    token: string;
}

export interface User {
    id: string;
    username: string;
}

export type Event = {
  category: string;
  event_id: number;
  id: number;
  user_id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  nb_subscribers: number;
  is_registered: boolean;
  max_subscribers: number;
  image_url?: string;

};
