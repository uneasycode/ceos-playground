# L3VPN Inter-AS Lab

This lab demonstrates L3VPN (Layer 3 Virtual Private Network) inter-AS (Autonomous System) connectivity scenarios. The lab showcases three different approaches for exchanging VPN routes between autonomous systems:

## Topology Overview

The lab consists of two autonomous systems:
- **AS 65000**: Contains routers a-p01, a-p02, a-pe01, a-pe02, a-asbr, and a-ce01
- **AS 65001**: Contains routers b-p01, b-p02, b-pe01, b-asbr, and b-ce01

### Network Components:
- **P routers**: Provider core routers running MPLS and ISIS
- **PE routers**: Provider Edge routers that terminate VPN customer connections
- **ASBR routers**: Autonomous System Border Routers that handle inter-AS connectivity
- **CE routers**: Customer Edge routers representing VPN customer sites

## Inter-AS L3VPN Options

### Option A: Back-to-Back VRFs
- **Description**: ASBRs have dedicated VRFs for each VPN and exchange routes via EBGP
- **Characteristics**:
  - VPN isolation maintained across AS boundaries
  - Each VPN requires separate VRF on ASBRs
  - Most secure option as VPNs don't mix in global routing table
- **Configuration**: ASBRs (a-asbr, b-asbr) have VRF "TEST" with EBGP peering
- **Use Case**: When maximum isolation between VPNs is required

### Option B: MP-eBGP between ASBRs
- **Description**: ASBRs exchange VPN routes directly via MP-BGP without VRFs
- **Characteristics**:
  - VPN routes carried in global BGP table between ASes
  - Less configuration than Option A
  - Requires careful RT filtering to prevent route leaks
- **Configuration**: ASBRs peer via MP-eBGP for vpn-ipv4 address family
- **Use Case**: When simpler configuration is preferred over strict isolation

### Option C: Multihop MP-eBGP with Route Reflectors
- **Description**: Uses route reflectors to exchange VPN routes between ASes
- **Characteristics**:
  - Most scalable for large-scale deployments
  - Route reflectors handle VPN route distribution
  - Complex configuration but highly scalable
- **Configuration**: Would require additional route reflector nodes
- **Use Case**: Large service provider networks with many ASes

## Current Implementation

The current topology implements **Option A (Back-to-Back VRFs)** with:
- ASBRs connected via Ethernet3 with IP addresses 192.168.100.1/30 and 192.168.100.2/30
- VRF "TEST" configured on both ASBRs
- EBGP peering between ASBRs within the VRF context
- Route targets 100:100 for AS 65000 and 200:200 for AS 65001

## Lab Usage

1. **Deploy the topology**:
   ```bash
   cd labs/l3vpn-interas
   containerlab deploy -t topology.clab.yml
   ```

2. **Verify connectivity**:
   - Check ISIS adjacencies within each AS
   - Verify BGP peerings between PE and P routers
   - Confirm EBGP session between ASBRs
   - Test VPN connectivity between CE routers

3. **Test VPN functionality**:
   - Ping between a-ce01 and b-ce01 should work through the VPN
   - Verify that routes are exchanged via the inter-AS link
   - Check VRF routing tables on PE routers

## Configuration Files

- `topology.clab.yml`: Containerlab topology definition
- `l3vpn-configs/`: Individual router configurations
- `inventory.yml`: Ansible inventory for automation
- `playbooks/`: Ansible playbooks for configuration management

## Extending the Lab

To implement other options:

### For Option B:
- Remove VRF from ASBR interfaces
- Configure MP-eBGP peering for vpn-ipv4 address family
- Add route target filtering

### For Option C:
- Add route reflector nodes
- Configure multihop EBGP between ASBRs and route reflectors
- Implement VPN route reflection

## Learning Objectives

After completing this lab, you should understand:
- How L3VPN works in a multi-AS environment
- Different approaches for inter-AS VPN route exchange
- Configuration of VRFs, MPLS, and BGP for VPN services
- Trade-offs between security, scalability, and complexity in inter-AS VPNs
