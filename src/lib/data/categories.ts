import type { Category, CategoryType } from "@/types";

// Mock categories matching the database seed
export const mockCategories: Category[] = [
  // Project categories
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000001",
    name: "Audiovisuel & Pro AV",
    slug: "audiovisual-pro-av",
    type: "project",
    color: "#8B5CF6",
    icon: "Video",
    sort_order: 1,
    is_active: true,
    description: "Solutions audiovisuelles professionnelles",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000002",
    name: "Retail & E-commerce",
    slug: "retail-ecommerce",
    type: "project",
    color: "#EC4899",
    icon: "ShoppingBag",
    sort_order: 2,
    is_active: true,
    description: "Commerce de détail et e-commerce",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000003",
    name: "Pro Audio Retail",
    slug: "pro-audio-retail",
    type: "project",
    color: "#F59E0B",
    icon: "Music",
    sort_order: 3,
    is_active: true,
    description: "Vente d'équipements audio professionnels",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000004",
    name: "Services & Events",
    slug: "services-events",
    type: "project",
    color: "#10B981",
    icon: "Calendar",
    sort_order: 4,
    is_active: true,
    description: "Services et événementiel",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000005",
    name: "Media Production",
    slug: "media-production",
    type: "project",
    color: "#3B82F6",
    icon: "Film",
    sort_order: 5,
    is_active: true,
    description: "Production média et contenu",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000006",
    name: "Tech & AI",
    slug: "tech-ai",
    type: "project",
    color: "#6366F1",
    icon: "Cpu",
    sort_order: 6,
    is_active: true,
    description: "Technologies et intelligence artificielle",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000007",
    name: "Fintech & Procurement",
    slug: "fintech-procurement",
    type: "project",
    color: "#14B8A6",
    icon: "Wallet",
    sort_order: 7,
    is_active: true,
    description: "Technologies financières et achats",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000008",
    name: "Data & Analytics",
    slug: "data-analytics",
    type: "project",
    color: "#0EA5E9",
    icon: "BarChart3",
    sort_order: 8,
    is_active: true,
    description: "Données et analytique",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-100000000009",
    name: "Internal Ops & Infrastructure",
    slug: "internal-ops",
    type: "project",
    color: "#64748B",
    icon: "Settings",
    sort_order: 9,
    is_active: true,
    description: "Opérations internes et infrastructure",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Revenue categories
  {
    id: "a1b2c3d4-e5f6-7890-abcd-200000000001",
    name: "Audiovisuel & Pro AV",
    slug: "revenue-audiovisual",
    type: "revenue",
    color: "#8B5CF6",
    icon: "Video",
    sort_order: 1,
    is_active: true,
    description: "Revenus audiovisuels",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-200000000002",
    name: "Retail & E-commerce",
    slug: "revenue-retail",
    type: "revenue",
    color: "#EC4899",
    icon: "ShoppingBag",
    sort_order: 2,
    is_active: true,
    description: "Revenus retail",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-200000000003",
    name: "Pro Audio Retail",
    slug: "revenue-pro-audio",
    type: "revenue",
    color: "#F59E0B",
    icon: "Music",
    sort_order: 3,
    is_active: true,
    description: "Revenus audio pro",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-200000000004",
    name: "Services & Events",
    slug: "revenue-services",
    type: "revenue",
    color: "#10B981",
    icon: "Calendar",
    sort_order: 4,
    is_active: true,
    description: "Revenus services",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Get categories by type
 */
export async function getCategories(
  type?: CategoryType
): Promise<Category[]> {
  // Filter by type if provided
  let categories = mockCategories;
  if (type) {
    categories = categories.filter((c) => c.type === type);
  }

  // Sort by sort_order
  return categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Get category by ID
 */
export async function getCategoryById(
  id: string
): Promise<Category | null> {
  return mockCategories.find((c) => c.id === id) || null;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return mockCategories.find((c) => c.slug === slug) || null;
}
