import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Layers,
  BookOpen,
  Play,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Search,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  Server,
  Database,
  Globe,
  DollarSign,
  Lock,
  Activity,
  Terminal,
  Cpu,
  Cloud,
} from 'lucide-react';
import { LEARNING_PATHS } from '../data/curriculum';
import { CURRICULUM_STUDY_MODULES } from '../data/studyNotes';
import { UserStats } from '../types/quiz';

interface AzureImageTutorViewProps {
  stats: UserStats;
  onPracticeModule: (moduleId: number) => void;
  onOpenStudyDecksModule?: (moduleId: number, pathId: 1 | 2 | 3) => void;
}

export interface DiagramHotspot {
  id: string;
  label: string;
  badge: string;
  xPercent: number;
  yPercent: number;
  summary: string;
  examRule: string;
  msLearnTopic: string;
}

export interface ModuleVisualLesson {
  moduleId: number;
  pathId: 1 | 2 | 3;
  moduleTitle: string;
  diagramTitle: string;
  diagramSubtitle: string;
  msLearnUrl: string;
  visualCaption: string;
  keyTakeaways: string[];
  examWatchout: string;
  hotspots: DiagramHotspot[];
}

interface CustomAdaptedDiagram {
  id: string;
  moduleId: number;
  title: string;
  imageUrl: string;
  notes: string;
  createdAt: number;
}

const CUSTOM_IMAGES_STORAGE_KEY = 'az900_image_tutor_custom_v1';

export const MODULE_VISUAL_LESSONS: ModuleVisualLesson[] = [
  {
    moduleId: 1,
    pathId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    diagramTitle: 'Microsoft Shared Responsibility Model & Cloud Deployment Models',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Responsibility transfer across On-Premises, IaaS, PaaS, and SaaS',
    msLearnUrl: 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/',
    visualCaption:
      'As you move from On-Premises to IaaS, PaaS, and SaaS, Microsoft assumes progressively more infrastructure and platform management, while the customer always retains ownership of Data, Endpoints, and Accounts/Identities.',
    keyTakeaways: [
      'Customer ALWAYS retains 100% responsibility for Information & Data, Devices (Mobile/PCs), and Accounts & Identities.',
      'Microsoft ALWAYS manages Physical Datacenter, Physical Network, and Physical Hosts in IaaS, PaaS, and SaaS.',
      'Operating System patching is the customer’s job in IaaS (Azure VMs), but Microsoft’s job in PaaS and SaaS.',
      'Hybrid Cloud bridges Private (on-premises) and Public (Azure) cloud resources.',
    ],
    examWatchout:
      'Exam Trap: Never select an answer claiming Microsoft manages customer data classification or user account permissions in SaaS—those 3 top layers always belong to the customer.',
    hotspots: [
      {
        id: 'm1-h1',
        label: 'Data, Endpoints & Identities',
        badge: '100% Customer Owned',
        xPercent: 50,
        yPercent: 16,
        summary:
          'Information & Data, Client Endpoints, and User Accounts/Access are never transferred to the cloud provider.',
        examRule: 'Even in SaaS (Microsoft 365), the customer owns data governance and user access.',
        msLearnTopic: 'Shared Responsibility Model',
      },
      {
        id: 'm1-h2',
        label: 'Operating System Layer',
        badge: 'IaaS vs. PaaS Boundary',
        xPercent: 32,
        yPercent: 52,
        summary:
          'The Operating System is the critical dividing line between IaaS (Customer patches OS) and PaaS (Microsoft patches OS).',
        examRule: 'If a scenario asks for maximum control over the OS kernel, choose IaaS (Virtual Machines).',
        msLearnTopic: 'Cloud Service Types (IaaS/PaaS/SaaS)',
      },
      {
        id: 'm1-h3',
        label: 'Physical Datacenter & Hosts',
        badge: '100% Microsoft Managed',
        xPercent: 68,
        yPercent: 84,
        summary:
          'Physical security, power, cooling, fiber cabling, and hypervisor server racks are managed by Microsoft across all cloud models.',
        examRule: 'Only in On-Premises private datacenters is the customer responsible for physical hardware.',
        msLearnTopic: 'Physical Infrastructure Responsibility',
      },
    ],
  },
  {
    moduleId: 2,
    pathId: 1,
    moduleTitle: 'Cloud Benefits',
    diagramTitle: 'Vertical vs. Horizontal Scaling, Elasticity & High Availability SLA',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Scale Up (Bigger VM) vs. Scale Out (More Instances) & Auto-Scale',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-benefits-use-cloud-services/',
    visualCaption:
      'Vertical scaling adds CPU/RAM to a single VM, whereas Horizontal scaling adds or removes multiple VM instances automatically based on real-time load (Elasticity) to maintain High Availability.',
    keyTakeaways: [
      'Vertical Scaling (Scale Up / Scale Down): Upgrading a single VM from 4 vCPUs to 16 vCPUs.',
      'Horizontal Scaling (Scale Out / Scale In): Adding 5 more web server instances behind a Load Balancer.',
      'Elasticity: Dynamic, rule-based horizontal auto-scaling as traffic spikes and subsides.',
      'High Availability (HA) ensures continuous uptime during component failures; Disaster Recovery (DR) restores operations after catastrophic regional outages.',
    ],
    examWatchout:
      'Exam Trap: Adding more RAM to a database server is Vertical Scaling (Scaling Up), NOT Horizontal Scaling (Scaling Out).',
    hotspots: [
      {
        id: 'm2-h1',
        label: 'Vertical Scaling (Scale Up/Down)',
        badge: 'CPU & RAM Resize',
        xPercent: 25,
        yPercent: 38,
        summary:
          'Increases or decreases the compute power (vCPU, Memory) of an existing single instance.',
        examRule: 'Vertical scaling often requires a brief reboot or SKU resize limit.',
        msLearnTopic: 'Scalability Concepts',
      },
      {
        id: 'm2-h2',
        label: 'Horizontal Scaling (Scale Out/In)',
        badge: 'Instance Count',
        xPercent: 72,
        yPercent: 38,
        summary:
          'Adds or removes identical instances in a Virtual Machine Scale Set or App Service Plan.',
        examRule: 'Horizontal scaling provides true fault tolerance because traffic is distributed across nodes.',
        msLearnTopic: 'Elasticity & Auto-Scaling',
      },
      {
        id: 'm2-h3',
        label: 'High Availability SLA Target',
        badge: '99.99% Uptime',
        xPercent: 50,
        yPercent: 78,
        summary:
          'Distributing instances across Availability Zones guarantees up to 99.99% uptime SLA.',
        examRule: 'Single-instance VMs with Premium SSD get 99.9%; Zone-redundant deployments reach 99.99%.',
        msLearnTopic: 'High Availability & Reliability',
      },
    ],
  },
  {
    moduleId: 3,
    pathId: 1,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    diagramTitle: 'CapEx vs. OpEx Economics & Consumption Billing Curves',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Upfront Capital Expenditure vs. Pay-As-You-Go Operational Expenditure',
    msLearnUrl: 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/',
    visualCaption:
      'On-premises infrastructure requires heavy upfront Capital Expenditure (CapEx) and depreciates over time, whereas Azure operates on an Operational Expenditure (OpEx) consumption model where you pay only for resources used.',
    keyTakeaways: [
      'CapEx (Capital Expenditure): Upfront spending on physical servers, buildings, and hardware.',
      'OpEx (Operational Expenditure): Pay-as-you-go monthly billing with zero upfront hardware investment.',
      'Ingress data transfer (into Azure) is FREE; Egress data transfer (outbound from Azure) is billed per GB.',
      'Azure Reservations (1-year or 3-year commitment) save up to 72% for predictable steady-state workloads.',
    ],
    examWatchout:
      'Exam Trap: Moving to the cloud shifts IT budgets from CapEx to OpEx—never the reverse.',
    hotspots: [
      {
        id: 'm3-h1',
        label: 'CapEx (Upfront Hardware)',
        badge: 'Fixed Sunk Cost',
        xPercent: 26,
        yPercent: 35,
        summary:
          'Purchasing physical servers and datacenter cooling upfront before serving a single user.',
        examRule: 'CapEx value is deducted over multiple years via accounting depreciation.',
        msLearnTopic: 'CapEx vs. OpEx',
      },
      {
        id: 'm3-h2',
        label: 'OpEx (Consumption Model)',
        badge: 'Pay-As-You-Go',
        xPercent: 74,
        yPercent: 35,
        summary:
          'Billed per second/hour/execution with no upfront commitment. Stop the VM, stop the compute charge.',
        examRule: 'Deallocating a VM stops compute billing, though attached storage disks still incur small storage costs.',
        msLearnTopic: 'Consumption-Based Model',
      },
      {
        id: 'm3-h3',
        label: 'Ingress (Free) vs. Egress (Metered)',
        badge: 'Network Billing Rule',
        xPercent: 50,
        yPercent: 78,
        summary:
          'Inbound data entering an Azure datacenter is always free; outbound data leaving Azure is metered.',
        examRule: 'Traffic between Availability Zones or across Regions also incurs data transfer charges.',
        msLearnTopic: 'Factors Affecting Cloud Costs',
      },
    ],
  },
  {
    moduleId: 4,
    pathId: 2,
    moduleTitle: 'Core Azure Architectural Components',
    diagramTitle: 'Azure Global Infrastructure (Regions, AZs & Pairs) & Management Hierarchy',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Management Groups → Subscriptions → Resource Groups → Resources',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-core-architectural-components-of-azure/',
    visualCaption:
      'Azure organizes global datacenters into Regions, Availability Zones (3 physically separate datacenters per region), and Region Pairs (300+ miles apart), while governing resources through a 4-tier management hierarchy.',
    keyTakeaways: [
      'Availability Zones: 3 physically separate locations within a single Region, each with independent power, cooling, and networking.',
      'Region Pairs: 2 regions within the same Geography separated by at least 300 miles with sequential platform updates.',
      'Hierarchy: Management Groups (up to 6 levels) → Subscriptions (billing boundary) → Resource Groups (lifecycle container) → Resources.',
      'A Resource can belong to ONLY ONE Resource Group at a time, and Resource Groups cannot be nested.',
    ],
    examWatchout:
      'Exam Trap: A Resource Group in East US can contain resources deployed in West Europe—a Resource Group’s location only dictates where its metadata is stored!',
    hotspots: [
      {
        id: 'm4-h1',
        label: 'Availability Zones (AZ 1, 2, 3)',
        badge: 'Intra-Region HA',
        xPercent: 28,
        yPercent: 32,
        summary:
          'Physically separate datacenters inside one Azure Region connected by ultra-low-latency private fiber (<2ms).',
        examRule: 'Protects workloads against single datacenter power/cooling failure (99.99% VM SLA).',
        msLearnTopic: 'Availability Zones',
      },
      {
        id: 'm4-h2',
        label: 'Region Pair (300+ Miles)',
        badge: 'Cross-Region DR',
        xPercent: 28,
        yPercent: 74,
        summary:
          'Each Azure Region is paired with another region in the same Geography for GRS storage and disaster recovery.',
        examRule: 'Microsoft updates only one region in a pair at a time to prevent simultaneous update outages.',
        msLearnTopic: 'Region Pairs & Sovereign Regions',
      },
      {
        id: 'm4-h3',
        label: '4-Tier Scope Hierarchy',
        badge: 'Policy & RBAC Inheritance',
        xPercent: 73,
        yPercent: 50,
        summary:
          'Management Groups → Subscriptions → Resource Groups → Resources. RBAC and Policies inherit downward automatically.',
        examRule: 'Deleting a Resource Group permanently deletes every resource inside it.',
        msLearnTopic: 'Management Hierarchy',
      },
    ],
  },
  {
    moduleId: 5,
    pathId: 2,
    moduleTitle: 'Azure Compute & Networking Services',
    diagramTitle: 'Azure Compute Spectrum & Hybrid Virtual Network Topology',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: VMs, Containers, App Service, Functions + VNet, VPN Gateway & ExpressRoute',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-azure-compute-networking-services/',
    visualCaption:
      'Azure Compute spans IaaS (VMs), Containers (ACI/AKS), PaaS (App Service), and Serverless (Azure Functions), connected via isolated Virtual Networks (VNets), VNet Peering, VPN Gateways, or private ExpressRoute circuits.',
    keyTakeaways: [
      'Virtual Machine Scale Sets (VMSS) deploy and auto-scale up to 1,000 identical load-balanced VMs.',
      'Azure Functions is serverless, event-driven compute; Azure Logic Apps is serverless low-code workflow orchestration.',
      'VPN Gateway sends encrypted IPsec traffic over the public internet; ExpressRoute uses a dedicated private fiber circuit.',
      'Azure Virtual Desktop (AVD) delivers multi-session Windows 11 desktops in the cloud to any device.',
    ],
    examWatchout:
      'Exam Trap: If a scenario requires hybrid connectivity that does NOT traverse the public internet, always select Azure ExpressRoute.',
    hotspots: [
      {
        id: 'm5-h1',
        label: 'Compute Spectrum (IaaS → Serverless)',
        badge: 'VMs • ACI/AKS • App Service • Functions',
        xPercent: 28,
        yPercent: 30,
        summary:
          'VMs give full OS control; ACI runs fast serverless containers; AKS orchestrates microservices; Functions runs event-driven code.',
        examRule: 'Choose Azure Functions when asked for pay-per-execution event-driven serverless code.',
        msLearnTopic: 'Azure Compute Options',
      },
      {
        id: 'm5-h2',
        label: 'VNet & Subnet Isolation',
        badge: 'Private IP Space',
        xPercent: 52,
        yPercent: 55,
        summary:
          'Azure Virtual Network (VNet) isolates cloud resources and connects to other VNets via VNet Peering over the Microsoft backbone.',
        examRule: 'VNet Peering is non-transitive by default; two VNets with overlapping CIDR blocks cannot be peered.',
        msLearnTopic: 'Virtual Networking',
      },
      {
        id: 'm5-h3',
        label: 'VPN Gateway vs. ExpressRoute',
        badge: 'Internet IPsec vs. Private Fiber',
        xPercent: 78,
        yPercent: 72,
        summary:
          'VPN Gateway uses encrypted tunnels over the public internet; ExpressRoute uses a private Connectivity Provider circuit.',
        examRule: 'ExpressRoute provides highest bandwidth, lowest latency, and bypasses the public internet.',
        msLearnTopic: 'Hybrid Connectivity',
      },
    ],
  },
  {
    moduleId: 6,
    pathId: 2,
    moduleTitle: 'Azure Storage Services',
    diagramTitle: 'Azure Storage Services, Access Tiers & Redundancy (LRS / ZRS / GRS / GZRS)',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Blob Tiers (Hot/Cool/Cold/Archive) & Replication Durability Matrix',
    msLearnUrl: 'https://learn.microsoft.com/en-us/training/modules/describe-azure-storage-services/',
    visualCaption:
      'An Azure Storage Account provides Blob Storage (unstructured objects), Azure Files (SMB/NFS shares), Queues (messaging), and Tables (NoSQL), protected by LRS (1 datacenter), ZRS (3 zones), or GRS/GZRS (paired regions).',
    keyTakeaways: [
      'Access Tiers: Hot (frequent, highest storage cost, lowest access cost) → Cool (30d min) → Cold (90d min) → Archive (180d min, offline, hours to rehydrate).',
      'LRS: 3 copies in 1 datacenter (11 nines durability). ZRS: 3 copies across 3 Availability Zones (12 nines).',
      'GRS / GZRS: 6 total copies across Primary and Paired Secondary Region (16 nines durability); RA-GRS adds read access to secondary.',
      'AzCopy is a high-performance CLI tool; Azure Data Box is a rugged physical appliance (up to 80 TB / 1 PB) for offline bulk migration.',
    ],
    examWatchout:
      'Exam Trap: Blobs in the Archive tier cannot be read directly—they must first be rehydrated to the Hot or Cool tier.',
    hotspots: [
      {
        id: 'm6-h1',
        label: '4 Storage Services',
        badge: 'Blobs • Files • Queues • Tables',
        xPercent: 25,
        yPercent: 28,
        summary:
          'Blobs store images/video/backups; Azure Files provides lift-and-shift SMB network shares; Queues decouple app components.',
        examRule: 'When migrating on-premises shared network drives (\\\\server\\share) without code changes, choose Azure Files.',
        msLearnTopic: 'Storage Account Services',
      },
      {
        id: 'm6-h2',
        label: 'Blob Access Tiers Lifecycle',
        badge: 'Hot → Cool → Cold → Archive',
        xPercent: 25,
        yPercent: 75,
        summary:
          'Storage cost decreases from Hot to Archive, while data retrieval cost and latency increase.',
        examRule: 'Archive tier is offline and requires rehydration (taking hours) before blobs can be read.',
        msLearnTopic: 'Blob Access Tiers',
      },
      {
        id: 'm6-h3',
        label: 'Redundancy Matrix (3 vs. 6 Copies)',
        badge: 'LRS • ZRS • GRS • GZRS',
        xPercent: 74,
        yPercent: 52,
        summary:
          'Primary region keeps 3 synchronous copies (LRS or ZRS); Geo-redundant options replicate 3 additional copies asynchronously to the paired region.',
        examRule: 'RA-GRS / RA-GZRS is required if your app needs immediate read-only access to the secondary region before Microsoft initiates a regional failover.',
        msLearnTopic: 'Storage Redundancy',
      },
    ],
  },
  {
    moduleId: 7,
    pathId: 2,
    moduleTitle: 'Azure Identity, Access, and Security',
    diagramTitle: 'Microsoft Entra ID, Conditional Access (If/Then) & Defense-in-Depth Layers',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Zero Trust Signals → Decision → Enforcement & 7 Concentric Security Layers',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-azure-identity-access-security/',
    visualCaption:
      'Microsoft Entra ID evaluates real-time Conditional Access signals (User, Location, Device, Risk) under a Zero Trust posture ("Never trust, always verify"), layered inside 7 concentric Defense-in-Depth security rings.',
    keyTakeaways: [
      'Authentication (AuthN) proves WHO you are (MFA, Passwordless, SSO); Authorization (AuthZ) defines WHAT you can access (Azure RBAC).',
      'Conditional Access evaluates Signals (Who, Where, Device) → makes a Decision (Allow, Require MFA, Block) → Enforces access.',
      'Zero Trust Principles: Verify explicitly, Use least-privilege access, and Assume breach.',
      'Defense-in-Depth 7 Layers (Outer to Inner): Physical Security → Identity & Access → Perimeter (DDoS) → Network (NSG/Firewall) → Compute → Application → Data.',
    ],
    examWatchout:
      'Exam Trap: Data is the innermost core of the Defense-in-Depth model, and Physical Security is the outermost layer.',
    hotspots: [
      {
        id: 'm7-h1',
        label: 'Conditional Access Engine',
        badge: 'Signals → Decision → Enforce',
        xPercent: 28,
        yPercent: 35,
        summary:
          'Evaluates sign-in context (IP location, device compliance, user risk) and dynamically enforces MFA or blocks access.',
        examRule: 'If a scenario says "Require MFA only when signing in from an untrusted location", choose Conditional Access.',
        msLearnTopic: 'Microsoft Entra Conditional Access',
      },
      {
        id: 'm7-h2',
        label: 'Zero Trust Model',
        badge: 'Verify Explicitly • Assume Breach',
        xPercent: 28,
        yPercent: 75,
        summary:
          'Replaces legacy "trusted corporate firewall" assumptions by verifying every request as if it originated from an open network.',
        examRule: 'Identity is the primary security perimeter in the cloud.',
        msLearnTopic: 'Zero Trust Security',
      },
      {
        id: 'm7-h3',
        label: '7 Defense-in-Depth Rings',
        badge: 'Physical → ... → Data Core',
        xPercent: 73,
        yPercent: 52,
        summary:
          'Layered security controls ensure that if one perimeter is breached, the next inner ring blocks the attacker from reaching Data.',
        examRule: 'Azure DDoS Protection operates at the Perimeter layer; NSGs operate at the Network layer.',
        msLearnTopic: 'Defense-in-Depth',
      },
    ],
  },
  {
    moduleId: 8,
    pathId: 3,
    moduleTitle: 'Cost Management in Azure',
    diagramTitle: 'Azure FinOps Cost Estimation & Budget Governance Lifecycle',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: TCO Calculator (Migration) vs. Pricing Calculator (New Workloads) vs. Cost Management',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-cost-management-azure/',
    visualCaption:
      'Before migration, use the TCO Calculator to prove on-premises savings and the Pricing Calculator to estimate monthly Azure SKU bills; after deployment, use Microsoft Cost Management for budgets, alerts, and cost tags.',
    keyTakeaways: [
      'TCO (Total Cost of Ownership) Calculator: Compares current on-premises datacenter costs vs. running in Azure over 1–5 years.',
      'Pricing Calculator: Estimates the monthly cost of specific Azure services, VM sizes, and regions before deployment.',
      'Microsoft Cost Management: Analyzes historical/current actual Azure spend, sets Budgets, and triggers email/Action Group alerts.',
      'Azure Hybrid Benefit lets you reuse existing on-premises Windows Server and SQL Server licenses (with Software Assurance) in Azure.',
    ],
    examWatchout:
      'Exam Trap: Never confuse TCO Calculator (on-premises migration ROI comparison) with Pricing Calculator (configuring Azure service SKUs).',
    hotspots: [
      {
        id: 'm8-h1',
        label: 'TCO Calculator',
        badge: 'On-Prem vs. Azure Savings',
        xPercent: 22,
        yPercent: 45,
        summary:
          'Inputs your current servers, storage, power, and IT labor to generate an executive migration savings report.',
        examRule: 'Keywords: "Compare on-premises datacenter costs", "Migration ROI", "3-year savings report".',
        msLearnTopic: 'Total Cost of Ownership (TCO)',
      },
      {
        id: 'm8-h2',
        label: 'Pricing Calculator',
        badge: 'Pre-Deployment SKU Estimate',
        xPercent: 50,
        yPercent: 45,
        summary:
          'Configures specific Azure services (e.g., 4x D4s_v5 VMs in East US + 2 TB Managed Disk) to estimate monthly bills.',
        examRule: 'Keywords: "Estimate monthly cost of new cloud resources before provisioning".',
        msLearnTopic: 'Azure Pricing Calculator',
      },
      {
        id: 'm8-h3',
        label: 'Cost Management + Tags',
        badge: 'Budgets & Cost Allocation',
        xPercent: 78,
        yPercent: 45,
        summary:
          'Monitors live subscription spend, enforces budget threshold alerts, and groups costs by Department/CostCenter tags.',
        examRule: 'Tags are key-value metadata pairs (e.g., Env:Prod) and do NOT automatically inherit from Resource Groups unless enforced via Azure Policy.',
        msLearnTopic: 'Microsoft Cost Management',
      },
    ],
  },
  {
    moduleId: 9,
    pathId: 3,
    moduleTitle: 'Azure Governance & Compliance Tools',
    diagramTitle: 'Azure Governance Guardrails: Policy, Initiatives, Resource Locks & Purview',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: How RBAC, Azure Policy, and Resource Locks interact on the Control Plane',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-features-tools-azure-for-governance-compliance/',
    visualCaption:
      'Azure governance combines RBAC (who can act), Azure Policy (what resource configurations are allowed), Resource Locks (preventing accidental deletion/modification), and Microsoft Purview (data estate compliance).',
    keyTakeaways: [
      'Azure Policy enforces resource rules (e.g., "Allowed Locations: West Europe only" or "Require CostCenter tag").',
      'An Azure Policy Initiative is a grouped collection of related policy definitions toward a single compliance goal (e.g., ISO 27001).',
      'Resource Locks (`CanNotDelete` and `ReadOnly`) override RBAC permissions—even an Owner must remove the lock before deleting a locked resource.',
      'Service Trust Portal provides third-party audit reports (SOC, ISO, FedRAMP); Microsoft Purview governs data sensitivity and lineage.',
    ],
    examWatchout:
      'Exam Trap: Even a user with the Owner RBAC role cannot delete a resource protected by a CanNotDelete or ReadOnly lock without first removing the lock!',
    hotspots: [
      {
        id: 'm9-h1',
        label: 'Azure Policy & Initiatives',
        badge: 'Resource Rule Enforcement',
        xPercent: 25,
        yPercent: 38,
        summary:
          'Evaluates resource properties at creation/update time against JSON rules (Deny, Audit, Append, Modify).',
        examRule: 'Azure Policy restricts WHAT resources can be created; RBAC restricts WHO can perform actions.',
        msLearnTopic: 'Azure Policy',
      },
      {
        id: 'm9-h2',
        label: 'Resource Locks (CanNotDelete / ReadOnly)',
        badge: 'Deletion Safeguard',
        xPercent: 52,
        yPercent: 68,
        summary:
          'CanNotDelete allows reading and modifying a resource but blocks deletion; ReadOnly blocks both modifications and deletion.',
        examRule: 'Locks are inherited from Subscriptions and Resource Groups down to child resources.',
        msLearnTopic: 'Resource Locks',
      },
      {
        id: 'm9-h3',
        label: 'Microsoft Purview & Service Trust Portal',
        badge: 'Data Governance & Audit Reports',
        xPercent: 78,
        yPercent: 38,
        summary:
          'Purview discovers and classifies sensitive data across hybrid estates; Service Trust Portal hosts official Microsoft compliance certifications.',
        examRule: 'Choose Service Trust Portal when auditors ask for Microsoft’s ISO/SOC compliance documentation.',
        msLearnTopic: 'Compliance & Purview',
      },
    ],
  },
  {
    moduleId: 10,
    pathId: 3,
    moduleTitle: 'Resource Management & Deployment Tools',
    diagramTitle: 'Azure Resource Manager (ARM) Control Plane, IaC (Bicep/ARM) & Azure Arc',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Unified ARM API layer for Portal, CLI, PowerShell, Cloud Shell & Hybrid Arc',
    msLearnUrl:
      'https://learn.microsoft.com/en-us/training/modules/describe-features-tools-manage-deploy-azure-resources/',
    visualCaption:
      'Every request from the Azure Portal, Azure CLI, Azure PowerShell, or REST APIs passes through Azure Resource Manager (ARM) for unified authentication, RBAC, and Policy checks, while Azure Arc extends ARM to on-premises and multi-cloud servers.',
    keyTakeaways: [
      'Azure Resource Manager (ARM) is the single orchestration and management layer for all Azure resource requests.',
      'ARM Templates (JSON) and Azure Bicep (clean domain-specific language) enable declarative, idempotent Infrastructure as Code (IaC).',
      'Azure Cloud Shell provides a browser-accessible Bash and PowerShell terminal with pre-authenticated Azure CLI/PowerShell.',
      'Azure Arc projects non-Azure resources (on-premises Windows/Linux servers, Kubernetes clusters, AWS/GCP VMs) into Azure Resource Manager.',
    ],
    examWatchout:
      'Exam Trap: Azure Arc does NOT migrate physical servers into Azure datacenters—it extends Azure management (Policy, Tags, Defender, Monitor) to where those servers already live.',
    hotspots: [
      {
        id: 'm10-h1',
        label: 'Client Tools & Cloud Shell',
        badge: 'Portal • CLI • PowerShell • SDK',
        xPercent: 24,
        yPercent: 34,
        summary:
          'All management interfaces send standardized HTTPS requests to the central ARM endpoint.',
        examRule: 'Every tool is equally capable because they all invoke the same underlying ARM API.',
        msLearnTopic: 'Management Interfaces',
      },
      {
        id: 'm10-h2',
        label: 'Azure Resource Manager (ARM) & Bicep',
        badge: 'Declarative IaC Engine',
        xPercent: 52,
        yPercent: 50,
        summary:
          'Validates authentication, RBAC, Policy, and Resource Locks before provisioning resources declaratively via Bicep or ARM JSON.',
        examRule: 'Bicep compiles into standard ARM JSON templates with cleaner, human-readable syntax.',
        msLearnTopic: 'ARM & Bicep IaC',
      },
      {
        id: 'm10-h3',
        label: 'Azure Arc (Hybrid & Multi-Cloud)',
        badge: 'Extend ARM Everywhere',
        xPercent: 80,
        yPercent: 68,
        summary:
          'Allows on-premises and AWS/GCP servers to appear as native resources inside the Azure Portal with tags and policies.',
        examRule: 'Select Azure Arc whenever a scenario asks to govern on-premises/multi-cloud servers using Azure Policy.',
        msLearnTopic: 'Azure Arc',
      },
    ],
  },
  {
    moduleId: 11,
    pathId: 3,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    diagramTitle: 'Observability Trio: Azure Advisor vs. Azure Service Health vs. Azure Monitor',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Proactive Recommendations, Platform Outage Tracking & Full-Stack Telemetry',
    msLearnUrl: 'https://learn.microsoft.com/en-us/training/modules/describe-monitoring-tools-azure/',
    visualCaption:
      'Distinguish the three monitoring pillars: Azure Advisor (personalized best-practice recommendations), Azure Service Health (Microsoft platform outages & maintenance), and Azure Monitor (metrics, logs, Log Analytics & Application Insights).',
    keyTakeaways: [
      'Azure Advisor analyzes your deployed resources across 5 pillars: Reliability, Security, Performance, Cost, and Operational Excellence.',
      'Azure Service Health combines Azure Status (global), Service Health (your regions/services), and Resource Health (your specific VM/DB).',
      'Azure Monitor collects Metrics (real-time numerical time-series) and Logs (queried via KQL in Log Analytics).',
      'Application Insights (a feature of Azure Monitor) provides APM request tracing, exception tracking, and latency diagnostics for web apps.',
    ],
    examWatchout:
      'Exam Trap: If Microsoft has a regional datacenter outage affecting your subscription, check Azure Service Health—not Azure Advisor.',
    hotspots: [
      {
        id: 'm11-h1',
        label: 'Azure Advisor (5 Pillars)',
        badge: 'Cost • Security • Reliability • Perf • Ops',
        xPercent: 22,
        yPercent: 45,
        summary:
          'Proactively identifies idle VMs to right-size, missing availability zones, and unencrypted storage.',
        examRule: 'Free, personalized cloud consultant built into the Azure Portal.',
        msLearnTopic: 'Azure Advisor',
      },
      {
        id: 'm11-h2',
        label: 'Azure Service Health (3 Views)',
        badge: 'Global Status → Region → Resource',
        xPercent: 50,
        yPercent: 45,
        summary:
          'Tracks Microsoft-side service incidents, planned maintenance windows, and official Root Cause Analyses (RCAs).',
        examRule: 'Configure Service Health Alerts to notify your team via SMS/Email when an Azure region outage occurs.',
        msLearnTopic: 'Azure Service Health',
      },
      {
        id: 'm11-h3',
        label: 'Azure Monitor + App Insights',
        badge: 'Metrics • Log Analytics (KQL) • APM',
        xPercent: 78,
        yPercent: 45,
        summary:
          'Ingests telemetry from Azure resources, OS agents, and applications to trigger auto-scaling or Action Group alerts.',
        examRule: 'Log Analytics uses Kusto Query Language (KQL); Application Insights monitors live web application code performance.',
        msLearnTopic: 'Azure Monitor',
      },
    ],
  },
  {
    moduleId: 12,
    pathId: 3,
    moduleTitle: 'AZ-900 Full Enterprise Architecture Synthesis',
    diagramTitle: 'End-to-End Microsoft Certified: Azure Fundamentals Reference Architecture',
    diagramSubtitle:
      'Adapted from Microsoft Learn AZ-900: Complete Cloud Concepts, Core Services & Governance Synthesis Blueprint',
    msLearnUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
    visualCaption:
      'This master synthesis diagram connects all 12 AZ-900 modules into a single production Azure architecture—showing how Traffic/Identity, Compute/Networking, Data/Storage, and Governance/Monitoring work together.',
    keyTakeaways: [
      'Identity & Edge: Users authenticate via Microsoft Entra ID + MFA + Conditional Access before traffic enters the VNet.',
      'Compute & Data: App Service / AKS / VMSS process workloads across 3 Availability Zones and persist state in GZRS Storage / Azure SQL / Cosmos DB.',
      'Governance & Security: Azure Policy, Resource Locks, Key Vault, and Defender for Cloud protect the subscription control plane.',
      'Observability & FinOps: Azure Monitor, Service Health, Advisor, and Cost Management Budgets maintain continuous operational excellence.',
    ],
    examWatchout:
      'Exam Synthesis Rule: On multi-service scenario questions, eliminate options that violate the Shared Responsibility boundary or confuse RBAC (who) with Azure Policy (what) and Resource Locks (deletion protection).',
    hotspots: [
      {
        id: 'm12-h1',
        label: 'Identity & Zero Trust Edge',
        badge: 'Entra ID + Conditional Access + DDoS',
        xPercent: 22,
        yPercent: 32,
        summary:
          'Verifies identity and device health before routing traffic into the protected Azure Virtual Network.',
        examRule: 'Combines Path 1 Shared Responsibility with Path 2 Entra ID & Defense-in-Depth.',
        msLearnTopic: 'Identity & Perimeter Security',
      },
      {
        id: 'm12-h2',
        label: 'Zone-Redundant Compute & Storage',
        badge: '3 AZs • 99.99% SLA • GZRS',
        xPercent: 52,
        yPercent: 52,
        summary:
          'Compute scales horizontally across 3 Availability Zones while storage replicates synchronously across zones and asynchronously to the paired region.',
        examRule: 'Combines Path 1 High Availability/Elasticity with Path 2 Compute & Storage Redundancy.',
        msLearnTopic: 'Resilient Cloud Architecture',
      },
      {
        id: 'm12-h3',
        label: 'Unified Governance & Observability',
        badge: 'ARM • Policy • Locks • Monitor • FinOps',
        xPercent: 80,
        yPercent: 72,
        summary:
          'ARM enforces Policy and Locks at deployment, while Azure Monitor, Advisor, and Cost Management govern runtime health and spend.',
        examRule: 'Combines all Path 3 Management, Governance, Deployment, and Monitoring tools.',
        msLearnTopic: 'Governance & Operations',
      },
    ],
  },
];

export const AzureImageTutorView: React.FC<AzureImageTutorViewProps> = ({
  stats,
  onPracticeModule,
  onOpenStudyDecksModule,
}) => {
  const [selectedPathFilter, setSelectedPathFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>('m1-h1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showAdaptModal, setShowAdaptModal] = useState<boolean>(false);

  // Custom Adapted Diagrams state persisted in localStorage
  const [customDiagrams, setCustomDiagrams] = useState<CustomAdaptedDiagram[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_IMAGES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [newDiagramTitle, setNewDiagramTitle] = useState<string>('');
  const [newDiagramUrl, setNewDiagramUrl] = useState<string>('');
  const [newDiagramNotes, setNewDiagramNotes] = useState<string>('');

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MODULE_VISUAL_LESSONS.filter((m) => {
      if (selectedPathFilter !== 'all' && m.pathId !== selectedPathFilter) return false;
      if (q) {
        const matches =
          m.moduleTitle.toLowerCase().includes(q) ||
          m.diagramTitle.toLowerCase().includes(q) ||
          m.visualCaption.toLowerCase().includes(q) ||
          m.keyTakeaways.some((k) => k.toLowerCase().includes(q)) ||
          m.hotspots.some(
            (h) =>
              h.label.toLowerCase().includes(q) ||
              h.summary.toLowerCase().includes(q) ||
              h.badge.toLowerCase().includes(q)
          );
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedPathFilter, searchQuery]);

  const activeLesson = useMemo(() => {
    return (
      MODULE_VISUAL_LESSONS.find((m) => m.moduleId === selectedModuleId) ||
      filteredModules[0] ||
      MODULE_VISUAL_LESSONS[0]
    );
  }, [selectedModuleId, filteredModules]);

  const activeStudyModule = useMemo(() => {
    return CURRICULUM_STUDY_MODULES.find((m) => m.moduleId === activeLesson.moduleId);
  }, [activeLesson.moduleId]);

  const activeHotspot = useMemo(() => {
    return (
      activeLesson.hotspots.find((h) => h.id === selectedHotspotId) || activeLesson.hotspots[0]
    );
  }, [activeLesson, selectedHotspotId]);

  const handleSelectModule = (modId: number) => {
    setSelectedModuleId(modId);
    const target = MODULE_VISUAL_LESSONS.find((m) => m.moduleId === modId);
    if (target && target.hotspots.length > 0) {
      setSelectedHotspotId(target.hotspots[0].id);
    }
    setZoomScale(1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewDiagramUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomDiagram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagramTitle.trim() || !newDiagramUrl.trim()) return;
    const item: CustomAdaptedDiagram = {
      id: `custom-diag-${Date.now()}`,
      moduleId: activeLesson.moduleId,
      title: newDiagramTitle.trim(),
      imageUrl: newDiagramUrl.trim(),
      notes:
        newDiagramNotes.trim() ||
        `Custom adapted Microsoft Learn visual study reference for Module ${activeLesson.moduleId}.`,
      createdAt: Date.now(),
    };
    const updated = [item, ...customDiagrams];
    setCustomDiagrams(updated);
    try {
      localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    setNewDiagramTitle('');
    setNewDiagramUrl('');
    setNewDiagramNotes('');
    setShowAdaptModal(false);
  };

  const handleDeleteCustomDiagram = (id: string) => {
    const updated = customDiagrams.filter((d) => d.id !== id);
    setCustomDiagrams(updated);
    try {
      localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Render module-specific interactive SVG architectural diagram modeled after Microsoft Learn AZ-900 visuals
  const renderModuleArchitecturalSvg = (moduleId: number) => {
    switch (moduleId) {
      case 1:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <defs>
              <linearGradient id="azBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0078D4" />
                <stop offset="100%" stopColor="#005A9E" />
              </linearGradient>
              <linearGradient id="custAmber" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              MICROSOFT SHARED RESPONSIBILITY MATRIX (ON-PREMISES vs. IaaS vs. PaaS vs. SaaS)
            </text>
            {/* Column Headers */}
            {['Responsibility Layer', 'On-Premises', 'IaaS (VMs)', 'PaaS (App/DB)', 'SaaS (M365)'].map(
              (col, idx) => (
                <g key={col}>
                  <rect
                    x={idx === 0 ? 24 : 210 + (idx - 1) * 130}
                    y={44}
                    width={idx === 0 ? 176 : 120}
                    height={26}
                    rx="6"
                    fill="#1E293B"
                    stroke="#334155"
                  />
                  <text
                    x={idx === 0 ? 112 : 270 + (idx - 1) * 130}
                    y={61}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="11"
                    fontWeight="800"
                  >
                    {col}
                  </text>
                </g>
              )
            )}
            {/* 7 Rows */}
            {[
              { name: 'Information & Data', states: ['C', 'C', 'C', 'C'] },
              { name: 'Devices (Mobile & PCs)', states: ['C', 'C', 'C', 'C'] },
              { name: 'Accounts & Identities', states: ['C', 'C', 'C', 'C'] },
              { name: 'Applications & Runtime', states: ['C', 'C', 'S', 'M'] },
              { name: 'Network Controls', states: ['C', 'C', 'S', 'M'] },
              { name: 'Operating System (OS)', states: ['C', 'C', 'M', 'M'] },
              { name: 'Physical Hosts / Network / DC', states: ['C', 'M', 'M', 'M'] },
            ].map((row, rIdx) => {
              const y = 78 + rIdx * 32;
              return (
                <g key={row.name}>
                  <rect
                    x="24"
                    y={y}
                    width="176"
                    height="26"
                    rx="5"
                    fill="#1E293B"
                    stroke="#334155"
                  />
                  <text x="34" y={y + 17} fill="#E2E8F0" fontSize="10.5" fontWeight="700">
                    {row.name}
                  </text>
                  {row.states.map((st, cIdx) => {
                    const x = 210 + cIdx * 130;
                    const fill =
                      st === 'C'
                        ? 'url(#custAmber)'
                        : st === 'M'
                        ? 'url(#azBlue)'
                        : '#0D9488';
                    const label =
                      st === 'C' ? 'Customer' : st === 'M' ? 'Microsoft' : 'Shared (50/50)';
                    return (
                      <g key={cIdx}>
                        <rect x={x} y={y} width="120" height="26" rx="5" fill={fill} />
                        <text
                          x={x + 60}
                          y={y + 17}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="800"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        );

      case 2:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              CLOUD SCALABILITY &amp; ELASTICITY ARCHITECTURE (VERTICAL vs. HORIZONTAL)
            </text>
            {/* Left Box: Vertical Scaling */}
            <rect
              x="24"
              y="48"
              width="340"
              height="245"
              rx="12"
              fill="#1E293B"
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text x="42" y="74" fill="#F8FAFC" fontSize="12" fontWeight="800">
              1. Vertical Scaling (Scale Up / Scale Down)
            </text>
            <text x="42" y="92" fill="#94A3B8" fontSize="10">
              Adds CPU / RAM capacity to a single Virtual Machine
            </text>
            <rect x="65" y="135" width="85" height="90" rx="10" fill="#334155" stroke="#64748B" />
            <text x="107" y="175" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="800">
              Standard VM
            </text>
            <text x="107" y="195" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="700">
              2 vCPU • 8 GB
            </text>
            <path d="M 165 180 L 210 180" stroke="#F59E0B" strokeWidth="3" />
            <polygon points="210,174 222,180 210,186" fill="#F59E0B" />
            <rect
              x="230"
              y="110"
              width="110"
              height="140"
              rx="12"
              fill="#0078D4"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <text x="285" y="172" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800">
              Scaled-Up VM
            </text>
            <text x="285" y="192" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="800">
              16 vCPU • 64 GB
            </text>

            {/* Right Box: Horizontal Scaling & Elasticity */}
            <rect
              x="396"
              y="48"
              width="340"
              height="245"
              rx="12"
              fill="#1E293B"
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text x="414" y="74" fill="#F8FAFC" fontSize="12" fontWeight="800">
              2. Horizontal Scaling (Scale Out / Scale In + Elasticity)
            </text>
            <text x="414" y="92" fill="#94A3B8" fontSize="10">
              Auto-Scale rules add/remove VM instances behind a Load Balancer
            </text>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect
                  x={418 + i * 76}
                  y="122"
                  width="66"
                  height="88"
                  rx="8"
                  fill={i < 2 ? '#059669' : '#0284C7'}
                  stroke="#A7F3D0"
                />
                <text
                  x={451 + i * 76}
                  y="162"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10.5"
                  fontWeight="800"
                >
                  Node #{i + 1}
                </text>
                <text
                  x={451 + i * 76}
                  y="180"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9"
                  fontWeight="700"
                >
                  {i < 2 ? 'Base Active' : 'Auto-Scaled'}
                </text>
              </g>
            ))}
            <rect x="418" y="232" width="294" height="40" rx="8" fill="#0F172A" stroke="#10B981" />
            <text x="565" y="256" textAnchor="middle" fill="#34D399" fontSize="11" fontWeight="800">
              Elasticity Engine: CPU &gt; 75% → Scale Out (+Nodes) | CPU &lt; 25% → Scale In
            </text>
          </svg>
        );

      case 3:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              CLOUD ECONOMICS: CAPEX (UPFRONT) vs. OPEX (CONSUMPTION PAY-AS-YOU-GO)
            </text>
            <rect x="24" y="48" width="340" height="245" rx="12" fill="#1E293B" stroke="#F59E0B" />
            <text x="44" y="76" fill="#FBBF24" fontSize="13" fontWeight="800">
              Capital Expenditure (CapEx • On-Premises)
            </text>
            <rect x="48" y="96" width="290" height="52" rx="8" fill="#78350F" />
            <text x="193" y="120" textAnchor="middle" fill="#FEF3C7" fontSize="11" fontWeight="800">
              100% Upfront Server &amp; Datacenter Purchase
            </text>
            <text x="193" y="137" textAnchor="middle" fill="#FDE68A" fontSize="9.5">
              High initial barrier • Fixed capacity (Idle waste or shortage)
            </text>
            <rect x="48" y="164" width="290" height="106" rx="8" fill="#0F172A" stroke="#475569" />
            <text x="64" y="190" fill="#E2E8F0" fontSize="10.5" fontWeight="700">
              • Physical Servers, SAN Storage, HVAC Cooling
            </text>
            <text x="64" y="214" fill="#E2E8F0" fontSize="10.5" fontWeight="700">
              • Accounting value depreciated over 3–5 years
            </text>
            <text x="64" y="238" fill="#FBBF24" fontSize="10.5" fontWeight="800">
              • Risk: Over-provisioning wastes capital
            </text>

            <rect x="396" y="48" width="340" height="245" rx="12" fill="#1E293B" stroke="#38BDF8" />
            <text x="416" y="76" fill="#38BDF8" fontSize="13" fontWeight="800">
              Operational Expenditure (OpEx • Azure Cloud)
            </text>
            <rect x="420" y="96" width="290" height="52" rx="8" fill="#0369A1" />
            <text x="565" y="120" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
              $0 Upfront • Pay Only For Seconds/GB Used
            </text>
            <text x="565" y="137" textAnchor="middle" fill="#BAE6FD" fontSize="9.5">
              Billed monthly/annually • Deallocate VM to stop compute billing
            </text>
            <rect x="420" y="164" width="290" height="106" rx="8" fill="#0F172A" stroke="#0284C7" />
            <text x="436" y="190" fill="#34D399" fontSize="10.5" fontWeight="800">
              • Inbound Data Transfer (Ingress): ALWAYS FREE
            </text>
            <text x="436" y="214" fill="#FBBF24" fontSize="10.5" fontWeight="800">
              • Outbound Data (Egress): Metered per GB
            </text>
            <text x="436" y="238" fill="#38BDF8" fontSize="10.5" fontWeight="700">
              • Reserved Instances (1yr/3yr): Up to 72% discount
            </text>
          </svg>
        );

      case 4:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE GLOBAL INFRASTRUCTURE (REGIONS, 3 AZs &amp; PAIRS) + 4-TIER SCOPE HIERARCHY
            </text>
            {/* Left: Region + 3 AZs + Paired Region */}
            <rect x="24" y="46" width="380" height="175" rx="12" fill="#1E293B" stroke="#0284C7" />
            <text x="40" y="68" fill="#F8FAFC" fontSize="11.5" fontWeight="800">
              Primary Azure Region (e.g., East US) — 99.99% Zone SLA
            </text>
            {[1, 2, 3].map((az) => (
              <g key={az}>
                <rect
                  x={40 + (az - 1) * 118}
                  y="82"
                  width="108"
                  height="122"
                  rx="8"
                  fill="#0F172A"
                  stroke="#38BDF8"
                />
                <text
                  x={94 + (az - 1) * 118}
                  y="105"
                  textAnchor="middle"
                  fill="#38BDF8"
                  fontSize="11"
                  fontWeight="800"
                >
                  Zone {az}
                </text>
                <text
                  x={94 + (az - 1) * 118}
                  y="128"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9.5"
                >
                  Independent
                </text>
                <text
                  x={94 + (az - 1) * 118}
                  y="144"
                  textAnchor="middle"
                  fill="#34D399"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  Power • Cooling
                </text>
                <text
                  x={94 + (az - 1) * 118}
                  y="160"
                  textAnchor="middle"
                  fill="#34D399"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  Networking
                </text>
              </g>
            ))}
            <rect x="24" y="234" width="380" height="62" rx="10" fill="#1E293B" stroke="#F59E0B" />
            <text x="214" y="258" textAnchor="middle" fill="#FBBF24" fontSize="11" fontWeight="800">
              ⇄ Paired Region (e.g., West US • 300+ Miles Apart in Same Geography)
            </text>
            <text x="214" y="278" textAnchor="middle" fill="#CBD5E1" fontSize="9.5">
              Sequential updates • Asynchronous GRS Storage &amp; Cross-Region Disaster Recovery
            </text>

            {/* Right: 4-Tier Management Hierarchy */}
            <rect x="424" y="46" width="312" height="250" rx="12" fill="#1E293B" stroke="#10B981" />
            <text x="442" y="68" fill="#F8FAFC" fontSize="11.5" fontWeight="800">
              Azure 4-Tier Governance Scope Hierarchy
            </text>
            {[
              { tier: '1. Management Groups', sub: 'Enterprise policy & RBAC across subscriptions', color: '#7C3AED' },
              { tier: '2. Subscriptions', sub: 'Billing & payment boundary', color: '#0284C7' },
              { tier: '3. Resource Groups', sub: 'Logical lifecycle container (No nesting)', color: '#059669' },
              { tier: '4. Azure Resources', sub: 'VMs, Storage, VNets, SQL Databases', color: '#D97706' },
            ].map((item, idx) => (
              <g key={item.tier}>
                <rect
                  x={444 + idx * 8}
                  y={82 + idx * 52}
                  width={272 - idx * 16}
                  height="40"
                  rx="8"
                  fill={item.color}
                />
                <text
                  x="580"
                  y={100 + idx * 52}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10.5"
                  fontWeight="800"
                >
                  {item.tier}
                </text>
                <text
                  x="580"
                  y={114 + idx * 52}
                  textAnchor="middle"
                  fill="#F1F5F9"
                  fontSize="9"
                >
                  {item.sub}
                </text>
              </g>
            ))}
          </svg>
        );

      case 5:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE COMPUTE SPECTRUM &amp; HYBRID VIRTUAL NETWORK CONNECTIVITY
            </text>
            {/* Top Compute Row */}
            {[
              { title: 'Azure VMs & VMSS', type: 'IaaS Compute', desc: 'Full OS control & scale to 1,000 VMs', color: '#0284C7' },
              { title: 'ACI & AKS', type: 'Containers', desc: 'Serverless pods vs. K8s orchestration', color: '#4F46E5' },
              { title: 'Azure App Service', type: 'Managed PaaS', desc: 'Web Apps, APIs & Mobile backends', color: '#059669' },
              { title: 'Azure Functions', type: 'Serverless Code', desc: 'Event-driven pay-per-execution', color: '#D97706' },
            ].map((c, idx) => (
              <g key={c.title}>
                <rect
                  x={24 + idx * 182}
                  y="46"
                  width="170"
                  height="95"
                  rx="10"
                  fill="#1E293B"
                  stroke={c.color}
                  strokeWidth="2"
                />
                <text x={38 + idx * 182} y="68" fill="#38BDF8" fontSize="9.5" fontWeight="800">
                  {c.type}
                </text>
                <text x={38 + idx * 182} y="88" fill="#FFFFFF" fontSize="11.5" fontWeight="800">
                  {c.title}
                </text>
                <text x={38 + idx * 182} y="110" fill="#CBD5E1" fontSize="9.5">
                  {c.desc}
                </text>
              </g>
            ))}
            {/* Bottom Hybrid Networking */}
            <rect x="24" y="160" width="712" height="136" rx="12" fill="#1E293B" stroke="#38BDF8" />
            <text x="42" y="185" fill="#F8FAFC" fontSize="12" fontWeight="800">
              Azure Virtual Network (VNet) &amp; Hybrid On-Premises Connectivity
            </text>
            <rect x="44" y="200" width="180" height="78" rx="8" fill="#0F172A" stroke="#64748B" />
            <text x="134" y="232" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="800">
              On-Premises Datacenter
            </text>
            <text x="134" y="252" textAnchor="middle" fill="#94A3B8" fontSize="9.5">
              Corporate LAN
            </text>

            {/* Two Paths: VPN vs ExpressRoute */}
            <rect x="255" y="198" width="235" height="36" rx="6" fill="#0369A1" />
            <text x="372" y="220" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
              VPN Gateway: Encrypted IPsec over Internet
            </text>
            <rect x="255" y="242" width="235" height="36" rx="6" fill="#059669" />
            <text x="372" y="264" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">
              ExpressRoute: Dedicated Private Fiber Circuit
            </text>

            <rect x="520" y="200" width="196" height="78" rx="8" fill="#0F172A" stroke="#38BDF8" />
            <text x="618" y="230" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800">
              Azure VNet + Subnets
            </text>
            <text x="618" y="250" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              VNet Peering • NSG • Private Link
            </text>
          </svg>
        );

      case 6:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE STORAGE ACCOUNT: ACCESS TIERS (HOT → ARCHIVE) &amp; REDUNDANCY MATRIX
            </text>
            {/* Left: Blob Access Tiers */}
            <rect x="24" y="46" width="350" height="250" rx="12" fill="#1E293B" stroke="#0284C7" />
            <text x="42" y="70" fill="#F8FAFC" fontSize="12" fontWeight="800">
              Blob Storage Lifecycle Access Tiers
            </text>
            {[
              { tier: 'Hot Tier (Online)', desc: 'Frequent access • Highest storage cost, lowest access cost', col: '#EF4444' },
              { tier: 'Cool Tier (Online • 30d min)', desc: 'Infrequent access • Lower storage cost than Hot', col: '#F59E0B' },
              { tier: 'Cold Tier (Online • 90d min)', desc: 'Rarely accessed data • Lower storage cost than Cool', col: '#0284C7' },
              { tier: 'Archive Tier (Offline • 180d min)', desc: 'Lowest storage cost • Requires hours to rehydrate!', col: '#6366F1' },
            ].map((t, i) => (
              <g key={t.tier}>
                <rect x="42" y={84 + i * 50} width="314" height="42" rx="8" fill="#0F172A" stroke={t.col} />
                <text x="56" y={102 + i * 50} fill="#FFFFFF" fontSize="10.5" fontWeight="800">
                  {t.tier}
                </text>
                <text x="56" y={118 + i * 50} fill="#CBD5E1" fontSize="9.5">
                  {t.desc}
                </text>
              </g>
            ))}

            {/* Right: Redundancy Options */}
            <rect x="392" y="46" width="344" height="250" rx="12" fill="#1E293B" stroke="#10B981" />
            <text x="410" y="70" fill="#F8FAFC" fontSize="12" fontWeight="800">
              Storage Redundancy &amp; Durability SLAs
            </text>
            {[
              { code: 'LRS (Locally Redundant)', copies: '3 Copies • 1 Datacenter', sla: '11 Nines (99.999999999%)' },
              { code: 'ZRS (Zone-Redundant)', copies: '3 Copies • 3 Availability Zones', sla: '12 Nines Durability' },
              { code: 'GRS / RA-GRS (Geo-Redundant)', copies: '6 Copies • Primary + Paired Region', sla: '16 Nines Durability' },
              { code: 'GZRS / RA-GZRS (Geo-Zone)', copies: '3 Zones Primary + 3 Copies Paired', sla: '16 Nines + Zone Resilience' },
            ].map((r, i) => (
              <g key={r.code}>
                <rect x="410" y={84 + i * 50} width="308" height="42" rx="8" fill="#0F172A" stroke="#10B981" />
                <text x="424" y={102 + i * 50} fill="#34D399" fontSize="10.5" fontWeight="800">
                  {r.code}
                </text>
                <text x="424" y={118 + i * 50} fill="#E2E8F0" fontSize="9.5">
                  {r.copies} — {r.sla}
                </text>
              </g>
            ))}
          </svg>
        );

      case 7:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              MICROSOFT ENTRA ID CONDITIONAL ACCESS &amp; 7 DEFENSE-IN-DEPTH LAYERS
            </text>
            {/* Left: Conditional Access Pipeline */}
            <rect x="24" y="46" width="350" height="250" rx="12" fill="#1E293B" stroke="#0284C7" />
            <text x="42" y="70" fill="#F8FAFC" fontSize="12" fontWeight="800">
              Zero Trust Conditional Access Pipeline
            </text>
            <rect x="42" y="88" width="95" height="110" rx="8" fill="#0F172A" stroke="#38BDF8" />
            <text x="89" y="114" textAnchor="middle" fill="#38BDF8" fontSize="10.5" fontWeight="800">
              1. Signals
            </text>
            <text x="89" y="135" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              • User / Role
            </text>
            <text x="89" y="152" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              • IP Location
            </text>
            <text x="89" y="169" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              • Device Health
            </text>

            <rect x="152" y="88" width="95" height="110" rx="8" fill="#0369A1" stroke="#38BDF8" />
            <text x="199" y="114" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="800">
              2. Decision
            </text>
            <text x="199" y="140" textAnchor="middle" fill="#FDE047" fontSize="9.5" fontWeight="700">
              Allow Access
            </text>
            <text x="199" y="158" textAnchor="middle" fill="#FDE047" fontSize="9.5" fontWeight="700">
              Require MFA
            </text>
            <text x="199" y="176" textAnchor="middle" fill="#FCA5A5" fontSize="9.5" fontWeight="700">
              Block Sign-In
            </text>

            <rect x="262" y="88" width="95" height="110" rx="8" fill="#059669" />
            <text x="309" y="114" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="800">
              3. Access
            </text>
            <text x="309" y="142" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              Azure RBAC
            </text>
            <text x="309" y="160" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
              Least Privilege
            </text>

            <rect x="42" y="214" width="315" height="64" rx="8" fill="#0F172A" stroke="#F59E0B" />
            <text x="199" y="238" textAnchor="middle" fill="#FBBF24" fontSize="10.5" fontWeight="800">
              AuthN (Who You Are: Entra ID / MFA / SSO)
            </text>
            <text x="199" y="258" textAnchor="middle" fill="#34D399" fontSize="10.5" fontWeight="800">
              ≠ AuthZ (What You Can Do: Azure RBAC Roles)
            </text>

            {/* Right: 7 Defense-in-Depth Layers */}
            <rect x="392" y="46" width="344" height="250" rx="12" fill="#1E293B" stroke="#F59E0B" />
            <text x="410" y="70" fill="#F8FAFC" fontSize="12" fontWeight="800">
              7 Defense-in-Depth Security Layers
            </text>
            {[
              '1. Physical Security (Biometrics, Datacenter Locks)',
              '2. Identity & Access (Entra ID, MFA, Conditional Access)',
              '3. Perimeter (Azure DDoS Protection, Edge Firewalls)',
              '4. Network (NSGs, Azure Firewall, VNet Segmentation)',
              '5. Compute (VM Hardening, Just-In-Time RDP/SSH)',
              '6. Application (WAF, Key Vault Secrets, HTTPS TLS)',
              '7. Data Core (Encryption at Rest & In Transit)',
            ].map((layer, idx) => (
              <g key={layer}>
                <rect
                  x={410 + idx * 6}
                  y={80 + idx * 29}
                  width={308 - idx * 12}
                  height="24"
                  rx="5"
                  fill={idx === 6 ? '#059669' : idx === 0 ? '#334155' : '#0F172A'}
                  stroke={idx === 6 ? '#34D399' : '#38BDF8'}
                />
                <text
                  x="564"
                  y={96 + idx * 29}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {layer}
                </text>
              </g>
            ))}
          </svg>
        );

      case 8:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE FINOPS: TCO CALCULATOR vs. PRICING CALCULATOR vs. COST MANAGEMENT
            </text>
            {[
              {
                step: '1. Pre-Migration ROI',
                title: 'TCO Calculator',
                color: '#F59E0B',
                bullets: [
                  'Compares On-Premises vs. Azure',
                  'Inputs servers, power, IT labor',
                  'Generates 1–5 yr savings report',
                  'Used for executive migration case',
                ],
              },
              {
                step: '2. Pre-Deployment Estimate',
                title: 'Pricing Calculator',
                color: '#0284C7',
                bullets: [
                  'Estimates monthly Azure SKU cost',
                  'Select Region, VM Tier, Storage',
                  'Models 1yr/3yr Reservations',
                  'Models Azure Hybrid Benefit',
                ],
              },
              {
                step: '3. Post-Deployment Governance',
                title: 'Cost Management',
                color: '#10B981',
                bullets: [
                  'Tracks actual live Azure spend',
                  'Sets Budgets & Automated Alerts',
                  'Breaks down cost by Resource Tags',
                  'Exports billing telemetry',
                ],
              },
            ].map((card, i) => (
              <g key={card.title}>
                <rect
                  x={24 + i * 242}
                  y="50"
                  width="228"
                  height="242"
                  rx="12"
                  fill="#1E293B"
                  stroke={card.color}
                  strokeWidth="2"
                />
                <rect x={40 + i * 242} y="68" width="196" height="26" rx="6" fill={card.color} />
                <text
                  x={138 + i * 242}
                  y="85"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="10.5"
                  fontWeight="900"
                >
                  {card.step}
                </text>
                <text
                  x={138 + i * 242}
                  y="118"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="14"
                  fontWeight="800"
                >
                  {card.title}
                </text>
                {card.bullets.map((b, bIdx) => (
                  <text
                    key={bIdx}
                    x={42 + i * 242}
                    y={152 + bIdx * 30}
                    fill="#E2E8F0"
                    fontSize="10.5"
                    fontWeight="600"
                  >
                    • {b}
                  </text>
                ))}
              </g>
            ))}
          </svg>
        );

      case 9:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE GOVERNANCE GUARDRAILS: RBAC vs. AZURE POLICY vs. RESOURCE LOCKS
            </text>
            <rect x="24" y="50" width="228" height="240" rx="12" fill="#1E293B" stroke="#38BDF8" />
            <text x="138" y="80" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="800">
              1. Azure RBAC (WHO)
            </text>
            <text x="42" y="112" fill="#E2E8F0" fontSize="10.5">
              • Controls user/group actions
            </text>
            <text x="42" y="138" fill="#E2E8F0" fontSize="10.5">
              • Built-in: Owner, Contributor, Reader
            </text>
            <text x="42" y="164" fill="#E2E8F0" fontSize="10.5">
              • Inherited down the scope tree
            </text>

            <rect x="266" y="50" width="228" height="240" rx="12" fill="#1E293B" stroke="#F59E0B" />
            <text x="380" y="80" textAnchor="middle" fill="#FBBF24" fontSize="13" fontWeight="800">
              2. Azure Policy (WHAT)
            </text>
            <text x="284" y="112" fill="#E2E8F0" fontSize="10.5">
              • Enforces resource compliance rules
            </text>
            <text x="284" y="138" fill="#E2E8F0" fontSize="10.5">
              • e.g., Allowed Regions or VM SKUs
            </text>
            <text x="284" y="164" fill="#E2E8F0" fontSize="10.5">
              • Initiatives group multiple policies
            </text>

            <rect x="508" y="50" width="228" height="240" rx="12" fill="#1E293B" stroke="#EF4444" />
            <text x="622" y="80" textAnchor="middle" fill="#F87171" fontSize="13" fontWeight="800">
              3. Resource Locks (SAFETY)
            </text>
            <text x="524" y="112" fill="#E2E8F0" fontSize="10.5">
              • CanNotDelete: Modify OK, No Delete
            </text>
            <text x="524" y="138" fill="#E2E8F0" fontSize="10.5">
              • ReadOnly: No Modify &amp; No Delete
            </text>
            <text x="524" y="164" fill="#FDE047" fontSize="10.5" fontWeight="800">
              • Overrides even Owner RBAC role!
            </text>
          </svg>
        );

      case 10:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE RESOURCE MANAGER (ARM) CONTROL PLANE, BICEP IaC &amp; AZURE ARC
            </text>
            {/* Left Clients */}
            <rect x="24" y="52" width="195" height="240" rx="12" fill="#1E293B" stroke="#38BDF8" />
            <text x="121" y="78" textAnchor="middle" fill="#38BDF8" fontSize="11.5" fontWeight="800">
              Management Clients &amp; IaC
            </text>
            {['Azure Portal (GUI)', 'Azure Cloud Shell (Bash/PS)', 'Azure CLI & PowerShell', 'Bicep & ARM JSON Templates'].map(
              (c, i) => (
                <g key={c}>
                  <rect x="38" y={94 + i * 44} width="167" height="34" rx="6" fill="#0F172A" />
                  <text x="121" y={115 + i * 44} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="700">
                    {c}
                  </text>
                </g>
              )
            )}
            {/* Center ARM */}
            <rect x="255" y="75" width="235" height="190" rx="14" fill="#0078D4" stroke="#FDE047" strokeWidth="2" />
            <text x="372" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="13.5" fontWeight="900">
              Azure Resource Manager
            </text>
            <text x="372" y="136" textAnchor="middle" fill="#BAE6FD" fontSize="10.5" fontWeight="700">
              (Unified ARM Control Plane API)
            </text>
            <text x="372" y="168" textAnchor="middle" fill="#FFFFFF" fontSize="10">
              ✓ Entra ID Authentication
            </text>
            <text x="372" y="190" textAnchor="middle" fill="#FFFFFF" fontSize="10">
              ✓ RBAC &amp; Azure Policy Check
            </text>
            <text x="372" y="212" textAnchor="middle" fill="#FFFFFF" fontSize="10">
              ✓ Resource Lock Verification
            </text>

            {/* Right Targets: Native Azure + Azure Arc */}
            <rect x="526" y="52" width="210" height="110" rx="12" fill="#1E293B" stroke="#10B981" />
            <text x="631" y="82" textAnchor="middle" fill="#34D399" fontSize="11.5" fontWeight="800">
              Azure Cloud Resources
            </text>
            <text x="631" y="106" textAnchor="middle" fill="#E2E8F0" fontSize="10">
              VMs • Storage • SQL • AKS
            </text>

            <rect x="526" y="182" width="210" height="110" rx="12" fill="#1E293B" stroke="#F59E0B" />
            <text x="631" y="212" textAnchor="middle" fill="#FBBF24" fontSize="11.5" fontWeight="800">
              Azure Arc (Hybrid / Multi-Cloud)
            </text>
            <text x="631" y="236" textAnchor="middle" fill="#E2E8F0" fontSize="10">
              On-Premises Servers, K8s,
            </text>
            <text x="631" y="254" textAnchor="middle" fill="#E2E8F0" fontSize="10">
              AWS &amp; GCP Projected into ARM
            </text>
          </svg>
        );

      case 11:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZURE OBSERVABILITY TRIO: ADVISOR vs. SERVICE HEALTH vs. MONITOR
            </text>
            {[
              {
                name: 'Azure Advisor',
                tag: 'Proactive Best Practices',
                color: '#10B981',
                items: [
                  '1. Reliability (High Availability)',
                  '2. Security (MDFC integration)',
                  '3. Performance (SKU tuning)',
                  '4. Cost (Idle VM right-sizing)',
                  '5. Operational Excellence',
                ],
              },
              {
                name: 'Azure Service Health',
                tag: 'Microsoft Platform Status',
                color: '#F59E0B',
                items: [
                  '1. Azure Status (Global map)',
                  '2. Service Health (Your regions)',
                  '3. Resource Health (Your VM)',
                  '• Planned Maintenance notices',
                  '• Official Outage RCAs',
                ],
              },
              {
                name: 'Azure Monitor',
                tag: 'Metrics, Logs & APM',
                color: '#0284C7',
                items: [
                  '• Real-time numerical Metrics',
                  '• Log Analytics (KQL queries)',
                  '• Application Insights (APM)',
                  '• Smart Alerts & Action Groups',
                  '• Triggers Auto-Scale rules',
                ],
              },
            ].map((col, i) => (
              <g key={col.name}>
                <rect
                  x={24 + i * 242}
                  y="50"
                  width="228"
                  height="242"
                  rx="12"
                  fill="#1E293B"
                  stroke={col.color}
                  strokeWidth="2"
                />
                <text x={138 + i * 242} y="80" textAnchor="middle" fill="#FFFFFF" fontSize="13.5" fontWeight="800">
                  {col.name}
                </text>
                <text x={138 + i * 242} y="98" textAnchor="middle" fill={col.color} fontSize="10" fontWeight="800">
                  {col.tag}
                </text>
                {col.items.map((it, idx) => (
                  <text key={idx} x={40 + i * 242} y={134 + idx * 28} fill="#E2E8F0" fontSize="10.5" fontWeight="600">
                    {it}
                  </text>
                ))}
              </g>
            ))}
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 760 320" className="w-full h-auto block select-none">
            <rect width="760" height="320" rx="16" fill="#0F172A" />
            <text x="24" y="30" fill="#38BDF8" fontSize="13" fontWeight="800">
              AZ-900 ENTERPRISE CLOUD ARCHITECTURE SYNTHESIS (MODULES 1–12)
            </text>
            <rect x="24" y="50" width="210" height="242" rx="12" fill="#1E293B" stroke="#F59E0B" />
            <text x="129" y="78" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="800">
              Path 1: Cloud Concepts
            </text>
            <text x="40" y="110" fill="#E2E8F0" fontSize="10.5">
              • Shared Responsibility Matrix
            </text>
            <text x="40" y="138" fill="#E2E8F0" fontSize="10.5">
              • Public, Private &amp; Hybrid
            </text>
            <text x="40" y="166" fill="#E2E8F0" fontSize="10.5">
              • CapEx vs. OpEx Consumption
            </text>
            <text x="40" y="194" fill="#E2E8F0" fontSize="10.5">
              • HA, Scalability &amp; Elasticity
            </text>

            <rect x="254" y="50" width="252" height="242" rx="12" fill="#1E293B" stroke="#38BDF8" />
            <text x="380" y="78" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="800">
              Path 2: Architecture &amp; Services
            </text>
            <text x="272" y="110" fill="#E2E8F0" fontSize="10.5">
              • Regions, 3 AZs &amp; Region Pairs
            </text>
            <text x="272" y="138" fill="#E2E8F0" fontSize="10.5">
              • VMs, App Service, AKS, Functions
            </text>
            <text x="272" y="166" fill="#E2E8F0" fontSize="10.5">
              • VNet, Peering, VPN &amp; ExpressRoute
            </text>
            <text x="272" y="194" fill="#E2E8F0" fontSize="10.5">
              • Storage Tiers &amp; LRS/ZRS/GRS
            </text>
            <text x="272" y="222" fill="#E2E8F0" fontSize="10.5">
              • Entra ID, Zero Trust &amp; RBAC
            </text>

            <rect x="526" y="50" width="210" height="242" rx="12" fill="#1E293B" stroke="#10B981" />
            <text x="631" y="78" textAnchor="middle" fill="#34D399" fontSize="12" fontWeight="800">
              Path 3: Mgmt &amp; Governance
            </text>
            <text x="542" y="110" fill="#E2E8F0" fontSize="10.5">
              • TCO vs. Pricing Calculator
            </text>
            <text x="542" y="138" fill="#E2E8F0" fontSize="10.5">
              • Cost Management &amp; Tags
            </text>
            <text x="542" y="166" fill="#E2E8F0" fontSize="10.5">
              • Azure Policy &amp; Resource Locks
            </text>
            <text x="542" y="194" fill="#E2E8F0" fontSize="10.5">
              • ARM, Bicep &amp; Azure Arc
            </text>
            <text x="542" y="222" fill="#E2E8F0" fontSize="10.5">
              • Advisor, Service Health, Monitor
            </text>
          </svg>
        );
    }
  };

  const moduleCustomDiagrams = customDiagrams.filter(
    (d) => d.moduleId === activeLesson.moduleId
  );

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[#0078D4] dark:text-sky-300 text-xs font-extrabold uppercase tracking-wider mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              Microsoft Certified: Azure Fundamentals (AZ-900) • Image Tutor
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Interactive Visual Architecture &amp; Course Image Tutor (Modules 1–12)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Explore interactive architectural diagrams adapted from the official Microsoft Learn AZ-900 curriculum across all 12 modules. Click any numbered hotspot inside a diagram to inspect its exam rules, or adapt and attach your own Microsoft Learn visual study diagrams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdaptModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:opacity-95 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Adapt Official MS Learn Image</span>
            </button>
            <a
              href={activeLesson.msLearnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              <span>Official Microsoft Learn Module</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Filter Bar: Path Filter + Search + 12-Module Pill Selector */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPathFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  selectedPathFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All 12 Modules
              </button>
              {LEARNING_PATHS.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setSelectedPathFilter(lp.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    selectedPathFilter === lp.id
                      ? 'bg-[#0078D4] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Path {lp.id}: {lp.title.replace('Describe ', '')} ({lp.examWeight})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagrams, services, SLAs..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 12-Module Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredModules.map((lesson) => {
              const isSelected = lesson.moduleId === activeLesson.moduleId;
              const modStat = stats.moduleMastery?.[lesson.moduleId];
              const modAcc =
                modStat && modStat.total > 0
                  ? Math.round((modStat.correct / modStat.total) * 100)
                  : null;

              return (
                <button
                  key={lesson.moduleId}
                  type="button"
                  onClick={() => handleSelectModule(lesson.moduleId)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#0078D4] to-[#005A9E] text-white border-[#005A9E] shadow-sm ring-2 ring-sky-400/40'
                      : 'bg-slate-50/90 dark:bg-slate-800/60 hover:bg-sky-50/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 text-amber-300'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Mod {lesson.moduleId} • P{lesson.pathId}
                    </span>
                    {modAcc !== null && (
                      <span
                        className={`text-[10px] font-extrabold tabular-nums ${
                          isSelected ? 'text-emerald-200' : 'text-slate-500'
                        }`}
                      >
                        {modAcc}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold line-clamp-2 leading-snug">
                    {lesson.moduleTitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive Visual Canvas + Hotspot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Interactive Architectural Diagram Canvas */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#0078D4] text-white text-[10px] font-black uppercase">
                  Module {activeLesson.moduleId} Visual Board
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Learning Path {activeLesson.pathId}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {activeLesson.diagramTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeLesson.diagramSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Zoom Out Diagram"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Zoom In Diagram"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Diagram Viewport with Clickable Hotspot Pins */}
          <div className="relative overflow-x-auto rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-inner">
            <div
              className="relative transition-transform duration-200 origin-top-left"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {renderModuleArchitecturalSvg(activeLesson.moduleId)}

              {/* Interactive Hotspot Overlay Pins */}
              {activeLesson.hotspots.map((spot, idx) => {
                const isSpotActive = activeHotspot?.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setSelectedHotspotId(spot.id)}
                    style={{
                      left: `${spot.xPercent}%`,
                      top: `${spot.yPercent}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg border transition-all cursor-pointer ${
                      isSpotActive
                        ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/40 scale-110'
                        : 'bg-slate-900/90 hover:bg-sky-600 text-white border-sky-400/80'
                    }`}
                    title={`Inspect Hotspot #${idx + 1}: ${spot.label}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/25 flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </span>
                    <span className="hidden sm:inline">{spot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption & Exam Watchout Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Visual Architecture Summary:</strong>{' '}
              {activeLesson.visualCaption}
            </p>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{activeLesson.examWatchout}</span>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Interactive Hotspot Inspector & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Hotspot Inspector Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0078D4] dark:text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Interactive Diagram Hotspot Inspector
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Click 1–{activeLesson.hotspots.length} on diagram
              </span>
            </div>

            {/* Hotspot Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {activeLesson.hotspots.map((spot, idx) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelectedHotspotId(spot.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeHotspot?.id === spot.id
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  #{idx + 1} {spot.label}
                </button>
              ))}
            </div>

            {activeHotspot && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-[#003E73] to-slate-900 text-white space-y-2.5 border border-sky-500/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                    {activeHotspot.badge}
                  </span>
                  <span className="text-[10px] text-sky-200 font-semibold">
                    {activeHotspot.msLearnTopic}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white">{activeHotspot.label}</h4>
                <p className="text-xs text-sky-100/90 leading-relaxed">{activeHotspot.summary}</p>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/15 text-[11px] text-amber-200 font-bold">
                  🎯 AZ-900 Exam Rule: {activeHotspot.examRule}
                </div>
              </div>
            )}

            {/* Key Visual Takeaways */}
            <div className="pt-2 space-y-1.5">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Module {activeLesson.moduleId} Visual Takeaways:
              </div>
              <ul className="space-y-1.5">
                {activeLesson.keyTakeaways.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onPracticeModule(activeLesson.moduleId)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Practice Module {activeLesson.moduleId} Exam Questions</span>
              </button>
              {onOpenStudyDecksModule && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenStudyDecksModule(activeLesson.moduleId, activeLesson.pathId)
                  }
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Full Unit-by-Unit Study Deck</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Adapted Microsoft Learn Images Gallery for this Module (if any) */}
      {moduleCustomDiagrams.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#0078D4]" />
              Your Adapted Microsoft Learn Diagrams for Module {activeLesson.moduleId}
            </h3>
            <button
              type="button"
              onClick={() => setShowAdaptModal(true)}
              className="text-xs font-bold text-[#0078D4] hover:underline cursor-pointer"
            >
              + Add Another Image
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleCustomDiagrams.map((diag) => (
              <div
                key={diag.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <img
                    src={diag.imageUrl}
                    alt={diag.title}
                    className="w-full h-48 object-contain bg-slate-950 p-2"
                  />
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {diag.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{diag.notes}</p>
                  </div>
                </div>
                <div className="px-3.5 py-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Module {diag.moduleId} Visual Reference</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomDiagram(diag.id)}
                    className="text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Fundamentals Knowledge Breakdown for the Selected Course Module */}
      {activeStudyModule && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4] dark:text-sky-400">
                Complete Course Fundamentals Knowledge • Module {activeStudyModule.moduleId}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {activeStudyModule.moduleTitle} — Unit-by-Unit Visual &amp; Service Breakdown
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0078D4] dark:text-sky-300 text-xs font-extrabold">
              {activeStudyModule.units.length} Official Curriculum Units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStudyModule.units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0078D4]/10 text-[#0078D4] dark:text-sky-300 text-[10px] font-black uppercase">
                      Unit {unit.unitNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {unit.unitTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {unit.conceptExplanation}
                  </p>

                  {/* Azure Services Pills */}
                  {unit.azureServices.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">
                        Key Azure Services &amp; Concepts:
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {unit.azureServices.map((svc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px]"
                          >
                            <strong className="text-slate-900 dark:text-white">{svc.name}:</strong>{' '}
                            <span className="text-slate-600 dark:text-slate-400">{svc.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    💡 <strong>Real-World Analogy:</strong> {unit.simplifiedExample}
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                    ✓ Exam Takeaway: {unit.examTakeaway}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Adapt Official Microsoft Learn Image / Diagram */}
      {showAdaptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setShowAdaptModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#003E73] to-[#0078D4] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Adapt Microsoft Learn Image / Diagram
                </h3>
                <p className="text-[11px] text-sky-100">
                  Attach a diagram URL or upload a screenshot for Module {activeLesson.moduleId}:{' '}
                  {activeLesson.moduleTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdaptModal(false)}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomDiagram} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Diagram Title
                </label>
                <input
                  type="text"
                  required
                  value={newDiagramTitle}
                  onChange={(e) => setNewDiagramTitle(e.target.value)}
                  placeholder={`e.g., Module ${activeLesson.moduleId} Microsoft Learn Architecture Diagram`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paste Image URL or Upload Screenshot File
                </label>
                <input
                  type="text"
                  value={newDiagramUrl}
                  onChange={(e) => setNewDiagramUrl(e.target.value)}
                  placeholder="https://learn.microsoft.com/en-us/training/.../diagram.png"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white mb-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-[#0078D4] hover:file:bg-sky-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fundamentals Study Notes &amp; Exam Callouts
                </label>
                <textarea
                  rows={3}
                  value={newDiagramNotes}
                  onChange={(e) => setNewDiagramNotes(e.target.value)}
                  placeholder="Write key exam rules or component relationships shown in this image..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdaptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-extrabold cursor-pointer"
                >
                  Save to Module {activeLesson.moduleId} Image Tutor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
