-- ============================================
-- SUPERMEDIA LAB - SEED DATA (FR)
-- High-quality Incubator Projects
-- Updated for PRD v1 security foundation
-- ============================================

-- Nettoyer les données existantes (order matters for FK)
TRUNCATE public.needs CASCADE;
TRUNCATE public.decisions CASCADE;
TRUNCATE public.updates CASCADE;
TRUNCATE public.project_members CASCADE;
TRUNCATE public.projects CASCADE;
TRUNCATE public.users CASCADE;
TRUNCATE auth.users CASCADE;

-- ============================================
-- UTILISATEURS (4 test users with different roles)
-- ============================================

INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
VALUES 
  ('d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 'alexandre.dubois@supermedia.fr', NOW(), '{"full_name": "Alexandre Dubois"}'),
  ('e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 'marie.laurent@supermedia.fr', NOW(), '{"full_name": "Marie Laurent"}'),
  ('f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 'thomas.martin@supermedia.fr', NOW(), '{"full_name": "Thomas Martin"}'),
  ('a3a87e6b-1e4d-7c8f-2f8a-4d5e6f7a8b9c', 'sophie.bernard@supermedia.fr', NOW(), '{"full_name": "Sophie Bernard"}');

-- Update roles: Owner, LabAdmin, Editor, Viewer
UPDATE public.users SET role = 'Owner', full_name = 'Alexandre Dubois' WHERE id = 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f';
UPDATE public.users SET role = 'LabAdmin', full_name = 'Marie Laurent' WHERE id = 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a';
UPDATE public.users SET role = 'Editor', full_name = 'Thomas Martin' WHERE id = 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b';
UPDATE public.users SET role = 'Viewer', full_name = 'Sophie Bernard' WHERE id = 'a3a87e6b-1e4d-7c8f-2f8a-4d5e6f7a8b9c';

-- ============================================
-- PROJETS INCUBATEUR
-- Note: highlights is now JSONB, visibility and tags added
-- ============================================

INSERT INTO public.projects (id, title, slug, description, highlights, status, visibility, tags, owner_id, the_ask, thumbnail_url, pitch_video_url, last_updated_at)
VALUES 
  -- PROJECT 1: Supermedia AI Agent (SCALING - Success Story)
  (
    '11111111-1111-1111-1111-111111111111',
    'Supermedia AI Agent',
    'supermedia-ai-agent',
    'Agent conversationnel nouvelle génération propulsé par GPT-4 Turbo. Automatise 85% des interactions support client avec un taux de satisfaction de 4.7/5. Intégration native avec Salesforce, Zendesk et notre CRM interne. Capable de comprendre le contexte éditorial et de recommander du contenu personnalisé.',
    '["85% d''automatisation du support client", "Taux de satisfaction 4.7/5", "Intégration Salesforce + Zendesk", "2000+ conversations/jour"]'::jsonb,
    'Scaling',
    'Org',
    ARRAY['ai', 'support', 'automation', 'high-priority'],
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    '25 000€ pour scaling infrastructure + 2 ML Engineers',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '6 hours'
  ),
  
  -- PROJECT 2: AR Retail Experience (VALIDATION - Promising)
  (
    '22222222-2222-2222-2222-222222222222',
    'AR Retail Experience',
    'ar-retail-experience',
    'Application mobile de réalité augmentée révolutionnant l''expérience en magasin. Les clients scannent les produits pour voir des vidéos exclusives, des avis en overlay, et des promotions personnalisées. Partenariat en discussion avec Carrefour et FNAC pour un pilote sur 15 points de vente.',
    '["Partenariat FNAC en négociation", "15 points de vente ciblés", "Overlay vidéo + promos personnalisées"]'::jsonb,
    'Validation',
    'Private',
    ARRAY['ar', 'retail', 'mobile', 'partnership'],
    'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a',
    'Budget pilote 18 000€ + validation juridique partenariats',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  
  -- PROJECT 3: Content Marketplace v2 (SCALING - Revenue Generator)
  (
    '33333333-3333-3333-3333-333333333333',
    'Content Marketplace v2',
    'content-marketplace-v2',
    'Plateforme B2B de licensing et syndication de contenus premium. La v2 introduit les Smart Contracts pour la gestion automatisée des droits, un système de pricing dynamique basé sur l''audience, et une API permettant l''intégration directe dans les CMS partenaires. Revenue actuel : 45K€/mois.',
    '["Revenue 45K€/mois et croissant", "Smart Contracts pour droits automatisés", "API v2 en beta", "Record : 52K€ ce mois"]'::jsonb,
    'Scaling',
    'Org',
    ARRAY['marketplace', 'b2b', 'revenue', 'api'],
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    'Recrutement 3 développeurs senior + 50 000€ marketing B2B',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  
  -- PROJECT 4: Podcast Factory (IDEA - Early Stage)
  (
    '44444444-4444-4444-4444-444444444444',
    'Podcast Factory',
    'podcast-factory',
    'Studio de production podcast entièrement automatisé. De l''enregistrement à la distribution en 3 clics. Montage IA qui supprime les silences, normalise l''audio, et génère automatiquement les chapitres. Transcription multilingue et clips courts pour les réseaux sociaux. Cible : créateurs de contenu internes et externes.',
    '["Montage IA automatisé", "Transcription multilingue", "Distribution 3 clics", "Marché : 700 créateurs potentiels"]'::jsonb,
    'Idea',
    'Private',
    ARRAY['podcast', 'audio', 'ai', 'creator-tools'],
    'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b',
    'Étude de marché 8 000€ + POC technique 3 mois',
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  
  -- PROJECT 5: Data Insights Platform (VALIDATION - Data-Driven)
  (
    '55555555-5555-5555-5555-555555555555',
    'Data Insights Platform',
    'data-insights-platform',
    'Tableau de bord analytique unifié croisant les données de toutes nos plateformes : web, mobile, podcasts, newsletters. Prédictions IA sur les tendances éditoriales avec 72% de précision. Alertes automatiques sur les contenus viraux et recommandations d''optimisation en temps réel pour les équipes éditoriales.',
    '["72% précision prédictions", "Alertes temps réel", "Unifie web + mobile + podcasts", "3/5 articles viraux anticipés"]'::jsonb,
    'Validation',
    'Org',
    ARRAY['analytics', 'data', 'ai', 'prediction'],
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    'Migration BigQuery 15 000€ + 1 Data Scientist senior',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '18 hours'
  ),
  
  -- PROJECT 6: Legacy CMS Migration (STALLED - Blocked)
  (
    '66666666-6666-6666-6666-666666666666',
    'Legacy CMS Migration',
    'legacy-cms-migration',
    'Migration critique de notre CMS legacy (Drupal 7) vers une architecture headless moderne (Strapi + Next.js). 12 ans de contenu à migrer, 50 000+ articles, et intégrations complexes avec les systèmes publicitaires. Bloqué par des questions de conformité RGPD sur les données historiques.',
    '["50 000+ articles à migrer", "12 ans d''historique", "⚠️ Bloqué RGPD", "15 000 articles non-conformes identifiés"]'::jsonb,
    'Stalled',
    'Private',
    ARRAY['migration', 'cms', 'legacy', 'blocked', 'rgpd'],
    'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a',
    'Audit juridique RGPD urgent + décision Go/No-Go direction',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=85',
    NULL,
    NOW() - INTERVAL '21 days'
  );

-- ============================================
-- PROJECT MEMBERS (additional editors/viewers)
-- Note: Owners are auto-inserted via trigger
-- ============================================

-- Add Editor (Thomas) to AI Agent project
INSERT INTO public.project_members (project_id, user_id, role, added_by)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 'editor', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f'),
  -- Add Viewer (Sophie) to AI Agent project
  ('11111111-1111-1111-1111-111111111111', 'a3a87e6b-1e4d-7c8f-2f8a-4d5e6f7a8b9c', 'viewer', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f'),
  -- Add Editor (Thomas) to Content Marketplace
  ('33333333-3333-3333-3333-333333333333', 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 'editor', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f');

-- ============================================
-- MISES À JOUR PROJETS (Activity Feed)
-- ============================================

INSERT INTO public.updates (project_id, author_id, content, type, created_at)
VALUES 
  -- Supermedia AI Agent
  ('11111111-1111-1111-1111-111111111111', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 
   '🚀 Déploiement production réussi ! L''agent traite maintenant 2000+ conversations/jour avec un taux de résolution de 85%.', 'Milestone', NOW() - INTERVAL '6 hours'),
  ('11111111-1111-1111-1111-111111111111', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 
   'Intégration Salesforce terminée. Les tickets escaladés sont automatiquement enrichis avec le contexte de la conversation IA.', 'Milestone', NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 
   'Besoin urgent de renforcer l''équipe pour gérer la charge. Les temps de réponse commencent à augmenter aux heures de pointe.', 'General', NOW() - INTERVAL '1 day'),
  
  -- AR Retail Experience
  ('22222222-2222-2222-2222-222222222222', 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 
   'Démo impressionnante chez FNAC Champs-Élysées ! Le directeur retail veut étendre le test à 5 magasins supplémentaires.', 'Milestone', NOW() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 
   'En attente de la validation des CGU par le service juridique de Carrefour. Ils demandent des clarifications sur le stockage des données utilisateurs.', 'Blocker', NOW() - INTERVAL '4 days'),
  
  -- Content Marketplace v2
  ('33333333-3333-3333-3333-333333333333', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 
   '📈 Record de revenue ce mois : 52K€ ! L''intégration avec les groupes de presse régionaux porte ses fruits.', 'Milestone', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 
   'API v2 en beta testing avec 3 partenaires. Feedback positif sur la documentation et la stabilité.', 'General', NOW() - INTERVAL '5 days'),
  
  -- Podcast Factory
  ('44444444-4444-4444-4444-444444444444', 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 
   'Benchmark terminé : Descript, Riverside et Podcastle analysés. Notre différenciateur serait l''intégration native avec notre écosystème de contenu.', 'General', NOW() - INTERVAL '5 days'),
  ('44444444-4444-4444-4444-444444444444', 'f2f76d5a-0d3c-6b7e-1e7f-3c4d5e6f7a8b', 
   'Estimation : marché adressable de 200 créateurs internes + 500 partenaires potentiels. ROI positif estimé à 18 mois.', 'General', NOW() - INTERVAL '8 days'),
  
  -- Data Insights Platform
  ('55555555-5555-5555-5555-555555555555', 'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f', 
   'Premier modèle de prédiction opérationnel ! A correctement anticipé 3 des 5 articles viraux de la semaine dernière.', 'Milestone', NOW() - INTERVAL '18 hours'),
  ('55555555-5555-5555-5555-555555555555', 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 
   'Workshop avec les rédacteurs en chef très positif. Ils veulent des alertes push sur mobile pour les contenus à fort potentiel.', 'General', NOW() - INTERVAL '3 days'),
  
  -- Legacy CMS Migration
  ('66666666-6666-6666-6666-666666666666', 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 
   '⚠️ BLOQUÉ : Le DPO a identifié 15 000 articles contenant des données personnelles non-conformes. Anonymisation requise avant migration.', 'Blocker', NOW() - INTERVAL '21 days'),
  ('66666666-6666-6666-6666-666666666666', 'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a', 
   'Réunion de crise prévue avec la direction juridique. Options : anonymisation automatisée (coûteuse) ou suppression des contenus concernés.', 'General', NOW() - INTERVAL '18 days');

-- ============================================
-- DÉCISIONS EN ATTENTE (Owner Actions)
-- ============================================

INSERT INTO public.decisions (project_id, question, options, status, created_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Approuver le budget scaling de 25 000€ et le recrutement de 2 ML Engineers ?',
    '["Approuver le budget complet", "Approuver budget seul (15K€)", "Approuver 1 recrutement", "Reporter au Q2"]',
    'Pending',
    NOW() - INTERVAL '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Valider le budget pilote AR de 18 000€ pour les tests en magasin ?',
    '["Approuver et lancer", "Réduire à 10K€ (3 magasins)", "Attendre validation juridique", "Abandonner"]',
    'Pending',
    NOW() - INTERVAL '2 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Autoriser le recrutement de 3 développeurs senior et le budget marketing de 50K€ ?',
    '["Approuver intégralement", "Recruter 2 devs + 30K€ marketing", "Recruter d''abord, marketing Q2", "Demander business case détaillé"]',
    'Pending',
    NOW() - INTERVAL '1 day'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Valider la migration BigQuery (15K€) et le recrutement Data Scientist ?',
    '["Approuver les deux", "Migration seule", "Recruter d''abord", "Explorer alternatives cloud"]',
    'Pending',
    NOW() - INTERVAL '18 hours'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'URGENT : Quelle stratégie pour les données RGPD non-conformes ?',
    '["Anonymisation automatisée (35K€)", "Suppression des 15K articles", "Audit manuel (6 mois)", "Consultation externe CNIL"]',
    'Pending',
    NOW() - INTERVAL '21 days'
  );

-- ============================================
-- NEEDS / ASKS (PRD first-class object)
-- ============================================

INSERT INTO public.needs (project_id, title, description, type, status, urgency, deadline, created_by, created_at)
VALUES 
  -- AI Agent needs
  (
    '11111111-1111-1111-1111-111111111111',
    'Budget infrastructure scaling',
    'Passage de 2000 à 10000 conversations/jour nécessite upgrade serveurs GPU et base de données.',
    'Budget',
    'Open',
    5,
    NOW() + INTERVAL '14 days',
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    NOW() - INTERVAL '2 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Recrutement 2 ML Engineers',
    'Profils senior spécialisés NLP/LLM pour maintenir et améliorer les modèles.',
    'Hiring',
    'Open',
    4,
    NOW() + INTERVAL '30 days',
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    NOW() - INTERVAL '2 days'
  ),
  
  -- AR Retail needs
  (
    '22222222-2222-2222-2222-222222222222',
    'Validation juridique partenariats retail',
    'Revue des contrats FNAC et Carrefour par notre service juridique.',
    'Legal',
    'InReview',
    5,
    NOW() + INTERVAL '7 days',
    'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a',
    NOW() - INTERVAL '5 days'
  ),
  
  -- Content Marketplace needs
  (
    '33333333-3333-3333-3333-333333333333',
    'Introduction partenaires presse régionale',
    'Besoin de contacts décideurs chez Ouest-France, La Voix du Nord, Sud Ouest.',
    'Intro',
    'Open',
    3,
    NOW() + INTERVAL '21 days',
    'd0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f',
    NOW() - INTERVAL '3 days'
  ),
  
  -- Legacy CMS needs
  (
    '66666666-6666-6666-6666-666666666666',
    'Prestataire anonymisation RGPD',
    'Identifier et contractualiser avec un prestataire spécialisé anonymisation données personnelles.',
    'Supplier',
    'Open',
    5,
    NOW() + INTERVAL '7 days',
    'e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f7a',
    NOW() - INTERVAL '10 days'
  );

