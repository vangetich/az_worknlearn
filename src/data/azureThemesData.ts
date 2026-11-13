import { Question } from '../types/quiz';

export type ServiceCategoryKey =
  | 'Cloud Foundations'
  | 'Architecture & Geography'
  | 'Compute'
  | 'Networking'
  | 'Storage'
  | 'Identity & Security'
  | 'Cost & FinOps'
  | 'Governance & Compliance'
  | 'Deployment & Hybrid'
  | 'Monitoring & Advisory'
  | 'Exam Synthesis';

export interface ThemeModuleLink {
  moduleId: number;
  pathId: 1 | 2 | 3;
  moduleTitle: string;
  serviceCategory: ServiceCategoryKey;
  roleInThread: 'Origin Anchor' | 'Core Carryover' | 'Exam Payoff';
  earlierRecallPrompt: string;
  serviceApplication: string;
  azureServices: string[];
  examTrapGuard: string;
}

export interface ThemeBridgeQuiz {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  threadInsight: string;
}

export interface AzureThemeThread {
  id: string;
  numberLabel: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  coreTheory: string;
  originSummary: string;
  examPayoffSummary: string;
  accentHex: string;
  serviceCategoriesCarried: ServiceCategoryKey[];
  moduleConnections: ThemeModuleLink[];
  bridgeQuizzes: ThemeBridgeQuiz[];
}

export const AZURE_THEME_THREADS: AzureThemeThread[] = [
  {
    id: 'scaling-elasticity',
    numberLabel: 'Theme 01',
    title: 'Vertical vs. Horizontal Scaling & Elasticity',
    shortTitle: 'Vertical & Horizontal Scaling',
    subtitle: 'How Path 1 scaling theory drives Compute, Networking, Storage, FinOps, and Monitoring decisions.',
    coreTheory:
      'Workload growth in Azure always splits into two geometric strategies: Vertical Scaling (scaling up/down the capacity tier of a single resource—CPU, RAM, IOPS, bandwidth) versus Horizontal Scaling (scaling out/in the number of parallel, stateless instances behind a load balancer). Elasticity automates horizontal scale-out and scale-in using real-time metrics so you never pay for idle peak hardware.',
    originSummary: 'Introduced in Path 1 · Module 2 (Cloud Benefits) and priced via Module 3 (Consumption Models).',
    examPayoffSummary:
      'Whenever an AZ-900 scenario asks how to handle sudden unpredictable traffic without downtime or wasted idle spend, favor Horizontal Scale-Out + Elasticity (VMSS, App Service, AKS) over Vertical Scale-Up.',
    accentHex: '#0078D4',
    serviceCategoriesCarried: [
      'Cloud Foundations',
      'Architecture & Geography',
      'Compute',
      'Networking',
      'Storage',
      'Cost & FinOps',
      'Monitoring & Advisory',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 2,
        pathId: 1,
        moduleTitle: 'Cloud Benefits',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Foundational distinction: Vertical = bigger machine (up/down); Horizontal = more machines (out/in); Elasticity = automated.',
        serviceApplication:
          'Defines high availability alongside scalability: manual scaling adapts to planned growth, while elasticity dynamically provisions and de-provisions instances as load rises and falls.',
        azureServices: ['Vertical Scaling (Scale Up)', 'Horizontal Scaling (Scale Out)', 'Auto-Scaling Elasticity'],
        examTrapGuard:
          'Do not confuse Scalability (ability to grow) with Elasticity (automatic dynamic expansion and contraction on demand).',
      },
      {
        moduleId: 3,
        pathId: 1,
        moduleTitle: 'Cloud Pricing & Consumption Models',
        serviceCategory: 'Cost & FinOps',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Remember Module 2 elasticity? Module 3 explains the financial engine behind why scaling in saves money.',
        serviceApplication:
          'Serverless and consumption-based billing tie horizontal scale directly to OpEx: when automated elasticity scales instances down to zero during quiet hours, compute billing drops proportionally.',
        azureServices: ['Consumption Plan', 'Pay-As-You-Go Compute', 'Azure Functions Serverless'],
        examTrapGuard:
          'Buying hardware for peak Black Friday traffic is CapEx; scaling out automatically for 4 hours on OpEx avoids 95% idle waste.',
      },
      {
        moduleId: 4,
        pathId: 2,
        moduleTitle: 'Core Azure Architectural Components',
        serviceCategory: 'Architecture & Geography',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Horizontal instances from Module 2 need physical separation in Module 4 so one datacenter outage cannot kill every instance.',
        serviceApplication:
          'Spreading horizontally scaled nodes across 3 Availability Zones inside a Region turns raw instance count into 99.99% datacenter-resilient High Availability.',
        azureServices: ['Availability Zones', 'Azure Regions', 'Fault-Isolated Clusters'],
        examTrapGuard:
          'Two VMs scaled horizontally in the same single datacenter still share power/cooling risk unless placed across Availability Zones.',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Compute',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Earlier you learned Up vs. Out. Now see which Compute & Networking sub-services scale vertically versus horizontally.',
        serviceApplication:
          'Compute: Single VMs scale vertically by changing VM size/SKU (brief restart); VM Scale Sets (VMSS), App Service Autoscale, ACI, and AKS pods scale horizontally. Networking: ExpressRoute scales vertically by circuit bandwidth (50 Mbps–10 Gbps) while Azure Load Balancer & DNS distribute horizontal backend pools.',
        azureServices: [
          'VM Size Resize (Vertical)',
          'VM Scale Sets / VMSS (Horizontal)',
          'App Service & AKS (Horizontal)',
          'ExpressRoute SKU Tiers (Vertical Bandwidth)',
        ],
        examTrapGuard:
          'Resizing a single VM vertically causes downtime during reboot; VMSS adds identical instances horizontally with zero downtime.',
      },
      {
        moduleId: 6,
        pathId: 2,
        moduleTitle: 'Azure Storage Services',
        serviceCategory: 'Storage',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Scaling is not just CPU—Module 6 Storage services use the same vertical tiering vs. horizontal partitioning.',
        serviceApplication:
          'Managed Disks scale vertically across performance tiers (Standard HDD → Premium SSD P10/P30/P80 for higher IOPS & throughput). Azure Blob Storage automatically partitions objects horizontally to serve massive concurrent request rates.',
        azureServices: ['Managed Disk Performance Tiers (Vertical)', 'Blob Storage Partitioning (Horizontal)', 'Azure Files Shares'],
        examTrapGuard:
          'To boost IOPS on a single attached VM database disk, scale the Managed Disk SKU vertically rather than deploying extra Blob containers.',
      },
      {
        moduleId: 8,
        pathId: 3,
        moduleTitle: 'Azure Cost Management',
        serviceCategory: 'Cost & FinOps',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Vertical over-sizing and horizontal baselines require different cost tools from Module 3 into Module 8.',
        serviceApplication:
          'Combine Reserved Instances (1–3 year commitment for predictable minimum horizontal node counts) with automated scale-out on pay-as-you-go for burst traffic. Right-size oversized vertical VMs using Cost Management usage telemetry.',
        azureServices: ['Azure Reservations (Baseline Nodes)', 'Savings Plans', 'Right-Sizing Analysis'],
        examTrapGuard:
          'Never buy Reserved Instances for transient burst instances—reserve only your steady-state horizontal floor.',
      },
      {
        moduleId: 11,
        pathId: 3,
        moduleTitle: 'Azure Monitoring & Advisory Tools',
        serviceCategory: 'Monitoring & Advisory',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'How does Module 2 Elasticity know WHEN to trigger Module 5 horizontal scale-out? Through Module 11 telemetry.',
        serviceApplication:
          'Azure Monitor metric alerts (CPU > 75%, HTTP queue length) fire autoscale rules automatically. Azure Advisor Performance & Cost recommendations flag vertically underutilized VMs ready to scale down.',
        azureServices: ['Azure Monitor Metrics & Autoscale', 'Azure Advisor Performance Blade', 'Log Analytics Alerts'],
        examTrapGuard:
          'Azure Service Health reports Microsoft outages; Azure Monitor triggers your application auto-scaling rules.',
      },
      {
        moduleId: 12,
        pathId: 3,
        moduleTitle: 'Real-World Scenario Assessment & Synthesis',
        serviceCategory: 'Exam Synthesis',
        roleInThread: 'Exam Payoff',
        earlierRecallPrompt:
          'Pulling together M2, M3, M5, M6, M8, and M11 on exam day.',
        serviceApplication:
          'If a legacy stateful monolith needs 256 GB RAM quickly → Vertical Scale-Up. If an e-commerce web tier spikes unpredictably → Horizontal Scale-Out via VMSS or App Service driven by Azure Monitor metrics.',
        azureServices: ['VMSS + Load Balancer', 'App Service Autoscale', 'Serverless Functions'],
        examTrapGuard:
          'Always verify whether the app can run statelessly across multiple nodes (Horizontal) before assuming bigger single servers (Vertical).',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'scale-q1',
        prompt:
          'An Azure VM running a legacy financial calculation needs double the memory immediately without rewriting code, while a stateless web frontend needs to absorb 5x traffic spikes automatically. Which scaling pairing fits?',
        options: [
          'Vertical scale-up (VM resize) for the legacy VM; Horizontal scale-out + elasticity (VMSS/App Service) for the web frontend',
          'Horizontal scale-out for both using Storage Access Tiers',
          'Vertical scale-up for the web frontend and ExpressRoute peering for the VM memory',
          'Archive Tier rehydration for the legacy VM; Reserved Instances for spikes',
        ],
        correctIndex: 0,
        threadInsight:
          'Module 2 scaling theory applies directly in Module 5 Compute: single-node memory/CPU increases use Vertical resize, while elastic web concurrency uses Horizontal VMSS or App Service Autoscale.',
      },
      {
        id: 'scale-q2',
        prompt:
          'Which Module 11 service supplies the real-time CPU or queue-depth signals that trigger Module 2 & Module 5 horizontal elasticity?',
        options: [
          'Microsoft Purview',
          'Azure Monitor Metrics & Alert Rules',
          'Azure TCO Calculator',
          'Resource Locks (CanNotDelete)',
        ],
        correctIndex: 1,
        threadInsight:
          'Elasticity is never magic—Module 11 Azure Monitor metrics watch load thresholds and instruct Module 5 Compute resources when to scale out or back in.',
      },
    ],
  },
  {
    id: 'shared-responsibility',
    numberLabel: 'Theme 02',
    title: 'Shared Responsibility & Operational Relief Gradient',
    shortTitle: 'Shared Responsibility & Managed Shift',
    subtitle: 'Tracing customer vs. Microsoft boundaries from Module 1 across Compute, Storage, Identity, and IaC.',
    coreTheory:
      'As you move from On-Premises → IaaS → PaaS → SaaS/Serverless, Microsoft absorbs more infrastructure chores (physical hosts, hypervisor, OS patching, runtime), leaving you focused on business logic. Yet three pillars NEVER transfer to Microsoft: your Data, your Endpoints, and your Accounts & Identities.',
    originSummary: 'Anchored in Path 1 · Module 1 (Shared Responsibility Model).',
    examPayoffSummary:
      'Any exam question prioritizing "minimal administrative effort / no OS patching" points straight toward PaaS or Serverless—while Identity, Data classification, and RBAC stay yours at every tier.',
    accentHex: '#D97706',
    serviceCategoriesCarried: [
      'Cloud Foundations',
      'Compute',
      'Networking',
      'Storage',
      'Identity & Security',
      'Governance & Compliance',
      'Deployment & Hybrid',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 1,
        pathId: 1,
        moduleTitle: 'Fundamental Cloud Concepts',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Your starting rule: Customer ALWAYS owns Information/Data, Devices/Endpoints, and Accounts/Identities.',
        serviceApplication:
          'Establishes the stepped handover: IaaS hands Microsoft physical datacenters/hosts; PaaS adds OS, middleware, and runtime management; SaaS manages the entire application.',
        azureServices: ['Shared Responsibility Matrix', 'IaaS / PaaS / SaaS Tiers'],
        examTrapGuard:
          'Never choose "Microsoft manages customer data security in SaaS"—the customer always owns data classification and access governance.',
      },
      {
        moduleId: 3,
        pathId: 1,
        moduleTitle: 'Cloud Pricing & Consumption Models',
        serviceCategory: 'Cost & FinOps',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Shifting OS management to Microsoft in Module 1 transforms how you pay in Module 3.',
        serviceApplication:
          'Serverless and PaaS eliminate paying for OS licensing and idle host capacity maintenance—you pay purely for runtime execution or app tier throughput.',
        azureServices: ['Serverless Functions', 'Consumption Pricing'],
        examTrapGuard:
          'IaaS VMs bill even when idle unless deallocated; serverless bills per millisecond of actual code execution.',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Compute',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Apply Module 1 IaaS vs. PaaS boundaries directly to Module 5 Compute options.',
        serviceApplication:
          'Azure VMs (IaaS: you install OS patches & configure VNet NSGs) → Azure Container Instances / AKS (shared container control plane managed by Azure) → Azure App Service (PaaS: Microsoft patches OS/IIS/runtime automatically).',
        azureServices: ['Azure VMs (IaaS)', 'AKS Managed Control Plane', 'Azure App Service (PaaS)'],
        examTrapGuard:
          'Choosing Azure Virtual Machines when a prompt states "do not manage underlying OS updates" fails the Shared Responsibility check.',
      },
      {
        moduleId: 6,
        pathId: 2,
        moduleTitle: 'Azure Storage Services',
        serviceCategory: 'Storage',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Storage hardware disks fail everywhere—who swaps dead drives in Azure?',
        serviceApplication:
          'Microsoft manages physical drives, RAID, and cross-node replication (LRS/ZRS/GRS), while you remain responsible for choosing access tiers, encrypting keys, and locking public anonymous Blob access.',
        azureServices: ['Azure Blob Storage', 'Azure Files', 'Customer-Managed Keys'],
        examTrapGuard:
          'Microsoft protects physical disk durability via LRS/GRS, NOT accidental human file deletion—enable soft delete or Resource Locks for customer mistakes.',
      },
      {
        moduleId: 7,
        pathId: 2,
        moduleTitle: 'Azure Identity, Access, & Security',
        serviceCategory: 'Identity & Security',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Accounts & Identities NEVER transfer to Microsoft in Module 1—Module 7 is how you fulfill your half.',
        serviceApplication:
          'You configure Microsoft Entra ID, enforce MFA, author Conditional Access policies, and assign least-privilege RBAC roles across IaaS, PaaS, and SaaS alike.',
        azureServices: ['Microsoft Entra ID', 'Conditional Access & MFA', 'Azure RBAC'],
        examTrapGuard:
          'Zero Trust starts with your identity layer—even on Microsoft 365 (SaaS), enabling MFA is the customer responsibility.',
      },
      {
        moduleId: 9,
        pathId: 3,
        moduleTitle: 'Azure Governance & Compliance Tools',
        serviceCategory: 'Governance & Compliance',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Data governance remains 100% yours across every Module 1 cloud model.',
        serviceApplication:
          'Microsoft Purview catalogs and classifies your data layer across Azure and hybrid stores, while Azure Policy prevents your teams from deploying unapproved VM or PaaS configurations.',
        azureServices: ['Microsoft Purview', 'Azure Policy'],
        examTrapGuard:
          'Azure Compliance certifications cover Microsoft physical datacenters; your deployed resources still need Azure Policy auditing.',
      },
      {
        moduleId: 12,
        pathId: 3,
        moduleTitle: 'Real-World Scenario Assessment & Synthesis',
        serviceCategory: 'Exam Synthesis',
        roleInThread: 'Exam Payoff',
        earlierRecallPrompt:
          'Unifying M1 responsibility rules with M5 services and M7/M9 controls.',
        serviceApplication:
          'Spot the operational keyword in exam stems: "full OS control" → IaaS (VM); "deploy web API with zero OS maintenance" → PaaS (App Service); "enforce MFA & data rules" → customer action.',
        azureServices: ['App Service (PaaS)', 'Entra ID', 'Purview'],
        examTrapGuard:
          'Never skip checking who manages OS patching vs. who manages data classification in multi-part Yes/No AZ-900 items.',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'resp-q1',
        prompt:
          'Your company adopts Azure App Service (PaaS) to host a public web portal. Based on the Module 1 Shared Responsibility thread, which task still belongs to YOUR team in Module 5 & Module 7?',
        options: [
          'Patching the underlying Windows/Linux host OS kernels',
          'Replacing failed datacenter solid-state drives',
          'Configuring Entra ID authentication, RBAC permissions, and securing application data',
          'Maintaining hypervisor firmware isolation',
        ],
        correctIndex: 2,
        threadInsight:
          'In PaaS, Microsoft patches the host OS and runtime (Module 5), but Accounts, Access, and Data (Module 1 → Module 7) ALWAYS stay with the customer.',
      },
    ],
  },
  {
    id: 'blast-radius-resiliency',
    numberLabel: 'Theme 03',
    title: 'Blast-Radius Isolation & Resiliency Rings',
    shortTitle: 'Blast-Radius & Resiliency',
    subtitle: 'Connecting HA/DR concepts from Module 2 through Regions/AZs, Networking redundancy, and Storage LRS/ZRS/GRS.',
    coreTheory:
      'Resiliency in Azure scales outward in concentric blast-radius rings: Single Hardware Rack → 3 Independent Availability Zones (1 Region, 300+ fiber separation) → Paired Regions (300+ miles apart in a Geography). Every Storage SKU and Compute topology maps directly to which ring failure you need to survive.',
    originSummary: 'Launched in Path 1 · Module 2 (HA vs DR) and formalized geographically in Path 2 · Module 4.',
    examPayoffSummary:
      'Match the failure radius directly: Single datacenter power/fire → Availability Zones / ZRS; Entire city/region flood → Region Pairs / GRS / GZRS; Accidental deletion → Soft Delete/Locks (not redundancy).',
    accentHex: '#059669',
    serviceCategoriesCarried: [
      'Cloud Foundations',
      'Architecture & Geography',
      'Compute',
      'Networking',
      'Storage',
      'Monitoring & Advisory',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 2,
        pathId: 1,
        moduleTitle: 'Cloud Benefits',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Starts with Reliability: High Availability keeps apps running during local faults; Disaster Recovery restores after major regional events.',
        serviceApplication:
          'Defines why a single fault domain is unacceptable for production workloads and introduces RPO/RTO resilience thinking.',
        azureServices: ['High Availability (HA)', 'Disaster Recovery (DR)'],
        examTrapGuard:
          'Availability keeps traffic live automatically; Backup/DR recovers point-in-time state after corruption or deletion.',
      },
      {
        moduleId: 4,
        pathId: 2,
        moduleTitle: 'Core Azure Architectural Components',
        serviceCategory: 'Architecture & Geography',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Turns Module 2 reliability goals into concrete physical rings across Azure datacenters.',
        serviceApplication:
          'Builds the ladder: Availability Zones isolate power, cooling, and networking within 1 region (99.99% VM SLA); Region Pairs sit 300+ miles apart within a Geography for staggered platform updates and data sovereignty.',
        azureServices: ['Availability Zones', 'Region Pairs', 'Azure Geographies'],
        examTrapGuard:
          'Not every region has Availability Zones; Geographies guarantee data residency boundaries.',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Compute',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Compute & Networking must span Module 4 rings rather than pinning everything to 1 zone.',
        serviceApplication:
          'Zone-redundant VMSS instances spread across Zones 1, 2, and 3; Zone-redundant Load Balancers and redundant VPN/ExpressRoute gateways avoid single-datacenter bottlenecks.',
        azureServices: ['Zone-Redundant VMSS', 'Standard Load Balancer', 'ExpressRoute Redundant Circuits'],
        examTrapGuard:
          'A VNet spans all Availability Zones in a single region, NOT across two different regions (cross-region requires VNet Peering).',
      },
      {
        moduleId: 6,
        pathId: 2,
        moduleTitle: 'Azure Storage Services',
        serviceCategory: 'Storage',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Watch how Module 4 Regions & AZs map 1-to-1 onto Module 6 Storage redundancy options.',
        serviceApplication:
          'LRS = 3 synchronous copies in 1 datacenter; ZRS = 3 synchronous copies across 3 Availability Zones; GRS / RA-GRS = 6 copies across 2 Paired Regions; GZRS = ZRS locally + paired region replication.',
        azureServices: ['LRS (1 DC)', 'ZRS (3 Zones)', 'GRS / RA-GRS (2 Regions)', 'GZRS'],
        examTrapGuard:
          'Need read access from the secondary paired region BEFORE a failover? You MUST choose RA-GRS or RA-GZRS, not plain GRS.',
      },
      {
        moduleId: 11,
        pathId: 3,
        moduleTitle: 'Azure Monitoring & Advisory Tools',
        serviceCategory: 'Monitoring & Advisory',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'When a physical ring degrades, Module 11 alerts you immediately.',
        serviceApplication:
          'Azure Advisor Reliability recommendations highlight single-zone or single-VM risks; Azure Service Health tracks regional outages and scheduled maintenance per Geography.',
        azureServices: ['Azure Service Health', 'Azure Advisor Reliability', 'Resource Health'],
        examTrapGuard:
          'Azure Status is global/public; Azure Service Health is personalized to the exact regions & subscriptions your apps use.',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'blast-q1',
        prompt:
          'Regulations demand data never leaves a single country Geography, yet applications must survive an entire datacenter power & cooling failure. Following the Blast-Radius thread from M4 → M6, which Storage redundancy fits best at lowest risk?',
        options: [
          'Locally Redundant Storage (LRS)',
          'Zone-Redundant Storage (ZRS)',
          'Archive Tier with Hot fallback',
          'Single-zone Unmanaged Disks',
        ],
        correctIndex: 1,
        threadInsight:
          'Module 4 Availability Zones isolate datacenter power/cooling within ONE region/country—which maps 1-to-1 to Module 6 Zone-Redundant Storage (ZRS).',
      },
    ],
  },
  {
    id: 'control-vs-data-plane',
    numberLabel: 'Theme 04',
    title: 'Control Plane vs. Data Plane Governance Stack',
    shortTitle: 'Identity, RBAC, Policy & Locks',
    subtitle: 'How Module 4 hierarchy governs Module 7 Security, Module 9 Policy/Locks, and Module 10 ARM APIs.',
    coreTheory:
      'Every administrative action passes through four distinct checkpoints: (1) Entra ID proves WHO you are, (2) RBAC checks WHAT actions you are permitted, (3) Azure Policy checks WHETHER the resource configuration follows corporate rules, and (4) Resource Locks freeze deletion/editing—even for Subscription Owners.',
    originSummary: 'Rooted in Path 2 · Module 4 (Scope Hierarchy) & Module 7 (Identity & Zero Trust).',
    examPayoffSummary:
      'AZ-900 loves testing the boundary between RBAC ("who can deploy"), Policy ("only allow East US"), and Locks ("prevent accidental delete even by Owner").',
    accentHex: '#7C3AED',
    serviceCategoriesCarried: [
      'Architecture & Geography',
      'Networking',
      'Storage',
      'Identity & Security',
      'Cost & FinOps',
      'Governance & Compliance',
      'Deployment & Hybrid',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 4,
        pathId: 2,
        moduleTitle: 'Core Azure Architectural Components',
        serviceCategory: 'Architecture & Geography',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Management Groups → Subscriptions → Resource Groups → Resources form the inheritance tree.',
        serviceApplication:
          'All governance artifacts (RBAC assignments, Azure Policies, Resource Locks, Budgets) cascade downward from parent scope to child resources automatically.',
        azureServices: ['Management Groups', 'Subscriptions', 'Resource Groups'],
        examTrapGuard:
          'Resource Tags are the famous exception: Tags applied to a Resource Group do NOT automatically inherit to child resources unless enforced via Azure Policy.',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Networking',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Separating management control from network data traffic.',
        serviceApplication:
          'Private Endpoints bring PaaS data-plane access inside a private VNet IP while ARM Control Plane management continues through Entra ID & RBAC.',
        azureServices: ['Private Endpoints', 'NSGs', 'Public vs. Private IPs'],
        examTrapGuard:
          'Disabling public internet access to Blob Storage does not stop ARM portal configuration if RBAC grants control-plane visibility.',
      },
      {
        moduleId: 7,
        pathId: 2,
        moduleTitle: 'Azure Identity, Access, & Security',
        serviceCategory: 'Identity & Security',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Entra ID authenticates identity first; RBAC authorizes actions second.',
        serviceApplication:
          'Zero Trust ("never trust, always verify") combines MFA + Conditional Access (device health, sign-in location) before issuing tokens, then limits blast radius with least-privilege RBAC.',
        azureServices: ['Microsoft Entra ID', 'Conditional Access', 'Azure RBAC', 'Zero Trust & Defense-in-Depth'],
        examTrapGuard:
          'Authentication (verifying identity via MFA) ≠ Authorization (granting Contributor RBAC permissions).',
      },
      {
        moduleId: 9,
        pathId: 3,
        moduleTitle: 'Azure Governance & Compliance Tools',
        serviceCategory: 'Governance & Compliance',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Remember Module 4 inheritance & Module 7 RBAC? Module 9 adds what RBAC alone cannot guarantee.',
        serviceApplication:
          'RBAC lets an Owner create any VM; Azure Policy blocks oversized SKUs or non-EU regions even if you are Owner. CanNotDelete & ReadOnly Resource Locks block modifications/deletes until an authorized admin explicitly removes the lock.',
        azureServices: ['Azure Policy & Initiatives', 'CanNotDelete & ReadOnly Locks', 'Microsoft Purview'],
        examTrapGuard:
          'Even a Subscription Owner gets blocked by a CanNotDelete Lock until they remove the lock first.',
      },
      {
        moduleId: 10,
        pathId: 3,
        moduleTitle: 'Azure Management & Deployment Tools',
        serviceCategory: 'Deployment & Hybrid',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Why do Portal, CLI, PowerShell, ARM Templates, and Bicep enforce the exact same Policies and RBAC?',
        serviceApplication:
          'Every tool sends authenticated REST requests directly through the unified Azure Resource Manager (ARM) control plane before touching any backend service.',
        azureServices: ['Azure Resource Manager (ARM)', 'Azure CLI / PowerShell', 'Cloud Shell', 'Bicep'],
        examTrapGuard:
          'Switching from Azure Portal to Azure CLI never bypasses an Azure Policy or RBAC restriction—both hit the same ARM layer.',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'gov-q1',
        prompt:
          'A developer has Owner RBAC permissions on a Resource Group, yet Azure blocks them when running an Azure CLI command to deploy an expensive GPU VM in an unapproved region. Which layer intercepted the ARM request?',
        options: [
          'Azure Advisor Cost Recommendation',
          'Azure Policy assigned at the Subscription or Management Group scope',
          'ReadOnly Resource Lock preventing CLI usage only',
          'Storage Cool Tier lifecycle rule',
        ],
        correctIndex: 1,
        threadInsight:
          'Because Azure CLI uses the exact same ARM Control Plane (Module 10) as the Portal, Module 9 Azure Policy overrides RBAC Owner rights to enforce region and SKU compliance inherited from Module 4.',
      },
    ],
  },
  {
    id: 'lifecycle-cost-economics',
    numberLabel: 'Theme 05',
    title: 'Lifecycle & Consumption FinOps Economics',
    shortTitle: 'Lifecycle & FinOps Economics',
    subtitle: 'Connecting CapEx vs. OpEx (M3) to Storage Access Tiers (M6), Calculators/Discounts (M8), and Advisor (M11).',
    coreTheory:
      'Cloud financial optimization tracks the full resource lifecycle: (1) Right tool before migrating (TCO vs Pricing Calculator), (2) Metering runtime and outbound network egress instead of idle hardware, (3) Matching Storage "temperature" (Hot → Cool → Cold → Archive) to data age, and (4) Committing steady baselines via Reservations, Savings Plans, and Hybrid Benefit.',
    originSummary: 'Starts in Path 1 · Module 3 (CapEx vs OpEx & Consumption).',
    examPayoffSummary:
      'Immediately spot cost discriminators: Migrate comparison = TCO Calculator; New Azure budget = Pricing Calculator; Infrequent aging files = Cool/Archive; Steady 24/7 VMs = Reservations.',
    accentHex: '#C2410C',
    serviceCategoriesCarried: [
      'Cloud Foundations',
      'Compute',
      'Networking',
      'Storage',
      'Cost & FinOps',
      'Monitoring & Advisory',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 3,
        pathId: 1,
        moduleTitle: 'Cloud Pricing & Consumption Models',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Replaces large upfront CapEx datacenter hardware purchases with usage-based monthly OpEx.',
        serviceApplication:
          'Teaches consumption economics: pay only for resources actively consumed, scale down off-hours, and eliminate fixed over-provisioning.',
        azureServices: ['CapEx vs OpEx', 'Consumption-Based Model'],
        examTrapGuard:
          'Moving to Azure converts IT infrastructure from CapEx to OpEx—it does not make every Azure service completely free when idle.',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Compute',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'How do Module 3 consumption meters behave inside Module 5 Compute & Networking?',
        serviceApplication:
          'Deallocated VMs stop compute charges (only attached OS/data disks keep billing). Inbound data transfer to Azure is free, whereas outbound data egress across regions or to the internet incurs charges.',
        azureServices: ['Stopped (Deallocated) VMs', 'Outbound Bandwidth Metering', 'ExpressRoute Metered vs Unlimited'],
        examTrapGuard:
          'Closing Windows inside the VM leaves status "Stopped" and STILL bills compute—you must "Stop (Deallocate)" via Azure.',
      },
      {
        moduleId: 6,
        pathId: 2,
        moduleTitle: 'Azure Storage Services',
        serviceCategory: 'Storage',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Applies OpEx "pay only for speed you need" directly to data aging.',
        serviceApplication:
          'Hot (active daily files: higher $/GB storage, lowest read cost) → Cool (30+ days) → Cold (90+ days) → Archive (180+ days, offline, cheapest storage $/GB, hours required for rehydration).',
        azureServices: ['Hot / Cool / Cold / Archive Access Tiers', 'Lifecycle Management Policies'],
        examTrapGuard:
          'Putting frequently read files in Cool/Archive backfires financially because early-deletion penalties and read transaction fees surge.',
      },
      {
        moduleId: 8,
        pathId: 3,
        moduleTitle: 'Azure Cost Management',
        serviceCategory: 'Cost & FinOps',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'All the cost levers from M3, M5, and M6 converge inside Module 8 FinOps.',
        serviceApplication:
          'Estimate net new Azure builds with Pricing Calculator; justify on-prem exit with TCO Calculator; track real spend & alerts with Cost Management; cut steady VM/SQL bills via 1–3 yr Reserved Instances, Savings Plans, Tags, and Azure Hybrid Benefit.',
        azureServices: ['Pricing Calculator', 'TCO Calculator', 'Reserved Instances', 'Azure Hybrid Benefit', 'Resource Tags'],
        examTrapGuard:
          'Pricing Calculator estimates NEW workloads; Cost Management monitors ACTIVE spend & budgets.',
      },
      {
        moduleId: 11,
        pathId: 3,
        moduleTitle: 'Azure Monitoring & Advisory Tools',
        serviceCategory: 'Monitoring & Advisory',
        roleInThread: 'Exam Payoff',
        earlierRecallPrompt:
          'Closing the OpEx loop automatically with proactive recommendations.',
        serviceApplication:
          'Azure Advisor Cost pillar continuously inspects idle VMs, underutilized ExpressRoute circuits, and Reserved Instance candidates to surface immediate OpEx savings.',
        azureServices: ['Azure Advisor (Cost Blade)', 'Budget Alert Actions'],
        examTrapGuard:
          'Advisor recommends cost savings; Cost Management sets spending budgets and chargesback via Tags.',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'finops-q1',
        prompt:
          'Compliance audits must stay online-accessible with low cost for 45 days, then move offline for 7 years where retrieval can wait 6 hours. Applying the Lifecycle Economics thread (M3 → M6 → M8), which path optimizes OpEx?',
        options: [
          'Keep files in Premium Managed Disks forever with a ReadOnly lock',
          'Lifecycle policy moving blobs from Cool (45 days) to Archive Tier (7 years) + monitor savings in Cost Management',
          'Use the TCO Calculator to purchase on-premises tape drives',
          'Move all blobs to LRS Hot Tier and buy 3-year Compute Reserved Instances',
        ],
        correctIndex: 1,
        threadInsight:
          'Module 6 Access Tiers operationalize Module 3 OpEx efficiency: Cool covers the 30+ day infrequent window, and Archive slashes 7-year compliance storage cost when multi-hour rehydration is acceptable.',
      },
    ],
  },
  {
    id: 'hybrid-declarative-control',
    numberLabel: 'Theme 06',
    title: 'Declarative Automation & Unified Hybrid Plane',
    shortTitle: 'IaC & Hybrid Arc Continuity',
    subtitle: 'Extending Module 1 Hybrid Cloud through Networking/Migration (M5–M6), ARM/Bicep & Arc (M10), and Monitor (M11).',
    coreTheory:
      'Modern cloud agility requires two unifying mechanisms: (1) Declarative Infrastructure as Code (ARM Templates & Bicep) so environments build identically and idempotently instead of fragile manual clicks, and (2) Unified Control Plane projection (Azure Arc) so on-premises and AWS/GCP servers obey the same Azure Policy, Tags, RBAC, and Monitoring.',
    originSummary: 'Introduced in Path 1 · Module 1 (Hybrid & Multi-Cloud) & Module 2 (Agility).',
    examPayoffSummary:
      'Whenever an exam scenario spans on-premises + AWS/GCP + Azure and asks for unified Azure Policy, Inventory, or Monitor dashboards, Azure Arc is the bridge.',
    accentHex: '#0284C7',
    serviceCategoriesCarried: [
      'Cloud Foundations',
      'Networking',
      'Storage',
      'Governance & Compliance',
      'Deployment & Hybrid',
      'Monitoring & Advisory',
      'Exam Synthesis',
    ],
    moduleConnections: [
      {
        moduleId: 1,
        pathId: 1,
        moduleTitle: 'Fundamental Cloud Concepts',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Origin Anchor',
        earlierRecallPrompt:
          'Hybrid Cloud blends private on-premises datacenters with public cloud; Multi-Cloud spans multiple cloud providers.',
        serviceApplication:
          'Sets the core architectural challenge: how do teams govern and deploy consistently when workloads live across on-prem and multi-cloud estates?',
        azureServices: ['Hybrid Cloud', 'Multi-Cloud Strategy'],
        examTrapGuard:
          'Hybrid = private + public cloud; Multi-cloud = two or more public clouds (e.g., Azure + AWS).',
      },
      {
        moduleId: 2,
        pathId: 1,
        moduleTitle: 'Cloud Benefits',
        serviceCategory: 'Cloud Foundations',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Agility requires deploying identical environments in minutes, not weeks.',
        serviceApplication:
          'Manual Portal setups break repeatability; true cloud agility depends on declarative blueprints.',
        azureServices: ['Cloud Agility', 'Rapid Deployment'],
        examTrapGuard:
          'Agility is deployment speed & iteration velocity—distinct from Scalability (capacity sizing).',
      },
      {
        moduleId: 5,
        pathId: 2,
        moduleTitle: 'Azure Compute & Networking Services',
        serviceCategory: 'Networking',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Connecting Module 1 Hybrid environments at the network transport layer.',
        serviceApplication:
          'VPN Gateway creates encrypted IPsec tunnels over the public internet; ExpressRoute establishes private fiber circuits between your on-premises WAN and Azure VNets.',
        azureServices: ['Azure VPN Gateway', 'Azure ExpressRoute', 'VNet Peering'],
        examTrapGuard:
          'VNet Peering connects two Azure VNets; VPN Gateway or ExpressRoute connects on-premises networks to Azure.',
      },
      {
        moduleId: 6,
        pathId: 2,
        moduleTitle: 'Azure Storage Services',
        serviceCategory: 'Storage',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'Bridging on-premises files and bulk data into Azure Storage.',
        serviceApplication:
          'Azure File Sync caches hot Azure Files shares right on local on-premises Windows Servers; Azure Data Box ships ruggedized hardware for offline multi-terabyte/petabyte migrations.',
        azureServices: ['Azure File Sync', 'Azure Migrate', 'Azure Data Box', 'AzCopy'],
        examTrapGuard:
          'Use Azure Data Box (not AzCopy over slow WAN) when migrating 80 TB on a tight schedule with limited internet bandwidth.',
      },
      {
        moduleId: 10,
        pathId: 3,
        moduleTitle: 'Azure Management & Deployment Tools',
        serviceCategory: 'Deployment & Hybrid',
        roleInThread: 'Core Carryover',
        earlierRecallPrompt:
          'How Module 1 Hybrid & Module 2 Agility become concrete DevOps tools.',
        serviceApplication:
          'ARM JSON Templates and Bicep define declarative, idempotent deployments across dev/test/prod. Azure Arc projects external on-prem, AWS, and GCP servers & Kubernetes clusters directly into ARM.',
        azureServices: ['Bicep & ARM Templates', 'Azure Arc', 'Cloud Shell & Azure CLI'],
        examTrapGuard:
          'Bicep compiles to ARM JSON and simplifies syntax; Azure Arc manages servers OUTSIDE Azure datacenters.',
      },
      {
        moduleId: 11,
        pathId: 3,
        moduleTitle: 'Azure Monitoring & Advisory Tools',
        serviceCategory: 'Monitoring & Advisory',
        roleInThread: 'Exam Payoff',
        earlierRecallPrompt:
          'Observing both cloud-native and Arc-connected hybrid resources through one lens.',
        serviceApplication:
          'Azure Monitor + Log Analytics collect metrics, logs, and Application Insights telemetry uniformly across native Azure workloads and Azure Arc-enabled on-prem/AWS machines.',
        azureServices: ['Azure Monitor', 'Log Analytics Workspace', 'Application Insights'],
        examTrapGuard:
          'Azure Monitor observes resource performance and apps; Azure Arc is the bridge that puts non-Azure machines under Azure governance & monitoring.',
      },
    ],
    bridgeQuizzes: [
      {
        id: 'hybrid-q1',
        prompt:
          'An enterprise runs VMs in Azure, bare-metal Linux hosts on-premises, and containers in AWS, and wants to enforce Module 9 Azure Policy and collect Module 11 Azure Monitor logs from a single control plane. Which Module 10 service completes this Module 1 Hybrid thread?',
        options: [
          'Azure Pricing Calculator',
          'Azure Arc',
          'Azure Data Box',
          'Locally Redundant Storage (LRS)',
        ],
        correctIndex: 1,
        threadInsight:
          'Azure Arc extends the Azure Resource Manager control plane outside Azure datacenters—fulfilling the Module 1 Hybrid/Multi-Cloud thread across Policy (M9) and Monitor (M11).',
      },
    ],
  },
];

export type ThreadTagId =
  | 'Scaling'
  | 'Reliability'
  | 'Security'
  | 'Responsibility'
  | 'FinOps'
  | 'Hybrid/IaC';

export interface ThreadTagMeta {
  id: ThreadTagId;
  themeId: string;
  label: ThreadTagId;
  shortDescription: string;
  badgeClass: string;
  activeModuleBadgeClass: string;
}

export const THREAD_TAG_META: Record<ThreadTagId, ThreadTagMeta> = {
  Scaling: {
    id: 'Scaling',
    themeId: 'scaling-elasticity',
    label: 'Scaling',
    shortDescription: 'Vertical (Scale Up/Down) vs. Horizontal (Scale Out/In & Elasticity)',
    badgeClass:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
  Reliability: {
    id: 'Reliability',
    themeId: 'blast-radius-resiliency',
    label: 'Reliability',
    shortDescription: 'Blast-Radius Isolation: HA, Availability Zones, Region Pairs & LRS/ZRS/GRS',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
  Security: {
    id: 'Security',
    themeId: 'control-vs-data-plane',
    label: 'Security',
    shortDescription: 'Control Plane & Zero Trust: Entra ID, RBAC, Policy & Resource Locks',
    badgeClass:
      'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
  Responsibility: {
    id: 'Responsibility',
    themeId: 'shared-responsibility',
    label: 'Responsibility',
    shortDescription: 'Shared Responsibility: IaaS / PaaS / SaaS & Managed Shift',
    badgeClass:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
  FinOps: {
    id: 'FinOps',
    themeId: 'lifecycle-cost-economics',
    label: 'FinOps',
    shortDescription: 'Lifecycle & Consumption Economics: OpEx, Access Tiers, TCO & Reservations',
    badgeClass:
      'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
  'Hybrid/IaC': {
    id: 'Hybrid/IaC',
    themeId: 'hybrid-declarative-control',
    label: 'Hybrid/IaC',
    shortDescription: 'Declarative IaC (ARM/Bicep) & Unified Hybrid Plane (Azure Arc)',
    badgeClass:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-800',
    activeModuleBadgeClass: 'bg-white/20 text-white border-white/30',
  },
};

const THEME_ID_TO_TAG: Record<string, ThreadTagId> = {
  'scaling-elasticity': 'Scaling',
  'blast-radius-resiliency': 'Reliability',
  'control-vs-data-plane': 'Security',
  'shared-responsibility': 'Responsibility',
  'lifecycle-cost-economics': 'FinOps',
  'hybrid-declarative-control': 'Hybrid/IaC',
};

const MODULE_PRIMARY_TAG_ORDER: Record<number, ThreadTagId[]> = {
  1: ['Responsibility', 'Hybrid/IaC'],
  2: ['Scaling', 'Reliability', 'Hybrid/IaC'],
  3: ['FinOps', 'Scaling', 'Responsibility'],
  4: ['Reliability', 'Security', 'Scaling'],
  5: ['Scaling', 'Reliability', 'Responsibility'],
  6: ['Reliability', 'Scaling', 'FinOps'],
  7: ['Security', 'Responsibility'],
  8: ['FinOps', 'Scaling'],
  9: ['Security', 'Responsibility'],
  10: ['Hybrid/IaC', 'Security'],
  11: ['Scaling', 'Reliability', 'FinOps'],
  12: ['Scaling', 'Reliability', 'Security'],
};

export function getThreadTagsForModule(moduleId: number, maxTags = 3): ThreadTagMeta[] {
  const explicitOrder = MODULE_PRIMARY_TAG_ORDER[moduleId];
  if (explicitOrder) {
    return explicitOrder.slice(0, maxTags).map((tagId) => THREAD_TAG_META[tagId]);
  }
  const derived: ThreadTagMeta[] = [];
  for (const theme of AZURE_THEME_THREADS) {
    if (theme.moduleConnections.some((c) => c.moduleId === moduleId)) {
      const tagId = THEME_ID_TO_TAG[theme.id];
      if (tagId) derived.push(THREAD_TAG_META[tagId]);
    }
  }
  return derived.slice(0, maxTags);
}

const QUESTION_KEYWORD_RULES: Record<ThreadTagId, string[]> = {
  Scaling: [
    'vertical',
    'horizontal',
    'scale up',
    'scale down',
    'scale out',
    'scale in',
    'scalability',
    'elasticity',
    'elastic',
    'autoscale',
    'auto-scale',
    'scale set',
    'vmss',
    'burst',
    'resize',
    'iops',
    'load balancer',
    'throughput',
    'traffic spike',
    'concurrent',
    'aks',
    'pods',
  ],
  Reliability: [
    'high availability',
    'disaster recovery',
    'availability zone',
    'region pair',
    'paired region',
    'fault domain',
    'redundancy',
    'redundant',
    'lrs',
    'zrs',
    'grs',
    'gzrs',
    'ra-grs',
    'ra-gzrs',
    'sla',
    'uptime',
    'failover',
    'rto',
    'rpo',
    'service health',
    'resource health',
    'outage',
    'resilient',
  ],
  Security: [
    'entra',
    'active directory',
    'rbac',
    'role-based',
    'mfa',
    'multi-factor',
    'conditional access',
    'zero trust',
    'defense in depth',
    'defense-in-depth',
    'firewall',
    'nsg',
    'network security group',
    'ddos',
    'key vault',
    'encryption',
    'azure policy',
    'policy',
    'resource lock',
    'cannotdelete',
    'readonly',
    'purview',
    'defender',
    'sentinel',
    'authentication',
    'authorization',
    'trust center',
    'compliance',
  ],
  Responsibility: [
    'shared responsibility',
    'iaas',
    'paas',
    'saas',
    'serverless',
    'patching',
    'os update',
    'operating system',
    'hypervisor',
    'physical hardware',
    'physical security',
    'managed service',
    'customer responsibility',
    'microsoft manages',
    'app service',
    'azure functions',
  ],
  FinOps: [
    'capex',
    'opex',
    'capital expenditure',
    'operational expenditure',
    'consumption',
    'pay-as-you-go',
    'pricing calculator',
    'tco',
    'total cost of ownership',
    'cost management',
    'reserved instance',
    'reservation',
    'savings plan',
    'hybrid benefit',
    'access tier',
    'hot tier',
    'cool tier',
    'cold tier',
    'archive tier',
    'rehydrat',
    'deallocate',
    'egress',
    'budget',
    'tags',
  ],
  'Hybrid/IaC': [
    'hybrid cloud',
    'multi-cloud',
    'multicloud',
    'on-premises',
    'azure arc',
    'bicep',
    'arm template',
    'infrastructure as code',
    'iac',
    'declarative',
    'idempotent',
    'vpn gateway',
    'expressroute',
    'vnet peering',
    'file sync',
    'data box',
    'azcopy',
    'azure migrate',
    'cloud shell',
    'azure cli',
    'powershell',
  ],
};

export function getThreadTagsForQuestion(question: Question, maxTags = 3): ThreadTagMeta[] {
  const haystack = [
    question.question,
    question.scenario || '',
    question.whyCorrect || '',
    question.examTip || '',
    question.moduleTitle || '',
    ...(question.options || []),
  ]
    .join(' ')
    .toLowerCase();

  const scores: Array<{ tagId: ThreadTagId; score: number }> = (
    Object.keys(QUESTION_KEYWORD_RULES) as ThreadTagId[]
  ).map((tagId) => {
    const keywords = QUESTION_KEYWORD_RULES[tagId];
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        score += kw.includes(' ') ? 2 : 1;
      }
    }
    return { tagId, score };
  });

  const matched = scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTags)
    .map((s) => THREAD_TAG_META[s.tagId]);

  if (matched.length > 0) {
    return matched;
  }

  return getThreadTagsForModule(question.moduleId, Math.min(2, maxTags));
}

export type ScalingAxisMode = 'Horizontal' | 'Vertical' | 'Both';

export interface ScalingPillarDetail {
  primaryMode: ScalingAxisMode;
  horizontalSpec: string;
  verticalSpec: string;
  azureComponents: string[];
  keyExamRule: string;
}

export interface ScalingDeepDiveModule {
  moduleId: number;
  pathId: 1 | 2 | 3;
  moduleTitle: string;
  moduleFocusSummary: string;
  compute: ScalingPillarDetail;
  networking: ScalingPillarDetail;
  storage: ScalingPillarDetail;
}

export const SCALING_DEEP_DIVE_MODULES: ScalingDeepDiveModule[] = [
  {
    moduleId: 1,
    pathId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    moduleFocusSummary:
      'Establishes who owns scaling orchestration across IaaS, PaaS, SaaS, and Hybrid models.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'PaaS & SaaS compute hide host node orchestration behind platform-managed elastic workers; Hybrid bursts peak compute into public cloud instances.',
      verticalSpec:
        'IaaS compute leaves VM family/vCPU sizing choices to your team while Microsoft scales the physical datacenter host rack.',
      azureComponents: ['IaaS VMs', 'PaaS Web Tiers', 'Cloud Bursting'],
      keyExamRule:
        'Customer chooses VM sizes in IaaS; Microsoft abstracts physical host expansion in PaaS/SaaS.',
    },
    networking: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Hybrid cloud concepts introduce bursting network edge ingress from private datacenters out into parallel public cloud endpoints.',
      verticalSpec:
        'On-premises fixed WAN links impose hard vertical bandwidth ceilings until connected to elastic cloud edges.',
      azureComponents: ['Public Cloud Edge', 'Hybrid Connectivity Boundary'],
      keyExamRule:
        'Hybrid models connect fixed on-prem links to elastically reachable cloud endpoints.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Public cloud storage abstracts multi-petabyte object pools horizontally so customers never rack new disk arrays.',
      verticalSpec:
        'Shared responsibility leaves tier selection (disk IOPS vs capacity class) with the customer while Microsoft replaces failed physical drives.',
      azureComponents: ['Cloud Object Pools', 'Shared Responsibility Storage Tiering'],
      keyExamRule:
        'Physical drive capacity scaling is always Microsoft’s job; choosing the right tier/SKU stays yours.',
    },
  },
  {
    moduleId: 2,
    pathId: 1,
    moduleTitle: 'Cloud Benefits',
    moduleFocusSummary:
      'Defines the core geometry: Vertical Scale Up/Down vs. Horizontal Scale Out/In and automated Elasticity.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'Scale Out adds parallel compute nodes as traffic spikes and Elasticity automatically Scales In idle nodes when demand drops.',
      verticalSpec:
        'Scale Up increases CPU cores and RAM on a single compute instance when a workload cannot split across multiple nodes.',
      azureComponents: ['Elasticity Engine', 'Horizontal Instance Pool', 'Vertical Compute Tier'],
      keyExamRule:
        'Scalability = capacity to grow; Elasticity = automatic horizontal expansion and contraction on live demand.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Distributing incoming user requests across parallel compute instances preserves High Availability during sudden traffic surges.',
      verticalSpec:
        'Upgrading single-tunnel network throughput handles larger single-stream flows without splitting sessions.',
      azureComponents: ['Traffic Distribution', 'HA Fault Isolation'],
      keyExamRule:
        'Horizontal node scaling only improves availability when traffic distributes dynamically across instances.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Cloud storage scales horizontally to absorb millions of concurrent reads/writes without upfront hardware procurement.',
      verticalSpec:
        'Vertical storage capability raises IOPS/throughput quotas on an individual volume when latency-sensitive databases grow.',
      azureComponents: ['Elastic Storage Capacity', 'Volume Throughput Limits'],
      keyExamRule:
        'Predictability comes from pre-known capacity ceilings across both vertical and horizontal dimensions.',
    },
  },
  {
    moduleId: 3,
    pathId: 1,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    moduleFocusSummary:
      'Translates Vertical over-provisioning and Horizontal elasticity directly into CapEx vs. OpEx economics.',
    compute: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Consumption and serverless models bill per-second or per-execution across horizontally scaled workers—scaling in to zero drops compute spend to $0.',
      verticalSpec:
        'Static vertical over-sizing burns OpEx 24/7 unless instances are right-sized or deallocated during off-peak windows.',
      azureComponents: ['Consumption Plan', 'Pay-As-You-Go Billing', 'Azure Functions'],
      keyExamRule:
        'Elastic horizontal scale-in is the primary driver that turns CapEx peak hardware waste into variable OpEx.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Inbound data ingress stays free even as horizontal edge traffic spikes; outbound data egress meters proportionally with scale.',
      verticalSpec:
        'Predictable high-throughput gateways swap metered GB transfers for higher fixed monthly SKU bandwidth.',
      azureComponents: ['Ingress (Free)', 'Data Egress Metering', 'Circuit SKU Plans'],
      keyExamRule:
        'Remember egress billing: scaling out cross-region replicas multiplies outbound network transfer costs.',
    },
    storage: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Pay-as-you-go object storage scales horizontally per GB stored without forcing you to pre-buy multi-terabyte SAN arrays upfront.',
      verticalSpec:
        'Higher vertical disk performance classes lock in fixed monthly provisioned capacity pricing even if disk space sits empty.',
      azureComponents: ['Per-GB Consumption Storage', 'Provisioned Disk Tier Cost'],
      keyExamRule:
        'Blob capacity is consumption OpEx per GB used; Managed Disks bill by provisioned vertical disk SKU size.',
    },
  },
  {
    moduleId: 4,
    pathId: 2,
    moduleTitle: 'Core Azure Architectural Components',
    moduleFocusSummary:
      'Projects Horizontal scaling across physical Availability Zones and Regions to eliminate single-datacenter bottlenecks.',
    compute: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Deploying horizontal compute instances across Availability Zones 1, 2, and 3 turns instance scaling into 99.99% datacenter-fault-tolerant HA.',
      verticalSpec:
        'A vertically scaled single VM still resides in one datacenter unless paired or rebuilt across zones.',
      azureComponents: ['Availability Zones', 'Azure Regions', 'Management Group Quotas'],
      keyExamRule:
        'Horizontal scale inside 1 zone protects load capacity; spanning Availability Zones protects datacenter power/cooling.',
    },
    networking: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Virtual Networks span all Availability Zones within a single Region natively, letting horizontal nodes communicate across zones seamlessly.',
      verticalSpec:
        'Cross-region latency remains bounded by physical Geography distance unless traffic splits into regional hubs.',
      azureComponents: ['Zone-Spanning VNet', 'Region Pairs', 'Azure Geographies'],
      keyExamRule:
        'VNets span zones inside ONE region automatically; they never stretch across two regions without VNet Peering.',
    },
    storage: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Zone-Redundant (ZRS) and Geo-Redundant (GRS/GZRS) architectures mirror horizontal replicas across independent buildings and 300+ mile paired regions.',
      verticalSpec:
        'Locally Redundant Storage (LRS) stays within one datacenter stamp—vertical capacity scales locally without cross-zone blast protection.',
      azureComponents: ['ZRS 3-Zone Replicas', 'Region Pair Geo-Replication'],
      keyExamRule:
        'Match horizontal physical spread to blast radius: 1 DC (LRS), 3 AZs (ZRS), 2 Regions (GRS/GZRS).',
    },
  },
  {
    moduleId: 5,
    pathId: 2,
    moduleTitle: 'Azure Compute & Networking Services',
    moduleFocusSummary:
      'The core implementation hub: compares VM resize vs. VMSS/App Service/AKS and ExpressRoute SKUs vs. Load Balancers.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'VM Scale Sets (VMSS), App Service Autoscale, Azure Container Instances (ACI), AKS node/pod autoscalers, and Functions fan out stateless workers with zero downtime.',
      verticalSpec:
        'Single Azure VMs and App Service Plan tiers scale vertically (e.g., B2s → D8s_v5 or Basic → Premium) by upgrading CPU/RAM (VM resize triggers brief reboot).',
      azureComponents: ['VM Resize (Vertical)', 'VM Scale Sets (Horizontal)', 'App Service', 'AKS'],
      keyExamRule:
        'Need zero-downtime elastic web scale? Pick VMSS / App Service / AKS (Horizontal), NOT manual single-VM vertical resize.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Azure Load Balancer, Application Gateway, and Azure DNS distribute traffic across dynamic horizontal backend pools; VNet Peering fans topology horizontally across VNets.',
      verticalSpec:
        'Azure ExpressRoute scales vertically by circuit bandwidth SKU (50 Mbps → 10 Gbps), and VPN Gateway SKUs step up tunnel throughput.',
      azureComponents: [
        'Azure Load Balancer (Horizontal Pool)',
        'ExpressRoute Bandwidth SKU (Vertical)',
        'VPN Gateway SKUs',
      ],
      keyExamRule:
        'ExpressRoute upgrades bandwidth vertically per circuit SKU; Load Balancer fans traffic horizontally across VMSS.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'VMSS instances attach uniform OS/ephemeral disks created automatically per horizontal node via shared VM images.',
      verticalSpec:
        'Compute VM families cap max attached Managed Disk count and total host storage throughput—forcing a VM vertical resize to unlock higher disk bandwidth.',
      azureComponents: ['VM Ephemeral OS Disks', 'Host Disk IOPS Ceiling'],
      keyExamRule:
        'A single VM’s size SKU caps how many data disks and combined IOPS it can drive vertically.',
    },
  },
  {
    moduleId: 6,
    pathId: 2,
    moduleTitle: 'Azure Storage Services',
    moduleFocusSummary:
      'Demonstrates how Storage uses vertical disk performance tiering (P10→P80) vs. horizontal Blob partitioning.',
    compute: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Cloud-native stateless compute pools (VMSS/Functions) detach local state into shared Storage accounts so any horizontal compute node can serve any request.',
      verticalSpec:
        'Stateful single-VM databases rely on fast local attached Managed Disks paired directly with vertically sized compute memory/IOPS.',
      azureComponents: ['Stateless Compute + Shared Blob', 'Stateful VM Disk Pairing'],
      keyExamRule:
        'Horizontal compute scaling requires decoupling state out of local VM drives into Azure Storage or Azure Files.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Blob REST endpoints and Content Delivery / AzCopy multi-threaded transfers fan parallel HTTP connections across storage partition servers.',
      verticalSpec:
        'Private Endpoints and Storage Account throughput caps govern single-link data transfer rates during heavy ingest.',
      azureComponents: ['Parallel Blob HTTPS Endpoints', 'AzCopy', 'Azure Data Box'],
      keyExamRule:
        'When WAN bandwidth caps parallel network transfer of 80+ TB, switch to offline Azure Data Box.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Azure Blob Storage automatically horizontally partitions object key ranges across scale stamps; Azure Files Premium shares scale capacity and IOPS dynamically.',
      verticalSpec:
        'Azure Managed Disks scale vertically across tiers (Standard HDD → Standard SSD → Premium SSD P10/P30/P80 → Ultra Disk) to raise IOPS and MB/s per disk.',
      azureComponents: ['Managed Disk SKUs P10–P80 (Vertical)', 'Blob Auto-Partitioning (Horizontal)', 'Azure Files'],
      keyExamRule:
        'Boost single-VM database IOPS vertically with Premium/Ultra Managed Disks; serve web assets horizontally via Blob.',
    },
  },
  {
    moduleId: 7,
    pathId: 2,
    moduleTitle: 'Azure Identity, Access, & Security',
    moduleFocusSummary:
      'Ensures security controls scale automatically as horizontal compute, network edges, and storage pools expand.',
    compute: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'System-assigned Managed Identities and Entra ID tokens propagate automatically to every newly added VMSS or AKS container instance without embedding static secrets.',
      verticalSpec:
        'Resizing a single VM vertically preserves its existing Managed Identity and RBAC scope assignment cleanly.',
      azureComponents: ['Managed Identities', 'Microsoft Entra ID', 'Azure Key Vault'],
      keyExamRule:
        'Elastic horizontal pools never hardcode passwords—each scaled-out node authenticates via Managed Identity.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Network Security Groups (NSGs) and Azure DDoS Protection scrub volumetric distributed attacks across elastic edge capacity without choking legitimate scale-out.',
      verticalSpec:
        'Azure Firewall scales automatically in throughput capacity to inspect growing north-south VNet traffic.',
      azureComponents: ['NSGs', 'Azure DDoS Protection', 'Azure Firewall'],
      keyExamRule:
        'Azure DDoS Protection absorbs horizontal traffic floods so your autoscale engine does not scale out wastefully for attack traffic.',
    },
    storage: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'RBAC and Shared Access Signatures (SAS) govern access uniformly across billions of horizontally partitioned Blobs via Microsoft Entra ID.',
      verticalSpec:
        'Key Vault HSM-backed customer keys encrypt every Managed Disk tier identically regardless of vertical disk IOPS upgrades.',
      azureComponents: ['Storage RBAC', 'Key Vault Encryption'],
      keyExamRule:
        'Use Entra ID RBAC over shared account keys so horizontally scaled compute services follow Zero Trust.',
    },
  },
  {
    moduleId: 8,
    pathId: 3,
    moduleTitle: 'Azure Cost Management',
    moduleFocusSummary:
      'Optimizes hybrid Vertical/Horizontal architecture using Reservations for baseline floors and PAYG for bursts.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'Lock 1-year or 3-year Reserved Instances / Savings Plans onto the steady minimum horizontal node floor, while letting PAYG handle elastic scale-out spikes.',
      verticalSpec:
        'Cost Management usage analysis exposes vertically oversized VMs (e.g., 10% CPU on D16s) so teams scale down to smaller SKUs.',
      azureComponents: ['Azure Reservations', 'Savings Plans', 'Azure Hybrid Benefit', 'Right-Sizing'],
      keyExamRule:
        'Reserve ONLY your predictable minimum horizontal baseline—never reserve temporary burst capacity.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Consolidating cross-region chats reduces outbound inter-region egress charges as horizontal microservice nodes scale.',
      verticalSpec:
        'High-volume ExpressRoute circuits switch from Metered Data to Unlimited Data plans when vertical bandwidth utilization crosses break-even.',
      azureComponents: ['Pricing Calculator', 'ExpressRoute Metered vs Unlimited', 'Cost Alerts'],
      keyExamRule:
        'Use the Pricing Calculator to model both horizontal instance count AND outbound network egress before launch.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Storage Reserved Capacity cuts $/TB on large horizontally growing Blob and Files pools; Lifecycle rules shift aging blobs Hot → Cool → Archive.',
      verticalSpec:
        'Downgrading over-provisioned Premium Managed Disks to Standard SSD vertically cuts fixed monthly volume spend.',
      azureComponents: ['Storage Reserved Capacity', 'Blob Lifecycle Tiers', 'Budgets'],
      keyExamRule:
        'Apply Resource Tags per workload so Cost Management tracks both horizontal burst and vertical disk spend by team.',
    },
  },
  {
    moduleId: 9,
    pathId: 3,
    moduleTitle: 'Azure Governance & Compliance Tools',
    moduleFocusSummary:
      'Applies Azure Policy guardrails and Resource Locks so runaway vertical or horizontal scaling stays compliant.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'Azure Policy can audit or restrict container/VM count and enforce approved regions across every region an elastic pool deploys into.',
      verticalSpec:
        'Policy "Allowed Virtual Machine SKUs" blocks teams from vertically scaling up to costly GPU/G-series VMs even with Owner RBAC.',
      azureComponents: ['Azure Policy Allowed SKUs', 'Policy Initiatives', 'Management Groups'],
      keyExamRule:
        'Want to stop developers from vertically resizing VMs into expensive giant SKUs? Use Azure Policy.',
    },
    networking: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Azure Policy enforces mandatory NSGs and denies accidental Public IP creation whenever new subnets or horizontal gateways deploy.',
      verticalSpec:
        'Resource Locks (CanNotDelete / ReadOnly) safeguard core ExpressRoute gateways from deletion during network tier changes.',
      azureComponents: ['Network Policy Guardrails', 'CanNotDelete Locks'],
      keyExamRule:
        'Resource Locks block deletion of shared hubs/gateways—remember to remove ReadOnly locks before scaling tiers.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Azure Policy mandates geo-redundant replication (GRS/ZRS) and blocks anonymous public Blob containers across all scaled storage accounts.',
      verticalSpec:
        'Microsoft Purview classifies sensitive compliance data regardless of whether it sits on Hot Blobs or Ultra Managed Disks.',
      azureComponents: ['Storage Compliance Policies', 'Microsoft Purview', 'ReadOnly Locks'],
      keyExamRule:
        'RBAC controls WHO creates storage; Policy enforces WHICH vertical disk tiers and horizontal redundancy SKUs are legal.',
    },
  },
  {
    moduleId: 10,
    pathId: 3,
    moduleTitle: 'Azure Management & Deployment Tools',
    moduleFocusSummary:
      'Automates identical horizontal fleet deployments via ARM/Bicep and projects scaling governance across Hybrid Arc.',
    compute: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Bicep and ARM Templates declare parameterized instance counts and VMSS templates so identical horizontal compute fleets deploy idempotently in minutes.',
      verticalSpec:
        'Swapping a single `vmSize` parameter in Bicep or running one `az vm resize` CLI command upgrades vertical SKUs reproducibly.',
      azureComponents: ['Bicep / ARM Templates', 'Azure CLI', 'Cloud Shell', 'Azure Arc'],
      keyExamRule:
        'Bicep/ARM idempotency guarantees re-running a template updates horizontal count or vertical SKU cleanly without duplicate resources.',
    },
    networking: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'Declarative ARM templates wire Load Balancers, backend pools, and VNet subnets identically across dev/test/prod regions.',
      verticalSpec:
        'Azure Arc projects on-premises and AWS/GCP servers into ARM control plane management over existing hybrid links.',
      azureComponents: ['Declarative VNet Templates', 'Azure Arc Control Plane'],
      keyExamRule:
        'Every Portal, CLI, PowerShell, and Bicep scaling action passes through the exact same ARM Control Plane.',
    },
    storage: {
      primaryMode: 'Horizontal',
      horizontalSpec:
        'IaC templates pre-provision standardized Storage Accounts, Blob containers, and AzCopy automated ingestion pipelines.',
      verticalSpec:
        'ARM template parameters safely adjust Managed Disk `sku.name` (Standard_LRS → Premium_LRS) under source control review.',
      azureComponents: ['ARM Storage Parameters', 'Azure PowerShell', 'AzCopy'],
      keyExamRule:
        'Parameterize SKUs inside Bicep so Dev deploys low vertical tiers and Prod deploys Zone-Redundant production tiers.',
    },
  },
  {
    moduleId: 11,
    pathId: 3,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    moduleFocusSummary:
      'Closes the feedback loop: Azure Monitor triggers horizontal autoscale while Azure Advisor catches vertical waste.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'Azure Monitor Metric Alerts (CPU > 75%, memory pressure, or queue depth) fire horizontal Scale-Out and quiet-hour Scale-In rules automatically.',
      verticalSpec:
        'Azure Advisor Cost & Performance blades detect vertically over-provisioned VMs running < 5% CPU and recommend shutting down or scaling down SKU tiers.',
      azureComponents: ['Azure Monitor Autoscale', 'Azure Advisor Cost/Performance', 'Application Insights'],
      keyExamRule:
        'Azure Monitor executes real-time autoscale triggers; Azure Advisor analyzes telemetry to recommend vertical right-sizing.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Application Insights & Network metrics track HTTP request rates and Load Balancer SNAT port saturation to scale backend pools ahead of drops.',
      verticalSpec:
        'Advisor flags underutilized ExpressRoute circuits ready to step down bandwidth SKUs, while Service Health warns of regional backbone incidents.',
      azureComponents: ['Application Insights', 'Azure Service Health', 'ExpressRoute Metrics'],
      keyExamRule:
        'Azure Status shows global cloud incidents; Service Health alerts specifically on regions impacting your scaled VNets.',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Storage Insights alerts on E2E latency, throttling, and partition hot spots across high-concurrency Blob and Azure Files workloads.',
      verticalSpec:
        'Disk IOPS % and Queue Depth telemetry show when a Managed Disk hits its vertical P10/P30 ceiling and needs a vertical SKU step-up.',
      azureComponents: ['Storage Insights', 'Disk IOPS Telemetry', 'Log Analytics Alerts'],
      keyExamRule:
        'Disk throttling metrics trigger vertical disk SKU upgrades; queue-depth metrics trigger horizontal worker scale-out.',
    },
  },
  {
    moduleId: 12,
    pathId: 3,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    moduleFocusSummary:
      'Exam decision matrix: synthesize Compute, Networking, and Storage scaling choices under real AZ-900 constraints.',
    compute: {
      primaryMode: 'Both',
      horizontalSpec:
        'Stateless web APIs, containers, and unpredictable e-commerce spikes → VMSS / App Service / AKS / Functions (Horizontal Elasticity across Zones).',
      verticalSpec:
        'Single-node legacy monolith needing immediate 256 GB RAM without code changes → Resize VM vertically (accepting brief reboot).',
      azureComponents: ['VMSS vs Single VM', 'App Service Autoscale', 'AKS'],
      keyExamRule:
        'Exam heuristic: "Unpredictable spikes + zero downtime + cost efficiency" = Horizontal Scale-Out + Elasticity.',
    },
    networking: {
      primaryMode: 'Both',
      horizontalSpec:
        'Multi-zone web traffic distribution → Load Balancer / Application Gateway feeding horizontal pools; global failover → Azure DNS / Traffic patterns.',
      verticalSpec:
        'Private deterministic on-prem-to-Azure bandwidth increase → upgrade ExpressRoute circuit bandwidth SKU vertically.',
      azureComponents: ['Load Balancer', 'ExpressRoute Bandwidth Upgrade', 'VNet Peering'],
      keyExamRule:
        'Separate pool traffic distribution (Load Balancer) from private circuit bandwidth tier upgrades (ExpressRoute).',
    },
    storage: {
      primaryMode: 'Both',
      horizontalSpec:
        'Global massive media / telemetry object scaling + aging FinOps → Blob Storage partitioning + Cool/Archive tiers + ZRS/GRS durability.',
      verticalSpec:
        'Higher deterministic single-VM database IOPS/throughput → upgrade Managed Disk tier vertically (Premium SSD / Ultra Disk).',
      azureComponents: ['Premium/Ultra Managed Disk (Vertical)', 'Blob Partitioning + ZRS (Horizontal)'],
      keyExamRule:
        'Never recommend Blob Storage for OS boot/database random IOPS, and never recommend Managed Disks for internet-scale horizontal web objects.',
    },
  },
];

export interface ModuleThreadContextResult {
  theme: AzureThemeThread;
  moduleLink?: ThemeModuleLink;
  scalingDeepDive?: ScalingDeepDiveModule;
  explanationSummary: string;
  earlierConnection: string;
  azureServices: string[];
  examRule: string;
}

export function getThreadContextForModule(
  themeId: string,
  moduleId: number
): ModuleThreadContextResult {
  const theme =
    AZURE_THEME_THREADS.find((t) => t.id === themeId) || AZURE_THEME_THREADS[0];
  const moduleLink = theme.moduleConnections.find((c) => c.moduleId === moduleId);
  const scalingDeepDive =
    theme.id === 'scaling-elasticity'
      ? SCALING_DEEP_DIVE_MODULES.find((m) => m.moduleId === moduleId)
      : undefined;

  if (moduleLink) {
    return {
      theme,
      moduleLink,
      scalingDeepDive,
      explanationSummary: moduleLink.serviceApplication,
      earlierConnection: moduleLink.earlierRecallPrompt,
      azureServices: moduleLink.azureServices,
      examRule: moduleLink.examTrapGuard,
    };
  }

  // Fallback synthesis when a question's keyword tag applies in a module without a primary link row
  const nearestPrior =
    [...theme.moduleConnections]
      .reverse()
      .find((c) => c.moduleId < moduleId) || theme.moduleConnections[0];

  return {
    theme,
    moduleLink: undefined,
    scalingDeepDive,
    explanationSummary:
      scalingDeepDive?.moduleFocusSummary ||
      `${theme.coreTheory} In Module ${moduleId}, apply this foundational lens alongside ${nearestPrior.moduleTitle} (${nearestPrior.azureServices.slice(0, 2).join(', ')}).`,
    earlierConnection: `Built on ${theme.originSummary} and carried forward via Module ${nearestPrior.moduleId} (${nearestPrior.moduleTitle}).`,
    azureServices: nearestPrior.azureServices,
    examRule: theme.examPayoffSummary,
  };
}


