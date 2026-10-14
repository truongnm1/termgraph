import { KnowledgeNode } from './types';

export const initialKnowledgeBase: KnowledgeNode = {
  id: 'networking-root',
  name: 'NETWORKING',
  description: 'The fundamental architecture and communication protocols enabling data exchange between distributed computing systems.',
  children: [
    {
      id: 'lan',
      name: 'LAN',
      description: 'Local Area Network. A computer network interconnecting computers within a limited area such as a residence, school, or office building, offering high data-transfer rates and low latency.',
      children: [
        {
          id: 'ethernet',
          name: 'Ethernet',
          description: 'Standard local network technology defining physical and link layer cabling, frame formats, and MAC addressing mechanisms.'
        },
        {
          id: 'wlan',
          name: 'WLAN',
          description: 'Wireless Local Area Network linking devices through high-frequency radio spectrum according to IEEE 802.11 standards.'
        }
      ]
    },
    {
      id: 'vlan',
      name: 'VLAN',
      description: 'Virtual Local Area Network. A logical subnetwork that groups together collections of network devices across multiple physical switches into isolated broadcast domains, improving security, manageability, and traffic isolation.',
      children: [
        {
          id: 'vlan-tagging',
          name: '802.1Q Tagging',
          description: 'Networking standard supporting VLANs on Ethernet by inserting a 4-byte tag field into frame headers to identify VLAN membership.'
        },
        {
          id: 'trunking',
          name: 'Trunking',
          description: 'A point-to-point link configured between switches or routers that carries traffic for multiple distinct VLANs simultaneously.'
        }
      ]
    },
    {
      id: 'wan',
      name: 'WAN',
      description: 'Wide Area Network. Telecommunications network extending across large geographic regions connecting distributed campuses, data centers, and cloud providers.',
      children: [
        {
          id: 'sd-wan',
          name: 'SD-WAN',
          description: 'Software-Defined Wide Area Network managing hybrid connections to route application traffic dynamically based on bandwidth and jitter.'
        },
        {
          id: 'mpls',
          name: 'MPLS',
          description: 'Multiprotocol Label Switching directing data packets using short path labels rather than complex IP lookup tables.'
        }
      ]
    }
  ]
};

// Generates a massive tree with 160+ nodes to test high-scale performance
export function generateLargeKnowledgeBase(targetNodes = 160): KnowledgeNode {
  const root: KnowledgeNode = {
    id: 'scale-root',
    name: 'COMPUTER SCIENCE & SYSTEMS',
    description: 'Comprehensive high-scale knowledge tree testing rendering performance across hundreds of nodes.',
    children: []
  };

  const domains = [
    {
      name: 'Distributed Systems',
      desc: 'Systems whose components are located on different networked computers communicating by passing messages.',
      sub: ['Consensus', 'Replication', 'Clocks', 'Messaging'],
      leaves: ['Raft', 'Paxos', 'Multi-Leader', 'Eventual Consistency', 'Vector Clocks', 'Kafka', 'NATS', '2PC']
    },
    {
      name: 'Databases & Storage',
      desc: 'Architectures for structured and unstructured persistent data storage and indexing.',
      sub: ['Storage Engines', 'Indexing', 'Transactions', 'Query Execution'],
      leaves: ['B+ Trees', 'LSM Trees', 'WAL Log', 'MVCC', 'ACID', 'Columnar (Parquet)', 'Vector Index']
    },
    {
      name: 'Operating Systems',
      desc: 'System software managing computer hardware resources, threads, and memory execution.',
      sub: ['Kernel Space', 'Process Management', 'Memory Paging', 'Concurrency'],
      leaves: ['Virtual Memory', 'Context Switching', 'Page Tables', 'epoll / kqueue', 'cgroups', 'Mutex Locks']
    },
    {
      name: 'Compilers & Runtimes',
      desc: 'Code translation, intermediate representation, bytecode execution, and memory safety.',
      sub: ['Frontend', 'Optimization', 'Code Generation', 'Garbage Collection'],
      leaves: ['AST Parser', 'SSA Form', 'LLVM IR', 'Mark & Sweep', 'Generational GC', 'JIT Compiler']
    },
    {
      name: 'Security & Cryptography',
      desc: 'Techniques for secure communication and protection against unauthorized data access.',
      sub: ['Symmetric Crypto', 'Asymmetric Crypto', 'Hashing', 'Zero Knowledge'],
      leaves: ['AES-256-GCM', 'RSA-4096', 'Ed25519', 'SHA-256', 'Argon2id', 'zk-SNARKs']
    }
  ];

  let idCounter = 1;

  for (const domain of domains) {
    const domainNode: KnowledgeNode = {
      id: `scale-d-${idCounter++}`,
      name: domain.name,
      description: domain.desc,
      children: []
    };

    for (const sub of domain.sub) {
      const subNode: KnowledgeNode = {
        id: `scale-s-${idCounter++}`,
        name: sub,
        description: `Core domain topic: ${sub} with specialized sub-terms and implementation briefs.`,
        children: []
      };

      for (const leaf of domain.leaves) {
        if (idCounter >= targetNodes + 10) break;
        subNode.children?.push({
          id: `scale-l-${idCounter++}`,
          name: leaf,
          description: `Detailed technical brief for ${leaf}. Explores architectural tradeoffs, latency considerations, and common pitfalls.`
        });
      }

      domainNode.children?.push(subNode);
    }

    root.children?.push(domainNode);
  }

  return root;
}
