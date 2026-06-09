export type Org = {
  wallet: string
  name: string
  tagline: string
  description: string
  category: string
  founded: string
  location: string
  teamSize: number
  sector: string
  website?: string
}

export type Milestone = {
  id: number
  title: string
  completedAt?: string
}

export type ShowcaseProject = {
  id: string
  orgWallet: string
  title: string
  description: string
  tags: string[]
  status: 'active' | 'completed'
  fundingAmount: number
  milestones: Milestone[]
}

export type ProjectMeta = {
  proposalId: number
  orgWallet: string
  title: string
  description: string
  milestones: Milestone[]
}

export type ProposalText = {
  title: string
  description: string
  requestedAmount: string
  orgWallet?: string
  proposalId?: number
}

const SEED_ORGS: Org[] = [
  {
    wallet: '0xE3FE175f63074033Adaf65e01A5417aAE852C721',
    name: 'OpenMind Labs',
    tagline: 'Autonomous agents that reason, plan, and act',
    description: 'OpenMind Labs builds AI agents capable of long-horizon planning and autonomous tool use. Our research spans memory architectures, multi-step reasoning, and multi-agent coordination for real-world tasks.',
    category: 'Autonomous Agents',
    founded: '2022',
    location: 'San Francisco, CA',
    teamSize: 12,
    sector: 'AI Research',
    website: 'openmindlabs.ai',
  },
  {
    wallet: '0x6357265F97f32811d4AA0881D4566CC61953a7E4',
    name: 'Axiom AI',
    tagline: 'Formal verification for trustworthy ML systems',
    description: 'Axiom AI applies formal methods to verify safety properties of neural networks. Our tooling proves behavior bounds, detects adversarial vulnerabilities, and provides certifiable guarantees for deployed models.',
    category: 'ML Safety',
    founded: '2023',
    location: 'London, UK',
    teamSize: 6,
    sector: 'AI Safety',
    website: 'axiom.ai',
  },
  {
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    name: 'NeuralStack',
    tagline: 'Open infrastructure for the next generation of AI',
    description: 'NeuralStack builds open-source tooling for distributed ML training, inference optimization, and GPU memory management. Our SDK is trusted by over 200 research teams globally and has processed 400M+ training runs.',
    category: 'ML Infrastructure',
    founded: '2021',
    location: 'Remote',
    teamSize: 18,
    sector: 'Infrastructure',
    website: 'neuralstack.dev',
  },
  {
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    name: 'Meridian Research',
    tagline: 'Multimodal reasoning at the frontier',
    description: 'Meridian Research explores vision, language, and structured reasoning. We develop evaluation frameworks, open datasets, and model architectures that advance the state of multimodal AI understanding.',
    category: 'Multimodal AI',
    founded: '2024',
    location: 'New York, NY',
    teamSize: 8,
    sector: 'Multimodal Research',
    website: 'meridianresearch.org',
  },
]

const SEED_SHOWCASE: ShowcaseProject[] = [
  // ── OpenMind Labs ────────────────────────────────────────────────────
  {
    id: 'oml-1',
    orgWallet: '0xE3FE175f63074033Adaf65e01A5417aAE852C721',
    title: 'Autonomous Research Agent',
    description: 'An end-to-end agent capable of reading papers, designing experiments, executing code, and synthesizing findings — closing the loop between hypothesis and result.',
    tags: ['agents', 'reasoning', 'benchmarks'],
    status: 'active',
    fundingAmount: 8000,
    milestones: [
      { id: 0, title: 'Literature review & baseline benchmarks', completedAt: '2026-04-10' },
      { id: 1, title: 'Prototype agent framework', completedAt: '2026-04-28' },
      { id: 2, title: 'Tool-use & code execution integration', completedAt: '2026-05-15' },
      { id: 3, title: 'Evaluation suite & ablation study', completedAt: undefined },
      { id: 4, title: 'Paper submission & open-source release', completedAt: undefined },
    ],
  },
  {
    id: 'oml-2',
    orgWallet: '0xE3FE175f63074033Adaf65e01A5417aAE852C721',
    title: 'Persistent Memory Architecture',
    description: 'A hierarchical memory system for agents, combining episodic recall, semantic compression, and retrieval-augmented generation to enable coherent long-horizon behaviour.',
    tags: ['memory', 'RAG', 'architecture'],
    status: 'active',
    fundingAmount: 4500,
    milestones: [
      { id: 0, title: 'Architecture spec & prior art review', completedAt: '2026-05-01' },
      { id: 1, title: 'Core memory engine implementation', completedAt: undefined },
      { id: 2, title: 'Retrieval benchmark & tuning', completedAt: undefined },
      { id: 3, title: 'Integration with agent framework', completedAt: undefined },
    ],
  },
  // ── Axiom AI ─────────────────────────────────────────────────────────
  {
    id: 'axm-1',
    orgWallet: '0x6357265F97f32811d4AA0881D4566CC61953a7E4',
    title: 'Formal Verifier v1.0',
    description: 'A complete SMT-based verification toolchain for feedforward and transformer networks. Proves input-output safety properties and generates counterexamples on violation.',
    tags: ['formal-methods', 'safety', 'SMT'],
    status: 'completed',
    fundingAmount: 12000,
    milestones: [
      { id: 0, title: 'Specification language design', completedAt: '2026-01-15' },
      { id: 1, title: 'Core proof engine (Z3 backend)', completedAt: '2026-02-10' },
      { id: 2, title: 'Neural network adapter layer', completedAt: '2026-03-05' },
      { id: 3, title: 'CLI tooling & documentation', completedAt: '2026-03-28' },
      { id: 4, title: 'v1.0 release & NeurIPS submission', completedAt: '2026-04-20' },
    ],
  },
  {
    id: 'axm-2',
    orgWallet: '0x6357265F97f32811d4AA0881D4566CC61953a7E4',
    title: 'Type-Safe Neural Networks',
    description: 'A type system for tensor programs that catches shape errors at compile time, enforces invariants across training and inference, and generates verifiable proof certificates.',
    tags: ['type-systems', 'tensors', 'compilers'],
    status: 'active',
    fundingAmount: 6000,
    milestones: [
      { id: 0, title: 'Type algebra & soundness proofs', completedAt: '2026-04-20' },
      { id: 1, title: 'Compiler pass for PyTorch', completedAt: '2026-05-18' },
      { id: 2, title: 'Runtime enforcement layer', completedAt: undefined },
      { id: 3, title: 'Open beta & feedback collection', completedAt: undefined },
    ],
  },
  // ── NeuralStack ──────────────────────────────────────────────────────
  {
    id: 'nst-1',
    orgWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    title: 'Distributed Training SDK v2',
    description: 'A zero-config SDK for distributing training across heterogeneous GPU clusters. Handles sharding, fault tolerance, checkpointing, and communication scheduling automatically.',
    tags: ['distributed', 'training', 'GPU'],
    status: 'active',
    fundingAmount: 15000,
    milestones: [
      { id: 0, title: 'Cluster topology discovery module', completedAt: '2026-03-12' },
      { id: 1, title: 'Automatic sharding engine', completedAt: '2026-04-05' },
      { id: 2, title: 'Fault tolerance & checkpointing', completedAt: '2026-05-02' },
      { id: 3, title: 'Communication scheduling optimiser', completedAt: undefined },
      { id: 4, title: 'Benchmarking & documentation', completedAt: undefined },
    ],
  },
  {
    id: 'nst-2',
    orgWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    title: 'Unified Benchmark Suite',
    description: 'A standardised evaluation harness covering training throughput, memory efficiency, and convergence speed across 12 major model architectures and 5 hardware configurations.',
    tags: ['benchmarking', 'evaluation', 'tooling'],
    status: 'completed',
    fundingAmount: 5000,
    milestones: [
      { id: 0, title: 'Benchmark design & metric selection', completedAt: '2026-02-01' },
      { id: 1, title: 'Implementation for 6 architectures', completedAt: '2026-02-25' },
      { id: 2, title: 'Hardware configuration suite', completedAt: '2026-03-18' },
      { id: 3, title: 'Public dashboard & dataset release', completedAt: '2026-04-10' },
    ],
  },
  {
    id: 'nst-3',
    orgWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    title: 'GPU Memory Optimizer',
    description: 'Compiler-level optimisations for reducing peak GPU memory usage in transformer training, enabling 2x larger batch sizes without additional hardware.',
    tags: ['memory', 'compilers', 'optimization'],
    status: 'active',
    fundingAmount: 7500,
    milestones: [
      { id: 0, title: 'Memory profiler & bottleneck analysis', completedAt: undefined },
      { id: 1, title: 'Gradient checkpoint integration', completedAt: undefined },
      { id: 2, title: 'Activation recomputation engine', completedAt: undefined },
    ],
  },
  // ── Meridian Research ────────────────────────────────────────────────
  {
    id: 'mrd-1',
    orgWallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    title: 'Vision–Language Reasoning Bridge',
    description: 'A novel architecture that tightly couples visual grounding with chain-of-thought reasoning, enabling models to solve multi-step visual problems with explicit interpretable steps.',
    tags: ['multimodal', 'vision', 'reasoning'],
    status: 'active',
    fundingAmount: 9000,
    milestones: [
      { id: 0, title: 'Architecture design & baseline', completedAt: '2026-05-10' },
      { id: 1, title: 'Visual grounding module', completedAt: undefined },
      { id: 2, title: 'Reasoning chain integration', completedAt: undefined },
      { id: 3, title: 'Evaluation on VQA benchmarks', completedAt: undefined },
    ],
  },
  {
    id: 'mrd-2',
    orgWallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    title: 'Multimodal Evaluation Framework',
    description: 'An open evaluation framework for multimodal models covering compositional reasoning, spatial understanding, and temporal coherence across image, video, and audio inputs.',
    tags: ['evaluation', 'datasets', 'open-source'],
    status: 'active',
    fundingAmount: 4000,
    milestones: [
      { id: 0, title: 'Taxonomy & task design', completedAt: '2026-05-20' },
      { id: 1, title: 'Dataset collection & annotation', completedAt: undefined },
      { id: 2, title: 'Evaluation harness implementation', completedAt: undefined },
    ],
  },
]

// ── Explore-only orgs (not in TrackFund portfolio) ───────────────────

const EXPLORE_ORGS: Org[] = [
  {
    wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    name: 'Cognition Systems',
    tagline: 'Working memory and cognitive architecture for AI agents',
    description: 'Cognition Systems researches biologically-inspired working memory models for AI. We bridge cognitive science and deep learning to build agents that maintain coherent context across arbitrarily long tasks.',
    category: 'Cognitive AI',
    founded: '2024',
    location: 'Boston, MA',
    teamSize: 5,
    sector: 'Cognitive AI',
    website: 'cognitionsys.ai',
  },
  {
    wallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    name: 'VeritasAI',
    tagline: 'Mechanistic interpretability at scale',
    description: 'VeritasAI builds tools that map neural network computations to human-readable circuits. Our mission is to make every weight in a frontier model interpretable before it ships.',
    category: 'Interpretability',
    founded: '2025',
    location: 'Cambridge, UK',
    teamSize: 4,
    sector: 'AI Safety',
    website: 'veritas.ai',
  },
  {
    wallet: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    name: 'QuantumMind',
    tagline: 'Quantum-classical hybrid inference for structured reasoning',
    description: 'QuantumMind explores variational quantum circuits as inference primitives for structured prediction. Our hybrid architecture achieves exponential speedups on constraint-satisfaction tasks that stump classical models.',
    category: 'Quantum ML',
    founded: '2025',
    location: 'Zurich, CH',
    teamSize: 7,
    sector: 'Quantum ML',
    website: 'quantummind.io',
  },
  {
    wallet: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    name: 'SynthLab',
    tagline: 'Synthetic data pipelines for frontier model training',
    description: 'SynthLab generates high-fidelity synthetic datasets tailored for pretraining and fine-tuning frontier models. Our domain-adaptive generator produces data that closes the train-eval gap across 40+ benchmarks.',
    category: 'Data Infrastructure',
    founded: '2023',
    location: 'Singapore',
    teamSize: 9,
    sector: 'Data Infrastructure',
    website: 'synthlab.ai',
  },
]

const EXPLORE_SHOWCASE: ShowcaseProject[] = [
  // ── Cognition Systems ────────────────────────────────────────────────
  {
    id: 'cog-1',
    orgWallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    title: 'Episodic Memory Engine v1',
    description: 'A differentiable episodic memory module that stores and retrieves task-relevant episodes, enabling agents to avoid repeating mistakes across multi-session interactions.',
    tags: ['memory', 'agents', 'episodic'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Memory encoding & retrieval spec', completedAt: '2026-05-10' },
      { id: 1, title: 'Differentiable write/read implementation', completedAt: undefined },
      { id: 2, title: 'Long-context agent integration', completedAt: undefined },
      { id: 3, title: 'Benchmark on LoCoMo & AgentBench', completedAt: undefined },
    ],
  },
  {
    id: 'cog-2',
    orgWallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    title: 'Cognitive Load Estimator',
    description: 'Real-time estimation of an agent\'s cognitive load to dynamically allocate compute and throttle task complexity — preventing catastrophic forgetting under high-load conditions.',
    tags: ['agents', 'compute', 'architecture'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Load signal definition & labelling', completedAt: undefined },
      { id: 1, title: 'Estimator model training', completedAt: undefined },
      { id: 2, title: 'Dynamic compute scheduler', completedAt: undefined },
    ],
  },
  // ── VeritasAI ────────────────────────────────────────────────────────
  {
    id: 'vrt-1',
    orgWallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    title: 'Circuit-Level Interpretability Toolkit',
    description: 'An automated pipeline that identifies and labels functional circuits in transformer models — attention heads, MLP features, and residual pathways — and maps them to semantic concepts.',
    tags: ['interpretability', 'mechanistic', 'circuits'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Activation patching framework', completedAt: '2026-04-18' },
      { id: 1, title: 'Automated circuit discovery', completedAt: '2026-05-22' },
      { id: 2, title: 'Concept labeling & visualization', completedAt: undefined },
      { id: 3, title: 'Open-source release + paper', completedAt: undefined },
    ],
  },
  // ── QuantumMind ──────────────────────────────────────────────────────
  {
    id: 'qm-1',
    orgWallet: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    title: 'Variational Quantum Classifier',
    description: 'A hybrid quantum-classical classifier using parameterized quantum circuits as feature extractors and a classical head for structured prediction on tabular and graph data.',
    tags: ['quantum', 'hybrid', 'classification'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Circuit architecture design', completedAt: '2026-05-01' },
      { id: 1, title: 'Quantum simulator backend', completedAt: '2026-05-30' },
      { id: 2, title: 'Hardware deployment on IBM Quantum', completedAt: undefined },
      { id: 3, title: 'Benchmark vs. classical baselines', completedAt: undefined },
    ],
  },
  // ── SynthLab ─────────────────────────────────────────────────────────
  {
    id: 'syn-1',
    orgWallet: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    title: 'Domain-Adaptive Synthetic Data Generator',
    description: 'A generative pipeline that synthesizes domain-specific training data with controllable difficulty, diversity, and factual accuracy — tunable via a declarative config.',
    tags: ['synthetic-data', 'training', 'generation'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Generation architecture & config spec', completedAt: '2026-04-05' },
      { id: 1, title: 'Domain adapter modules (5 domains)', completedAt: '2026-05-12' },
      { id: 2, title: 'Quality filtering & deduplication pipeline', completedAt: undefined },
      { id: 3, title: 'Public dataset release & paper', completedAt: undefined },
    ],
  },
  {
    id: 'syn-2',
    orgWallet: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    title: 'Multimodal Synthetic Benchmark Suite',
    description: 'Cross-modal evaluation datasets spanning image-text, video-text, and audio-text pairs — all synthetically generated with ground-truth labels and adversarial perturbations.',
    tags: ['multimodal', 'benchmarks', 'evaluation'],
    status: 'active',
    fundingAmount: 0,
    milestones: [
      { id: 0, title: 'Taxonomy and task design', completedAt: undefined },
      { id: 1, title: 'Image-text pair generation (100K)', completedAt: undefined },
      { id: 2, title: 'Video & audio modality expansion', completedAt: undefined },
    ],
  },
]

const g = globalThis as any

const STORE_KEY = '__tfStore_v4'

if (!g[STORE_KEY]) {
  const orgs = new Map<string, Org>()
  const projects = new Map<number, ProjectMeta>()
  const proposals = new Map<string, ProposalText>()
  const showcase = new Map<string, ShowcaseProject>()
  const discoverOrgs = new Map<string, Org>()
  const discoverShowcase = new Map<string, ShowcaseProject>()

  SEED_ORGS.forEach(o => orgs.set(o.wallet.toLowerCase(), o))
  SEED_SHOWCASE.forEach(p => showcase.set(p.id, p))
  EXPLORE_ORGS.forEach(o => discoverOrgs.set(o.wallet.toLowerCase(), o))
  EXPLORE_SHOWCASE.forEach(p => discoverShowcase.set(p.id, p))

  g[STORE_KEY] = { orgs, projects, proposals, showcase, discoverOrgs, discoverShowcase }
}

export const store = g[STORE_KEY] as {
  orgs: Map<string, Org>
  projects: Map<number, ProjectMeta>
  proposals: Map<string, ProposalText>
  showcase: Map<string, ShowcaseProject>
  discoverOrgs: Map<string, Org>
  discoverShowcase: Map<string, ShowcaseProject>
}
