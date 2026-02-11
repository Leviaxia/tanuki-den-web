
export interface User {
  id: string;
  name: string;
  realName?: string;
  photo: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  location?: string;
  isRegistered: boolean;
  membership?: 'bronze' | 'silver' | 'gold' | 'founder';
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[]; // Base64 strings
  date: string;
  likes: number;
  dislikes: number;
}

export interface Collection {
  id: number;
  title: string;
  image: string;
  description: string;
  rotation: string;
  accent: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Scale' | 'Nendoroid' | 'Accessory' | 'Limited' | string; // Allow dynamic strings
  price: number;
  description: string;
  image: string;
  stock: number;
  rating: number;
  reviews?: Review[];
  collectionId?: number;
  benefits?: string[];
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number; // e.g. 10 views
  reward: number; // coins
  icon: string; // lucide icon name or image path
}

export interface UserMission {
  mission_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  tier: 1 | 2 | 3 | 4;
  type: 'digital' | 'coupon' | 'feature' | 'physical';
  value: any; // Flexible JSON structure
  stock?: number | null;
}

export interface UserReward {
  id: string; // uuid
  user_id: string;
  reward_id: string;
  status: 'active' | 'used' | 'expired';
  redeemed_at: string;
  expires_at?: string;
  coupon_code?: string; // Derived from value logic if applicable
}