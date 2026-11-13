import { Question } from '../types/quiz';

export const PATH3_EXPANSION_QUESTIONS: Question[] = [
  // =========================================================================
  // MODULE 8 EXPANSION: Azure Cost Management (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod8-q6',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'An engineering director wants to commit to spending $50/hour on Azure compute for 3 years in exchange for deep discounts, WITHOUT locking into a single VM series or a fixed Azure region because workloads frequently shift between East US and West Europe.',
    question: 'Which Azure cost-commitment model provides flexible discounts across varying VM families and regions?',
    options: [
      { letter: 'A', text: 'Azure Savings Plan for Compute' },
      { letter: 'B', text: 'Azure Free Account Credits' },
      { letter: 'C', text: 'ReadOnly Resource Locks' },
      { letter: 'D', text: 'Azure Pricing Calculator Export' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Savings Plans for Compute offer up to 65% savings on pay-as-you-go rates in exchange for a 1-year or 3-year hourly spend commitment, automatically applying dynamically across compute services (VMs, App Service, Container Instances, Functions Premium, Dedicated Host) regardless of region or VM series.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Free Account credits expire after 30 days ($200 cap).' },
      { letter: 'C', reason: 'Resource Locks prevent deletion/modification, not compute discounts.' },
      { letter: 'D', reason: 'Pricing Calculator only estimates monthly bills prior to deployment.' },
    ],
    examTip:
      'Reserved Instances (up to 72% off) = highest savings for fixed VM family/region. Azure Savings Plan for Compute (up to 65% off) = flexible across VM series & regions!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Compare rigid high-discount Reserved Instances against flexible cross-region Azure Savings Plans.',
    },
  },
  {
    id: 'az900-mod8-q7',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A solution architect needs to present a quick, itemized monthly bill estimate for deploying 4 D4s_v5 Virtual Machines, 2 TB of Zone-Redundant Blob Storage, and an Azure SQL Database in West Europe—all brand-new cloud workloads with no existing on-premises servers.',
    question: 'Which web-based Azure tool generates an itemized monthly Azure cost forecast for newly planned cloud resources?',
    options: [
      { letter: 'A', text: 'Total Cost of Ownership (TCO) Calculator' },
      { letter: 'B', text: 'Azure Pricing Calculator' },
      { letter: 'C', text: 'Azure Service Health' },
      { letter: 'D', text: 'Microsoft Purview' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'The Azure Pricing Calculator configures and estimates the hourly/monthly cost of specific Azure products (VMs, storage tiers, regions, support plans) before provisioning.',
    distractorBreakdown: [
      { letter: 'A', reason: 'TCO Calculator compares migrating EXISTING on-premises datacenters (power, servers, IT labor) vs Azure.' },
      { letter: 'C', reason: 'Service Health tracks Azure regional outages and maintenance.' },
      { letter: 'D', reason: 'Purview manages data classification and compliance governance.' },
    ],
    examTip:
      'Estimate monthly price of Azure services = Azure Pricing Calculator! Compare existing on-prem datacenter costs vs Azure = TCO Calculator!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Select Pricing Calculator for direct Azure product cost modeling; TCO Calculator for on-prem vs Azure ROI.',
    },
  },
  {
    id: 'az900-mod8-q8',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A cloud administrator applies the tag "CostCenter: HR-101" to a Resource Group named "RG-HR-Payroll", assuming all 12 Virtual Machines and Storage Accounts inside that Resource Group will automatically appear under "HR-101" on the monthly Cost Management invoice.',
    question: 'Why do child resources inside RG-HR-Payroll fail to show the "CostCenter: HR-101" tag by default?',
    options: [
      { letter: 'A', text: 'Because Resource Tags applied to a Resource Group or Subscription are NOT automatically inherited by child resources unless enforced via an Azure Policy (such as Inherit/Modify tag)' },
      { letter: 'B', text: 'Because Resource Tags only work on Azure Free Accounts' },
      { letter: 'C', text: 'Because Azure allows at most 1 tag per Subscription' },
      { letter: 'D', text: 'Because Virtual Machines cannot hold Resource Tags' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Unlike RBAC roles and Azure Policies, Resource Tags do NOT automatically inherit from parent Subscriptions or Resource Groups down to child resources. You must assign tags directly to each resource or configure an Azure Policy ("Inherit a tag from the resource group") to automate propagation.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Tags work across all standard Azure subscriptions.' },
      { letter: 'C', reason: 'Azure allows up to 50 tag name/value pairs per resource/group.' },
      { letter: 'D', reason: 'VMs support up to 50 Resource Tags.' },
    ],
    examTip:
      'Huge AZ-900 Exam Fact: RBAC & Policies inherit downward automatically; Resource Tags DO NOT inherit automatically without Azure Policy!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Remember the inheritance exception: Resource Tags do not cascade from Resource Groups without Azure Policy.',
    },
  },
  {
    id: 'az900-mod8-q9',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A genomics research lab runs stateless Monte Carlo simulations that checkpoint progress every 60 seconds and can tolerate sudden compute interruptions in exchange for up to 90% compute discounts compared to Pay-As-You-Go pricing.',
    question: 'Which Azure compute purchasing option provides unused Azure capacity at steep discounts while allowing eviction with 30 seconds notice?',
    options: [
      { letter: 'A', text: 'Azure Spot Virtual Machines' },
      { letter: 'B', text: '3-Year Reserved VM Instances' },
      { letter: 'C', text: 'Azure Dedicated Hosts' },
      { letter: 'D', text: 'CanNotDelete Locked VMs' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Spot Virtual Machines let you take advantage of unused Azure compute capacity at deep discounts (up to 90% off Pay-As-You-Go), with the tradeoff that Azure can evict the VM on 30 seconds notice when standard capacity is needed elsewhere.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Reserved Instances guarantee continuous 24/7 capacity without eviction.' },
      { letter: 'C', reason: 'Dedicated Hosts reserve entire physical servers for one tenant at premium rates.' },
      { letter: 'D', reason: 'Resource Locks prevent user deletion, not Spot capacity eviction.' },
    ],
    examTip:
      'Interruptible / fault-tolerant batch workloads + up to 90% off + 30-second eviction warning = Azure Spot VMs!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Only choose Spot VMs when workloads gracefully tolerate sudden eviction.',
    },
  },
  {
    id: 'az900-mod8-q10',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Fundamental',
    scenario:
      'A finance team wants a live Azure Portal workspace where they can slice actual incurred monthly spend by service, location, and Resource Tag, visualize daily burn-rate forecasts, and download historical CSV invoices.',
    question: 'Which native Azure service provides cost analysis dashboards, invoice downloads, and spend anomaly alerts?',
    options: [
      { letter: 'A', text: 'Microsoft Cost Management (Azure Cost Management + Billing)' },
      { letter: 'B', text: 'Azure TCO Calculator' },
      { letter: 'C', text: 'Azure Key Vault' },
      { letter: 'D', text: 'Azure ExpressRoute' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Cost Management + Billing delivers continuous Cost Analysis charts, Budgets, Action Group spend alerts, and invoice management across active Azure subscriptions.',
    distractorBreakdown: [
      { letter: 'B', reason: 'TCO Calculator is a pre-migration estimation webpage with no live billing data.' },
      { letter: 'C', reason: 'Key Vault protects secrets and keys.' },
      { letter: 'D', reason: 'ExpressRoute provides dedicated private WAN connections.' },
    ],
    examTip:
      'Analyze LIVE actual cloud spending, set monthly Budgets, and trigger spend alerts = Microsoft Cost Management + Billing!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Separate pre-deployment calculators (Pricing/TCO) from live spend governance (Cost Management + Billing).',
    },
  },
  {
    id: 'az900-mod8-q11',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'An operations manager configures a monthly Budget in Microsoft Cost Management set to $5,000 for a Dev/Test subscription. At 85% actual spend, an email alert is sent; at 100% forecasted spend, an automated webhook triggers an Azure Automation Runbook to shut down non-production VMs.',
    question: 'What happens automatically when an Azure Cost Management Budget threshold is reached without configuring an Action Group?',
    options: [
      { letter: 'A', text: 'Azure instantly deletes every Resource Group in the subscription' },
      { letter: 'B', text: 'Budgets trigger notifications/alerts ONLY—they do NOT automatically stop or block spending unless paired with an Action Group executing automation' },
      { letter: 'C', text: 'Microsoft cancels the organization’s Entra ID tenant' },
      { letter: 'D', text: 'All VMs automatically convert into Spot VMs' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'Azure Cost Management Budgets do NOT impose hard spending caps that shut off resources by default; instead, budgets trigger alerts (email + optional Action Groups that invoke Azure Functions, Logic Apps, or Runbooks to remediate spend).',
    distractorBreakdown: [
      { letter: 'A', reason: 'Microsoft never deletes production resources automatically just for crossing a soft budget threshold.' },
      { letter: 'C', reason: 'Entra ID tenants remain active.' },
      { letter: 'D', reason: 'VM purchasing tiers never mutate silently upon budget crossing.' },
    ],
    examTip:
      'Exam Rule: Budgets create ALERTS & trigger Action Groups—they are NOT a hard shutdown kill switch by default!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Remember Cost Management Budgets alert you (and can fire Action Groups), rather than capping or deleting workloads silently.',
    },
  },
  {
    id: 'az900-mod8-q12',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A company discovers that it is paying for 25 oversized D16s_v5 Virtual Machines that stay below 5% CPU and memory utilization every day. The CTO asks which free built-in Azure service automatically flags underutilized VMs and estimates annual savings from shutting them down or right-sizing them.',
    question: 'Which Azure tool generates automated Cost pillar optimization recommendations for active resources?',
    options: [
      { letter: 'A', text: 'Azure Advisor' },
      { letter: 'B', text: 'Azure Pricing Calculator' },
      { letter: 'C', text: 'Azure Resource Health' },
      { letter: 'D', text: 'Azure Bastion' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Advisor’s Cost pillar analyzes live telemetry over 7–14 days to detect idle or underutilized VMs, unattached ExpressRoute circuits, and Reserved Instance buying opportunities, displaying exact estimated dollar savings.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Pricing Calculator models theoretical future builds, not live underutilized VMs.' },
      { letter: 'C', reason: 'Resource Health inspects availability outages of an individual resource.' },
      { letter: 'D', reason: 'Bastion provides RDP/SSH portal access.' },
    ],
    examTip:
      'Detect idle/underutilized active VMs and recommend right-sizing savings = Azure Advisor (Cost pillar)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Look to Azure Advisor whenever live telemetry optimization across Cost/Performance/Security/Reliability is requested.',
    },
  },
  {
    id: 'az900-mod8-q13',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A software team configures an Azure Pricing Calculator estimate and notices a "Support Plan" dropdown at the bottom showing Basic, Developer, Standard, and Professional Direct.',
    question: 'Which Azure support plan is included automatically at $0/month for every Azure account and covers billing/subscription inquiries plus 24/7 online documentation/forums, but excludes 1:1 technical break-fix tickets?',
    options: [
      { letter: 'A', text: 'Basic Support Plan' },
      { letter: 'B', text: 'Developer Support Plan' },
      { letter: 'C', text: 'Standard Support Plan' },
      { letter: 'D', text: 'Premier / Unified Support Plan' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'The Basic Support Plan is free and included for all Azure customers, offering 24/7 access to billing and subscription management support, Azure Service Health, and Azure Advisor, while Developer ($29/mo+) adds business-hours technical break-fix support for non-production workloads.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Developer Support is paid ($29/mo) for trial and non-production technical support.' },
      { letter: 'C', reason: 'Standard Support ($100/mo) provides 24/7 technical phone/email break-fix for production environments.' },
      { letter: 'D', reason: 'Premier/Unified Support is enterprise-wide paid support with designated technical account managers.' },
    ],
    examTip:
      'Support Plan Ladder: Basic ($0, billing/subscription only) ➔ Developer (non-prod, business hours) ➔ Standard (prod 24/7) ➔ Pro Direct (fast 1-hr critical response)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Remember Basic support is free for billing/account tickets but includes zero technical troubleshooting.',
    },
  },
  {
    id: 'az900-mod8-q14',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Advanced',
    scenario:
      'A large hospital network is negotiating an Azure migration plan. The CFO wants to combine two savings mechanisms simultaneously on 30 production Windows Server 2022 Virtual Machines running 24/7: 1) Eliminate the Windows OS license surcharge inside the VM hourly rate by applying existing Software Assurance licenses, and 2) Commit to a 3-year VM compute term.',
    question: 'Which combination of Azure cost programs stacks together to yield up to 80% total compute savings?',
    options: [
      { letter: 'A', text: 'Azure Hybrid Benefit + 3-Year Reserved VM Instances' },
      { letter: 'B', text: 'Azure Free Account + Spot Virtual Machines' },
      { letter: 'C', text: 'TCO Calculator + Resource Locks' },
      { letter: 'D', text: 'ReadOnly Locks + Archive Blob Storage' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Hybrid Benefit (AHB) removes the Windows Server or SQL Server OS licensing fee using existing Software Assurance licenses, and stacking it with 3-Year Reserved VM Instances discounts the base Linux/compute infrastructure—combining for up to ~80% total savings.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Free accounts and evictable Spot VMs cannot run mission-critical 24/7 hospital production VMs.' },
      { letter: 'C', reason: 'TCO Calculator and Resource Locks do not grant runtime billing discounts.' },
      { letter: 'D', reason: 'Locks and Archive Storage are unrelated to VM licensing discounts.' },
    ],
    examTip:
      'Highest Legal Stack for 24/7 Windows/SQL VMs: Azure Hybrid Benefit (reuse licenses) + 3-Year Reserved Instances (compute commitment)!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Stack Azure Hybrid Benefit + 3-Year Reservations when migrating licensed 24/7 Windows/SQL servers.',
    },
  },
  {
    id: 'az900-mod8-q15',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 8,
    moduleTitle: 'Azure Cost Management',
    difficulty: 'Intermediate',
    scenario:
      'A company operates a web app backed by Azure Blob Storage in East US. Every day, 100 GB of logs are uploaded from external IoT gateways into Azure, and 500 GB of video assets are downloaded by internet users—plus 200 GB is replicated across a Region Pair via GRS.',
    question: 'Which component of this data workflow is completely FREE of bandwidth charges?',
    options: [
      { letter: 'A', text: 'The 100 GB daily inbound data upload (ingress) into Azure East US' },
      { letter: 'B', text: 'The 500 GB daily outbound downloads (egress) to public internet browsers' },
      { letter: 'C', text: 'Cross-region Geo-Redundant replication traffic' },
      { letter: 'D', text: 'All Azure Storage storage capacity gigabytes' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'All inbound data transfer (ingress) entering Azure datacenters is free, whereas public internet outbound egress and cross-region GRS replication bandwidth incur small per-GB transfer charges.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Outbound egress to internet users is metered and billed.' },
      { letter: 'C', reason: 'GRS geo-replication carries cross-region bandwidth charges.' },
      { letter: 'D', reason: 'Storage capacity per GB is always billed monthly.' },
    ],
    examTip:
      'Ingress (into Azure) = $0. Egress (out to internet or cross-region) = Billed per GB!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Always isolate inbound ingress traffic as the zero-cost leg in data transfer scenarios.',
    },
  },

  // =========================================================================
  // MODULE 9 EXPANSION: Azure Governance & Compliance Tools (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod9-q6',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'An administrator needs to evaluate whether 300 existing Azure Virtual Machines already deployed across a subscription have disk encryption enabled, WITHOUT blocking current deployments or breaking running legacy apps while compliance reports are collected.',
    question: 'Which Azure Policy effect simply flags non-compliant resources in compliance dashboards without preventing creation or updates?',
    options: [
      { letter: 'A', text: 'Deny' },
      { letter: 'B', text: 'Audit' },
      { letter: 'C', text: 'CanNotDelete Lock' },
      { letter: 'D', text: 'Delete Resource Group' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'The **Audit** policy effect evaluates existing and new resources and creates warning/non-compliant entries in the Azure Policy compliance dashboard and Activity Log without blocking provisioning.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Deny actively rejects non-compliant creations and updates.' },
      { letter: 'C', reason: 'CanNotDelete locks block deletion of resources.' },
      { letter: 'D', reason: 'Deleting a Resource Group destroys all contained resources.' },
    ],
    examTip:
      'Azure Policy Effects: Audit (report only, do not block); Deny (block non-compliant deployment); Append/Modify (add tags/properties automatically)!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Choose Audit effect for passive compliance visibility, Deny effect for strict enforcement.',
    },
  },
  {
    id: 'az900-mod9-q7',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A financial organization applies a **CanNotDelete** Resource Lock directly onto a Resource Group named "RG-Core-Finance" that contains 15 Azure SQL Databases and 4 Storage Accounts.',
    question: 'How does the Resource Lock on "RG-Core-Finance" affect the 19 child resources inside it?',
    options: [
      { letter: 'A', text: 'The lock inherits automatically to all existing and future resources inside RG-Core-Finance, preventing deletion of any child resource until the lock is removed' },
      { letter: 'B', text: 'Resource Locks apply only to the Resource Group shell and do not protect child databases inside' },
      { letter: 'C', text: 'The lock automatically switches all 4 Storage Accounts to ReadOnly, blocking application data writes' },
      { letter: 'D', text: 'Any Contributor can ignore the lock by passing "--force" in Azure CLI' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Locks placed on a parent scope (Subscription or Resource Group) are inherited by ALL child resources within that scope—and even newly created resources inside it automatically inherit the lock!',
    distractorBreakdown: [
      { letter: 'B', reason: 'Resource Locks inherit cleanly from Subscription -> Resource Group -> Child Resources.' },
      { letter: 'C', reason: 'A CanNotDelete lock still permits modifying settings and writing database/blob data (it only blocks deletion).' },
      { letter: 'D', reason: 'No CLI flag bypasses a Resource Lock; only an Owner or User Access Administrator can explicitly remove the lock first.' },
    ],
    examTip:
      'Important nuance: A CanNotDelete lock on a Storage Account prevents deleting the Storage Account resource itself—you CAN still read/write blobs inside it! A ReadOnly lock blocks config modifications AND blocks data writes on some control-plane keys!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Track Resource Lock inheritance downward and distinguish control-plane CanNotDelete vs ReadOnly behavior.',
    },
  },
  {
    id: 'az900-mod9-q8',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A cloud architect needs official third-party audit reports (SOC 2 Type II, ISO 27001, PCI-DSS, HIPAA) proving Microsoft’s Azure datacenter compliance to external banking regulators.',
    question: 'Which Microsoft portal hosts downloadable independent audit reports, penetration-test summaries, and compliance whitepapers?',
    options: [
      { letter: 'A', text: 'Microsoft Service Trust Portal (and Microsoft Purview Compliance Manager)' },
      { letter: 'B', text: 'Azure Pricing Calculator' },
      { letter: 'C', text: 'Azure Cloud Shell' },
      { letter: 'D', text: 'Azure Container Registry' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'The **Microsoft Service Trust Portal** is Microsoft’s public compliance hub providing access to independent third-party audit reports (ISO, SOC, FedRAMP, GDPR, HIPAA) and compliance documentation for Azure and Microsoft 365.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Pricing Calculator forecasts monthly cloud costs.' },
      { letter: 'C', reason: 'Cloud Shell is a browser terminal for executing scripts.' },
      { letter: 'D', reason: 'Azure Container Registry stores Docker container images.' },
    ],
    examTip:
      'Download Microsoft’s SOC 2 / ISO 27001 / GDPR audit reports & whitepapers = Service Trust Portal!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Link external compliance audit artifacts (SOC/ISO/FedRAMP PDFs) to the Service Trust Portal.',
    },
  },
  {
    id: 'az900-mod9-q9',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A company mandates that whenever any developer creates a new resource without specifying a "CostCenter" tag, Azure should automatically inject a default "CostCenter: Unassigned" tag during provisioning instead of failing the deployment.',
    question: 'Which governance capability automatically inserts missing tags or properties on Azure resources at scale?',
    options: [
      { letter: 'A', text: 'Azure Policy (using Append or Modify remediation effects)' },
      { letter: 'B', text: 'Azure ReadOnly Resource Lock' },
      { letter: 'C', text: 'Azure Traffic Manager' },
      { letter: 'D', text: 'Microsoft Sentinel' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Policy supports automated remediation effects (**Append**, **Modify**, and **DeployIfNotExists**) that automatically add or inherit missing Resource Tags or security configurations without blocking deployments.',
    distractorBreakdown: [
      { letter: 'B', reason: 'ReadOnly locks freeze configurations rather than enriching missing tags.' },
      { letter: 'C', reason: 'Traffic Manager performs DNS routing.' },
      { letter: 'D', reason: 'Sentinel performs SIEM security threat correlation.' },
    ],
    examTip:
      'Auto-add/inherit missing Resource Tags across Resource Groups & Subscriptions = Azure Policy (Modify/Append effect)!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Solve the non-inheritance of Resource Tags by assigning an Azure Policy Modify/Append rule.',
    },
  },
  {
    id: 'az900-mod9-q10',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A university IT team wants a single repeatable blueprint package that bundles together RBAC role assignments, Azure Policy Initiatives, Resource Group structures, and ARM deployment templates so every new academic research subscription spins up pre-hardened to ISO 27001 standards.',
    question: 'What is the purpose of grouping dozens of Azure Policy definitions into an Azure Policy Initiative (Policy Set)?',
    options: [
      { letter: 'A', text: 'It aggregates related compliance policies under one tracked goal (e.g., NIST or ISO 27001) so all rules can be assigned and monitored together as one percentage score' },
      { letter: 'B', text: 'It replaces Microsoft Entra ID passwords with SSH keys' },
      { letter: 'C', text: 'It converts Azure IaaS VMs into SaaS applications' },
      { letter: 'D', text: 'It reduces network latency across Region Pairs' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'An Azure Policy Initiative (Policy Set) simplifies compliance tracking by grouping multiple related Policy Definitions (often 50+ checks for HIPAA, NIST, or CIS benchmarks) into one unified assignment with aggregated compliance scoring.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Policy Initiatives govern ARM resource properties, not SSH credentials.' },
      { letter: 'C', reason: 'Policies do not convert IaaS into SaaS.' },
      { letter: 'D', reason: 'Policies do not alter physical fiber network latency.' },
    ],
    examTip:
      'Policy Definition = 1 rule. Policy Initiative = Bundle of multiple rules tracked together for regulatory frameworks like CIS/NIST/HIPAA!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Contrast single Policy Definitions against multi-rule Policy Initiatives.',
    },
  },
  {
    id: 'az900-mod9-q11',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Fundamental',
    scenario:
      'A cloud governance team enforces a rule prohibiting Virtual Machines larger than the D4s_v5 SKU across all Dev/Test subscriptions. Meanwhile, another rule dictates that intern developers only have permission to restart VMs, not create them.',
    question: 'Which Azure tool handles the VM size restriction versus the intern permission restriction?',
    options: [
      { letter: 'A', text: 'Azure Policy restricts allowed VM SKU sizes; Azure RBAC restricts which actions the intern user account can perform' },
      { letter: 'B', text: 'Azure RBAC restricts VM SKU sizes; Azure Policy restricts intern login times' },
      { letter: 'C', text: 'Resource Locks handle both restrictions automatically' },
      { letter: 'D', text: 'Azure Advisor blocks both VM sizes and intern logins' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Policy enforces resource property standards (allowed VM SKUs, allowed regions, required encryption) regardless of user role, while Azure RBAC controls *who* has authorization to perform specific operations (Reader, Contributor, VM Restart).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Reverses Azure Policy and Azure RBAC.' },
      { letter: 'C', reason: 'Resource Locks guard against accidental deletion or changes, not SKU allowlisting.' },
      { letter: 'D', reason: 'Advisor only suggests best practices passively.' },
    ],
    examTip:
      'Always test yourself: "WHO can click Delete/Restart?" ➔ RBAC! "WHAT VM sizes/regions/tags are permitted?" ➔ Azure Policy!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Separate User Identity Actions (RBAC) from Resource Configuration Compliance (Azure Policy).',
    },
  },
  {
    id: 'az900-mod9-q12',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Advanced',
    scenario:
      'A hospital compliance auditor needs to map where sensitive Patient Health Information (PHI) and credit card numbers reside across an on-premises SQL Server, an Azure Data Lake Gen2 account, and an Amazon S3 bucket, automatically applying "Confidential-PII" sensitivity labels and visualizing upstream-to-downstream data lineage.',
    question: 'Which Microsoft service delivers unified multi-cloud data discovery, automated sensitive-data classification, and lineage mapping?',
    options: [
      { letter: 'A', text: 'Microsoft Purview' },
      { letter: 'B', text: 'Azure Monitor' },
      { letter: 'C', text: 'Azure Resource Manager' },
      { letter: 'D', text: 'Azure Policy Deny Effect' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Purview unites Azure Data Catalog, Microsoft 365 compliance, automated sensitive-information classification (e.g., SSNs, Credit Cards, PHI), and end-to-end data lineage across on-premises, Azure, and multi-cloud stores.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Monitor tracks infrastructure metrics and logs, not PII data lineage.' },
      { letter: 'C', reason: 'ARM deploys infrastructure resources.' },
      { letter: 'D', reason: 'Azure Policy governs cloud resource configurations, not inside-table PII classification.' },
    ],
    examTip:
      'Data Map + PII Discovery + Sensitivity Classification + Data Lineage across on-prem/Azure/multi-cloud = Microsoft Purview!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Recognize Microsoft Purview as the unified enterprise data governance & compliance portal.',
    },
  },
  {
    id: 'az900-mod9-q13',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A database administrator accidentally removes a **CanNotDelete** lock from a test storage account, deletes an old snapshot, and wants to verify who removed the lock and at what exact timestamp.',
    question: 'Which Azure capability logs all control-plane operations (such as deleting locks, creating VMs, or changing RBAC roles) in a subscription?',
    options: [
      { letter: 'A', text: 'Azure Activity Log' },
      { letter: 'B', text: 'Azure Pricing Calculator' },
      { letter: 'C', text: 'Azure DNS' },
      { letter: 'D', text: 'Azure File Sync' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'The Azure Activity Log is a platform log in Azure Monitor that records every subscription-level control-plane event—who created/modified/deleted resources, changed RBAC permissions, or removed Resource Locks, and when.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Pricing Calculator forecasts costs.' },
      { letter: 'C', reason: 'Azure DNS resolves hostnames.' },
      { letter: 'D', reason: 'File Sync synchronizes Windows file shares.' },
    ],
    examTip:
      '"WHO did WHAT control-plane action (create/delete VM, remove Lock, change RBAC) and WHEN?" = Azure Activity Log!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Identify Azure Activity Log for auditing ARM control-plane actions across a subscription.',
    },
  },
  {
    id: 'az900-mod9-q14',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'An organization creates a **ReadOnly** Resource Lock on a production Azure Virtual Network ("VNet-Prod"). Later, a Senior Network Engineer with the Owner role tries to add a new subnet inside "VNet-Prod".',
    question: 'Why does adding the new subnet fail immediately?',
    options: [
      { letter: 'A', text: 'Because a ReadOnly Resource Lock prevents ALL configuration modifications (including adding subnets) as well as deletions—even by Subscription Owners—until removed' },
      { letter: 'B', text: 'Because VNets can only contain 1 subnet' },
      { letter: 'C', text: 'Because Owner role cannot modify networks' },
      { letter: 'D', text: 'Because ReadOnly locks expire after 5 minutes' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'A **ReadOnly** Resource Lock restricts authorized users to read-only GET operations on the resource’s ARM configuration, blocking both updates (adding subnets, changing tags) and deletions for every user including Owners.',
    distractorBreakdown: [
      { letter: 'B', reason: 'VNets can hold thousands of subnets.' },
      { letter: 'C', reason: 'Owners normally have full permission—only the active lock blocks the update.' },
      { letter: 'D', reason: 'Resource Locks stay active permanently until explicitly deleted.' },
    ],
    examTip:
      'ReadOnly Lock Trap: It can block unexpected side effects like adding subnets, scaling plans, or even retrieving Storage Account list keys! Test before applying ReadOnly!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Know that ReadOnly locks block control-plane updates AND deletions even for Owners.',
    },
  },
  {
    id: 'az900-mod9-q15',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 9,
    moduleTitle: 'Azure Governance & Compliance Tools',
    difficulty: 'Intermediate',
    scenario:
      'A global software enterprise wants to assure European regulators that Microsoft maintains strict privacy standards: Microsoft will NEVER scan customer enterprise data for advertising, grants transparency over data storage locations, and enforces strict GDPR data-subject deletion pipelines.',
    question: 'Which core principle of Microsoft’s Cloud Privacy Statement governs customer ownership of enterprise data in Azure?',
    options: [
      { letter: 'A', text: 'The customer owns and controls their own data; Microsoft acts strictly as a data processor under contractual privacy & GDPR commitments' },
      { letter: 'B', text: 'Microsoft acquires shared intellectual property ownership over customer databases in exchange for Free Tier credits' },
      { letter: 'C', text: 'Customer data is automatically indexed for targeted public advertising unless an extra fee is paid' },
      { letter: 'D', text: 'All Azure regions share one unencrypted global directory without regional residency rules' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Under the Microsoft Privacy Statement and Data Protection Addendum (DPA), customers retain 100% ownership and rights over their data; Microsoft does not use enterprise customer data for advertising and provides transparent GDPR/compliance controls.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Microsoft never claims IP ownership over customer cloud data.' },
      { letter: 'C', reason: 'Microsoft strictly prohibits using enterprise cloud data for targeted advertising.' },
      { letter: 'D', reason: 'Azure preserves strict geography-level data residency guarantees.' },
    ],
    examTip:
      'Microsoft Trust Center & Privacy rule: YOU own your data; Microsoft only processes it to deliver contracted services (never for ads).',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Anchor cloud privacy questions to customer data ownership and zero ad-mining commitments.',
    },
  },

  // =========================================================================
  // MODULE 10 EXPANSION: Azure Management & Deployment Tools (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod10-q6',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A DevOps team uses MacBooks and Ubuntu Linux CI/CD build runners and prefers simple Bash-style commands (`az group create ...`) rather than Windows PowerShell verb-noun cmdlets (`New-AzResourceGroup ...`).',
    question: 'Which command-line management tool runs natively across Windows, macOS, and Linux using `az` commands?',
    options: [
      { letter: 'A', text: 'Azure CLI' },
      { letter: 'B', text: 'Azure Portal GUI' },
      { letter: 'C', text: 'Azure Resource Locks' },
      { letter: 'D', text: 'Azure TCO Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure CLI (`az`) is a cross-platform command-line tool that runs natively in Bash, Zsh, PowerShell, and Windows Command Prompt, designed for concise scripting and CI/CD automation.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Portal is a graphical web UI, not a CI/CD CLI.' },
      { letter: 'C', reason: 'Resource Locks block resource modifications/deletions.' },
      { letter: 'D', reason: 'TCO Calculator is a web cost calculator.' },
    ],
    examTip:
      '`az` commands (Bash-friendly, cross-platform) = Azure CLI! `Verb-AzNoun` cmdlets (e.g., `New-AzVM`) = Azure PowerShell!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Distinguish Azure CLI (`az ...`) from Azure PowerShell (`Verb-AzNoun`).',
    },
  },
  {
    id: 'az900-mod10-q7',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A cloud engineer opens Azure Cloud Shell inside the Azure Portal for the very first time and tries to choose between Bash and PowerShell. Before the shell opens, Cloud Shell prompts to mount a persistent file share.',
    question: 'Which Azure storage resource backs the persistent `$HOME` / `clouddrive` storage directory in Azure Cloud Shell?',
    options: [
      { letter: 'A', text: 'An Azure Files share inside a Storage Account' },
      { letter: 'B', text: 'An Azure Archive Blob container' },
      { letter: 'C', text: 'An Azure Queue Storage buffer' },
      { letter: 'D', text: 'An Azure Data Box appliance' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Cloud Shell persists your scripts and `$HOME` directory files across browser sessions by mounting an **Azure Files** share inside an Azure Storage Account (standard storage rates apply only for the small mounted file share).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Archive Blob is offline and cannot mount live home directories.' },
      { letter: 'C', reason: 'Queue Storage buffers async work messages.' },
      { letter: 'D', reason: 'Data Box is a physical offline shipping device.' },
    ],
    examTip:
      'Azure Cloud Shell Fact Check: Browser-based, supports BOTH Bash & PowerShell, pre-authenticated, and persists scripts using an Azure Files share!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Know how Cloud Shell persists home files via Azure Files and resets sessions after 20 min inactivity.',
    },
  },
  {
    id: 'az900-mod10-q8',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A hybrid enterprise operates 80 Kubernetes clusters—40 running in Azure Kubernetes Service (AKS), 25 running on-premises VMware vSphere, and 15 running in AWS EKS. The security team wants to push uniform GitOps configurations and Microsoft Defender policies to all 80 clusters from one Azure Portal inventory.',
    question: 'Which Azure technology enables unified Kubernetes, SQL Server, and server management across on-premises and AWS/GCP clouds?',
    options: [
      { letter: 'A', text: 'Azure Arc' },
      { letter: 'B', text: 'Azure Bastion' },
      { letter: 'C', text: 'Azure VPN Gateway' },
      { letter: 'D', text: 'Azure Pricing Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Arc projects non-Azure resources (on-premises Windows/Linux servers, Kubernetes clusters, SQL Server, and AWS/GCP VMs) into Azure Resource Manager so they appear alongside native Azure resources with full Policy, Tagging, Monitor, and GitOps governance.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Bastion provides browser SSH/RDP to Azure VNet VMs.' },
      { letter: 'C', reason: 'VPN Gateway connects networks over encrypted tunnels without projecting K8s control planes into ARM.' },
      { letter: 'D', reason: 'Pricing Calculator models future bills.' },
    ],
    examTip:
      'On-premises / AWS / GCP servers & Kubernetes clusters governed via Azure Portal + Azure Policy = Azure Arc!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Any multi-cloud or on-prem resource managed as an ARM object uses Azure Arc.',
    },
  },
  {
    id: 'az900-mod10-q9',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A company’s DevOps architect writes declarative infrastructure templates using `.bicep` files rather than raw JSON ARM templates. When the CI/CD pipeline runs `az deployment group create --template-file main.bicep`, what happens behind the scenes?',
    question: 'How does Bicep interact with Azure Resource Manager during deployment?',
    options: [
      { letter: 'A', text: 'Bicep transpiles cleanly into standard ARM template JSON and sends the declarative deployment to the Azure Resource Manager (ARM) API' },
      { letter: 'B', text: 'Bicep bypasses ARM and directly flashes bare-metal server BIOS firmware' },
      { letter: 'C', text: 'Bicep can only deploy Virtual Machines and cannot deploy Storage or Networking resources' },
      { letter: 'D', text: 'Bicep runs exclusively inside Microsoft 365 Excel' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Bicep is a transparent abstraction over ARM template JSON—offering cleaner modular syntax, first-class IDE IntelliSense, and automatic dependency resolution—that transpiles into standard ARM JSON submitted to Azure Resource Manager.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Every Bicep deployment passes securely through Azure Resource Manager (ARM).' },
      { letter: 'C', reason: 'Bicep supports 100% of Azure resource types and API versions on day one.' },
      { letter: 'D', reason: 'Bicep is an Infrastructure as Code language used via VS Code, CLI, PowerShell, and CI/CD pipelines.' },
    ],
    examTip:
      'Bicep = Cleaner, modular Infrastructure-as-Code DSL that compiles directly to ARM template JSON!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Connect Bicep directly to ARM Templates as a concise, transpiled declarative IaC layer.',
    },
  },
  {
    id: 'az900-mod10-q10',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Fundamental',
    scenario:
      'A newcomer to Azure wants a visual web interface where they can browse marketplace templates, inspect graphical billing charts, edit settings interactively, and create their first Virtual Machine with point-and-click wizards.',
    question: 'Which Azure management interface offers a visual browser-based GUI dashboard for interactive administration?',
    options: [
      { letter: 'A', text: 'Azure Portal' },
      { letter: 'B', text: 'Azure CLI' },
      { letter: 'C', text: 'Bicep Compiler' },
      { letter: 'D', text: 'AzCopy' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'The Azure Portal (`portal.azure.com`) is a unified, graphical web-based console for building, managing, and monitoring everything from simple web apps to complex cloud deployments interactively.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure CLI is text-based command-line administration.' },
      { letter: 'C', reason: 'Bicep is declarative code.' },
      { letter: 'D', reason: 'AzCopy is a storage transfer CLI utility.' },
    ],
    examTip:
      'Point-and-click visual GUI = Azure Portal! Repeatable scripting = Azure CLI / PowerShell! Repeatable declarative templates = ARM Templates / Bicep!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Match interaction style: Visual GUI = Portal; Scripting = CLI/PowerShell; Declarative Code = ARM/Bicep.',
    },
  },
  {
    id: 'az900-mod10-q11',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A Windows systems administrator deeply experienced in automating Active Directory with PowerShell cmdlets wants to automate bulk Azure VM tagging and Resource Group reports using familiar `Get-AzVM` and `Set-AzResourceGroup` object pipelines.',
    question: 'Which Azure tool integrates `Az` module cmdlets directly into Windows PowerShell and PowerShell 7 cross-platform?',
    options: [
      { letter: 'A', text: 'Azure PowerShell' },
      { letter: 'B', text: 'Azure Bastion' },
      { letter: 'C', text: 'Azure Purview' },
      { letter: 'D', text: 'Azure Pricing Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure PowerShell is a set of cmdlets (`Az` module) for managing Azure resources directly from PowerShell (returning rich structured objects ideal for PowerShell pipelines).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Bastion gives RDP/SSH access.' },
      { letter: 'C', reason: 'Purview manages data classification.' },
      { letter: 'D', reason: 'Pricing Calculator forecasts costs.' },
    ],
    examTip:
      'PowerShell cmdlets (`Get-Az...`, `New-Az...`) = Azure PowerShell!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Match Verb-AzNoun cmdlets directly to Azure PowerShell.',
    },
  },
  {
    id: 'az900-mod10-q12',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Advanced',
    scenario:
      'A senior platform engineer writes a deployment template containing 3 Virtual Networks, 2 Storage Accounts, and 6 VMs. The engineer wants to ensure that if a developer runs the deployment a second time with one updated tag, Azure leaves existing healthy resources untouched and only applies the delta—without needing custom `if/else` existence checks.',
    question: 'Which property of ARM Templates and Bicep guarantees consistent results regardless of how many times the template is executed?',
    options: [
      { letter: 'A', text: 'Idempotency (plus Declarative Syntax)' },
      { letter: 'B', text: 'Imperative Procedural Looping' },
      { letter: 'C', text: 'Geo-Zone Rehydration' },
      { letter: 'D', text: 'Single-Tenant Physical Colocation' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Declarative ARM Templates and Bicep files are **idempotent**, meaning you can run the exact same deployment repeatedly and ARM safely converges the target environment to the declared end state without creating duplicate resources.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Imperative scripts often fail on re-run unless manual existence checks are scripted.' },
      { letter: 'C', reason: 'Rehydration applies to Archive Blob Storage.' },
      { letter: 'D', reason: 'Colocation is physical datacenter leasing.' },
    ],
    examTip:
      'ARM/Bicep Key Advantage: Declarative + Idempotent + Dependency Resolution + Parallel Orchestration!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Remember "idempotent" means re-running the same IaC template yields the exact same desired state safely.',
    },
  },
  {
    id: 'az900-mod10-q13',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A company needs to run scheduled Azure infrastructure updates from a lightweight browser session on a Chromebook that does not allow installing Python, PowerShell, or local `.exe` binaries.',
    question: 'Which Azure service runs an up-to-date, Microsoft-managed interactive command-line environment directly inside any modern browser?',
    options: [
      { letter: 'A', text: 'Azure Cloud Shell' },
      { letter: 'B', text: 'Azure Storage Explorer desktop app' },
      { letter: 'C', text: 'Azure Data Box Disk' },
      { letter: 'D', text: 'Azure Private Link' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Cloud Shell runs completely in the cloud and opens directly inside your browser (at `shell.azure.com` or inside the Azure Portal), preloaded with Azure CLI, Azure PowerShell, Terraform, Bicep, Git, and kubectl with zero local installation.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Storage Explorer desktop app requires local installation.' },
      { letter: 'C', reason: 'Data Box Disk is physical offline hardware.' },
      { letter: 'D', reason: 'Private Link exposes PaaS endpoints inside a VNet.' },
    ],
    examTip:
      'Locked-down computer / Chromebook / zero local CLI installs = Azure Cloud Shell!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Choose Azure Cloud Shell whenever browser-based zero-install CLI/PowerShell access is required.',
    },
  },
  {
    id: 'az900-mod10-q14',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Intermediate',
    scenario:
      'A compliance team asks how Azure guarantees that an engineer executing `az vm create` via Azure CLI receives the exact same RBAC permission checks, Resource Lock blocks, and Azure Policy validations as someone clicking through the Azure Portal GUI.',
    question: 'Which architectural layer enforces identical RBAC, Policy, and Lock gates across Portal, CLI, PowerShell, and SDK requests?',
    options: [
      { letter: 'A', text: 'Azure Resource Manager (ARM)' },
      { letter: 'B', text: 'Azure Traffic Manager' },
      { letter: 'C', text: 'Azure Virtual Desktop' },
      { letter: 'D', text: 'Azure Content Delivery Network' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'All management tools (Portal, Azure CLI, PowerShell, REST APIs, Bicep) send requests through **Azure Resource Manager (ARM)**, which uniformly authenticates the caller via Entra ID and evaluates RBAC, Resource Locks, and Azure Policies before provisioning anything.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Traffic Manager routes DNS queries.' },
      { letter: 'C', reason: 'AVD streams virtual Windows desktops.' },
      { letter: 'D', reason: 'CDN caches static web assets.' },
    ],
    examTip:
      'Every Azure tool routes through ONE unified control plane: Azure Resource Manager (ARM)!',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Understand that ARM is the single unified control plane enforcing Locks/RBAC/Policy across all client tools.',
    },
  },
  {
    id: 'az900-mod10-q15',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 10,
    moduleTitle: 'Azure Management & Deployment Tools',
    difficulty: 'Advanced',
    scenario:
      'A multinational retailer operates 45 physical retail store servers running Ubuntu Linux on-premises and 20 Kubernetes nodes in Google Cloud. The central Azure team wants to enroll all 65 external machines so they automatically report guest OS security patches to Microsoft Defender for Cloud and enforce standardized Azure Tags.',
    question: 'Which onboarding mechanism extends Azure Tags, Policy Guest Configuration, and Defender for Cloud onto non-Azure physical servers and GCP nodes?',
    options: [
      { letter: 'A', text: 'Azure Arc-enabled servers and Azure Arc-enabled Kubernetes' },
      { letter: 'B', text: 'Azure Availability Sets' },
      { letter: 'C', text: 'Azure Application Gateway WAF' },
      { letter: 'D', text: 'Azure Table Storage' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Installing the lightweight Azure Connected Machine agent (Azure Arc-enabled servers) and Arc Kubernetes agent registers external physical, VMware, AWS, and GCP machines as first-class ARM resources supporting Azure Tags, Azure Policy Guest Configuration, Azure Monitor, and Defender for Cloud.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Availability Sets apply strictly to native Azure VMs inside one datacenter.' },
      { letter: 'C', reason: 'Application Gateway WAF filters HTTP traffic.' },
      { letter: 'D', reason: 'Table Storage stores NoSQL entities.' },
    ],
    examTip:
      'Extend Azure Tags + Guest Policy + Defender for Cloud to on-prem physical servers or AWS/GCP = Azure Arc!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Connect cross-cloud and physical server governance directly to Azure Arc agents.',
    },
  },

  // =========================================================================
  // MODULE 11 EXPANSION: Azure Monitoring & Advisory Tools (q6..q15)
  // =========================================================================
  {
    id: 'az900-mod11-q6',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'An administrator wants to be automatically notified via SMS and email—and trigger an Azure Function scaling script—whenever average CPU percentage on a critical VM scale set exceeds 85% for 5 consecutive minutes.',
    question: 'Which Azure Monitor capability evaluates telemetry rules and triggers notifications or automated remediations?',
    options: [
      { letter: 'A', text: 'Azure Monitor Alerts paired with Action Groups' },
      { letter: 'B', text: 'Azure Status Public Map' },
      { letter: 'C', text: 'Azure Pricing Calculator' },
      { letter: 'D', text: 'Microsoft Purview' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Monitor Alerts evaluate metric thresholds or Log Analytics queries continuously and invoke **Action Groups** (configured with email, SMS, push notifications, webhooks, Logic Apps, or Azure Functions) when thresholds breach.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Status is a read-only global web page showing worldwide service outages.' },
      { letter: 'C', reason: 'Pricing Calculator models future spend.' },
      { letter: 'D', reason: 'Purview classifies enterprise data compliance.' },
    ],
    examTip:
      'CPU > 85% ➔ send SMS / trigger Webhook / run Automation = Azure Monitor Alert + Action Group!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Pair automated metric/log notifications and webhook remediations with Azure Monitor Alerts + Action Groups.',
    },
  },
  {
    id: 'az900-mod11-q7',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'An operations engineer notices an urgent email from Microsoft announcing planned hardware maintenance on an underlying SQL host in "UK South" next Tuesday at 02:00 UTC that could cause a brief failover.',
    question: 'Which tool surfaces personalized **Planned Maintenance**, **Security Advisories**, and downloadable **Root Cause Analysis (RCA)** reports scoped strictly to the services and regions your subscriptions actually deploy?',
    options: [
      { letter: 'A', text: 'Azure Service Health' },
      { letter: 'B', text: 'Azure Advisor' },
      { letter: 'C', text: 'Application Insights' },
      { letter: 'D', text: 'Azure TCO Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Service Health gives you a personalized view of active Service Issues, Planned Maintenance events, Health Advisories, and post-incident Root Cause Analyses (RCAs) filtered directly to your subscriptions and regions—plus configurable alerts.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Advisor analyzes your workload configs across 5 pillars (Cost, Security, Reliability, Performance, Ops Excellence), not Microsoft planned datacenter maintenance.' },
      { letter: 'C', reason: 'Application Insights monitors live web app code latency and exceptions.' },
      { letter: 'D', reason: 'TCO Calculator compares migration economics.' },
    ],
    examTip:
      'Personalized outage alerts + Planned Maintenance notices + official Microsoft Root Cause Analysis (RCA) = Azure Service Health!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Remember Planned Maintenance and RCAs for YOUR regions live inside Azure Service Health.',
    },
  },
  {
    id: 'az900-mod11-q8',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'A company runs a mission-critical VM named `vm-billing-prod`. Suddenly users cannot connect to it, even though the Azure Service Health dashboard shows zero regional outages in East US. The admin opens the VM blade in the portal to inspect whether a single underlying host rack rebooted or experienced an isolated hardware fault.',
    question: 'Which monitoring tool diagnoses availability events and root causes for ONE individual Azure resource instance?',
    options: [
      { letter: 'A', text: 'Azure Resource Health' },
      { letter: 'B', text: 'Azure Status' },
      { letter: 'C', text: 'Microsoft Purview' },
      { letter: 'D', text: 'Azure Cloud Shell' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Resource Health monitors the health status (Available, Unavailable, Degraded, Unknown) of an individual Azure resource—such as a single VM or SQL database—revealing whether downtime stemmed from an isolated Microsoft platform issue or a customer-initiated reboot.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure Status shows only broad global/regional outages, missing single-VM host failures.' },
      { letter: 'C', reason: 'Purview manages data classification.' },
      { letter: 'D', reason: 'Cloud Shell is a browser terminal.' },
    ],
    examTip:
      'Global outage check = Azure Status; Your region/subscription outage = Service Health; ONE specific VM crashed = Resource Health!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Narrow scope cleanly from Global (Status) -> Subscription/Region (Service Health) -> Single Resource (Resource Health).',
    },
  },
  {
    id: 'az900-mod11-q9',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'An architect checks Azure Advisor and sees five category tabs at the top of the blade. Four of them are Cost, Security, Reliability, and Operational Excellence.',
    question: 'What is the fifth pillar evaluated by Azure Advisor?',
    options: [
      { letter: 'A', text: 'Performance' },
      { letter: 'B', text: 'Hardware Depreciation' },
      { letter: 'C', text: 'Public Advertising' },
      { letter: 'D', text: 'Domain Registration' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Advisor aligns strictly with the five pillars of the Azure Well-Architected Framework: **Cost**, **Security**, **Reliability** (High Availability), **Operational Excellence**, and **Performance**.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Hardware depreciation is on-premises CapEx accounting.' },
      { letter: 'C', reason: 'Not an Azure Advisor pillar.' },
      { letter: 'D', reason: 'Not an Azure Advisor pillar.' },
    ],
    examTip:
      'Memorize Azure Advisor’s 5 Pillars: Cost, Security, Reliability, Operational Excellence, and Performance!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Recall the 5 Well-Architected pillars evaluated by Azure Advisor.',
    },
  },
  {
    id: 'az900-mod11-q10',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'A senior SRE is explaining the two fundamental data stores inside **Azure Monitor**: one stores lightweight numerical time-series measurements (like CPU %, Disk IOPS, Queue Length) sampled every minute for real-time charts, while the other collects rich structured JSON diagnostic events queryable via KQL.',
    question: 'What are the two core telemetry data platforms collected by Azure Monitor?',
    options: [
      { letter: 'A', text: 'Azure Monitor Metrics (numerical time-series) and Azure Monitor Logs (structured Log Analytics event records)' },
      { letter: 'B', text: 'Azure Data Box and Azure Files' },
      { letter: 'C', text: 'Azure Policy and Resource Locks' },
      { letter: 'D', text: 'TCO Calculator and Pricing Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Monitor stores telemetry in two primary stores: **Metrics** (lightweight numeric time-series values optimized for near real-time alerting and dashboards) and **Logs** (rich event/trace records stored in a Log Analytics workspace and analyzed via Kusto Query Language / KQL).',
    distractorBreakdown: [
      { letter: 'B', reason: 'Data Box and Azure Files are storage transfer and SMB file services.' },
      { letter: 'C', reason: 'Policy and Locks are governance controls.' },
      { letter: 'D', reason: 'Calculators estimate financial bills.' },
    ],
    examTip:
      'Azure Monitor Twin Engines: Metrics (fast numeric time-series) + Logs (KQL queries in Log Analytics Workspace)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Contrast numeric real-time Metrics against KQL-queryable Logs inside Azure Monitor.',
    },
  },
  {
    id: 'az900-mod11-q11',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'A global incident unfolds where multiple Microsoft 365 and Azure websites appear unreachable across North America. An external IT consultant—who does not yet have credentials to log into the client’s Azure Portal—wants to quickly verify whether Microsoft is experiencing a major public worldwide outage.',
    question: 'Which unauthenticated public webpage displays global status across all Microsoft Azure services and regions worldwide?',
    options: [
      { letter: 'A', text: 'Azure Status (`status.azure.com`)' },
      { letter: 'B', text: 'Azure Resource Health' },
      { letter: 'C', text: 'Azure Log Analytics Workspace' },
      { letter: 'D', text: 'Azure Advisor Cost Blade' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'The **Azure Status** page (`azure.status.microsoft`) is a public, unauthenticated global health dashboard informing everyone of major service incidents with broad impact across all Azure regions.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Resource Health requires signing into the Azure Portal to inspect a specific owned resource.' },
      { letter: 'C', reason: 'Log Analytics requires authenticated access to private customer logs.' },
      { letter: 'D', reason: 'Azure Advisor requires subscription sign-in.' },
    ],
    examTip:
      'No login needed + global public outage overview = Azure Status page!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Use Azure Status for unauthenticated global views; Azure Service Health for personalized subscription views.',
    },
  },
  {
    id: 'az900-mod11-q12',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'A DevOps engineer deploys a React + Node.js e-commerce frontend to Azure App Service and wants an end-to-end transaction dependency map showing how long calls from the React browser client take through the Node.js API down to Azure SQL queries.',
    question: 'Which Azure Monitor feature automatically builds live transaction traces and end-to-end application dependency maps?',
    options: [
      { letter: 'A', text: 'Application Insights' },
      { letter: 'B', text: 'Azure Service Health' },
      { letter: 'C', text: 'Azure Resource Locks' },
      { letter: 'D', text: 'Azure Pricing Calculator' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Application Insights (part of Azure Monitor) delivers rich Application Performance Management (APM), distributed tracing, live metrics streaming, dependency maps, and browser/page-load telemetry for web apps and microservices.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Service Health tracks platform outages, not app SQL query bottlenecks.' },
      { letter: 'C', reason: 'Resource Locks block deletions.' },
      { letter: 'D', reason: 'Pricing Calculator forecasts bills.' },
    ],
    examTip:
      'Distributed tracing, app dependency maps, page load times, and live exception telemetry = Application Insights!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Tie application-level APM tracing & SQL dependency timing directly to Application Insights.',
    },
  },
  {
    id: 'az900-mod11-q13',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Advanced',
    scenario:
      'A cloud reliability team configures Azure Monitor across a multi-tier app. An alert rule triggers an **Action Group** when HTTP 5xx errors exceed 20/minute. Instead of just emailing engineers, the team wants the Action Group to automatically open a ServiceNow incident ticket AND scale an App Service plan.',
    question: 'Which capabilities can a single Azure Monitor Action Group execute simultaneously when an alert fires?',
    options: [
      { letter: 'A', text: 'Send email/SMS/push notifications AND invoke automated actions via Webhooks, Azure Functions, Logic Apps, or ITSM connectors' },
      { letter: 'B', text: 'Action Groups can only display a static popup inside the Pricing Calculator' },
      { letter: 'C', text: 'Action Groups require purchasing an Enterprise Agreement before sending emails' },
      { letter: 'D', text: 'Action Groups automatically delete the Resource Group containing the failing service' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'An Azure Monitor Action Group defines reusable lists of notification preferences (Email, SMS, Push, Voice) and automated action receivers (Webhooks, Azure Functions, Logic Apps, Automation Runbooks, and ITSM/ServiceNow integrations) triggered when alerts fire.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Action Groups drive live operational notifications and automation.' },
      { letter: 'C', reason: 'Action Groups work on standard Pay-As-You-Go and Enterprise subscriptions.' },
      { letter: 'D', reason: 'Action Groups never delete Resource Groups automatically on alerts.' },
    ],
    examTip:
      'Remember Action Groups = WHO to notify (Email/SMS/Push) + WHAT automation to trigger (Webhook/Logic App/Function/ITSM)!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Understand Action Groups combine human alerting channels with automated remediation hooks.',
    },
  },
  {
    id: 'az900-mod11-q14',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'A cloud architect opens Azure Advisor’s **Reliability** recommendations after deploying a mission-critical payment service. Azure Advisor displays an actionable warning with high business impact.',
    question: 'Which recommendation would appear specifically under the **Reliability** pillar of Azure Advisor?',
    options: [
      { letter: 'A', text: 'Enable Zone Redundancy / configure backup replication or add multiple VM instances across Availability Zones to avoid single points of failure' },
      { letter: 'B', text: 'Buy a 3-Year Reserved VM Instance to reduce monthly billing' },
      { letter: 'C', text: 'Enable Multi-Factor Authentication on Entra ID Global Administrators' },
      { letter: 'D', text: 'Turn on HTTP/2 compression for faster API throughput' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Advisor’s **Reliability** pillar detects single points of failure—recommending Availability Zones, Storage soft delete/geo-redundancy, or Traffic Manager failover—whereas Reservations belong to Cost, MFA to Security, and throughput tuning to Performance.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Buying Reserved Instances is a **Cost** recommendation.' },
      { letter: 'C', reason: 'Enforcing MFA is a **Security** recommendation.' },
      { letter: 'D', reason: 'Throughput optimization is a **Performance** recommendation.' },
    ],
    examTip:
      'Azure Advisor Pillar Mapping: Fault tolerance/AZs/backups = Reliability; RIs/shut down idle VMs = Cost; MFA/NSG hardening = Security; SQL indexes/SKU scaling = Performance!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Practice sorting sample recommendations cleanly across the 5 Azure Advisor pillars.',
    },
  },
  {
    id: 'az900-mod11-q15',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 11,
    moduleTitle: 'Azure Monitoring & Advisory Tools',
    difficulty: 'Intermediate',
    scenario:
      'An operations manager wants an interactive Kusto Query Language (KQL) console to inspect guest OS Windows Event Logs collected from 35 Azure VMs and 15 on-premises Arc-enabled servers in one centralized repository.',
    question: 'Where does Azure Monitor aggregate guest OS logs from both native Azure VMs and Azure Arc servers for KQL analysis?',
    options: [
      { letter: 'A', text: 'A Log Analytics Workspace' },
      { letter: 'B', text: 'An Azure DNS Zone' },
      { letter: 'C', text: 'An Azure Archive Blob Container' },
      { letter: 'D', text: 'An Azure Resource Lock' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'A **Log Analytics Workspace** is the centralized environment inside Azure Monitor where log data from Azure resources, VMs, containers, and on-premises/multi-cloud Azure Arc machines is collected, indexed, and queried using KQL.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure DNS resolves hostnames.' },
      { letter: 'C', reason: 'Archive Blob is offline cold storage, not a live KQL analytics workspace.' },
      { letter: 'D', reason: 'Resource Locks prevent resource deletions/modifications.' },
    ],
    examTip:
      'Central log repository + KQL queries across Azure & Arc machines = Log Analytics Workspace!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Tie KQL log indexing and hybrid VM telemetry collection directly to Log Analytics Workspaces.',
    },
  },

  // =========================================================================
  // MODULE 12 EXPANSION: Real-World Scenario Assessment & Synthesis (q7..q16)
  // =========================================================================
  {
    id: 'az900-mod12-q7',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'An international airline is architecting its public passenger check-in system: 1) Static boarding pass images must be cached at edge Points of Presence globally for fast mobile downloads, 2) Global DNS routing must steer European travelers to West Europe and Asian travelers to Singapore with instant health failover, 3) Public endpoints must reject SQL Injection and Cross-Site Scripting HTTP attacks, and 4) Any botnet flood targeting public VIP IPs must be scrubbed automatically.',
    question: 'Which Azure combination fulfills all four requirements in order?',
    options: [
      { letter: 'A', text: 'Azure Blob Archive, Azure DNS Private Zone, Network Security Group, and Azure Bastion' },
      { letter: 'B', text: 'Azure Content Delivery Network (CDN/Front Door), Azure Traffic Manager, Azure Application Gateway WAF, and Azure DDoS Protection' },
      { letter: 'C', text: 'Azure Files, VNet Peering, Azure Firewall, and Azure Key Vault' },
      { letter: 'D', text: 'Azure Data Box, ExpressRoute, Azure Policy, and Microsoft Purview' },
    ],
    correctAnswer: 'B',
    whyCorrect:
      'CDN caches static media close to edge users; Traffic Manager directs global DNS requests geographically with endpoint health checks; Application Gateway WAF protects Layer-7 HTTP against OWASP SQLi/XSS attacks; and Azure DDoS Protection absorbs volumetric floods.',
    distractorBreakdown: [
      { letter: 'A', reason: 'Archive blobs are offline, Private DNS is internal-only, NSGs lack Layer-7 WAF inspection, and Bastion is for admin RDP/SSH.' },
      { letter: 'C', reason: 'VNet Peering links private VNets rather than global DNS steering, and Key Vault stores secrets.' },
      { letter: 'D', reason: 'Data Box and Purview do not deliver edge caching or WAF security.' },
    ],
    examTip:
      'Edge static caching = CDN; Geo DNS failover = Traffic Manager; Layer-7 SQLi/XSS protection = Application Gateway WAF; Volumetric flood defense = DDoS Protection!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Practice separating edge caching (CDN), DNS routing (Traffic Manager), L7 HTTP inspection (WAF), and L3/4 DDoS scrubbing.',
    },
  },
  {
    id: 'az900-mod12-q8',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A SaaS startup wants strict zero-trust administrative controls: 1) System engineers must SSH into Ubuntu VMs via the browser without assigning Public IPs to any VM, 2) Engineers may create and restart VMs inside "RG-AppTier" but MUST NOT be able to grant permissions to coworkers, 3) Database passwords and TLS certificates must be fetched dynamically from an HSM-backed vault, and 4) Every sign-in from an unmanaged personal laptop must require Multi-Factor Authentication.',
    question: 'Which four Azure features satisfy these security requirements?',
    options: [
      { letter: 'A', text: 'Azure Bastion, RBAC Contributor role, Azure Key Vault, and Microsoft Entra Conditional Access' },
      { letter: 'B', text: 'Public IPv4, RBAC Owner role, Azure Table Storage, and Single Sign-On only' },
      { letter: 'C', text: 'Azure VPN Gateway, ReadOnly Resource Lock, Azure App Configuration, and Azure Advisor' },
      { letter: 'D', text: 'ExpressRoute, RBAC Reader role, Azure Files, and Azure Service Health' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Bastion allows portal browser SSH without VM public IPs; RBAC Contributor allows VM creation/restarts without delegating access; Azure Key Vault safeguards secrets/certificates; and Entra Conditional Access enforces device-compliance + MFA policies.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Public IPs expose port 22, Owner allows delegating permissions, and Table Storage is not a cryptographic vault.' },
      { letter: 'C', reason: 'ReadOnly Lock prevents VM creation/restarts.' },
      { letter: 'D', reason: 'Reader role cannot create or restart VMs.' },
    ],
    examTip:
      'Security Stack Check: Browser SSH no-Public-IP = Bastion; Create without grant access = Contributor; Secrets/Certs = Key Vault; Conditional MFA = Conditional Access.',
    errorDiagnostic: {
      trapType: 'Governance vs Access',
      correctivePrescription: 'Verify RBAC Contributor vs Owner boundaries alongside Bastion, Key Vault, and Conditional Access.',
    },
  },
  {
    id: 'az900-mod12-q9',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A multi-department retail group is enforcing strict Azure FinOps and Cost Governance: 1) Every new resource must automatically receive an "OwnerDept" tag copied from its parent Resource Group, 2) Finance needs an email warning whenever actual dev spend hits $3,000 AND wants an automated webhook to deallocate test VMs at $4,000, 3) Steady-state compute across varying VM sizes in East US and UK South needs flexible discounted pricing, and 4) Pre-deployment monthly costs for a planned AKS cluster must be presented to the CFO.',
    question: 'Which four Azure governance and FinOps tools satisfy these requirements?',
    options: [
      { letter: 'A', text: 'Azure Policy (Modify/Inherit tag), Cost Management Budgets + Action Groups, Azure Savings Plan for Compute, and Azure Pricing Calculator' },
      { letter: 'B', text: 'Manual Resource Group tagging, TCO Calculator, Spot VMs, and Azure Status' },
      { letter: 'C', text: 'ReadOnly Locks, Azure Advisor, 3-Year Single-Region Reservation, and Log Analytics' },
      { letter: 'D', text: 'RBAC Contributor, Azure Free Account, Pay-As-You-Go, and Service Trust Portal' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Policy enforces automatic tag inheritance from Resource Groups; Cost Management Budgets paired with Action Groups send spend alerts and fire automation webhooks; Azure Savings Plans for Compute discount flexible VM families across multiple regions; and the Pricing Calculator estimates planned AKS spend.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Tags do not inherit automatically by manual assignment, and TCO compares existing on-prem servers rather than modeling new AKS clusters.' },
      { letter: 'C', reason: 'Single-region reservations lack cross-region/cross-family flexibility.' },
      { letter: 'D', reason: 'Free accounts and Pay-As-You-Go lack multi-region committed discounts.' },
    ],
    examTip:
      'FinOps Synthesis: Tag Inheritance = Azure Policy; Spend Alerts + Automation = Cost Budget + Action Group; Flexible Multi-Region Discount = Savings Plan; Forecast New Cloud Build = Pricing Calculator!',
    errorDiagnostic: {
      trapType: 'Cost & Redundancy Trap',
      correctivePrescription: 'Distinguish flexible Savings Plans from single-family Reservations and Cost Budgets from calculators.',
    },
  },
  {
    id: 'az900-mod12-q10',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A fast-growing healthcare diagnostics startup must balance rapid engineering innovation with airtight resilience: 1) Developers need an instant browser terminal pre-configured with Bash and persistent script storage from locked-down laptops, 2) A single standalone Docker PDF-converter container must launch in seconds with per-second billing and zero Kubernetes cluster setup, 3) Patient radiology DICOM blobs require protection against a full datacenter outage in the primary region AND continuous read-only access in a secondary region 400 miles away, and 4) Any accidental deletion of the core storage account must be blocked even for Subscription Owners.',
    question: 'Which four Azure solutions satisfy all requirements cleanly without over-engineering?',
    options: [
      { letter: 'A', text: 'Azure Cloud Shell, Azure Container Instances (ACI), Read-Access Geo-Zone-Redundant Storage (RA-GZRS), and CanNotDelete Resource Lock' },
      { letter: 'B', text: 'Local Windows PowerShell, Azure Kubernetes Service (AKS), Locally Redundant Storage (LRS), and RBAC Reader role' },
      { letter: 'C', text: 'Azure Portal GUI only, Azure Virtual Machines, Zone-Redundant Storage (ZRS), and Azure Policy Audit' },
      { letter: 'D', text: 'Azure Arc, Azure Virtual Desktop, Blob Archive Tier, and ReadOnly Resource Lock' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Cloud Shell provides browser Bash with Azure Files persistence; ACI runs standalone containers fast with per-second billing and zero orchestration; RA-GZRS combines 3-Zone primary protection with secondary regional read access; and a CanNotDelete Lock stops Owners from deleting the storage account while permitting ongoing DICOM uploads.',
    distractorBreakdown: [
      { letter: 'B', reason: 'AKS over-engineers a single container, and LRS fails on datacenter/region loss.' },
      { letter: 'C', reason: 'ZRS provides zero secondary-region disaster recovery or read access, and Policy Audit does not block deletions.' },
      { letter: 'D', reason: 'Archive Tier blocks immediate radiology reads, and a ReadOnly lock can interfere with key/setting management.' },
    ],
    examTip:
      'Avoid Over-Engineering: 1 simple container = ACI (not AKS); Zone + Secondary Read = RA-GZRS; Prevent deletion without freezing operations = CanNotDelete Lock!',
    errorDiagnostic: {
      trapType: 'Over-Engineering',
      correctivePrescription: 'Select lightweight managed services (ACI, Cloud Shell, CanNotDelete) tailored strictly to stated constraints.',
    },
  },
  {
    id: 'az900-mod12-q11',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A multinational engineering firm wants to simplify DevOps and Operations monitoring: 1) Provision identical Dev, Staging, and Production VNets/Apps repeatedly via concise Azure-native declarative code that compiles to ARM JSON, 2) Query 90 days of centralized firewall and VM diagnostic logs using Kusto Query Language (KQL), 3) Diagnose why ONE single VM ("vm-cad-09") stopped responding last night, and 4) Enforce a rule blocking anyone from deploying resources in unapproved regions.',
    question: 'Which four Azure tools should the engineering team implement?',
    options: [
      { letter: 'A', text: 'Bicep, Azure Monitor Log Analytics Workspace, Azure Resource Health, and Azure Policy' },
      { letter: 'B', text: 'Azure CLI, Azure Status page, Azure Advisor, and Azure RBAC' },
      { letter: 'C', text: 'ARM JSON manual portal edits, Application Insights, Azure Service Health, and Resource Tags' },
      { letter: 'D', text: 'Azure Cloud Shell, Azure Storage Explorer, Azure Traffic Manager, and CanNotDelete Lock' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Bicep provides concise declarative IaC transpiling to ARM JSON; Log Analytics aggregates logs for KQL querying; Azure Resource Health isolates root causes on one individual VM; and Azure Policy blocks deployments outside allowed locations.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Azure CLI is imperative, Azure Status is global only, and RBAC controls who acts rather than deployment regions.' },
      { letter: 'C', reason: 'Service Health tracks broad regional/service events rather than one single VM, and Tags do not block regions.' },
      { letter: 'D', reason: 'None of these tools perform KQL querying or regional compliance blocking.' },
    ],
    examTip:
      'Concise Declarative DSL = Bicep; KQL Log Queries = Log Analytics; Single VM Root Cause = Resource Health; Restrict Regions = Azure Policy!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Keep deployment DSL (Bicep), KQL log analysis (Log Analytics), single-VM diagnostics (Resource Health), and region rules (Policy) aligned.',
    },
  },
  {
    id: 'az900-mod12-q12',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A government-regulated university research center is designing its cloud foundation: 1) Because of federal defense contracts, workloads must run in physically isolated US datacenters staffed strictly by screened US citizens, 2) Employees across 25 university Azure subscriptions must inherit security rules automatically from a single root node, 3) On-premises Linux supercomputer nodes must appear inside the Azure Portal for standardized inventory tagging, and 4) The CISO wants an overall percentage "Secure Score" plus vulnerability hardening tips.',
    question: 'Which four Azure technologies fulfill these governance and compliance goals?',
    options: [
      { letter: 'A', text: 'Azure Government, Azure Management Groups, Azure Arc, and Microsoft Defender for Cloud' },
      { letter: 'B', text: 'Azure China 21Vianet, Resource Groups, Azure Migrate, and Microsoft Sentinel' },
      { letter: 'C', text: 'East US Commercial Region, Availability Sets, Azure Data Box, and Azure Service Health' },
      { letter: 'D', text: 'Azure Private Link, Subscriptions only, Azure Files, and Azure Advisor Cost' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Government delivers physically isolated US sovereign datacenters; Management Groups propagate policies/RBAC across 25 subscriptions; Azure Arc projects on-premises Linux servers into ARM; and Defender for Cloud produces Secure Score CSPM assessments.',
    distractorBreakdown: [
      { letter: 'B', reason: '21Vianet operates in China, Resource Groups sit inside one subscription, and Sentinel is SIEM rather than CSPM Secure Score.' },
      { letter: 'C', reason: 'Commercial regions lack sovereign US citizenship staffing mandates.' },
      { letter: 'D', reason: 'Individual subscriptions do not share multi-subscription inheritance without Management Groups.' },
    ],
    examTip:
      'US Sovereign = Azure Government; Multi-Sub Inheritance = Management Groups; On-Prem Governance in ARM = Azure Arc; Secure Score = Defender for Cloud!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Anchor sovereign regions, hierarchy scopes, hybrid Arc enrollment, and Secure Score cleanly.',
    },
  },
  {
    id: 'az900-mod12-q13',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A manufacturing enterprise is migrating legacy workloads to Azure: 1) Before buying or deploying anything, the IT director needs an automated discovery agent to assess 60 on-premises VMware VMs and check Azure compatibility & right-sizing, 2) 180 TB of archived engineering CAD drawings must be transported offline over 2 weeks without saturating the factory internet connection, 3) Once uploaded, those CAD archives will stay untouched for 10 years at minimum monthly storage cost (multi-hour retrieval wait is fine), and 4) Corporate remote engineers need cloud-hosted multi-session Windows 11 desktops.',
    question: 'Which four Azure solutions should the enterprise deploy?',
    options: [
      { letter: 'A', text: 'Azure Migrate, Azure Data Box, Blob Archive Access Tier, and Azure Virtual Desktop (AVD)' },
      { letter: 'B', text: 'Azure Pricing Calculator, AzCopy, Blob Hot Tier, and Azure Container Instances' },
      { letter: 'C', text: 'Azure Advisor, Azure File Sync, Blob Cool Tier, and Azure App Service' },
      { letter: 'D', text: 'Service Trust Portal, ExpressRoute, Azure Queue Storage, and Azure Functions' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure Migrate discovers and assesses on-premises VMware VMs; Azure Data Box transports 180 TB physically offline; Blob Archive Tier minimizes 10-year cold storage cost; and AVD enables Windows 11 multi-session virtual desktops.',
    distractorBreakdown: [
      { letter: 'B', reason: 'AzCopy over a factory link takes months for 180 TB, Hot Tier is costly, and ACI runs containers rather than Windows desktops.' },
      { letter: 'C', reason: 'Azure Advisor inspects existing cloud deployments rather than on-prem VMware servers.' },
      { letter: 'D', reason: 'Queue Storage and Functions do not store 180 TB CAD archives or run Windows 11 desktops.' },
    ],
    examTip:
      'Assess VMware VMs = Azure Migrate; 180 TB offline transfer = Data Box; 10-year cheapest storage = Archive Tier; Multi-session Windows 11 = AVD!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Connect VM discovery (Migrate), physical bulk shipping (Data Box), cold retention (Archive), and multi-session VDI (AVD).',
    },
  },
  {
    id: 'az900-mod12-q14',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A media platform operates a three-tier microservice architecture: 1) Frontend checkout pages run on a managed PaaS web host with automated deployment slots and zero OS patching, 2) Worker nodes must execute small event-driven thumbnail resizers billed strictly per millisecond when images arrive ($0 when idle), 3) Frontend and worker tiers decouple reliably via small <=64 KB async work-item messages inside a Storage Account, and 4) Live HTTP errors and slow SQL calls must trigger immediate distributed traces.',
    question: 'Which four Azure services align with this serverless/PaaS media architecture?',
    options: [
      { letter: 'A', text: 'Azure App Service, Azure Functions (Consumption Plan), Azure Queue Storage, and Application Insights' },
      { letter: 'B', text: 'Azure Virtual Machines, Azure Virtual Desktop, Azure Disk Storage, and Azure Status' },
      { letter: 'C', text: 'Azure Kubernetes Service, Virtual Machine Scale Sets, Azure Files, and TCO Calculator' },
      { letter: 'D', text: 'Azure Container Instances, ExpressRoute, Azure Table Storage, and Microsoft Purview' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Azure App Service provides PaaS web hosting with staging deployment slots and zero OS maintenance; Azure Functions Consumption Plan scales serverless triggers to zero ($0 idle); Queue Storage buffers <=64 KB async worker tasks; and Application Insights monitors live HTTP/SQL APM telemetry.',
    distractorBreakdown: [
      { letter: 'B', reason: 'VMs require OS patching and do not scale to $0 idle.' },
      { letter: 'C', reason: 'VMSS bills for allocated IaaS hosts and Azure Files is SMB file sharing rather than async message queues.' },
      { letter: 'D', reason: 'Table Storage stores NoSQL records and Purview handles data governance.' },
    ],
    examTip:
      'PaaS Web App + Deployment Slots = App Service; Event-driven $0 idle = Functions Consumption; Async <=64 KB queue = Queue Storage; App APM = Application Insights!',
    errorDiagnostic: {
      trapType: 'Over-Engineering',
      correctivePrescription: 'Pair PaaS/Serverless services cleanly instead of falling back to IaaS VMs.',
    },
  },
  {
    id: 'az900-mod12-q15',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'A financial audit reveals three critical gaps in a startup’s Azure environment: Gap 1: When the finance team "shuts down" a test SQL VM from inside the Windows Start Menu overnight, the Azure invoice still bills compute hours; Gap 2: Developers added a Public IP directly to an internal analytics VM and peered VNet-A ➔ VNet-B ➔ VNet-C expecting A to talk to C automatically; Gap 3: An admin assigned a "Reader" role at the Subscription level and assumed a "Contributor" role inside a child Resource Group would be blocked.',
    question: 'Which explanation accurately resolves ALL THREE architectural misunderstandings?',
    options: [
      { letter: 'A', text: '1) Stop/Deallocate via Azure Portal/CLI to halt VM compute billing; 2) VNet Peering is non-transitive (A cannot reach C via B without direct peering); 3) RBAC is additive across scopes (Contributor on the Resource Group grants write access inside that Resource Group)' },
      { letter: 'B', text: '1) Windows Start Menu shutdown deletes the VM; 2) VNet Peering is automatically transitive across 10 hops; 3) Reader at Subscription overrides Contributor at Resource Group' },
      { letter: 'C', text: '1) Billing only stops if you apply a ReadOnly lock; 2) VNet Peering goes over the public internet; 3) Azure RBAC does not apply inside Resource Groups' },
      { letter: 'D', text: '1) Only Spot VMs bill when stopped; 2) ExpressRoute is required between two VNets in the same region; 3) Contributor includes Owner RBAC delegation rights' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'All three are classic AZ-900 precision tests: 1) Shutting down in the guest OS leaves the VM "Stopped" (still billed for reserved compute) unless deallocated via Azure Portal/CLI; 2) VNet Peering is strictly non-transitive; and 3) Azure RBAC permissions are additive across scopes unless an explicit Deny Assignment blocks them.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Every clause is inverted: guest OS shutdown keeps compute allocated, peering is non-transitive, and RBAC is additive.' },
      { letter: 'C', reason: 'ReadOnly locks do not stop VM compute billing, and VNet peering stays on the private Microsoft backbone.' },
      { letter: 'D', reason: 'Standard VMs bill while Stopped (allocated), VNet Peering works in the same region, and Contributor cannot grant RBAC roles.' },
    ],
    examTip:
      'Three Golden Precision Rules: 1) Deallocate in Portal/CLI to stop compute charges; 2) VNet Peering = Private backbone & NON-transitive; 3) Azure RBAC permissions are additive downward!',
    errorDiagnostic: {
      trapType: 'Conceptual Gap',
      correctivePrescription: 'Drill the high-frequency AZ-900 gotchas: Stopped vs Deallocated, VNet non-transitivity, and RBAC additive scope.',
    },
  },
  {
    id: 'az900-mod12-q16',
    learningPathId: 3,
    learningPathTitle: 'Describe Azure Management & Governance',
    moduleId: 12,
    moduleTitle: 'Real-World Scenario Assessment & Synthesis',
    difficulty: 'Advanced',
    scenario:
      'An enterprise Security Operations Center (SOC) is completing its Zero Trust and data governance transformation: 1) External consumers must authenticate using Google or Facebook accounts, 2) Employees must sign in using FIDO2 hardware keys without any passwords, 3) Cross-cloud telemetry logs from Azure, AWS, and on-prem firewalls must correlate automatically with AI threat hunting and automated SOAR playbooks, and 4) Sensitive customer PII data across SQL, Data Lakes, and Power BI must be automatically discovered and cataloged.',
    question: 'Which four Microsoft security and governance solutions satisfy these requirements?',
    options: [
      { letter: 'A', text: 'Microsoft Entra External ID, Entra Passwordless Authentication (FIDO2), Microsoft Sentinel, and Microsoft Purview' },
      { letter: 'B', text: 'Active Directory Domain Services only, Multi-Factor Security Questions, Azure Advisor, and Azure Files' },
      { letter: 'C', text: 'Azure RBAC Reader, Static Shared Keys, Azure Service Health, and Azure Pricing Calculator' },
      { letter: 'D', text: 'Network Security Groups, Azure Bastion, Application Insights, and Azure Data Box' },
    ],
    correctAnswer: 'A',
    whyCorrect:
      'Microsoft Entra External ID supports external consumer social logins (B2C/B2B); Entra Passwordless FIDO2 keys eliminate passwords; Microsoft Sentinel delivers SIEM/SOAR threat hunting and automated playbooks across clouds; and Microsoft Purview catalogs and classifies enterprise PII data.',
    distractorBreakdown: [
      { letter: 'B', reason: 'Security questions are weak knowledge factors, Advisor is not a SIEM/SOAR platform, and Azure Files is file storage.' },
      { letter: 'C', reason: 'Service Health tracks platform outages rather than multi-cloud threat hunting.' },
      { letter: 'D', reason: 'Application Insights tracks app APM performance rather than SIEM threat analytics or PII data governance.' },
    ],
    examTip:
      'Consumer social login = Entra External ID; Hardware key no-password = FIDO2 Passwordless; SIEM/SOAR = Microsoft Sentinel; PII Data Catalog = Microsoft Purview!',
    errorDiagnostic: {
      trapType: 'Service Scope Confusion',
      correctivePrescription: 'Distinguish Entra External ID, Passwordless FIDO2, Sentinel (SIEM/SOAR), and Purview (Data Governance).',
    },
  },
];
