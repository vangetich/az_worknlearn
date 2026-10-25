export interface GlossaryRelation {
  term: string;
  relationship: string; // e.g., "Contrasts with", "Parent Scope of", "Works alongside", "Secured by"
}

export interface AzureGlossaryTerm {
  id: string;
  term: string;
  acronym?: string;
  category:
    | 'Cloud Concepts'
    | 'Core Architecture'
    | 'Compute'
    | 'Networking'
    | 'Storage'
    | 'Identity & Security'
    | 'Cost Management'
    | 'Governance & Compliance'
    | 'Deployment & Management'
    | 'Monitoring & Advisory';
  pathId: 1 | 2 | 3;
  moduleId: number;
  moduleTitle: string;
  definition: string;
  interrelatedSummary: string;
  relatedTerms: GlossaryRelation[];
  examTrap: string;
  docsUrl: string;
  docsLabel: string;
  docsCitation: string;
}

export const AZURE_GLOSSARY_TERMS: AzureGlossaryTerm[] = [
  // =========================================================================
  // MODULE 1: CLOUD CONCEPTS (PATH 1)
  // =========================================================================
  {
    id: 'cloud-computing',
    term: 'Cloud Computing',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    definition:
      'The delivery of computing services—including compute, storage, databases, networking, and analytics—over the internet ("the cloud") using a pay-as-you-go pricing model.',
    interrelatedSummary:
      'Forms the foundation for Public, Private, and Hybrid deployment models and shifts IT spending from Capital Expenditure (CapEx) to Operational Expenditure (OpEx).',
    relatedTerms: [
      { term: 'Operational Expenditure (OpEx)', relationship: 'Uses consumption billing via' },
      { term: 'Shared Responsibility Model', relationship: 'Governed by security split in' },
      { term: 'Public Cloud', relationship: 'Most commonly deployed as' },
    ],
    examTrap:
      'Cloud computing does NOT mean zero customer responsibility; data and identities always remain the customer’s responsibility.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/overview',
    docsLabel: 'MS Learn: Cloud Computing Overview',
    docsCitation: 'Microsoft Learn • AZ-900 Module 1: Describe Cloud Computing',
  },
  {
    id: 'shared-responsibility-model',
    term: 'Shared Responsibility Model',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    definition:
      'A security and operational framework that divides cloud responsibilities between the cloud provider (Microsoft) and the customer based on the service type (IaaS, PaaS, or SaaS).',
    interrelatedSummary:
      'Directly connects to Cloud Service Types: IaaS gives customers the most control and responsibility (OS, network, apps), PaaS shifts OS/runtime patching to Microsoft, and SaaS shifts application management to Microsoft.',
    relatedTerms: [
      { term: 'Infrastructure as a Service (IaaS)', relationship: 'Highest customer technical control in' },
      { term: 'Platform as a Service (PaaS)', relationship: 'Balanced responsibility in' },
      { term: 'Software as a Service (SaaS)', relationship: 'Lowest customer management in' },
      { term: 'Microsoft Entra ID', relationship: 'Customer always manages identity via' },
    ],
    examTrap:
      'Regardless of deployment model (IaaS, PaaS, or SaaS), the customer is ALWAYS responsible for Data, Endpoints/Devices, Accounts, and Access Management.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
    docsLabel: 'MS Learn: Shared Responsibility in the Cloud',
    docsCitation: 'Microsoft Security Documentation • Shared Responsibility Model',
  },
  {
    id: 'capex-vs-opex',
    term: 'Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx)',
    acronym: 'CapEx / OpEx',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    definition:
      'CapEx is the up-front spending of money on physical infrastructure (servers, datacenters) deducted over time. OpEx is spending on services or products as needed (pay-as-you-go cloud consumption) billed and deducted in the same period.',
    interrelatedSummary:
      'Interrelates with Total Cost of Ownership (TCO) Calculator when comparing on-premises CapEx datacenters against Azure OpEx cloud subscriptions.',
    relatedTerms: [
      { term: 'Total Cost of Ownership (TCO) Calculator', relationship: 'Compared financially using' },
      { term: 'Consumption-Based Model', relationship: 'Enables pay-as-you-go via' },
      { term: 'Microsoft Cost Management', relationship: 'Monitored continuously in' },
    ],
    examTrap:
      'Buying physical servers or leasing a datacenter building upfront is CapEx; paying monthly for Azure VMs or Blob Storage is OpEx.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/strategy/financial-models',
    docsLabel: 'MS Learn: Cloud Financial Models (CapEx vs OpEx)',
    docsCitation: 'Microsoft Cloud Adoption Framework • Financial Models',
  },
  {
    id: 'consumption-based-model',
    term: 'Consumption-Based Model',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    definition:
      'A pricing model where end users only pay for the cloud resources and compute cycles they actually consume, with no upfront infrastructure fees.',
    interrelatedSummary:
      'Powers Serverless computing (Azure Functions) and Auto-Scaling (VM Scale Sets) so costs dynamically align with real traffic demand.',
    relatedTerms: [
      { term: 'Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx)', relationship: 'Implements OpEx through' },
      { term: 'Serverless Computing', relationship: 'Per-second execution billing in' },
      { term: 'Azure Pricing Calculator', relationship: 'Estimated before deployment with' },
    ],
    examTrap:
      'Remember that stopped (deallocated) VMs stop accruing compute charges, but their attached storage disks continue to be billed.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data',
    docsLabel: 'MS Learn: Consumption & Cost Data',
    docsCitation: 'Microsoft Learn • AZ-900 Consumption-Based Pricing',
  },
  {
    id: 'public-private-hybrid-cloud',
    term: 'Public, Private, and Hybrid Cloud Models',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 1,
    moduleTitle: 'Describe Cloud Computing',
    definition:
      'Public cloud is owned by a cloud provider (Microsoft Azure) and shared across tenants; Private cloud is dedicated exclusively to one organization; Hybrid cloud bridges on-premises private infrastructure with public cloud resources.',
    interrelatedSummary:
      'Hybrid cloud relies on Azure Arc for multi-environment management and Azure ExpressRoute or VPN Gateway for cross-premises network connectivity.',
    relatedTerms: [
      { term: 'Azure Arc', relationship: 'Extends Azure governance to hybrid/multi-cloud via' },
      { term: 'Azure ExpressRoute', relationship: 'Connects private datacenters to public cloud via' },
      { term: 'VPN Gateway', relationship: 'Encrypted hybrid internet tunnel via' },
    ],
    examTrap:
      'Azure VMware Solution or Azure Stack HCI running in your own datacenter connected to Azure is a classic Hybrid Cloud scenario.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/strategy/cloud-deployment-models',
    docsLabel: 'MS Learn: Cloud Deployment Models',
    docsCitation: 'Microsoft Learn • Public, Private, and Hybrid Cloud',
  },

  // =========================================================================
  // MODULE 2: BENEFITS OF USING CLOUD SERVICES (PATH 1)
  // =========================================================================
  {
    id: 'high-availability',
    term: 'High Availability (HA)',
    acronym: 'HA',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 2,
    moduleTitle: 'Describe the Benefits of Using Cloud Services',
    definition:
      'The ability of a system to remain continuously operational and accessible with minimal downtime, measured as uptime percentage in Service Level Agreements (SLAs).',
    interrelatedSummary:
      'Implemented architecturally in Azure using Availability Zones (physically separate datacenters in a region) and Load Balancers.',
    relatedTerms: [
      { term: 'Availability Zones', relationship: 'Achieved across datacenters using' },
      { term: 'Fault Tolerance', relationship: 'Closely paired with zero-disruption' },
      { term: 'Disaster Recovery (DR)', relationship: 'Contrasts with major regional recovery in' },
    ],
    examTrap:
      'Do not confuse High Availability (keeping services running during normal/component fluctuations) with Disaster Recovery (recovering data/systems after a catastrophic regional outage).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/reliability/overview',
    docsLabel: 'MS Learn: Azure Reliability & High Availability',
    docsCitation: 'Microsoft Azure Well-Architected Framework • Reliability',
  },
  {
    id: 'scalability-vertical-horizontal',
    term: 'Scalability (Vertical vs. Horizontal Scaling)',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 2,
    moduleTitle: 'Describe the Benefits of Using Cloud Services',
    definition:
      'The ability to adjust resources to meet demand. Vertical scaling (Scaling Up/Down) adds more CPU/RAM to an existing VM; Horizontal scaling (Scaling Out/In) adds or removes VM instances.',
    interrelatedSummary:
      'Automated horizontally via Virtual Machine Scale Sets (VMSS) and Azure App Service autoscaling rules.',
    relatedTerms: [
      { term: 'Elasticity', relationship: 'Automated dynamic scaling is called' },
      { term: 'Virtual Machine Scale Sets (VMSS)', relationship: 'Horizontally scaled in compute using' },
      { term: 'Cloud Agility', relationship: 'Often confused on exams with' },
    ],
    examTrap:
      'Upgrading a VM from 4 vCPUs to 16 vCPUs is Vertical Scaling (Scaling Up). Adding 5 more VMs behind a load balancer is Horizontal Scaling (Scaling Out).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling',
    docsLabel: 'MS Learn: Autoscaling & Scalability',
    docsCitation: 'Microsoft Azure Architecture Center • Scaling Best Practices',
  },
  {
    id: 'elasticity-vs-agility',
    term: 'Elasticity vs. Cloud Agility',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 2,
    moduleTitle: 'Describe the Benefits of Using Cloud Services',
    definition:
      'Elasticity is the automatic, dynamic allocation and deallocation of resources as workload demand spikes or drops. Agility is the speed at which you can develop, test, and deploy new applications in the cloud.',
    interrelatedSummary:
      'Elasticity relies on Azure Monitor metrics triggering VMSS or App Service autoscale rules; Agility relies on Azure DevOps, Bicep, and ARM Templates.',
    relatedTerms: [
      { term: 'Scalability (Vertical vs. Horizontal Scaling)', relationship: 'Automates resource capacity in' },
      { term: 'Bicep & ARM Templates', relationship: 'Accelerates deployment agility via' },
      { term: 'Azure Monitor', relationship: 'Triggers elastic autoscale rules using metrics from' },
    ],
    examTrap:
      'Exam Keyword Cue: "Automatically adding/removing resources based on traffic spikes" = Elasticity. "Rapidly provisioning environments in minutes instead of weeks" = Agility.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/architecture/framework/scalability/design-scale',
    docsLabel: 'MS Learn: Elasticity & Scale Design',
    docsCitation: 'Microsoft Learn • AZ-900 Module 2: Cloud Benefits',
  },
  {
    id: 'fault-tolerance-vs-disaster-recovery',
    term: 'Fault Tolerance vs. Disaster Recovery (DR)',
    acronym: 'FT / DR',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 2,
    moduleTitle: 'Describe the Benefits of Using Cloud Services',
    definition:
      'Fault Tolerance ensures zero service interruption when a component fails by failing over instantly to redundant hardware. Disaster Recovery (DR) restores operations and data after a major regional catastrophe using backups or cross-region replication.',
    interrelatedSummary:
      'Fault Tolerance uses Availability Zones and ZRS storage; Disaster Recovery uses Azure Region Pairs, GRS storage, and Azure Site Recovery.',
    relatedTerms: [
      { term: 'Azure Region Pairs', relationship: 'Supports cross-region DR via' },
      { term: 'Storage Redundancy (LRS, ZRS, GRS, GZRS)', relationship: 'Replicates storage data across zones/regions via' },
      { term: 'High Availability (HA)', relationship: 'Sustains uptime SLAs alongside' },
    ],
    examTrap:
      'Fault tolerance prevents downtime proactively via built-in redundancy; Disaster Recovery reacts to and recovers from a major outage (defined by RPO and RTO).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/reliability/disaster-recovery-overview',
    docsLabel: 'MS Learn: Disaster Recovery in Azure',
    docsCitation: 'Microsoft Learn • Reliability & Disaster Recovery',
  },

  // =========================================================================
  // MODULE 3: CLOUD SERVICE TYPES (PATH 1)
  // =========================================================================
  {
    id: 'iaas',
    term: 'Infrastructure as a Service (IaaS)',
    acronym: 'IaaS',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 3,
    moduleTitle: 'Describe Cloud Service Types',
    definition:
      'A cloud service category that provides instant-computing infrastructure—servers, storage, and networking—provisioned and managed over the internet while the customer manages the OS, middleware, and applications.',
    interrelatedSummary:
      'Represented by Azure Virtual Machines and Virtual Networks; preferred for "lift-and-shift" migrations where full OS control is required.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Primary compute example is' },
      { term: 'Shared Responsibility Model', relationship: 'Requires customer OS patching under' },
      { term: 'Platform as a Service (PaaS)', relationship: 'Requires more management than' },
    ],
    examTrap:
      'In IaaS, Microsoft manages physical hosts, storage hardware, and physical datacenter security; the CUSTOMER must patch the guest Operating System.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/overview',
    docsLabel: 'MS Learn: Azure IaaS & Virtual Machines',
    docsCitation: 'Microsoft Learn • AZ-900 Module 3: Cloud Service Types',
  },
  {
    id: 'paas',
    term: 'Platform as a Service (PaaS)',
    acronym: 'PaaS',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 3,
    moduleTitle: 'Describe Cloud Service Types',
    definition:
      'A complete development and deployment environment in the cloud where Microsoft manages the underlying hardware, OS, and runtime, allowing developers to focus solely on code and data.',
    interrelatedSummary:
      'Includes Azure App Service, Azure SQL Database, and Azure Functions. Eliminates OS patching overhead compared to IaaS.',
    relatedTerms: [
      { term: 'Azure App Service', relationship: 'Flagship web hosting PaaS is' },
      { term: 'Infrastructure as a Service (IaaS)', relationship: 'Abstracts away OS management from' },
      { term: 'Serverless Computing', relationship: 'Includes event-driven sub-model' },
    ],
    examTrap:
      'If a scenario asks to "maximize developer productivity without managing operating systems or server patches", choose PaaS (e.g., Azure App Service).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/app-service/overview',
    docsLabel: 'MS Learn: Azure App Service (PaaS)',
    docsCitation: 'Microsoft Learn • AZ-900 Module 3: Platform as a Service',
  },
  {
    id: 'saas',
    term: 'Software as a Service (SaaS)',
    acronym: 'SaaS',
    category: 'Cloud Concepts',
    pathId: 1,
    moduleId: 3,
    moduleTitle: 'Describe Cloud Service Types',
    definition:
      'Centrally hosted, ready-to-use cloud software applications delivered over the internet (typically via subscription), such as Microsoft 365, Dynamics 365, or Outlook on the web.',
    interrelatedSummary:
      'Secured via Microsoft Entra ID Single Sign-On (SSO) and Conditional Access policies.',
    relatedTerms: [
      { term: 'Shared Responsibility Model', relationship: 'Customer only manages data & access under' },
      { term: 'Single Sign-On (SSO) & Multi-Factor Authentication (MFA)', relationship: 'Authenticated seamlessly via' },
      { term: 'Platform as a Service (PaaS)', relationship: 'Delivers finished software unlike' },
    ],
    examTrap:
      'In SaaS, the customer does NOT write or deploy application code—they only configure the software, users, and data.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
    docsLabel: 'MS Learn: SaaS in Shared Responsibility',
    docsCitation: 'Microsoft Learn • AZ-900 Module 3: Software as a Service',
  },

  // =========================================================================
  // MODULE 4: CORE ARCHITECTURAL COMPONENTS OF AZURE (PATH 2)
  // =========================================================================
  {
    id: 'azure-regions-and-availability-zones',
    term: 'Availability Zones & Azure Regions',
    acronym: 'AZ',
    category: 'Core Architecture',
    pathId: 2,
    moduleId: 4,
    moduleTitle: 'Describe the Core Architectural Components of Azure',
    definition:
      'An Azure Region is a geographical area containing one or more datacenters connected by a low-latency network. Availability Zones are physically separate datacenters within a single Azure Region, each with independent power, cooling, and networking.',
    interrelatedSummary:
      'Combines with Zone-Redundant Storage (ZRS) and multi-zone Virtual Machines to deliver a 99.99% uptime SLA against single-datacenter failures.',
    relatedTerms: [
      { term: 'Azure Region Pairs', relationship: 'Protected against regional disasters by' },
      { term: 'Storage Redundancy (LRS, ZRS, GRS, GZRS)', relationship: 'Uses 3 availability zones in ZRS via' },
      { term: 'High Availability (HA)', relationship: 'Primary architectural building block for' },
    ],
    examTrap:
      'Availability Zones protect against a SINGLE DATACENTER failure within a region (minimum 3 zones in enabled regions). They do NOT protect against a full regional disaster (use Region Pairs/GRS for that).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
    docsLabel: 'MS Learn: Availability Zones Overview',
    docsCitation: 'Microsoft Learn • Azure Reliability & Availability Zones',
  },
  {
    id: 'azure-region-pairs',
    term: 'Azure Region Pairs & Sovereign Regions',
    category: 'Core Architecture',
    pathId: 2,
    moduleId: 4,
    moduleTitle: 'Describe the Core Architectural Components of Azure',
    definition:
      'A Region Pair consists of two Azure regions within the same geography (typically 300+ miles apart) connected for cross-regional replication and staggered platform updates. Sovereign Regions (Azure Government, Azure China 21Vianet) are isolated clouds for strict regulatory compliance.',
    interrelatedSummary:
      'Underpins Geo-Redundant Storage (GRS) replication so data stays within the same geopolitical boundary while surviving a regional outage.',
    relatedTerms: [
      { term: 'Availability Zones & Azure Regions', relationship: 'Links two regions within a geography from' },
      { term: 'Storage Redundancy (LRS, ZRS, GRS, GZRS)', relationship: 'Target destination for GRS/GZRS in' },
      { term: 'Fault Tolerance vs. Disaster Recovery (DR)', relationship: 'Enables cross-region disaster recovery for' },
    ],
    examTrap:
      'During planned Azure platform maintenance, Microsoft updates only ONE region in a pair at a time to prevent simultaneous downtime.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/reliability/cross-region-replication-azure',
    docsLabel: 'MS Learn: Cross-Region Replication & Region Pairs',
    docsCitation: 'Microsoft Learn • Azure Geographies & Region Pairs',
  },
  {
    id: 'management-groups-subscriptions-resource-groups',
    term: 'Management Groups, Subscriptions & Resource Groups',
    category: 'Core Architecture',
    pathId: 2,
    moduleId: 4,
    moduleTitle: 'Describe the Core Architectural Components of Azure',
    definition:
      'The four-level Azure governance hierarchy: Management Groups (organize multiple subscriptions, up to 6 levels deep) → Subscriptions (billing and access boundary) → Resource Groups (logical lifecycle container for resources) → Resources (VMs, Storage, VNets).',
    interrelatedSummary:
      'Azure Policy, RBAC roles, and Resource Locks applied at a higher scope (e.g., Management Group) automatically inherit downward to child Subscriptions, Resource Groups, and Resources.',
    relatedTerms: [
      { term: 'Azure Resource Manager (ARM)', relationship: 'Enforces scope hierarchy via' },
      { term: 'Azure Policy', relationship: 'Inherits compliance rules downward from' },
      { term: 'Role-Based Access Control (RBAC)', relationship: 'Inherits access permissions across' },
      { term: 'Resource Locks (CanNotDelete & ReadOnly)', relationship: 'Applies deletion protection across' },
    ],
    examTrap:
      'A single Azure resource can exist in ONLY ONE Resource Group at a time, cannot contain nested Resource Groups, and deleting a Resource Group deletes all resources inside it!',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview',
    docsLabel: 'MS Learn: Management Groups & Scope Hierarchy',
    docsCitation: 'Microsoft Learn • Azure Governance Scope Levels',
  },
  {
    id: 'azure-resource-manager',
    term: 'Azure Resource Manager (ARM)',
    acronym: 'ARM',
    category: 'Core Architecture',
    pathId: 2,
    moduleId: 4,
    moduleTitle: 'Describe the Core Architectural Components of Azure',
    definition:
      'The deployment and management service layer for Azure. Every request made via the Azure Portal, Azure CLI, Azure PowerShell, REST APIs, or SDKs passes through ARM for authentication, authorization, and orchestration.',
    interrelatedSummary:
      'Executes declarative Infrastructure as Code (IaC) files written in Bicep or JSON ARM Templates and enforces RBAC, Policy, and Resource Locks.',
    relatedTerms: [
      { term: 'Bicep & ARM Templates', relationship: 'Executes declarative JSON/Bicep files from' },
      { term: 'Management Groups, Subscriptions & Resource Groups', relationship: 'Manages resources across' },
      { term: 'Azure Portal, Cloud Shell, CLI & PowerShell', relationship: 'Unified backend control plane for' },
    ],
    examTrap:
      'Whether you use the graphical Portal or command-line CLI, all management requests go through the exact same Azure Resource Manager API endpoint.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview',
    docsLabel: 'MS Learn: Azure Resource Manager Overview',
    docsCitation: 'Microsoft Learn • Azure Resource Manager (ARM)',
  },

  // =========================================================================
  // MODULE 5: AZURE COMPUTE AND NETWORKING SERVICES (PATH 2)
  // =========================================================================
  {
    id: 'azure-virtual-machines',
    term: 'Azure Virtual Machines (VMs)',
    acronym: 'VMs',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'On-demand, scalable IaaS compute resources (emulating physical computers with virtual CPU, RAM, storage disks, and NICs) giving you full control over the guest Windows or Linux operating system.',
    interrelatedSummary:
      'Can be grouped into Virtual Machine Scale Sets (VMSS) for horizontal auto-scaling, or deployed onto Azure Dedicated Hosts for hardware isolation.',
    relatedTerms: [
      { term: 'Infrastructure as a Service (IaaS)', relationship: 'Core compute offering of' },
      { term: 'Virtual Machine Scale Sets (VMSS)', relationship: 'Scaled horizontally in identical pools via' },
      { term: 'Azure Dedicated Host', relationship: 'Isolated on single-tenant physical servers via' },
      { term: 'Azure Hybrid Benefit', relationship: 'Discounted using existing Windows/SQL licenses via' },
    ],
    examTrap:
      'Stopping a VM from Inside the guest OS ("Shutdown") still leaves the hardware reserved and billed; you must "Stop (Deallocate)" via Azure to stop compute billing.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/overview',
    docsLabel: 'MS Learn: Azure Virtual Machines',
    docsCitation: 'Microsoft Learn • AZ-900 Module 5: Azure Compute',
  },
  {
    id: 'virtual-machine-scale-sets',
    term: 'Virtual Machine Scale Sets (VMSS)',
    acronym: 'VMSS',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'An Azure compute service that lets you create and manage a group of up to 1,000 identical, load-balanced Virtual Machines that automatically scale out or in based on demand or schedule.',
    interrelatedSummary:
      'Directly implements Horizontal Scaling and Elasticity for IaaS workloads, automatically integrating with Azure Load Balancer or Application Gateway.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Orchestrates identical pools of' },
      { term: 'Scalability (Vertical vs. Horizontal Scaling)', relationship: 'Implements horizontal scaling for' },
      { term: 'Elasticity vs. Cloud Agility', relationship: 'Delivers automatic elasticity in' },
    ],
    examTrap:
      'VMSS is for scaling IDENTICAL VMs automatically; Availability Sets only group 2+ VMs across Fault Domains and Update Domains without auto-scaling.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview',
    docsLabel: 'MS Learn: Virtual Machine Scale Sets',
    docsCitation: 'Microsoft Learn • VM Scale Sets Documentation',
  },
  {
    id: 'azure-app-service',
    term: 'Azure App Service',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'A fully managed Platform as a Service (PaaS) HTTP-based hosting service for web applications, REST APIs, and mobile backends supporting .NET, Java, Node.js, Python, and PHP.',
    interrelatedSummary:
      'Contrasts with Azure Virtual Machines (IaaS) by handling OS patching, load balancing, and SSL/TLS termination automatically.',
    relatedTerms: [
      { term: 'Platform as a Service (PaaS)', relationship: 'Primary managed web hosting service in' },
      { term: 'Serverless Computing (Azure Functions)', relationship: 'For full web apps, whereas event code uses' },
      { term: 'Application Insights', relationship: 'Monitored for live HTTP performance via' },
    ],
    examTrap:
      'Choose Azure App Service when a team wants to host a web app or REST API with built-in CI/CD deployment slots and zero OS maintenance.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/app-service/overview',
    docsLabel: 'MS Learn: Azure App Service Overview',
    docsCitation: 'Microsoft Learn • Azure App Service',
  },
  {
    id: 'containers-aci-vs-aks',
    term: 'Azure Container Instances (ACI) vs. Azure Kubernetes Service (AKS)',
    acronym: 'ACI / AKS',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'Containers package application code and dependencies without a guest OS. ACI runs isolated containers on-demand with per-second serverless billing; AKS provides full enterprise container orchestration, auto-scaling, and microservice cluster management.',
    interrelatedSummary:
      'Containers are more lightweight than Virtual Machines (which virtualize hardware and run a full OS per VM); containers virtualize the OS kernel.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'More lightweight and faster startup than' },
      { term: 'Serverless Computing (Azure Functions)', relationship: 'ACI shares per-second serverless billing with' },
      { term: 'Azure App Service', relationship: 'Can also host single web containers in' },
    ],
    examTrap:
      'Exam Distinction: "Fastest, simplest way to run a single container in Azure without managing servers or orchestration" = ACI. "Full multi-container orchestration, rolling upgrades, and cluster scaling" = AKS.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/aks/intro-kubernetes',
    docsLabel: 'MS Learn: Azure Kubernetes Service (AKS)',
    docsCitation: 'Microsoft Learn • Containers in Azure (ACI & AKS)',
  },
  {
    id: 'azure-virtual-desktop',
    term: 'Azure Virtual Desktop (AVD)',
    acronym: 'AVD',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'A desktop and application virtualization service running in the cloud that delivers full Windows 10 or Windows 11 desktops to remote users on any device.',
    interrelatedSummary:
      'Integrates with Microsoft Entra ID for multi-factor authentication and reduces hardware costs via Windows multi-session capabilities.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Runs pooled or personal session hosts on' },
      { term: 'Microsoft Entra ID', relationship: 'Authenticates remote desktop users via' },
    ],
    examTrap:
      'AVD is the ONLY service that supports multi-session Windows 10 / Windows 11 where multiple concurrent users share a single VM to reduce licensing and compute costs.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-desktop/overview',
    docsLabel: 'MS Learn: Azure Virtual Desktop',
    docsCitation: 'Microsoft Learn • Azure Virtual Desktop Overview',
  },
  {
    id: 'serverless-azure-functions',
    term: 'Serverless Computing (Azure Functions)',
    category: 'Compute',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'An event-driven, serverless compute service that executes small pieces of code ("functions") in response to triggers (HTTP requests, timers, queue messages) and scales automatically to zero when idle.',
    interrelatedSummary:
      'Exemplifies the Consumption-Based Model: billed strictly for execution time and number of executions rather than pre-allocated VM uptime.',
    relatedTerms: [
      { term: 'Consumption-Based Model', relationship: 'Billed only when code executes under' },
      { term: 'Platform as a Service (PaaS)', relationship: 'Event-driven evolution of' },
      { term: 'Azure App Service', relationship: 'Contrasts with continuously running web apps on' },
    ],
    examTrap:
      'Azure Functions is for stateless, short-lived, event-triggered code; Azure Logic Apps is for low-code/no-code visual workflow orchestration with 400+ connectors.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview',
    docsLabel: 'MS Learn: Azure Functions Overview',
    docsCitation: 'Microsoft Learn • Serverless & Azure Functions',
  },
  {
    id: 'virtual-network-and-peering',
    term: 'Azure Virtual Network (VNet) & VNet Peering',
    acronym: 'VNet',
    category: 'Networking',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'An Azure Virtual Network (VNet) is a logically isolated private network in Azure for your resources. VNet Peering connects two VNets (in the same or different regions) so resources communicate privately over the Microsoft backbone.',
    interrelatedSummary:
      'Secured at the subnet/NIC level using Network Security Groups (NSGs) and connected to on-premises networks via VPN Gateway or ExpressRoute.',
    relatedTerms: [
      { term: 'Network Security Group (NSG)', relationship: 'Filters inbound/outbound subnet traffic with' },
      { term: 'VPN Gateway', relationship: 'Connects over encrypted internet via' },
      { term: 'Azure ExpressRoute', relationship: 'Connects over dedicated private fiber via' },
    ],
    examTrap:
      'VNet Peering traffic NEVER traverses the public internet, and VNet Peering is NON-TRANSITIVE by default (if VNet A peers with B, and B peers with C, A cannot talk to C without explicit peering or a gateway).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview',
    docsLabel: 'MS Learn: Azure Virtual Network & Peering',
    docsCitation: 'Microsoft Learn • Azure Virtual Network Documentation',
  },
  {
    id: 'vpn-gateway',
    term: 'VPN Gateway',
    acronym: 'VPN',
    category: 'Networking',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'A specific type of virtual network gateway that sends encrypted network traffic between an Azure Virtual Network and an on-premises location (Site-to-Site) or individual client device (Point-to-Site) over the public internet.',
    interrelatedSummary:
      'Often used as a cost-effective hybrid connection or as a resilient backup failover path for an Azure ExpressRoute circuit.',
    relatedTerms: [
      { term: 'Azure ExpressRoute', relationship: 'Encrypted public-internet alternative to private' },
      { term: 'Azure Virtual Network (VNet) & VNet Peering', relationship: 'Deployed inside a dedicated gateway subnet of' },
    ],
    examTrap:
      'VPN Gateway uses IPsec/IKE encryption OVER THE PUBLIC INTERNET. If the exam question forbids public internet traversal, you must select Azure ExpressRoute instead.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways',
    docsLabel: 'MS Learn: What is Azure VPN Gateway?',
    docsCitation: 'Microsoft Learn • Azure VPN Gateway',
  },
  {
    id: 'azure-expressroute',
    term: 'Azure ExpressRoute',
    category: 'Networking',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'A dedicated, private connection between your on-premises infrastructure and Microsoft cloud services (Azure and Microsoft 365) facilitated by a connectivity provider—completely bypassing the public internet.',
    interrelatedSummary:
      'Delivers lower latency, higher reliability, and higher speeds (up to 100 Gbps) than a VPN Gateway for mission-critical hybrid cloud workloads.',
    relatedTerms: [
      { term: 'VPN Gateway', relationship: 'Provides dedicated private fiber unlike internet-based' },
      { term: 'Public, Private, and Hybrid Cloud Models', relationship: 'Enterprise backbone for' },
      { term: 'Azure Virtual Network (VNet) & VNet Peering', relationship: 'Links on-premises datacenters directly to' },
    ],
    examTrap:
      'ExpressRoute connections do NOT go over the public internet. Look for scenario keywords like "dedicated private line", "guaranteed bandwidth", or "strict regulatory ban on public internet".',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
    docsLabel: 'MS Learn: Azure ExpressRoute Introduction',
    docsCitation: 'Microsoft Learn • Azure ExpressRoute',
  },
  {
    id: 'network-security-group',
    term: 'Network Security Group (NSG) & Azure Firewall',
    acronym: 'NSG',
    category: 'Networking',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'An NSG is a basic Layer-4 packet filter that allows or denies network traffic to Azure VNet subnets or NICs based on 5-tuple rules (Source/Dest IP, Source/Dest Port, Protocol). Azure Firewall is a managed, cloud-native stateful Layer-4/Layer-7 perimeter firewall.',
    interrelatedSummary:
      'Forms the Network layer of Microsoft’s Defense-in-Depth security posture alongside Azure DDoS Protection.',
    relatedTerms: [
      { term: 'Azure Virtual Network (VNet) & VNet Peering', relationship: 'Attaches to subnets and NICs within' },
      { term: 'Defense-in-Depth & Zero Trust', relationship: 'Enforces network segmentation in' },
    ],
    examTrap:
      'NSGs are free basic subnet/NIC traffic filters; Azure DDoS Protection defends against volumetric distributed denial-of-service floods.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',
    docsLabel: 'MS Learn: Network Security Groups (NSGs)',
    docsCitation: 'Microsoft Learn • Azure Network Security Groups',
  },
  {
    id: 'azure-dns',
    term: 'Azure DNS & Private DNS',
    acronym: 'DNS',
    category: 'Networking',
    pathId: 2,
    moduleId: 5,
    moduleTitle: 'Describe Azure Compute and Networking Services',
    definition:
      'A hosting service for Domain Name System (DNS) domains that provides ultra-fast name resolution (translating human-readable domain names into IP addresses) using Microsoft Azure global infrastructure.',
    interrelatedSummary:
      'Azure Private DNS resolves internal domain names privately across linked Azure Virtual Networks without exposing records to the internet.',
    relatedTerms: [
      { term: 'Azure Virtual Network (VNet) & VNet Peering', relationship: 'Provides private name resolution inside' },
    ],
    examTrap:
      'You cannot purchase or register a new domain name directly through Azure DNS—Azure DNS hosts the DNS zone records for domains you already own.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/dns/dns-overview',
    docsLabel: 'MS Learn: What is Azure DNS?',
    docsCitation: 'Microsoft Learn • Azure DNS Overview',
  },

  // =========================================================================
  // MODULE 6: AZURE STORAGE SERVICES (PATH 2)
  // =========================================================================
  {
    id: 'storage-redundancy-lrs-zrs-grs-gzrs',
    term: 'Storage Redundancy (LRS, ZRS, GRS, GZRS)',
    acronym: 'LRS / ZRS / GRS / GZRS',
    category: 'Storage',
    pathId: 2,
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    definition:
      'Azure Storage automatically replicates data for durability: LRS (3 copies in 1 datacenter, 11 nines), ZRS (3 copies across 3 Availability Zones in 1 region, 12 nines), GRS (LRS in primary + LRS in secondary paired region, 16 nines), and GZRS (ZRS in primary + LRS in secondary region, 16 nines).',
    interrelatedSummary:
      'Directly links Azure Storage Accounts to Availability Zones (via ZRS) and Azure Region Pairs (via GRS/GZRS) for fault tolerance and disaster recovery.',
    relatedTerms: [
      { term: 'Availability Zones & Azure Regions', relationship: 'ZRS replicates synchronously across 3' },
      { term: 'Azure Region Pairs & Sovereign Regions', relationship: 'GRS/GZRS replicates asynchronously to' },
      { term: 'Azure Blob Storage & Access Tiers', relationship: 'Protects unstructured objects stored in' },
    ],
    examTrap:
      'LRS is the lowest-cost redundancy option (3 copies in a single datacenter), but it does NOT protect against a full datacenter fire/flood. GZRS provides the highest durability (16 nines) and availability.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
    docsLabel: 'MS Learn: Azure Storage Redundancy',
    docsCitation: 'Microsoft Learn • LRS, ZRS, GRS, and GZRS Redundancy',
  },
  {
    id: 'azure-blob-storage-tiers',
    term: 'Azure Blob Storage & Access Tiers (Hot, Cool, Cold, Archive)',
    category: 'Storage',
    pathId: 2,
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    definition:
      'Massively scalable object storage for unstructured data (images, video, backups, logs). Supports 4 access tiers: Hot (frequent access, highest storage cost, lowest access cost), Cool (30+ days), Cold (90+ days), and Archive (180+ days, offline tier with lowest storage cost and highest access/rehydration cost).',
    interrelatedSummary:
      'Contrasts with Azure Files (SMB/NFS shared folders) and Azure Disk Storage (block-level VHDs attached to VMs).',
    relatedTerms: [
      { term: 'Azure Files & Azure Disk Storage', relationship: 'Object storage alternative to SMB/Block in' },
      { term: 'Storage Redundancy (LRS, ZRS, GRS, GZRS)', relationship: 'Configured for durability using' },
      { term: 'AzCopy & Azure Storage Explorer', relationship: 'Uploaded and managed via' },
    ],
    examTrap:
      'Blobs in the Archive tier are OFFLINE and cannot be read directly—they must first be rehydrated to the Hot or Cool tier, which can take several hours.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
    docsLabel: 'MS Learn: Blob Storage Access Tiers',
    docsCitation: 'Microsoft Learn • Hot, Cool, Cold, and Archive Tiers',
  },
  {
    id: 'azure-files-and-disks',
    term: 'Azure Files & Azure Disk Storage',
    category: 'Storage',
    pathId: 2,
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    definition:
      'Azure Files offers fully managed cloud file shares accessible concurrently via industry-standard SMB and NFS protocols. Azure Disk Storage provides high-performance block-level managed virtual hard disks (Ultra, Premium SSD, Standard SSD, Standard HDD) for Azure Virtual Machines.',
    interrelatedSummary:
      'Azure Files pairs with Azure File Sync to cache cloud file shares on local Windows Servers; Azure Disk Storage attaches directly to Azure VMs.',
    relatedTerms: [
      { term: 'Azure Blob Storage & Access Tiers (Hot, Cool, Cold, Archive)', relationship: 'Provides SMB shares/block disks instead of object' },
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Mounts OS and data disks or SMB shares on' },
      { term: 'Azure Migrate & Azure Data Box', relationship: 'Populated during on-premises migrations via' },
    ],
    examTrap:
      'Exam Keyword Cue: "Lift-and-shift an app that requires shared network drive letters using SMB/NFS across multiple VMs" = Azure Files.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction',
    docsLabel: 'MS Learn: Introduction to Azure Files',
    docsCitation: 'Microsoft Learn • Azure Files & Managed Disks',
  },
  {
    id: 'azcopy-vs-storage-explorer',
    term: 'AzCopy, Azure Storage Explorer & Azure File Sync',
    category: 'Storage',
    pathId: 2,
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    definition:
      'AzCopy is a high-performance command-line utility for copying blobs or files to/from Storage Accounts. Azure Storage Explorer is a standalone graphical (GUI) app for Windows, macOS, and Linux to manage storage data. Azure File Sync centralizes files in Azure Files while keeping local cache performance on Windows Server.',
    interrelatedSummary:
      'Provides day-to-day data movement tools complementing large-scale migration tools like Azure Data Box and Azure Migrate.',
    relatedTerms: [
      { term: 'Azure Blob Storage & Access Tiers (Hot, Cool, Cold, Archive)', relationship: 'Copies and inspects objects in' },
      { term: 'Azure Files & Azure Disk Storage', relationship: 'Synchronizes Windows Server shares with' },
      { term: 'Azure Migrate & Azure Data Box', relationship: 'Used for online file transfers unlike offline' },
    ],
    examTrap:
      'AzCopy = Command-line scriptable tool. Azure Storage Explorer = Graphical desktop application (GUI).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10',
    docsLabel: 'MS Learn: Get Started with AzCopy',
    docsCitation: 'Microsoft Learn • Data Movement Utilities in Azure',
  },
  {
    id: 'azure-migrate-and-databox',
    term: 'Azure Migrate & Azure Data Box',
    category: 'Storage',
    pathId: 2,
    moduleId: 6,
    moduleTitle: 'Describe Azure Storage Services',
    definition:
      'Azure Migrate is a centralized hub to discover, assess, right-size, and migrate on-premises servers, databases, and web apps to Azure. Azure Data Box is a rugged, encrypted physical hardware appliance shipped by Microsoft to transfer terabytes/petabytes of data offline when network bandwidth is limited.',
    interrelatedSummary:
      'Used alongside the Total Cost of Ownership (TCO) Calculator when planning datacenter exits and migrating into Azure VMs and Storage.',
    relatedTerms: [
      { term: 'Total Cost of Ownership (TCO) Calculator', relationship: 'Validates migration business case with' },
      { term: 'AzCopy, Azure Storage Explorer & Azure File Sync', relationship: 'Offline petabyte alternative to online' },
    ],
    examTrap:
      'When a scenario mentions "40 TB to 1 PB of data" and "slow or expensive internet bandwidth", select Azure Data Box (physical offline transfer).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/databox/data-box-overview',
    docsLabel: 'MS Learn: Azure Data Box & Azure Migrate',
    docsCitation: 'Microsoft Learn • Azure Migration Tools',
  },

  // =========================================================================
  // MODULE 7: AZURE IDENTITY, ACCESS, AND SECURITY (PATH 2)
  // =========================================================================
  {
    id: 'microsoft-entra-id',
    term: 'Microsoft Entra ID (formerly Azure Active Directory)',
    acronym: 'Entra ID',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'Microsoft’s cloud-based identity and access management (IAM) service that enables employees and guests to sign in and access Microsoft 365, the Azure Portal, and thousands of SaaS applications.',
    interrelatedSummary:
      'Acts as the identity foundation for Single Sign-On (SSO), Multi-Factor Authentication (MFA), Conditional Access, and Azure RBAC.',
    relatedTerms: [
      { term: 'Single Sign-On (SSO) & Multi-Factor Authentication (MFA)', relationship: 'Verifies user identities via' },
      { term: 'Conditional Access', relationship: 'Enforces Zero Trust signal policies in' },
      { term: 'Role-Based Access Control (RBAC)', relationship: 'Authorizes Azure resource actions via' },
    ],
    examTrap:
      'Microsoft Entra ID is primarily for cloud HTTP/HTTPS authentication (SAML, OAuth, OpenID Connect), whereas classic on-premises Active Directory uses Kerberos/NTLM and Group Policy (GPOs).',
    docsUrl: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
    docsLabel: 'MS Learn: What is Microsoft Entra ID?',
    docsCitation: 'Microsoft Entra Documentation • Identity Fundamentals',
  },
  {
    id: 'sso-and-mfa',
    term: 'Single Sign-On (SSO) & Multi-Factor Authentication (MFA)',
    acronym: 'SSO / MFA',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'SSO enables users to authenticate once with a single credential to access multiple applications without re-entering passwords. MFA strengthens Authentication (AuthN) by requiring two or more verification factors: something you know (password), something you have (phone/token), or something you are (biometrics).',
    interrelatedSummary:
      'Dynamically enforced by Microsoft Entra Conditional Access policies whenever risky sign-in signals are detected.',
    relatedTerms: [
      { term: 'Microsoft Entra ID (formerly Azure Active Directory)', relationship: 'Built-in authentication capabilities of' },
      { term: 'Conditional Access', relationship: 'Triggered dynamically based on risk signals by' },
      { term: 'Defense-in-Depth & Zero Trust', relationship: 'Core pillar of "Verify Explicitly" in' },
    ],
    examTrap:
      'Authentication (AuthN) proves WHO you are (via MFA/Passwordless); Authorization (AuthZ) determines WHAT you are allowed to do (via RBAC).',
    docsUrl: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mfa-howitworks',
    docsLabel: 'MS Learn: Multi-Factor Authentication & SSO',
    docsCitation: 'Microsoft Entra Documentation • Authentication Concepts',
  },
  {
    id: 'conditional-access',
    term: 'Conditional Access',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'A tool used by Microsoft Entra ID to bring signals together (user/group membership, IP location, device compliance state, application, and real-time sign-in risk) to make "If-Then" access decisions and enforce organizational policies.',
    interrelatedSummary:
      'Operationalizes the Zero Trust model by requiring MFA or compliant devices before granting access to Azure or Microsoft 365.',
    relatedTerms: [
      { term: 'Microsoft Entra ID (formerly Azure Active Directory)', relationship: 'Policy engine inside' },
      { term: 'Single Sign-On (SSO) & Multi-Factor Authentication (MFA)', relationship: 'Requires step-up verification via' },
      { term: 'Defense-in-Depth & Zero Trust', relationship: 'Implements signal-driven verification for' },
    ],
    examTrap:
      'Whenever an exam scenario says "Prompt for MFA ONLY when a user signs in from an untrusted location or unmanaged device", the answer is Conditional Access.',
    docsUrl: 'https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview',
    docsLabel: 'MS Learn: What is Conditional Access?',
    docsCitation: 'Microsoft Entra Documentation • Conditional Access',
  },
  {
    id: 'rbac',
    term: 'Role-Based Access Control (RBAC)',
    acronym: 'RBAC',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'An authorization system built on Azure Resource Manager that provides fine-grained access management to Azure resources by assigning roles (Owner, Contributor, Reader) to users, groups, or service principals at a specific scope.',
    interrelatedSummary:
      'Frequently contrasted with Azure Policy: RBAC governs USER ACTIONS (who can do what), whereas Azure Policy governs RESOURCE PROPERTIES (what configurations are allowed).',
    relatedTerms: [
      { term: 'Azure Policy', relationship: 'Controls user actions whereas resource rules use' },
      { term: 'Resource Locks (CanNotDelete & ReadOnly)', relationship: 'Works alongside accidental deletion guards in' },
      { term: 'Management Groups, Subscriptions & Resource Groups', relationship: 'Assigned and inherited across scopes in' },
    ],
    examTrap:
      'Contributor role can create and manage all resources but CANNOT grant access to other users; Owner role has full access INCLUDING delegating access to others.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
    docsLabel: 'MS Learn: What is Azure RBAC?',
    docsCitation: 'Microsoft Learn • Azure Role-Based Access Control',
  },
  {
    id: 'defense-in-depth-and-zero-trust',
    term: 'Defense-in-Depth & Zero Trust',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'Zero Trust is a security model based on three principles: Verify explicitly, Use least-privilege access, and Assume breach. Defense-in-Depth uses 7 concentric layers (Physical → Identity & Access → Perimeter → Network → Compute → Application → Data) to slow down attackers.',
    interrelatedSummary:
      'Connects Microsoft Entra ID (Identity layer), Azure DDoS/Firewall (Perimeter), NSGs (Network), Defender for Cloud (Posture), and Azure Key Vault (Data).',
    relatedTerms: [
      { term: 'Conditional Access', relationship: 'Enforces Zero Trust "Verify Explicitly" via' },
      { term: 'Role-Based Access Control (RBAC)', relationship: 'Enforces "Least Privilege" via' },
      { term: 'Network Security Group (NSG) & Azure Firewall', relationship: 'Secures Perimeter and Network layers via' },
    ],
    examTrap:
      'Zero Trust never trusts a request simply because it originates from inside the corporate firewall ("Never trust, always verify").',
    docsUrl: 'https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview',
    docsLabel: 'MS Learn: Zero Trust Security Center',
    docsCitation: 'Microsoft Security Documentation • Zero Trust & Defense-in-Depth',
  },
  {
    id: 'defender-for-cloud-and-key-vault',
    term: 'Microsoft Defender for Cloud & Azure Key Vault',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'Microsoft Defender for Cloud is a Cloud Security Posture Management (CSPM) and Cloud Workload Protection Platform (CWPP) that tracks your Secure Score across Azure, on-premises, and multi-cloud. Azure Key Vault is a centralized cloud service for storing secrets (passwords, API keys), cryptographic keys, and SSL/TLS certificates.',
    interrelatedSummary:
      'Defender for Cloud works alongside Azure Arc to protect hybrid servers and integrates with Azure Policy to audit regulatory compliance.',
    relatedTerms: [
      { term: 'Azure Arc', relationship: 'Extends Defender posture protection to hybrid servers via' },
      { term: 'Azure Advisor', relationship: 'Feeds security recommendations into' },
      { term: 'Azure Policy', relationship: 'Audits security benchmark compliance using' },
    ],
    examTrap:
      'Never hardcode database connection strings, API keys, or certificates in source code—always store them in Azure Key Vault.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction',
    docsLabel: 'MS Learn: Microsoft Defender for Cloud & Key Vault',
    docsCitation: 'Microsoft Learn • Cloud Security Posture & Key Vault',
  },
  {
    id: 'azure-dedicated-host',
    term: 'Azure Dedicated Host',
    category: 'Identity & Security',
    pathId: 2,
    moduleId: 7,
    moduleTitle: 'Describe Azure Identity, Access, and Security',
    definition:
      'A service that provides physical servers—able to host one or more Azure Virtual Machines—dedicated exclusively to your organization and not shared with any other customers.',
    interrelatedSummary:
      'Pairs with Azure Hybrid Benefit to let enterprises bring their own per-core Windows Server and SQL Server licenses while controlling host maintenance windows.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Provides single-tenant physical hardware for' },
      { term: 'Azure Hybrid Benefit', relationship: 'Maximizes BYOL server core licensing with' },
    ],
    examTrap:
      'Choose Azure Dedicated Host when a compliance requirement mandates "physical server isolation not shared with other cloud tenants" and "customer control over host OS maintenance scheduling".',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/dedicated-hosts',
    docsLabel: 'MS Learn: Azure Dedicated Hosts',
    docsCitation: 'Microsoft Learn • Azure Dedicated Host Overview',
  },

  // =========================================================================
  // MODULE 8: COST MANAGEMENT IN AZURE (PATH 3)
  // =========================================================================
  {
    id: 'pricing-calculator-vs-tco-calculator',
    term: 'Azure Pricing Calculator vs. Total Cost of Ownership (TCO) Calculator',
    acronym: 'TCO',
    category: 'Cost Management',
    pathId: 3,
    moduleId: 8,
    moduleTitle: 'Describe Cost Management in Azure',
    definition:
      'The Azure Pricing Calculator estimates the monthly cost of provisioning specific Azure cloud resources (VMs, Storage, Bandwidth). The TCO Calculator compares the total cost of running your existing on-premises datacenter (electricity, cooling, hardware, IT labor) against migrating to Azure over 1 to 5 years.',
    interrelatedSummary:
      'Used before deployment, whereas Microsoft Cost Management + Billing tracks actual spend and budgets after resources are running.',
    relatedTerms: [
      { term: 'Microsoft Cost Management & Budgets', relationship: 'Estimates upfront, whereas actual spend is tracked by' },
      { term: 'Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx)', relationship: 'Quantifies CapEx-to-OpEx savings in' },
      { term: 'Azure Reservations & Azure Hybrid Benefit', relationship: 'Models 1-year/3-year discounts inside' },
    ],
    examTrap:
      'Exam Keyword Cue: "Estimate monthly bill for 5 new Azure VMs and 2 TB Blob Storage" = Pricing Calculator. "Build a return-on-investment (ROI) savings report for executives to justify migrating from on-premises to Azure" = TCO Calculator.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-overview',
    docsLabel: 'MS Learn: Azure Pricing & TCO Calculators',
    docsCitation: 'Microsoft Learn • AZ-900 Module 8: Cost Management',
  },
  {
    id: 'microsoft-cost-management-and-budgets',
    term: 'Microsoft Cost Management & Budgets',
    category: 'Cost Management',
    pathId: 3,
    moduleId: 8,
    moduleTitle: 'Describe Cost Management in Azure',
    definition:
      'A native Azure tool suite that analyzes historical and forecasted cloud spend, visualizes cost breakdowns by resource/tag, sets spending Budgets, and triggers automated email or Action Group alerts at configurable thresholds.',
    interrelatedSummary:
      'Uses Azure Tags (e.g., CostCenter: Marketing) to group and allocate cloud spending across departments.',
    relatedTerms: [
      { term: 'Azure Tags', relationship: 'Groups departmental spend using metadata from' },
      { term: 'Azure Pricing Calculator vs. Total Cost of Ownership (TCO) Calculator', relationship: 'Monitors live spend after estimating with' },
      { term: 'Azure Advisor', relationship: 'Receives right-sizing cost recommendations from' },
    ],
    examTrap:
      'Remember that INBOUND data transfer (ingress into Azure) is always FREE, whereas OUTBOUND data transfer (egress leaving Azure regions) is billed per GB.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview-cost-management',
    docsLabel: 'MS Learn: Microsoft Cost Management Overview',
    docsCitation: 'Microsoft Learn • Cost Management + Billing',
  },
  {
    id: 'azure-reservations-and-hybrid-benefit',
    term: 'Azure Reservations & Azure Hybrid Benefit',
    category: 'Cost Management',
    pathId: 3,
    moduleId: 8,
    moduleTitle: 'Describe Cost Management in Azure',
    definition:
      'Azure Reservations save up to 72% over pay-as-you-go pricing by committing to 1-year or 3-year plans for predictable compute/database workloads. Azure Hybrid Benefit lets you reuse existing on-premises Windows Server and SQL Server licenses with Software Assurance in Azure.',
    interrelatedSummary:
      'Recommended automatically by Azure Advisor when it detects continuously running pay-as-you-go Virtual Machines.',
    relatedTerms: [
      { term: 'Azure Virtual Machines (VMs)', relationship: 'Reduces long-term compute bills for' },
      { term: 'Azure Advisor', relationship: 'Automatically recommends purchasing' },
      { term: 'Microsoft Cost Management & Budgets', relationship: 'Tracked for utilization efficiency in' },
    ],
    examTrap:
      'Reservations and Spot VMs can both reduce compute cost, but Spot VMs can be evicted at any time with 30 seconds notice—use Reservations for steady, predictable 24/7 production workloads.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/reservations/save-compute-costs-reservations',
    docsLabel: 'MS Learn: Save Costs with Azure Reservations',
    docsCitation: 'Microsoft Learn • Reservations & Hybrid Benefit',
  },
  {
    id: 'azure-tags',
    term: 'Azure Tags',
    category: 'Cost Management',
    pathId: 3,
    moduleId: 8,
    moduleTitle: 'Describe Cost Management in Azure',
    definition:
      'Name-value pairs of metadata (e.g., `Environment: Production`, `Department: Finance`) applied to Azure resources, resource groups, or subscriptions to logically organize assets and track departmental billing.',
    interrelatedSummary:
      'Enforced automatically via Azure Policy (e.g., "Require a CostCenter tag on all resources" or "Inherit tags from the parent Resource Group").',
    relatedTerms: [
      { term: 'Microsoft Cost Management & Budgets', relationship: 'Enables departmental chargeback reports in' },
      { term: 'Azure Policy', relationship: 'Enforced or auto-inherited across resources via' },
      { term: 'Management Groups, Subscriptions & Resource Groups', relationship: 'Applied to resources across' },
    ],
    examTrap:
      'CRITICAL EXAM TRAP: Tags placed on a Resource Group or Subscription are NOT inherited by child resources by default! You must use an Azure Policy if you want child resources to automatically inherit tags.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources',
    docsLabel: 'MS Learn: Use Tags to Organize Azure Resources',
    docsCitation: 'Microsoft Learn • Resource Tagging & Cost Allocation',
  },

  // =========================================================================
  // MODULE 9: FEATURES AND TOOLS FOR GOVERNANCE AND COMPLIANCE (PATH 3)
  // =========================================================================
  {
    id: 'azure-policy',
    term: 'Azure Policy',
    category: 'Governance & Compliance',
    pathId: 3,
    moduleId: 9,
    moduleTitle: 'Describe Features and Tools in Azure for Governance and Compliance',
    definition:
      'A governance service in Azure that uses policy definitions and initiatives to evaluate resource properties against corporate compliance rules (e.g., restricting allowed Azure regions, enforcing allowed VM SKUs, or requiring resource tags).',
    interrelatedSummary:
      'Works alongside RBAC and Resource Locks: RBAC controls WHO can act; Azure Policy controls WHAT resource configurations are compliant; Locks prevent deletion/modification.',
    relatedTerms: [
      { term: 'Role-Based Access Control (RBAC)', relationship: 'Audits resource properties while user access uses' },
      { term: 'Resource Locks (CanNotDelete & ReadOnly)', relationship: 'Complements deletion protection in' },
      { term: 'Management Groups, Subscriptions & Resource Groups', relationship: 'Assigned at scope and inherited down' },
      { term: 'Azure Tags', relationship: 'Can enforce or auto-append' },
    ],
    examTrap:
      'Even if a user has the RBAC Owner role on a subscription, an Azure Policy with a "Deny" effect will block them from creating a non-compliant resource (e.g., in an unapproved region).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
    docsLabel: 'MS Learn: What is Azure Policy?',
    docsCitation: 'Microsoft Learn • Azure Policy Governance',
  },
  {
    id: 'resource-locks',
    term: 'Resource Locks (CanNotDelete & ReadOnly)',
    category: 'Governance & Compliance',
    pathId: 3,
    moduleId: 9,
    moduleTitle: 'Describe Features and Tools in Azure for Governance and Compliance',
    definition:
      'Management locks applied at the Subscription, Resource Group, or Resource scope to prevent accidental deletion or modification. `CanNotDelete` allows reading and modifying a resource, but blocks deletion. `ReadOnly` allows reading only, blocking both modification and deletion.',
    interrelatedSummary:
      'Overrides RBAC permissions (even for Subscription Owners) until the lock is explicitly removed by an Owner or User Access Administrator.',
    relatedTerms: [
      { term: 'Role-Based Access Control (RBAC)', relationship: 'Overrides deletion permissions granted by' },
      { term: 'Azure Policy', relationship: 'Can be audited for presence on critical resources via' },
      { term: 'Management Groups, Subscriptions & Resource Groups', relationship: 'Inherited by child resources inside' },
    ],
    examTrap:
      'Placing a `ReadOnly` lock on a Resource Group containing a Virtual Machine prevents users from starting or stopping the VM because starting/stopping requires an ARM POST operation!',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources',
    docsLabel: 'MS Learn: Lock Resources to Prevent Changes',
    docsCitation: 'Microsoft Learn • Azure Resource Locks',
  },
  {
    id: 'microsoft-purview-and-service-trust-portal',
    term: 'Microsoft Purview & Service Trust Portal',
    category: 'Governance & Compliance',
    pathId: 3,
    moduleId: 9,
    moduleTitle: 'Describe Features and Tools in Azure for Governance and Compliance',
    definition:
      'Microsoft Purview is a unified data governance, risk, and compliance family (data discovery, sensitivity classification, lineage, eDiscovery, and Compliance Manager). The Microsoft Service Trust Portal provides public access to independent third-party audit reports (ISO, SOC, NIST, GDPR, FedRAMP).',
    interrelatedSummary:
      'Helps legal, compliance, and data security teams verify how Microsoft meets its side of the Shared Responsibility Model.',
    relatedTerms: [
      { term: 'Shared Responsibility Model', relationship: 'Provides third-party audit proof of Microsoft controls in' },
      { term: 'Azure Policy', relationship: 'Maps regulatory standards alongside' },
    ],
    examTrap:
      'Exam Keyword Cue: "Download independent SOC 1/2/3 or ISO 27001 audit reports and compliance whitepapers" = Service Trust Portal. "Classify, catalog, and govern sensitive data across hybrid sources" = Microsoft Purview.',
    docsUrl: 'https://learn.microsoft.com/en-us/purview/purview',
    docsLabel: 'MS Learn: Microsoft Purview & Compliance',
    docsCitation: 'Microsoft Learn • Governance & Service Trust Portal',
  },

  // =========================================================================
  // MODULE 10: MANAGING AND DEPLOYING AZURE RESOURCES (PATH 3)
  // =========================================================================
  {
    id: 'azure-portal-cloud-shell-cli-powershell',
    term: 'Azure Portal, Cloud Shell, CLI & PowerShell',
    category: 'Deployment & Management',
    pathId: 3,
    moduleId: 10,
    moduleTitle: 'Describe Features and Tools for Managing and Deploying Azure Resources',
    definition:
      'The administrative interfaces for Azure: Azure Portal (web GUI), Azure Cloud Shell (browser-based authenticated Bash/PowerShell shell backed by Azure Files), Azure CLI (`az` cross-platform commands), and Azure PowerShell (`Az` cmdlets).',
    interrelatedSummary:
      'All four tools send authenticated requests to the Azure Resource Manager (ARM) control plane.',
    relatedTerms: [
      { term: 'Azure Resource Manager (ARM)', relationship: 'Sends all management API requests to' },
      { term: 'Bicep & ARM Templates', relationship: 'Used to deploy declarative templates from' },
    ],
    examTrap:
      'Azure Cloud Shell runs directly in your browser, comes pre-authenticated, and requires an Azure Files storage share to persist your scripts across sessions.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/cloud-shell/overview',
    docsLabel: 'MS Learn: Azure Cloud Shell Overview',
    docsCitation: 'Microsoft Learn • Azure Management Interfaces',
  },
  {
    id: 'azure-arc',
    term: 'Azure Arc',
    category: 'Deployment & Management',
    pathId: 3,
    moduleId: 10,
    moduleTitle: 'Describe Features and Tools for Managing and Deploying Azure Resources',
    definition:
      'A bridge that extends the Azure control plane (Azure Resource Manager, Azure Policy, RBAC, Tags, and Microsoft Defender for Cloud) to servers, Kubernetes clusters, and data services running on-premises or in other clouds (AWS, GCP).',
    interrelatedSummary:
      'Unifies governance across Hybrid and Multi-Cloud environments so non-Azure machines appear as native resources inside an Azure Resource Group.',
    relatedTerms: [
      { term: 'Public, Private, and Hybrid Cloud Models', relationship: 'Centralizes hybrid and multi-cloud governance for' },
      { term: 'Azure Policy', relationship: 'Projects guest configuration policies onto non-Azure servers via' },
      { term: 'Microsoft Defender for Cloud & Azure Key Vault', relationship: 'Enrolls on-premises servers into security monitoring with' },
    ],
    examTrap:
      'Whenever an exam question asks how to "apply Azure Policy, Tags, and RBAC to Windows/Linux servers running on-premises or in AWS/Google Cloud", the answer is Azure Arc.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-arc/overview',
    docsLabel: 'MS Learn: Azure Arc Overview',
    docsCitation: 'Microsoft Learn • Hybrid Management with Azure Arc',
  },
  {
    id: 'bicep-and-arm-templates',
    term: 'Bicep & ARM Templates (Infrastructure as Code)',
    acronym: 'IaC',
    category: 'Deployment & Management',
    pathId: 3,
    moduleId: 10,
    moduleTitle: 'Describe Features and Tools for Managing and Deploying Azure Resources',
    definition:
      'Declarative Infrastructure as Code (IaC) files that define the target state of Azure resources. ARM Templates use JSON syntax; Azure Bicep uses a cleaner, domain-specific language (DSL) that compiles down to standard ARM JSON.',
    interrelatedSummary:
      'Submitted to Azure Resource Manager (ARM) for idempotent, repeatable deployments across Dev, Test, and Production environments.',
    relatedTerms: [
      { term: 'Azure Resource Manager (ARM)', relationship: 'Parsed and orchestrated in parallel by' },
      { term: 'Elasticity vs. Cloud Agility', relationship: 'Increases deployment speed and repeatability for' },
    ],
    examTrap:
      'ARM Templates and Bicep are DECLARATIVE (you state WHAT resources you want, not step-by-step imperative commands) and IDEMPOTENT (running the same template repeatedly yields the exact same state).',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview',
    docsLabel: 'MS Learn: What is Bicep & ARM Templates?',
    docsCitation: 'Microsoft Learn • Infrastructure as Code in Azure',
  },

  // =========================================================================
  // MODULE 11: MONITORING TOOLS IN AZURE (PATH 3)
  // =========================================================================
  {
    id: 'azure-advisor',
    term: 'Azure Advisor',
    category: 'Monitoring & Advisory',
    pathId: 3,
    moduleId: 11,
    moduleTitle: 'Describe Monitoring Tools in Azure',
    definition:
      'A free, personalized cloud consultant that analyzes your resource configurations and usage telemetry to provide actionable recommendations across 5 Well-Architected pillars: Reliability, Security, Performance, Cost, and Operational Excellence.',
    interrelatedSummary:
      'Aggregates cost-saving right-sizing tips for Microsoft Cost Management and security posture tips from Microsoft Defender for Cloud.',
    relatedTerms: [
      { term: 'Microsoft Cost Management & Budgets', relationship: 'Surfaces idle VM right-sizing and Reservation tips for' },
      { term: 'Microsoft Defender for Cloud & Azure Key Vault', relationship: 'Integrates security recommendations from' },
      { term: 'Azure Monitor & Log Analytics', relationship: 'Analyzes resource telemetry collected by' },
    ],
    examTrap:
      'Memorize all 5 Azure Advisor categories: Reliability (formerly High Availability), Security, Performance, Cost, and Operational Excellence.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/advisor/advisor-overview',
    docsLabel: 'MS Learn: Introduction to Azure Advisor',
    docsCitation: 'Microsoft Learn • Azure Advisor Documentation',
  },
  {
    id: 'azure-service-health',
    term: 'Azure Service Health (Status vs. Service Health vs. Resource Health)',
    category: 'Monitoring & Advisory',
    pathId: 3,
    moduleId: 11,
    moduleTitle: 'Describe Monitoring Tools in Azure',
    definition:
      'A suite of three health experiences: (1) Azure Status shows a global overview of all Azure services worldwide; (2) Azure Service Health provides a personalized view of outages and planned maintenance affecting YOUR specific subscriptions and regions; (3) Azure Resource Health diagnoses the current/past health of a SINGLE specific resource (e.g., one VM).',
    interrelatedSummary:
      'Uses Azure Monitor Action Groups to send automated SMS, email, or webhook alerts when an Azure platform outage or maintenance event impacts your subscription.',
    relatedTerms: [
      { term: 'Azure Monitor & Log Analytics', relationship: 'Triggers outage notifications using Action Groups in' },
      { term: 'Availability Zones & Azure Regions', relationship: 'Tracks regional and zonal service incidents across' },
    ],
    examTrap:
      'Classic 3-Way Exam Question: Global public status page = Azure Status. Personalized view of YOUR subscriptions/regions + Root Cause Analysis (RCA) = Azure Service Health. Single VM/SQL instance health = Resource Health.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/service-health/overview',
    docsLabel: 'MS Learn: What is Azure Service Health?',
    docsCitation: 'Microsoft Learn • Azure Service Health Overview',
  },
  {
    id: 'azure-monitor-and-log-analytics',
    term: 'Azure Monitor & Log Analytics',
    category: 'Monitoring & Advisory',
    pathId: 3,
    moduleId: 11,
    moduleTitle: 'Describe Monitoring Tools in Azure',
    definition:
      'Azure Monitor is the comprehensive observability platform that collects, analyzes, and acts on Metrics (real-time numerical time-series data) and Logs (event/diagnostic records). Log Analytics is the web tool in the Azure Portal used to write and run Kusto Query Language (KQL) queries against collected log data.',
    interrelatedSummary:
      'Powers Application Insights (APM), VM Scale Set auto-scaling triggers, and Azure Service Health alerts.',
    relatedTerms: [
      { term: 'Application Insights', relationship: 'Hosts application performance telemetry for' },
      { term: 'Virtual Machine Scale Sets (VMSS)', relationship: 'Triggers CPU/Memory autoscale rules on' },
      { term: 'Azure Service Health (Status vs. Service Health vs. Resource Health)', relationship: 'Delivers platform alert notifications for' },
    ],
    examTrap:
      'Metrics are lightweight numerical values for real-time alerting; Logs store rich structured event history queried using KQL in Log Analytics.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
    docsLabel: 'MS Learn: Azure Monitor Overview',
    docsCitation: 'Microsoft Learn • Azure Monitor & Log Analytics',
  },
  {
    id: 'application-insights',
    term: 'Application Insights',
    acronym: 'APM',
    category: 'Monitoring & Advisory',
    pathId: 3,
    moduleId: 11,
    moduleTitle: 'Describe Monitoring Tools in Azure',
    definition:
      'An extensible Application Performance Management (APM) feature of Azure Monitor for developers and DevOps engineers that monitors live web applications—detecting HTTP response anomalies, failed requests, dependency latency, and user session analytics.',
    interrelatedSummary:
      'Integrates seamlessly with Azure App Service, Azure Functions, and AKS microservices while storing telemetry in a Log Analytics workspace.',
    relatedTerms: [
      { term: 'Azure Monitor & Log Analytics', relationship: 'Specialized APM feature built on top of' },
      { term: 'Azure App Service', relationship: 'Monitors live web request latency and exceptions in' },
    ],
    examTrap:
      'If a scenario asks to "measure HTTP request rates, response times, failure rates, and SQL dependency latency inside a live web application", choose Application Insights.',
    docsUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview',
    docsLabel: 'MS Learn: Application Insights Overview',
    docsCitation: 'Microsoft Learn • Application Performance Management (APM)',
  },
];

/**
 * Helper utility that resolves any Azure service term, concept, or module ID
 * to a verified, working official Microsoft Learn documentation URL and label.
 */
export function resolveAzureDocsLink(
  termOrTitle: string,
  moduleId?: number
): { url: string; label: string; glossaryId?: string } {
  const query = (termOrTitle || '').toLowerCase().trim();

  // 1. Direct or partial match against AZURE_GLOSSARY_TERMS
  const matched = AZURE_GLOSSARY_TERMS.find((item) => {
    const tLower = item.term.toLowerCase();
    const aLower = (item.acronym || '').toLowerCase();
    return (
      tLower.includes(query) ||
      query.includes(tLower) ||
      (aLower && (query === aLower || query.includes(aLower)))
    );
  });

  if (matched) {
    return {
      url: matched.docsUrl,
      label: matched.docsLabel,
      glossaryId: matched.id,
    };
  }

  // 2. Keyword-based fallback map for all common Azure services
  if (query.includes('availability zone') || query.includes('region')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
      label: 'MS Learn: Regions & Availability Zones',
      glossaryId: 'azure-regions-and-availability-zones',
    };
  }
  if (query.includes('expressroute')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction',
      label: 'MS Learn: Azure ExpressRoute',
      glossaryId: 'azure-expressroute',
    };
  }
  if (query.includes('vpn')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways',
      label: 'MS Learn: Azure VPN Gateway',
      glossaryId: 'vpn-gateway',
    };
  }
  if (query.includes('vnet') || query.includes('virtual network') || query.includes('peering')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview',
      label: 'MS Learn: Virtual Networks',
      glossaryId: 'virtual-network-and-peering',
    };
  }
  if (query.includes('nsg') || query.includes('network security') || query.includes('firewall')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',
      label: 'MS Learn: Network Security Groups',
      glossaryId: 'network-security-group',
    };
  }
  if (query.includes('blob') || query.includes('archive') || query.includes('tier')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
      label: 'MS Learn: Azure Blob Storage',
      glossaryId: 'azure-blob-storage-tiers',
    };
  }
  if (query.includes('lrs') || query.includes('zrs') || query.includes('grs') || query.includes('redundancy')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
      label: 'MS Learn: Storage Redundancy',
      glossaryId: 'storage-redundancy-lrs-zrs-grs-gzrs',
    };
  }
  if (query.includes('entra') || query.includes('active directory')) {
    return {
      url: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
      label: 'MS Learn: Microsoft Entra ID',
      glossaryId: 'microsoft-entra-id',
    };
  }
  if (query.includes('conditional access')) {
    return {
      url: 'https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview',
      label: 'MS Learn: Conditional Access',
      glossaryId: 'conditional-access',
    };
  }
  if (query.includes('rbac') || query.includes('role-based')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
      label: 'MS Learn: Azure RBAC',
      glossaryId: 'rbac',
    };
  }
  if (query.includes('policy')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
      label: 'MS Learn: Azure Policy',
      glossaryId: 'azure-policy',
    };
  }
  if (query.includes('lock') || query.includes('cannotdelete') || query.includes('readonly')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources',
      label: 'MS Learn: Resource Locks',
      glossaryId: 'resource-locks',
    };
  }
  if (query.includes('cost') || query.includes('tco') || query.includes('pricing')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview-cost-management',
      label: 'MS Learn: Cost Management',
      glossaryId: 'microsoft-cost-management-and-budgets',
    };
  }
  if (query.includes('arc')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/azure-arc/overview',
      label: 'MS Learn: Azure Arc',
      glossaryId: 'azure-arc',
    };
  }
  if (query.includes('bicep') || query.includes('arm template')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview',
      label: 'MS Learn: Bicep & ARM Templates',
      glossaryId: 'bicep-and-arm-templates',
    };
  }
  if (query.includes('advisor')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/advisor/advisor-overview',
      label: 'MS Learn: Azure Advisor',
      glossaryId: 'azure-advisor',
    };
  }
  if (query.includes('service health') || query.includes('resource health')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/service-health/overview',
      label: 'MS Learn: Azure Service Health',
      glossaryId: 'azure-service-health',
    };
  }
  if (query.includes('monitor') || query.includes('log analytics') || query.includes('insights')) {
    return {
      url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
      label: 'MS Learn: Azure Monitor',
      glossaryId: 'azure-monitor-and-log-analytics',
    };
  }

  // 3. Module-level fallback
  const moduleMatch = AZURE_GLOSSARY_TERMS.find((item) => item.moduleId === moduleId);
  if (moduleMatch) {
    return {
      url: moduleMatch.docsUrl,
      label: moduleMatch.docsLabel,
      glossaryId: moduleMatch.id,
    };
  }

  return {
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
    label: 'MS Learn: AZ-900 Official Study Guide',
  };
}
