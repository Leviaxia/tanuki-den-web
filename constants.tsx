
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Eula: Lawrence Clan 1/7 Scale',
    category: 'Scale',
    price: 760000,
    description: 'Highly detailed PVC figure of Eula from Genshin Impact. Includes signature claymore and thematic base. Tamaño: 26 cm.',
    image: 'https://picsum.photos/id/102/600/800',
    stock: 5,
    rating: 4.9,
    collectionId: 3
  },
  {
    id: '2',
    name: 'Denji Nendoroid #1560',
    category: 'Nendoroid',
    price: 220000,
    description: 'Chainsaw Man protagonist in cute nendoroid form. Includes Pochita and multiple face plates. Tamaño: 10 cm.',
    image: 'https://picsum.photos/id/103/600/800',
    stock: 12,
    rating: 4.8,
    collectionId: 2
  },
  {
    id: '3',
    name: 'Hollow Knight Silkset - Limited Edition',
    category: 'Limited',
    price: 980000,
    description: 'Hand-painted resin statue of Hornet. Extremely limited run of 500 units worldwide. Tamaño: 35 cm.',
    image: 'https://picsum.photos/id/104/600/800',
    stock: 2,
    rating: 5.0,
    collectionId: 6
  },
  {
    id: '4',
    name: 'Dragon Ball Z Scouter - Red Lens',
    category: 'Accessory',
    price: 100000,
    description: 'Functional toy scouter with sounds and lights. Perfect for cosplay or display. Tamaño: 15 cm.',
    image: 'https://picsum.photos/id/106/600/800',
    stock: 25,
    rating: 4.5,
    collectionId: 5
  },
  {
    id: '5',
    name: 'Marin Kitagawa - Dress-up Darling 1/6',
    category: 'Scale',
    price: 640000,
    description: 'Stunning scale figure showcasing Marin in her iconic school uniform. Vibrant colors and textures. Tamaño: 24 cm.',
    image: 'https://picsum.photos/id/107/600/800',
    stock: 8,
    rating: 4.9,
    collectionId: 2
  },
  {
    id: '6',
    name: 'Zoro Three-Sword Style Desk Lamp',
    category: 'Accessory',
    price: 180000,
    description: 'Stylized LED lamp featuring Roronoa Zoro silhouette with glowing sword effects. Tamaño: 40 cm.',
    image: 'https://picsum.photos/id/108/600/800',
    stock: 15,
    rating: 4.7,
    collectionId: 2
  }
];

export const heroText = {
  title: "Tesoros",
  subtitle: "Con Alma.",
  description: "Más que figuras, custodiamos historias. Piezas seleccionadas para coleccionistas que valoran la autenticidad y el detalle.",
  secondary: "Boutique de Arte Anime"
};

export const MISSIONS = [
  {
    id: 'first_step',
    title: 'Primer Paso',
    description: 'Crea tu cuenta en el Tanuki Den.',
    target: 1,
    reward: 100,
    icon: 'UserCheck'
  },
  {
    id: 'active_member',
    title: 'Miembro Activo',
    description: 'Inicia sesión 3 días consecutivos.',
    target: 3,
    reward: 200,
    icon: 'Flame'
  },
  {
    id: 'collector_fire',
    title: 'Fuego Coleccionista',
    description: 'Explora 10 tesoros diferentes.',
    target: 10,
    reward: 50,
    icon: 'Map'
  },
  {
    id: 'treasure_hunter',
    title: 'Cazador de Tesoros',
    description: 'Añade 5 ítems a favoritos o al carrito.',
    target: 5,
    reward: 150,
    icon: 'ShoppingBag'
  },
  {
    id: 'first_treasure',
    title: 'Primer Tesoro',
    description: 'Realiza tu primera compra.',
    target: 1,
    reward: 500,
    icon: 'Star'
  },
  // NEW MISSIONS
  {
    id: 'shrine_explorer',
    title: 'Explorador del Santuario',
    description: 'Ver 25 productos diferentes.',
    target: 25,
    reward: 150,
    icon: 'Search'
  },
  {
    id: 'clan_curator',
    title: 'Curador del Clan',
    description: 'Agregar 10 productos a favoritos.',
    target: 10,
    reward: 200,
    icon: 'Heart'
  },
  {
    id: 'tanuki_ambassador',
    title: 'Embajador Tanuki',
    description: 'Compartir 3 productos.',
    target: 3,
    reward: 150,
    icon: 'Share2'
  },
  {
    id: 'second_treasure',
    title: 'Segundo Tesoro',
    description: 'Realiza 2 compras.',
    target: 2,
    reward: 300,
    icon: 'ShoppingBag'
  },
  {
    id: 'persistent_collector',
    title: 'Coleccionista Persistente',
    description: 'Realiza 5 compras acumuladas.',
    target: 5,
    reward: 600,
    icon: 'Layers'
  },
  {
    id: 'great_hoarder',
    title: 'Gran Acumulador',
    description: 'Alcanzar $500.000 COP en compras acumuladas.',
    target: 500000,
    reward: 700,
    icon: 'Gem'
  },
  {
    id: 'workshop_forger',
    title: 'Forjador del Taller',
    description: 'Realiza el primer pedido de impresión 3D.',
    target: 1,
    reward: 400,
    icon: 'Printer'
  },
  {
    id: 'mold_master',
    title: 'Maestro del Molde',
    description: 'Realiza 3 pedidos 3D personalizados.',
    target: 3,
    reward: 800,
    icon: 'Box'
  },
  {
    id: 'forest_guardian',
    title: 'Guardián del Bosque',
    description: 'Iniciar sesión 7 días consecutivos.',
    target: 7,
    reward: 250,
    icon: 'ShieldCheck'
  },
  {
    id: 'constant_spirit',
    title: 'Espíritu Constante',
    description: 'Iniciar sesión 30 días acumulados.',
    target: 30,
    reward: 500,
    icon: 'Calendar'
  },
  {
    id: 'legend_clan',
    title: 'Leyenda del Clan',
    description: 'Acumular $1.000.000 COP en compras totales.',
    target: 1000000,
    reward: 2000,
    icon: 'Crown'
  }
];
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

export const ANIME_PLAYLIST = [
  {
    title: 'Gurenge',
    anime: 'Demon Slayer',
    url: 'https://archive.org/download/tv-anime-kimetsu-no-yaiba-opening-theme-gurenge-lisa/TV%20Anime%20%22Kimetsu%20no%20Yaiba%22%20Opening%20Theme%20-%20Gurenge%20%20LiSA.mp3', // Public Archive.org link
    cover: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=200&auto=format&fit=crop'
  },
  {
    title: 'Blue Bird',
    anime: 'Naruto Shippuden',
    url: 'https://archive.org/download/blue-bird-naruto-shippuden-op-3/Blue%20Bird%20-%20Naruto%20Shippuden%20Op%203.mp3',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop'
  },
  {
    title: 'Cha-La Head-Cha',
    anime: 'Dragon Ball Z',
    url: 'https://archive.org/download/cha-la-head-cha-official-theme-song-dragon-ball-z_202102/Cha-La%20Head-Cha%20%28Official%20Theme%20Song%29%20-%20Dragon%20Ball%20Z.mp3',
    cover: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?q=80&w=200&auto=format&fit=crop'
  },
  {
    title: 'A Cruel Angel\'s Thesis',
    anime: 'Evangelion',
    url: 'https://archive.org/download/neon-genesis-evangelion-opening-full-japanese/Neon%20Genesis%20Evangelion%20Opening%20Full%20Japanese.mp3',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop'
  }
];
