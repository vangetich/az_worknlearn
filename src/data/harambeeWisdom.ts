export interface WisdomSlide {
  id: string;
  swahiliTitle: string;
  englishTitle: string;
  category: string;
  coreRule: string;
  technicalBreakdown: {
    label: string;
    description: string;
    tag: string;
  }[];
  oftenMissedCue: string;
  examShortcut: string;
}

export interface VitalCue {
  id: string;
  topic: string;
  moduleId: number;
  questionTrigger: string;
  commonMistake: string;
  vitalCorrection: string;
  keyTriggerWords: string[];
}

export const HARAMBEE_SLIDES: WisdomSlide[] = [
  {
    id: 'slide-1',
    swahiliTitle: 'Kugawana Wajibu',
    englishTitle: 'The Shared Responsibility Blueprint',
    category: 'Cloud Concepts • Module 1',
    coreRule: 'Customer ALWAYS owns Data, Identities, and Devices regardless of whether you choose IaaS, PaaS, or SaaS.',
    technicalBreakdown: [
      {
        label: 'IaaS (e.g. Azure Virtual Machines)',
        description: 'Microsoft manages physical servers, virtualization hypervisors, and physical datacenters. YOU configure and patch the Operating System, middleware, runtime, and applications.',
        tag: 'OS Control / Heavy Maintenance',
      },
      {
        label: 'PaaS (e.g. Azure App Service, SQL DB)',
        description: 'Microsoft automates OS patching, hardware scaling, and runtime maintenance. Developers deploy code and manage database schemas directly.',
        tag: 'Zero OS Overhead',
      },
      {
        label: 'SaaS (e.g. Microsoft 365, Dynamics)',
        description: 'The cloud vendor manages the entire end-to-end software stack. You simply manage user accounts and access permissions.',
        tag: 'Turnkey Solution',
      },
    ],
    oftenMissedCue: 'Exam questions often ask who patches the OS for an Azure App Service: it is MICROSOFT, not you!',
    examShortcut: 'IaaS = You patch OS. PaaS = Microsoft patches OS. SaaS = Microsoft patches everything.',
  },
  {
    id: 'slide-2',
    swahiliTitle: 'Upimaji wa Kompyuta',
    englishTitle: 'Compute Selection Compass',
    category: 'Architecture & Services • Module 5',
    coreRule: 'Choose the simplest compute abstraction that fulfills the scenario requirements.',
    technicalBreakdown: [
      {
        label: 'Azure Virtual Machines',
        description: 'Complete OS control, custom kernel drivers, legacy software migrations ("Lift-and-Shift").',
        tag: 'IaaS',
      },
      {
        label: 'Virtual Machine Scale Sets (VMSS)',
        description: 'Pools of identical, load-balanced VMs that scale horizontally out or in automatically based on CPU/RAM load.',
        tag: 'Auto-scaling IaaS',
      },
      {
        label: 'Azure App Service',
        description: 'Hosting web apps, REST APIs, and background jobs with automated continuous integration and automatic scaling.',
        tag: 'PaaS',
      },
      {
        label: 'Azure Container Instances (ACI) vs. AKS',
        description: 'ACI runs fast standalone container jobs without cluster management. AKS orchestrates complex enterprise microservices with Kubernetes.',
        tag: 'Containers',
      },
    ],
    oftenMissedCue: 'If the question mentions container orchestration with service discovery and multi-node pod scaling, the answer is AKS, not ACI!',
    examShortcut: 'Web app with zero server maintenance = App Service. Microservices with Kubernetes = AKS. Standalone single container = ACI.',
  },
  {
    id: 'slide-3',
    swahiliTitle: 'Uhifadhi na Uvumilivu',
    englishTitle: 'Storage Tiers & Redundancy Matrix',
    category: 'Architecture & Services • Module 6',
    coreRule: 'Storage pricing is an inverse tradeoff: Hot tier has highest storage cost & lowest access cost; Archive tier has lowest storage cost & highest access cost + hours of rehydration delay.',
    technicalBreakdown: [
      {
        label: 'Hot Tier',
        description: 'Active data accessed frequently. Lowest access transaction fees, highest monthly storage cost.',
        tag: 'Frequent Reads',
      },
      {
        label: 'Cool Tier (30 days min)',
        description: 'Infrequently accessed data (short-term backups, raw data staging). Lower storage cost, higher access cost.',
        tag: 'Short-term Backup',
      },
      {
        label: 'Archive Tier (180 days min)',
        description: 'Lowest storage cost per GB (pennies per month). Data is stored OFFLINE; retrieval takes several hours ("rehydration").',
        tag: 'Regulatory Cold Archive',
      },
      {
        label: 'LRS vs. ZRS vs. GRS',
        description: 'LRS = 3 copies in 1 datacenter. ZRS = 3 copies across 3 Availability Zones in the primary region. GRS = 3 copies primary region + 3 copies secondary paired region 300+ miles away.',
        tag: 'Data Durability',
      },
    ],
    oftenMissedCue: 'Zone-Redundant Storage (ZRS) protects against datacenter loss WITHOUT copying data to a secondary region!',
    examShortcut: 'Lowest storage cost for 7-year audit data = Archive tier. Protect from single datacenter flood = ZRS. Cross-region disaster recovery = GRS.',
  },
  {
    id: 'slide-4',
    swahiliTitle: 'Utawala na Ulinzi',
    englishTitle: 'Governance Triad: Policy vs. RBAC vs. Locks',
    category: 'Management & Governance • Module 9',
    coreRule: 'RBAC controls WHO has permission. Policy controls WHAT properties resources must comply with. Resource Locks PREVENT accidental modifications/deletions regardless of user role.',
    technicalBreakdown: [
      {
        label: 'Azure RBAC',
        description: 'Assigns roles (Owner, Contributor, Reader) to identities. Enforces least-privilege access.',
        tag: 'Identity Permissions',
      },
      {
        label: 'Azure Policy',
        description: 'Evaluates resource compliance rules at provisioning time (e.g. "Allowed Locations", "Allowed VM sizes").',
        tag: 'Resource Compliance',
      },
      {
        label: 'Resource Locks',
        description: 'CanNotDelete allows modifying but blocks deletion. ReadOnly blocks modifying AND deletion. Even Subscription Owners cannot bypass locks without deleting the lock itself first.',
        tag: 'Accidental Deletion Guard',
      },
    ],
    oftenMissedCue: 'A Subscription Owner CANNOT delete a resource protected by a CanNotDelete lock until the lock is removed! Locks trump RBAC.',
    examShortcut: 'Who can do what = RBAC. Allowed regions/tags = Azure Policy. Prevent deleting production database = CanNotDelete Lock.',
  },
  {
    id: 'slide-5',
    swahiliTitle: 'Mtandao Salama',
    englishTitle: 'Network Isolation: VPN Gateway vs. ExpressRoute',
    category: 'Architecture & Services • Module 5',
    coreRule: 'VPN Gateway encrypts traffic OVER the public internet. ExpressRoute creates a private, dedicated physical connection that BYPASSES the public internet completely.',
    technicalBreakdown: [
      {
        label: 'Azure VPN Gateway (Site-to-Site)',
        description: 'Encrypted IPsec/IKE tunnels over the public internet. Cost-effective, suitable for moderate bandwidth needs.',
        tag: 'Uses Public Internet',
      },
      {
        label: 'Azure ExpressRoute',
        description: 'Direct physical connection via connectivity partner (Telco). Does NOT traverse public internet. Speeds up to 100 Gbps with ultra-low predictable latency.',
        tag: 'Bypasses Internet',
      },
      {
        label: 'Virtual Network Peering',
        description: 'Connects two VNets directly within Azure\'s backbone with high-speed, sub-millisecond private IP routing.',
        tag: 'Azure Internal',
      },
    ],
    oftenMissedCue: 'Look for "does not travel over the public internet" in the prompt — that is the direct keyword trigger for ExpressRoute!',
    examShortcut: 'Encrypted over internet = VPN Gateway. Private dedicated line bypassing internet = ExpressRoute.',
  },
];

export const VITAL_EXAM_CUES: VitalCue[] = [
  {
    id: 'cue-1',
    topic: 'Resource Locks vs. Owner Permissions',
    moduleId: 9,
    questionTrigger: 'Can a Subscription Owner delete a virtual machine protected by a "CanNotDelete" lock?',
    commonMistake: 'Candidates assume Subscription Owners have root/god-mode access and can delete anything directly.',
    vitalCorrection: 'NO! Resource Locks apply to ALL users regardless of role, including Owners. The lock must be deleted first before the resource can be deleted.',
    keyTriggerWords: ['CanNotDelete', 'Subscription Owner', 'Resource Lock Override'],
  },
  {
    id: 'cue-2',
    topic: 'ExpressRoute Internet Routing',
    moduleId: 5,
    questionTrigger: 'Does Azure ExpressRoute traffic traverse the public internet?',
    commonMistake: 'Candidates confuse VPN Gateway with ExpressRoute and think both use internet encryption.',
    vitalCorrection: 'NO! ExpressRoute traffic never touches the public internet. It uses dedicated private circuits through co-location exchange providers.',
    keyTriggerWords: ['Bypass public internet', 'Dedicated circuit', 'ExpressRoute'],
  },
  {
    id: 'cue-3',
    topic: 'App Service OS Responsibility',
    moduleId: 5,
    questionTrigger: 'Who is responsible for operating system updates on Azure App Service?',
    commonMistake: 'Candidates think that because you deploy code, you must update the underlying Linux or Windows OS.',
    vitalCorrection: 'Microsoft is 100% responsible for patching the OS, runtime, and hardware in Azure App Service (PaaS).',
    keyTriggerWords: ['OS patching overhead', 'PaaS responsibility', 'App Service'],
  },
  {
    id: 'cue-4',
    topic: 'Availability Zones vs. Region Pairs',
    moduleId: 4,
    questionTrigger: 'Which feature protects against a regional catastrophe (flood/hurricane) occurring across an entire metropolitan area?',
    commonMistake: 'Choosing Availability Zones. Availability Zones are within the SAME region and can both be affected by the same regional hurricane.',
    vitalCorrection: 'Region Pairs! They are located at least 300 miles apart in separate power grids to withstand regional disasters.',
    keyTriggerWords: ['300+ miles apart', 'Regional disaster', 'Region Pairs'],
  },
  {
    id: 'cue-5',
    topic: 'Azure Advisor vs. Service Health',
    moduleId: 11,
    questionTrigger: 'Which tool alerts you when Microsoft Azure datacenters are experiencing an active outage or scheduled maintenance?',
    commonMistake: 'Selecting Azure Advisor or Azure Monitor.',
    vitalCorrection: 'Azure Service Health! Azure Advisor only provides recommendations on how to optimize your existing resources (Cost, Security, etc.).',
    keyTriggerWords: ['Active outage', 'Planned maintenance', 'Azure Service Health'],
  },
  {
    id: 'cue-6',
    topic: 'Azure Policy vs. Azure RBAC',
    moduleId: 9,
    questionTrigger: 'Which tool prevents developers from deploying resources outside the "East US" region?',
    commonMistake: 'Selecting Azure RBAC.',
    vitalCorrection: 'Azure Policy! RBAC controls WHO can do actions (user permissions), whereas Policy controls WHAT properties resources are allowed to have (regions, SKUs).',
    keyTriggerWords: ['Allowed locations', 'Resource compliance', 'Azure Policy'],
  },
];
