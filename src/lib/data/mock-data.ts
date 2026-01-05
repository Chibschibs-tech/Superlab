import type { Project, Decision, Need, Milestone } from "@/types";

export const mockProjects: Project[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Supermedia AI Agent",
    slug: "supermedia-ai-agent",
    description:
      "Agent conversationnel nouvelle génération propulsé par GPT-4 Turbo. Automatise 85% des interactions support client avec un taux de satisfaction de 4.7/5. Intégration native avec Salesforce, Zendesk et notre CRM interne.",
    highlights: [
      "85% d'automatisation du support client",
      "Taux de satisfaction 4.7/5",
      "Intégration Salesforce + Zendesk",
      "2000+ conversations/jour"
    ],
    status: "Scaling",
    visibility: "Org",
    tags: ["ai", "support", "automation", "high-priority"],
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    category_id: "c0000006-0000-0000-0000-000000000006", // Tech & AI
    the_ask: "25 000€ pour scaling infrastructure + 2 ML Engineers",
    thumbnail_url:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=85",
    pitch_video_url: null,
    launch_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 days from now
    budget_total: 50000,
    budget_used: 18500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "AR Retail Experience",
    slug: "ar-retail-experience",
    description:
      "Application mobile de réalité augmentée révolutionnant l'expérience en magasin. Les clients scannent les produits pour voir des vidéos exclusives, des avis en overlay, et des promotions personnalisées.",
    highlights: [
      "Partenariat FNAC en négociation",
      "15 points de vente ciblés",
      "Overlay vidéo + promos personnalisées"
    ],
    status: "Validation",
    visibility: "Private",
    tags: ["ar", "retail", "mobile", "partnership"],
    owner_id: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a",
    category_id: "c0000002-0000-0000-0000-000000000002", // Retail & E-commerce
    the_ask: "Budget pilote 18 000€ + validation juridique partenariats",
    thumbnail_url:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=85",
    pitch_video_url: null,
    launch_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days from now
    budget_total: 25000,
    budget_used: 8000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Content Marketplace v2",
    slug: "content-marketplace-v2",
    description:
      "Plateforme B2B de licensing et syndication de contenus premium. La v2 introduit les Smart Contracts pour la gestion automatisée des droits et un système de pricing dynamique. Revenue actuel : 45K€/mois.",
    highlights: [
      "Revenue 45K€/mois et croissant",
      "Smart Contracts pour droits automatisés",
      "API v2 en beta",
      "Record : 52K€ ce mois"
    ],
    status: "Scaling",
    visibility: "Org",
    tags: ["marketplace", "b2b", "revenue", "api"],
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    category_id: "c0000005-0000-0000-0000-000000000005", // Media Production
    the_ask: "Recrutement 3 développeurs senior + 50 000€ marketing B2B",
    thumbnail_url:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=85",
    pitch_video_url: null,
    launch_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    budget_total: 80000,
    budget_used: 45000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    title: "Podcast Factory",
    slug: "podcast-factory",
    description:
      "Studio de production podcast entièrement automatisé. De l'enregistrement à la distribution en 3 clics. Montage IA qui supprime les silences, normalise l'audio, et génère automatiquement les chapitres.",
    highlights: [
      "Montage IA automatisé",
      "Transcription multilingue",
      "Distribution 3 clics",
      "Marché : 700 créateurs potentiels"
    ],
    status: "Idea",
    visibility: "Private",
    tags: ["podcast", "audio", "ai", "creator-tools"],
    owner_id: "f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b",
    category_id: "c0000005-0000-0000-0000-000000000005", // Media Production
    the_ask: "Étude de marché 8 000€ + POC technique 3 mois",
    thumbnail_url:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&q=85",
    pitch_video_url: null,
    launch_date: null,
    budget_total: null,
    budget_used: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    title: "Data Insights Platform",
    slug: "data-insights-platform",
    description:
      "Tableau de bord analytique unifié croisant les données de toutes nos plateformes. Prédictions IA sur les tendances éditoriales avec 72% de précision. Alertes automatiques sur les contenus viraux.",
    highlights: [
      "72% précision prédictions",
      "Alertes temps réel",
      "Unifie web + mobile + podcasts",
      "3/5 articles viraux anticipés"
    ],
    status: "Validation",
    visibility: "Org",
    tags: ["analytics", "data", "ai", "prediction"],
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    category_id: "c0000008-0000-0000-0000-000000000008", // Data & Analytics
    the_ask: "Migration BigQuery 15 000€ + 1 Data Scientist senior",
    thumbnail_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85",
    pitch_video_url: null,
    launch_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 45 days from now
    budget_total: 35000,
    budget_used: 12000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    title: "Legacy CMS Migration",
    slug: "legacy-cms-migration",
    description:
      "Migration critique de notre CMS legacy (Drupal 7) vers une architecture headless moderne. 12 ans de contenu à migrer, 50 000+ articles. Bloqué par des questions de conformité RGPD.",
    highlights: [
      "50 000+ articles à migrer",
      "12 ans d'historique",
      "⚠️ Bloqué RGPD",
      "15 000 articles non-conformes identifiés"
    ],
    status: "Stalled",
    visibility: "Private",
    tags: ["migration", "cms", "legacy", "blocked", "rgpd"],
    owner_id: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a",
    category_id: "c0000009-0000-0000-0000-000000000009", // Internal Ops & Infrastructure
    the_ask: "Audit juridique RGPD urgent + décision Go/No-Go direction",
    thumbnail_url:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=85",
    pitch_video_url: null,
    launch_date: null, // Stalled - no launch date
    budget_total: 120000,
    budget_used: 25000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago - STALE
  },
];

export const mockDecisions: Decision[] = [
  {
    id: "dec-1111",
    project_id: "11111111-1111-1111-1111-111111111111",
    question: "Approuver le budget scaling de 25 000€ et le recrutement de 2 ML Engineers ?",
    options: ["Approuver le budget complet", "Approuver budget seul (15K€)", "Approuver 1 recrutement", "Reporter au Q2"],
    status: "Pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dec-2222",
    project_id: "22222222-2222-2222-2222-222222222222",
    question: "Valider le budget pilote AR de 18 000€ pour les tests en magasin ?",
    options: ["Approuver et lancer", "Réduire à 10K€ (3 magasins)", "Attendre validation juridique", "Abandonner"],
    status: "Pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dec-3333",
    project_id: "33333333-3333-3333-3333-333333333333",
    question: "Autoriser le recrutement de 3 développeurs senior et le budget marketing de 50K€ ?",
    options: ["Approuver intégralement", "Recruter 2 devs + 30K€ marketing", "Recruter d'abord, marketing Q2", "Demander business case détaillé"],
    status: "Pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dec-5555",
    project_id: "55555555-5555-5555-5555-555555555555",
    question: "Valider la migration BigQuery (15K€) et le recrutement Data Scientist ?",
    options: ["Approuver les deux", "Migration seule", "Recruter d'abord", "Explorer alternatives cloud"],
    status: "Pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dec-6666",
    project_id: "66666666-6666-6666-6666-666666666666",
    question: "URGENT : Quelle stratégie pour les données RGPD non-conformes ?",
    options: ["Anonymisation automatisée (35K€)", "Suppression des 15K articles", "Audit manuel (6 mois)", "Consultation externe CNIL"],
    status: "Pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockNeeds: Need[] = [
  {
    id: "need-1111",
    project_id: "11111111-1111-1111-1111-111111111111",
    title: "Budget infrastructure scaling",
    description: "Passage de 2000 à 10000 conversations/jour nécessite upgrade serveurs GPU et base de données.",
    type: "Budget",
    status: "Open",
    urgency: 5,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    milestone_id: null,
    decision_id: null,
    created_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "need-1112",
    project_id: "11111111-1111-1111-1111-111111111111",
    title: "Recrutement 2 ML Engineers",
    description: "Profils senior spécialisés NLP/LLM pour maintenir et améliorer les modèles.",
    type: "Hiring",
    status: "Open",
    urgency: 4,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    milestone_id: null,
    decision_id: null,
    created_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "need-2222",
    project_id: "22222222-2222-2222-2222-222222222222",
    title: "Validation juridique partenariats retail",
    description: "Revue des contrats FNAC et Carrefour par notre service juridique.",
    type: "Legal",
    status: "InReview",
    urgency: 5,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    milestone_id: null,
    decision_id: null,
    created_by: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "need-3333",
    project_id: "33333333-3333-3333-3333-333333333333",
    title: "Introduction partenaires presse régionale",
    description: "Besoin de contacts décideurs chez Ouest-France, La Voix du Nord, Sud Ouest.",
    type: "Intro",
    status: "Open",
    urgency: 3,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    milestone_id: null,
    decision_id: null,
    created_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "need-6666",
    project_id: "66666666-6666-6666-6666-666666666666",
    title: "Prestataire anonymisation RGPD",
    description: "Identifier et contractualiser avec un prestataire spécialisé anonymisation données personnelles.",
    type: "Supplier",
    status: "Open",
    urgency: 5,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    milestone_id: null,
    decision_id: null,
    created_by: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================
// MOCK MILESTONES
// ============================================

export const mockMilestones: Milestone[] = [
  {
    id: "ms-1111-1",
    project_id: "11111111-1111-1111-1111-111111111111",
    title: "Infrastructure GPU Upgrade",
    description: "Migration vers infrastructure GPU dédiée pour x10 capacité",
    status: "in_progress",
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    progress_percent: 60,
    sort_order: 1,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ms-1111-2",
    project_id: "11111111-1111-1111-1111-111111111111",
    title: "Lancement Entreprise",
    description: "Version entreprise avec SSO et analytics avancés",
    status: "planned",
    start_date: null,
    target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    progress_percent: 0,
    sort_order: 2,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ms-2222-1",
    project_id: "22222222-2222-2222-2222-222222222222",
    title: "Pilote FNAC Champs-Élysées",
    description: "Test grandeur nature dans le flagship store",
    status: "planned",
    start_date: null,
    target_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    progress_percent: 0,
    sort_order: 1,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ms-3333-1",
    project_id: "33333333-3333-3333-3333-333333333333",
    title: "API v2 Production",
    description: "Mise en production de la nouvelle API avec Smart Contracts",
    status: "in_progress",
    start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    progress_percent: 75,
    sort_order: 1,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ms-5555-1",
    project_id: "55555555-5555-5555-5555-555555555555",
    title: "BigQuery Migration",
    description: "Migration complète vers BigQuery avec backup données historiques",
    status: "planned",
    start_date: null,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    progress_percent: 0,
    sort_order: 1,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper to get project by ID
export function getMockProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

// Helper to get project by slug
export function getMockProjectBySlug(slug: string): Project | undefined {
  return mockProjects.find((p) => p.slug === slug);
}

// Helper to get needs by project ID
export function getMockNeedsByProjectId(projectId: string): Need[] {
  return mockNeeds.filter((n) => n.project_id === projectId);
}

// Helper to get milestones by project ID
export function getMockMilestonesByProjectId(projectId: string): Milestone[] {
  return mockMilestones.filter((m) => m.project_id === projectId);
}
