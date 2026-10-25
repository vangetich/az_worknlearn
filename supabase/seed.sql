-- ============================================================================
-- Seed File: Official AZ-900 Curriculum Hierarchy (3 Learning Paths, 12 Modules)
-- ============================================================================

INSERT INTO public.learning_paths (id, title, weight_percentage)
VALUES
  (1, 'Describe Cloud Concepts', '25–30%'),
  (2, 'Describe Azure Architecture and Services', '35–40%'),
  (3, 'Describe Azure Management and Governance', '30–35%')
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  weight_percentage = EXCLUDED.weight_percentage;

INSERT INTO public.modules (id, path_id, title, module_number, is_premium_default)
VALUES
  (1, 1, 'Cloud Computing & Shared Responsibility', 1, FALSE),
  (2, 1, 'Cloud Models (Public, Private, Hybrid)', 2, FALSE),
  (3, 1, 'Consumption-Based & Cloud Pricing Models', 3, FALSE),
  (4, 1, 'Serverless & Cloud Benefits (High Availability, Scalability)', 4, FALSE),
  (5, 2, 'Core Architectural Components (Regions, Availability Zones)', 5, TRUE),
  (6, 2, 'Compute & Networking Services (VMs, AKS, VNets, ExpressRoute)', 6, TRUE),
  (7, 2, 'Storage Services (Blob Tiers, Redundancy LRS/ZRS/GRS)', 7, TRUE),
  (8, 2, 'Identity, Access & Security (Entra ID, Zero Trust, RBAC)', 8, TRUE),
  (9, 3, 'Cost Management, TCO & Pricing Calculators', 9, TRUE),
  (10, 3, 'Governance & Compliance (Purview, Policy, Resource Locks)', 10, TRUE),
  (11, 3, 'Resource Deployment Tools (ARM Templates, Bicep, Azure Arc)', 11, TRUE),
  (12, 3, 'Monitoring & Advisory Tools (Azure Advisor, Monitor, Service Health)', 12, TRUE)
ON CONFLICT (id) DO UPDATE
SET
  path_id = EXCLUDED.path_id,
  title = EXCLUDED.title,
  module_number = EXCLUDED.module_number,
  is_premium_default = EXCLUDED.is_premium_default;
