import { CheatSheetItem } from '../types/quiz';

export interface StudyUnitServiceItem {
  name: string;
  role: string;
}

export interface StudyModuleUnitGuide {
  id: string;
  unitNumber: number;
  unitTitle: string;
  conceptExplanation: string;
  azureServices: StudyUnitServiceItem[];
  simplifiedExample: string;
  examTakeaway: string;
}

export interface StudyModuleGuide {
  moduleId: number;
  pathId: 1 | 2 | 3;
  moduleTitle: string;
  moduleSummary: string;
  units: StudyModuleUnitGuide[];
}

export const CURRICULUM_STUDY_MODULES: StudyModuleGuide[] = [
  // =========================================================================
  // LEARNING PATH 1: DESCRIBE CLOUD CONCEPTS (25–30%)
  // =========================================================================
  {
    moduleId: 1,
    pathId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    moduleSummary:
      'Master cloud computing definitions, the Shared Responsibility Model across IaaS, PaaS, and SaaS, and the architectural boundaries of Public, Private, Hybrid, and Multi-cloud deployments.',
    units: [
      {
        id: 'm1-u1',
        unitNumber: 1,
        unitTitle: 'Defining Cloud Computing',
        conceptExplanation:
          'Cloud computing is the on-demand delivery of computing services—including servers, storage, databases, networking, software, and analytics—over the internet ("the cloud"). Instead of buying and maintaining physical datacenters, you rent compute and storage capacity from a cloud provider and pay only for the resources you consume.',
        azureServices: [
          { name: 'Azure Portal', role: 'Unified web console to provision and manage on-demand cloud resources globally.' },
          { name: 'Azure Resource Manager (ARM)', role: 'Orchestration layer that processes every cloud deployment request.' },
        ],
        simplifiedExample:
          'Instead of purchasing a home power generator (buying servers), you plug your appliances into the city electrical grid (Azure) and pay only for the kilowatt-hours you use each month.',
        examTakeaway:
          'Cloud computing requires internet connectivity (or dedicated fiber) to rent compute, storage, and networking on demand.',
      },
      {
        id: 'm1-u2',
        unitNumber: 2,
        unitTitle: 'Shared Responsibility Model (IaaS vs. PaaS vs. SaaS)',
        conceptExplanation:
          'Security and operational duties are shared between the cloud provider and the customer. Physical datacenter security, power, cooling, and host virtualization are always handled by the cloud provider. Data, endpoints, accounts, and access management are ALWAYS the customer’s responsibility. Operating System (OS) patching belongs to the customer in IaaS, but shifts to the provider in PaaS and SaaS.',
        azureServices: [
          { name: 'Azure Virtual Machines (IaaS)', role: 'You manage the OS, middleware, runtime, and application data.' },
          { name: 'Azure App Service / Azure SQL (PaaS)', role: 'Provider manages the OS and runtime; you bring your code and data.' },
          { name: 'Microsoft 365 / Dynamics 365 (SaaS)', role: 'Complete software managed by the provider; you manage user access and data.' },
        ],
        simplifiedExample:
          'On-Premises is owning a car (you fix everything). IaaS is leasing a car (you drive and maintain tires/oil). PaaS is taking a taxi (driver maintains the car; you pick the route). SaaS is riding a city bus (scheduled route and vehicle fully managed).',
        examTakeaway:
          'Customer ALWAYS retains 100% responsibility for Information & Data, Devices (Endpoints), and Accounts & Identities across IaaS, PaaS, and SaaS.',
      },
      {
        id: 'm1-u3',
        unitNumber: 3,
        unitTitle: 'Public vs. Private vs. Hybrid Cloud Models',
        conceptExplanation:
          'Public cloud runs on hardware owned by a cloud provider and shared among multiple tenants over the internet. Private cloud runs on dedicated hardware exclusively for a single organization (on-premises or hosted). Hybrid cloud bridges public cloud scalability with private on-premises infrastructure so workloads and data can move seamlessly between both.',
        azureServices: [
          { name: 'Azure Stack HCI / Azure Stack Hub', role: 'Runs Azure cloud services inside your private on-premises datacenter.' },
          { name: 'Azure VPN Gateway & ExpressRoute', role: 'Connects on-premises private networks to the Azure public cloud.' },
        ],
        simplifiedExample:
          'A hospital keeps sensitive patient medical records on local servers in its basement (Private Cloud) for strict legal compliance, but bursts its public appointment booking website to Azure during flu season (Hybrid Cloud).',
        examTakeaway:
          'Public = No CapEx, multi-tenant, rapid scale. Private = Maximum control & compliance, high CapEx. Hybrid = Best of both worlds.',
      },
      {
        id: 'm1-u4',
        unitNumber: 4,
        unitTitle: 'Multi-Cloud Architectures',
        conceptExplanation:
          'Multi-cloud means deliberately using cloud services from two or more distinct public cloud providers (such as Azure alongside AWS or Google Cloud) to avoid vendor lock-in, leverage specialized features, or meet regional redundancy requirements.',
        azureServices: [
          { name: 'Azure Arc', role: 'Projects and governs servers, Kubernetes clusters, and databases running on AWS, GCP, or on-premises inside Azure.' },
          { name: 'Microsoft Defender for Cloud', role: 'Assesses security posture across Azure, AWS, and Google Cloud workloads.' },
        ],
        simplifiedExample:
          'A fintech startup runs its core banking APIs on Azure App Service while managing legacy analytics containers on AWS, using Azure Arc to apply uniform security policies to both.',
        examTakeaway:
          'Hybrid Cloud = Private + Public Cloud. Multi-Cloud = Two or more Public Cloud providers (e.g., Azure + AWS).',
      },
    ],
  },
  {
    moduleId: 2,
    pathId: 1,
    moduleTitle: 'Cloud Benefits',
    moduleSummary:
      'Differentiate High Availability, Vertical vs. Horizontal Scalability, Elasticity, Agility, Disaster Recovery, Reliability, and Predictability.',
    units: [
      {
        id: 'm2-u1',
        unitNumber: 1,
        unitTitle: 'High Availability (HA) & Reliability',
        conceptExplanation:
          'High Availability (HA) ensures maximum uptime and continuous operation even when hardware components fail, measured via Service Level Agreements (SLAs, such as 99.99%). Reliability is the ability of a system to recover gracefully from failures and continue functioning.',
        azureServices: [
          { name: 'Availability Zones', role: 'Physically separated datacenters within an Azure region with independent power, cooling, and networking.' },
          { name: 'Azure Load Balancer', role: 'Distributes incoming traffic across healthy virtual machines automatically.' },
        ],
        simplifiedExample:
          'An airplane has twin engines: if one engine fails mid-flight, the second engine keeps the plane flying safely without interruption.',
        examTakeaway:
          'High Availability focuses on continuous uptime during component failure; Disaster Recovery focuses on restoring operations after a major regional catastrophe.',
      },
      {
        id: 'm2-u2',
        unitNumber: 2,
        unitTitle: 'Scalability: Vertical (Scale Up/Down) vs. Horizontal (Scale Out/In)',
        conceptExplanation:
          'Scalability is the ability to adjust compute capacity to meet demand. Vertical scaling (Scaling Up/Down) increases or decreases the CPU/RAM power of an existing machine. Horizontal scaling (Scaling Out/In) adds or removes instances (machines/containers) running in parallel.',
        azureServices: [
          { name: 'Azure Virtual Machine Scale Sets (VMSS)', role: 'Automatically scales out or in up to 1,000 identical VMs.' },
          { name: 'Azure App Service Plan', role: 'Supports both scaling up (higher SKU tier) and scaling out (more instances).' },
        ],
        simplifiedExample:
          'Vertical Scaling = Replacing a delivery van with a bigger 18-wheeler truck. Horizontal Scaling = Adding 5 more identical delivery vans to the fleet.',
        examTakeaway:
          'Scale Up/Down = More/less CPU or RAM on 1 server. Scale Out/In = More/fewer servers in a pool.',
      },
      {
        id: 'm2-u3',
        unitNumber: 3,
        unitTitle: 'Elasticity vs. Agility',
        conceptExplanation:
          'Elasticity is automatic, dynamic scaling that adds resources when traffic spikes and removes them when demand drops. Agility is the speed at which developers can provision, configure, test, and deploy new applications in minutes rather than waiting weeks for hardware procurement.',
        azureServices: [
          { name: 'Azure Autoscale', role: 'Triggers automatic scale-out and scale-in rules based on CPU or queue metrics.' },
          { name: 'Azure Functions', role: 'Event-driven serverless compute that scales from zero to thousands of instances automatically.' },
        ],
        simplifiedExample:
          'An e-commerce store automatically spins up 20 extra checkout servers during a Black Friday flash sale and shuts them down at midnight (Elasticity).',
        examTakeaway:
          'Keywords "automatically scale based on demand spikes" = Elasticity! Keywords "deploy and innovate rapidly" = Agility!',
      },
      {
        id: 'm2-u4',
        unitNumber: 4,
        unitTitle: 'Disaster Recovery, Predictability & Governance',
        conceptExplanation:
          'Disaster Recovery (DR) replicates data and workloads across geographically distant regions to survive catastrophic outages. Cloud Predictability covers both Performance Predictability (consistent throughput) and Cost Predictability (forecasting spend with budgets and calculators).',
        azureServices: [
          { name: 'Azure Site Recovery (ASR)', role: 'Automates replication and failover of VMs to a secondary region.' },
          { name: 'Azure Backup', role: 'Managed cloud backup service protecting against ransomware and accidental deletion.' },
        ],
        simplifiedExample:
          'If a severe flood takes down an entire city power grid in East US, Azure Site Recovery fails over your banking portal to West US within minutes.',
        examTakeaway:
          'Cloud Predictability has two pillars on the exam: Performance Predictability and Cost Predictability.',
      },
    ],
  },
  {
    moduleId: 3,
    pathId: 1,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    moduleSummary:
      'Compare Capital Expenditure (CapEx) and Operational Expenditure (OpEx), consumption-based billing, and serverless financial dynamics.',
    units: [
      {
        id: 'm3-u1',
        unitNumber: 1,
        unitTitle: 'Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx)',
        conceptExplanation:
          'CapEx is the upfront spending of money on physical infrastructure (servers, land, cooling) that is depreciated over several tax years. OpEx is pay-as-you-go spending on services or products as they are used, billed monthly/hourly and deducted in the same accounting period.',
        azureServices: [
          { name: 'Azure Pay-As-You-Go Subscription', role: 'Pure OpEx billing model with zero upfront hardware investment.' },
        ],
        simplifiedExample:
          'Buying a $500,000 printing press upfront is CapEx. Paying a cloud print service $0.02 per page printed each month is OpEx.',
        examTakeaway:
          'Cloud computing shifts IT budgets from heavy upfront CapEx to flexible, consumption-driven OpEx.',
      },
      {
        id: 'm3-u2',
        unitNumber: 2,
        unitTitle: 'Consumption-Based & Serverless Pricing Models',
        conceptExplanation:
          'In a consumption-based model, end users only pay for the exact compute seconds, storage gigabytes, and outbound network bandwidth they consume. Serverless computing takes this further: when no code is triggered, compute cost is literally $0.00.',
        azureServices: [
          { name: 'Azure Functions (Consumption Plan)', role: 'Billed per execution count and execution memory-seconds.' },
          { name: 'Azure Logic Apps', role: 'Serverless workflow automation billed per connector action executed.' },
        ],
        simplifiedExample:
          'An invoice-processing function runs 50 times a day for 1 second each. You pay for 50 seconds of compute per day instead of paying for a 24/7 idle server.',
        examTakeaway:
          'Consumption-based = No wasted payment for idle capacity; stop paying the moment you deallocate a resource.',
      },
    ],
  },

  // =========================================================================
  // LEARNING PATH 2: DESCRIBE AZURE ARCHITECTURE & SERVICES (35–40%)
  // =========================================================================
  {
    moduleId: 4,
    pathId: 2,
    moduleTitle: 'Core Azure Architectural Components',
    moduleSummary:
      'Understand Azure Regions, Availability Zones, Region Pairs, Sovereign Regions, and the Management Group -> Subscription -> Resource Group -> Resource hierarchy.',
    units: [
      {
        id: 'm4-u1',
        unitNumber: 1,
        unitTitle: 'Geographies, Regions, Region Pairs & Sovereign Regions',
        conceptExplanation:
          'An Azure Region is a geographical area containing one or more datacenters connected via a low-latency network. A Region Pair consists of two regions within the same geography separated by at least 300 miles for sequential updates and disaster recovery. Sovereign Regions (Azure Government, Azure China) are physically and logically isolated instances for strict regulatory compliance.',
        azureServices: [
          { name: 'Azure Global Infrastructure', role: '60+ regions worldwide linked by Microsoft’s private fiber backbone.' },
          { name: 'Azure Government / Azure China (21Vianet)', role: 'Isolated sovereign cloud environments for government and regulatory mandates.' },
        ],
        simplifiedExample:
          'When Azure rolls out a platform software update, it updates only one region in a Region Pair at a time so both paired regions never experience Simultaneous maintenance downtime.',
        examTakeaway:
          'Region Pairs are 300+ miles apart; Azure China is operated by 21Vianet; Azure Government is for US federal/state agencies and contractors.',
      },
      {
        id: 'm4-u2',
        unitNumber: 2,
        unitTitle: 'Availability Zones (Datacenter Isolation)',
        conceptExplanation:
          'Availability Zones (AZs) are physically separate datacenters within a single Azure region. Each zone has its own independent power source, cooling system, and networking. Regions that support Availability Zones always have at least 3 separate zones (Zone 1, Zone 2, Zone 3).',
        azureServices: [
          { name: 'Zone-Redundant Services (ZRS, Zone-Redundant VMs/SQL)', role: 'Spreads instances across 3 Availability Zones for 99.99% VM SLA.' },
        ],
        simplifiedExample:
          'Deploying 3 web servers across Zone 1, Zone 2, and Zone 3 in East US means if a transformer fire knocks out Datacenter 1, Zones 2 and 3 keep your website online with zero data loss.',
        examTakeaway:
          '1 VM = 99.9% SLA (with Premium SSD). 2+ VMs across Availability Zones = 99.99% SLA!',
      },
      {
        id: 'm4-u3',
        unitNumber: 3,
        unitTitle: 'Management Groups, Subscriptions, Resource Groups & Resources',
        conceptExplanation:
          'Azure organizes resources in a 4-level hierarchy: Management Groups (top level for multi-subscription governance) -> Subscriptions (billing and access boundary) -> Resource Groups (logical lifecycle container for related resources) -> Resources (actual instances like VMs, SQL databases, VNets). RBAC and Azure Policies inherit downward across all 4 levels.',
        azureServices: [
          { name: 'Azure Management Groups', role: 'Apply policies and RBAC across multiple subscriptions simultaneously (up to 6 levels deep).' },
          { name: 'Azure Resource Groups', role: 'Logical folder where resources share a common lifecycle; deleting a Resource Group deletes everything inside it.' },
        ],
        simplifiedExample:
          'A corporation has a "Root Management Group", divided into "HR Subscription" and "Engineering Subscription". Inside Engineering, a "Project-Alpha-RG" Resource Group holds the web app, database, and storage account. When Project Alpha ends, deleting "Project-Alpha-RG" cleanly removes all three resources in one click.',
        examTakeaway:
          'A resource can belong to ONLY ONE Resource Group at a time, Resource Groups CANNOT be nested, and a Resource Group can hold resources from MULTIPLE different regions.',
      },
    ],
  },
  {
    moduleId: 5,
    pathId: 2,
    moduleTitle: 'Azure Compute & Networking Services',
    moduleSummary:
      'Select the right compute service (VMs, VMSS, App Service, ACI, AKS, AVD, Functions) and networking architecture (VNets, Peering, VPN Gateway, ExpressRoute, DNS, Endpoints).',
    units: [
      {
        id: 'm5-u1',
        unitNumber: 1,
        unitTitle: 'Virtual Machines, Scale Sets (VMSS), App Service & Azure Virtual Desktop',
        conceptExplanation:
          'Virtual Machines (VMs) provide IaaS with full OS control. VM Scale Sets (VMSS) automatically manage and scale a load-balanced group of identical VMs. Azure App Service is a fully managed PaaS for hosting web apps, REST APIs, and mobile backends. Azure Virtual Desktop (AVD) delivers cloud-hosted multi-session Windows 10/11 desktops accessible from any device.',
        azureServices: [
          { name: 'Azure Virtual Machines & VMSS', role: 'IaaS compute for custom OS workloads and elastic VM pools (up to 1,000 VMs).' },
          { name: 'Azure App Service', role: 'Managed PaaS for HTTP web apps (.NET, Java, Node, Python) with built-in SSL and auto-scaling.' },
          { name: 'Azure Virtual Desktop (AVD)', role: 'Cloud VDI enabling multi-session Windows 11 desktops for remote workers.' },
        ],
        simplifiedExample:
          'Instead of shipping high-end laptops to 200 remote contractors, a bank gives them secure browser access to a pre-configured Windows 11 desktop via Azure Virtual Desktop (AVD).',
        examTakeaway:
          'Need full OS access = VM. Identical auto-scaling VMs = VMSS. Managed web app/API = App Service. Remote cloud Windows desktop = AVD.',
      },
      {
        id: 'm5-u2',
        unitNumber: 2,
        unitTitle: 'Containers: Azure Container Instances (ACI) vs. Azure Kubernetes Service (AKS)',
        conceptExplanation:
          'Containers package application code and dependencies into lightweight images that start in seconds without guest OS overhead. Azure Container Instances (ACI) is the fastest, simplest PaaS way to run a single container without managing servers. Azure Kubernetes Service (AKS) is a full enterprise container orchestration platform for managing complex microservices fleets.',
        azureServices: [
          { name: 'Azure Container Instances (ACI)', role: 'Serverless single-container execution billed per second.' },
          { name: 'Azure Kubernetes Service (AKS)', role: 'Managed Kubernetes cluster for auto-scaling, self-healing, and rolling updates of microservices.' },
        ],
        simplifiedExample:
          'Use ACI to run a single nightly PDF report container job. Use AKS to orchestrate an e-commerce platform made of 40 interacting microservices (cart, payments, search, inventory).',
        examTakeaway:
          'Simple standalone container with zero orchestration = ACI. Complex multi-container orchestration & microservices = AKS.',
      },
      {
        id: 'm5-u3',
        unitNumber: 3,
        unitTitle: 'Virtual Networks (VNets), Subnets, VNet Peering & Hybrid Connectivity',
        conceptExplanation:
          'An Azure Virtual Network (VNet) is your isolated private network in the cloud. VNet Peering connects two VNets (same or different regions) over Microsoft’s private backbone. For hybrid on-premises connectivity: VPN Gateway sends encrypted traffic over the public internet (IPsec/IKE), whereas Azure ExpressRoute provides a dedicated, private fiber connection that completely bypasses the public internet.',
        azureServices: [
          { name: 'Azure VNet & VNet Peering', role: 'Private IPv4/IPv6 network isolation and low-latency cross-VNet routing.' },
          { name: 'Azure VPN Gateway', role: 'Encrypted Site-to-Site or Point-to-Site VPN tunnel over the public internet.' },
          { name: 'Azure ExpressRoute', role: 'Dedicated private high-bandwidth connection with guaranteed SLA and no public internet traversal.' },
        ],
        simplifiedExample:
          'VPN Gateway is like driving an armored cash truck on a public highway (encrypted on public internet). ExpressRoute is building a private underground tunnel directly between your bank vault and Azure.',
        examTakeaway:
          'Encrypted over public internet = VPN Gateway. Private dedicated line bypassing public internet = ExpressRoute!',
      },
      {
        id: 'm5-u4',
        unitNumber: 4,
        unitTitle: 'Azure DNS & Public vs. Private Endpoints',
        conceptExplanation:
          'Azure DNS hosts your domain name records on Azure’s global anycast network and resolves domain names to IP addresses. Azure Private Link / Private Endpoint assigns a private IP address from your VNet to a PaaS service (like Azure Storage or Azure SQL) so traffic never touches the public internet.',
        azureServices: [
          { name: 'Azure DNS / Private DNS', role: 'Ultra-fast domain name hosting and internal VNet name resolution.' },
          { name: 'Azure Private Link / Private Endpoint', role: 'Brings Azure PaaS services privately inside your Virtual Network.' },
        ],
        simplifiedExample:
          'Instead of allowing your Azure SQL Database to be reachable via a public IP, a Private Endpoint gives it a local 10.0.1.5 IP inside your VNet.',
        examTakeaway:
          'Note: You cannot buy/register a new domain name in Azure DNS (it hosts existing domains), though App Service Domains allows purchasing.',
      },
    ],
  },
  {
    moduleId: 6,
    pathId: 2,
    moduleTitle: 'Azure Storage Services',
    moduleSummary:
      'Compare Blob, Disk, Files, Queue, and Table storage, master the 4 Blob Access Tiers (Hot, Cool, Cold, Archive), Redundancy options (LRS, ZRS, GRS, GZRS), and Migration tools.',
    units: [
      {
        id: 'm6-u1',
        unitNumber: 1,
        unitTitle: 'Core Storage Account Services: Blob, Files, Disks, Queues & Tables',
        conceptExplanation:
          'An Azure Storage Account provides 5 core services: 1) Azure Blobs: Massive unstructured object storage (images, videos, backups, logs). 2) Azure Files: Managed cloud file shares mounted via SMB/NFS protocols like a network drive. 3) Azure Disks: Block-level SSD/HDD volumes attached to Virtual Machines. 4) Azure Queues: Asynchronous message queueing between app components. 5) Azure Tables: NoSQL key-value store.',
        azureServices: [
          { name: 'Azure Blob Storage', role: 'Object storage for unstructured binary and text data.' },
          { name: 'Azure Files', role: 'Shared network drives (SMB/NFS) accessible concurrently by multiple VMs and on-premises PCs.' },
          { name: 'Azure Managed Disks', role: 'Ultra Disk, Premium SSD, Standard SSD, and Standard HDD block storage for VMs.' },
        ],
        simplifiedExample:
          'Store customer profile photos in Blob Storage, mount a shared company "S: Drive" across 10 Windows VMs using Azure Files, and buffer order-processing jobs in Azure Queue Storage.',
        examTakeaway:
          'Keywords "SMB protocol" or "lift-and-shift shared network file drives" = Azure Files! Keywords "unstructured media/objects" = Azure Blob Storage!',
      },
      {
        id: 'm6-u2',
        unitNumber: 2,
        unitTitle: 'Blob Access Tiers: Hot, Cool, Cold & Archive',
        conceptExplanation:
          'Blob Storage offers 4 access tiers trading storage cost against access cost: Hot Tier (frequent access, highest storage cost, lowest access cost, 0-day min retention), Cool Tier (infrequent access, 30-day min retention), Cold Tier (rare access, 90-day min retention), and Archive Tier (offline tier, 180-day min retention, lowest storage cost, highest access cost, requires hours to rehydrate before reading).',
        azureServices: [
          { name: 'Blob Lifecycle Management', role: 'Policies that automatically transition blobs from Hot -> Cool -> Cold -> Archive as data ages.' },
        ],
        simplifiedExample:
          'Hospital X-rays taken this week stay in Hot Tier for doctors to view immediately. After 30 days they move to Cool, after 90 days to Cold, and after 6 months to Archive for 7-year legal retention.',
        examTakeaway:
          'Hot, Cool, and Cold tiers are ONLINE (millisecond latency). Archive tier is OFFLINE (cannot be read until rehydrated to Hot or Cool, taking hours).',
      },
      {
        id: 'm6-u3',
        unitNumber: 3,
        unitTitle: 'Storage Redundancy: LRS, ZRS, GRS & GZRS',
        conceptExplanation:
          'Azure replicates your data to protect against hardware and regional failures: LRS (Locally Redundant Storage: 3 synchronous copies in 1 datacenter, 11 nines durability), ZRS (Zone-Redundant Storage: 3 synchronous copies across 3 Availability Zones in 1 region, 12 nines), GRS (Geo-Redundant Storage: LRS in primary region + asynchronous LRS copy in paired region 300+ miles away, 16 nines), and GZRS (ZRS in primary + LRS in secondary region, 16 nines).',
        azureServices: [
          { name: 'RA-GRS / RA-GZRS (Read-Access Geo-Redundant)', role: 'Allows active read-only access to the secondary region copy at all times.' },
        ],
        simplifiedExample:
          'LRS = Keeping 3 photocopies of your passport in the same desk drawer. ZRS = Keeping 1 copy in 3 different buildings across town. GRS = Keeping 3 copies in New York and mailing 3 backup copies to Chicago.',
        examTakeaway:
          'Lowest cost redundancy = LRS. Survives datacenter failure = ZRS. Survives entire regional catastrophe = GRS / GZRS.',
      },
      {
        id: 'm6-u4',
        unitNumber: 4,
        unitTitle: 'Data & Server Migration Tools: AzCopy, Storage Explorer, File Sync, Data Box & Azure Migrate',
        conceptExplanation:
          'AzCopy is a high-performance command-line utility for copying blobs/files via script. Azure Storage Explorer is a graphical desktop app (Windows/macOS/Linux) for managing storage. Azure File Sync caches Azure Files shares on local Windows Servers. Azure Data Box is a rugged physical hardware appliance shipped to your datacenter to transfer 40 TB to petabytes of data offline. Azure Migrate assesses and migrates on-premises VMs and databases.',
        azureServices: [
          { name: 'AzCopy vs. Storage Explorer', role: 'AzCopy = CLI automation tool; Storage Explorer = GUI desktop application.' },
          { name: 'Azure Data Box', role: 'Physical ruggedized storage device shipped by courier when network bandwidth is limited (>40 TB).' },
          { name: 'Azure Migrate', role: 'Central hub for discovering, assessing, and migrating on-premises servers and databases to Azure.' },
        ],
        simplifiedExample:
          'A film studio with 80 TB of raw 8K video footage and a slow internet line orders an Azure Data Box, copies the footage onto the device locally, and ships it back to the Azure datacenter.',
        examTakeaway:
          'Offline petabyte/multi-terabyte physical transfer = Azure Data Box. CLI script transfer = AzCopy. Bi-directional Windows file server cache = Azure File Sync.',
      },
    ],
  },
  {
    moduleId: 7,
    pathId: 2,
    moduleTitle: 'Azure Identity, Access, & Security',
    moduleSummary:
      'Master Microsoft Entra ID, Authentication vs. Authorization, SSO, MFA, Conditional Access, Azure RBAC, Zero Trust, Defense-in-Depth, and Defender for Cloud.',
    units: [
      {
        id: 'm7-u1',
        unitNumber: 1,
        unitTitle: 'Microsoft Entra ID, Authentication (AuthN) vs. Authorization (AuthZ), SSO & MFA',
        conceptExplanation:
          'Microsoft Entra ID (formerly Azure Active Directory) is Microsoft’s cloud-based identity and access management service. Authentication (AuthN) verifies WHO a user is (e.g., via password + MFA). Authorization (AuthZ) determines WHAT resources an authenticated user is permitted to access. Single Sign-On (SSO) lets users sign in once to access multiple apps; Multi-Factor Authentication (MFA) requires 2+ factors (something you know, have, or are).',
        azureServices: [
          { name: 'Microsoft Entra ID', role: 'Cloud identity provider for employees, B2B guests, and B2C customers.' },
          { name: 'Microsoft Authenticator', role: 'Provides push notifications, biometrics, and OTP codes for MFA.' },
        ],
        simplifiedExample:
          'Showing your passport at airport security is Authentication (proving who you are). Your boarding pass seat class (Economy vs. First Class Lounge) is Authorization (what you are allowed to access).',
        examTakeaway:
          'AuthN = Proving identity (MFA, Passwordless). AuthZ = Controlling permissions (Azure RBAC). SSO reduces password fatigue.',
      },
      {
        id: 'm7-u2',
        unitNumber: 2,
        unitTitle: 'Conditional Access & Azure Role-Based Access Control (RBAC)',
        conceptExplanation:
          'Conditional Access evaluates real-time signals (user role, IP location, device compliance, sign-in risk) to make an automated decision (Allow, Require MFA, or Block access). Azure RBAC controls fine-grained authorization to Azure resources using role assignments at Management Group, Subscription, Resource Group, or Resource scope.',
        azureServices: [
          { name: 'Entra Conditional Access', role: 'If-Then policy engine for identity signals (e.g., If signing in from an unfamiliar country -> Require MFA).' },
          { name: 'Azure RBAC (Owner, Contributor, Reader)', role: 'Built-in roles granting least-privilege resource access.' },
        ],
        simplifiedExample:
          'If an engineer logs in from corporate headquarters on a managed laptop, allow immediate access; if they log in from an unmanaged café Wi-Fi abroad, require biometric MFA (Conditional Access).',
        examTakeaway:
          'Signals + Decision (Location/Device -> Require MFA) = Conditional Access! Resource access permissions (Reader/Contributor/Owner) = Azure RBAC!',
      },
      {
        id: 'm7-u3',
        unitNumber: 3,
        unitTitle: 'Zero Trust Model & Defense-in-Depth Security',
        conceptExplanation:
          'Zero Trust is a modern security model built on three principles: 1) Verify explicitly, 2) Use least-privilege access, and 3) Assume breach ("never trust, always verify"). Defense-in-Depth is a layered strategy that slows down attackers using 7 concentric rings: Physical -> Identity & Access -> Perimeter -> Network -> Compute -> Application -> Data.',
        azureServices: [
          { name: 'Azure DDoS Protection & Azure Firewall', role: 'Perimeter layer protection against volumetric traffic floods and malicious traffic.' },
          { name: 'Azure Key Vault', role: 'Securely stores cryptographic keys, secrets, and TLS certificates at the Data/App layer.' },
          { name: 'Microsoft Defender for Cloud', role: 'Cloud Security Posture Management (CSPM) & Workload Protection (CWPP) with Secure Score.' },
        ],
        simplifiedExample:
          'Zero Trust treats every login request as if it came from an open untrusted network—even if the user is already inside the office firewall.',
        examTakeaway:
          'Memorize the 3 Zero Trust principles (Verify Explicitly, Least Privilege, Assume Breach) and the center of Defense-in-Depth (Data).',
      },
    ],
  },

  // =========================================================================
  // LEARNING PATH 3: DESCRIBE AZURE MANAGEMENT & GOVERNANCE (30–35%)
  // =========================================================================
  {
    moduleId: 8,
    pathId: 3,
    moduleTitle: 'Azure Cost Management',
    moduleSummary:
      'Optimize cloud spending with the Pricing & TCO Calculators, Cost Management budgets, Reserved Instances, Savings Plans, Azure Hybrid Benefit, and Tags.',
    units: [
      {
        id: 'm8-u1',
        unitNumber: 1,
        unitTitle: 'Pricing Calculator vs. Total Cost of Ownership (TCO) Calculator',
        conceptExplanation:
          'Both calculators are free web-based estimation tools used BEFORE deploying workloads. The Azure Pricing Calculator estimates the monthly/hourly Azure bill for specific cloud resources you configure. The Total Cost of Ownership (TCO) Calculator compares the full cost of running your existing on-premises datacenter against migrating to Azure over 1 to 5 years.',
        azureServices: [
          { name: 'Azure Pricing Calculator', role: 'Estimates monthly cost of Azure configurations (VMs, Storage, Bandwidth).' },
          { name: 'Azure TCO Calculator', role: 'Generates an executive migration savings report comparing on-premises vs. Azure.' },
        ],
        simplifiedExample:
          'Use the TCO Calculator to convince your CFO that shutting down your local server room will save 38% over 3 years. Use the Pricing Calculator to see how much 4 D4s_v5 VMs and 2 TB of Blob Storage will cost per month.',
        examTakeaway:
          'Compare On-Premises vs. Azure = TCO Calculator! Estimate monthly Azure resource bill = Pricing Calculator! Analyze actual current spending = Cost Management + Billing!',
      },
      {
        id: 'm8-u2',
        unitNumber: 2,
        unitTitle: 'Cost Savings: Reservations, Savings Plans, Azure Hybrid Benefit & Tags',
        conceptExplanation:
          'Azure Reservations (Reserved Instances) offer up to 72% discount when you commit to specific VM/SQL capacity in a specific region for 1 or 3 years. Azure Savings Plans for Compute offer up to 65% discount for a 1- or 3-year hourly spend commitment across any region/compute family. Azure Hybrid Benefit (AHB) lets you reuse existing on-premises Windows Server and SQL Server licenses with Software Assurance in Azure. Resource Tags (key:value pairs like CostCenter:Marketing) categorize resources for billing chargeback.',
        azureServices: [
          { name: 'Azure Cost Management + Billing', role: 'Monitors real-time spend, forecasts costs, and triggers automated budget threshold alerts.' },
          { name: 'Azure Reservations & Hybrid Benefit', role: 'Slashes costs for predictable 24/7 workloads and existing Microsoft licenses.' },
        ],
        simplifiedExample:
          'A company running a production ERP database 24/7/365 combines a 3-year Azure Reservation with Azure Hybrid Benefit (reusing its on-premises SQL Server license) to cut compute costs by up to 80%.',
        examTakeaway:
          'Inbound data transfer to Azure is FREE; outbound data transfer (egress) is billed. Resource Tags DO NOT inherit automatically from Resource Groups unless enforced via Azure Policy.',
      },
    ],
  },
  {
    moduleId: 9,
    pathId: 3,
    moduleTitle: 'Azure Governance & Compliance Tools',
    moduleSummary:
      'Enforce organizational standards with Microsoft Purview, Azure Policy, Policy Initiatives, Resource Locks (CanNotDelete vs. ReadOnly), and Service Trust Portal.',
    units: [
      {
        id: 'm9-u1',
        unitNumber: 1,
        unitTitle: 'Azure Policy & Initiative Definitions',
        conceptExplanation:
          'Azure Policy evaluates Azure resources against corporate governance rules (JSON policy definitions) to enforce compliance at scale—such as restricting allowed deployment regions, requiring a CostCenter tag, or blocking public IP addresses. An Initiative Definition is a grouped collection of multiple Azure Policies aimed at a single overarching compliance goal (e.g., PCI-DSS or ISO 27001).',
        azureServices: [
          { name: 'Azure Policy', role: 'Audits, denies, or automatically remediates non-compliant Azure resource configurations.' },
          { name: 'Policy Initiatives', role: 'Bundles dozens of related policies into a single assignment.' },
        ],
        simplifiedExample:
          'To comply with European GDPR laws, an admin assigns the "Allowed Locations" Azure Policy set to "West Europe" and "North Europe". If a developer tries to create a VM in "East US", Azure Policy blocks the deployment immediately.',
        examTakeaway:
          'Azure RBAC = WHO can perform actions. Azure Policy = WHAT resource properties are allowed or required.',
      },
      {
        id: 'm9-u2',
        unitNumber: 2,
        unitTitle: 'Resource Locks (CanNotDelete vs. ReadOnly) & Microsoft Purview',
        conceptExplanation:
          'Resource Locks prevent accidental deletion or modification of critical resources regardless of a user’s RBAC permissions (even Subscription Owners are blocked until the lock is removed). CanNotDelete allows reading and modifying a resource, but blocks deletion. ReadOnly allows only reading (blocks both updates and deletion). Microsoft Purview is a unified data governance, risk, and compliance platform that discovers and classifies sensitive data across on-premises and multi-cloud.',
        azureServices: [
          { name: 'Azure Resource Locks', role: 'Protects Subscriptions, Resource Groups, or individual Resources from accidental deletion or changes.' },
          { name: 'Microsoft Purview & Service Trust Portal', role: 'Purview governs enterprise data; Service Trust Portal provides Microsoft audit reports and compliance certs.' },
        ],
        simplifiedExample:
          'Placing a CanNotDelete lock on a production SQL Database allows your app to write customer orders normally while ensuring a tired admin cannot accidentally delete the database at 2 AM.',
        examTakeaway:
          'Resource Locks override RBAC Owner roles! CanNotDelete = Read + Modify (No Delete). ReadOnly = Read Only (No Modify, No Delete).',
      },
    ],
  },
  {
    moduleId: 10,
    pathId: 3,
    moduleTitle: 'Azure Management & Deployment Tools',
    moduleSummary:
      'Manage and automate deployments using Azure Portal, Cloud Shell, Azure CLI, Azure PowerShell, Azure Arc, and Infrastructure as Code (ARM Templates & Bicep).',
    units: [
      {
        id: 'm10-u1',
        unitNumber: 1,
        unitTitle: 'Azure Portal, Cloud Shell, Azure CLI & Azure PowerShell',
        conceptExplanation:
          'The Azure Portal is a visual web-based GUI. Azure Cloud Shell is an interactive, browser-accessible shell (offering both Bash and PowerShell) with pre-installed Azure tools and persistent cloud storage. Azure CLI (az commands) and Azure PowerShell (New-Az* cmdlets) allow cross-platform command-line scripting on Windows, macOS, and Linux.',
        azureServices: [
          { name: 'Azure Cloud Shell', role: 'Browser-based authenticated terminal supporting both Bash (CLI) and PowerShell.' },
          { name: 'Azure Mobile App', role: 'Monitor resources and run Cloud Shell commands from iOS/Android smartphones.' },
        ],
        simplifiedExample:
          'An engineer on a locked-down tablet opens a browser to portal.azure.com, clicks the Cloud Shell icon, and runs `az vm restart` without installing any local software.',
        examTakeaway:
          'Cloud Shell is browser-based, requires an Azure Storage account to persist files, and supports both Bash and PowerShell.',
      },
      {
        id: 'm10-u2',
        unitNumber: 2,
        unitTitle: 'Azure Arc & Infrastructure as Code (ARM Templates vs. Bicep)',
        conceptExplanation:
          'Azure Resource Manager (ARM) is the deployment and management service for Azure. ARM Templates (JSON) and Bicep (a cleaner, concise domain-specific language that compiles into ARM JSON) enable declarative Infrastructure as Code (IaC) for repeatable deployments. Azure Arc extends ARM so you can govern, tag, and apply Azure Policy to physical servers, VMs, and Kubernetes clusters running on-premises or in AWS/GCP.',
        azureServices: [
          { name: 'Bicep & ARM Templates', role: 'Declarative Infrastructure as Code (IaC) templates for idempotent Azure deployments.' },
          { name: 'Azure Arc', role: 'Brings non-Azure hybrid and multi-cloud servers under Azure Resource Manager governance.' },
        ],
        simplifiedExample:
          'Write a 40-line Bicep file defining a VNet, App Service, and SQL Database, and deploy identical Dev, Staging, and Production environments in seconds with zero human configuration drift.',
        examTakeaway:
          'Bicep = Cleaner domain-specific declarative language for Azure IaC. Azure Arc = Manage non-Azure/on-premises resources inside Azure.',
      },
    ],
  },
  {
    moduleId: 11,
    pathId: 3,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    moduleSummary:
      'Distinguish Azure Advisor (5 pillars), Azure Service Health (Status, Service Health, Resource Health), and Azure Monitor (Log Analytics, Application Insights, Alerts).',
    units: [
      {
        id: 'm11-u1',
        unitNumber: 1,
        unitTitle: 'Azure Advisor: Personalized Cloud Recommendations',
        conceptExplanation:
          'Azure Advisor is a free, personalized cloud consultant that continuously analyzes your deployed Azure resource configurations and usage telemetry, providing actionable recommendations across 5 pillars: Reliability (formerly High Availability), Security, Performance, Cost, and Operational Excellence.',
        azureServices: [
          { name: 'Azure Advisor', role: 'Proactive recommendation engine across Reliability, Security, Performance, Cost, and Operational Excellence.' },
        ],
        simplifiedExample:
          'Azure Advisor notices three Virtual Machines have had <3% CPU utilization for 14 days and recommends right-sizing or shutting them down to save $420/month.',
        examTakeaway:
          'Memorize the 5 pillars of Azure Advisor: Reliability, Security, Performance, Cost, and Operational Excellence.',
      },
      {
        id: 'm11-u2',
        unitNumber: 2,
        unitTitle: 'Azure Service Health (Azure Status vs. Service Health vs. Resource Health)',
        conceptExplanation:
          'Azure Service Health comprises three nested views of platform health: 1) Azure Status: Global public webpage showing broad outages across all Azure regions worldwide. 2) Service Health: Personalized view of active Azure service issues and planned maintenance affecting the specific regions and subscriptions YOU use. 3) Resource Health: Granular health diagnosis of a single specific resource instance (e.g., one specific VM).',
        azureServices: [
          { name: 'Azure Status / Service Health / Resource Health', role: 'Tracks global, subscription-scoped, and individual resource-scoped platform health.' },
        ],
        simplifiedExample:
          'Check Azure Status to see if East US has a macro outage; check Service Health to set up an email alert when planned maintenance impacts your subscription; check Resource Health to see why VM-Prod-01 rebooted.',
        examTakeaway:
          'Global public view = Azure Status. Personalized subscription/region view = Service Health. Single VM/DB instance view = Resource Health.',
      },
      {
        id: 'm11-u3',
        unitNumber: 3,
        unitTitle: 'Azure Monitor, Log Analytics & Application Insights',
        conceptExplanation:
          'Azure Monitor is the comprehensive observability platform that collects Metrics (numerical time-series data like CPU %) and Logs (event and diagnostic records) across cloud and on-premises environments. Log Analytics lets you query collected log data using Kusto Query Language (KQL). Application Insights (a feature of Azure Monitor) monitors live web application performance (APM), request rates, response times, and failure exceptions.',
        azureServices: [
          { name: 'Azure Monitor & Log Analytics', role: 'Central telemetry pipeline, KQL log querying, and automated metric/log alerts.' },
          { name: 'Application Insights', role: 'Application Performance Monitoring (APM) for web apps across .NET, Java, Node.js, and Python.' },
        ],
        simplifiedExample:
          'When checkout page latency exceeds 2 seconds, Application Insights pinpoints the exact slow SQL dependency query, while Azure Monitor triggers an SMS alert to the on-call SRE.',
        examTakeaway:
          'Real-time telemetry, metrics, logs & alerts = Azure Monitor. Deep web app code performance & exceptions = Application Insights.',
      },
    ],
  },
  {
    moduleId: 12,
    pathId: 3,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    moduleSummary:
      'Integrate compute, storage, networking, identity, cost management, and governance into cohesive end-to-end enterprise architectures.',
    units: [
      {
        id: 'm12-u1',
        unitNumber: 1,
        unitTitle: 'Multi-Tier Architecture Synthesis (Compute + Storage + Networking)',
        conceptExplanation:
          'Real-world AZ-900 scenarios combine multiple domains into a single business problem. You must match each workload tier to the appropriate service model: PaaS (App Service) for zero-OS-patching web tiers, AKS for orchestrated microservices, Blob Storage Lifecycle policies (Hot -> Cool -> Archive) with ZRS/GRS redundancy for data durability, and ExpressRoute + Private Endpoints for private, internet-free enterprise connectivity.',
        azureServices: [
          { name: 'App Service + Azure SQL + Blob Storage', role: 'Classic 3-tier PaaS architecture with high availability and low operational overhead.' },
          { name: 'ExpressRoute + Private Link', role: 'End-to-end private network path from on-premises datacenters to Azure PaaS services.' },
        ],
        simplifiedExample:
          'A healthcare provider hosts its patient portal on App Service across 3 Availability Zones, stores MRI scans in GZRS Blob Storage with lifecycle archival after 180 days, and connects its hospital clinics via ExpressRoute.',
        examTakeaway:
          'Break multi-part scenario questions into numbered constraints and eliminate any option that violates even one constraint (e.g., IaaS when "no OS management" is required).',
      },
      {
        id: 'm12-u2',
        unitNumber: 2,
        unitTitle: 'Enterprise Governance & Cost Optimization Synthesis',
        conceptExplanation:
          'Securing and governing an enterprise cloud footprint requires layering identity, policy, locks, and financial controls: Entra ID Conditional Access + MFA for Zero Trust identity, Azure Policy Initiatives for regional/SKU compliance, CanNotDelete Resource Locks to guard mission-critical production databases, and Reserved Instances + Azure Hybrid Benefit to minimize 24/7 operational expenditure.',
        azureServices: [
          { name: 'Entra Conditional Access + Azure Policy + Resource Locks', role: 'Complete identity and resource governance triad.' },
          { name: 'TCO Calculator + Reservations + Cost Management Budgets', role: 'Full lifecycle financial planning from pre-migration to production optimization.' },
        ],
        simplifiedExample:
          'A global bank uses Management Groups to enforce an "EU-Only" Azure Policy Initiative, applies CanNotDelete locks to production Resource Groups, and purchases 3-year Reserved Instances for its core ledger workloads.',
        examTakeaway:
          'Remember the Golden Triad: Conditional Access governs sign-in context, Azure Policy governs resource properties, and Resource Locks prevent deletion even by Owners.',
      },
    ],
  },
];

export const HIGH_YIELD_CHEAT_SHEETS: CheatSheetItem[] = [
  {
    id: 'cs-cloud-models',
    moduleId: 1,
    title: 'Shared Responsibility Model Matrix',
    category: 'Cloud Concepts',
    summary: 'Clear division between customer responsibility and cloud provider (Microsoft) responsibility across IaaS, PaaS, and SaaS.',
    keyRule: 'Customer is ALWAYS responsible for Data & Information, Identity & Accounts, and Devices/Endpoints regardless of model.',
    comparisonTable: {
      headers: ['Component Layer', 'On-Premises', 'IaaS (e.g., Azure VM)', 'PaaS (e.g., App Service)', 'SaaS (e.g., M365)'],
      rows: [
        ['Information & Data', 'Customer', 'Customer', 'Customer', 'Customer'],
        ['Devices (Mobile/PC)', 'Customer', 'Customer', 'Customer', 'Customer'],
        ['Accounts & Identities', 'Customer', 'Customer', 'Customer', 'Customer'],
        ['Application Code', 'Customer', 'Customer', 'Customer', 'Microsoft'],
        ['Runtime & Middleware', 'Customer', 'Customer', 'Microsoft', 'Microsoft'],
        ['Operating System (OS)', 'Customer', 'Customer', 'Microsoft', 'Microsoft'],
        ['Virtualization & Hypervisor', 'Customer', 'Microsoft', 'Microsoft', 'Microsoft'],
        ['Physical Compute & Storage', 'Customer', 'Microsoft', 'Microsoft', 'Microsoft'],
        ['Physical Network & Datacenter', 'Customer', 'Microsoft', 'Microsoft', 'Microsoft'],
      ],
    },
    examTrap: 'Exam questions often ask who is responsible for OS updates on IaaS vs PaaS: On IaaS, YOU patch the OS; on PaaS, Microsoft patches the OS!',
  },
  {
    id: 'cs-capex-opex',
    moduleId: 3,
    title: 'CapEx vs. OpEx Economics',
    category: 'Cloud Concepts',
    summary: 'The financial shift from heavy upfront infrastructure capital investments to elastic operational subscriptions.',
    keyRule: 'CapEx = Buying hardware upfront, depreciated over years. OpEx = Cloud consumption, pay-as-you-go, deducted in current billing cycle.',
    comparisonTable: {
      headers: ['Characteristic', 'Capital Expenditure (CapEx)', 'Operational Expenditure (OpEx)'],
      rows: [
        ['Payment Timing', 'Heavy upfront cash payment before use', 'Ongoing monthly/hourly pay-as-you-use'],
        ['Physical Infrastructure', 'Own, maintain, house, cool physical hardware', 'No physical hardware purchase or maintenance'],
        ['Financial Accounting', 'Depreciated across multiple tax years', 'Deducted as regular operating business expense in current cycle'],
        ['Agility & Commitment', 'High risk of under-utilization or outgrowing capacity', 'Rapid scale up or down without penalty'],
      ],
    },
    examTrap: 'Remember that Serverless and consumption-based pricing models are 100% pure OpEx with zero CapEx.',
  },
  {
    id: 'cs-regions-zones',
    moduleId: 4,
    title: 'Regions, Availability Zones & Region Pairs',
    category: 'Architecture & Services',
    summary: 'Physical infrastructure boundaries for fault tolerance, high availability, and disaster recovery.',
    keyRule: 'Availability Zone = 1+ datacenters in SAME region. Region Pair = 2 regions at least 300 miles apart.',
    comparisonTable: {
      headers: ['Feature', 'Datacenter', 'Availability Zone (AZ)', 'Region Pair'],
      rows: [
        ['Scope', 'Single physical building', 'One or more datacenters within SAME region', 'Two coupled regions within same geography'],
        ['Distance', 'Local site', 'Separated by physical miles with ultra-low latency (<2ms)', 'Separated by at least 300 miles'],
        ['Power/Cooling', 'Shared building power', 'Independent, isolated power, cooling, network', 'Completely separate regional power grids'],
        ['Failure Protection', 'Server rack fault', 'Datacenter-level flood, power outage, or fire', 'Catastrophic regional disaster (hurricane, earthquake)'],
      ],
    },
    examTrap: 'Not all Azure regions have Availability Zones! But all regions with AZs have at least three distinct zones.',
  },
  {
    id: 'cs-compute-matrix',
    moduleId: 5,
    title: 'Azure Compute Selection Compass',
    category: 'Architecture & Services',
    summary: 'How to pick the right compute model from Virtual Machines to App Service, Containers, and Kubernetes.',
    keyRule: 'Need OS control = VM. Need web hosting without OS = App Service. Simple lightweight microservice container = ACI. Large scale container orchestration = AKS.',
    comparisonTable: {
      headers: ['Service', 'Model', 'Primary Use Case', 'Management Overhead'],
      rows: [
        ['Azure Virtual Machines', 'IaaS', 'Legacy apps, custom OS kernel, database servers', 'High (OS patching, backup, security)'],
        ['Azure Virtual Machine Scale Sets', 'IaaS', 'Identical auto-scaling pool of VMs for big data/web tiers', 'Medium (automated scaling, but VM OS management)'],
        ['Azure App Service', 'PaaS', 'Web applications, REST APIs, background webjobs', 'Low (zero server/OS management)'],
        ['Azure Container Instances (ACI)', 'PaaS / Serverless', 'Fast standalone container tasks without cluster overhead', 'Lowest (run container on demand in seconds)'],
        ['Azure Kubernetes Service (AKS)', 'PaaS / Orchestration', 'Enterprise multi-container orchestration, microservices', 'Managed master nodes, user manages worker nodes & pods'],
      ],
    },
    examTrap: 'If the question asks for running containerized microservices with full cluster orchestration and service discovery, the answer is AKS (not ACI)!',
  },
  {
    id: 'cs-storage-tiers',
    moduleId: 6,
    title: 'Blob Storage Access Tiers & Redundancy',
    category: 'Architecture & Services',
    summary: 'Balancing storage cost per gigabyte with access/retrieval costs and geographic resilience.',
    keyRule: 'Hot = highest storage cost, lowest access cost. Archive = lowest storage cost, highest access cost + hours of retrieval latency.',
    comparisonTable: {
      headers: ['Tier / Strategy', 'Minimum Retention', 'Access Frequency', 'Retrieval Latency'],
      rows: [
        ['Hot Tier', 'None', 'Active, frequent daily reads and writes', 'Milliseconds (online)'],
        ['Cool Tier', '30 days', 'Infrequently accessed (short-term backup, staged raw data)', 'Milliseconds (online)'],
        ['Cold Tier', '90 days', 'Rarely accessed, stored for months', 'Milliseconds (online)'],
        ['Archive Tier', '180 days', 'Historical compliance, multi-year preservation', 'Hours (offline, requires rehydration)'],
      ],
    },
    examTrap: 'Redundancy shortcuts: LRS (1 datacenter, 3 copies), ZRS (3 Availability Zones in 1 region), GRS (replicated to secondary region 300+ miles away).',
  },
  {
    id: 'cs-governance-matrix',
    moduleId: 9,
    title: 'Governance Triad: Policy vs. RBAC vs. Resource Locks',
    category: 'Management & Governance',
    summary: 'The three essential tools for securing and controlling Azure resources.',
    keyRule: 'RBAC governs WHO. Azure Policy governs WHAT properties. Resource Locks PREVENT accidental changes/deletes regardless of role.',
    comparisonTable: {
      headers: ['Tool', 'Core Purpose', 'Key Example', 'Overrides Admin?'],
      rows: [
        ['Azure RBAC', 'Manages identity permissions on resources', 'Assigning "Contributor" or "Reader" role to developer', 'Admins have Owner rights'],
        ['Azure Policy', 'Enforces resource compliance and configuration standards', 'Preventing VMs from being deployed outside Western Europe', 'Blocks any non-compliant deployment'],
        ['Resource Locks', 'Guards against accidental deletion or modification', '"CanNotDelete" lock on production SQL DB', 'YES! Even Subscription Owner cannot delete until lock removed'],
      ],
    },
    examTrap: 'An Owner CANNOT delete a resource that has a "CanNotDelete" lock until the lock itself is first deleted. Locks trump RBAC permissions!',
  },
  {
    id: 'cs-monitoring-tools',
    moduleId: 11,
    title: 'Advisor vs. Service Health vs. Azure Monitor',
    category: 'Management & Governance',
    summary: 'Distinguishing the primary monitoring, advisory, and health reporting platforms.',
    keyRule: 'Advisor = recommendations for your setup. Service Health = Microsoft datacenter outage alerts. Azure Monitor = live telemetry, metrics, and logs.',
    comparisonTable: {
      headers: ['Tool', 'Primary Focus', 'Trigger / Signal'],
      rows: [
        ['Azure Advisor', 'Personalized recommendations across 5 pillars (Cost, Security, Reliability, Performance, Ops)', 'Analyzes idle VMs, missing backups, unencrypted disks'],
        ['Azure Service Health', 'Informs you if Azure datacenters or services are having outages or planned maintenance', 'Global outages, regional degradation, incident root cause reports'],
        ['Azure Monitor', 'Observability platform collecting metrics, activity logs, and diagnostic telemetry', 'CPU > 80%, HTTP 500 errors, Log Analytics KQL queries'],
        ['Application Insights', 'Application Performance Monitoring (APM) for web apps code', 'Live page views, exception stack traces, request dependency rates'],
      ],
    },
    examTrap: 'If the question mentions "personalized recommendations on how to save money and improve security", choose Azure Advisor.',
  },
];
