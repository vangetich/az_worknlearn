import { Question, UserStats } from '../types/quiz';
import { LEARNING_PATHS } from './curriculum';
import {
  AZURE_THEME_THREADS,
  AzureThemeThread,
  THEME_ID_TO_TAG,
  THREAD_TAG_META,
  ThreadTagId,
} from './azureThemesData';

export type ConceptServiceCategory =
  | 'Storage'
  | 'Compute'
  | 'Networking'
  | 'Identity & Security'
  | 'Governance & Compliance'
  | 'Cost & FinOps'
  | 'Deployment & Monitoring';

export interface ConceptServiceEdge {
  targetId: string;
  relationship: string;
}

export interface AzureConceptServiceNode {
  id: string;
  name: string;
  shortLabel: string;
  category: ConceptServiceCategory;
  summary: string;
  examRule: string;
  matchKeywords: string[];
  relatedModuleIds: number[];
  threadTags: ThreadTagId[];
  connectedEdges: ConceptServiceEdge[];
  docsUrl: string;
}

export const AZURE_CONCEPT_SERVICES: AzureConceptServiceNode[] = [
  {
    id: 'azure-blob-storage',
    name: 'Azure Blob Storage',
    shortLabel: 'Blob Storage',
    category: 'Storage',
    summary:
      'Massively scalable object storage for unstructured data (images, media, logs, backups) featuring Hot, Cool, Cold, and Archive lifecycle tiers.',
    examRule:
      'Archive tier is offline and needs hours to rehydrate; ZRS isolates datacenter failures within 1 region while RA-GRS adds secondary-region read access.',
    matchKeywords: [
      'blob',
      'object storage',
      'access tier',
      'archive tier',
      'rehydrat',
      'lifecycle management',
      'ra-grs',
      'gzrs',
      'immutable',
    ],
    relatedModuleIds: [3, 4, 5, 6, 8, 12],
    threadTags: ['Scaling', 'Reliability', 'FinOps', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-files', relationship: 'Peers with SMB shares in' },
      { targetId: 'azure-managed-disks', relationship: 'Contrasts vs block IOPS in' },
      { targetId: 'azure-cost-management', relationship: 'Optimizes aging OpEx via' },
      { targetId: 'azure-rbac', relationship: 'Authorized at data-plane via' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction',
  },
  {
    id: 'azure-files',
    name: 'Azure Files & File Sync',
    shortLabel: 'Azure Files',
    category: 'Storage',
    summary:
      'Fully managed cloud SMB/NFS file shares accessible concurrently from on-premises and cloud VMs, plus local Windows Server caching via Azure File Sync.',
    examRule:
      'Choose Azure Files whenever multiple VMs or hybrid branch offices need a shared mountable SMB network drive.',
    matchKeywords: ['azure files', 'file sync', 'smb', 'nfs', 'file share'],
    relatedModuleIds: [1, 5, 6, 10],
    threadTags: ['Hybrid/IaC', 'Reliability', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-blob-storage', relationship: 'Shares Storage Account with' },
      { targetId: 'azure-arc', relationship: 'Extends hybrid estate alongside' },
      { targetId: 'azure-vpn-gateway', relationship: 'Bridges on-prem SMB traffic over' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction',
  },
  {
    id: 'azure-managed-disks',
    name: 'Azure Managed Disks',
    shortLabel: 'Managed Disks',
    category: 'Storage',
    summary:
      'Block-level virtual hard disks attached to Azure Virtual Machines, scaling vertically across Standard HDD, Standard SSD, Premium SSD, and Ultra Disks.',
    examRule:
      'Need higher single-VM database IOPS or attached OS boot volumes? Scale Managed Disk tiers vertically rather than using Blob containers.',
    matchKeywords: ['managed disk', 'ultra disk', 'premium ssd', 'iops', 'block storage', 'vhd'],
    relatedModuleIds: [2, 5, 6, 12],
    threadTags: ['Scaling', 'Reliability', 'FinOps'],
    connectedEdges: [
      { targetId: 'azure-vms', relationship: 'Attached as block volume to' },
      { targetId: 'azure-blob-storage', relationship: 'Contrasts vs object storage in' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview',
  },
  {
    id: 'azure-vms',
    name: 'Azure Virtual Machines',
    shortLabel: 'Virtual Machines',
    category: 'Compute',
    summary:
      'On-demand IaaS compute offering full control over the guest OS and custom software; scales vertically by resizing VM SKUs (brief reboot).',
    examRule:
      'In IaaS VMs, Microsoft manages the host hardware/hypervisor while YOU patch the guest OS. Always Stop (Deallocate) VMs to halt compute billing.',
    matchKeywords: ['virtual machine', 'iaas', 'deallocate', 'vm size', 'single vm', 'availability set'],
    relatedModuleIds: [1, 2, 3, 4, 5, 8, 12],
    threadTags: ['Responsibility', 'Scaling', 'Reliability', 'FinOps'],
    connectedEdges: [
      { targetId: 'azure-vmss', relationship: 'Scales horizontally via' },
      { targetId: 'azure-managed-disks', relationship: 'Stores OS & data on' },
      { targetId: 'azure-vnet', relationship: 'Connected inside private subnets of' },
      { targetId: 'azure-reserved-instances', relationship: 'Cut 24/7 compute cost via' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/overview',
  },
  {
    id: 'azure-vmss',
    name: 'Azure VM Scale Sets (VMSS)',
    shortLabel: 'VM Scale Sets',
    category: 'Compute',
    summary:
      'Elastic horizontal compute orchestration creating and managing identical, load-balanced VM groups that auto-scale across Availability Zones.',
    examRule:
      'Whenever an IaaS fleet needs automatic scale-out/scale-in on CPU metrics with zero downtime across zones, pick VM Scale Sets.',
    matchKeywords: ['scale set', 'vmss', 'autoscale', 'auto-scale', 'horizontal', 'scale out'],
    relatedModuleIds: [2, 3, 4, 5, 11, 12],
    threadTags: ['Scaling', 'Reliability', 'FinOps'],
    connectedEdges: [
      { targetId: 'azure-load-balancer', relationship: 'Distributes inbound traffic via' },
      { targetId: 'azure-vms', relationship: 'Orchestrates homogeneous pools of' },
      { targetId: 'azure-monitor', relationship: 'Triggers autoscale rules from' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview',
  },
  {
    id: 'azure-app-service',
    name: 'Azure App Service',
    shortLabel: 'App Service (PaaS)',
    category: 'Compute',
    summary:
      'HTTP-based PaaS platform for hosting web apps and REST APIs with built-in OS patching, runtime updates, deployment slots, and horizontal autoscale.',
    examRule:
      'Pick App Service when a team wants to deploy web apps rapidly without patching the host OS—you keep Data, Access, and App code.',
    matchKeywords: ['app service', 'paas', 'web app', 'deployment slot', 'os patching'],
    relatedModuleIds: [1, 2, 5, 7, 12],
    threadTags: ['Responsibility', 'Scaling', 'Security'],
    connectedEdges: [
      { targetId: 'azure-functions', relationship: 'Pairs with event-driven serverless in' },
      { targetId: 'azure-entra-id', relationship: 'Authenticates enterprise users via' },
      { targetId: 'azure-monitor', relationship: 'Tracks HTTP latency via App Insights in' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/app-service/overview',
  },
  {
    id: 'azure-functions',
    name: 'Azure Functions (Serverless)',
    shortLabel: 'Azure Functions',
    category: 'Compute',
    summary:
      'Event-driven serverless compute executing code snippets on triggers (HTTP, timers, Blob uploads) using per-execution consumption billing.',
    examRule:
      'Serverless Consumption bills ONLY while code executes and scales down to zero automatically during idle windows.',
    matchKeywords: ['azure functions', 'serverless', 'consumption plan', 'event-driven'],
    relatedModuleIds: [2, 3, 5, 8, 12],
    threadTags: ['FinOps', 'Scaling', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-app-service', relationship: 'Shares PaaS runtime heritage with' },
      { targetId: 'azure-blob-storage', relationship: 'Reacts to upload triggers from' },
      { targetId: 'azure-cost-management', relationship: 'Optimizes pay-per-execution OpEx in' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview',
  },
  {
    id: 'azure-aks',
    name: 'Azure Kubernetes Service (AKS)',
    shortLabel: 'AKS & Containers',
    category: 'Compute',
    summary:
      'Managed Kubernetes container orchestration where Azure manages the Kubernetes control plane while you scale stateless microservice pods horizontally.',
    examRule:
      'Use ACI for simple single isolated containers; use AKS when coordinating complex multi-container clusters with automated scaling.',
    matchKeywords: ['aks', 'kubernetes', 'container instance', 'aci', 'docker', 'container'],
    relatedModuleIds: [1, 2, 5, 10, 12],
    threadTags: ['Scaling', 'Responsibility', 'Hybrid/IaC'],
    connectedEdges: [
      { targetId: 'azure-arc', relationship: 'Projects external K8s clusters via' },
      { targetId: 'azure-vnet', relationship: 'Assigns pod networking via' },
      { targetId: 'azure-vmss', relationship: 'Runs worker node pools backed by' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/aks/intro-kubernetes',
  },
  {
    id: 'azure-vnet',
    name: 'Azure Virtual Network (VNet)',
    shortLabel: 'Virtual Network',
    category: 'Networking',
    summary:
      'Isolated private network fabric scoped to a single Azure region, subdividing into subnets and bridging across regions via VNet Peering.',
    examRule:
      'VNets span all Availability Zones within ONE region, NOT across regions—cross-region connectivity uses Global VNet Peering.',
    matchKeywords: ['virtual network', 'vnet', 'subnet', 'vnet peering', 'private endpoint'],
    relatedModuleIds: [4, 5, 7, 10],
    threadTags: ['Reliability', 'Security', 'Hybrid/IaC'],
    connectedEdges: [
      { targetId: 'azure-nsg', relationship: 'Filters subnet/NIC packets with' },
      { targetId: 'azure-expressroute', relationship: 'Connects privately on-prem via' },
      { targetId: 'azure-vpn-gateway', relationship: 'Connects encrypted internet tunnels via' },
      { targetId: 'azure-load-balancer', relationship: 'Balances backend subnets inside' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview',
  },
  {
    id: 'azure-nsg',
    name: 'Network Security Groups (NSGs)',
    shortLabel: 'NSGs & Firewall',
    category: 'Networking',
    summary:
      'Stateful Layer-3/4 allow/deny traffic rules filtering inbound and outbound packets at Azure VNet subnets or VM network interfaces.',
    examRule:
      'NSGs implement network perimeter/micro-segmentation in Defense-in-Depth—distinct from Entra ID identity tokens.',
    matchKeywords: ['network security group', 'nsg', 'firewall', 'ddos', 'inbound rule'],
    relatedModuleIds: [5, 7, 9],
    threadTags: ['Security', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-vnet', relationship: 'Applied to subnets inside' },
      { targetId: 'azure-vms', relationship: 'Attached to NICs of' },
      { targetId: 'azure-entra-id', relationship: 'Complements identity defense with' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',
  },
  {
    id: 'azure-load-balancer',
    name: 'Azure Load Balancer',
    shortLabel: 'Load Balancer',
    category: 'Networking',
    summary:
      'High-throughput Layer-4 TCP/UDP load distributor routing incoming flows across healthy horizontal backend VM or VMSS pools across zones.',
    examRule:
      'Zone-redundant Standard Load Balancer works alongside VMSS to distribute traffic evenly and survive single-zone failures.',
    matchKeywords: ['load balancer', 'application gateway', 'traffic pool', 'azure dns'],
    relatedModuleIds: [2, 4, 5, 12],
    threadTags: ['Scaling', 'Reliability'],
    connectedEdges: [
      { targetId: 'azure-vmss', relationship: 'Distributes traffic to horizontal' },
      { targetId: 'azure-vnet', relationship: 'Operates inside' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview',
  },
  {
    id: 'azure-expressroute',
    name: 'Azure ExpressRoute',
    shortLabel: 'ExpressRoute',
    category: 'Networking',
    summary:
      'Dedicated private fiber link extending on-premises networks directly into Microsoft datacenters via a connectivity provider, bypassing the public internet.',
    examRule:
      'Whenever an exam asks to connect on-prem to Azure WITHOUT traversing the public internet, pick ExpressRoute; upgrade bandwidth SKU vertically as needed.',
    matchKeywords: ['expressroute', 'private fiber', 'bypass public internet', 'dedicated circuit'],
    relatedModuleIds: [1, 5, 8, 10, 12],
    threadTags: ['Hybrid/IaC', 'Scaling', 'Reliability', 'Security'],
    connectedEdges: [
      { targetId: 'azure-vpn-gateway', relationship: 'Uses internet failover backup via' },
      { targetId: 'azure-vnet', relationship: 'Links on-prem WAN into' },
      { targetId: 'azure-advisor', relationship: 'Monitors circuit utilization via' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
  },
  {
    id: 'azure-vpn-gateway',
    name: 'Azure VPN Gateway',
    shortLabel: 'VPN Gateway',
    category: 'Networking',
    summary:
      'Sends encrypted IPsec/IKE site-to-site or point-to-site traffic between on-premises datacenters/devices and an Azure VNet over the public internet.',
    examRule:
      'VPN Gateway IS encrypted, but travels over the public internet—choose it for cost-effective hybrid links rather than private ExpressRoute.',
    matchKeywords: ['vpn gateway', 'site-to-site', 'point-to-site', 'ipsec'],
    relatedModuleIds: [1, 5, 10],
    threadTags: ['Hybrid/IaC', 'Security', 'Reliability'],
    connectedEdges: [
      { targetId: 'azure-expressroute', relationship: 'Acts as encrypted internet alternative to' },
      { targetId: 'azure-vnet', relationship: 'Terminates encrypted tunnel inside' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways',
  },
  {
    id: 'azure-entra-id',
    name: 'Microsoft Entra ID',
    shortLabel: 'Entra ID',
    category: 'Identity & Security',
    summary:
      'Cloud-based identity and access management service providing Single Sign-On (SSO), Multi-Factor Authentication (MFA), and Conditional Access under Zero Trust.',
    examRule:
      'Entra ID proves WHO you are (Authentication / AuthN); Azure RBAC decides WHAT resources you can access (Authorization / AuthZ).',
    matchKeywords: ['entra', 'active directory', 'mfa', 'multi-factor', 'conditional access', 'sso', 'zero trust'],
    relatedModuleIds: [1, 4, 7, 9, 10],
    threadTags: ['Security', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-rbac', relationship: 'Pairs identity tokens with permissions in' },
      { targetId: 'azure-arm', relationship: 'Authenticates every API call into' },
      { targetId: 'azure-app-service', relationship: 'Provides SSO/MFA sign-in for' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
  },
  {
    id: 'azure-rbac',
    name: 'Azure Role-Based Access Control (RBAC)',
    shortLabel: 'Azure RBAC',
    category: 'Identity & Security',
    summary:
      'Fine-grained authorization system granting Owner, Contributor, or Reader roles scoped at Management Group, Subscription, Resource Group, or Resource level.',
    examRule:
      'RBAC inherits downward cleanly—but an Owner still cannot override an Azure Policy restriction or delete a resource under a CanNotDelete Lock.',
    matchKeywords: ['rbac', 'role-based', 'least privilege', 'contributor', 'authorization'],
    relatedModuleIds: [4, 7, 9, 10],
    threadTags: ['Security', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-entra-id', relationship: 'Authorizes identities verified by' },
      { targetId: 'azure-policy', relationship: 'Works alongside configuration rules in' },
      { targetId: 'azure-locks', relationship: 'Constrained at delete-time by' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
  },
  {
    id: 'azure-policy',
    name: 'Azure Policy & Initiatives',
    shortLabel: 'Azure Policy',
    category: 'Governance & Compliance',
    summary:
      'Evaluates and enforces organizational standards (allowed regions, approved VM SKUs, mandatory resource tags) across the ARM control plane.',
    examRule:
      'RBAC controls WHO accesses resources; Azure Policy enforces WHAT configurations are compliant—and applies identically via Portal, CLI, or Bicep.',
    matchKeywords: ['azure policy', 'initiative', 'compliance', 'allowed locations', 'enforce tag'],
    relatedModuleIds: [4, 7, 9, 10],
    threadTags: ['Security', 'Responsibility', 'Hybrid/IaC'],
    connectedEdges: [
      { targetId: 'azure-rbac', relationship: 'Guards what authorized users can build in' },
      { targetId: 'azure-arm', relationship: 'Evaluates every deployment request in' },
      { targetId: 'azure-arc', relationship: 'Extends compliance rules outside Azure via' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
  },
  {
    id: 'azure-locks',
    name: 'Azure Resource Locks',
    shortLabel: 'Resource Locks',
    category: 'Governance & Compliance',
    summary:
      'Applies CanNotDelete or ReadOnly safeguards at Subscription, Resource Group, or Resource scope to prevent accidental human deletion or changes.',
    examRule:
      'Even a Subscription Owner cannot delete a locked resource until the lock is explicitly removed first.',
    matchKeywords: ['resource lock', 'cannotdelete', 'readonly', 'accidental deletion'],
    relatedModuleIds: [4, 6, 9],
    threadTags: ['Security', 'Reliability'],
    connectedEdges: [
      { targetId: 'azure-rbac', relationship: 'Overrides delete rights even for Owners in' },
      { targetId: 'azure-policy', relationship: 'Complements governance guardrails with' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources',
  },
  {
    id: 'azure-cost-management',
    name: 'Microsoft Cost Management & Budgets',
    shortLabel: 'Cost Management',
    category: 'Cost & FinOps',
    summary:
      'Tracks active cloud spend across subscriptions, applies department chargeback via Resource Tags, and triggers alerts when Budgets approach thresholds.',
    examRule:
      'Pricing Calculator estimates NEW workloads before deployment; Cost Management tracks ACTIVE ongoing spend and budget alerts.',
    matchKeywords: ['cost management', 'budget', 'resource tag', 'chargeback', 'spend'],
    relatedModuleIds: [3, 4, 8, 11],
    threadTags: ['FinOps', 'Scaling'],
    connectedEdges: [
      { targetId: 'azure-calculators', relationship: 'Monitors live spend vs estimates from' },
      { targetId: 'azure-reserved-instances', relationship: 'Applies committed discounts tracked in' },
      { targetId: 'azure-advisor', relationship: 'Pairs alerts with right-sizing tips from' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-alerts-monitor-usage-spending',
  },
  {
    id: 'azure-calculators',
    name: 'Pricing & TCO Calculators',
    shortLabel: 'Pricing & TCO',
    category: 'Cost & FinOps',
    summary:
      'Pre-deployment planning tools: Pricing Calculator estimates monthly bills for new Azure architectures, while TCO Calculator compares on-prem costs vs migrating to Azure.',
    examRule:
      'Justifying an on-premises datacenter migration = TCO Calculator; budgeting new cloud VMs/Storage = Azure Pricing Calculator.',
    matchKeywords: ['pricing calculator', 'tco calculator', 'total cost of ownership', 'estimate'],
    relatedModuleIds: [3, 8],
    threadTags: ['FinOps'],
    connectedEdges: [
      { targetId: 'azure-cost-management', relationship: 'Hands off estimates to live tracking in' },
      { targetId: 'azure-blob-storage', relationship: 'Models Hot/Cool/Archive spend for' },
    ],
    docsUrl: 'https://azure.microsoft.com/en-us/pricing/calculator/',
  },
  {
    id: 'azure-reserved-instances',
    name: 'Reserved Instances & Hybrid Benefit',
    shortLabel: 'Reservations & AHB',
    category: 'Cost & FinOps',
    summary:
      'Saves up to 72% via 1- or 3-year reservations for steady baseline workloads, and lowers Windows/SQL costs by reusing Software Assurance licenses via Azure Hybrid Benefit.',
    examRule:
      'Reserve ONLY predictable 24/7 baseline capacity—pair with autoscale pay-as-you-go for temporary traffic bursts.',
    matchKeywords: ['reserved instance', 'savings plan', 'hybrid benefit', 'reservation'],
    relatedModuleIds: [3, 5, 8, 12],
    threadTags: ['FinOps', 'Scaling'],
    connectedEdges: [
      { targetId: 'azure-vms', relationship: 'Discounts baseline compute for' },
      { targetId: 'azure-cost-management', relationship: 'Reports reservation utilization in' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/reservations/save-compute-costs-reservations',
  },
  {
    id: 'azure-arm',
    name: 'Azure Resource Manager (ARM) & Bicep',
    shortLabel: 'ARM & Bicep',
    category: 'Deployment & Monitoring',
    summary:
      'Unified management plane receiving every Portal, CLI, PowerShell, and declarative Bicep/ARM template request, ensuring consistent RBAC and Policy evaluation.',
    examRule:
      'Switching from Portal to Azure CLI never bypasses Policy or RBAC because every client hits the exact same ARM layer; Bicep compiles declaratively to ARM JSON.',
    matchKeywords: ['resource manager', 'arm template', 'bicep', 'infrastructure as code', 'cloud shell', 'azure cli'],
    relatedModuleIds: [2, 4, 7, 9, 10],
    threadTags: ['Hybrid/IaC', 'Security'],
    connectedEdges: [
      { targetId: 'azure-arc', relationship: 'Projects non-Azure servers into' },
      { targetId: 'azure-policy', relationship: 'Enforces deployment rules inside' },
      { targetId: 'azure-entra-id', relationship: 'Requires verified auth tokens for' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview',
  },
  {
    id: 'azure-arc',
    name: 'Azure Arc',
    shortLabel: 'Azure Arc',
    category: 'Deployment & Monitoring',
    summary:
      'Hybrid/multi-cloud control plane projecting on-premises Windows/Linux servers, SQL servers, and AWS/GCP Kubernetes clusters directly into ARM.',
    examRule:
      'Whenever an organization runs servers on-premises + AWS/GCP + Azure and wants unified Policy, Tags, RBAC, and Monitor telemetry, choose Azure Arc.',
    matchKeywords: ['azure arc', 'hybrid', 'multi-cloud', 'outside azure'],
    relatedModuleIds: [1, 9, 10, 11],
    threadTags: ['Hybrid/IaC', 'Security', 'Responsibility'],
    connectedEdges: [
      { targetId: 'azure-arm', relationship: 'Extends control plane of' },
      { targetId: 'azure-policy', relationship: 'Enforces guest compliance outside Azure via' },
      { targetId: 'azure-monitor', relationship: 'Collects hybrid server logs into' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-arc/overview',
  },
  {
    id: 'azure-monitor',
    name: 'Azure Monitor & Service Health',
    shortLabel: 'Monitor & Advisor',
    category: 'Deployment & Monitoring',
    summary:
      'Unified observability collecting VMSS CPU/HTTP metrics, Log Analytics, App Insights traces, Service Health outage alerts, and Azure Advisor recommendations.',
    examRule:
      'Azure Monitor alerts trigger autoscale; Azure Advisor recommends Cost/Security/Reliability improvements; Service Health reports personalized regional outages.',
    matchKeywords: ['azure monitor', 'log analytics', 'application insights', 'service health', 'azure advisor'],
    relatedModuleIds: [2, 4, 8, 10, 11, 12],
    threadTags: ['Scaling', 'Reliability', 'FinOps', 'Hybrid/IaC'],
    connectedEdges: [
      { targetId: 'azure-vmss', relationship: 'Fires metric autoscale triggers for' },
      { targetId: 'azure-arc', relationship: 'Monitors hybrid nodes bridged by' },
      { targetId: 'azure-cost-management', relationship: 'Surfaces idle-VM savings alongside' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
  },
];

export interface ConceptNodeModuleLink {
  moduleId: number;
  pathId: 1 | 2 | 3;
  moduleTitle: string;
  accuracyPct: number | null;
  attemptedCount: number;
  isCompleted: boolean;
  serviceApplication: string;
}

export interface ConceptNodeThreadLink {
  tagId: ThreadTagId;
  theme: AzureThemeThread;
  roleSummary: string;
}

export interface ResolvedConceptNodeData {
  service: AzureConceptServiceNode;
  relatedQuestions: Question[];
  relatedModules: ConceptNodeModuleLink[];
  relatedThreads: ConceptNodeThreadLink[];
  connectedServices: Array<{
    service: AzureConceptServiceNode;
    relationship: string;
  }>;
}

export function resolveServiceConceptNode(
  serviceId: string,
  stats: UserStats,
  questions: Question[]
): ResolvedConceptNodeData {
  const service =
    AZURE_CONCEPT_SERVICES.find((s) => s.id === serviceId) ||
    AZURE_CONCEPT_SERVICES[0];

  const completedSet = new Set(stats.completedModules || []);
  const flatModules = LEARNING_PATHS.flatMap((p) =>
    p.modules.map((m) => ({ ...m, pathId: p.id as 1 | 2 | 3 }))
  );

  // 1. Resolve interconnecting threads linked to this service
  const relatedThreads: ConceptNodeThreadLink[] = service.threadTags.map((tagId) => {
    const meta = THREAD_TAG_META[tagId];
    const theme =
      AZURE_THEME_THREADS.find((t) => t.id === meta.themeId) || AZURE_THEME_THREADS[0];
    const matchingConns = theme.moduleConnections.filter((conn) =>
      service.relatedModuleIds.includes(conn.moduleId)
    );
    const roleSummary =
      matchingConns[0]?.serviceApplication || theme.examPayoffSummary;

    return {
      tagId,
      theme,
      roleSummary,
    };
  });

  // 2. Resolve related study modules with real-time user progress & service context
  const relatedModules: ConceptNodeModuleLink[] = service.relatedModuleIds
    .map((modId) => {
      const modInfo = flatModules.find((m) => m.id === modId);
      if (!modInfo) return null;

      const mastery = stats.moduleMastery?.[modId];
      const accuracyPct =
        mastery && mastery.total > 0
          ? Math.round((mastery.correct / mastery.total) * 100)
          : null;

      // Find richest contextual sentence from theme connections for this module
      let serviceApplication = modInfo.description;
      for (const tLink of relatedThreads) {
        const conn = tLink.theme.moduleConnections.find((c) => c.moduleId === modId);
        if (conn) {
          serviceApplication = conn.serviceApplication;
          break;
        }
      }

      return {
        moduleId: modId,
        pathId: modInfo.pathId,
        moduleTitle: modInfo.title,
        accuracyPct,
        attemptedCount: mastery?.total || 0,
        isCompleted: completedSet.has(modId),
        serviceApplication,
      };
    })
    .filter((item): item is ConceptNodeModuleLink => item !== null);

  // 3. Dynamically match all related quiz questions using weighted keyword + service name matching
  const scoredQuestions: Array<{ q: Question; score: number }> = [];
  const lowerServiceName = service.name.toLowerCase();
  const lowerShortLabel = service.shortLabel.toLowerCase();

  for (const q of questions) {
    const haystack = [
      q.scenario,
      q.question,
      q.whyCorrect,
      q.examTip,
      q.moduleTitle,
      ...q.options.map((o) => o.text),
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (haystack.includes(lowerServiceName)) score += 10;
    if (haystack.includes(lowerShortLabel)) score += 6;

    for (const kw of service.matchKeywords) {
      if (haystack.includes(kw.toLowerCase())) {
        score += kw.length >= 8 ? 5 : 3;
      }
    }

    if (score > 0 && service.relatedModuleIds.includes(q.moduleId)) {
      score += 2;
    }

    if (score >= 3) {
      scoredQuestions.push({ q, score });
    }
  }

  scoredQuestions.sort(
    (a, b) => b.score - a.score || a.q.moduleId - b.q.moduleId
  );

  // 4. Connected neighboring Azure services
  const connectedServices = service.connectedEdges
    .map((edge) => {
      const target = AZURE_CONCEPT_SERVICES.find((s) => s.id === edge.targetId);
      if (!target) return null;
      return { service: target, relationship: edge.relationship };
    })
    .filter(
      (item): item is { service: AzureConceptServiceNode; relationship: string } =>
        item !== null
    );

  return {
    service,
    relatedQuestions: scoredQuestions.map((s) => s.q),
    relatedModules,
    relatedThreads,
    connectedServices,
  };
}
