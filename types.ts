
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

export interface Product {
  id: string;
  name: string;
  category: 'Scale' | 'Nendoroid' | 'Accessory' | 'Limited';
  price: number;
  description: string;
  image: string;
  stock: number;
  rating: number;
  reviews?: Review[];
  collectionId?: number;
  benefits?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserMessage {
  role: 'user' | 'assistant';
  content: string;
}