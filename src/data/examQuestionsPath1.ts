import type { Question } from '../types/quiz.ts';

export const PATH1_EXPANSION_QUESTIONS: Question[] = [
  // =========================================================================
  // MODULE 1 EXPANSION: Fundamental Cloud Concepts (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod1-q6',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A financial technology firm is migrating an internal reporting tool from an IaaS Virtual Machine deployment to Azure App Service (PaaS). The CISO wants to clarify which security responsibility shifts from the internal IT team to Microsoft after the migration.',
    question: 'Which responsibility transfers from the customer to Microsoft when moving from IaaS to PaaS?',
    options: [
      { letter: 'A', text: 'Classification and protection of customer financial data' },
      { letter: 'B', text: 'Operating system security patching and runtime maintenance' },
      { letter: 'C', text: 'Assigning user accounts and Multi-Factor Authentication in Microsoft Entra ID' },
      { letter: 'D', text: 'Managing corporate laptops and mobile endpoints used by analysts' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'In IaaS, the customer manages and patches the guest operating system and runtime. When shifting to PaaS (such as Azure App Service), Microsoft assumes responsibility for operating system patching, middleware, and runtime maintenance, allowing developers to focus on application code and configuration.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Data classification and accountability always remain the customer’s responsibility across IaaS, PaaS, and SaaS.' },
      { letter: 'C', reason: 'Accounts and identities are always governed by the customer.' },
      { letter: 'D', reason: 'Client devices and endpoints always stay on the customer side of the Shared Responsibility boundary.' },
    ],
    examTip:
      'Moving IaaS ➔ PaaS transfers Operating System management & patching to Microsoft. Data, Identities, and Endpoints NEVER transfer!',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Review the Shared Responsibility matrix: OS control drops out for the customer at the PaaS tier.',
    },
  },
  {
    id: 'az900-mod1-q7',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A government defense agency requires absolute physical isolation of hardware, dedicated network switches, and zero shared multi-tenancy with any external organization because of national security statutes. They already operate a modern virtualization cluster inside their own secured facility.',
    question: 'Which cloud deployment model aligns with these strict single-tenant physical ownership constraints?',
    options: [
      { letter: 'A', text: 'Public Cloud' },
      { letter: 'B', text: 'Private Cloud' },
      { letter: 'C', text: 'Hybrid Cloud' },
      { letter: 'D', text: 'Multi-Cloud Bursting' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'A Private Cloud is operated exclusively by a single organization inside its own on-premises datacenter or dedicated third-party facility, providing total control over physical security, hardware isolation, and zero shared multi-tenancy.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Public cloud shares physical datacenter infrastructure across multiple tenants (though logically isolated).' },
      { letter: 'C', reason: 'Hybrid cloud connects private infrastructure to a public cloud; here all workloads stay exclusively isolated inside the agency facility.' },
      { letter: 'D', reason: 'Multi-cloud involves consuming services from two or more public cloud providers.' },
    ],
    examTip:
      'Single-organization exclusive hardware, zero multi-tenancy, and complete physical hardware governance = Private Cloud.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Distinguish single-tenant Private Cloud from multi-tenant Public Cloud and interconnected Hybrid Cloud.',
    },
  },
  {
    id: 'az900-mod1-q8',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Advanced',
    scenario:
      'An enterprise deploys a new CRM platform using Software as a Service (SaaS) and an analytics dashboard using Platform as a Service (PaaS). During an external security audit, the compliance officer asks who is responsible for configuring network access rules (such as firewall restrictions) on the PaaS database versus the SaaS CRM.',
    question: 'In the Shared Responsibility Model, how is network control responsibility allocated between PaaS and SaaS?',
    options: [
      { letter: 'A', text: 'Microsoft retains full responsibility for network controls in both PaaS and SaaS' },
      { letter: 'B', text: 'Network controls are a shared responsibility in PaaS, whereas Microsoft manages network controls in SaaS' },
      { letter: 'C', text: 'The customer owns 100% of physical switch routing in both PaaS and SaaS' },
      { letter: 'D', text: 'The customer owns network controls in SaaS, while Microsoft owns them in PaaS' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'In Microsoft’s official Shared Responsibility Model, Physical Hosts/Networks/Datacenters belong to Microsoft across all models, while "Network Controls" and "Applications" are Shared between the customer and Microsoft in PaaS (e.g., configuring PaaS firewalls/private endpoints) and fully owned by Microsoft in SaaS.',
    distractorBreakdown: [
      { letter: 'A', reason: 'In PaaS, customers still configure firewall IP allowlists, private endpoints, and TLS rules, making Network Controls a shared responsibility.' },
      { letter: 'C', reason: 'Physical switch hardware is always Microsoft’s responsibility in public cloud models.' },
      { letter: 'D', reason: 'Reverses the matrix: SaaS abstracts network controls away to the provider.' },
    ],
    examTip:
      'In PaaS, three rows are SHARED (vary by service): Identity & Directory Infrastructure, Application, and Network Controls!',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Memorize the shared middle band in PaaS: Application, Network Controls, and Identity Infrastructure.',
    },
  },
  {
    id: 'az900-mod1-q9',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Fundamental',
    scenario:
      'A startup developer wants to deploy a custom Python REST API without provisioning virtual machines, configuring IIS/Nginx, or worrying about OS security patches, while still retaining full ownership of the application source code and configuration.',
    question: 'Which cloud service model fits this requirement?',
    options: [
      { letter: 'A', text: 'Infrastructure as a Service (IaaS)' },
      { letter: 'B', text: 'Platform as a Service (PaaS)' },
      { letter: 'C', text: 'Software as a Service (SaaS)' },
      { letter: 'D', text: 'Bare-Metal Colocation' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Platform as a Service (PaaS) gives developers a ready-to-use deployment platform where they bring their own custom application code and data while the cloud provider handles servers, storage, networking, and OS patching.',
    distractorBreakdown: [
      { letter: 'A', reason: 'IaaS forces the developer to manage the OS and server patches manually.' },
      { letter: 'C', reason: 'SaaS offers finished software to end users rather than a hosting platform for custom source code.' },
      { letter: 'D', reason: 'Bare-metal colocation requires buying and maintaining physical servers.' },
    ],
    examTip:
      'Custom application code + zero OS/server patching = PaaS (e.g., Azure App Service, Azure SQL Database).',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Look for "bring your own code" without OS maintenance — that is the defining marker of PaaS.',
    },
  },
  {
    id: 'az900-mod1-q10',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A multinational retailer uses Microsoft Azure for its global checkout microservices and simultaneously runs specialized machine learning workloads on Amazon Web Services (AWS) to avoid single-vendor lock-in.',
    question: 'Which cloud strategy is the retailer practicing?',
    options: [
      { letter: 'A', text: 'Private Cloud' },
      { letter: 'B', text: 'Multi-Cloud' },
      { letter: 'C', text: 'Community Cloud' },
      { letter: 'D', text: 'Single-Region Failover' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Multi-Cloud refers to using public cloud services from two or more distinct cloud providers (such as Microsoft Azure and AWS) simultaneously to leverage specialized features or mitigate vendor lock-in.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Private Cloud involves infrastructure dedicated to a single organization on-premises or privately hosted.' },
      { letter: 'C', reason: 'Community Cloud shares infrastructure across organizations with common regulatory compliance.' },
      { letter: 'D', reason: 'Single-Region Failover uses Availability Zones inside one provider.' },
    ],
    examTip:
      'Azure + AWS/GCP = Multi-Cloud. On-Premises Datacenter + Azure = Hybrid Cloud.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Separate Hybrid Cloud (Private + Public) from Multi-Cloud (2+ Public Clouds).',
    },
  },
  {
    id: 'az900-mod1-q11',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A university research consortium wants to run shared genomic datasets on public cloud infrastructure while maintaining strict cost boundaries. A teammate suggests buying physical servers and placing them in a rented datacenter cage because "cloud means renting only VMs."',
    question: 'Which statement accurately defines cloud computing in contrast to traditional colocation?',
    options: [
      { letter: 'A', text: 'Cloud computing requires multi-year fixed physical hardware leases per rack' },
      { letter: 'B', text: 'Cloud computing is the on-demand delivery of compute power, storage, databases, and IT services over the internet with pay-as-you-go pricing' },
      { letter: 'C', text: 'Cloud computing eliminates the need for internet connectivity or identity authentication' },
      { letter: 'D', text: 'Cloud computing shifts 100% of data classification liability to the cloud provider' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Cloud computing is the delivery of computing services—including servers, storage, databases, networking, software, analytics, and intelligence—over the internet ("the cloud") to offer faster innovation, flexible resources, and economies of scale with pay-as-you-go pricing.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Colocation rents physical racks on fixed contracts, whereas cloud computing is on-demand and metered.' },
      { letter: 'C', reason: 'Cloud computing relies on internet or private WAN connectivity and strong identity controls.' },
      { letter: 'D', reason: 'Customers always remain accountable for their data and compliance classification.' },
    ],
    examTip:
      'Core Definition: Cloud computing = On-demand delivery of IT resources over the internet with pay-as-you-go pricing.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Anchor cloud computing to on-demand provisioning, metered consumption, and internet/private WAN delivery.',
    },
  },
  {
    id: 'az900-mod1-q12',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Advanced',
    scenario:
      'An organization signs up for Microsoft 365 (SaaS). Six months later, an attacker compromises an employee’s weak password (because MFA was never enabled by the company IT admin) and downloads confidential client contracts stored in SharePoint Online.',
    question: 'Under the Shared Responsibility Model, why is the customer accountable for this breach?',
    options: [
      { letter: 'A', text: 'Because Microsoft fails to patch SharePoint servers in SaaS environments' },
      { letter: 'B', text: 'Because even in SaaS, Account & Identity security and Information/Data governance remain the customer’s responsibility' },
      { letter: 'C', text: 'Because SaaS requires the customer to configure physical datacenter firewalls' },
      { letter: 'D', text: 'Because SharePoint Online is classified as an IaaS Virtual Machine workload' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Even in fully managed SaaS offerings, the customer is solely responsible for Accounts and Identities (such as enforcing MFA and conditional access), Devices, and Information and Data classification/permissions.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Microsoft patches and maintains underlying SaaS servers and software.' },
      { letter: 'C', reason: 'Microsoft manages physical datacenter infrastructure and SaaS network perimeters.' },
      { letter: 'D', reason: 'Microsoft 365 / SharePoint Online is SaaS, not IaaS.' },
    ],
    examTip:
      'Never forget the "Always Customer" trio: Information & Data + Devices/Endpoints + Accounts & Identities!',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Identity security (MFA, password hygiene) never transfers to Microsoft, even in SaaS.',
    },
  },
  {
    id: 'az900-mod1-q13',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A logistics company runs an aging custom-compiled C++ warehouse inventory daemon that requires a specific Windows Server 2016 registry key and direct installation of a third-party USB-over-IP kernel driver.',
    question: 'Which cloud service model is mandatory for lifting and shifting this legacy workload onto Azure without rewriting the application?',
    options: [
      { letter: 'A', text: 'Software as a Service (SaaS)' },
      { letter: 'B', text: 'Platform as a Service (PaaS)' },
      { letter: 'C', text: 'Infrastructure as a Service (IaaS)' },
      { letter: 'D', text: 'Serverless Functions (FaaS)' },
    ],
    correctAnswer: 'C',
    whyCorrect:
      'IaaS (Azure Virtual Machines) grants full OS administrative control, allowing legacy lift-and-shift workloads that depend on custom registry edits, legacy OS versions, or kernel drivers to run unmodified.',
    distractorBreakdown: [
      { letter: 'A', reason: 'SaaS provides pre-built vendor software and cannot host custom C++ warehouse daemons.' },
      { letter: 'B', reason: 'PaaS sandboxes disallow kernel drivers and low-level Windows OS registry modifications.' },
      { letter: 'D', reason: 'Serverless Functions run stateless event-driven snippets without OS kernel access.' },
    ],
    examTip:
      'Legacy lift-and-shift, OS registry access, or custom kernel drivers = IaaS (Azure Virtual Machines)!',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Choose IaaS whenever an app requires OS-level hooks, kernel drivers, or unmodified lift-and-shift.',
    },
  },
  {
    id: 'az900-mod1-q14',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Intermediate',
    scenario:
      'A consulting agency wants maximum hardware flexibility with minimal upfront commitment. One partner notes that "Azure runs multiple customers on the same physical server racks, so could Customer B read Customer A’s memory?"',
    question: 'How does a Public Cloud provider safely achieve multi-tenant economies of scale?',
    options: [
      { letter: 'A', text: 'By giving every customer physical keycard access to separate datacenter cages' },
      { letter: 'B', text: 'By sharing underlying physical hardware while enforcing strict hypervisor, identity, and virtual network logical isolation per tenant' },
      { letter: 'C', text: 'By forbidding virtual networks and placing all VMs on one flat public subnet' },
      { letter: 'D', text: 'By requiring every startup to buy dedicated single-tenant server clusters' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Public clouds maximize efficiency through multi-tenancy—pooling physical compute and storage hardware across many customers while isolating each tenant’s memory, storage, and traffic logically via hardened hypervisors, VNet boundaries, and Entra ID tenancy.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Physical customer access to datacenter cages does not exist in public cloud.' },
      { letter: 'C', reason: 'Azure isolates tenant traffic inside private Virtual Networks (VNets).' },
      { letter: 'D', reason: 'Forcing dedicated physical clusters for every workload removes public cloud elasticity and economies of scale.' },
    ],
    examTip:
      'Public Cloud = Shared physical infrastructure + logical tenant isolation + massive economies of scale.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Understand multi-tenancy: physical pooling lowers cost while logical hypervisor/VNet isolation secures tenants.',
    },
  },
  {
    id: 'az900-mod1-q15',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 1,
    moduleTitle: 'Fundamental Cloud Concepts',
    difficulty: 'Advanced',
    scenario:
      'A mid-sized hospital plans a phased cloud adoption: Phase 1 keeps clinical diagnostic imaging on-premises due to local MRI scanner latency, while bursting anonymized research compute batches to Azure. Phase 2 replaces their self-hosted Exchange email server with Microsoft Exchange Online. Phase 3 deploys a new patient appointment portal using Azure SQL Database and Azure App Service.',
    question: 'Which sequence accurately classifies Phases 1, 2, and 3?',
    options: [
      { letter: 'A', text: 'Phase 1: Hybrid Cloud; Phase 2: SaaS; Phase 3: PaaS' },
      { letter: 'B', text: 'Phase 1: Multi-Cloud; Phase 2: PaaS; Phase 3: IaaS' },
      { letter: 'C', text: 'Phase 1: Private Cloud; Phase 2: IaaS; Phase 3: SaaS' },
      { letter: 'D', text: 'Phase 1: Hybrid Cloud; Phase 2: IaaS; Phase 3: PaaS' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Phase 1 bridges on-premises infrastructure with public Azure compute (Hybrid Cloud). Phase 2 consumes turnkey Exchange Online email (SaaS). Phase 3 builds custom apps on managed Azure App Service and Azure SQL Database (PaaS).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Using on-prem + Azure is Hybrid (not Multi-Cloud), and Exchange Online is SaaS.' },
      { letter: 'C', reason: 'Bursting to Azure breaks pure Private Cloud, and App Service is PaaS rather than SaaS.' },
      { letter: 'D', reason: 'Exchange Online is turnkey SaaS, not raw IaaS VMs.' },
    ],
    examTip:
      'Break multi-phase scenarios word-by-word: On-prem + Azure = Hybrid; Turnkey productivity suite = SaaS; Managed Web/DB = PaaS.',
    errorDiagnostic: {
      trapType: 'Model Boundary (IaaS/PaaS/SaaS)',
      correctivePrescription: 'Map each workload separately against deployment models (Hybrid) and service tiers (SaaS/PaaS/IaaS).',
    },
  },

  // =========================================================================
  // MODULE 2 EXPANSION: Cloud Benefits (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod2-q6',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Intermediate',
    scenario:
      'A chief technology officer reviews Microsoft’s published Service Level Agreements (SLAs) and notices that Azure provides financially backed uptime percentages (such as 99.95% or 99.99%), alongside predictable latency and fixed cost calculators.',
    question: 'Which cloud computing benefit focuses specifically on confidence in consistent uptime metrics, cost transparency, and reliable performance baselines?',
    options: [
      { letter: 'A', text: 'Predictability' },
      { letter: 'B', text: 'Elasticity' },
      { letter: 'C', text: 'Vertical Scaling' },
      { letter: 'D', text: 'Serverless Execution' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Predictability in Azure comprises two halves: Performance Predictability (using autoscaling, load balancing, and SLAs to guarantee consistent response times) and Cost Predictability (forecasting spend accurately with Pricing/TCO Calculators and Budgets).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Elasticity specifically refers to automated capacity expansion and contraction in response to traffic.' },
      { letter: 'C', reason: 'Vertical scaling changes VM SKU size rather than representing financial and SLA forecasting.' },
      { letter: 'D', reason: 'Serverless execution is a compute model, not an overarching financial/SLA predictability pillar.' },
    ],
    examTip:
      'Remember the two pillars of Cloud Predictability: 1) Performance Predictability (SLAs, autoscaling) and 2) Cost Predictability (Calculators, Budgets)!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Associate SLAs + cost forecasting + consistent baselines with Cloud Predictability.',
    },
  },
  {
    id: 'az900-mod2-q7',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Advanced',
    scenario:
      'An application architecture connects an Azure App Service (99.95% SLA) sequentially to an Azure SQL Database (99.99% SLA). Both services must be operational simultaneously for customers to complete checkout.',
    question: 'How does combining independent services in series affect the overall composite SLA of the application?',
    options: [
      { letter: 'A', text: 'The composite SLA equals the higher SLA (99.99%)' },
      { letter: 'B', text: 'The composite SLA is the product of both individual SLAs (0.9995 × 0.9999 ≈ 99.94%), which is lower than either single service' },
      { letter: 'C', text: 'The composite SLA is the sum of both SLAs divided by 2 (99.97%)' },
      { letter: 'D', text: 'Microsoft automatically upgrades the composite SLA to 99.999% across all connected services' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'When two components depend on each other in series, the composite SLA is calculated by multiplying their individual probabilities (99.95% × 99.99% = 99.940005%). Adding serial dependencies reduces overall availability unless redundant fallback paths are added.',
    distractorBreakdown: [
      { letter: 'A', reason: 'A serial chain can fail if *either* service fails, making availability lower than the weakest link.' },
      { letter: 'C', reason: 'Composite SLAs multiply probabilities rather than averaging percentages.' },
      { letter: 'D', reason: 'Microsoft publishes SLAs per individual service, not an upgraded automatic composite SLA.' },
    ],
    examTip:
      'Composite SLA Math: Serial dependencies MULTIPLY (SLA_1 × SLA_2), lowering total uptime. Parallel/Redundant backups INCREASE total uptime!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Multiply decimal SLAs for dependent components in series to verify composite availability.',
    },
  },
  {
    id: 'az900-mod2-q8',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Fundamental',
    scenario:
      'A retail chain based in Nairobi is expanding to serve online shoppers in Tokyo, London, and São Paulo. Customers in Japan complain that loading pages from a single West US datacenter feels sluggish.',
    question: 'Which cloud benefit lets the retailer deploy cached copies and application endpoints close to users worldwide in minutes?',
    options: [
      { letter: 'A', text: 'Vertical Scaling' },
      { letter: 'B', text: 'Geo-distribution (Global Reach)' },
      { letter: 'C', text: 'CapEx Depreciation' },
      { letter: 'D', text: 'Local Redundancy' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Geo-distribution allows organizations to deploy applications and data to regional Azure datacenters around the globe, minimizing network latency and providing localized compliance and user responsiveness.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Vertical scaling upgrades CPU/RAM in the same region and does not reduce physical speed-of-light latency to Tokyo.' },
      { letter: 'C', reason: 'CapEx depreciation is an accounting practice for on-premises assets.' },
      { letter: 'D', reason: 'Local redundancy keeps 3 copies in one datacenter, not global user proximity.' },
    ],
    examTip:
      'Deploy apps across global Azure regions near end users to reduce latency = Geo-distribution!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Choose Geo-distribution whenever global latency reduction or multi-region user proximity is required.',
    },
  },
  {
    id: 'az900-mod2-q9',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Intermediate',
    scenario:
      'During a disaster recovery planning workshop, the operations lead defines two strict targets: the system can tolerate at most 15 minutes of lost transaction data if a database crashes, and full service must be restored in a backup region within 60 minutes.',
    question: 'Which pair of metrics corresponds to "15 minutes of acceptable data loss" and "60 minutes to restore service"?',
    options: [
      { letter: 'A', text: '15 minutes = RTO; 60 minutes = RPO' },
      { letter: 'B', text: '15 minutes = RPO (Recovery Point Objective); 60 minutes = RTO (Recovery Time Objective)' },
      { letter: 'C', text: '15 minutes = Elasticity; 60 minutes = Vertical Scaling' },
      { letter: 'D', text: '15 minutes = SLA; 60 minutes = CapEx Window' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Recovery Point Objective (RPO) defines the maximum tolerable amount of data loss measured in time (determined by backup/replication frequency). Recovery Time Objective (RTO) defines the maximum tolerable duration of downtime before service must be restored.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Reverses RPO (data loss point) and RTO (restoration time).' },
      { letter: 'C', reason: 'Elasticity and Vertical Scaling measure capacity adjustments, not disaster recovery thresholds.' },
      { letter: 'D', reason: 'SLA measures cumulative uptime percentage, not granular DR data loss vs recovery windows.' },
    ],
    examTip:
      'RPO = "Point" in time of last saved DATA (max data loss). RTO = "Time" to get back UP (max downtime)!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Remember P = Point of saved data (RPO); T = Time to restore service (RTO).',
    },
  },
  {
    id: 'az900-mod2-q10',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Intermediate',
    scenario:
      'An educational portal hosts its database on an Azure SQL instance. Because their current single-server tier maxes out at 4 vCores, the DBA clicks "Scale up" in the portal to upgrade the tier to 16 vCores during an annual exam registration week, experiencing a brief connection reset during cutover.',
    question: 'What is a fundamental limitation of vertical scaling compared to horizontal scaling?',
    options: [
      { letter: 'A', text: 'Vertical scaling has an upper hardware limit on a single machine and often introduces brief downtime during resizing' },
      { letter: 'B', text: 'Vertical scaling requires rewriting every application to become stateless across 50 regions' },
      { letter: 'C', text: 'Vertical scaling is prohibited in PaaS databases and only works on physical racks' },
      { letter: 'D', text: 'Vertical scaling automatically decreases monthly costs when upgrading CPU and RAM' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Vertical scaling (scaling up) increases the size of a single resource, which eventually hits the ceiling of the largest VM/SKU hardware available and typically requires restarting or failing over the instance during resizing. Horizontal scaling adds parallel nodes to bypass single-node limits with zero downtime.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Stateless multi-node design applies to horizontal scaling, not vertical scaling.' },
      { letter: 'C', reason: 'PaaS services like Azure SQL Database and App Service Plans support vertical tier upgrades.' },
      { letter: 'D', reason: 'Larger compute tiers cost more per hour, not less.' },
    ],
    examTip:
      'Vertical Scale = Simple, hits upper hardware ceiling, may reboot during resize. Horizontal Scale = Virtually limitless capacity via load-balanced parallel nodes.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Recognize single-node hardware ceilings and resize reboots as the classic tradeoffs of vertical scaling.',
    },
  },
  {
    id: 'az900-mod2-q11',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Intermediate',
    scenario:
      'A healthcare portal needs to guarantee that a backend web API remains available even if two virtual machine hosts crash unexpectedly, without engineers logging in at 3:00 AM to restart services.',
    question: 'Which cloud principle addresses automatic elimination of single points of failure to preserve continuous uptime?',
    options: [
      { letter: 'A', text: 'High Availability (and Fault Tolerance)' },
      { letter: 'B', text: 'Capital Expenditure Planning' },
      { letter: 'C', text: 'Manual Vertical Downsizing' },
      { letter: 'D', text: 'Archive Rehydration' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'High Availability (HA) ensures that an application stays operational and accessible during hardware crashes, software failures, or maintenance events by eliminating single points of failure through redundant load-balanced components.',
    distractorBreakdown: [
      { letter: 'B', reason: 'CapEx is a financial accounting model unrelated to runtime uptime.' },
      { letter: 'C', reason: 'Manual downsizing reduces VM size and does not prevent hardware outages.' },
      { letter: 'D', reason: 'Archive rehydration is restoring cold offline blobs over several hours.' },
    ],
    examTip:
      'Redundancy eliminating single points of failure for continuous uptime = High Availability / Reliability!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Link eliminating single points of failure + load-balanced redundancy to High Availability.',
    },
  },
  {
    id: 'az900-mod2-q12',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Advanced',
    scenario:
      'A company deploys a nightly batch script that always needs exactly 4 compute nodes, never scales dynamically, and runs predictably. Meanwhile, their public ticket-booking website faces unpredictable viral surges from 200 to 25,000 requests per second and scales nodes automatically up and down within seconds.',
    question: 'Which statement accurately contrasts Scalability and Elasticity across these two workloads?',
    options: [
      { letter: 'A', text: 'Scalability is the system’s architectural capacity to grow or shrink; Elasticity is the automatic real-time adjustment of resources matching unpredictable demand spikes and troughs' },
      { letter: 'B', text: 'Elasticity only applies to physical hard drives, whereas Scalability applies only to databases' },
      { letter: 'C', text: 'Scalability automatically reduces capacity to zero, whereas Elasticity requires manual IT tickets' },
      { letter: 'D', text: 'Both terms exclusively refer to replacing small VMs with larger VMs manually once a year' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Scalability is the ability to increase or decrease resources for a workload (manually or by schedule). Elasticity goes a step further: automatically and dynamically adding and removing resources in real time as demand unexpectedly rises and falls, minimizing waste.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Both concepts apply broadly across compute, storage, and networking.' },
      { letter: 'C', reason: 'Elasticity is automated, not manual.' },
      { letter: 'D', reason: 'Manual annual VM upgrades describe basic vertical scaling, not automated elasticity.' },
    ],
    examTip:
      'Scalability = Ability to adjust size/count. Elasticity = Automated real-time expansion AND contraction matching unpredictable load spikes!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Look for "automatic" + "fluctuating/unpredictable demand" + "scales both out and in" to choose Elasticity.',
    },
  },
  {
    id: 'az900-mod2-q13',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Fundamental',
    scenario:
      'A cloud governance committee emphasizes that migrating to Azure enables enforcing uniform configuration templates, automated compliance audits, and role-based access rules across every engineering squad from day one.',
    question: 'Which cloud benefit category describes centralized control, standards enforcement, and auditing?',
    options: [
      { letter: 'A', text: 'Security and Governance' },
      { letter: 'B', text: 'Horizontal Elasticity' },
      { letter: 'C', text: 'Cold Storage Rehydration' },
      { letter: 'D', text: 'Hardware Depreciation' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Security and Governance in Azure provides centralized policy enforcement, template standardization, role-based access control (RBAC), and regulatory compliance auditing across all workloads.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Horizontal elasticity adjusts compute instance counts for traffic.' },
      { letter: 'C', reason: 'Cold/Archive rehydration restores archived blob objects.' },
      { letter: 'D', reason: 'Hardware depreciation is an on-premises CapEx accounting practice.' },
    ],
    examTip:
      'Standardized templates + automated compliance audits + RBAC = Cloud Security & Governance!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Group compliance templates, auditing, and centralized control under the Governance cloud benefit.',
    },
  },
  {
    id: 'az900-mod2-q14',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Intermediate',
    scenario:
      'A development squad needs to spin up an exact replica of their production microservice environment for 4 hours of load testing, run 50 automated tests, and tear down the entire environment immediately afterward.',
    question: 'Which pair of cloud benefits most directly enables rapid spin-up, fast experimentation, and instant teardown without hardware procurement delays?',
    options: [
      { letter: 'A', text: 'Agility and Consumption-Based Provisioning' },
      { letter: 'B', text: 'CapEx Amortization and Colocation' },
      { letter: 'C', text: 'Sovereign Isolation and Offline Rehydration' },
      { letter: 'D', text: 'Vertical Bottlenecking and Fixed Leases' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Cloud Agility gives teams the speed to deploy and deprovision complete test/production environments in minutes, while Consumption-Based Provisioning ensures they pay only for those 4 hours rather than buying permanent test hardware.',
    distractorBreakdown: [
      { letter: 'B', reason: 'CapEx and colocation involve slow upfront purchases and fixed leases.' },
      { letter: 'C', reason: 'Sovereign isolation and archive rehydration relate to government compliance and cold blob retrieval.' },
      { letter: 'D', reason: 'Fixed leases defeat rapid temporary spin-up economics.' },
    ],
    examTip:
      'Rapid spin-up/teardown for dev/test experimentation = Agility + Consumption Economics!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Tie temporary fast-provisioned environments to Agility and consumption billing.',
    },
  },
  {
    id: 'az900-mod2-q15',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 2,
    moduleTitle: 'Cloud Benefits',
    difficulty: 'Advanced',
    scenario:
      'A media streaming startup wants its API tier to withstand an entire datacenter power failure seamlessly AND automatically scale from 3 containers to 40 containers during evening prime-time broadcasts, while keeping deployment cycles under 5 minutes.',
    question: 'Which three cloud benefits are respectively highlighted in this design?',
    options: [
      { letter: 'A', text: 'High Availability (Reliability), Elasticity, and Agility' },
      { letter: 'B', text: 'Disaster Recovery only, Vertical Scaling, and CapEx' },
      { letter: 'C', text: 'Archive Rehydration, Manual Provisioning, and Fixed Licensing' },
      { letter: 'D', text: 'Private Cloud Isolation, Data Egress, and Resource Locking' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Surviving datacenter failure seamlessly = High Availability (Reliability); automatically scaling from 3 to 40 instances with prime-time load = Elasticity; keeping deployment cycles under 5 minutes = Agility.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Vertical scaling upgrades one machine rather than 3-to-40 container scale-out, and CapEx is upfront hardware buying.' },
      { letter: 'C', reason: 'Archive rehydration, manual provisioning, and fixed licensing contradict automated cloud agility.' },
      { letter: 'D', reason: 'Resource locks and egress billing do not describe resilience, autoscaling, or deployment speed.' },
    ],
    examTip:
      'Map keywords fast on exam day: "Survive outage seamlessly" = HA/Reliability; "Auto-adjust instances with load" = Elasticity; "Deploy in minutes" = Agility.',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Practice decomposing multi-clause scenarios cleanly into Reliability, Elasticity, and Agility.',
    },
  },

  // =========================================================================
  // MODULE 3 EXPANSION: Cloud Pricing & Consumption Models (q5..q15)
  // =========================================================================
  {
    id: 'az900-mod3-q5',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A cloud engineer finishes testing an Azure Virtual Machine and clicks "Shut down" inside the Windows Start menu of the guest OS. In the Azure Portal, the VM status now reads "Stopped" rather than "Stopped (deallocated)".',
    question: 'What happens to Azure compute and storage charges while the VM remains in the "Stopped" (not deallocated) state?',
    options: [
      { letter: 'A', text: 'All compute and disk charges stop immediately to $0.00' },
      { letter: 'B', text: 'Compute VM hourly charges CONTINUE because physical host capacity stays reserved, and managed disk storage continues billing' },
      { letter: 'C', text: 'Compute charges stop, and only outbound network bandwidth is billed' },
      { letter: 'D', text: 'Azure automatically deletes the VM after 15 minutes' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Shutting down from inside the guest OS puts an Azure VM into the "Stopped" state where hardware allocation is still reserved for you—meaning VM compute charges CONTINUE. You must stop the VM via the Azure Portal/CLI/PowerShell so its status becomes "Stopped (deallocated)" to stop compute billing (though attached OS/data disks still incur storage charges).',
    distractorBreakdown: [
      { letter: 'A', reason: 'Compute charges only halt when the VM is Stopped (Deallocated), and attached disk storage still bills.' },
      { letter: 'C', reason: 'Compute charges continue until deallocated.' },
      { letter: 'D', reason: 'Azure never auto-deletes user VMs just because the guest OS shut down.' },
    ],
    examTip:
      'Classic AZ-900 Trap: Guest OS Shutdown = "Stopped" (STILL PAYING for compute!). Azure Portal/CLI Stop = "Stopped (Deallocated)" ($0 compute, pay only for disks)!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Always remember the difference between "Stopped" (allocated, still billed) and "Stopped (Deallocated)" (compute released).',
    },
  },
  {
    id: 'az900-mod3-q6',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Fundamental',
    scenario:
      'A startup executive wants to explain to investors why using Microsoft Azure allows the company to preserve cash reserves for hiring engineers instead of tying up capital in server hardware.',
    question: 'Which core economic advantage of Operational Expenditure (OpEx) does this describe?',
    options: [
      { letter: 'A', text: 'Zero upfront hardware investment and tax-deductible monthly expenses paid only as resources are consumed' },
      { letter: 'B', text: 'Multi-year depreciation of company-owned physical servers on the balance sheet' },
      { letter: 'C', text: 'Mandatory 5-year fixed datacenter real estate leases' },
      { letter: 'D', text: 'Paying maximum peak capacity rates 24/7 regardless of user traffic' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'OpEx eliminates large upfront CapEx hardware outlays, converting IT costs into predictable monthly operational expenditures that align directly with current business usage and immediate accounting deductibility.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Multi-year depreciation of owned servers is Capital Expenditure (CapEx).' },
      { letter: 'C', reason: 'Long-term physical datacenter leases represent fixed capital/overhead commitments.' },
      { letter: 'D', reason: 'Cloud OpEx scales cost up and down with actual consumption.' },
    ],
    examTip:
      'OpEx Advantages: No upfront infrastructure spend, fast scaling to match revenue, billed only for what is consumed.',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Link zero upfront hardware spend + usage-based monthly billing directly to OpEx.',
    },
  },
  {
    id: 'az900-mod3-q7',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'An enterprise IT team estimates peak Black Friday website demand at 50 servers, though average year-round demand is only 6 servers. Under an on-premises CapEx model, they would have to purchase all 50 physical servers upfront.',
    question: 'Why does a cloud consumption-based model yield dramatically lower total cost for spiky workloads?',
    options: [
      { letter: 'A', text: 'Because Azure charges a flat annual license regardless of server count' },
      { letter: 'B', text: 'Because the company pays for 6 servers during normal months and temporarily consumes 50 servers only during Black Friday peaks' },
      { letter: 'C', text: 'Because CapEx servers are free after their first year of electricity use' },
      { letter: 'D', text: 'Because Azure forbids running more than 6 servers outside November' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'With consumption-based pricing, you avoid over-provisioning idle hardware for rare peak traffic. You pay for baseline capacity (6 servers) year-round and elastically consume extra capacity (50 servers) only for the brief holiday surge.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Cloud consumption meters actual hourly/secondly usage rather than charging a flat cap.' },
      { letter: 'C', reason: 'On-premises servers incur continuous power, cooling, maintenance, and replacement costs.' },
      { letter: 'D', reason: 'Azure places no seasonal restriction on scaling compute resources.' },
    ],
    examTip:
      'Avoid paying for idle peak-capacity hardware 360 days a year = Consumption-Based OpEx Advantage!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Compare on-premises peak provisioning waste against cloud pay-for-actual-consumption elasticity.',
    },
  },
  {
    id: 'az900-mod3-q8',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A company needs to compare three compute pricing behaviors before launching a new microservice: 1) Unpredictable burst traffic running under 1 minute per request, 2) Predictable steady-state enterprise ERP VMs running 24/7 for 3 years, and 3) Fault-tolerant scientific batch jobs that can handle abrupt interruptions.',
    question: 'Which Azure pricing options best match workloads 1, 2, and 3 in order?',
    options: [
      { letter: 'A', text: '1) Serverless Consumption Plan, 2) 3-Year Reserved Instances, 3) Azure Spot Virtual Machines' },
      { letter: 'B', text: '1) 3-Year Reserved Instances, 2) Azure Spot VMs, 3) Pay-As-You-Go Dedicated Hosts' },
      { letter: 'C', text: '1) Azure Hybrid Benefit, 2) Consumption Plan, 3) CapEx On-Premises' },
      { letter: 'D', text: '1) Spot VMs, 2) Serverless Consumption Plan, 3) TCO Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Short event-driven workloads map to Serverless Consumption Plans; steady 24/7 predictable workloads save up to 72% with 3-Year Reserved Instances; and interruptible batch workloads capture up to 90% savings via unused Azure Spot VM capacity.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Spot VMs can be evicted with 30 seconds notice, making them unsuitable for core 24/7 ERP systems.' },
      { letter: 'C', reason: 'Hybrid Benefit is a Windows/SQL license benefit, not an event-driven billing tier.' },
      { letter: 'D', reason: 'TCO Calculator is an estimation webpage, not a runtime compute pricing option.' },
    ],
    examTip:
      'Match Workload to Pricing: Short/sporadic = Serverless Consumption; 24/7 steady = Reservations/Savings Plans; Interruptible batch = Spot VMs!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Pair workload predictability and interruption tolerance cleanly with Consumption, Reservations, and Spot VMs.',
    },
  },
  {
    id: 'az900-mod3-q9',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Fundamental',
    scenario:
      'A startup runs a Pay-As-You-Go Azure subscription without any long-term contracts. When business slows down in February, they delete several temporary test databases and scale down non-production VMs.',
    question: 'What happens to their next monthly Azure bill after deleting those unused resources?',
    options: [
      { letter: 'A', text: 'They must pay early termination penalties for each deleted test database' },
      { letter: 'B', text: 'Charges stop immediately upon resource deletion because Pay-As-You-Go bills strictly for provisioned usage with zero termination fees' },
      { letter: 'C', text: 'They must keep paying for the remainder of a 12-month minimum lease' },
      { letter: 'D', text: 'Their subscription is automatically upgraded to an Enterprise Agreement' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Under Azure’s Pay-As-You-Go consumption model, there are no upfront commitments and no termination penalties—as soon as you deallocate or delete resources, billing stops.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Pay-As-You-Go carries zero cancellation or deletion penalties.' },
      { letter: 'C', reason: '12-month minimums apply only if you purchase a 1-year Reservation, not Pay-As-You-Go.' },
      { letter: 'D', reason: 'Deleting resources lowers spend and does not alter your contract type.' },
    ],
    examTip:
      'Pay-As-You-Go = Zero upfront commitment, zero termination fees, stop paying the moment resources are deleted!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Distinguish flexible Pay-As-You-Go billing from committed 1-year/3-year Reservations.',
    },
  },
  {
    id: 'az900-mod3-q10',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A developer creates an Azure Free Account to experiment with cloud architecture. After the initial 30-day credit expires, the developer notices that several "Always Free" services remain accessible within monthly quotas while paid VM tiers require upgrading.',
    question: 'Which statement accurately describes the structure of an Azure Free Account?',
    options: [
      { letter: 'A', text: 'All Azure Virtual Machines remain 100% unlimited and free forever' },
      { letter: 'B', text: 'It includes a 30-day $200 credit, 12 months of popular free services up to monthly limits, and a catalog of Always Free services within capped quotas' },
      { letter: 'C', text: 'It only provides read-only access to the Azure Pricing Calculator without deploying real resources' },
      { letter: 'D', text: 'It automatically converts all charges into CapEx hardware invoices' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'An Azure Free Account offers $200 USD in credits for the first 30 days, 12 months of popular services (e.g., B1s VMs, Managed Disks, Blob Storage up to specified monthly limits), and over 55 services that are Always Free within defined monthly usage caps.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Enterprise VMs are not unlimited/free forever; only select sizes have 12-month free hours.' },
      { letter: 'C', reason: 'Azure Free Account creates a real Azure subscription capable of deploying live cloud resources.' },
      { letter: 'D', reason: 'Azure billing is always OpEx.' },
    ],
    examTip:
      'Azure Free Account = $200 credit (first 30 days) + 12 months of select free services + Always Free services up to monthly limits.',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Know the 3 tiers of the Azure Free Account: 30-day credit, 12-month free services, and Always Free limits.',
    },
  },
  {
    id: 'az900-mod3-q11',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Advanced',
    scenario:
      'A company deploys an Azure Virtual Network containing 20 Virtual Machines. Half of the VMs are in East US communicating with each other inside the same VNet, while the other half serve public API responses out to internet browsers in Europe.',
    question: 'Which traffic pattern incurs standard Azure outbound data transfer (egress) charges?',
    options: [
      { letter: 'A', text: 'Inbound data uploaded from on-premises browsers to the Azure VNet' },
      { letter: 'B', text: 'Outbound API responses sent from Azure VMs out over the public internet' },
      { letter: 'C', text: 'Deleting a Resource Group containing storage accounts' },
      { letter: 'D', text: 'Creating Resource Tags in the Azure Portal' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure does not charge for inbound data transfers (ingress) into Azure datacenters. However, outbound data transfers (egress) leaving Azure datacenters across the internet—or crossing regional boundaries—incur metered bandwidth charges.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Inbound data entering Azure (ingress) is free.' },
      { letter: 'C', reason: 'Resource Groups and deletions do not trigger bandwidth fees.' },
      { letter: 'D', reason: 'Resource Tags are free metadata.' },
    ],
    examTip:
      'Data IN (Ingress) = Free! Data OUT (Egress to internet or cross-region) = Billed!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Verify directionality on bandwidth questions: Ingress is free, Egress is metered.',
    },
  },
  {
    id: 'az900-mod3-q12',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A non-profit organization wants to understand why two identical Azure Virtual Machines configured with the exact same vCPUs and RAM produce slightly different monthly invoices when one is deployed in East US and the other in Brazil South.',
    question: 'Which Azure pricing factor explains this monthly cost difference?',
    options: [
      { letter: 'A', text: 'Azure Region location differentials (local energy, taxes, and datacenter infrastructure costs vary by geography)' },
      { letter: 'B', text: 'Resource Group naming conventions' },
      { letter: 'C', text: 'The number of Availability Zones selected inside Resource Tags' },
      { letter: 'D', text: 'Inbound ingress bandwidth fees inside East US' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure service rates vary across geographic regions because local electricity, cooling, real estate, taxes, and network fiber infrastructure costs differ worldwide.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Resource Group names have zero impact on billing.' },
      { letter: 'C', reason: 'Resource Tags are free organizational metadata.' },
      { letter: 'D', reason: 'Inbound ingress is free in every Azure region.' },
    ],
    examTip:
      'Three major factors affecting Azure resource cost: 1) Resource Type/Tier, 2) Consumption/Usage Volume, and 3) Azure Region Location!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Remember that identical VM SKUs carry different hourly prices across different Azure regions.',
    },
  },
  {
    id: 'az900-mod3-q13',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A CTO is explaining the shift from Fixed On-Premises IT spending to Variable Cloud OpEx spending to the board of directors. One board member asks what happens if the company wants to test a risky new AI product for 30 days and shut it down if customers do not adopt it.',
    question: 'How does the OpEx consumption model reduce business experimentation risk compared to CapEx?',
    options: [
      { letter: 'A', text: 'Because unused cloud compute can be cancelled instantly after 30 days without owning stranded depreciating server hardware' },
      { letter: 'B', text: 'Because CapEx hardware automatically refunds 100% of its cash purchase price after 30 days' },
      { letter: 'C', text: 'Because OpEx forces a mandatory 3-year software support contract before deploying' },
      { letter: 'D', text: 'Because Azure absorbs any application development salary costs' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'With OpEx consumption pricing, failed or sunsetted experiments incur zero stranded hardware assets—you simply delete the cloud resources after 30 days and stop paying.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Purchased on-premises servers depreciate rapidly and cannot be returned for full cash value.' },
      { letter: 'C', reason: 'Standard Pay-As-You-Go OpEx has no 3-year lock-in.' },
      { letter: 'D', reason: 'Cloud providers bill infrastructure/platform usage, not employee salaries.' },
    ],
    examTip:
      'Low financial risk for experimentation ("fail fast, pay only for active test days") = OpEx Consumption Model!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Contrast stranded CapEx sunk cost with risk-free OpEx teardown.',
    },
  },
  {
    id: 'az900-mod3-q14',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Advanced',
    scenario:
      'An accounting team is auditing four IT expenditures from last quarter: 1) $95,000 paid upfront for 10 physical Dell rack servers, 2) $4,200 monthly Pay-As-You-Go Azure App Service invoice, 3) $18,000 paid upfront for redundant on-premises datacenter generators, and 4) $640 billed for 1.8 million serverless Azure Function executions.',
    question: 'Which expenditures are categorized as Operational Expenditure (OpEx)?',
    options: [
      { letter: 'A', text: 'Expenditures 1 and 3 only' },
      { letter: 'B', text: 'Expenditures 2 and 4 only' },
      { letter: 'C', text: 'Expenditures 1, 2, and 3' },
      { letter: 'D', text: 'All four expenditures' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Monthly cloud service bills (#2 App Service) and consumption-based serverless execution charges (#4 Azure Functions) are ongoing Operational Expenditures (OpEx). Purchasing physical servers (#1) and physical generators (#3) upfront are Capital Expenditures (CapEx).',
    distractorBreakdown: [
      { letter: 'A', reason: 'Expenditures 1 and 3 are physical hardware investments (CapEx).' },
      { letter: 'C', reason: 'Mixes physical hardware purchases with monthly cloud usage.' },
      { letter: 'D', reason: 'Physical server and generator purchases are CapEx, not OpEx.' },
    ],
    examTip:
      'Classify fast: Physical servers, racks, generators, buildings = CapEx. Cloud monthly usage, serverless executions, SaaS seats = OpEx!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Filter physical upfront infrastructure (CapEx) away from ongoing metered cloud usage (OpEx).',
    },
  },
  {
    id: 'az900-mod3-q15',
    learningPathId: 1,
    learningPathTitle: 'Describe Cloud Concepts',
    moduleId: 3,
    moduleTitle: 'Cloud Pricing & Consumption Models',
    difficulty: 'Intermediate',
    scenario:
      'A retail enterprise deploys a new Azure Logic Apps workflow that monitors a shared inbox and posts order summaries to Microsoft Teams. When zero emails arrive overnight, zero workflow triggers fire.',
    question: 'Under the Consumption plan for Azure Logic Apps, what billing model applies during those idle overnight hours?',
    options: [
      { letter: 'A', text: 'Fixed 24-hour dedicated VM reservation rate' },
      { letter: 'B', text: 'Metered strictly per executed trigger and action, meaning $0 in workflow execution fees during idle zero-trigger hours' },
      { letter: 'C', text: 'Flat 3-year hardware depreciation charge' },
      { letter: 'D', text: 'Billed solely by the number of Resource Groups in the tenant' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Serverless workflow services like Azure Logic Apps (Consumption plan) and Azure Functions (Consumption plan) bill purely per action/trigger execution—incurring $0 execution fees when no events fire.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Consumption serverless plans do not charge dedicated 24-hour VM rental rates.' },
      { letter: 'C', reason: 'Hardware depreciation is on-premises CapEx.' },
      { letter: 'D', reason: 'Resource Groups are always free logical containers.' },
    ],
    examTip:
      'Serverless compute & workflows (Azure Functions / Logic Apps Consumption) = Pay only per action/execution; zero idle compute fee!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Identify serverless Consumption plans by per-action/per-execution metering and $0 idle compute cost.',
    },
  },
];
