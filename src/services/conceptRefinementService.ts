export interface ConceptRefinementRequest {
  question: string;
  scenario?: string;
  correctAnswer: string;
  correctAnswerText?: string;
  whyCorrect?: string;
  distractorBreakdown?: Array<{ letter: string; reason: string }>;
  learningPathId: number;
  learningPathTitle: string;
  moduleId: number;
  moduleTitle: string;
  difficulty?: string;
  refinementType?: 'simpler_analogy' | 'real_world_mapping' | 'both';
}

export interface ConceptRefinementResult {
  conceptName: string;
  analogyTitle: string;
  simplerAnalogy: string;
  analogyCoreTakeaway: string;
  realWorldRole: string;
  realWorldMapping: string;
  businessValue: string;
  examMemoryAnchor: string;
  isAiGenerated: boolean;
  moduleId: number;
  moduleTitle: string;
}

/**
 * Curated offline domain fallbacks for all 12 AZ-900 modules, ensuring instant,
 * dependable, high-fidelity analogy & real-world mapping generation at all times.
 */
const MODULE_DOMAIN_DEFAULTS: Record<number, Omit<ConceptRefinementResult, 'isAiGenerated' | 'moduleId' | 'moduleTitle'>> = {
  1: {
    conceptName: 'Cloud Deployment Models (Public, Private, Hybrid)',
    analogyTitle: 'Public Transit vs. Personal Car vs. Commuter Train',
    simplerAnalogy:
      'Public Cloud is like taking the high-speed commuter train—you share the infrastructure with everyone else, pay for your seat, and maintenance is handled by the railway. Private Cloud is owning your personal vehicle—you bear 100% of fuel and repair costs, but control every seat. Hybrid Cloud is keeping your car in the garage for confidential tasks while riding the commuter train during peak festival rushes.',
    analogyCoreTakeaway: 'Hybrid gives you the exact blend: sovereign security for sensitive legacy data plus public elasticity for peak consumer demand.',
    realWorldRole: 'Chief Information Security Officer & Cloud Architect',
    realWorldMapping:
      'A commercial bank keeps customer credit ratings and regulatory ledger transactions on-premises inside a secured private datacenter, while hosting its public-facing mobile mortgage simulator and marketing portal in Azure App Service.',
    businessValue: 'Full financial regulatory compliance combined with infinite public cloud elastic scaling.',
    examMemoryAnchor: 'Hybrid = On-Premises + Public Cloud interconnected. Private = 100% single tenant.',
  },
  2: {
    conceptName: 'Cloud Benefits (High Availability, Scalability, Elasticity & Agility)',
    analogyTitle: 'The Restaurant Dining Room vs. The Event Marquee',
    simplerAnalogy:
      'Scalability is like remodeling a restaurant by adding a permanent second floor when business permanently triples. Elasticity is setting up pop-up banquet tables during Saturday dinner rush and folding them away by 11:00 PM so you only pay for what you actually used. Agility is the kitchen immediately printing a brand-new digital menu overnight without ordering paper stock.',
    analogyCoreTakeaway: 'Scalability handles planned growth; Elasticity automates sudden spikes and valleys in demand.',
    realWorldRole: 'Lead Site Reliability Engineer (SRE)',
    realWorldMapping:
      'During Black Friday flash sales, an e-commerce retailer configures Azure Virtual Machine Scale Sets to automatically scale from 4 instances to 40 instances as CPU load crosses 75%, then immediately spins down at midnight to avoid paying for idle compute.',
    businessValue: 'Zero website crashes under traffic surges with 60% compute cost savings during off-peak hours.',
    examMemoryAnchor: 'Elasticity = automatic scaling up/down to match demand; Scalability = ability to handle growth.',
  },
  3: {
    conceptName: 'Cloud Pricing & Consumption (CapEx vs. OpEx)',
    analogyTitle: 'Purchasing a Commercial Building vs. Monthly Serviced Co-Working',
    simplerAnalogy:
      'Capital Expenditure (CapEx) is purchasing a skyscraper upfront with a 20-year bank loan—you pay massive upfront cash for concrete, elevators, and cooling, whether your office is full or empty. Operational Expenditure (OpEx) is renting serviced desks at a modern co-working hub—no construction costs, no maintenance headaches, and you cancel or add desks monthly based on headcount.',
    analogyCoreTakeaway: 'Cloud shifts you from massive upfront capital commitments (CapEx) to flexible ongoing consumption (OpEx).',
    realWorldRole: 'FinOps Director & IT Procurement Manager',
    realWorldMapping:
      'Instead of spending $450,000 upfront on physical servers, cooling chillers, and generator backups for a new branch office, the finance team allocates a $3,200 monthly Azure operational subscription line item tied directly to software revenue.',
    businessValue: 'Zero upfront capital write-offs with immediate tax deductibility of operating costs in the current year.',
    examMemoryAnchor: 'CapEx = upfront capital expense with depreciation; OpEx = ongoing operational pay-as-you-go.',
  },
  4: {
    conceptName: 'Core Architectural Components (Regions, Availability Zones & Management Groups)',
    analogyTitle: 'City Power Grids & Substation Isolation',
    simplerAnalogy:
      'An Azure Region is a metropolitan city like Nairobi or London. Availability Zones are three independent power substations located 15 miles apart within that same city—each with its own independent power generators, flood pumps, and fiber feeds. If a transformer explosion knocks out Zone 1, Zones 2 and 3 keep your intensive care monitors running without missing a heartbeat.',
    analogyCoreTakeaway: 'Availability Zones protect against single datacenter failures within the same geographical region.',
    realWorldRole: 'Principal Cloud Infrastructure Architect',
    realWorldMapping:
      'A hospital management system deploys zone-redundant Azure SQL databases across Availability Zones 1, 2, and 3 in East US. Synchronous replication ensures instantaneous automatic failover in under 2 seconds if a physical facility sustains an emergency outage.',
    businessValue: '99.99% service level uptime agreement with sub-second disaster recovery failover.',
    examMemoryAnchor: 'Availability Zones = independent power, cooling, and networking within one region (minimum 3 zones).',
  },
  5: {
    conceptName: 'Azure Compute & Networking (VMs, Containers, VNets & ExpressRoute)',
    analogyTitle: 'The Public Highway vs. Dedicated Private Rail Spur',
    simplerAnalogy:
      'A VPN Gateway over the public internet is like sending delivery vans down a public highway—the traffic is encrypted in an armored truck, but you still share the highway lanes with civilian traffic and weather delays. Azure ExpressRoute is laying your own private direct railway line from your factory loading dock straight into Azure datacenters—never touching public asphalt, totally immune to public internet congestion.',
    analogyCoreTakeaway: 'ExpressRoute bypasses the public internet completely, giving ultra-low latency and maximum security.',
    realWorldRole: 'Enterprise Network Engineering Lead',
    realWorldMapping:
      'A global financial exchange establishes a dedicated 10 Gbps ExpressRoute connection between its on-premises trading floor in Frankfurt and Azure West Europe, ensuring sub-5ms trade executions without traversing public ISP routes.',
    businessValue: 'Predictable high-throughput data transfers with complete isolation from internet cyber threats.',
    examMemoryAnchor: 'ExpressRoute = private fiber connection bypassing public internet. VPN = encrypted over public internet.',
  },
  6: {
    conceptName: 'Azure Storage Services & Redundancy (Blob Tiers & Replication)',
    analogyTitle: 'The Desk Notepad vs. The Bank Safety Vault',
    simplerAnalogy:
      'Storage Tiers are like document management: Hot Tier is the notepad on your desk (instant access, cheap transactions, higher monthly storage cost). Cool Tier is the binder in the hallway cabinet (accessed once a month). Cold Tier is the storage box in the basement. Archive Tier is a bank safety deposit vault (takes up to 15 hours of rehydration to retrieve, but costs pennies per terabyte).',
    analogyCoreTakeaway: 'Match access frequency to storage tier to optimize cloud spend by up to 90%.',
    realWorldRole: 'Data Engineering Lead & Compliance Officer',
    realWorldMapping:
      'A healthcare radiology network stores patient X-rays in Hot Blob Storage during the first 30 days of active diagnosis, automatically moves them to Cool after 60 days via Lifecycle Management, and migrates to Archive after 365 days to meet 7-year legal retention mandates.',
    businessValue: '85% reduction in multi-terabyte medical image storage expenditure.',
    examMemoryAnchor: 'LRS = 3 copies 1 datacenter; ZRS = 3 zones 1 region; GRS = 3 primary + 3 secondary region (6 copies total).',
  },
  7: {
    conceptName: 'Azure Identity, Access & Security (Microsoft Entra ID, RBAC & Zero Trust)',
    analogyTitle: 'Airport Passport Control (AuthN) vs. First-Class Boarding Pass (AuthZ)',
    simplerAnalogy:
      'Authentication (AuthN) is the border control officer inspecting your biometric passport to prove you are who you claim to be. Authorization (AuthZ / RBAC) is the flight attendant checking your boarding pass at the jet bridge—even with a valid verified passport, you are only allowed to sit in Economy seat 14B, not in the cockpit (Least Privilege). Zero Trust means checking the ticket at every single connecting doorway, never assuming trust because you passed the front gate.',
    analogyCoreTakeaway: 'Authentication proves identity; RBAC controls precise permissions; Zero Trust verifies explicitly every time.',
    realWorldRole: 'Identity & Access Management (IAM) Specialist',
    realWorldMapping:
      'A consulting firm assigns external auditors the built-in "Reader" role on production Resource Groups through Microsoft Entra PIM with Multi-Factor Authentication, ensuring auditors can inspect billing invoices without permission to delete virtual machines.',
    businessValue: 'Elimination of credential theft risks and strict adherence to the Principle of Least Privilege.',
    examMemoryAnchor: 'Authentication = Who you are (411); Authorization = What you can do (RBAC). Always assume breach.',
  },
  8: {
    conceptName: 'Azure Governance, Resource Locks & Policy',
    analogyTitle: 'City Building Codes (Policy) vs. Lock-out Tag-out Padlocks (Resource Locks)',
    simplerAnalogy:
      'Azure Policy is like municipal building codes—inspectors will not approve any construction plan unless fire exits, smoke alarms, and permitted materials are in place. A Resource Lock is the physical yellow padlock over the main electrical circuit breaker—even the building owner or mayor cannot flip the switch until the padlock is deliberately removed.',
    analogyCoreTakeaway: 'Policies enforce standard guardrails; Resource Locks prevent accidental deletion or modification regardless of role.',
    realWorldRole: 'Governance & Cloud Operations Lead',
    realWorldMapping:
      'An enterprise applies an Azure Policy requiring all new storage accounts to mandate HTTPS encryption, while placing a "CanNotDelete" Resource Lock on the central production virtual network and customer database.',
    businessValue: 'Zero accidental outages caused by junior admin misclicks during late-night maintenance windows.',
    examMemoryAnchor: 'CanNotDelete = Read and modify allowed, delete blocked; ReadOnly = Read only, modify/delete blocked.',
  },
  9: {
    conceptName: 'Azure Monitoring & Management Tools (Azure Advisor & Monitor)',
    analogyTitle: 'The Car Dashboard Gauges vs. The Personal Financial Advisor',
    simplerAnalogy:
      'Azure Monitor is your vehicle dashboard with real-time speedometers, oil temperature gauges, and engine warning lights that chime when you drift out of lane. Azure Advisor is the seasoned mechanic and financial planner sitting in the passenger seat who reviews your logbook and says: "You are running high-octane premium gas in a commuter engine—switch to regular gas to save $400 monthly."',
    analogyCoreTakeaway: 'Azure Monitor tracks live telemetry and telemetry alerts; Azure Advisor gives proactive optimization recommendations.',
    realWorldRole: 'Cloud Infrastructure & DevOps Engineer',
    realWorldMapping:
      'DevOps teams configure Azure Monitor metric alerts to trigger Webhook notifications to Microsoft Teams when database DTU utilization exceeds 85%, while monthly management reviews implement Azure Advisor Cost recommendations to shut down underutilized development VMs.',
    businessValue: 'Immediate incident triage before customers notice sluggish response times.',
    examMemoryAnchor: 'Advisor focuses on 5 pillars: Cost, Security, Reliability, Operational Excellence, and Performance.',
  },
  10: {
    conceptName: 'Azure Privacy, Compliance & Trust Center',
    analogyTitle: 'The Certified ISO Inspector & Public Safety Registry',
    simplerAnalogy:
      'Trust Center is the public showroom where a manufacturer proudly posts all its safety certificates, crash-test ratings, and privacy pledges. Service Trust Portal is the secure filing cabinet where authorized customers can download full third-party audit reports, SOC2 attestations, and ISO certificates to prove to their own national regulators that the facility meets all standards.',
    analogyCoreTakeaway: 'Microsoft Learn Trust resources provide legally certified documentation to pass enterprise regulatory audits.',
    realWorldRole: 'Enterprise Compliance & Legal Counsel',
    realWorldMapping:
      'A fintech startup in Kenya preparing for central bank approval downloads Azure ISO/IEC 27001 and SOC 1 Type 2 audit reports from the Service Trust Portal to present directly to government financial regulators.',
    businessValue: 'Accelerates regulatory licensing by months by inheriting Azure physical security certifications.',
    examMemoryAnchor: 'Service Trust Portal = access to independent audit reports; Trust Center = high-level privacy principles.',
  },
  11: {
    conceptName: 'Resource Deployment & Infrastructure as Code (ARM & Bicep)',
    analogyTitle: 'The Modular Architectural Blueprint vs. Hand-laying Bricks',
    simplerAnalogy:
      'Clicking around the Azure Portal to build servers by hand is like an architect walking around with a wheelbarrow laying bricks one by one—slow, exhausting, and prone to forgetting a window. Bicep and ARM Templates are digitized architectural blueprints: you write the exact house specifications once in clean code, and Azure spins up 50 identical earthquake-proof houses in 4 minutes with zero human error.',
    analogyCoreTakeaway: 'Infrastructure as Code provides repeatable, declarative, error-free environments across staging and production.',
    realWorldRole: 'DevOps & Automation Architect',
    realWorldMapping:
      'A software agency defines its entire multi-tier web application—VNet, App Service, Key Vault, and Database—in a single Bicep file. When onboarding a new enterprise client, a GitHub Actions CI/CD pipeline deploys the complete isolated environment in 6 minutes.',
    businessValue: 'Reduces staging environment deployment time from 2 business days to under 10 minutes.',
    examMemoryAnchor: 'Bicep/ARM = declarative JSON/Bicep syntax. Desired state is defined; Azure handles execution.',
  },
  12: {
    conceptName: 'Azure SLAs & Service Lifecycle',
    analogyTitle: 'The Multi-Flight Connection Guarantee (Composite SLA)',
    simplerAnalogy:
      'If your first flight from Nairobi to London has a 99% on-time record, and your connecting flight from London to New York has a 99% on-time record, your chance of arriving on time for the complete journey is NOT 99%—it is 99% x 99% = 98.01%! In Azure, when you chain services together (e.g. App Service + SQL Database), you must multiply their individual SLAs to find the real composite uptime guarantee.',
    analogyCoreTakeaway: 'Composite SLA is always lower than the individual service SLAs when services depend on each other in series.',
    realWorldRole: 'Enterprise Solutions Architect',
    realWorldMapping:
      'When designing an online banking portal with an App Service (99.95% SLA) and Azure SQL Database (99.99% SLA), the lead architect calculates the composite SLA as 99.95% x 99.99% = 99.94% (maximum allowed downtime: ~52 minutes per year).',
    businessValue: 'Accurate contractual uptime promises to enterprise customers preventing costly penalty rebates.',
    examMemoryAnchor: 'Composite SLA = multiply individual component SLAs (e.g. 99.9% x 99.9% = 99.8%). Preview = No SLA.',
  },
};

/**
 * Calls the backend `/api/ai/refine-concept` endpoint to dynamically generate
 * simpler analogies and real-world mappings with Google Gemini.
 * Gracefully falls back to module-specific curated domain knowledge on any error.
 */
export async function refineConceptWithAi(
  request: ConceptRefinementRequest
): Promise<ConceptRefinementResult> {
  const modId = request.moduleId || 1;
  const fallback = MODULE_DOMAIN_DEFAULTS[modId] || MODULE_DOMAIN_DEFAULTS[1];

  try {
    const res = await fetch('/api/ai/refine-concept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data?.refinement && typeof data.refinement.simplerAnalogy === 'string') {
      return {
        conceptName: data.refinement.conceptName || request.correctAnswerText || fallback.conceptName,
        analogyTitle: data.refinement.analogyTitle || fallback.analogyTitle,
        simplerAnalogy: data.refinement.simplerAnalogy,
        analogyCoreTakeaway: data.refinement.analogyCoreTakeaway || fallback.analogyCoreTakeaway,
        realWorldRole: data.refinement.realWorldRole || fallback.realWorldRole,
        realWorldMapping: data.refinement.realWorldMapping || fallback.realWorldMapping,
        businessValue: data.refinement.businessValue || fallback.businessValue,
        examMemoryAnchor: data.refinement.examMemoryAnchor || fallback.examMemoryAnchor,
        isAiGenerated: true,
        moduleId: request.moduleId,
        moduleTitle: request.moduleTitle,
      };
    }

    throw new Error('Malformed AI refinement response structure');
  } catch (err) {
    // Return high-fidelity domain fallback
    return {
      ...fallback,
      conceptName: request.correctAnswerText || fallback.conceptName,
      isAiGenerated: false,
      moduleId: request.moduleId,
      moduleTitle: request.moduleTitle,
    };
  }
}

/**
 * Formats a ConceptRefinementResult into a clean copyable markdown snippet.
 */
export function formatRefinementMarkdown(result: ConceptRefinementResult): string {
  return `### 💡 AZ-900 Concept Refinement: ${result.conceptName} (Module ${result.moduleId}: ${result.moduleTitle})

#### 🚊 Simpler Analogy: ${result.analogyTitle}
${result.simplerAnalogy}

*Core Takeaway:* ${result.analogyCoreTakeaway}

---

#### 🏢 Real-World Enterprise Mapping (${result.realWorldRole})
${result.realWorldMapping}

*Business Value:* ${result.businessValue}

---

> ⚡ **AZ-900 Exam Memory Anchor:** ${result.examMemoryAnchor}
`;
}
