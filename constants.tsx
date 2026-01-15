
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Eula: Lawrence Clan 1/7 Scale',
    category: 'Scale',
    price: 189.99,
    description: 'Highly detailed PVC figure of Eula from Genshin Impact. Includes signature claymore and thematic base.',
    image: 'https://picsum.photos/id/102/600/800',
    stock: 5,
    rating: 4.9,
    collectionId: 3
  },
  {
    id: '2',
    name: 'Denji Nendoroid #1560',
    category: 'Nendoroid',
    price: 54.99,
    description: 'Chainsaw Man protagonist in cute nendoroid form. Includes Pochita and multiple face plates.',
    image: 'https://picsum.photos/id/103/600/800',
    stock: 12,
    rating: 4.8,
    collectionId: 2
  },
  {
    id: '3',
    name: 'Hollow Knight Silkset - Limited Edition',
    category: 'Limited',
    price: 245.00,
    description: 'Hand-painted resin statue of Hornet. Extremely limited run of 500 units worldwide.',
    image: 'https://picsum.photos/id/104/600/800',
    stock: 2,
    rating: 5.0,
    collectionId: 6
  },
  {
    id: '4',
    name: 'Dragon Ball Z Scouter - Red Lens',
    category: 'Accessory',
    price: 24.99,
    description: 'Functional toy scouter with sounds and lights. Perfect for cosplay or display.',
    image: 'https://picsum.photos/id/106/600/800',
    stock: 25,
    rating: 4.5,
    collectionId: 5
  },
  {
    id: '5',
    name: 'Marin Kitagawa - Dress-up Darling 1/6',
    category: 'Scale',
    price: 159.00,
    description: 'Stunning scale figure showcasing Marin in her iconic school uniform. Vibrant colors and textures.',
    image: 'https://picsum.photos/id/107/600/800',
    stock: 8,
    rating: 4.9,
    collectionId: 2
  },
  {
    id: '6',
    name: 'Zoro Three-Sword Style Desk Lamp',
    category: 'Accessory',
    price: 45.00,
    description: 'Stylized LED lamp featuring Roronoa Zoro silhouette with glowing sword effects.',
    image: 'https://picsum.photos/id/108/600/800',
    stock: 15,
    rating: 4.7,
    collectionId: 2
  }
];

export const heroText = {
  title: "Tesoros",
  accent: "Mágicos",
  sub: "Descubre figuras exclusivas y tesoros artesanales inspirados en tus mundos favoritos."
};

export const collectionsContent = [
  { 
    id: 1, 
    title: 'Brisa de Ghibli', 
    image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=800&auto=format&fit=crop', 
    description: 'Piezas que evocan la nostalgia y la magia de los mundos de Studio Ghibli.',
    rotation: '-3deg',
    accent: '#81C784'
  },
  { 
    id: 2, 
    title: 'Guerreros Cyber', 
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop', 
    description: 'La tecnología y el espíritu samurái se fusionan en estas figuras futuristas.',
    rotation: '2deg',
    accent: '#C14B3A'
  },
  { 
    id: 3, 
    title: 'Misterios de Teyvat', 
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=800&auto=format&fit=crop', 
    description: 'Viaja por las naciones de Genshin Impact con nuestros héroes favoritos.',
    rotation: '-1deg',
    accent: '#D4AF37'
  },
  { 
    id: 4, 
    title: 'Sombras de Kyoto', 
    image: 'https://images.unsplash.com/photo-1528164344705-47542687990d?q=80&w=800&auto=format&fit=crop', 
    description: 'Estética tradicional japonesa reimaginada para tu colección personal.',
    rotation: '4deg',
    accent: '#3A332F'
  },
  { 
    id: 5, 
    title: 'Reliquias Retro', 
    image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?q=80&w=800&auto=format&fit=crop', 
    description: 'Tesoros de los 80s y 90s que marcaron nuestra infancia.',
    rotation: '-2deg',
    accent: '#5D4037'
  },
  { 
    id: 6, 
    title: 'Bosque Sagrado', 
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', 
    description: 'Criaturas místicas y guardianes de la naturaleza en resina y PVC.',
    rotation: '1deg',
    accent: '#4A6741'
  },
];
