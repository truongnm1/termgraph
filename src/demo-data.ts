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
      inputs: 'Raw Ethernet frames, Wi-Fi radio packets, DHCP requests',
      processing: 'MAC address switching, collision avoidance (CSMA/CD), packet filtering',
      outputs: 'Switched high-speed local data frames, broadcast distribution',
      example: 'Workstation sends ARP request broadcast to switch -> switch inspects MAC table -> forwards packet to destination port.',
      children: [
        {
          id: 'ethernet',
          name: 'Ethernet',
          description: 'Standard local network technology defining physical and link layer cabling, frame formats, and MAC addressing mechanisms.',
          inputs: 'Twisted-pair/fiber electrical signals, 802.3 MAC frames',
          processing: 'Manchester/PAM encoding, CRC error checking, framing',
          outputs: 'Decoded payload packets, link status signals',
          example: 'NIC transmits 1500-byte frame with preamble -> destination card verifies FCS CRC checksum -> passes payload to IP stack.'
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

interface DeepBenchmarkTemplate {
  name: string;
  desc: string;
  hasIpo?: boolean;
  inputs?: string;
  processing?: string;
  outputs?: string;
  example?: string;
  children?: DeepBenchmarkTemplate[];
}

const deepBenchmarkData: DeepBenchmarkTemplate = {
  name: 'COMPUTING SYSTEMS & ARCHITECTURE',
  desc: 'Multi-tiered computing hierarchy spanning hardware microarchitecture, system runtimes, and distributed infrastructure across 7 levels of vertical depth.',
  hasIpo: true,
  inputs: 'High-level source code, user directives, hardware power signals, and physical network packets',
  processing: 'Hierarchical translation from software algorithms to kernel system calls, microarchitectural execution, and distributed state consensus',
  outputs: 'Computed mathematical results, persistent storage state, display frame buffers, and synchronized cluster logs',
  example: 'Web request triggers distributed Raft consensus -> writes state to LSM-Tree WAL -> kernel schedules disk flush via CFS -> CPU executes micro-ops through pipeline.',
  children: [
    {
      name: 'HARDWARE & SILICON',
      desc: 'Physical microarchitecture, execution pipelines, cache hierarchies, and interconnect fabrics.',
      children: [
        {
          name: 'Processor Microarchitecture',
          desc: 'CPU pipeline organization, branch prediction, out-of-order engines, and arithmetic units.',
          children: [
            {
              name: 'Execution Pipeline',
              desc: 'Instruction fetch, decode, dispatch, execute, and retirement stages.',
              hasIpo: true,
              inputs: 'Machine instruction byte stream from L1 instruction cache and branch target predictions',
              processing: 'Pipelined fetch, micro-op decoding, register renaming, out-of-order dispatch, ALU execution, and in-order retirement',
              outputs: 'Retired instruction architectural register state, memory write operations, and updated branch predictor history',
              example: 'Instruction ADD R1, R2, R3 fetched at PC=0x100 -> renamed to physical registers P4, P5, P6 -> executed in ALU 0 -> retired to architectural state.',
              children: [
                {
                  name: 'Instruction Fetch & Decode',
                  desc: 'Retrieves raw instruction bytes and transforms them into executable micro-operations.',
                  children: [
                    {
                      name: 'Branch Prediction Engine',
                      desc: 'Speculates conditional jump directions to maintain pipeline flow without stalls.',
                      children: [
                        {
                          name: 'Branch Target Buffer (BTB)',
                          desc: 'Caches predicted target addresses for branches to enable zero-cycle redirects.',
                          children: [
                            { name: 'Direct-Mapped BTB Array', desc: 'Fast single-cycle address tag match table for immediate branch indexing.' },
                            { name: 'Two-Level Adaptive Predictor', desc: 'Maintains branch history registers and pattern history tables for high accuracy.' }
                          ]
                        },
                        {
                          name: 'Speculative Execution Engine',
                          desc: 'Executes instructions ahead of confirmed branch resolution along predicted paths.',
                          children: [
                            { name: 'Reorder Buffer (ROB)', desc: 'Guarantees in-order instruction retirement and precise exception state rollback.' },
                            { name: 'Register Renaming Table (RAT)', desc: 'Eliminates false WAR and WAW register dependencies by mapping architectural registers to physical registers.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Instruction Decoding Unit',
                      desc: 'Decodes complex variable-length machine instructions into fixed-size RISC micro-ops.',
                      children: [
                        {
                          name: 'Micro-Op Translation Engine',
                          desc: 'Fast-path hardware decoders supplemented with microcode sequencer for complex instructions.',
                          children: [
                            { name: 'Fast-Path Single µop Decoder', desc: 'Dedicated single-cycle decoders handling common 1-to-1 instruction mappings.' },
                            { name: 'Microcode Sequencer ROM', desc: 'Microcode table lookup generating multi-µop flows for complex CISC operations.' }
                          ]
                        },
                        {
                          name: 'Instruction Queue & Pre-Decode',
                          desc: 'Buffers incoming instruction streams and pre-identifies branch and operand boundaries.',
                          children: [
                            { name: 'Macro-Op Fusion Logic', desc: 'Merges adjacent instructions (e.g., CMP + JNE) into a single composite micro-op.' },
                            { name: 'Loop Stream Detector (LSD)', desc: 'Detects small tight loops and streams micro-ops directly without fetching from L1i.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Execution Engine',
                  desc: 'Dispatches decoded micro-ops to parallel arithmetic, logic, vector, and memory units.',
                  children: [
                    {
                      name: 'Arithmetic Logic Unit (ALU)',
                      desc: 'Performs integer arithmetic and bitwise logic at high clock frequencies.',
                      children: [
                        {
                          name: 'Integer ALUs',
                          desc: 'High-speed single-cycle adders, bit-shifters, and integer arithmetic units.',
                          children: [
                            { name: 'Kogge-Stone Fast Adder', desc: 'Parallel prefix tree adder achieving logarithmic addition latency across 64 bits.' },
                            { name: 'Wallace Tree Multiplier', desc: 'Reduces partial products in parallel using carry-save adders for low-latency integer multiplication.' }
                          ]
                        },
                        {
                          name: 'Vector & SIMD Units',
                          desc: 'Wide execution pipelines processing multiple data lanes simultaneously.',
                          children: [
                            { name: 'AVX-512 FMA Pipeline', desc: '512-bit fused multiply-accumulate unit for high-throughput linear algebra computations.' },
                            { name: 'Permute & Shuffle Matrix', desc: 'Dedicated crossbar lane shuffler for intra-register vector reorganization in a single cycle.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Memory Execution Engine',
                      desc: 'Coordinates out-of-order load and store memory accesses while enforcing program order semantics.',
                      children: [
                        {
                          name: 'Load / Store Queues',
                          desc: 'Tracks in-flight memory operations and forwards pending store data to matching loads.',
                          children: [
                            { name: 'Store-to-Load Forwarding Unit', desc: 'Intercepts memory reads that match uncommitted stores in the pipeline to avoid cache round-trips.' },
                            { name: 'Memory Disambiguation Predictor', desc: 'Speculatively executes loads before earlier store addresses are fully calculated.' }
                          ]
                        },
                        {
                          name: 'Address Generation Units (AGU)',
                          desc: 'Calculates effective linear memory addresses from base, index, and displacement registers.',
                          children: [
                            { name: 'Segment Base Adder', desc: 'Applies hardware base offset calculations for segmented addressing modes.' },
                            { name: 'Page Offset Masking Unit', desc: 'Extracts lower 12 bits of virtual address for simultaneous L1 cache set indexing.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: 'Memory & Cache Hierarchy',
              desc: 'Multi-tiered storage balancing access latency, bandwidth, and capacity between cores and RAM.',
              children: [
                {
                  name: 'Processor Caches',
                  desc: 'Ultra-low-latency on-chip SRAM memories staging frequently accessed instructions and data.',
                  children: [
                    {
                      name: 'Level 1 Cache (L1)',
                      desc: 'Fastest 32KB-64KB caches private to each processor core with 1-4 cycle access times.',
                      children: [
                        {
                          name: 'L1 Instruction Cache (L1i)',
                          desc: 'Dedicated cache delivering uncorrupted instruction byte streams to the fetch unit.',
                          children: [
                            { name: 'Virtually Indexed Physically Tagged (VIPT)', desc: 'Indexes cache concurrently with TLB address translation to minimize latency.' },
                            { name: 'Instruction Prefetch Buffer', desc: 'Detects sequential access streams and speculatively loads cache lines ahead of the program counter.' }
                          ]
                        },
                        {
                          name: 'L1 Data Cache (L1d)',
                          desc: 'Dedicated low-latency cache for operand reads and writes by the execution units.',
                          children: [
                            { name: 'Multi-Banked SRAM Array', desc: 'Splits cache into independent banks to support simultaneous dual-load and store operations.' },
                            { name: 'Miss Status Holding Registers (MSHR)', desc: 'Enables non-blocking hit-under-miss cache operation while outstanding cache misses resolve.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Last-Level Cache (LLC / L3)',
                      desc: 'Large multi-megabyte shared cache serving all cores and coordinating cache coherence.',
                      children: [
                        {
                          name: 'Coherence Protocols',
                          desc: 'Maintains uniform memory view across private caches in multi-core symmetric multiprocessing.',
                          children: [
                            { name: 'MESI Invalidation Bus', desc: 'Four-state protocol (Modified, Exclusive, Shared, Invalid) using snooping or directory filters.' },
                            { name: 'MOESI Owned State Extension', desc: 'Allows sharing of dirty cache lines without immediately writing them back to main memory.' }
                          ]
                        },
                        {
                          name: 'Cache Eviction Policies',
                          desc: 'Selects victim cache lines to discard when cache sets become saturated.',
                          children: [
                            { name: 'Adaptive Replacement Cache (ARC)', desc: 'Dynamically balances between recency (LRU) and frequency (LFU) using ghost caches.' },
                            { name: 'Segmented LRU with Insertion Margin', desc: 'Protects hot working sets from being flushed out by one-time sequential memory scans.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Physical Interconnect & Controllers',
                  desc: 'High-speed physical interfaces and controllers interfacing processor dies to external systems.',
                  children: [
                    {
                      name: 'Memory Controller',
                      desc: 'Schedules read, write, precharge, and refresh commands to DDR5/LPDDR memory modules.',
                      children: [
                        {
                          name: 'DDR5 PHY Layer',
                          desc: 'High-frequency analog physical interface driving signals over printed circuit board traces.',
                          children: [
                            { name: 'On-Die Termination (ODT)', desc: 'Suppresses signal reflections on high-speed memory buses by matching transmission impedance.' },
                            { name: 'Decision Feedback Equalization (DFE)', desc: 'Filters out inter-symbol interference at multi-gigahertz transfer rates.' }
                          ]
                        },
                        {
                          name: 'Command Scheduler',
                          desc: 'Reorders pending memory requests to maximize bus throughput and minimize bank conflicts.',
                          children: [
                            { name: 'FR-FCFS (First-Ready First-Come)', desc: 'Prioritizes requests targeting currently open DRAM rows to minimize row buffer latency.' },
                            { name: 'Bank Conflict Minimizer', desc: 'Distributes consecutive accesses across independent memory banks and ranks.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'System Bus Fabric',
                      desc: 'Point-to-point coherent interconnects connecting processors, accelerators, and peripherals.',
                      children: [
                        {
                          name: 'PCIe Subsystem',
                          desc: 'Standardized serial expansion bus delivering high-bandwidth connectivity to GPUs and NVMe drives.',
                          children: [
                            { name: 'PCIe 5.0 SerDes 32 GT/s', desc: 'Serialiser/Deserialiser transceiver converting parallel data to ultra-high-speed serial streams.' },
                            { name: 'TLP Packet Processing Engine', desc: 'Builds, routes, and validates Transaction Layer Packets with end-to-end CRC checking.' }
                          ]
                        },
                        {
                          name: 'Coherent Fabric Interconnect',
                          desc: 'Enables coherent memory sharing between host processors and PCIe accelerators.',
                          children: [
                            { name: 'CXL.mem Coherent Protocol', desc: 'Compute Express Link protocol for low-latency memory pooling and device memory attachment.' },
                            { name: 'Mesh Network-on-Chip (NoC)', desc: '2D grid routing packets between dozens of CPU cores, caches, and memory controllers.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'OPERATING SYSTEMS & RUNTIMES',
      desc: 'Kernel architectures, memory management, thread scheduling, and low-level system call interfaces.',
      children: [
        {
          name: 'Kernel Core & Memory',
          desc: 'Privileged supervisor software managing physical resources and isolating user processes.',
          children: [
            {
              name: 'Virtual Memory Subsystem',
              desc: 'Provides each process with an isolated, contiguous, and secure virtual address space.',
              hasIpo: true,
              inputs: 'Virtual addresses generated by CPU instructions, page fault interrupt signals, and kernel allocation requests',
              processing: 'Multi-level page table radix walk, TLB hit/miss management, demand paging, and copy-on-write page frame allocation',
              outputs: 'Physical page frame addresses (PFN), memory access protection bits, and page fault resolution status',
              example: 'Process accesses address 0x7fff_0000 -> TLB miss triggers page walker -> walks PML4 to PTE -> translates to physical frame 0x12a00.',
              children: [
                {
                  name: 'Page Table Management',
                  desc: 'Hierarchical radix trees translating virtual addresses to physical page frame numbers.',
                  children: [
                    {
                      name: 'Multi-Level Paging Architecture',
                      desc: 'Hierarchical page tables allowing sparse address spaces without allocating empty intermediate tables.',
                      children: [
                        {
                          name: '4-Level Page Table (x86-64)',
                          desc: 'Maps 48-bit virtual addresses through PML4, PDPT, Page Directory, and Page Table entries.',
                          children: [
                            { name: 'Page Map Level 4 (PML4)', desc: 'Top-level translation table indexed by virtual address bits 47 down to 39.' },
                            { name: 'Page Directory Pointer Table (PDPT)', desc: 'Second-level translation table pointing to 2MB directories or 1GB huge pages.' }
                          ]
                        },
                        {
                          name: 'Huge Pages Management',
                          desc: 'Maps 2MB or 1GB memory pages to reduce TLB footprint and improve translation throughput.',
                          children: [
                            { name: 'Transparent Huge Pages (THP)', desc: 'Background kernel thread (khugepaged) collapsing adjacent 4KB pages into contiguous 2MB pages.' },
                            { name: 'Hugetlbfs Static Pool', desc: 'Pre-reserved huge page memory pool dedicated to high-performance databases and virtual machines.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'TLB Management & Invalidation',
                      desc: 'Hardware address translation cache and software synchronization mechanisms across CPU cores.',
                      children: [
                        {
                          name: 'Translation Lookaside Buffer',
                          desc: 'Fast associative hardware cache storing recently translated virtual-to-physical address mappings.',
                          children: [
                            { name: 'ASID Process-Tag Matching', desc: 'Address Space Identifier tags preventing TLB flushes across context switches between processes.' },
                            { name: 'TLB Shootdown Inter-Processor Interrupt (IPI)', desc: 'Coordinates cross-core TLB entry invalidations when page permissions or mappings mutate.' }
                          ]
                        },
                        {
                          name: 'Hardware Page Walker',
                          desc: 'Hardware state machine that traverses page tables in memory on TLB miss events.',
                          children: [
                            { name: 'Nested Paging (EPT / NPT)', desc: 'Two-dimensional page table walk translating guest virtual to guest physical to host physical.' },
                            { name: 'Page Fault Exception Handler', desc: 'Kernel interrupt routine resolving demand paging, copy-on-write, or terminating segmentation violations.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Kernel Memory Allocators',
                  desc: 'High-performance memory allocation algorithms managing physical RAM for kernel objects.',
                  children: [
                    {
                      name: 'Buddy System Allocator',
                      desc: 'Divides memory blocks into power-of-two page frames to minimize external memory fragmentation.',
                      children: [
                        {
                          name: 'Page Order Free Lists',
                          desc: 'Maintains arrays of free page lists categorized by power-of-two block sizes.',
                          children: [
                            { name: 'Order-0 to Order-11 Free Lists', desc: 'Linked lists of free contiguous blocks ranging from single 4KB pages up to 16MB zones.' },
                            { name: 'Zone Normal / Zone DMA Partitioning', desc: 'Segregates memory zones to accommodate legacy 32-bit hardware DMA address limitations.' }
                          ]
                        },
                        {
                          name: 'Block Coalescing Engine',
                          desc: 'Merges adjacent free buddy blocks back into larger blocks when memory is released.',
                          children: [
                            { name: 'Bitwise Buddy Index XOR Logic', desc: 'Computes matching buddy frame address instantaneously using XOR on the block index.' },
                            { name: 'Watermark-Based Direct Reclaim', desc: 'Triggers background page scanning (kswapd) when free memory falls below low watermarks.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Slab Cache Allocator',
                      desc: 'Pre-allocates pools of fixed-size objects (inodes, dentries) to eliminate initialization overhead.',
                      children: [
                        {
                          name: 'SLUB Allocator',
                          desc: 'Minimalist kernel slab allocator optimizing cache locality without external metadata structures.',
                          children: [
                            { name: 'SLUB Free-List Pointer Obfuscation', desc: 'Encrypts in-object free-list pointers with random keys to mitigate heap buffer exploitation.' },
                            { name: 'Per-CPU Kmalloc Slabs', desc: 'Lock-free per-CPU cache arrays satisfying small kernel allocations without global locks.' }
                          ]
                        },
                        {
                          name: 'Object Cache Constructor Pool',
                          desc: 'Maintains constructed state across allocations to avoid repetitive object initialization.',
                          children: [
                            { name: 'Cache Shrinker Callback Registry', desc: 'Invoked by memory reclaim subsystems under memory pressure to release unused cache slabs.' },
                            { name: 'Coloring Offset Alignment', desc: 'Offsets slab start addresses across pages to prevent multiple slabs from thrashing same cache lines.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: 'Process Scheduling & Synchronization',
              desc: 'Allocates CPU time across competing threads and provides primitives for thread coordination.',
              children: [
                {
                  name: 'CPU Scheduler Engine',
                  desc: 'Selects the next runnable thread to execute on an available CPU core using fairness criteria.',
                  children: [
                    {
                      name: 'Completely Fair Scheduler (CFS)',
                      desc: 'Proportionally shares CPU execution time among threads using virtual runtime metrics.',
                      children: [
                        {
                          name: 'vruntime Red-Black Tree',
                          desc: 'Orders runnable tasks by accumulated execution time weighted inversely by their nice priority.',
                          children: [
                            { name: 'Min-vruntime Tracking Pivot', desc: 'Tracks monotonic baseline to ensure newly spawned tasks receive fair scheduling latency.' },
                            { name: 'Latency Target Scaling Formula', desc: 'Adjusts scheduling period duration dynamically based on the total number of runnable tasks.' }
                          ]
                        },
                        {
                          name: 'Energy-Aware Scheduling (EAS)',
                          desc: 'Optimizes task placement on asymmetric CPUs (big.LITTLE) to minimize battery power consumption.',
                          children: [
                            { name: 'Energy Model Capacity Invariant', desc: 'Pre-computed power consumption curve per core frequency and CPU compute capacity.' },
                            { name: 'Wake-up Energy Cost Estimator', desc: 'Selects the target CPU core that yields the lowest projected total system energy delta.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Real-Time & Priority Schedulers',
                      desc: 'Guarantees deterministic execution latency for mission-critical and multimedia workloads.',
                      children: [
                        {
                          name: 'SCHED_FIFO & SCHED_RR',
                          desc: 'Static priority real-time policies that preempt any standard CFS task unconditionally.',
                          children: [
                            { name: 'SCHED_FIFO Priority Ring (0-99)', desc: 'Executes until the thread yields, blocks on I/O, or is preempted by a higher priority task.' },
                            { name: 'SCHED_RR Time-Slice Watchdog', desc: 'Applies round-robin time slice quantum across threads sharing the same real-time priority level.' }
                          ]
                        },
                        {
                          name: 'SCHED_DEADLINE Engine',
                          desc: 'Implements Earliest Deadline First (EDF) scheduling with constant bandwidth server guarantees.',
                          children: [
                            { name: 'Earliest Deadline First (EDF) Queue', desc: 'Dispatches task with closest absolute deadline first to prevent timing misses.' },
                            { name: 'Constant Bandwidth Server (CBS)', desc: 'Enforces hard runtime execution budgets to isolate real-time tasks from hogging CPUs.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Concurrency & Locking Primitives',
                  desc: 'Protects shared data structures from race conditions across multicore architectures.',
                  children: [
                    {
                      name: 'Kernel Lock Implementations',
                      desc: 'Mutual exclusion mechanisms tailored for short spin waits or long sleep intervals.',
                      children: [
                        {
                          name: 'Spinlocks & Mutexes',
                          desc: 'Fundamental locks for atomic critical sections with priority inheritance support.',
                          children: [
                            { name: 'Ticket Spinlock with Pause Instruction', desc: 'FIFO queue spinlock preventing core starvation and reducing memory bus snoop traffic.' },
                            { name: 'Futex (Fast Userspace Mutex) Table', desc: 'Performs lock acquisition in user space via atomic CAS without system call overhead on uncontended paths.' }
                          ]
                        },
                        {
                          name: 'Read-Write Synchronization',
                          desc: 'Permits concurrent readers while serializing exclusive writer updates.',
                          children: [
                            { name: 'Seqlock Optimistic Sequence Counter', desc: 'Allows readers to execute without locks by verifying sequence counter consistency before and after read.' },
                            { name: 'Reader-Writer Semaphores (rwsem)', desc: 'Sleeping locks queuing writers ahead of new readers to prevent writer starvation.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Lock-Free Algorithms',
                      desc: 'Concurrent algorithms operating through atomic hardware instructions without lock contention.',
                      children: [
                        {
                          name: 'Read-Copy-Update (RCU)',
                          desc: 'Enables concurrent reads with zero lock overhead by deferring memory deallocation until grace periods elapse.',
                          children: [
                            { name: 'RCU Grace Period Detection', desc: 'Tracks quiescent states across all CPU cores to ensure no readers hold references to obsolete objects.' },
                            { name: 'Call-RCU Asynchronous Callback Batcher', desc: 'Queues reclamation callbacks and processes them in batches to maximize CPU cache efficiency.' }
                          ]
                        },
                        {
                          name: 'Safe Memory Reclamation (SMR)',
                          desc: 'Techniques preventing use-after-free bugs in lock-free concurrent data structures.',
                          children: [
                            { name: 'Hazard Pointers Array', desc: 'Per-thread pointers publishing currently accessed nodes to prevent other threads from freeing them.' },
                            { name: 'Epoch-Based Reclamation (EBR)', desc: 'Global epoch counter synchronizing memory retirement across reader phases with minimal memory overhead.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'DISTRIBUTED SYSTEMS & NETWORKS',
      desc: 'Fault-tolerant consensus protocols, distributed storage engines, and peer-to-peer topologies.',
      children: [
        {
          name: 'Distributed Consensus & State',
          desc: 'Reaches verifiable agreement across unreliable network partitions and failing nodes.',
          children: [
            {
              name: 'Consensus Protocols',
              desc: 'Algorithmic state machines maintaining consistent replicated logs across distributed clusters.',
              children: [
                {
                  name: 'Leader-Based Consensus',
                  desc: 'Funnel state transitions through a designated leader node that coordinates log commits.',
                  children: [
                    {
                      name: 'Raft Consensus Engine',
                      desc: 'Understandable consensus algorithm decomposing state into election, replication, and safety.',
                      hasIpo: true,
                      inputs: 'Client write commands, cluster peer election votes, heartbeat ticks, and AppendEntries RPCs',
                      processing: 'Leader election timeout state machine, majority quorum ballot counting, and log commit index monotonicity enforcement',
                      outputs: 'Committed state machine updates, follower log synchronization RPCs, and cluster leadership lease confirmations',
                      example: 'Leader receives "SET x=10" -> broadcasts AppendEntries to 3 follower nodes -> collects 2 ACKs -> commits log at index 42 -> replies success to client.',
                      children: [
                        {
                          name: 'Leader Election Module',
                          desc: 'Detects leader heartbeat failure and elects a new cluster leader via majority vote.',
                          children: [
                            { name: 'Randomized Heartbeat Election Timer', desc: 'Prevents split votes by staggering election timeouts across follower nodes.' },
                            { name: 'Quorum Ballot Verification', desc: 'Requires votes from a strict majority (N/2 + 1) of cluster nodes before declaring leader status.' }
                          ]
                        },
                        {
                          name: 'Log Replication Subsystem',
                          desc: 'Propagates log entries from leader to followers and advances commit index upon majority confirmation.',
                          children: [
                            { name: 'MatchIndex Log Compaction Snapshot', desc: 'Compacts completed log entries into state snapshots to discard historical entries safely.' },
                            { name: 'AppendEntries RPC Pipeline', desc: 'Batches log synchronization messages and resolves divergent follower log terms.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Multi-Paxos Protocol',
                      desc: 'Classic distributed consensus protocol streaming multiple sequence instances with a stable proposer.',
                      children: [
                        {
                          name: 'Phase 1 Prepare / Promise',
                          desc: 'Establishes leadership and discovers any values already accepted by earlier proposers.',
                          children: [
                            { name: 'Ballot Number Monotonicity', desc: 'Guarantees strictly increasing proposal identifiers across cluster epochs.' },
                            { name: 'Max Accepted Value Convergence', desc: 'Adopts the highest-numbered accepted proposal value to maintain historical consistency.' }
                          ]
                        },
                        {
                          name: 'Phase 2 Accept / Commit',
                          desc: 'Replicates proposal values to acceptor quorums and commits upon majority acknowledgment.',
                          children: [
                            { name: 'Distinguished Proposer Lease', desc: 'Allows steady-state consensus without repeating Phase 1 round-trips for every command.' },
                            { name: 'Fast-Path Quorum Bypass', desc: 'Allows clients to propose directly to acceptors when no conflicts exist.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Leaderless & Quorum Protocols',
                  desc: 'Eliminates leader bottlenecks by allowing any node to accept read and write operations.',
                  children: [
                    {
                      name: 'Dynamo Quorum Replication',
                      desc: 'Decentralized storage architecture using configurable read (R) and write (W) quorums with R+W>N.',
                      children: [
                        {
                          name: 'Consistent Hashing Ring',
                          desc: 'Distributes partition ownership across nodes with minimal key redistribution during cluster scale events.',
                          children: [
                            { name: 'Virtual Node (Vnode) Balancing', desc: 'Assigns multiple token positions per physical server to achieve uniform hash distribution.' },
                            { name: 'Murmur3 Token Hash Space', desc: 'Maps 64-bit keys evenly across a continuous modular ring address space.' }
                          ]
                        },
                        {
                          name: 'Failure Handling & Handoff',
                          desc: 'Maintains availability during temporary network outages or server reboots.',
                          children: [
                            { name: 'Sloppy Quorum & Hinted Handoff', desc: 'Stores writes on healthy neighbor nodes with hints to forward them when destination recovers.' },
                            { name: 'Merkle Tree Anti-Entropy Sync', desc: 'Compares cryptographic hash trees between replicas to sync out-of-date keys in the background.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Conflict-Free Replicated Data (CRDT)',
                      desc: 'Data structures supporting concurrent multi-master mutations that deterministically converge without coordination.',
                      children: [
                        {
                          name: 'State-Based CRDTs (CvRDT)',
                          desc: 'Merges full state across replicas using a bounded join-semilattice operation.',
                          children: [
                            { name: 'Observed-Removed Set (OR-Set)', desc: 'Supports arbitrary add and delete operations on set elements using unique birth and death tags.' },
                            { name: 'P-N Counter Vector Clock Merge', desc: 'Maintains positive and negative counter vectors per node to calculate global net value.' }
                          ]
                        },
                        {
                          name: 'Operation-Based CRDTs (CmRDT)',
                          desc: 'Broadcasts causal mutation operations over reliable messaging transports.',
                          children: [
                            { name: 'Causal Delivery Tree Buffer', desc: 'Queues received operations until all causally preceding updates have executed locally.' },
                            { name: 'LWW-Element-Set (Last-Write-Wins)', desc: 'Resolves conflicting mutations using wall-clock timestamps or hybrid logical clocks.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: 'Storage Engines & Replication',
              desc: 'High-throughput disk and memory architectures persisting distributed state.',
              children: [
                {
                  name: 'Log-Structured Merge-Trees (LSM)',
                  desc: 'Optimizes write throughput by appending mutations to memory tables and sequentially flushing sorted runs to disk.',
                  children: [
                    {
                      name: 'MemTable & Write-Ahead Log',
                      desc: 'Buffers incoming writes in fast RAM while guaranteeing durability through sequential append-only logs.',
                      children: [
                        {
                          name: 'In-Memory MemTable',
                          desc: 'Maintains sorted key-value pairs in memory to serve immediate reads and range scans.',
                          children: [
                            { name: 'Concurrent SkipList Index', desc: 'Probabilistic lock-free indexed linked list enabling concurrent reads and atomic insertions.' },
                            { name: 'Row-Level Mutation Arena', desc: 'Pre-allocated memory pool avoiding individual malloc calls for each written key-value pair.' }
                          ]
                        },
                        {
                          name: 'Write-Ahead Logging (WAL)',
                          desc: 'Persists every mutation to sequential disk storage before acknowledging client writes.',
                          children: [
                            { name: 'Direct I/O Synchronous Append', desc: 'Bypasses operating system buffer cache using O_DIRECT to ensure instant disk write confirmation.' },
                            { name: 'Group Commit Flush Queue', desc: 'Batches concurrent write requests into a single physical disk fsync operation to maximize IOPS.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'SSTable Compaction Pipeline',
                      desc: 'Periodically merges overlapping immutable Sorted String Tables to reclaim disk space and optimize read latency.',
                      children: [
                        {
                          name: 'Leveled Compaction Strategy (LCS)',
                          desc: 'Organizes SSTables into exponential levels (L0 to Ln) with strict key-range non-overlapping guarantees.',
                          children: [
                            { name: 'Overlapping Key Range Filter', desc: 'Identifies intersecting SSTables across levels to perform targeted merge-sort compactions.' },
                            { name: 'Bloom Filter Block Cache', desc: 'Probabilistic bit vectors quickly rejecting SSTables that do not contain the queried key.' }
                          ]
                        },
                        {
                          name: 'Size-Tiered Compaction Strategy (STCS)',
                          desc: 'Merges SSTables of comparable sizes together, optimized for write-heavy logging workloads.',
                          children: [
                            { name: 'Major Compaction Merge Sorter', desc: 'Combines multiple SSTables into a single consolidated file while purging expired tombstones.' },
                            { name: 'Tombstone Purge Threshold Logic', desc: 'Ensures deleted keys are retained until all older SSTables containing prior versions are compacted.' }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Distributed Transactions',
                  desc: 'Enforces ACID guarantees across operations spanning multiple independent database shards.',
                  children: [
                    {
                      name: 'Atomic Commit Protocols',
                      desc: 'Guarantees that all participating database nodes either commit or abort a distributed transaction.',
                      children: [
                        {
                          name: 'Two-Phase Commit (2PC)',
                          desc: 'Classic coordinator-driven protocol using Prepare and Commit phases with persistent logging.',
                          children: [
                            { name: 'Coordinator Voting Transaction Log', desc: 'Records global transaction outcome decisions before sending commit directives to participants.' },
                            { name: 'Participant Prepared State Lock', desc: 'Holds row-level exclusive locks while waiting for coordinator commit or abort resolution.' }
                          ]
                        },
                        {
                          name: 'Three-Phase Commit (3PC)',
                          desc: 'Non-blocking commit protocol adding a PreCommit phase to eliminate coordinator failure deadlocks.',
                          children: [
                            { name: 'CanCommit Feasibility Check', desc: 'Verifies participant operational status before entering formal prepared commitment.' },
                            { name: 'PreCommit Timeout Transition', desc: 'Safely commits in-flight transactions when coordinator fails after majority consensus.' }
                          ]
                        }
                      ]
                    },
                    {
                      name: 'Concurrency Control Mechanisms',
                      desc: 'Prevents concurrency anomalies (dirty reads, non-repeatable reads, phantom rows) in parallel transactions.',
                      children: [
                        {
                          name: 'Multi-Version Concurrency (MVCC)',
                          desc: 'Preserves snapshots of modified rows so readers never block writers and writers never block readers.',
                          children: [
                            { name: 'Read Timestamp Snapshot Isolation', desc: 'Serves queries from consistent read views determined by transaction start timestamps.' },
                            { name: 'Serializable Snapshot Isolation (SSI)', desc: 'Detects dangerous rw-antidependencies in transaction graphs to prevent write-skew anomalies.' }
                          ]
                        },
                        {
                          name: 'Spanner TrueTime Architecture',
                          desc: 'Synchronizes cluster clocks within bounded uncertainty windows using GPS and atomic clocks.',
                          children: [
                            { name: 'TrueTime API Uncertainty Bound (ε)', desc: 'Exposes [earliest, latest] time intervals to enforce external consistency without cross-node locks.' },
                            { name: 'Commit-Wait Rule Enforcement', desc: 'Delays transaction commit acknowledgments until 2ε elapses to guarantee causal timestamp ordering.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Generates a multi-tiered knowledge tree with 7 levels of vertical depth and controlled 2-sibling branching (190+ nodes)
export function generateLargeKnowledgeBase(targetNodes = 160): KnowledgeNode {
  let counter = 1;

  function convert(tpl: DeepBenchmarkTemplate, isRoot = false): KnowledgeNode {
    const node: KnowledgeNode = {
      id: isRoot ? 'scale-root' : `scale-node-${counter++}`,
      name: tpl.name,
      description: tpl.desc,
      children: []
    };
    if (tpl.hasIpo) {
      node.hasIpo = tpl.hasIpo;
      node.inputs = tpl.inputs;
      node.processing = tpl.processing;
      node.outputs = tpl.outputs;
      node.example = tpl.example;
    }
    if (tpl.children) {
      for (const child of tpl.children) {
        if (counter > targetNodes + 60) break;
        node.children!.push(convert(child));
      }
    }
    return node;
  }

  return convert(deepBenchmarkData, true);
}
