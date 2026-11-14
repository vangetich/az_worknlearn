export type FlashcardType =
  | 'Concept & Architecture'
  | 'Service Comparison'
  | 'Scenario Troubleshooting'
  | 'Exam Trap & Distinction'
  | 'Governance, SLA & Cost';

export interface Flashcard {
  id: string;
  pathId: 1 | 2 | 3;
  moduleId: number;
  term: string;
  acronym?: string;
  category:
    | 'Cloud Concepts'
    | 'Architecture & Compute'
    | 'Networking & Storage'
    | 'Identity & Security'
    | 'Governance & Cost';
  cardType?: FlashcardType;
  difficulty?: 'Fundamental' | 'Intermediate' | 'Advanced';
  pathTitle: string;
  moduleTitle: string;
  frontPrompt: string;
  officialDefinition: string;
  examTrap: string;
  memoryRule: string;
  keyUnits: string[];
  /** Quick-fire multiple-choice options for active knowledge testing (4 choices) */
  quickFireOptions?: string[];
  /** Index (0-3) of the correct quick-fire option */
  quickFireCorrectIndex?: number;
  /** Concise diagnostic explaining why distractors are wrong when missed in Quick-Fire mode */
  mistakeDiagnostic?: string;
}

export const AZ900_FLASHCARDS: Flashcard[] = [
  // =====================================================================
  // PATH 1: DESCRIBE CLOUD CONCEPTS (MODULES 1, 2, 3)
  // =====================================================================
  {
    id: 'fc-iaas-paas-saas',
    pathId: 1,
    moduleId: 1,
    term: 'Shared Responsibility Model (IaaS vs PaaS vs SaaS)',
    acronym: 'IaaS / PaaS / SaaS',
    category: 'Cloud Concepts',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Fundamental Cloud Concepts',
    frontPrompt:
      'Who manages the Operating System, Runtime, and Physical Hardware in IaaS versus PaaS and SaaS?',
    officialDefinition:
      'In IaaS (e.g., Azure VMs), the customer manages the OS, runtime, and applications while Microsoft manages physical datacenters and virtualization. In PaaS (e.g., Azure App Service), Microsoft manages OS and patching, customer manages applications and data. In SaaS (e.g., Microsoft 365), Microsoft manages everything except customer data, endpoints, and identity access.',
    examTrap:
      "Exam Trap: Candidates often assume Microsoft patches the OS in IaaS. In IaaS, OS updates and security configurations are 100% the customer's responsibility!",
    memoryRule:
      'IaaS = Renting a House (you maintain the interior). PaaS = Renting a Hotel Room (cleaning included). SaaS = Dining at a Restaurant (just consume).',
    keyUnits: ['Shared Responsibility', 'IaaS', 'PaaS', 'SaaS'],
    quickFireOptions: [
      'Customer Always Owns: Data, Endpoints, Accounts & Access Management across IaaS, PaaS, and SaaS',
      'Microsoft patches guest Operating Systems automatically in all IaaS Virtual Machines',
      'Customer manages physical datacenter biometric security in IaaS deployments',
      'In SaaS, Microsoft is responsible for configuring user role assignments and client device security',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Regardless of cloud service model (IaaS, PaaS, or SaaS), the customer ALWAYS retains responsibility for Information/Data, Devices (Endpoints), and Accounts/Identities.',
  },
  {
    id: 'fc-cloud-deployment-models',
    pathId: 1,
    moduleId: 1,
    term: 'Public vs. Private vs. Hybrid vs. Multi-Cloud',
    acronym: 'Cloud Models',
    category: 'Cloud Concepts',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Fundamental Cloud Concepts',
    frontPrompt:
      'How do Public, Private, Hybrid, and Multi-Cloud deployment models differ in ownership, hardware isolation, and regulatory flexibility?',
    officialDefinition:
      'Public Cloud (Azure) is owned by a cloud provider and shared across multiple tenants with zero CapEx. Private Cloud runs on dedicated hardware for a single organization (on-premises or hosted datacenter). Hybrid Cloud bridges Public and Private clouds via VPN/ExpressRoute so workloads move seamlessly. Multi-Cloud uses two or more public cloud providers (e.g., Azure + AWS) managed via Azure Arc.',
    examTrap:
      'Exam Trap: Using Azure ExpressRoute to connect an on-premises datacenter to Azure is Hybrid Cloud, NOT Multi-Cloud. Multi-Cloud specifically means using more than one public cloud provider.',
    memoryRule:
      'Public = Public Bus. Private = Company-owned Van. Hybrid = Using your Van for local roads and the Public Train for long-distance cargo.',
    keyUnits: ['Public Cloud', 'Private Cloud', 'Hybrid Cloud', 'Multi-Cloud'],
    quickFireOptions: [
      'Hybrid Cloud integrates on-premises private infrastructure with public cloud services',
      'Multi-Cloud means running multiple Virtual Networks inside a single Azure subscription',
      'Public Cloud requires upfront Capital Expenditure (CapEx) for server racks',
      'Private Cloud cannot use virtualization or self-service automation',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Hybrid Cloud combines on-premises (private) infrastructure with public cloud resources, whereas Multi-Cloud spans two or more distinct public cloud providers.',
  },
  {
    id: 'fc-serverless-computing-concept',
    pathId: 1,
    moduleId: 1,
    term: 'Serverless Computing Paradigm',
    acronym: 'Serverless',
    category: 'Cloud Concepts',
    cardType: 'Concept & Architecture',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Fundamental Cloud Concepts',
    frontPrompt:
      'How does Serverless computing differ from traditional PaaS regarding infrastructure abstraction and billing?',
    officialDefinition:
      'Serverless computing abstracts all underlying servers, OS, and capacity provisioning. Code runs only when triggered by events, scales automatically from zero to thousands of concurrent executions, and bills strictly per execution time/consumption with zero charge when idle.',
    examTrap:
      'Exam Trap: Standard PaaS plans (like App Service Dedicated tiers) still bill you hourly even if zero users visit your site at 3 AM. True Serverless (Consumption plan) bills $0 when no events occur.',
    memoryRule:
      'PaaS = Keeping a taxi waiting outside all day. Serverless = Paying only for the exact meters the колеса (wheels) roll.',
    keyUnits: ['Serverless', 'Event-Driven', 'Consumption Billing'],
    quickFireOptions: [
      'Serverless abstracts all server management, scales to zero when idle, and bills per execution event',
      'Serverless requires customers to manually configure Availability Sets and OS patch schedules',
      'Serverless workloads run directly on client browsers without datacenter servers',
      'Serverless charges a fixed monthly reservation fee regardless of invocation count',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Serverless still runs on physical servers managed by Microsoft, but customers never provision capacity and pay only per event execution.',
  },
  {
    id: 'fc-scalability-vs-elasticity',
    pathId: 1,
    moduleId: 2,
    term: 'Horizontal Scaling vs. Elasticity',
    acronym: 'Scale-Out vs Auto-Scale',
    category: 'Cloud Concepts',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Benefits',
    frontPrompt:
      'How does Horizontal Scalability differ from Elasticity, and when does Auto-Scaling kick in?',
    officialDefinition:
      'Scalability is the capability of a system to handle increased workloads (Vertical = Scaling Up by adding CPU/RAM to 1 machine; Horizontal = Scaling Out by adding more VM instances). Elasticity is the automated capability to dynamically add (scale-out) or remove (scale-in) resources in response to changing demand without manual intervention.',
    examTrap:
      'Exam Trap: Adding RAM to a single database server is Vertical Scaling (Scaling Up). Deploying 5 additional VM clones automatically during a traffic spike is Horizontal Scaling with Elasticity.',
    memoryRule:
      'Vertical = Gym lifter getting bigger muscles. Horizontal = Calling your Harambee community members to carry the harvest together.',
    keyUnits: ['Scalability', 'Elasticity', 'Horizontal Scale'],
    quickFireOptions: [
      'Vertical scaling adds CPU/RAM to one instance (Scale Up); Horizontal scaling adds more instances (Scale Out)',
      'Horizontal scaling upgrades a VM SKU from 4 vCPUs to 16 vCPUs without adding instances',
      'Elasticity means manually resizing disks once a year during maintenance windows',
      'Vertical scaling can scale infinitely without hardware limits or restart downtime',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Vertical scaling (Up/Down) changes the size of a single resource; Horizontal scaling (Out/In) changes the count of instances.',
  },
  {
    id: 'fc-high-availability-fault-tolerance',
    pathId: 1,
    moduleId: 2,
    term: 'High Availability (HA) vs. Disaster Recovery (DR)',
    acronym: 'HA vs DR',
    category: 'Cloud Concepts',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Benefits',
    frontPrompt:
      'What is the architectural boundary between High Availability (HA) and Disaster Recovery (DR) in Azure?',
    officialDefinition:
      'High Availability (HA) ensures continuous uptime and acceptable performance during normal operations and localized component/zone failures, measured by SLA uptime percentages (e.g., 99.99%). Disaster Recovery (DR) is the strategic restoration of workloads in a secondary geography/region after a catastrophic regional event, governed by RPO (Recovery Point Objective) and RTO (Recovery Time Objective).',
    examTrap:
      'Exam Trap: High Availability is NOT Disaster Recovery. Load balancing VMs across Availability Zones is HA; failing over databases to a paired region 300+ miles away using Azure Site Recovery is DR.',
    memoryRule:
      'HA keeps you online right now across redundant racks; Disaster Recovery rebuilds your village in a sister town after a major flood.',
    keyUnits: ['High Availability', 'Disaster Recovery', 'SLA', 'RPO / RTO'],
    quickFireOptions: [
      'HA maintains continuous uptime during localized failures; DR restores workloads across regions after major disasters',
      'HA only applies to on-premises servers while DR only applies to SaaS applications',
      'Disaster Recovery prevents hard drives from failing inside a single server rack',
      'High Availability requires manually restoring backups from tape after 24 hours',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'HA handles immediate fault tolerance across redundant components/zones; DR recovers systems across regions when an entire region goes down.',
  },
  {
    id: 'fc-agility-vs-reliability-predictability',
    pathId: 1,
    moduleId: 2,
    term: 'Cloud Agility, Reliability & Predictability',
    acronym: 'Cloud Benefits',
    category: 'Cloud Concepts',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Benefits',
    frontPrompt:
      'How does Microsoft Azure distinguish Cloud Agility from Reliability and Performance/Cost Predictability?',
    officialDefinition:
      'Cloud Agility is the speed at which you can provision, deploy, reconfigure, and decommission resources in minutes rather than waiting weeks for hardware procurement. Reliability is the ability of a system to recover from failures and continue functioning (self-healing, multi-region design). Predictability covers both Performance (autoscaling, load balancing) and Cost (real-time billing forecast, TCO/Pricing tools).',
    examTrap:
      'Exam Trap: Do not confuse Agility with Elasticity! Rapidly deploying a new environment for a dev team in 3 minutes is Agility; automatically adding VMs when CPU hits 80% is Elasticity.',
    memoryRule:
      'Agility = How fast you launch a new market stall. Elasticity = Expanding the stall roof automatically when a crowd arrives.',
    keyUnits: ['Agility', 'Reliability', 'Predictability'],
    quickFireOptions: [
      'Agility is how rapidly you can deploy and configure new cloud applications as business needs evolve',
      'Agility means automatically deleting unused storage blobs after 90 days',
      'Reliability means paying a fixed upfront CapEx fee for 5 years of hardware',
      'Predictability guarantees zero network latency across all global continents',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Agility specifically refers to speed of deployment and time-to-market; Elasticity refers to automated resource scaling.',
  },
  {
    id: 'fc-capex-vs-opex',
    pathId: 1,
    moduleId: 3,
    term: 'CapEx vs. OpEx Financial Dynamics',
    acronym: 'CapEx / OpEx',
    category: 'Cloud Concepts',
    cardType: 'Governance, SLA & Cost',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Pricing & Consumption Models',
    frontPrompt:
      'What is the fundamental accounting difference between Capital Expenditure and Operational Expenditure in Azure?',
    officialDefinition:
      'Capital Expenditure (CapEx) is an upfront physical expense deducted over time through depreciation (buying on-premises servers, routers, cooling). Operational Expenditure (OpEx) is spending on ongoing services or consumption deducted in the current billing period without upfront physical capital.',
    examTrap:
      'Exam Trap: Questions asking for "no upfront cost, pay only for what you use, and immediately terminate when finished" always refer to OpEx / Consumption-based cloud computing.',
    memoryRule:
      'CapEx = Buying a car outright (massive upfront check). OpEx = Catching a Matatu or Uber (pay as you ride).',
    keyUnits: ['CapEx', 'OpEx', 'Consumption-based'],
    quickFireOptions: [
      'CapEx is upfront spending on physical infrastructure; OpEx is pay-as-you-go billing for consumed cloud services',
      'OpEx requires depreciating physical server hardware over a 5-year tax schedule',
      'CapEx scales down to zero cost when virtual machines are deallocated',
      'Public cloud consumption billing is classified as Capital Expenditure (CapEx)',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Cloud pay-as-you-go consumption shifts IT budgets from upfront Capital Expenditure (CapEx) to ongoing Operational Expenditure (OpEx).',
  },
  {
    id: 'fc-vm-deallocated-vs-stopped-billing',
    pathId: 1,
    moduleId: 3,
    term: 'VM Stopped (Deallocated) vs. Stopped (Allocated) Billing',
    acronym: 'Deallocated VM',
    category: 'Cloud Concepts',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Advanced',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Pricing & Consumption Models',
    frontPrompt:
      'If an administrator shuts down an Azure VM from inside the Windows/Linux guest OS instead of clicking Stop in the Azure Portal, are compute charges still incurred?',
    officialDefinition:
      'Yes! Shutting down from inside the guest OS puts the VM in a "Stopped (Allocated)" state where physical host hardware remains reserved and Azure continues billing for compute vCPUs. Clicking Stop in the Azure Portal or CLI puts the VM in "Stopped (Deallocated)" state, releasing compute hardware and halting compute charges (though Managed Disk storage charges still apply).',
    examTrap:
      'Exam Trap: Even when a VM is properly Deallocated (zero compute fee), you STILL pay for the attached OS and Data Managed Disks and any static Public IP addresses!',
    memoryRule:
      'Deallocated = Checked out of the hotel room (no room charge, just luggage storage fee). Guest OS shutdown = Sleeping inside the locked room (still billed full night).',
    keyUnits: ['Deallocated', 'Compute Billing', 'Storage Billing'],
    quickFireOptions: [
      'Compute charges stop only when the VM is Stopped (Deallocated), though disk storage charges still apply',
      'Shutting down from inside Windows OS immediately stops all compute and disk billing',
      'Deallocating a VM deletes all attached Managed Disks and zeroes out all storage costs',
      'Azure never bills for compute unless a user is actively logged into Remote Desktop',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Only the "Stopped (Deallocated)" state releases underlying compute hardware; persistent storage (disks) continues to incur storage costs until deleted.',
  },
  {
    id: 'fc-ingress-vs-egress-bandwidth-cost',
    pathId: 1,
    moduleId: 3,
    term: 'Data Ingress vs. Data Egress Pricing',
    acronym: 'Ingress / Egress',
    category: 'Cloud Concepts',
    cardType: 'Governance, SLA & Cost',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Cloud Concepts',
    moduleTitle: 'Cloud Pricing & Consumption Models',
    frontPrompt:
      'How does Azure price inbound data transfer (Ingress) versus outbound data transfer (Egress) across regions and the internet?',
    officialDefinition:
      'Inbound data transfer (Ingress—uploading data into Azure datacenters) is always 100% FREE. Outbound data transfer (Egress—downloading data from Azure to the public internet or transferring data across different Azure Regions/Zones) is metered and billed per gigabyte after a small free monthly tier.',
    examTrap:
      'Exam Trap: Exam scenarios often ask about the network cost of uploading 50 TB of on-premises database backups into Azure Blob Storage. Inbound network transfer (Ingress) is FREE; you only pay for storing the data once it arrives!',
    memoryRule:
      'Entering the resort is free (Ingress = $0); taking souvenirs home in trunks costs per kilogram (Egress = Metered).',
    keyUnits: ['Data Ingress', 'Data Egress', 'Bandwidth Pricing'],
    quickFireOptions: [
      'Inbound data transfer (Ingress) into Azure is free; outbound data transfer (Egress) is metered per GB',
      'Both inbound Ingress and outbound Egress are billed at the exact same per-GB rate',
      'Uploading data into Azure costs twice as much as downloading data out of Azure',
      'Transferring data between East US and West Europe datacenters is completely free of egress charges',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Data Ingress into Azure datacenters is always free; Egress leaving an Azure datacenter or crossing regions is metered.',
  },

  // =====================================================================
  // PATH 2: AZURE ARCHITECTURE & SERVICES (MODULES 4, 5, 6)
  // =====================================================================
  {
    id: 'fc-regions-vs-availability-zones',
    pathId: 2,
    moduleId: 4,
    term: 'Azure Regions vs. Availability Zones',
    acronym: 'AZ / SLA 99.99%',
    category: 'Architecture & Compute',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Core Azure Architectural Components',
    frontPrompt:
      'What defines an Azure Availability Zone, and how is it isolated within an Azure Region?',
    officialDefinition:
      'An Azure Region is a geographical area containing one or more datacenters networked via a low-latency perimeter. An Availability Zone is a physically separate datacenter facility within an Azure Region equipped with independent power, cooling, and networking. Availability zone-enabled regions have a minimum of 3 separate zones, elevating VM SLA to 99.99%.',
    examTrap:
      'Exam Trap: Availability Zones protect against a single datacenter outage within one region. They do NOT protect if an entire metropolitan region suffers a major natural catastrophe (for that, use Region Pairs / GRS).',
    memoryRule:
      'Region = A City (e.g., Nairobi). Availability Zone = 3 separate fenced compounds across town with independent generators.',
    keyUnits: ['Regions', 'Availability Zones', 'Datacenters'],
    quickFireOptions: [
      'Physically separate datacenters within a single Azure Region with independent power, cooling, and networking',
      'Two datacenters located at least 300 miles apart in different countries',
      'Logical folders used to group billing invoices inside an Azure Subscription',
      'Edge caching servers used exclusively by Azure Content Delivery Network (CDN)',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Availability Zones are physically isolated datacenters within a single Azure Region, each with independent power, cooling, and networking.',
  },
  {
    id: 'fc-region-pairs-sovereignty',
    pathId: 2,
    moduleId: 4,
    term: 'Azure Region Pairs & Sovereign Clouds',
    acronym: 'Paired Regions / Sovereign',
    category: 'Architecture & Compute',
    cardType: 'Concept & Architecture',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Core Azure Architectural Components',
    frontPrompt:
      'What is an Azure Region Pair, how are updates rolled out, and what are Sovereign Clouds (Azure Government / Azure China)?',
    officialDefinition:
      'Each Azure region is paired with another region in the same geography (typically 300+ miles apart). Platform updates roll out sequentially to one region at a time. Sovereign Clouds are physically and logically isolated instances of Azure: Azure Government (for US federal/DoD compliance) and Azure China (operated by 21Vianet under Chinese data laws).',
    examTrap:
      'Exam Trap: Azure China is operated by 21Vianet (not Microsoft directly), and customers cannot transfer resources directly between commercial global Azure and Sovereign Clouds.',
    memoryRule:
      'Paired Regions never take maintenance at the same time; Sovereign Clouds are diplomatic embassies with strict border isolation.',
    keyUnits: ['Region Pairs', 'Azure Government', '21Vianet'],
    quickFireOptions: [
      'Sequential platform updates, 300+ mile separation within the same geography, and prioritized disaster recovery',
      'Simultaneous OS reboots across both paired regions to finish maintenance faster',
      'Automatic synchronous replication of all standalone VMs without configuration',
      'Pairing every US region with a European region to bypass GDPR data residency',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Region Pairs are separated by 300+ miles within the same geography and receive sequential (one-at-a-time) updates.',
  },
  {
    id: 'fc-management-hierarchy-scope',
    pathId: 2,
    moduleId: 4,
    term: 'Azure Management Hierarchy & Inheritance Scope',
    acronym: 'MG → Sub → RG → Resource',
    category: 'Architecture & Compute',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Core Azure Architectural Components',
    frontPrompt:
      'What is the exact four-level hierarchy of Azure resource organization from top to bottom, and how do RBAC and Policy flow?',
    officialDefinition:
      'From top to bottom: 1. Management Groups (up to 6 levels deep, excluding Root, managing governance across multiple subscriptions), 2. Subscriptions (billing and access boundary), 3. Resource Groups (logical lifecycle container), 4. Resources (actual VMs, SQL databases, VNets). RBAC permissions, Azure Policies, and Resource Locks inherit downward from parent to child.',
    examTrap:
      'Exam Trap: Resource Tags do NOT automatically inherit from Subscriptions or Resource Groups down to child resources unless enforced via an Azure Policy!',
    memoryRule:
      'Management Group (County) → Subscription (Sub-County) → Resource Group (Homestead) → Resource (Granary).',
    keyUnits: ['Management Groups', 'Subscriptions', 'Resource Groups', 'Inheritance'],
    quickFireOptions: [
      'Management Groups → Subscriptions → Resource Groups → Resources (policies & RBAC inherit downward)',
      'Subscriptions → Management Groups → Resources → Resource Groups',
      'Resource Groups → Subscriptions → Availability Zones → Management Groups',
      'Tenant Root → Virtual Networks → Subscriptions → Management Groups',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'The four-tier Azure hierarchy flows strictly from Management Groups → Subscriptions → Resource Groups → Resources.',
  },
  {
    id: 'fc-resource-groups-lifecycle',
    pathId: 2,
    moduleId: 4,
    term: 'Azure Resource Groups (Scope & Deletion Rules)',
    acronym: 'RG Rules',
    category: 'Architecture & Compute',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Core Azure Architectural Components',
    frontPrompt:
      'Can a resource exist in multiple Resource Groups, can Resource Groups be nested, and can resources reside in different regions than their Resource Group?',
    officialDefinition:
      '1. Each Azure resource must belong to exactly ONE Resource Group. 2. Resource Groups CANNOT be nested inside another Resource Group. 3. A Resource Group in East US can contain resources deployed in West Europe or Southeast Asia. 4. Most resources can be moved between Resource Groups. 5. Deleting a Resource Group deletes all resources inside it.',
    examTrap:
      'Exam Trap: Exam questions love to ask if moving a Resource Group or deploying a VM in Japan requires a Japan Resource Group. No—the Resource Group location only stores metadata!',
    memoryRule:
      'One resource = One basket only. Baskets cannot hold other baskets, and deleting the basket deletes everything inside.',
    keyUnits: ['Resource Groups', 'Resource Lifecycle', 'No Nesting'],
    quickFireOptions: [
      'A resource belongs to only one Resource Group, Resource Groups cannot be nested, and resources can be in different regions',
      'A single Virtual Machine can belong to two Resource Groups simultaneously for high availability',
      'Resource Groups can be nested up to 6 levels deep inside a Subscription',
      'All resources inside a Resource Group must be deployed in the exact same Azure Region as the group',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Resources belong to exactly one Resource Group, nesting is not supported, and child resources can reside in any Azure region.',
  },
  {
    id: 'fc-azure-vms-scale-sets',
    pathId: 2,
    moduleId: 5,
    term: 'Azure Virtual Machine Scale Sets (VMSS) vs. Availability Sets',
    acronym: 'VMSS vs AvSet',
    category: 'Architecture & Compute',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'How do Virtual Machine Scale Sets (VMSS) differ from Availability Sets (Fault Domains & Update Domains)?',
    officialDefinition:
      'Virtual Machine Scale Sets (VMSS) automatically create, load-balance, and scale out/in up to 1,000 identical VM instances based on demand or schedule. Availability Sets group 2+ VMs within a single datacenter across Fault Domains (separate power/switch racks) and Update Domains (staggered reboot groups) for 99.95% SLA without auto-scaling.',
    examTrap:
      'Exam Trap: Availability Sets protect against rack failure (Fault Domain) and host maintenance (Update Domain) inside ONE datacenter. VMSS adds automatic horizontal scaling of identical VMs.',
    memoryRule:
      'Fault Domain = Separate power strip. Update Domain = Separate maintenance shift. VMSS = Auto-cloning army.',
    keyUnits: ['VMSS', 'Availability Sets', 'Fault Domain', 'Update Domain'],
    quickFireOptions: [
      'VMSS auto-scales up to 1,000 identical load-balanced VMs; Availability Sets spread VMs across Fault & Update Domains',
      'Availability Sets automatically create new VMs when CPU exceeds 75%',
      'Fault Domains group VMs that are rebooted simultaneously during planned software patches',
      'VMSS can only deploy a maximum of 2 virtual machines per subscription',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Fault Domains isolate hardware/power failures, Update Domains stagger planned reboots, and VMSS provides automated horizontal scaling.',
  },
  {
    id: 'fc-containers-aci-aks-aca',
    pathId: 2,
    moduleId: 5,
    term: 'Azure Container Instances (ACI) vs. AKS vs. Container Apps',
    acronym: 'ACI / AKS / ACA',
    category: 'Architecture & Compute',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'When should an architect choose Azure Container Instances (ACI) versus Azure Kubernetes Service (AKS) or Azure Container Apps?',
    officialDefinition:
      'Azure Container Instances (ACI) is the fastest, simplest PaaS way to run a single container in Azure without managing VMs or orchestration (billed per second). Azure Kubernetes Service (AKS) is a full-scale container orchestration platform for complex multi-container microservices, rolling updates, and cluster auto-scaling. Azure Container Apps (ACA) runs serverless microservices and event-driven containers built on Kubernetes without cluster management.',
    examTrap:
      'Exam Trap: If the exam asks for the "fastest and simplest way to run a container in Azure without managing virtual machines or an orchestrator", choose Azure Container Instances (ACI).',
    memoryRule:
      'ACI = Single cargo box on a pickup truck. AKS = Giant Mombasa container ship with automated cranes and fleet captain.',
    keyUnits: ['ACI', 'AKS', 'Container Apps', 'Containers vs VMs'],
    quickFireOptions: [
      'ACI is the fastest way to run isolated containers without orchestration; AKS provides full Kubernetes cluster orchestration',
      'ACI requires each container to bundle its own full guest Operating System kernel',
      'AKS cannot scale containers automatically or perform rolling upgrades',
      'Containers are heavier and slower to boot than traditional Virtual Machines',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Containers share the host OS kernel (lightweight), ACI runs simple containers without orchestration, and AKS orchestrates enterprise container fleets.',
  },
  {
    id: 'fc-azure-functions-vs-logic-apps',
    pathId: 2,
    moduleId: 5,
    term: 'Azure Functions vs. Azure Logic Apps (Serverless)',
    acronym: 'Functions vs Logic Apps',
    category: 'Architecture & Compute',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'Both Azure Functions and Azure Logic Apps are serverless. How do you choose between them on the AZ-900 exam?',
    officialDefinition:
      'Azure Functions is a code-first serverless compute service (FaaS) where developers write C#, Python, JavaScript, or Java functions triggered by HTTP, timers, or queues. Azure Logic Apps is a low-code/no-code visual workflow orchestration service with 400+ prebuilt connectors (Office 365, Salesforce, SAP, SQL) to automate business processes.',
    examTrap:
      'Exam Trap: "Execute custom C# code in response to an event" = Azure Functions. "Low-code visual designer with connectors to send an email when a tweet is posted" = Azure Logic Apps.',
    memoryRule:
      'Functions = Writing custom code snippets. Logic Apps = Snapping Lego blocks together in a visual flowchart.',
    keyUnits: ['Azure Functions', 'Logic Apps', 'Serverless', 'Low-Code'],
    quickFireOptions: [
      'Azure Functions executes custom event-driven code; Logic Apps provides low-code visual workflows with 400+ connectors',
      'Azure Functions is a drag-and-drop no-code workflow builder while Logic Apps requires C++ compilation',
      'Both services require provisioning dedicated Windows Server Virtual Machines first',
      'Azure Functions can only run once per day on a manual administrator click',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Functions is code-first serverless execution (FaaS); Logic Apps is low-code/no-code workflow integration (iPaaS).',
  },
  {
    id: 'fc-azure-app-service-paas',
    pathId: 2,
    moduleId: 5,
    term: 'Azure App Service (Managed Web & API PaaS)',
    acronym: 'App Service',
    category: 'Architecture & Compute',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'What workloads does Azure App Service host, and why is it classified as Platform as a Service (PaaS)?',
    officialDefinition:
      'Azure App Service is a fully managed PaaS offering for hosting Web Apps, REST APIs, and Mobile Backends (.NET, Java, Node.js, Python, PHP, or containers). Microsoft manages the underlying VMs and OS patching while providing built-in auto-scaling, deployment slots (staging/production swap), continuous CI/CD deployment from GitHub/Azure DevOps, and custom SSL domains.',
    examTrap:
      'Exam Trap: You do NOT have Remote Desktop (RDP) or SSH root OS control over the underlying host VMs in App Service—that is the hallmark of PaaS!',
    memoryRule:
      'App Service = A ready-to-broadcast TV studio: you bring your show script (code), Microsoft runs the cameras and transmitters.',
    keyUnits: ['App Service', 'PaaS', 'Deployment Slots', 'Web Apps'],
    quickFireOptions: [
      'A fully managed PaaS service for hosting Web Apps, REST APIs, and Mobile Backends with built-in scaling and CI/CD',
      'An IaaS service that gives administrators full RDP access to patch the Windows Server registry',
      'A physical fiber cable connecting on-premises routers to Microsoft datacenters',
      'A desktop virtualization service for streaming Windows 11 desktops to remote workers',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Azure App Service is Microsoft’s flagship PaaS platform for Web Apps, APIs, and Mobile Backends.',
  },
  {
    id: 'fc-azure-virtual-desktop',
    pathId: 2,
    moduleId: 5,
    term: 'Azure Virtual Desktop (AVD Multi-Session)',
    acronym: 'AVD',
    category: 'Architecture & Compute',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'What unique Windows licensing and multi-user capability makes Azure Virtual Desktop (AVD) stand out on the AZ-900 exam?',
    officialDefinition:
      'Azure Virtual Desktop (AVD) is a cloud-hosted desktop and application virtualization service. It is the ONLY cloud service that delivers multi-session Windows 10 and Windows 11 desktop experiences, allowing multiple concurrent users to log into a single VM simultaneously while keeping corporate data securely inside Azure.',
    examTrap:
      'Exam Trap: Standard Windows 10/11 on a regular PC only allows 1 active user session at a time. AVD uniquely enables Windows 10/11 Enterprise Multi-Session.',
    memoryRule:
      'AVD = Your complete secure corporate Windows 11 desktop streamed to any browser or tablet.',
    keyUnits: ['Azure Virtual Desktop', 'Windows 11 Multi-Session', 'VDI'],
    quickFireOptions: [
      'Delivers cloud-hosted virtual desktops and apps with exclusive Windows 10/11 multi-session support',
      'Provides private fiber optic networking between branch offices',
      'Stores petabytes of unstructured video files in cold archive storage',
      'Monitors subscription billing budgets and sends cost alerts',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'AVD is Azure’s desktop and app virtualization service featuring exclusive Windows 10/11 multi-session capability.',
  },
  {
    id: 'fc-vnet-peering-subnets-nsg',
    pathId: 2,
    moduleId: 5,
    term: 'Azure Virtual Network (VNet), Peering & Subnets',
    acronym: 'VNet / Peering',
    category: 'Networking & Storage',
    cardType: 'Concept & Architecture',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'How do Azure Virtual Networks (VNets) isolate traffic, and how does VNet Peering connect separate VNets?',
    officialDefinition:
      'An Azure Virtual Network (VNet) is the fundamental building block for private networks in Azure, segmented into Subnets. By default, two separate VNets cannot communicate. VNet Peering connects two VNets (in the same region or globally across regions) over Microsoft’s private backbone network so resources communicate with low latency as if on the same network.',
    examTrap:
      'Exam Trap: VNet Peering is NON-TRANSITIVE by default! If VNet A is peered with VNet B, and VNet B is peered with VNet C, VNet A CANNOT talk directly to VNet C without direct peering or a gateway/hub.',
    memoryRule:
      'VNet Peering = Building a private bridge between two compounds; non-transitive means Compound A cannot cross through B to reach C automatically.',
    keyUnits: ['VNet', 'VNet Peering', 'Non-Transitive', 'Subnets'],
    quickFireOptions: [
      'Connects two VNets privately over the Microsoft backbone; peering is non-transitive by default',
      'Routes traffic between VNets over the unencrypted public internet',
      'Automatically peers every VNet in a subscription transitive-mesh style without configuration',
      'Requires purchasing physical ExpressRoute circuits to connect two VNets in the same region',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'VNet Peering routes traffic privately over the Microsoft backbone and is non-transitive (A→B and B→C does not automatically allow A→C).',
  },
  {
    id: 'fc-vpn-gateway-vs-expressroute',
    pathId: 2,
    moduleId: 5,
    term: 'VPN Gateway vs. Azure ExpressRoute',
    acronym: 'VPN vs ExpressRoute',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'Which hybrid connectivity option completely bypasses the public internet to deliver high-speed private fiber connectivity?',
    officialDefinition:
      'Azure ExpressRoute creates a private, dedicated connection between your on-premises datacenter and Azure through a connectivity provider, never traversing the public Internet. Azure VPN Gateway creates an encrypted IPsec/IKE tunnel over the public Internet (Site-to-Site for datacenters or Point-to-Site for individual remote laptops).',
    examTrap:
      'Exam Trap: Questions asking for "private dedicated connection that does NOT traverse the public internet with ultra-low latency and high bandwidth" is ALWAYS ExpressRoute.',
    memoryRule:
      'VPN Gateway = Armored car traveling on the public highway. ExpressRoute = Private high-speed rail line built exclusively for your company.',
    keyUnits: ['ExpressRoute', 'VPN Gateway', 'Hybrid Connectivity'],
    quickFireOptions: [
      'ExpressRoute uses a dedicated private connection bypassing the public internet; VPN Gateway sends encrypted traffic over the public internet',
      'VPN Gateway bypasses the public internet using dedicated fiber optics',
      'ExpressRoute is free and requires zero connectivity partner setup',
      'Point-to-Site VPN connects two entire datacenters without client certificates',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'ExpressRoute is private dedicated connectivity off the public internet; VPN Gateway uses an encrypted IPsec tunnel over the public internet.',
  },
  {
    id: 'fc-azure-dns-private-link-endpoints',
    pathId: 2,
    moduleId: 5,
    term: 'Azure DNS & Azure Private Link / Private Endpoint',
    acronym: 'DNS / Private Link',
    category: 'Networking & Storage',
    cardType: 'Concept & Architecture',
    difficulty: 'Advanced',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Compute and Networking Services',
    frontPrompt:
      'What is the role of Azure DNS versus Azure Private Link (Private Endpoints) in cloud networking?',
    officialDefinition:
      'Azure DNS is a hosting service for DNS domains that translates human-friendly domain names (e.g., contoso.com) into IP addresses using Microsoft global name servers (note: you cannot buy/register domain names directly in Azure DNS). Azure Private Link enables you to access Azure PaaS services (Blob Storage, SQL Database) privately from your VNet via a Private Endpoint IP address without exposing data to the public internet.',
    examTrap:
      'Exam Trap: Azure DNS hosts DNS records, but it is NOT a domain registrar (you cannot buy a new .com domain name in Azure DNS).',
    memoryRule:
      'Azure DNS = The phonebook translating names to IP numbers. Private Link = A secret private tunnel straight from your VNet into Azure SQL or Storage.',
    keyUnits: ['Azure DNS', 'Private Link', 'Private Endpoint'],
    quickFireOptions: [
      'Azure DNS hosts DNS records on global name servers; Private Link connects VNets privately to PaaS services via private IPs',
      'Azure DNS lets you purchase and register new .com domain names without a registrar',
      'Private Link exposes internal VMs directly to the public internet without a firewall',
      'Azure DNS encrypts hard drives inside Virtual Machine Scale Sets',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Azure DNS hosts DNS zones/records (not domain registration), while Private Link assigns private VNet IPs to PaaS resources.',
  },
  {
    id: 'fc-blob-access-tiers',
    pathId: 2,
    moduleId: 6,
    term: 'Azure Blob Storage Access Tiers (Hot, Cool, Cold, Archive)',
    acronym: 'Hot / Cool / Cold / Archive',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Storage Services',
    frontPrompt:
      'How do the four Azure Blob Storage access tiers compare in storage cost, transaction cost, retention period, and retrieval latency?',
    officialDefinition:
      '1. Hot Tier: Highest storage cost, lowest access/read cost; for frequently accessed data. 2. Cool Tier: Lower storage cost, higher read cost; for data stored at least 30 days. 3. Cold Tier: Even lower storage cost, higher read cost; for data stored at least 90 days. 4. Archive Tier: Offline tier with the lowest storage cost per GB, highest retrieval cost, minimum 180-day retention, and hours of rehydration latency before reading.',
    examTrap:
      'Exam Trap: Hot, Cool, and Cold tiers are all ONLINE (millisecond first-byte latency). ONLY the Archive tier is OFFLINE and requires rehydration to Hot or Cool before data can be read!',
    memoryRule:
      'Hot = Kitchen counter (daily use). Cool = Pantry (30d). Cold = Basement freezer (90d). Archive = Locked deep vault (180d, hours to unlock).',
    keyUnits: ['Hot Tier', 'Cool Tier', 'Cold Tier', 'Archive Rehydration'],
    quickFireOptions: [
      'Archive tier is offline with the lowest storage cost, highest retrieval cost, and requires rehydration (hours) before reading',
      'Archive tier provides millisecond instant read access for live web application images',
      'Hot tier has the lowest storage cost per GB and highest retrieval fee',
      'Cool tier requires 180 days minimum retention and 12 hours of rehydration latency',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Archive tier has the lowest storage price per GB but is offline and requires rehydration before reading; Hot tier has the highest storage price and lowest read fee.',
  },
  {
    id: 'fc-storage-redundancy-models',
    pathId: 2,
    moduleId: 6,
    term: 'Storage Redundancy (LRS vs ZRS vs GRS vs GZRS)',
    acronym: 'LRS / ZRS / GRS / GZRS',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Storage Services',
    frontPrompt:
      'How many copies of data are maintained in LRS, ZRS, GRS, and GZRS, and what happens until read access is enabled on a secondary region (RA-GRS)?',
    officialDefinition:
      'LRS (Locally Redundant): 3 synchronous copies in 1 datacenter (11 nines durability). ZRS (Zone-Redundant): 3 synchronous copies across 3 Availability Zones in 1 region (12 nines). GRS (Geo-Redundant): 3 copies in primary region + 3 asynchronous copies in paired secondary region (6 total copies, 16 nines). GZRS: ZRS in primary region + LRS in secondary region. Note: The secondary region in GRS/GZRS is NOT readable unless you choose RA-GRS or RA-GZRS (Read-Access)!',
    examTrap:
      'Exam Trap: Standard GRS replicates 6 copies total across two regions, but you CANNOT read from the secondary region unless Microsoft initiates a regional failover OR you configure RA-GRS (Read-Access Geo-Redundant Storage).',
    memoryRule:
      'LRS = 3 copies in 1 room. ZRS = 3 copies in 3 buildings. GRS = 3 in Nairobi + 3 in Mombasa. RA-GRS = Read-Access window open in Mombasa.',
    keyUnits: ['LRS', 'ZRS', 'GRS', 'GZRS', 'RA-GRS'],
    quickFireOptions: [
      'LRS keeps 3 copies in 1 datacenter; ZRS spans 3 Zones; GRS keeps 6 copies across 2 regions (RA-GRS enables secondary read)',
      'LRS automatically replicates data across two continents',
      'Standard GRS allows applications to read freely from the secondary region at any time without RA-GRS',
      'ZRS keeps only 1 copy of data in a single server rack',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'LRS = 3 copies in one datacenter; ZRS = 3 Availability Zones; GRS = 6 copies across paired regions (requiring RA-GRS for secondary read access before failover).',
  },
  {
    id: 'fc-four-storage-account-services',
    pathId: 2,
    moduleId: 6,
    term: 'The 4 Core Azure Storage Account Services',
    acronym: 'Blobs / Files / Queues / Tables',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Storage Services',
    frontPrompt:
      'When do you use Azure Blobs vs. Azure Files vs. Azure Queues vs. Azure Tables vs. Managed Disks?',
    officialDefinition:
      '1. Azure Blobs: Massively scalable object storage for unstructured data (images, video, backups, logs). 2. Azure Files: Managed cloud file shares mounted via SMB/NFS protocols across multiple machines. 3. Azure Queues: Asynchronous message queuing (up to 64 KB per message) to decouple app components. 4. Azure Tables: NoSQL key-value store for semi-structured schemaless data. 5. Managed Disks: Block-level virtual hard disks (Ultra, Premium SSD, Standard SSD, Standard HDD) attached to Azure VMs.',
    examTrap:
      'Exam Trap: "Decouple two microservice components by storing small backlog messages" = Azure Queue Storage. "Mount a shared network drive via SMB protocol" = Azure Files.',
    memoryRule:
      'Blobs = Media/Backups. Files = Shared Z: Drive. Queues = Post Office To-Do Line. Tables = Fast Key-Value Ledger. Disks = VM Hard Drive.',
    keyUnits: ['Blob Storage', 'Azure Files', 'Queue Storage', 'Table Storage', 'Managed Disks'],
    quickFireOptions: [
      'Blobs = unstructured objects; Files = SMB/NFS shares; Queues = async messaging; Tables = NoSQL key-value; Disks = VM block storage',
      'Azure Queues is designed for streaming 4K movies directly to web browsers',
      'Azure Files only supports relational SQL joins and stored procedures',
      'Azure Table Storage is used to mount OS boot volumes on Virtual Machines',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Each Azure Storage service targets a specific data pattern: Blobs (objects), Files (SMB/NFS shares), Queues (decoupled messages), Tables (NoSQL key-value), and Disks (VM block volumes).',
  },
  {
    id: 'fc-azcopy-storage-explorer-databox',
    pathId: 2,
    moduleId: 6,
    term: 'AzCopy vs. Azure Storage Explorer vs. Azure Data Box vs. Azure Migrate',
    acronym: 'Migration & Data Tools',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Storage Services',
    frontPrompt:
      'How do you distinguish AzCopy, Azure Storage Explorer, Azure Data Box, and Azure Migrate on exam scenario questions?',
    officialDefinition:
      '1. AzCopy: High-performance command-line utility (CLI) for copying blobs or files to/from/between storage accounts via scripts. 2. Azure Storage Explorer: Standalone graphical desktop app (GUI) for Windows, macOS, and Linux to visually browse and manage storage files. 3. Azure Data Box: Rugged physical hardware appliance shipped by Microsoft to transfer 40 TB–80 TB+ of offline data when network bandwidth is limited. 4. Azure Migrate: Unified hub for discovering, assessing, and migrating on-premises VMs, SQL databases, and web apps to Azure.',
    examTrap:
      'Exam Trap: "Command-line script to copy blobs between two storage accounts" = AzCopy. "Graphical desktop GUI for macOS/Windows to manage blobs" = Storage Explorer. "Transfer 70 TB over slow internet" = Azure Data Box.',
    memoryRule:
      'AzCopy = CLI Speed Script. Storage Explorer = Visual GUI Window. Data Box = Physical Rugged Suitcase. Azure Migrate = Full Datacenter Moving Company.',
    keyUnits: ['AzCopy', 'Storage Explorer', 'Azure Data Box', 'Azure Migrate'],
    quickFireOptions: [
      'AzCopy = CLI script tool; Storage Explorer = GUI desktop app; Data Box = physical offline appliance (80 TB); Migrate = server/DB migration hub',
      'AzCopy is a physical 80 TB hard drive shipped via courier to your datacenter',
      'Azure Data Box is a browser extension for editing JSON policy files',
      'Azure Storage Explorer only runs on command-line terminals without a graphical interface',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'AzCopy is CLI-based, Storage Explorer is a GUI desktop application, Data Box is a physical hardware transfer appliance, and Azure Migrate assesses/migrates servers and databases.',
  },

  // =====================================================================
  // PATH 3: IDENTITY, SECURITY, COST, GOVERNANCE & MONITORING (MODULES 7–12)
  // =====================================================================
  {
    id: 'fc-authn-vs-authz',
    pathId: 3,
    moduleId: 7,
    term: 'Authentication (AuthN) vs. Authorization (AuthZ)',
    acronym: 'AuthN vs AuthZ',
    category: 'Identity & Security',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'What is the exact difference between Authentication and Authorization, and which Azure mechanisms enforce each?',
    officialDefinition:
      'Authentication (AuthN) verifies WHO a user or service is by validating credentials (username/password, MFA, Windows Hello, FIDO2 security keys, SSO). Authorization (AuthZ) determines WHAT level of access an authenticated identity has and which specific actions they are permitted to perform (enforced via Azure RBAC roles like Owner, Contributor, Reader).',
    examTrap:
      'Exam Trap: Multi-Factor Authentication (MFA) and Single Sign-On (SSO) are Authentication (AuthN). Assigning a user the Reader role on a Resource Group is Authorization (AuthZ).',
    memoryRule:
      'Authentication = Showing your National ID at the airport gate (Who are you?). Authorization = Your boarding pass seat class (Where are you allowed to sit?).',
    keyUnits: ['Authentication', 'Authorization', 'MFA', 'RBAC'],
    quickFireOptions: [
      'Authentication verifies identity (Who you are via MFA/SSO); Authorization determines permitted actions (What you can do via RBAC)',
      'Authorization verifies your biometric fingerprint while Authentication assigns Resource Locks',
      'Single Sign-On (SSO) is an Authorization mechanism that grants Subscription Owner rights',
      'Authentication only happens after a user deletes an Azure Resource Group',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Authentication (AuthN) proves identity ("who you are"); Authorization (AuthZ) governs permissions ("what you are allowed to access").',
  },
  {
    id: 'fc-entra-id-editions-external-b2b-b2c',
    pathId: 3,
    moduleId: 7,
    term: 'Microsoft Entra ID & External Identities (B2B vs B2C)',
    acronym: 'Entra ID / B2B / B2C',
    category: 'Identity & Security',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'How does Microsoft Entra External ID distinguish Business-to-Business (B2B) collaboration from Business-to-Customer (B2C)?',
    officialDefinition:
      'Microsoft Entra ID is Azure’s cloud identity and access management service. B2B (Business-to-Business) lets you invite external partner/vendor guest users to collaborate in your corporate tenant using their existing credentials. B2C (Business-to-Customer) is a customer identity management service for consumer-facing web/mobile apps where millions of customers sign up using social logins (Google, Facebook, MicrosoftAccount).',
    examTrap:
      'Exam Trap: Inviting an external consultant to access a SharePoint site or Resource Group = B2B Guest Collaboration. Building a retail shopping app where customers log in with Gmail = B2C.',
    memoryRule:
      'B2B = Partner badge for visiting contractors. B2C = Public storefront login for millions of shoppers.',
    keyUnits: ['Entra ID', 'B2B Guest', 'B2C Consumer', 'SSO'],
    quickFireOptions: [
      'B2B invites external partner/vendor guests into your organization; B2C manages consumer logins (Google/Facebook) for customer-facing apps',
      'B2B is only for consumer mobile games while B2C is for internal domain controllers',
      'Entra ID uses legacy Kerberos and Group Policy Objects (GPOs) natively over the internet',
      'Single Sign-On (SSO) requires users to maintain a separate password for every cloud app',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Entra B2B is for partner/contractor guest collaboration; Entra B2C is for consumer/customer identity in public-facing apps.',
  },
  {
    id: 'fc-conditional-access-zero-trust',
    pathId: 3,
    moduleId: 7,
    term: 'Conditional Access & Zero Trust Security Model',
    acronym: 'Zero Trust / Conditional Access',
    category: 'Identity & Security',
    cardType: 'Concept & Architecture',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'What are the three guiding principles of the Microsoft Zero Trust model, and how does Conditional Access enforce them?',
    officialDefinition:
      'The three principles of Zero Trust are: 1. Verify explicitly (always authenticate and authorize based on all available signals: identity, location, device health), 2. Use least-privileged access (Just-In-Time and Just-Enough-Access via RBAC/PIM), 3. Assume breach (segment networks, encrypt end-to-end, monitor threats). Conditional Access acts as the Zero Trust policy engine using Signals (User, IP Location, Device, Risk) → Decision (Grant or Block) → Enforcement (Require MFA or compliant device).',
    examTrap:
      'Exam Trap: Zero Trust NEVER automatically trusts a user just because they are sitting inside the corporate office firewall ("Never trust, always verify").',
    memoryRule:
      'Zero Trust = Verify Explicitly, Least Privilege, Assume Breach. Conditional Access = The If-Then Signal Gatekeeper.',
    keyUnits: ['Zero Trust', 'Conditional Access', 'Verify Explicitly', 'Least Privilege'],
    quickFireOptions: [
      'Verify explicitly, use least-privileged access, and assume breach (enforced via Conditional Access signals)',
      'Automatically trust all devices connected to the internal corporate office Wi-Fi without MFA',
      'Grant every employee permanent Subscription Owner permissions to avoid access tickets',
      'Disable encryption inside private Virtual Networks to improve throughput',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Zero Trust is built on three pillars: Verify explicitly, Use least-privileged access, and Assume breach.',
  },
  {
    id: 'fc-azure-rbac-roles',
    pathId: 3,
    moduleId: 7,
    term: 'Azure Role-Based Access Control (RBAC)',
    acronym: 'RBAC',
    category: 'Identity & Security',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'What are the core built-in roles in Azure RBAC, and what can an Owner do that a Contributor cannot?',
    officialDefinition:
      'Azure RBAC enforces fine-grained access management. Core built-in roles: 1. Owner (full access to all resources, including delegating/granting access to others), 2. Contributor (can create, update, and delete all resources, but CANNOT grant access to other users), 3. Reader (view-only access), 4. User Access Administrator (can manage user access to resources).',
    examTrap:
      'Exam Trap: A Contributor can create and delete Virtual Machines, but CANNOT assign RBAC roles to colleagues. Only Owner or User Access Administrator can assign permissions.',
    memoryRule:
      'Owner = Chief who allocates land and grants deeds. Contributor = Builder who constructs buildings but cannot transfer deeds. Reader = Visitor.',
    keyUnits: ['RBAC', 'Owner', 'Contributor', 'Reader'],
    quickFireOptions: [
      'Contributor can create and manage all resources but cannot grant RBAC access to other users (Owner can)',
      'Reader can reboot and resize Virtual Machines but cannot delete them',
      'Contributor has permission to assign Owner roles to external guests',
      'RBAC roles Assigned at the Subscription level do not inherit down to Resource Groups',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Contributors have full resource management rights EXCEPT the ability to grant or modify RBAC permissions for others.',
  },
  {
    id: 'fc-defense-in-depth',
    pathId: 3,
    moduleId: 7,
    term: 'Defense in Depth (7 Security Layers)',
    acronym: '7 Rings of Security',
    category: 'Identity & Security',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'What is the exact outside-in order of the 7 layers in the Azure Defense in Depth security model?',
    officialDefinition:
      'From outermost layer to innermost core: 1. Physical Security (datacenter biometrics/guards), 2. Identity & Access (Entra ID, MFA, SSO), 3. Perimeter (DDoS Protection, Azure Firewall), 4. Network (VNet segmentation, NSGs), 5. Compute (VM patching, endpoint protection, closing RDP/SSH ports), 6. Application (secure APIs, WAF, Key Vault secrets), 7. Data (encryption at rest and in transit—the ultimate asset being protected).',
    examTrap:
      'Exam Trap: Exam drag-and-drop questions frequently test the exact order of layers—remember Physical is outermost, Perimeter comes BEFORE Network, and Data is at the center!',
    memoryRule:
      'People In Perimeter Networks Can Always Defend (Physical → Identity → Perimeter → Network → Compute → Application → Data).',
    keyUnits: ['Defense in Depth', '7 Layers', 'Perimeter vs Network'],
    quickFireOptions: [
      'Physical → Identity & Access → Perimeter → Network → Compute → Application → Data',
      'Data → Application → Network → Perimeter → Identity → Physical → Compute',
      'Network → Perimeter → Physical → Compute → Identity → Data → Application',
      'Identity → Physical → Compute → Network → Perimeter → Application → Data',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Remember the mnemonic "People In Perimeter Networks Can Always Defend": Physical → Identity → Perimeter → Network → Compute → Application → Data.',
  },
  {
    id: 'fc-defender-keyvault-sentinel-ddos',
    pathId: 3,
    moduleId: 7,
    term: 'Defender for Cloud vs. Key Vault vs. Sentinel vs. DDoS Protection',
    acronym: 'Security Services Matrix',
    category: 'Identity & Security',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'Which Azure security service provides CSPM Secure Score vs. Secrets Management vs. Cloud SIEM/SOAR vs. Volumetric Traffic Scrubbing?',
    officialDefinition:
      '1. Microsoft Defender for Cloud: Cloud Security Posture Management (CSPM) and Workload Protection (CWPP) that calculates your Secure Score and recommends security hardening across Azure, hybrid (Arc), and multi-cloud. 2. Azure Key Vault: Centralized hardware-backed vault for storing secrets (passwords, API keys), encryption keys, and SSL/TLS certificates. 3. Microsoft Sentinel: Cloud-native SIEM (Security Information and Event Management) and SOAR for AI-driven threat detection and automated response across the enterprise. 4. Azure DDoS Protection: Scrubs malicious volumetric flood traffic at the network edge before it impacts service availability.',
    examTrap:
      'Exam Trap: "Store database connection strings, API keys, and SSL certificates securely" = Azure Key Vault. "Track Secure Score and regulatory compliance posture" = Defender for Cloud.',
    memoryRule:
      'Defender = Security Coach & Secure Score. Key Vault = Digital Safe for Keys/Secrets. Sentinel = AI Watchtower (SIEM). DDoS = Floodgate Barrier.',
    keyUnits: ['Defender for Cloud', 'Azure Key Vault', 'Microsoft Sentinel', 'DDoS Protection'],
    quickFireOptions: [
      'Defender for Cloud = Secure Score & posture; Key Vault = secrets/keys/certificates; Sentinel = SIEM/SOAR; DDoS = traffic flood scrubbing',
      'Azure Key Vault is a SIEM tool that aggregates firewall logs across AWS and Azure',
      'Defender for Cloud is used solely to register public DNS domain names',
      'Azure DDoS Protection stores application passwords and TLS certificates',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Defender for Cloud manages security posture/Secure Score, Key Vault stores secrets/keys/certs, Sentinel is SIEM/SOAR, and DDoS Protection scrubs volumetric network attacks.',
  },
  {
    id: 'fc-azure-pricing-calculator-tco',
    pathId: 3,
    moduleId: 8,
    term: 'Azure Pricing Calculator vs. TCO Calculator vs. Cost Management',
    acronym: 'Pricing vs TCO vs Cost Mgmt',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Cost Management in Azure',
    frontPrompt:
      'How do you distinguish the Azure Pricing Calculator, TCO Calculator, and Microsoft Cost Management + Billing on exam scenarios?',
    officialDefinition:
      '1. Azure Pricing Calculator: Public web tool to estimate expected monthly costs of new Azure deployments before provisioning (select VMs, region, storage tiers, reservations). 2. Total Cost of Ownership (TCO) Calculator: Migration comparison tool that calculates 3-to-5-year savings of moving an on-premises datacenter (electricity, cooling, hardware, IT labor) to Azure. 3. Microsoft Cost Management: Post-deployment portal tool to analyze actual historical/current cloud spend, set Budgets, and trigger automated email/webhook Cost Alerts.',
    examTrap:
      'Exam Trap: "Estimate cost of 4 VMs and 2 TB Blob storage before deploying" = Pricing Calculator. "Present a 3-year business case comparing on-premises server room costs vs Azure" = TCO Calculator. "Set an alert when actual monthly spend hits 80% of $5,000" = Cost Management Budgets.',
    memoryRule:
      'Pricing Calc = Pre-shopping price tag check. TCO Calc = Renting vs Owning a house comparison. Cost Management = Monthly bank statement & budget alarm.',
    keyUnits: ['Pricing Calculator', 'TCO Calculator', 'Cost Management', 'Budgets & Alerts'],
    quickFireOptions: [
      'Pricing Calc estimates new Azure workloads; TCO Calc compares on-premises vs Azure migration savings; Cost Mgmt tracks actual spend & budgets',
      'TCO Calculator automatically shuts down running production VMs when budgets are exceeded',
      'Pricing Calculator analyzes your historical on-premises electricity bills over 5 years',
      'Microsoft Cost Management can only be used before creating an Azure account',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Use Pricing Calculator for estimating planned Azure resources, TCO Calculator for on-premises-to-cloud migration ROI, and Cost Management for actual spend analysis and budget alerts.',
  },
  {
    id: 'fc-reservations-spot-hybrid-benefit',
    pathId: 3,
    moduleId: 8,
    term: 'Azure Reservations vs. Savings Plans vs. Spot VMs vs. Hybrid Benefit',
    acronym: 'Cost Optimization Levers',
    category: 'Governance & Cost',
    cardType: 'Governance, SLA & Cost',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Cost Management in Azure',
    frontPrompt:
      'Which cost-saving option saves up to 72% for predictable 1-or-3-year workloads vs. up to 90% for interruptible workloads vs. reusing on-premises Windows/SQL licenses?',
    officialDefinition:
      '1. Azure Reservations (Reserved Instances): Up to 72% discount by committing to a specific VM SKU and region for 1 or 3 years (predictable steady-state workloads). 2. Azure Savings Plans for Compute: Up to 65% discount by committing to a fixed hourly spend ($/hr) for 1 or 3 years across any region/compute service. 3. Azure Spot VMs: Up to 90% discount on unused Azure capacity, but Azure can evict/interrupt the VM with 30 seconds notice (ideal for batch jobs). 4. Azure Hybrid Benefit (AHB): Reuse existing on-premises Windows Server and SQL Server licenses with Software Assurance in Azure.',
    examTrap:
      'Exam Trap: Never use Azure Spot VMs for mission-critical production databases because Spot VMs can be evicted at any time when Azure needs capacity back!',
    memoryRule:
      'Reservations = 1–3 Year Lease (72% off). Spot VMs = Standby airline ticket (90% off, can be bumped). Hybrid Benefit = Bring Your Own License (BYOL).',
    keyUnits: ['Azure Reservations', 'Spot VMs', 'Azure Hybrid Benefit', 'Savings Plans'],
    quickFireOptions: [
      'Reservations = 1/3-yr commitment (up to 72% off); Spot VMs = interruptible spare capacity (up to 90% off); Hybrid Benefit = reuse Windows/SQL licenses',
      'Spot VMs guarantee 99.99% SLA uptime and can never be interrupted by Microsoft',
      'Azure Hybrid Benefit provides free physical fiber optic cables to your office',
      'Azure Reservations require a 10-year contract and only apply to Archive Blob storage',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Reservations reward 1-or-3-year commitments, Spot VMs offer deep discounts for interruptible batch workloads, and Hybrid Benefit reuses existing Windows/SQL licenses.',
  },
  {
    id: 'fc-resource-tags-cost-allocation',
    pathId: 3,
    moduleId: 8,
    term: 'Resource Tags (Name:Value Metadata & Inheritance)',
    acronym: 'Tags',
    category: 'Governance & Cost',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Cost Management in Azure',
    frontPrompt:
      'What are Azure Resource Tags used for, do they inherit automatically from Resource Groups, and do they control security permissions?',
    officialDefinition:
      'Resource Tags are custom Name:Value text pairs (e.g., CostCenter: Marketing, Environment: Production, Owner: Finance) applied to Azure resources, resource groups, or subscriptions to logically organize assets, filter billing reports in Cost Management, and automate operational scripts. Tags do NOT inherit automatically from parent Resource Groups (unless enforced via Azure Policy) and do NOT grant RBAC security access.',
    examTrap:
      'Exam Trap: Applying a tag "Department: HR" to a Resource Group does NOT automatically tag the 15 VMs inside that Resource Group unless you use an Azure Policy ("Inherit a tag from the resource group")!',
    memoryRule:
      'Tags = Color-coded sticky notes for billing and sorting; sticky notes on a folder do not automatically stick to every page inside.',
    keyUnits: ['Resource Tags', 'Cost Center', 'No Automatic Inheritance'],
    quickFireOptions: [
      'Key-value metadata pairs for billing/organization; tags do NOT inherit automatically from Resource Groups unless enforced by Azure Policy',
      'Tags automatically inherit from Subscriptions down to every child VM by default',
      'Assigning a tag "Role: Owner" grants full administrative RBAC permissions to a user',
      'Resources with the same Tag must reside in the same Virtual Network',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Tags are organizational/billing key-value metadata pairs; they do not control access permissions and do not inherit automatically without an Azure Policy.',
  },
  {
    id: 'fc-azure-policy-vs-rbac',
    pathId: 3,
    moduleId: 9,
    term: 'Azure Policy vs. RBAC vs. Initiatives',
    acronym: 'Policy & Initiatives',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Governance & Compliance Tools',
    frontPrompt:
      'Why does a user with the Subscription Owner role still get blocked from creating a VM in West Europe when an Azure Policy only allows East US?',
    officialDefinition:
      'Azure Policy evaluates resource properties against business rules (e.g., Allowed Locations, Allowed VM SKUs, Require a Tag, Enable Defender). An Initiative is a collection (bundle) of related Azure Policy definitions grouped toward a compliance goal (e.g., PCI-DSS or ISO 27001). Azure Policy and RBAC are evaluated together: if EITHER denies the action, the deployment is blocked—even for Subscription Owners!',
    examTrap:
      'Exam Trap: RBAC focuses on USER actions (WHO can do what). Azure Policy focuses on RESOURCE properties and compliance state (WHAT configurations are allowed).',
    memoryRule:
      'RBAC = Your VIP Club Membership Card. Azure Policy = The Dress Code at the door (even VIPs get turned away without shoes). Initiative = The Complete Rulebook.',
    keyUnits: ['Azure Policy', 'Policy Initiative', 'Compliance', 'RBAC vs Policy'],
    quickFireOptions: [
      'Azure Policy enforces resource property rules (e.g., allowed regions/SKUs) even on Owners; an Initiative groups multiple policies together',
      'Subscription Owners automatically bypass all Azure Policy restrictions',
      'Azure Policy is used to reset forgotten user passwords in Microsoft Entra ID',
      'An Initiative is a single Virtual Machine image stored in Blob storage',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Azure Policy enforces resource compliance guardrails on all users (including Owners), and an Initiative bundles multiple Policy definitions.',
  },
  {
    id: 'fc-resource-locks',
    pathId: 3,
    moduleId: 9,
    term: 'Azure Resource Locks (CanNotDelete vs. ReadOnly)',
    acronym: 'Delete vs ReadOnly Lock',
    category: 'Governance & Cost',
    cardType: 'Exam Trap & Distinction',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Governance & Compliance Tools',
    frontPrompt:
      'What is the exact behavioral difference between a CanNotDelete lock and a ReadOnly lock, and how do they interact with RBAC Owners?',
    officialDefinition:
      'Resource Locks prevent accidental deletion or modification of critical resources: 1. Delete (CanNotDelete) lock: Authorized users can read and modify/update a resource, but CANNOT delete it. 2. ReadOnly lock: Authorized users can only read the resource; they CANNOT modify or delete it (note: ReadOnly on a VM prevents starting/stopping the VM!). Locks inherit downward from Subscriptions and Resource Groups and override RBAC Owner permissions until explicitly removed.',
    examTrap:
      'Exam Trap: Putting a ReadOnly lock on a Resource Group prevents engineers from starting, stopping, or resizing VMs inside it, because starting a VM is a POST/write modification operation!',
    memoryRule:
      'CanNotDelete = Bolted to the floor (you can use it, cannot throw it away). ReadOnly = Sealed behind museum glass (look only, no touching switches).',
    keyUnits: ['Resource Locks', 'CanNotDelete', 'ReadOnly', 'Lock Inheritance'],
    quickFireOptions: [
      'CanNotDelete allows reading and modifying but blocks deletion; ReadOnly blocks both modifying and deleting (even for Owners)',
      'ReadOnly lock allows administrators to start, stop, and resize Virtual Machines freely',
      'Subscription Owners can delete a locked resource without removing the Resource Lock first',
      'Resource Locks only apply to unauthenticated guest users',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'CanNotDelete permits modifications while blocking deletion; ReadOnly blocks all modifications and deletions, and locks apply even to Owners until removed.',
  },
  {
    id: 'fc-service-trust-portal-purview',
    pathId: 3,
    moduleId: 9,
    term: 'Microsoft Purview vs. Microsoft Service Trust Portal',
    acronym: 'Purview vs Service Trust',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Governance & Compliance Tools',
    frontPrompt:
      'Where does an auditor download Microsoft’s independent ISO/SOC audit reports versus discovering and classifying sensitive customer data across the estate?',
    officialDefinition:
      '1. Microsoft Service Trust Portal (STP): The public/authenticated portal providing access to Microsoft’s independent third-party audit reports (ISO, SOC 1/2/3, NIST, FedRAMP), whitepapers, and compliance guides. 2. Microsoft Purview: Unified data governance, risk, and compliance platform that automatically discovers, classifies, labels, and tracks lineage of sensitive data across on-premises, Azure, M365, and multi-cloud.',
    examTrap:
      'Exam Trap: "Download Microsoft SOC 2 and ISO 27001 audit certificates" = Service Trust Portal. "Automatically discover, classify, and track data lineage across SQL and Blob storage" = Microsoft Purview.',
    memoryRule:
      'Service Trust Portal = Microsoft’s own inspection certificates on the wall. Purview = Your smart librarian cataloging and labeling every sensitive document you own.',
    keyUnits: ['Service Trust Portal', 'Microsoft Purview', 'Audit Reports', 'Data Classification'],
    quickFireOptions: [
      'Service Trust Portal provides Microsoft audit reports (SOC/ISO); Microsoft Purview provides unified data discovery, classification, and lineage',
      'Microsoft Purview is used to purchase Reserved VM Instances at a 72% discount',
      'Service Trust Portal automatically encrypts on-premises Linux hard drives',
      'Both tools are command-line utilities for deploying Kubernetes clusters',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Service Trust Portal hosts Microsoft’s third-party compliance/audit reports; Microsoft Purview governs, discovers, and classifies your organization’s data estate.',
  },
  {
    id: 'fc-arm-templates-bicep-iac',
    pathId: 3,
    moduleId: 10,
    term: 'Infrastructure as Code: ARM Templates vs. Bicep',
    acronym: 'ARM / Bicep / IaC',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Managing and Deploying Azure Resources',
    frontPrompt:
      'How do Azure Resource Manager (ARM) Templates and Azure Bicep implement declarative Infrastructure as Code (IaC) and idempotency?',
    officialDefinition:
      'Azure Resource Manager (ARM) is the deployment and management layer that receives every request from Portal, CLI, PowerShell, or SDKs. ARM Templates are declarative JSON files defining the desired state of infrastructure. Azure Bicep is a domain-specific language (DSL) with cleaner, concise syntax that transpiles directly into standard ARM JSON templates. Both are idempotent (running the same template repeatedly produces the exact same environment without duplicating resources).',
    examTrap:
      'Exam Trap: ARM Templates use JSON syntax; Bicep uses a cleaner domain-specific language (DSL) that compiles into ARM JSON. Both are DECLARATIVE (you state WHAT you want, not step-by-step imperative commands).',
    memoryRule:
      'ARM = The master architect desk. ARM Template = Detailed JSON blueprint. Bicep = Clean shorthand blueprint that auto-converts to JSON.',
    keyUnits: ['Azure Resource Manager', 'ARM Templates', 'Azure Bicep', 'Declarative IaC'],
    quickFireOptions: [
      'ARM Templates use declarative JSON; Bicep is a cleaner declarative DSL that transpiles into ARM JSON templates',
      'Bicep is an imperative scripting language that only runs on macOS laptops',
      'Running an ARM template twice creates duplicate copies of every resource by default',
      'Azure Portal requests bypass Azure Resource Manager (ARM) completely',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Every request passes through Azure Resource Manager (ARM); ARM Templates are declarative JSON, and Bicep is a cleaner declarative language compiling to ARM JSON.',
  },
  {
    id: 'fc-cloud-shell-cli-powershell-arc',
    pathId: 3,
    moduleId: 10,
    term: 'Azure Cloud Shell vs. Azure Arc',
    acronym: 'Cloud Shell / Azure Arc',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Managing and Deploying Azure Resources',
    frontPrompt:
      'What is Azure Cloud Shell, and how does Azure Arc extend Azure management to on-premises and multi-cloud servers?',
    officialDefinition:
      '1. Azure Cloud Shell: An interactive, browser-accessible, pre-authenticated shell environment supporting both Bash (Azure CLI) and PowerShell with persistent file storage backed by an Azure Files share (sessions time out after 20 minutes of inactivity). 2. Azure Arc: Extends the Azure Resource Manager control plane (Azure Policy, RBAC, Tags, Defender, Monitor) to Windows/Linux servers, Kubernetes clusters, and SQL databases running on-premises or in AWS/GCP.',
    examTrap:
      'Exam Trap: Whenever an exam question asks how to apply Azure Policy, Tags, and Defender for Cloud to servers running on-premises or in AWS/Google Cloud, the answer is ALWAYS Azure Arc!',
    memoryRule:
      'Cloud Shell = Browser terminal ready anywhere. Azure Arc = Extending the Azure governance umbrella over non-Azure servers.',
    keyUnits: ['Azure Cloud Shell', 'Azure Arc', 'Hybrid & Multi-Cloud Governance'],
    quickFireOptions: [
      'Cloud Shell is a browser-based Bash/PowerShell terminal; Azure Arc extends Azure Policy, Tags, and governance to on-premises and multi-cloud servers',
      'Azure Arc is a physical fiber optic cable connecting two Availability Zones',
      'Azure Cloud Shell requires installing a 20 GB virtual machine locally on your phone',
      'Azure Arc can only manage resources deployed inside East US Azure datacenters',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Cloud Shell provides a browser-hosted Bash/PowerShell terminal; Azure Arc projects non-Azure (on-prem/AWS/GCP) servers into Azure Resource Manager.',
  },
  {
    id: 'fc-azure-advisor-5-pillars',
    pathId: 3,
    moduleId: 11,
    term: 'Azure Advisor (5 Well-Architected Assessment Pillars)',
    acronym: 'Advisor 5 Pillars',
    category: 'Governance & Cost',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Monitoring & Advisory Services',
    frontPrompt:
      'What are the exact five recommendation pillars evaluated by Azure Advisor?',
    officialDefinition:
      'Azure Advisor is a free, personalized cloud consultant that analyzes resource configuration and usage telemetry to give actionable recommendations across 5 pillars: 1. Reliability (formerly High Availability), 2. Security, 3. Performance, 4. Cost (e.g., right-size or shut down idle VMs, buy Reservations), and 5. Operational Excellence.',
    examTrap:
      'Exam Trap: Watch out for fake pillar names on multiple-choice questions (like "Scalability", "Elasticity", or "Marketing"). The official 5 pillars are Reliability, Security, Performance, Cost, and Operational Excellence.',
    memoryRule:
      'R-S-P-C-O: Reliable Security Performs Costly Operations (Reliability, Security, Performance, Cost, Operational Excellence).',
    keyUnits: ['Azure Advisor', 'Reliability', 'Security', 'Performance', 'Cost', 'Operational Excellence'],
    quickFireOptions: [
      'Reliability, Security, Performance, Cost, and Operational Excellence',
      'Scalability, Elasticity, Agility, CapEx, and Marketing',
      'Physical, Identity, Perimeter, Network, and Compute',
      'Hot, Cool, Cold, Archive, and Geo-Redundant',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'The 5 official Azure Advisor pillars match the Azure Well-Architected Framework: Reliability, Security, Performance, Cost, and Operational Excellence.',
  },
  {
    id: 'fc-azure-service-health-three-views',
    pathId: 3,
    moduleId: 11,
    term: 'Azure Status vs. Service Health vs. Resource Health',
    acronym: '3-Tier Health Model',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Monitoring & Advisory Services',
    frontPrompt:
      'How do Azure Status, Azure Service Health, and Azure Resource Health differ in scope and granularity?',
    officialDefinition:
      '1. Azure Status: Public global web page showing broad outages across all Azure regions worldwide. 2. Azure Service Health: Personalized portal view showing service issues, planned maintenance, and health advisories specifically affecting the regions and services YOUR subscriptions use (supports Service Health Alerts). 3. Azure Resource Health: Granular diagnostic view of a SINGLE specific resource instance (e.g., why your specific VM "vm-prod-01" restarted or became unavailable).',
    examTrap:
      'Exam Trap: "Global public view of all Azure regions" = Azure Status. "Personalized view of regions/services your subscription uses" = Service Health. "Diagnose a single specific VM instance" = Resource Health.',
    memoryRule:
      'Azure Status = World Weather Map. Service Health = Your Neighborhood Forecast. Resource Health = Thermometer inside your specific bedroom.',
    keyUnits: ['Azure Status', 'Service Health', 'Resource Health'],
    quickFireOptions: [
      'Azure Status = global public view; Service Health = personalized subscription regions/services; Resource Health = individual resource instance',
      'Resource Health displays global outages for services your company does not use',
      'Azure Status requires Subscription Owner login to view a single VM’s CPU temperature',
      'Service Health is a command-line tool for copying Blob storage files',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Scope narrows from Global (Azure Status) → Subscription Regions/Services (Service Health) → Individual Resource Instance (Resource Health).',
  },
  {
    id: 'fc-azure-monitor-log-analytics-app-insights',
    pathId: 3,
    moduleId: 11,
    term: 'Azure Monitor: Log Analytics vs. Application Insights vs. Alerts',
    acronym: 'Monitor / KQL / App Insights',
    category: 'Governance & Cost',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Monitoring & Advisory Services',
    frontPrompt:
      'Within the Azure Monitor ecosystem, when do you use Log Analytics versus Application Insights and Action Groups?',
    officialDefinition:
      'Azure Monitor collects Metrics (numerical time-series telemetry like CPU %) and Logs (activity/diagnostic records) from Azure and on-premises resources. 1. Log Analytics: Workspace tool in the Azure Portal to write and run Kusto Query Language (KQL) queries against aggregated log data. 2. Application Insights: Application Performance Management (APM) feature that monitors live web applications (request rates, response latency, HTTP failure codes, dependency bottlenecks). 3. Azure Monitor Alerts & Action Groups: Trigger automated notifications (Email, SMS, Webhook) or auto-scaling actions when metrics/logs cross thresholds.',
    examTrap:
      'Exam Trap: "Write complex KQL queries over aggregated infrastructure logs" = Log Analytics. "Detect why a live web app’s HTTP API calls are slow or returning 500 errors" = Application Insights.',
    memoryRule:
      'Metrics = Car Speedometer (real-time numbers). Log Analytics = Black Box Flight Recorder (queryable logs). App Insights = Web App Heartbeat Monitor.',
    keyUnits: ['Azure Monitor', 'Log Analytics', 'Application Insights', 'Monitor Alerts'],
    quickFireOptions: [
      'Log Analytics queries aggregated logs via KQL; Application Insights monitors live web app performance (APM); Alerts trigger Action Groups',
      'Application Insights is used to ship 80 TB of offline data via physical rugged hard drives',
      'Log Analytics only collects billing invoices and cannot query diagnostic logs',
      'Azure Monitor Metrics can only be checked once per month via PDF mail',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Log Analytics runs queries over collected logs, Application Insights provides APM for live web applications, and Monitor Alerts invoke Action Groups.',
  },
  {
    id: 'fc-composite-sla-math-free-tier',
    pathId: 3,
    moduleId: 12,
    term: 'Composite SLA Calculation & Free Service SLA Rules',
    acronym: 'Composite SLA',
    category: 'Governance & Cost',
    cardType: 'Governance, SLA & Cost',
    difficulty: 'Advanced',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Exam Readiness & Composite Architecture Mastery',
    frontPrompt:
      'What happens to the Composite SLA when a Web App (99.95% SLA) depends sequentially on a SQL Database (99.99% SLA), and how do you raise a system’s SLA?',
    officialDefinition:
      'When two services run sequentially in series (both must be up for the app to work), you MULTIPLY their individual SLAs: 99.95% × 99.99% = 99.940005% (the composite SLA is ALWAYS LOWER than the weakest single service!). To INCREASE a composite SLA, you add redundant parallel failover paths (e.g., deploying across multiple Availability Zones or paired regions). Also, free-tier services typically carry NO financially backed SLA (0%).',
    examTrap:
      'Exam Trap: Adding more sequential components in a single chain (Web App → API → Function → SQL) LOWERS the composite SLA. Only adding parallel redundancy (Availability Zones / multi-region active-active) RAISES the SLA!',
    memoryRule:
      'Sequential chain = Multiplying fractions makes the number smaller (99.9% × 99.9% = 99.8%). Parallel backup = Raising resilience.',
    keyUnits: ['Composite SLA', 'Service Credits', 'Parallel Redundancy', 'Free Tier SLA'],
    quickFireOptions: [
      'Multiplying sequential SLAs lowers the composite SLA (99.95% × 99.99% = 99.94%); adding parallel redundancy (Zones/Regions) increases SLA',
      'Combining two 99.9% SLA services in series increases the total SLA to 100%',
      'Free tier Azure services always provide a 99.999% financially backed SLA credit',
      'If Microsoft misses an SLA target, your subscription is automatically deleted',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Chaining sequential dependencies lowers the combined SLA because any single component failure breaks the chain; parallel redundancy increases SLA.',
  },
  {
    id: 'fc-nsg-vs-azure-firewall-vs-waf',
    pathId: 3,
    moduleId: 12,
    term: 'Network Security Group (NSG) vs. Azure Firewall vs. WAF',
    acronym: 'NSG / Firewall / WAF',
    category: 'Identity & Security',
    cardType: 'Service Comparison',
    difficulty: 'Advanced',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Exam Readiness & Composite Architecture Mastery',
    frontPrompt:
      'How do you choose between a Network Security Group (NSG), Azure Firewall, and Web Application Firewall (WAF) on architectural scenario questions?',
    officialDefinition:
      '1. Network Security Group (NSG): Basic Layer 3/4 packet filter attached to a Subnet or VM NIC using 5-tuple rules (Source IP, Source Port, Dest IP, Dest Port, Protocol). 2. Azure Firewall: Managed, cloud-native, stateful perimeter firewall (Layer 3–7) with FQDN filtering, threat intelligence, and high availability across VNets. 3. Web Application Firewall (WAF): Layer 7 HTTP/HTTPS inspection (on Application Gateway or Front Door) protecting web apps against SQL injection and Cross-Site Scripting (XSS).',
    examTrap:
      'Exam Trap: "Filter inbound RDP port 3389 or SSH port 22 on a VM subnet" = NSG. "Protect a web app from SQL injection and XSS" = WAF. "Centralized stateful perimeter firewall with FQDN filtering" = Azure Firewall.',
    memoryRule:
      'NSG = Door bouncer checking IP & Port numbers. Azure Firewall = Central customs border checkpoint. WAF = Food taster checking HTTP web requests for poison (SQLi/XSS).',
    keyUnits: ['NSG', 'Azure Firewall', 'WAF', 'Layer 4 vs Layer 7'],
    quickFireOptions: [
      'NSG filters subnet/NIC traffic by 5-tuple IP/Port; Azure Firewall is a stateful perimeter firewall; WAF blocks SQL injection & XSS on HTTP apps',
      'NSGs automatically decrypt HTTPS payloads to block SQL injection attacks',
      'Web Application Firewall (WAF) is used to assign RBAC Reader roles to users',
      'Azure Firewall is a physical hardware appliance shipped to your home office',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'NSG handles subnet/NIC IP & port filtering, Azure Firewall provides centralized stateful perimeter protection, and WAF protects web apps from Layer-7 exploits (SQLi/XSS).',
  },
  {
    id: 'fc-azure-sql-family-cosmos-db',
    pathId: 2,
    moduleId: 6,
    term: 'Azure SQL Database vs. SQL Managed Instance vs. Azure Cosmos DB',
    acronym: 'SQL DB / SQL MI / Cosmos DB',
    category: 'Networking & Storage',
    cardType: 'Service Comparison',
    difficulty: 'Intermediate',
    pathTitle: 'Describe Azure Architecture and Services',
    moduleTitle: 'Azure Storage Services',
    frontPrompt:
      'When migrating databases to Azure, when do you choose Azure SQL Database vs. Azure SQL Managed Instance vs. Azure Cosmos DB?',
    officialDefinition:
      '1. Azure SQL Database: Fully managed PaaS relational database for modern cloud apps (highest abstraction, serverless & hyperscale options). 2. Azure SQL Managed Instance (SQL MI): Near 100% compatibility with on-premises SQL Server instance features (SQL Agent, cross-database queries) for easy lift-and-shift PaaS migrations. 3. Azure Cosmos DB: Globally distributed, multi-model NoSQL database with turnkey multi-region writes and single-digit millisecond latency at 99.999% SLA.',
    examTrap:
      'Exam Trap: "Globally distributed NoSQL database with <10ms latency and multi-region writes" is ALWAYS Azure Cosmos DB. "Lift-and-shift on-premises SQL Server requiring instance-level features like SQL Agent" = SQL Managed Instance.',
    memoryRule:
      'SQL DB = Modern cloud relational table. SQL MI = Full on-prem SQL Server engine lifted to PaaS. Cosmos DB = Planet-scale NoSQL lightning engine.',
    keyUnits: ['Azure SQL Database', 'SQL Managed Instance', 'Cosmos DB'],
    quickFireOptions: [
      'SQL DB = cloud relational PaaS; SQL MI = near-100% on-prem SQL Server compatibility; Cosmos DB = globally distributed NoSQL (<10ms latency)',
      'Azure Cosmos DB only supports single-region relational tables with 4-hour read latency',
      'Azure SQL Database requires customers to manually patch the underlying Windows Server OS',
      'SQL Managed Instance is an offline tape backup service',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Cosmos DB is for globally distributed low-latency NoSQL; SQL Managed Instance is for lift-and-shift relational SQL Server compatibility; SQL Database is cloud-native relational PaaS.',
  },
  {
    id: 'fc-passwordless-windows-hello-fido2-mfa',
    pathId: 3,
    moduleId: 7,
    term: 'Passwordless Authentication (Windows Hello, Authenticator, FIDO2)',
    acronym: 'Passwordless / MFA',
    category: 'Identity & Security',
    cardType: 'Concept & Architecture',
    difficulty: 'Fundamental',
    pathTitle: 'Describe Azure Management and Governance',
    moduleTitle: 'Azure Identity, Access, and Security',
    frontPrompt:
      'What are the three official Microsoft passwordless authentication methods, and what are the three MFA verification factor categories?',
    officialDefinition:
      ' MFA requires two or more factors from: 1. Something you know (password/PIN), 2. Something you have (phone/Authenticator app/FIDO2 hardware key), 3. Something you are (biometrics: fingerprint/facial recognition). Microsoft supports 3 Passwordless methods that replace passwords entirely with stronger multi-factor cryptography: Windows Hello for Business (biometrics/PIN tied to device TPM), Microsoft Authenticator App (push notification + number matching), and FIDO2 Security Keys (USB/NFC hardware keys).',
    examTrap:
      'Exam Trap: Entering two different passwords is NOT Multi-Factor Authentication (both are "something you know"). True MFA must combine at least two DIFFERENT factor categories!',
    memoryRule:
      'Know (Password) + Have (Phone/Key) + Are (Face/Thumb). Passwordless drops the password and keeps Have + Are!',
    keyUnits: ['Passwordless', 'Windows Hello', 'FIDO2', 'MFA Factors'],
    quickFireOptions: [
      'Windows Hello for Business, Microsoft Authenticator App, and FIDO2 Security Keys (combining Something You Have + Are/PIN)',
      'Typing two separate text passwords back-to-back on the same login screen',
      'Sending unencrypted passwords over public HTTP query strings',
      'Disabling authentication on internal Virtual Networks',
    ],
    quickFireCorrectIndex: 0,
    mistakeDiagnostic:
      'Microsoft’s three passwordless options are Windows Hello for Business, Microsoft Authenticator, and FIDO2 security keys.',
  },
];
