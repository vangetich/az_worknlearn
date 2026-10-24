export interface FrequentlyMissedTerm {
  term: string;
  category: string;
  definition: string;
  examTrap: string;
}

export const MODULE_FREQUENTLY_MISSED_TERMS: Record<number, FrequentlyMissedTerm[]> = {
  1: [
    {
      term: 'CapEx vs OpEx',
      category: 'Cloud Economics',
      definition: 'CapEx is upfront spending on physical servers and datacenters. OpEx is pay-as-you-go operational expenses with zero upfront infrastructure cost.',
      examTrap: 'Exam questions often ask which model requires no upfront cost (OpEx) or which involves tax depreciation over time (CapEx).',
    },
    {
      term: 'Elasticity vs Scalability',
      category: 'Cloud Agility',
      definition: 'Scalability is the capability to increase workload capacity. Elasticity is the ability to automatically expand AND shrink resources based on fluctuating demand.',
      examTrap: 'If a question specifies de-allocating VMs when traffic drops to save cost, the answer is Elasticity, not just Scalability.',
    },
    {
      term: 'High Availability vs Agility',
      category: 'Resilience',
      definition: 'High Availability ensures maximum continuous uptime despite hardware failures. Agility is the speed with which teams can provision and configure new cloud services.',
      examTrap: 'Do not confuse speed of deployment (Agility) with continuous service availability (High Availability).',
    },
    {
      term: 'Consumption-Based Model',
      category: 'Billing',
      definition: 'End-users pay only for the exact compute, storage, and networking resources consumed during execution, eliminating idle server costs.',
      examTrap: 'Contrast with fixed-fee models: in serverless (like Azure Functions), billing stops completely when execution stops.',
    },
  ],
  2: [
    {
      term: 'Shared Responsibility in SaaS',
      category: 'Cloud Models',
      definition: 'In SaaS, Microsoft manages physical hosts, virtualization, OS, and application software. The customer remains responsible only for data, endpoints, identity, and access.',
      examTrap: 'Exam scenarios frequently ask who is responsible for data in SaaS: the customer is ALWAYS responsible for data across all cloud models (IaaS, PaaS, SaaS).',
    },
    {
      term: 'IaaS vs PaaS',
      category: 'Service Types',
      definition: 'IaaS provides raw compute/networking where you manage OS patching. PaaS manages the OS and runtime so you only deploy application code and data.',
      examTrap: 'If the scenario requires installing custom OS kernel extensions or managing Windows Updates, pick IaaS. If focusing purely on web apps, pick PaaS.',
    },
    {
      term: 'Hybrid Cloud',
      category: 'Deployment Models',
      definition: 'An environment combining public cloud resources (Azure) with on-premises private infrastructure, allowing data and apps to be shared between them.',
      examTrap: 'Running two public clouds is multi-cloud. Connecting on-premises datacenter to Azure via ExpressRoute is Hybrid Cloud.',
    },
  ],
  3: [
    {
      term: 'Availability Zones vs Region Pairs',
      category: 'Architecture',
      definition: 'Availability Zones are physically distinct datacenters within the SAME region. Region Pairs are paired regions >=300 miles apart to protect against regional disasters.',
      examTrap: 'Availability Zones protect against local datacenter failures; Region Pairs protect against catastrophic regional disasters (floods, hurricanes).',
    },
    {
      term: 'Sovereign Regions',
      category: 'Compliance',
      definition: 'Physically and logically isolated instances of Azure built to meet strict government and regulatory requirements (e.g., Azure Government, Azure China 21Vianet).',
      examTrap: 'Regular Azure tenants cannot access sovereign cloud regions without specialized compliance screening and separate credentials.',
    },
    {
      term: 'Management Groups',
      category: 'Governance Hierarchy',
      definition: 'Containers positioned above subscriptions in the hierarchy used to manage access, policy, and compliance across multiple subscriptions simultaneously.',
      examTrap: 'Hierarchy order on exam: Management Groups -> Subscriptions -> Resource Groups -> Resources.',
    },
  ],
  4: [
    {
      term: 'Azure Virtual Desktop (AVD)',
      category: 'Compute',
      definition: 'Cloud-based desktop and app virtualization providing multi-session Windows 10/11 environments for remote workforces.',
      examTrap: 'AVD supports multi-session capability on client OS, meaning multiple users can share a single VM instance concurrently to reduce compute costs.',
    },
    {
      term: 'ACI vs AKS',
      category: 'Containers',
      definition: 'Azure Container Instances (ACI) runs serverless container workloads instantly without VM management. AKS is an enterprise-scale Kubernetes orchestration cluster.',
      examTrap: 'Need quick single-container execution with no orchestration? Pick ACI. Need auto-scaling multi-service container orchestration? Pick AKS.',
    },
    {
      term: 'Azure Functions (Serverless)',
      category: 'Compute',
      definition: 'Event-driven serverless code execution that scales automatically and charges only when the function is actively processing an event.',
      examTrap: 'Functions abstract all underlying servers and VMs. If a question mentions paying only when code runs, pick Functions.',
    },
  ],
  5: [
    {
      term: 'VPN Gateway vs ExpressRoute',
      category: 'Networking',
      definition: 'VPN Gateway encrypts traffic over the public Internet. ExpressRoute creates a dedicated private fiber connection directly to Microsoft without using the public Internet.',
      examTrap: 'Questions emphasizing the highest speed, lowest latency, and bypassing the public Internet always require ExpressRoute.',
    },
    {
      term: 'VNet Peering',
      category: 'Connectivity',
      definition: 'Directly connects two Azure Virtual Networks using Microsoft private backbone routing with high bandwidth and no public gateway needed.',
      examTrap: 'Traffic between peered VNets never traverses the public Internet; it remains entirely on Microsoft private fiber.',
    },
    {
      term: 'Azure DNS Hosting',
      category: 'Networking',
      definition: 'Hosts DNS zones and resolves domain names using Microsoft global Anycast infrastructure. It does NOT sell or register domain names.',
      examTrap: 'Azure DNS provides name resolution, but you must register the domain name through a 3rd-party domain registrar.',
    },
  ],
  6: [
    {
      term: 'LRS vs ZRS vs GRS',
      category: 'Storage Redundancy',
      definition: 'LRS replicates 3x within 1 datacenter. ZRS replicates across 3 zones in 1 region. GRS replicates 3x locally plus 3x asynchronously to a paired region.',
      examTrap: 'For maximum protection against regional disasters with geo-replication, choose GRS (Geo-Redundant Storage).',
    },
    {
      term: 'Blob Access Tiers (Hot vs Cool vs Archive)',
      category: 'Storage',
      definition: 'Hot = high storage fee, lowest access fee. Cool = lower storage fee, higher access fee (30-day min). Archive = lowest storage fee, hours of rehydration delay.',
      examTrap: 'Data in Archive tier is offline and CANNOT be read directly until rehydrated to Hot or Cool tier first.',
    },
    {
      term: 'Azure Files vs Blob Storage',
      category: 'Storage',
      definition: 'Azure Files provides fully managed file shares accessible via SMB and NFS protocols. Blob Storage is object storage for unstructured cloud data.',
      examTrap: 'If on-prem VMs need to mount a shared cloud network drive like a traditional mapped drive (Z:), use Azure Files with SMB.',
    },
  ],
  7: [
    {
      term: 'Microsoft Entra ID vs Active Directory DS',
      category: 'Identity',
      definition: 'Entra ID is an internet-based identity and access management service using REST APIs, OAuth, and SAML. On-prem AD DS uses Kerberos and LDAP.',
      examTrap: 'Entra ID is not simply "Active Directory hosted in a VM"; it is a modern flat cloud identity service without organizational units (OUs) or Group Policy.',
    },
    {
      term: 'Authentication vs Authorization',
      category: 'Security',
      definition: 'Authentication verifies identity ("Who are you?"). Authorization validates permissions ("What resources are you allowed to access?").',
      examTrap: 'Entering your password and MFA code is Authentication. RBAC role assignment is Authorization.',
    },
    {
      term: 'Conditional Access',
      category: 'Access Control',
      definition: 'An automated policy engine in Entra ID that evaluates signals (user role, IP location, device compliance) to allow, block, or require MFA.',
      examTrap: 'Conditional Access uses "if-then" statements (e.g., if user is outside company network, require MFA).',
    },
  ],
  8: [
    {
      term: 'Zero Trust Principles',
      category: 'Security Architecture',
      definition: 'Three core principles: 1) Verify explicitly, 2) Use least privileged access, 3) Assume breach.',
      examTrap: 'Zero Trust does not trust internal network traffic automatically; every request is verified regardless of where it originates.',
    },
    {
      term: 'Microsoft Defender for Cloud',
      category: 'Threat Protection',
      definition: 'A cloud security posture management (CSPM) and cloud workload protection platform (CWPP) that provides security recommendations and threat alerts.',
      examTrap: 'Provides the "Secure Score" metric that highlights prioritized actions to harden your Azure environment against attacks.',
    },
    {
      term: 'Defense in Depth',
      category: 'Security Layers',
      definition: 'Layered security defense spanning Physical, Identity, Perimeter, Network, Compute, Application, and Data layers.',
      examTrap: 'If the perimeter firewall is breached, subsequent layers (network security groups, OS patching, data encryption) still protect assets.',
    },
  ],
  9: [
    {
      term: 'Azure Policy vs RBAC',
      category: 'Governance',
      definition: 'RBAC controls who has permissions on resources. Azure Policy enforces resource property rules (e.g. allowed regions, allowed VM sizes, required tags).',
      examTrap: 'If a question asks how to prevent users from creating VMs in Europe or requiring specific tags, use Azure Policy, NOT RBAC.',
    },
    {
      term: 'Resource Locks (ReadOnly vs CanNotDelete)',
      category: 'Protection',
      definition: 'CanNotDelete allows reading and updating resources but blocks deletion. ReadOnly blocks both updating and deleting resources.',
      examTrap: 'Resource Locks override RBAC permissions: even a Subscription Owner cannot delete a locked resource until the lock is removed.',
    },
    {
      term: 'Microsoft Purview',
      category: 'Data Governance',
      definition: 'Unified data governance solution that helps manage and govern on-premises, multi-cloud, and SaaS data assets and classifications.',
      examTrap: 'Used for automated data discovery, sensitive data classification, and end-to-end data lineage across the enterprise.',
    },
  ],
  10: [
    {
      term: 'Pricing Calculator vs TCO Calculator',
      category: 'Cost Planning',
      definition: 'Pricing Calculator estimates upfront costs for Azure services. TCO (Total Cost of Ownership) Calculator compares on-prem datacenter costs with running on Azure.',
      examTrap: 'Want to estimate the cost of 5 VMs and an Azure SQL DB? Use Pricing Calculator. Want to compare datacenter electricity/cooling to Azure? Use TCO Calculator.',
    },
    {
      term: 'Budgets & Spending Alerts',
      category: 'Cost Control',
      definition: 'Azure Cost Management tool that notifies stakeholders via email or Action Groups when spending reaches preset monetary or percentage thresholds.',
      examTrap: 'Budget alerts notify administrators, but by default they do NOT automatically shut down production VMs unless linked to runbooks.',
    },
    {
      term: 'Composite SLA Calculation',
      category: 'SLA',
      definition: 'When services are combined sequentially, multiply their individual SLA percentages (e.g. 99.9% x 99.9% = 99.8%).',
      examTrap: 'The composite SLA of combined services is ALWAYS lower than the lowest individual service SLA.',
    },
  ],
  11: [
    {
      term: 'Azure Monitor vs Service Health vs Advisor',
      category: 'Observability',
      definition: 'Monitor tracks performance of your resources. Service Health alerts on global Azure outages/incidents. Advisor recommends best practices.',
      examTrap: 'If you want to know if Microsoft datacenter hardware failed in West US, look at Service Health. If monitoring VM CPU load, use Azure Monitor.',
    },
    {
      term: 'Log Analytics Workspace',
      category: 'Telemetry',
      definition: 'Central repository for aggregating log and event telemetry data, queried using Kusto Query Language (KQL).',
      examTrap: 'Azure Monitor Logs collects data from VMs, Azure diagnostics, and applications into a Log Analytics Workspace for complex querying.',
    },
    {
      term: 'Application Insights',
      category: 'APM',
      definition: 'Feature of Azure Monitor for web applications that tracks live request rates, failure rates, response times, and exceptions in real time.',
      examTrap: 'Monitors application-level code performance and user interactions, not just underlying VM operating system metrics.',
    },
  ],
  12: [
    {
      term: 'ARM Templates vs Bicep',
      category: 'Infrastructure as Code',
      definition: 'ARM Templates use declarative JSON. Bicep is a modern domain-specific language (DSL) with cleaner syntax that compiles directly into ARM JSON.',
      examTrap: 'Bicep provides first-class support for all Azure resource types and day-zero support for new resource APIs with zero state management files.',
    },
    {
      term: 'Azure Cloud Shell',
      category: 'Management Tools',
      definition: 'A browser-accessible authenticated terminal pre-configured with Azure CLI, PowerShell, and common development tools, backed by Azure Files.',
      examTrap: 'Cloud Shell requires an Azure Storage account to persist files across sessions, but runs directly in any modern web browser without local setup.',
    },
    {
      term: 'Azure Arc',
      category: 'Hybrid & Multi-Cloud',
      definition: 'Extends Azure Resource Manager governance, policies, and management services to Windows/Linux servers, Kubernetes, and databases outside Azure.',
      examTrap: 'Allows managing on-premises VMware servers or AWS/GCP clusters inside the Azure Portal as if they were native Azure resources.',
    },
  ],
};
