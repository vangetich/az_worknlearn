import { Question } from '../types/quiz';

export const PATH2_EXPANSION_QUESTIONS: Question[] = [
  // =========================================================================
  // MODULE 4 EXPANSION: Core Azure Architectural Components (q6..q16)
  // =========================================================================
  {
    id: 'az900-mod4-q6',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'A multinational healthcare firm stores patient diagnostic data inside Azure Germany West Central and needs an emergency failover target that Microsoft maintains at least 300 miles away within the same geopolitical data-residency boundary.',
    question: 'Which Azure architectural construct ensures asynchronous replication and serialized planned maintenance within the same geography?',
    options: [
      { letter: 'A', text: 'Azure Region Pairs' },
      { letter: 'B', text: 'Availability Sets' },
      { letter: 'C', text: 'Resource Tags' },
      { letter: 'D', text: 'Azure Container Instances' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Each Azure Region is paired with another region within the same Geography (typically separated by 300+ miles, such as Germany West Central paired with Germany North). Region Pairs ensure planned Azure updates are rolled out sequentially and prioritized recovery happens across regional pairs.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Availability Sets protect VMs only against single rack/power failures inside one datacenter.' },
      { letter: 'C', reason: 'Resource Tags are billing/organizational key-value metadata.' },
      { letter: 'D', reason: 'ACI runs standalone containers and is not a geographic DR pairing model.' },
    ],
    examTip:
      '300+ miles apart + same data-residency geography + sequential platform updates = Azure Region Pairs!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Distinguish Availability Zones (same region, sub-2ms latency) from Region Pairs (300+ miles apart, regional disaster recovery).',
    },
  },
  {
    id: 'az900-mod4-q7',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'An enterprise IT director sets up an Azure Subscription for the Sales department and another Azure Subscription for Engineering. A junior engineer asks what happens if the Sales department hits its maximum Azure Virtual Machine vCPU quota or receives an invoice.',
    question: 'What dual role does an Azure Subscription serve in Azure architecture?',
    options: [
      { letter: 'A', text: 'A single physical datacenter rack boundary and hardware hypervisor' },
      { letter: 'B', text: 'Both a billing boundary (generating separate invoices/payment methods) and an access/quota limit boundary' },
      { letter: 'C', text: 'A sovereign government firewall separating public internet traffic' },
      { letter: 'D', text: 'A nested container that can only hold one Resource Group' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'An Azure Subscription serves as both a logical billing boundary (separate billing reports, payment methods, and invoices per department/environment) and an access control / resource quota boundary.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Subscriptions are logical account constructs, not physical datacenter racks.' },
      { letter: 'C', reason: 'Firewalls and NSGs filter traffic; subscriptions organize billing and quotas.' },
      { letter: 'D', reason: 'A single Subscription can contain hundreds of Resource Groups.' },
    ],
    examTip:
      'Azure Subscription = Billing Boundary + Access Control Boundary + Service Quota/Limit Boundary!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Remember Subscriptions separate invoices and resource quotas cleanly across departments or Prod vs Dev.',
    },
  },
  {
    id: 'az900-mod4-q8',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Advanced',
    scenario:
      'A company structures its Azure estate using Management Groups nested below the Tenant Root Group: "Root -> Corporate -> Finance -> Prod-Sub". An Azure Policy denying public IP creation is assigned at "Corporate", an RBAC Contributor role is assigned to Priya at "Finance", and a Resource Group "RG-Ledger" sits inside "Prod-Sub".',
    question: 'Which statement accurately describes inheritance across this Azure governance hierarchy?',
    options: [
      { letter: 'A', text: 'The Azure Policy and Priya’s RBAC Contributor role are both inherited automatically down to Prod-Sub and RG-Ledger' },
      { letter: 'B', text: 'Management Group policies never apply to Resource Groups inside Subscriptions' },
      { letter: 'C', text: 'Resource Groups cannot inherit RBAC roles from a parent Subscription' },
      { letter: 'D', text: 'Management Groups can be nested inside a Resource Group for extra security' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'In Azure’s strict top-down hierarchy (Management Groups ➔ Subscriptions ➔ Resource Groups ➔ Resources), both Azure Policies and RBAC role assignments flow downward automatically through inheritance.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Policies assigned at Management Groups cascade automatically to every nested child MG, Subscription, Resource Group, and Resource.' },
      { letter: 'C', reason: 'Resource Groups inherit RBAC roles assigned at Subscription and Management Group scopes.' },
      { letter: 'D', reason: 'Management Groups sit ABOVE Subscriptions; they can never live inside Resource Groups.' },
    ],
    examTip:
      'Top-Down Hierarchy: Root ➔ Management Groups (up to 6 levels deep) ➔ Subscriptions ➔ Resource Groups ➔ Resources. RBAC & Policies cascade DOWN!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Trace inheritance strictly downward from Management Groups through Subscriptions to Resources.',
    },
  },
  {
    id: 'az900-mod4-q9',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'An administrator notices that an older Azure region does not yet support Availability Zones, yet the team needs their two domain-controller Virtual Machines protected against an unplanned server rack power failure or planned host OS reboot inside that single datacenter.',
    question: 'Which legacy VM resilience feature distributes Virtual Machines across distinct Fault Domains (racks) and Update Domains within one datacenter?',
    options: [
      { letter: 'A', text: 'Availability Sets' },
      { letter: 'B', text: 'Azure Region Pairs' },
      { letter: 'C', text: 'Management Groups' },
      { letter: 'D', text: 'Azure Bastion' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Availability Sets organize two or more VMs across separate Fault Domains (independent physical server racks, power, and network switches) and Update Domains (reboot groups during planned host maintenance) within a single datacenter, delivering a 99.95% VM SLA.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Region Pairs are across distant Azure regions, not racks inside a single datacenter.' },
      { letter: 'C', reason: 'Management Groups handle subscription governance.' },
      { letter: 'D', reason: 'Azure Bastion manages browser SSH/RDP access.' },
    ],
    examTip:
      'Single datacenter rack protection (Fault Domains + Update Domains, 99.95% SLA) = Availability Sets. Whole datacenter protection (3 separate buildings, 99.99% SLA) = Availability Zones!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Compare Availability Sets (99.95%, Fault/Update domains in 1 DC) vs Availability Zones (99.99%, separate physical DCs).',
    },
  },
  {
    id: 'az900-mod4-q10',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Fundamental',
    scenario:
      'A multinational software company operates strictly under European Union GDPR data-residency compliance rules and must guarantee that customer data never leaves European boundaries.',
    question: 'Which Azure geographical abstraction defines a discrete market containing two or more regions that preserve data residency and compliance boundaries?',
    options: [
      { letter: 'A', text: 'Azure Geography' },
      { letter: 'B', text: 'Azure Availability Zone' },
      { letter: 'C', text: 'Resource Group' },
      { letter: 'D', text: 'Virtual Network Subnet' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'An Azure Geography is a discrete market—typically containing two or more Regions—that preserves data residency and compliance boundaries (e.g., Europe, United States, Canada, United Kingdom).',
    distractorBreakdown: [
      { letter: 'B', reason: 'An Availability Zone is a physical datacenter inside a single region.' },
      { letter: 'C', reason: 'A Resource Group is a logical deployment container inside a subscription.' },
      { letter: 'D', reason: 'A VNet subnet segments private IP addresses.' },
    ],
    examTip:
      'Geography = Data residency & compliance market containing 2+ Regions. Region = Set of datacenters connected via low-latency perimeter network.',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Understand the physical hierarchy: Geography ➔ Region (Pair) ➔ Availability Zone ➔ Datacenter.',
    },
  },
  {
    id: 'az900-mod4-q11',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'A cloud engineer needs to delete 18 interdependent resources (VMs, NICs, Public IPs, Storage Accounts, and Key Vaults) from a completed proof-of-concept demo cleanly in one click.',
    question: 'What happens when the engineer deletes the Resource Group containing those 18 resources?',
    options: [
      { letter: 'A', text: 'Only the empty Resource Group container is deleted while all 18 resources keep billing' },
      { letter: 'B', text: 'All 18 resources inside the Resource Group are permanently deleted along with the Resource Group container' },
      { letter: 'C', text: 'The resources automatically move to the Default Subscription root' },
      { letter: 'D', text: 'Azure converts the 18 resources into read-only Archive blobs' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Resource Groups act as a unified lifecycle boundary: deleting a Resource Group cascades and deletes every Azure resource contained inside it.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Deleting a Resource Group removes all resources inside it unless blocked by a Resource Lock.' },
      { letter: 'C', reason: 'Azure resources cannot exist outside a Resource Group.' },
      { letter: 'D', reason: 'Deleting a Resource Group deletes its resources rather than archiving them.' },
    ],
    examTip:
      'Lifecycle Boundary Rule: Deleting a Resource Group deletes EVERYTHING inside it (unless protected by a Resource Lock)!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Always remember Resource Groups govern shared resource lifecycles.',
    },
  },
  {
    id: 'az900-mod4-q12',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'A global manufacturing firm wants to deploy an application serving users in mainland China while complying with strict local Chinese cybersecurity and telecommunications regulations.',
    question: 'Which Azure sovereign cloud platform operates independently in mainland China through a local Microsoft partner?',
    options: [
      { letter: 'A', text: 'Azure Government' },
      { letter: 'B', text: 'Microsoft Azure operated by 21Vianet' },
      { letter: 'C', text: 'Azure East Asia Commercial' },
      { letter: 'D', text: 'Azure Arc Sovereign Node' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Microsoft Azure operated by 21Vianet is a physically and logically isolated instance of cloud services located in mainland China, independently operated and transacted by 21Vianet to meet local Chinese legal mandates.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Azure Government serves US federal, state, local, and defense entities.' },
      { letter: 'C', reason: 'East Asia is a standard commercial Azure region located in Hong Kong SAR.' },
      { letter: 'D', reason: 'Azure Arc is a hybrid management tool, not the sovereign China cloud platform.' },
    ],
    examTip:
      'Two Sovereign Clouds on AZ-900: US Gov entities = Azure Government; Mainland China = Azure operated by 21Vianet!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Keep sovereign cloud providers clear: Azure Government (US) vs 21Vianet (Mainland China).',
    },
  },
  {
    id: 'az900-mod4-q13',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Advanced',
    scenario:
      'An architect creates "RG-GlobalApp" with its metadata location set to "Central US". Inside "RG-GlobalApp", the architect attempts to deploy an Azure App Service in "West Europe" and an Azure Storage Account in "Japan East". Meanwhile, a security engineer tries to move an Azure Virtual Machine from "RG-Test" to "RG-GlobalApp".',
    question: 'Which operations succeed according to Azure Resource Manager architecture rules?',
    options: [
      { letter: 'A', text: 'Neither operation succeeds; resources must match the Resource Group region and cannot move between Resource Groups' },
      { letter: 'B', text: 'Both operations succeed: resources inside RG-GlobalApp can live in West Europe or Japan East, and compatible resources like VMs can be moved between Resource Groups' },
      { letter: 'C', text: 'Moving the VM succeeds, but deploying resources in different regions inside one Resource Group fails' },
      { letter: 'D', text: 'Deploying across regions succeeds only if RG-GlobalApp is nested inside another Resource Group' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'A Resource Group only stores metadata about its resources in the region you pick for the Resource Group itself—the actual resources inside it can be deployed in ANY Azure region worldwide! Additionally, most Azure resources (including VMs) can be moved from one Resource Group to another.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Resources do not have to be in the same region as their parent Resource Group, and most resources can be moved across Resource Groups.' },
      { letter: 'C', reason: 'A single Resource Group commonly houses resources spanning multiple Azure regions.' },
      { letter: 'D', reason: 'Resource Groups cannot be nested inside each other.' },
    ],
    examTip:
      'Remember: If Central US has an outage, you cannot modify metadata of a Resource Group whose metadata lives in Central US—even if its VMs are running in West Europe!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Separate Resource Group metadata location from the deployment regions of its contained resources.',
    },
  },
  {
    id: 'az900-mod4-q14',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Intermediate',
    scenario:
      'An administrator connects a Microsoft Entra tenant to 40 separate Azure Subscriptions and needs to grant a security auditor read-only Reader permissions across all 40 subscriptions in one assignment.',
    question: 'What is the cleanest scope to assign the Reader role?',
    options: [
      { letter: 'A', text: 'At each individual Resource inside all 40 subscriptions' },
      { letter: 'B', text: 'At a parent Management Group encompassing all 40 subscriptions' },
      { letter: 'C', text: 'Inside an Availability Zone configuration' },
      { letter: 'D', text: 'Inside a Storage Account Access Key' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Assigning the Reader RBAC role once at the parent Management Group scope automatically propagates read-only access down to all 40 child subscriptions and future subscriptions placed under that Management Group.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Assigning permissions per resource creates massive administrative overhead.' },
      { letter: 'C', reason: 'Availability Zones are physical infrastructure zones, not RBAC permission scopes.' },
      { letter: 'D', reason: 'Storage access keys grant full administrative control to a single storage account, not multi-subscription auditing.' },
    ],
    examTip:
      'Manage access or policies across MULTIPLE Subscriptions centrally = Management Groups!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Use Management Groups whenever a rule or RBAC role must span multiple Subscriptions.',
    },
  },
  {
    id: 'az900-mod4-q15',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Fundamental',
    scenario:
      'A solution architect deploys three Virtual Machines using Availability Zones in "East US". Each VM is placed in Zone 1, Zone 2, and Zone 3 respectively behind a Zone-Redundant Azure Load Balancer.',
    question: 'What minimum Azure SLA uptime guarantee applies when VMs are distributed across two or more Availability Zones in the same region?',
    options: [
      { letter: 'A', text: '99.9% SLA' },
      { letter: 'B', text: '99.95% SLA' },
      { letter: 'C', text: '99.99% SLA' },
      { letter: 'D', text: '95.0% SLA' },
    ],
    correctAnswer: 'C',
    whyCorrect:
      'Deploying two or more VM instances across two or more Availability Zones in the same Azure region provides an industry-leading 99.99% VM connectivity SLA (compared to 99.95% for Availability Sets or 99.9% for a single Premium SSD VM).',
    distractorBreakdown: [
      { letter: 'A', reason: '99.9% applies to a single VM using Premium SSD / Ultra Disk.' },
      { letter: 'B', reason: '99.95% applies to two or more VMs in an Availability Set.' },
      { letter: 'D', reason: 'Azure does not use a 95% SLA for production multi-zone VMs.' },
    ],
    examTip:
      'Memorize VM SLAs: Single VM (Premium SSD) = 99.9%; Availability Set (2+ VMs) = 99.95%; Availability Zones (2+ VMs across 2+ AZs) = 99.99%!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Memorize the three standard Azure VM SLA tiers: 99.9% ➔ 99.95% ➔ 99.99%.',
    },
  },
  {
    id: 'az900-mod4-q16',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 4,
    moduleTitle: 'Core Azure Architectural Components',
    difficulty: 'Advanced',
    scenario:
      'An enterprise IT compliance team asks why not every single Azure Region worldwide offers 3 separate Availability Zones, and how Microsoft determines which regions are Zone-enabled.',
    question: 'Which statement accurately describes Availability Zone architecture inside an Azure Region?',
    options: [
      { letter: 'A', text: 'Not every Azure region supports Availability Zones; enabled regions contain a minimum of three physically separate datacenter zones with independent power, cooling, and networking' },
      { letter: 'B', text: 'Every Azure region worldwide guarantees 12 Availability Zones spread across different continents' },
      { letter: 'C', text: 'Availability Zones share the exact same single electrical substation and cooling plant inside one room' },
      { letter: 'D', text: 'Availability Zones are separated by at least 500 miles for continental failover' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Availability Zones are unique physical locations within an Azure region made up of one or more datacenters equipped with independent power, cooling, and networking. Zone-enabled regions always provide at least three separate zones, though smaller/newer specialty regions may not yet support AZs.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Availability Zones exist inside a single Azure region, not across different continents.' },
      { letter: 'C', reason: 'Isolation of power, cooling, and networking is the core requirement preventing correlated single-datacenter failures.' },
      { letter: 'D', reason: '300+ mile separation applies to Region Pairs; AZs sit close enough within one metro region for <2ms synchronous latency.' },
    ],
    examTip:
      'AZ Fact Check: Minimum 3 separate zones per AZ-enabled region, independent power/cooling/network, <2ms latency, NOT available in every region.',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Verify the physical realities of Availability Zones: minimum 3 zones, same region, independent utilities.',
    },
  },

  // =========================================================================
  // MODULE 5 EXPANSION: Azure Compute & Networking Services (q6..q16)
  // =========================================================================
  {
    id: 'az900-mod5-q6',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A cloud architect needs to deploy 50 identical Linux Virtual Machines behind a load balancer and configure them to automatically add or remove identical VM instances based on CPU spikes while keeping full control over the Linux OS kernel.',
    question: 'Which Azure IaaS compute service manages groups of identical, load-balanced, auto-scaling Virtual Machines?',
    options: [
      { letter: 'A', text: 'Azure Virtual Machine Scale Sets (VMSS)' },
      { letter: 'B', text: 'Azure Container Instances (ACI)' },
      { letter: 'C', text: 'Azure Logic Apps' },
      { letter: 'D', text: 'Azure App Service' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Virtual Machine Scale Sets (VMSS) let you create and manage a group of identical, load-balanced IaaS Virtual Machines that automatically scale out or in based on demand or schedule while retaining full OS control.',
    distractorBreakdown: [
      { letter: 'B', reason: 'ACI runs isolated containers without OS VM fleet management.' },
      { letter: 'C', reason: 'Logic Apps runs serverless integration workflows.' },
      { letter: 'D', reason: 'App Service is PaaS and abstracts OS kernel access.' },
    ],
    examTip:
      'Identical auto-scaling VMs with full OS control = Azure Virtual Machine Scale Sets (VMSS)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Choose VMSS when auto-scaling identical IaaS Virtual Machines is required.',
    },
  },
  {
    id: 'az900-mod5-q7',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A startup is running 25 containerized Python microservices that communicate with each other, require automated rolling zero-downtime upgrades, health-probe self-healing, and dynamic horizontal pod autoscaling.',
    question: 'Which Azure compute service provides full managed enterprise container orchestration?',
    options: [
      { letter: 'A', text: 'Azure Container Instances (ACI)' },
      { letter: 'B', text: 'Azure Kubernetes Service (AKS)' },
      { letter: 'C', text: 'Azure Virtual Desktop (AVD)' },
      { letter: 'D', text: 'Azure Functions' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure Kubernetes Service (AKS) simplifies deploying a managed Kubernetes cluster in Azure by offloading control-plane operational overhead, delivering full orchestration, service discovery, rolling updates, and self-healing for multi-container microservices.',
    distractorBreakdown: [
      { letter: 'A', reason: 'ACI is designed for running simple standalone containers quickly without a full Kubernetes orchestrator.' },
      { letter: 'C', reason: 'AVD delivers virtualized Windows desktops.' },
      { letter: 'D', reason: 'Azure Functions runs serverless event-triggered code functions.' },
    ],
    examTip:
      'ACI = Simple single containers, zero orchestrator. AKS = Managed Kubernetes orchestration for multi-container microservices!',
    errorDiagnostic: {
      trapType: 'Over-Engineering',
      correctivePrescription: 'Separate ACI (standalone container speed) from AKS (multi-container orchestration & rolling updates).',
    },
  },
  {
    id: 'az900-mod5-q8',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A finance team wants to deploy a virtualized Windows 11 environment where up to 8 analysts can simultaneously share a single underlying Windows 11 host VM securely over HTTPS without managing a separate dedicated VM per employee.',
    question: 'Which exclusive Azure capability enables multiple concurrent user desktop sessions on a single Windows 10/11 VM?',
    options: [
      { letter: 'A', text: 'Windows 10/11 Enterprise Multi-Session on Azure Virtual Desktop (AVD)' },
      { letter: 'B', text: 'Azure App Service Deployment Slots' },
      { letter: 'C', text: 'Azure Container Instances' },
      { letter: 'D', text: 'Azure Bastion Standard' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Virtual Desktop (AVD) uniquely provides Windows 10 and Windows 11 Enterprise multi-session capability exclusively in Azure, drastically lowering compute and licensing costs for remote desktop fleets.',
    distractorBreakdown: [
      { letter: 'B', reason: 'App Service hosts web applications, not Windows desktops.' },
      { letter: 'C', reason: 'ACI executes Docker containers.' },
      { letter: 'D', reason: 'Azure Bastion is an admin jump-host for VM RDP/SSH management, not end-user desktop virtualization.' },
    ],
    examTip:
      'Multi-session Windows 10/11 remote desktops for end users = Azure Virtual Desktop (AVD)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Remember AVD is the only service offering Windows 10/11 Enterprise Multi-Session.',
    },
  },
  {
    id: 'az900-mod5-q9',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A systems administrator wants to RDP and SSH into 12 Azure Virtual Machines inside a private Virtual Network directly through an encrypted TLS browser session in the Azure Portal, without assigning Public IP addresses to any of the VMs and without exposing ports 22 or 3389 to the internet.',
    question: 'Which Azure networking service provides browser-based TLS RDP/SSH access without exposing VM Public IPs?',
    options: [
      { letter: 'A', text: 'Azure Bastion' },
      { letter: 'B', text: 'Azure ExpressRoute' },
      { letter: 'C', text: 'Azure DNS' },
      { letter: 'D', text: 'Azure Traffic Manager' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Bastion is a fully managed PaaS service deployed inside your Virtual Network that provides secure and seamless RDP and SSH connectivity to your VMs directly in the Azure Portal over TLS (port 443), eliminating public IPs on VMs.',
    distractorBreakdown: [
      { letter: 'B', reason: 'ExpressRoute establishes a private WAN link between on-premises datacenters and Azure.' },
      { letter: 'C', reason: 'Azure DNS handles domain name resolution.' },
      { letter: 'D', reason: 'Traffic Manager routes global DNS requests.' },
    ],
    examTip:
      'No Public IP on VMs + Browser RDP/SSH inside Azure Portal over TLS = Azure Bastion!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Identify Azure Bastion whenever secure admin RDP/SSH without VM public IPs is mentioned.',
    },
  },
  {
    id: 'az900-mod5-q10',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A developer connects an on-premises branch office router to an Azure Virtual Network using encrypted IPsec/IKE tunnels routed across the standard public internet because budget constraints rule out private leased telecom fiber circuits.',
    question: 'Which Azure networking service enables this encrypted site-to-site connection over the public internet?',
    options: [
      { letter: 'A', text: 'Azure ExpressRoute' },
      { letter: 'B', text: 'Azure VPN Gateway (Site-to-Site VPN)' },
      { letter: 'C', text: 'Azure Virtual Network Peering' },
      { letter: 'D', text: 'Azure Private Link' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure VPN Gateway sends encrypted traffic (IPsec/IKE) between an Azure Virtual Network and an on-premises location over the public internet—either Site-to-Site (branch router to Azure) or Point-to-Site (individual laptop to Azure).',
    distractorBreakdown: [
      { letter: 'A', reason: 'ExpressRoute uses private dedicated telco fiber links that bypass the public internet at higher cost.' },
      { letter: 'C', reason: 'VNet Peering connects two Azure VNets inside Azure, not on-premises routers.' },
      { letter: 'D', reason: 'Private Link exposes PaaS resources via private IPs inside a VNet.' },
    ],
    examTip:
      'Over the PUBLIC internet + encrypted IPsec tunnel = Azure VPN Gateway! Private dedicated fiber bypassing public internet = ExpressRoute!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Separate VPN Gateway (encrypted public internet) from ExpressRoute (private dedicated fiber).',
    },
  },
  {
    id: 'az900-mod5-q11',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Fundamental',
    scenario:
      'A security engineer wants to allow incoming HTTPS (TCP port 443) traffic to a web tier subnet while blocking incoming SSH (TCP port 22) traffic from the public internet using simple 5-tuple (Source IP, Destination IP, Port, Protocol, Allow/Deny) rules.',
    question: 'Which native Azure networking construct filters inbound and outbound traffic to VNet subnets and network interfaces using 5-tuple security rules?',
    options: [
      { letter: 'A', text: 'Network Security Group (NSG)' },
      { letter: 'B', text: 'Azure DNS Zone' },
      { letter: 'C', text: 'Azure Resource Lock' },
      { letter: 'D', text: 'Azure Advisor' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'A Network Security Group (NSG) contains a prioritized list of security rules that allow or deny inbound and outbound network traffic to Azure resources connected to an Azure VNet based on source/destination IP, port, and protocol.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure DNS resolves domain names to IP addresses.' },
      { letter: 'C', reason: 'Resource Locks guard against ARM resource deletions/modifications.' },
      { letter: 'D', reason: 'Azure Advisor recommends best practices.' },
    ],
    examTip:
      'Basic port/IP allow-deny traffic filtering inside a VNet subnet or NIC = Network Security Group (NSG)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Map Layer 3/4 IP+Port subnet rules to Network Security Groups (NSGs).',
    },
  },
  {
    id: 'az900-mod5-q12',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Advanced',
    scenario:
      'A startup connects Azure Functions (for tiny event-triggered webhooks) alongside Azure Logic Apps (for a low-code visual workflow integrating Salesforce, Outlook, and SAP). A junior developer asks what differentiates Azure Functions from Azure Logic Apps.',
    question: 'Which statement accurately compares Azure Functions and Azure Logic Apps?',
    options: [
      { letter: 'A', text: 'Azure Functions is code-first (custom C#/Python/JS serverless code), whereas Azure Logic Apps is designer-first (low-code visual workflow orchestration with 400+ pre-built SaaS connectors)' },
      { letter: 'B', text: 'Azure Functions only works on physical on-premises Windows servers' },
      { letter: 'C', text: 'Azure Logic Apps requires managing raw Linux kernel patches manually' },
      { letter: 'D', text: 'Azure Functions cannot respond to HTTP requests or timers' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Both are serverless Azure compute/integration offerings: Azure Functions is a code-first environment for custom event-driven code, while Azure Logic Apps uses a low-code/no-code visual designer and hundreds of out-of-the-box connectors to automate business workflows.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Functions runs natively in the Azure serverless cloud.' },
      { letter: 'C', reason: 'Logic Apps is completely serverless PaaS with zero OS maintenance.' },
      { letter: 'D', reason: 'HTTP triggers, timers, queues, and blobs are core Azure Functions triggers.' },
    ],
    examTip:
      'Serverless Comparison: Write custom event-driven code = Azure Functions. Build visual low-code workflows with SaaS connectors = Azure Logic Apps!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Distinguish code-first serverless (Functions) from visual workflow orchestration (Logic Apps).',
    },
  },
  {
    id: 'az900-mod5-q13',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'An enterprise hosts an online portal across three Azure regions: East US, West Europe, and Japan East. When a user types the domain URL in Tokyo, the architecture must route their DNS lookup directly to the lowest-latency regional endpoint and automatically shift DNS answers if one region goes offline.',
    question: 'Which Azure service performs DNS-based global traffic routing across multiple Azure or external regions?',
    options: [
      { letter: 'A', text: 'Azure Network Security Group' },
      { letter: 'B', text: 'Azure Traffic Manager' },
      { letter: 'C', text: 'Azure Bastion' },
      { letter: 'D', text: 'Azure Virtual Network Peering' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure Traffic Manager is a DNS-based traffic load balancer that distributes traffic to public-facing applications across global Azure regions using routing methods like Performance (lowest latency), Priority (failover), Geographic, and Weighted.',
    distractorBreakdown: [
      { letter: 'A', reason: 'NSGs filter subnet packets inside a VNet.' },
      { letter: 'C', reason: 'Bastion provides RDP/SSH portal access.' },
      { letter: 'D', reason: 'VNet Peering links private VNets privately rather than doing DNS routing.' },
    ],
    examTip:
      'DNS-level global multi-region routing = Azure Traffic Manager! Hosting domain DNS records = Azure DNS!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Recognize DNS-based global routing and automatic regional failover as Azure Traffic Manager.',
    },
  },
  {
    id: 'az900-mod5-q14',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A company acquires the domain name "harambeecloud.com" and wants Microsoft Azure’s global anycast name servers to host and resolve its A, CNAME, and MX records with ultra-high availability alongside its Azure web apps.',
    question: 'Which Azure networking service hosts public or private domain name zones so Azure infrastructure resolves DNS queries?',
    options: [
      { letter: 'A', text: 'Azure DNS' },
      { letter: 'B', text: 'Azure VPN Gateway' },
      { letter: 'C', text: 'Azure ExpressRoute' },
      { letter: 'D', text: 'Azure App Service' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure DNS is a hosting service for DNS domains that provides name resolution using Microsoft Azure infrastructure, supporting both public internet DNS zones and private internal VNet DNS zones.',
    distractorBreakdown: [
      { letter: 'B', reason: 'VPN Gateway creates encrypted tunnels, not DNS record hosting.' },
      { letter: 'C', reason: 'ExpressRoute provides dedicated private WAN connectivity.' },
      { letter: 'D', reason: 'App Service hosts web applications.' },
    ],
    examTip:
      'Note: Azure DNS hosts DNS records (A, CNAME, MX) using your own registered domain—Azure DNS itself is NOT a domain registrar!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Pair domain record hosting (A, CNAME, MX, private VNet zones) with Azure DNS.',
    },
  },
  {
    id: 'az900-mod5-q15',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Advanced',
    scenario:
      'An enterprise security team must protect an externally facing e-commerce web application hosted on Azure against SQL Injection, Cross-Site Scripting (XSS), and Layer-7 HTTP exploits, while simultaneously providing centralized L4–L7 outbound FQDN filtering across a hub Virtual Network.',
    question: 'Which Azure services provide Web Application Firewall (WAF) Layer-7 inspection and centralized managed Hub L4–L7 cloud firewalling?',
    options: [
      { letter: 'A', text: 'Azure Application Gateway (with WAF) and Azure Firewall' },
      { letter: 'B', text: 'Network Security Groups and Azure Bastion' },
      { letter: 'C', text: 'Azure VNet Peering and Azure DNS' },
      { letter: 'D', text: 'Azure Load Balancer Basic and Private Endpoints' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Application Gateway includes an optional Web Application Firewall (WAF) that protects web apps from OWASP Top 10 exploits like SQL injection and XSS, while Azure Firewall is a managed, stateful cloud-native firewall providing centralized L3–L7 FQDN and threat-intelligence filtering across VNets.',
    distractorBreakdown: [
      { letter: 'B', reason: 'NSGs only filter basic L3/L4 IP and port rules, lacking WAF OWASP inspection or FQDN filtering.' },
      { letter: 'C', reason: 'VNet Peering and DNS do not block SQL injection or inspect HTTP payloads.' },
      { letter: 'D', reason: 'Azure Load Balancer works strictly at Layer 4 (TCP/UDP) and cannot inspect HTTP/SQL payloads.' },
    ],
    examTip:
      'Layer-4 TCP/UDP Load Balancing = Azure Load Balancer; Layer-7 HTTP/WAF = Application Gateway; Stateful Hub Firewall + FQDN filtering = Azure Firewall!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Contrast simple IP/port NSGs against Layer-7 Application Gateway WAF and stateful Azure Firewall.',
    },
  },
  {
    id: 'az900-mod5-q16',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 5,
    moduleTitle: 'Azure Compute & Networking Services',
    difficulty: 'Intermediate',
    scenario:
      'A company needs to connect a Virtual Machine in "VNet-App" to an Azure Storage Account without traversing the public internet. Instead of exposing the Storage Account’s public DNS IP, the team wants to project a dedicated private IP address from "VNet-App" directly onto the Storage Account.',
    question: 'Which Azure feature creates a private IP interface inside your Virtual Network for PaaS services like Storage or Azure SQL?',
    options: [
      { letter: 'A', text: 'Azure Private Link / Private Endpoint' },
      { letter: 'B', text: 'Public IPv4 Address Prefix' },
      { letter: 'C', text: 'Azure Traffic Manager' },
      { letter: 'D', text: 'Point-to-Site VPN' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Private Endpoint (powered by Azure Private Link) assigns a private IP address from your VNet’s address space directly to a PaaS service (like Azure Storage, Key Vault, or Azure SQL), keeping all traffic strictly inside the private VNet and Microsoft backbone.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Public IPs expose services over the public internet.' },
      { letter: 'C', reason: 'Traffic Manager performs global DNS routing for public endpoints.' },
      { letter: 'D', reason: 'Point-to-Site VPN connects remote laptops to a VNet.' },
    ],
    examTip:
      'Give an Azure PaaS service (Storage, SQL, Key Vault) a PRIVATE IP inside your VNet = Azure Private Endpoint (Private Link)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Always tie private VNet IP access to PaaS resources to Private Link / Private Endpoints.',
    },
  },

  // =========================================================================
  // MODULE 6 EXPANSION: Azure Storage Services (q6..q16)
  // =========================================================================
  {
    id: 'az900-mod6-q6',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A manufacturing firm runs 40 Windows workstations and two Azure VMs that all need to mount a shared Z: drive concurrently over the standard SMB 3.0 protocol, preserving NTFS permissions.',
    question: 'Which Azure Storage service provides fully managed cloud file shares mountable via SMB and NFS?',
    options: [
      { letter: 'A', text: 'Azure Blob Storage' },
      { letter: 'B', text: 'Azure Files' },
      { letter: 'C', text: 'Azure Queue Storage' },
      { letter: 'D', text: 'Azure Table Storage' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure Files offers fully managed cloud file shares accessible via industry-standard Server Message Block (SMB) and Network File System (NFS) protocols, allowing Windows, Linux, and macOS clients on-premises or in Azure to mount the share simultaneously.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Blob Storage uses HTTP/REST object storage rather than native SMB shared network drives.' },
      { letter: 'C', reason: 'Queue Storage buffers small asynchronous messages between microservices.' },
      { letter: 'D', reason: 'Table Storage stores schemaless NoSQL key-value entities.' },
    ],
    examTip:
      'Shared network drive mount (SMB / NFS) across multiple VMs & on-premises PCs = Azure Files!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Match SMB/NFS shared file mounts directly to Azure Files.',
    },
  },
  {
    id: 'az900-mod6-q7',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A high-volume ticket booking backend decouples its frontend checkout API from its PDF invoice generator by dropping small JSON work items (under 64 KB each) into an ordered message buffer so worker nodes never drop orders during surges.',
    question: 'Which Azure Storage service is built specifically for storing large lists of asynchronous messages up to 64 KB each?',
    options: [
      { letter: 'A', text: 'Azure Queue Storage' },
      { letter: 'B', text: 'Azure Disk Storage' },
      { letter: 'C', text: 'Azure Files' },
      { letter: 'D', text: 'Azure Data Box' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Queue Storage provides reliable cloud messaging for storing millions of small messages (up to 64 KB per message) accessed via HTTP/HTTPS to decouple distributed application tiers.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Disk Storage attaches virtual hard disks to single Virtual Machines.' },
      { letter: 'C', reason: 'Azure Files is for shared SMB/NFS file directories.' },
      { letter: 'D', reason: 'Azure Data Box is an offline physical shipping appliance.' },
    ],
    examTip:
      'Decoupled async messages (<= 64 KB each) inside Storage Account = Azure Queue Storage!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Link application decoupling queues to Azure Queue Storage.',
    },
  },
  {
    id: 'az900-mod6-q8',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A cloud engineer uploads 500 GB of monthly invoices directly into the Blob **Cool** access tier, expecting to save on storage fees. Two weeks later, the engineer switches those blobs to Hot or deletes them, and is surprised by a small unexpected early-deletion fee on the bill.',
    question: 'Why did deleting or moving blobs out of the Cool tier after 14 days incur an early-deletion charge?',
    options: [
      { letter: 'A', text: 'Because Azure charges a minimum retention period of 30 days for Cool, 90 days for Cold, and 180 days for Archive tiers' },
      { letter: 'B', text: 'Because Azure Blob Storage prohibits ever deleting objects once uploaded' },
      { letter: 'C', text: 'Because all Cool tier blobs are stored on physical Azure Data Box disks' },
      { letter: 'D', text: 'Because early deletion converts blobs into Geo-Redundant Storage automatically' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Each discounted Azure Blob access tier carries a minimum retention commitment: Cool = 30 days, Cold = 90 days, Archive = 180 days. Deleting or moving a blob to a hotter tier before the minimum window triggers a prorated early-deletion fee.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Blobs can be deleted at any time; the fee simply accounts for the early exit from the discounted tier.' },
      { letter: 'C', reason: 'Data Box is only for offline bulk shipping.' },
      { letter: 'D', reason: 'Access tiers and replication (LRS/GRS) are independent settings.' },
    ],
    examTip:
      'Minimum Tier Retention Days: Hot = 0 days; Cool = 30 days; Cold = 90 days; Archive = 180 days!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Memorize the 0 / 30 / 90 / 180 day minimum storage rules for Hot, Cool, Cold, and Archive.',
    },
  },
  {
    id: 'az900-mod6-q9',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'An IoT telemetry pipeline writes millions of schemaless JSON device status records that only require simple partition-key + row-key lookups without complex relational joins or stored procedures.',
    question: 'Which low-cost Azure Storage service provides structured NoSQL key-value attribute storage?',
    options: [
      { letter: 'A', text: 'Azure Managed Disks' },
      { letter: 'B', text: 'Azure Table Storage' },
      { letter: 'C', text: 'Azure Archive Blob' },
      { letter: 'D', text: 'Azure File Sync' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure Table Storage stores massive amounts of structured non-relational (NoSQL) data as key-value attribute entities, ideal for address books, device metadata, and flexible schemas without relational joins.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Managed Disks are block-level OS/data volumes attached to VMs.' },
      { letter: 'C', reason: 'Archive Blob is for offline unstructured object backups.' },
      { letter: 'D', reason: 'File Sync caches SMB shares on Windows Servers.' },
    ],
    examTip:
      'NoSQL Key-Value store inside an Azure Storage Account = Azure Table Storage!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Separate Blob (unstructured objects) from Table (structured NoSQL key-value entities).',
    },
  },
  {
    id: 'az900-mod6-q10',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Fundamental',
    scenario:
      'A developer prefers a visual desktop graphical user interface (GUI) installed on macOS and Windows to browse containers, edit blobs, inspect queues, and generate Shared Access Signatures (SAS) without memorizing CLI syntax.',
    question: 'Which free Microsoft desktop tool provides a GUI for managing Azure Storage Account resources?',
    options: [
      { letter: 'A', text: 'Azure Storage Explorer' },
      { letter: 'B', text: 'AzCopy' },
      { letter: 'C', text: 'Azure Data Box Heavy' },
      { letter: 'D', text: 'Azure Bastion' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Storage Explorer is a standalone cross-platform graphical application (Windows, macOS, Linux) for visually inspecting, uploading, downloading, and managing Azure Blobs, Files, Queues, Tables, and Managed Disks.',
    distractorBreakdown: [
      { letter: 'B', reason: 'AzCopy is a headless command-line utility, not a GUI.' },
      { letter: 'C', reason: 'Data Box Heavy is a 1-PB wheeled rugged shipping appliance.' },
      { letter: 'D', reason: 'Bastion is for VM RDP/SSH connections.' },
    ],
    examTip:
      'Desktop GUI for browsing Storage Accounts = Azure Storage Explorer! Scriptable CLI copy = AzCopy!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Keep AzCopy (CLI) and Azure Storage Explorer (GUI) cleanly distinct.',
    },
  },
  {
    id: 'az900-mod6-q11',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A company maintains branch offices with slow WAN links. They want branch employees to open shared corporate CAD blueprints at local LAN speeds on their office Windows Server while automatically tiering older cold files up to Azure Files in the cloud so the office server disk never fills up.',
    question: 'Which Azure technology enables local caching and cloud tiering for Windows file servers backed by Azure Files?',
    options: [
      { letter: 'A', text: 'Azure File Sync' },
      { letter: 'B', text: 'AzCopy' },
      { letter: 'C', text: 'Azure Data Box Disk' },
      { letter: 'D', text: 'Azure Queue Storage' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure File Sync centralizes an organization’s file shares in Azure Files while transforming on-premises Windows Servers into fast local caches with optional Cloud Tiering that moves infrequently used files to Azure while keeping hot files local.',
    distractorBreakdown: [
      { letter: 'B', reason: 'AzCopy performs one-off or scripted file copies without local Windows Server cloud tiering.' },
      { letter: 'C', reason: 'Data Box Disk is for one-time offline bulk migration.' },
      { letter: 'D', reason: 'Queue Storage handles asynchronous messages.' },
    ],
    examTip:
      'Sync on-premises Windows File Server + local fast cache + cloud tiering to Azure Files = Azure File Sync!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Pair Windows File Server caching/cloud tiering with Azure File Sync.',
    },
  },
  {
    id: 'az900-mod6-q12',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A film studio needs to upload 250 terabytes of raw 8K cinema footage from its post-production lab into Azure Blob Storage. Their office internet line is capped at 50 Mbps, meaning an online upload would take over 14 months.',
    question: 'Which Azure offline data transfer solution should the studio order?',
    options: [
      { letter: 'A', text: 'Azure Data Box' },
      { letter: 'B', text: 'Azure File Sync' },
      { letter: 'C', text: 'AzCopy over HTTPS' },
      { letter: 'D', text: 'Azure DNS Transfer' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Data Box provides rugged, tamper-resistant physical storage appliances (such as Data Box Disk up to 35 TB, Data Box up to 80 TB, and Data Box Heavy up to 1 PB) shipped directly to your site to load massive datasets offline and courier back to Microsoft for direct datacenter ingestion.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure File Sync still transmits data over your capped 50 Mbps network line.' },
      { letter: 'C', reason: 'AzCopy relies on your limited network bandwidth and would take over a year for 250 TB.' },
      { letter: 'D', reason: 'Azure DNS does not transfer files.' },
    ],
    examTip:
      'Huge TBs/PBs + slow network / limited time = Physical offline appliance (Azure Data Box)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Select Azure Data Box whenever massive terabyte/petabyte transfers face bandwidth bottlenecks.',
    },
  },
  {
    id: 'az900-mod6-q13',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Advanced',
    scenario:
      'An Azure administrator configures Lifecycle Management policies on a Blob Storage account holding 20 TB of telemetry snapshots. Blobs are uploaded to Hot on Day 0, accessed occasionally during Days 1–30, accessed only for quarterly audits between Days 31–120, and kept untouched for 5-year regulatory retention thereafter (where 12-hour retrieval wait is acceptable).',
    question: 'Which automated lifecycle tier transition sequence minimizes total storage cost without hitting early-deletion penalties?',
    options: [
      { letter: 'A', text: 'Hot (Day 0) ➔ Archive (Day 1) ➔ Cool (Day 120)' },
      { letter: 'B', text: 'Hot (Day 0) ➔ Cool (Day 30) ➔ Cold (Day 90) or Archive (Day 120+)' },
      { letter: 'C', text: 'Archive (Day 0) ➔ Hot (Day 30) ➔ Cool (Day 180)' },
      { letter: 'D', text: 'Keep all 20 TB in Hot with RA-GZRS for 5 years' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Blob Lifecycle Management automatically transitions data from Hot (Days 0–30 active queries) ➔ Cool/Cold (infrequent quarterly audits) ➔ Archive (long-term multi-year offline compliance), strictly honoring minimum retention rules so storage costs plummet automatically.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Putting files in Archive on Day 1 would force slow rehydration and early-deletion charges for quarterly Day 31–120 audits.' },
      { letter: 'C', reason: 'Moving newly ingested data to Archive on Day 0 prevents immediate access during Days 1–30.' },
      { letter: 'D', reason: 'Storing 5-year inactive logs in Hot RA-GZRS incurs unnecessarily high monthly storage costs.' },
    ],
    examTip:
      'Lifecycle Management rules automate tier transitions: Hot ➔ Cool ➔ Cold ➔ Archive as data ages!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Align access frequency over time with progressive tier cooling: Hot -> Cool -> Cold -> Archive.',
    },
  },
  {
    id: 'az900-mod6-q14',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'A database administrator provisions a high-IOPS virtual hard disk directly attached to a dedicated Windows Server Virtual Machine running a custom SQL Server installation.',
    question: 'Which Azure Storage service provides persistent block-level virtual hard disks attached directly to Azure Virtual Machines?',
    options: [
      { letter: 'A', text: 'Azure Managed Disks (Disk Storage)' },
      { letter: 'B', text: 'Azure Queue Storage' },
      { letter: 'C', text: 'Azure Table Storage' },
      { letter: 'D', text: 'Azure Blob Archive Tier' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Disk Storage (Managed Disks) offers high-performance, durable block-level storage volumes managed by Azure for use with Azure Virtual Machines (Ultra Disks, Premium SSD, Standard SSD, Standard HDD).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Queue Storage stores async messages.' },
      { letter: 'C', reason: 'Table Storage stores NoSQL key-value rows.' },
      { letter: 'D', reason: 'Blob Archive is offline object storage and cannot be attached as an active VM OS/SQL disk.' },
    ],
    examTip:
      'VM OS & Data block storage volumes = Azure Disk Storage (Managed Disks)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Tie VM-attached block storage (Ultra Disk, Premium SSD, Standard SSD/HDD) to Azure Disk Storage.',
    },
  },
  {
    id: 'az900-mod6-q15',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Advanced',
    scenario:
      'A disaster recovery auditor compares Locally Redundant Storage (LRS), Zone-Redundant Storage (ZRS), and Geo-Redundant Storage (GRS) regarding total object copies maintained by Azure and resilience against datacenter vs regional outages.',
    question: 'How many total replicas of data does GRS maintain, and what durability level does it deliver?',
    options: [
      { letter: 'A', text: '3 copies in the primary region and 3 copies in the paired secondary region (6 total copies), delivering at least 99.99999999999999% (16 nines) annual durability' },
      { letter: 'B', text: '1 copy in the primary region and 1 copy in the secondary region (2 total copies), delivering 99.9% durability' },
      { letter: 'C', text: '3 copies inside 1 single server rack only, delivering 11 nines durability' },
      { letter: 'D', text: '6 synchronous copies spread across 6 continents' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'GRS writes 3 synchronous copies inside a single datacenter in the primary region (LRS) AND replicates asynchronously to a secondary paired region 300+ miles away where another 3 copies (LRS) are kept—yielding 6 copies total and at least 16 nines (99.99999999999999%) durability.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Both primary and secondary regions maintain 3 copies each (6 total).' },
      { letter: 'C', reason: '3 copies in one datacenter with 11 nines durability describes LRS, not GRS.' },
      { letter: 'D', reason: 'GRS replicates asynchronously between a primary region and its paired secondary region within the same geography.' },
    ],
    examTip:
      'Storage Copy Counts: LRS = 3 copies (11 nines); ZRS = 3 copies across 3 AZs (12 nines); GRS = 6 copies across 2 regions (16 nines)!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Verify copy counts and durability nines: LRS (3 / 11 nines), ZRS (3 / 12 nines), GRS (6 / 16 nines).',
    },
  },
  {
    id: 'az900-mod6-q16',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 6,
    moduleTitle: 'Azure Storage Services',
    difficulty: 'Intermediate',
    scenario:
      'An organization wants to migrate 15 on-premises VMware virtual machines, physical Windows servers, and SQL databases into Azure. Before moving anything, the team wants an automated assessment tool that discovers dependencies, checks Azure VM right-sizing recommendations, and estimates post-migration monthly Azure costs.',
    question: 'Which central Microsoft hub discovers, assesses, and orchestrates on-premises workloads moving to Azure?',
    options: [
      { letter: 'A', text: 'Azure Migrate' },
      { letter: 'B', text: 'Azure Storage Explorer' },
      { letter: 'C', text: 'AzCopy' },
      { letter: 'D', text: 'Azure Service Health' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Migrate provides a centralized hub to discover, assess, right-size, and migrate on-premises infrastructure (VMware, Hyper-V, physical servers), databases, and web applications to Azure.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Storage Explorer browses storage containers, queues, and tables.' },
      { letter: 'C', reason: 'AzCopy copies blobs/files over CLI.' },
      { letter: 'D', reason: 'Service Health reports Azure regional outages.' },
    ],
    examTip:
      'Discover, assess readiness, right-size, and migrate on-prem VMs & databases to Azure = Azure Migrate!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Separate full server/DB assessment & migration (Azure Migrate) from raw file copies (AzCopy/Data Box).',
    },
  },

  // =========================================================================
  // MODULE 7 EXPANSION: Azure Identity, Access, & Security (q6..q16)
  // =========================================================================
  {
    id: 'az900-mod7-q6',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Fundamental',
    scenario:
      'A new employee tries to sign into the Azure Portal. First, Microsoft Entra ID verifies their username and password + MFA code. Next, Azure checks whether their account holds the "Contributor" role on the "RG-Marketing" Resource Group before allowing them to deploy a web app.',
    question: 'Which pair of security concepts describes Step 1 (verifying who the user is) and Step 2 (verifying what they are allowed to do)?',
    options: [
      { letter: 'A', text: 'Step 1: Authorization (AuthZ); Step 2: Authentication (AuthN)' },
      { letter: 'B', text: 'Step 1: Authentication (AuthN); Step 2: Authorization (AuthZ)' },
      { letter: 'C', text: 'Step 1: Resource Locking; Step 2: Encryption' },
      { letter: 'D', text: 'Step 1: Defense in Depth; Step 2: Single Sign-On' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Authentication (AuthN) establishes who you are (proving identity via credentials/MFA). Authorization (AuthZ) determines your level of access and which actions/resources you are permitted to modify (enforced via Azure RBAC).',
    distractorBreakdown: [
      { letter: 'A', reason: 'Reverses Authentication and Authorization.' },
      { letter: 'C', reason: 'Resource Locks block deletions and encryption protects data confidentiality, not user AuthN/AuthZ steps.' },
      { letter: 'D', reason: 'Single Sign-On reuses an authenticated session across multiple apps.' },
    ],
    examTip:
      'AuthN (Authentication) = WHO are you? AuthZ (Authorization) = WHAT are you permitted to do?',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Keep AuthN (identity proof) clearly distinct from AuthZ (RBAC permission level).',
    },
  },
  {
    id: 'az900-mod7-q7',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'A consumer retail brand wants outside customers—who sign in using their personal Gmail, Facebook, or Apple accounts rather than corporate employee accounts—to log into the brand’s B2C loyalty web application securely.',
    question: 'Which Microsoft Entra External ID / customer identity capability handles external customer authentication using social or external accounts?',
    options: [
      { letter: 'A', text: 'Microsoft Entra External ID (formerly Azure AD B2C / External Identities)' },
      { letter: 'B', text: 'On-Premises Active Directory Domain Services only' },
      { letter: 'C', text: 'Azure Resource Locks' },
      { letter: 'D', text: 'Azure DDoS Protection' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Entra External ID empowers organizations to collaborate securely with external business partners (B2B) and authenticate external consumer customers (B2C) using existing social identities like Google, Facebook, or self-service email sign-up.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Traditional on-prem AD DS is designed for internal corporate domain-joined machines and employees, not social consumer logins.' },
      { letter: 'C', reason: 'Resource Locks block resource modifications/deletions.' },
      { letter: 'D', reason: 'DDoS Protection prevents network flooding attacks.' },
    ],
    examTip:
      'External B2B partner collaboration or B2C consumer social login (Google/Facebook) = Microsoft Entra External ID!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Associate external partner and consumer identity federation with Microsoft Entra External ID.',
    },
  },
  {
    id: 'az900-mod7-q8',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'A security administrator wants to eliminate vulnerable static passwords completely so employees authenticate using Windows Hello for Business biometrics, FIDO2 hardware security keys, or phone sign-in approval inside Microsoft Authenticator.',
    question: 'Which category of authentication methods removes the password entirely while preserving strong cryptographic verification?',
    options: [
      { letter: 'A', text: 'Passwordless Authentication' },
      { letter: 'B', text: 'Shared Access Signatures' },
      { letter: 'C', text: 'Role-Based Access Control' },
      { letter: 'D', text: 'Public Endpoint Exposure' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Passwordless authentication in Microsoft Entra ID replaces passwords with cryptographic credentials tied to a trusted device plus something you are (biometric) or have (PIN/FIDO2 key), such as Windows Hello for Business, Microsoft Authenticator Passwordless, and FIDO2 keys.',
    distractorBreakdown: [
      { letter: 'B', reason: 'SAS tokens grant scoped programmatic URL access to Azure Storage blobs/files.' },
      { letter: 'C', reason: 'RBAC controls resource authorization after sign-in.' },
      { letter: 'D', reason: 'Public endpoints expose network services rather than authenticating users.' },
    ],
    examTip:
      '3 Passwordless Options in Entra ID: 1) Windows Hello for Business, 2) Microsoft Authenticator app, 3) FIDO2 Security Keys!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Know the three Microsoft Entra Passwordless mechanisms: Windows Hello, Authenticator, FIDO2 keys.',
    },
  },
  {
    id: 'az900-mod7-q9',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'An engineer needs permission to create, resize, and manage Virtual Machines inside a Resource Group, WITHOUT having the authority to grant or revoke other users’ RBAC permissions.',
    question: 'Which built-in Azure RBAC role follows the Principle of Least Privilege for this exact requirement?',
    options: [
      { letter: 'A', text: 'Owner' },
      { letter: 'B', text: 'Contributor' },
      { letter: 'C', text: 'Reader' },
      { letter: 'D', text: 'Global Reader' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'The built-in **Contributor** RBAC role grants full access to manage all Azure resources (creating/modifying/deleting VMs, networks, storage) EXCEPT it explicitly denies assigning roles/access permissions to others—unlike **Owner**.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Owner grants full resource control PLUS permission to delegate RBAC roles to other users.' },
      { letter: 'C', reason: 'Reader allows viewing resources only, blocking VM creation or resizing.' },
      { letter: 'D', reason: 'Global Reader is a read-only Microsoft Entra ID directory role.' },
    ],
    examTip:
      'Built-in RBAC Trio: Owner (manage resources + manage access); Contributor (manage resources ONLY, CANNOT grant access); Reader (view ONLY); User Access Administrator (manage user access ONLY)!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Apply Least Privilege: Contributor manages resources without delegating permissions.',
    },
  },
  {
    id: 'az900-mod7-q10',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'An enterprise security operations team wants an automated tool that scans all Azure VMs, SQL Databases, Storage Accounts, and AWS EC2 instances, outputs a numerical "Secure Score", flags unencrypted disks, and recommends exact hardening remediations.',
    question: 'Which Azure security service provides Cloud Security Posture Management (CSPM) and Secure Score diagnostics across hybrid and multi-cloud workloads?',
    options: [
      { letter: 'A', text: 'Microsoft Defender for Cloud' },
      { letter: 'B', text: 'Microsoft Purview' },
      { letter: 'C', text: 'Azure Bastion' },
      { letter: 'D', text: 'Azure ExpressRoute' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Defender for Cloud is a Cloud Security Posture Management (CSPM) and Cloud Workload Protection Platform (CWPP) tool that continuously evaluates security posture via Secure Score and defends Azure, on-premises, AWS, and GCP resources.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Microsoft Purview handles data governance, PII classification, and compliance cataloging.' },
      { letter: 'C', reason: 'Bastion provides TLS-based RDP/SSH access.' },
      { letter: 'D', reason: 'ExpressRoute provides private network fiber connectivity.' },
    ],
    examTip:
      'Secure Score + Cloud Security Posture Management (CSPM) + vulnerability hardening recommendations = Microsoft Defender for Cloud!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Pair Secure Score and multi-cloud posture hardening with Microsoft Defender for Cloud.',
    },
  },
  {
    id: 'az900-mod7-q11',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'A fintech startup wants to ensure that database connection strings, API bearer tokens, and TLS/SSL X.509 certificates are never hardcoded into Git repositories or plaintext configuration files, and instead are stored in FIPS-validated Hardware Security Modules (HSMs).',
    question: 'Which Azure service securely stores and tightly controls access to cryptographic keys, secrets, and certificates?',
    options: [
      { letter: 'A', text: 'Azure Key Vault' },
      { letter: 'B', text: 'Azure Queue Storage' },
      { letter: 'C', text: 'Azure App Configuration' },
      { letter: 'D', text: 'Azure Cost Management' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Key Vault safeguards cryptographic keys, API secrets/passwords, and SSL/TLS certificates in centralized, HSM-backed cloud vaults with strict Entra ID RBAC/access policies and audit logging.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Queue Storage stores unencrypted-by-intent transient work messages, not sensitive secrets.' },
      { letter: 'C', reason: 'App Configuration manages non-sensitive feature flags and hierarchical config settings.' },
      { letter: 'D', reason: 'Cost Management tracks cloud spending.' },
    ],
    examTip:
      'Store Secrets + Encryption Keys + TLS Certificates safely = Azure Key Vault!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Always choose Azure Key Vault for cryptographic keys, secrets, and certificates.',
    },
  },
  {
    id: 'az900-mod7-q12',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Advanced',
    scenario:
      'An organization is migrating from legacy perimeter security to a Zero Trust Architecture. An analyst claims: "Because our corporate employees connect over our internal office VPN, any API call arriving from an internal office IP should skip token checks and run with full read/write permissions."',
    question: 'Which two Zero Trust guiding principles does the analyst’s statement directly violate?',
    options: [
      { letter: 'A', text: 'Verify explicitly and Use least privilege access' },
      { letter: 'B', text: 'Scale vertically and Use Locally Redundant Storage' },
      { letter: 'C', text: 'Prefer CapEx over OpEx and Use Archive Storage' },
      { letter: 'D', text: 'Nest Resource Groups and Disable Resource Locks' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Zero Trust mandates three core principles: 1) Verify explicitly (authenticate and authorize every request using all signals regardless of network origin), 2) Use least privilege access (JIT/JEA minimum permissions), and 3) Assume breach. Skipping token checks on VPN IPs violates explicit verification, and granting full read/write violates least privilege.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Vertical scaling and LRS relate to compute sizing and storage replication, not Zero Trust.' },
      { letter: 'C', reason: 'CapEx/OpEx and Archive tier relate to economics and cold storage.' },
      { letter: 'D', reason: 'Resource Groups cannot be nested and Locks guard against deletion.' },
    ],
    examTip:
      'Zero Trust 3 Pillars: 1) Verify Explicitly, 2) Use Least Privilege Access, 3) Assume Breach!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Never trust internal network location alone under Zero Trust—always verify identity + device + least privilege.',
    },
  },
  {
    id: 'az900-mod7-q13',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'A SOC (Security Operations Center) team ingests millions of security events daily from Microsoft Entra ID, Defender for Cloud, Palo Alto firewalls, AWS CloudTrail, and Linux syslogs. They want AI-powered correlation, automated incident playbooks, and threat hunting in one glass pane.',
    question: 'Which cloud-native Azure SIEM and SOAR platform fulfills this enterprise security analytics requirement?',
    options: [
      { letter: 'A', text: 'Microsoft Sentinel' },
      { letter: 'B', text: 'Azure Advisor' },
      { letter: 'C', text: 'Azure Service Health' },
      { letter: 'D', text: 'Azure Pricing Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Sentinel is Azure’s scalable, cloud-native Security Information and Event Management (SIEM) and Security Orchestration, Automation, and Response (SOAR) solution for cross-cloud log collection, threat detection, and automated incident response.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Advisor gives configuration best-practice tips across five pillars, not cross-vendor SIEM threat hunting.' },
      { letter: 'C', reason: 'Service Health tracks Azure datacenter outages.' },
      { letter: 'D', reason: 'Pricing Calculator forecasts monthly bills.' },
    ],
    examTip:
      'SIEM + SOAR + Multi-cloud threat hunting & automated security playbooks = Microsoft Sentinel!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Separate Sentinel (SIEM/SOAR log correlation & response) from Defender for Cloud (CSPM/Secure Score posture).',
    },
  },
  {
    id: 'az900-mod7-q14',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Intermediate',
    scenario:
      'A public banking website experiences an attack where thousands of compromised botnet computers flood its Azure Virtual Network public IP with massive malformed UDP/SYN traffic, attempting to exhaust bandwidth and CPU.',
    question: 'Which Azure service mitigates volumetric, protocol, and application-layer Distributed Denial of Service floods before they overwhelm VNet workloads?',
    options: [
      { letter: 'A', text: 'Azure DDoS Protection' },
      { letter: 'B', text: 'Azure Key Vault' },
      { letter: 'C', text: 'Microsoft Purview' },
      { letter: 'D', text: 'Azure File Sync' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure DDoS Protection (combined with application design best practices) defends against DDoS attacks by scrubbing volumetric, protocol, and resource-layer traffic at Microsoft’s global network edge—and Network Protection tier adds adaptive tuning and DDoS rapid response support.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Key Vault manages secrets and keys.' },
      { letter: 'C', reason: 'Purview manages data governance and PII discovery.' },
      { letter: 'D', reason: 'File Sync caches SMB file shares.' },
    ],
    examTip:
      'Protect Azure Public IPs against massive botnet traffic floods = Azure DDoS Protection!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Associate volumetric traffic scrubbing and edge mitigation with Azure DDoS Protection.',
    },
  },
  {
    id: 'az900-mod7-q15',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Advanced',
    scenario:
      'An auditor is mapping controls onto the 7-layer Defense in Depth model: Control A is biometric datacenter badges & perimeter fencing; Control B is enabling MFA & Conditional Access; Control C is applying a VNet Network Security Group (NSG) and Private Endpoint; Control D is encrypting customer database columns with TLS and TDE.',
    question: 'Which Defense in Depth layer sequence corresponds to Controls A, B, C, and D in order?',
    options: [
      { letter: 'A', text: 'A: Physical, B: Identity & Access, C: Network, D: Data' },
      { letter: 'B', text: 'A: Perimeter, B: Application, C: Compute, D: Physical' },
      { letter: 'C', text: 'A: Identity & Access, B: Physical, C: Data, D: Compute' },
      { letter: 'D', text: 'A: Network, B: Perimeter, C: Data, D: Identity & Access' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Biometric datacenter doors = Physical layer; MFA/Conditional Access = Identity & Access layer; NSGs/Private Endpoints = Network layer; encrypting stored/transmitted records = Data layer (the innermost target).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Biometric datacenter security is Physical (not Perimeter), and encryption at rest protects Data.' },
      { letter: 'C', reason: 'Swaps Physical and Identity layers and misplaces Data.' },
      { letter: 'D', reason: 'Swaps Physical/Identity with Network/Perimeter.' },
    ],
    examTip:
      'Check the 7 layers carefully: Physical -> Identity & Access -> Perimeter (DDoS/Edge Firewall) -> Network (NSGs/Subnets) -> Compute (VMs/OS patches) -> Application (HTTPS/input validation) -> Data (Encryption)!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Practice mapping real Azure controls to each of the 7 Defense in Depth rings.',
    },
  },
  {
    id: 'az900-mod7-q16',
    learningPathId: 2,
    learningPathTitle: 'Describe Azure Architecture & Services',
    moduleId: 7,
    moduleTitle: 'Azure Identity, Access, & Security',
    difficulty: 'Fundamental',
    scenario:
      'A company requires employees to prove their identity using two distinct categories during sign-in: their corporate password AND a one-time biometric approval push notification inside the Microsoft Authenticator mobile app.',
    question: 'Which two authentication factor categories are combined in this sign-in flow?',
    options: [
      { letter: 'A', text: 'Something you know (password) and something you have/are (registered mobile device + biometric)' },
      { letter: 'B', text: 'Two instances of something you know (two security questions)' },
      { letter: 'C', text: 'Role-Based Access Control and Resource Tags' },
      { letter: 'D', text: 'Two different passwords typed sequentially' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Multi-Factor Authentication (MFA) requires two or more independent factor categories: Something you KNOW (password/PIN), Something you HAVE (trusted smartphone/Authenticator/hardware token), and Something you ARE (fingerprint/FaceID biometric). Typing two passwords uses only one factor ("something you know") and is NOT MFA.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Two knowledge items (password + security question) remain single-factor authentication.' },
      { letter: 'C', reason: 'RBAC and Resource Tags are authorization and cost metadata, not MFA sign-in factors.' },
      { letter: 'D', reason: 'Two passwords are still only "something you know."' },
    ],
    examTip:
      'MFA Trap: Two passwords ≠ MFA! True MFA requires at least 2 DIFFERENT factor categories (Know + Have + Are)!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Verify MFA combines separate categories (Know / Have / Are), never two items from the same category.',
    },
  },
];
