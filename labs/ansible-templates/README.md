# Ansible Configuration Templates

This directory contains reusable Ansible templates and playbooks for generating Arista cEOS router configurations and Containerlab topology files. These templates are designed to automate the creation of network labs with consistent configurations.

## Directory Structure

```
ansible-templates/
├── templates/           # Jinja2 templates
│   ├── router_config.j2    # Router configuration template
│   └── topology.clab.j2    # Containerlab topology template
├── vars/               # Variable files for different router types
│   ├── p_router_vars.yml   # Provider router variables
│   └── pe_router_vars.yml  # Provider Edge router variables
├── playbooks/          # Ansible playbooks
│   └── generate_configs.yml # Main configuration generation playbook
└── README.md          # This file
```

## Templates Overview

### router_config.j2
A comprehensive Jinja2 template that generates complete Arista EOS configurations including:
- Basic system settings (hostname, management, authentication)
- VRF configurations
- Interface configurations (physical, loopback, VLAN)
- Routing protocols (ISIS, BGP, OSPF)
- MPLS and L3VPN settings
- Security and monitoring features

### topology.clab.j2
Template for generating Containerlab topology files with:
- Node definitions with management IPs
- Link configurations
- Startup configurations
- Environment variables

## Variable Files

### p_router_vars.yml
Variables for Provider (P) routers:
- ISIS configuration for core routing
- MPLS settings
- Basic interface templates

### pe_router_vars.yml
Variables for Provider Edge (PE) routers:
- VRF and VPN configurations
- BGP settings for VPN route exchange
- OSPF for customer routing
- Route maps and policies

## Usage

### 1. Prepare Inventory
Create an Ansible inventory file with your router definitions:

```yaml
all:
  children:
    p_routers:
      hosts:
        p01:
          router_type: p
          router_id: 10.255.0.1
          management_ipv4: 192.168.101.111
          isis_net: 49.0001.0102.5500.0001.00
          node_segment_index: 1
          interfaces:
            - name: Ethernet1
              description: "P2P_pe01_Ethernet1"
              ip_address: 10.255.3.1/31
              isis_enable: CORE
              isis_circuit_type: level-2
              isis_metric: 50
              isis_hello_padding: true
              isis_network: point-to-point
              isis_auth_mode: md5
              isis_auth_key: 7 CF67+ktUmao=
```

### 2. Run Configuration Generation
```bash
cd labs/ansible-templates
ansible-playbook -i ../your-inventory.yml playbooks/generate_configs.yml
```

### 3. Generated Files
The playbook will create:
- `output/router-name.cfg` - Individual router configurations
- `output/topology.clab.yml` - Containerlab topology file

## Customization

### Adding New Router Types
1. Create a new variable file in `vars/` (e.g., `ce_router_vars.yml`)
2. Define router-specific variables and configurations
3. Update the inventory with `router_type: ce`

### Extending Templates
- Add new protocol support in `router_config.j2`
- Include conditional blocks for different features
- Add new variable types in the vars files

### Topology Generation
Set these variables when running the playbook:
```bash
ansible-playbook playbooks/generate_configs.yml \
  -e "topology_name=my-lab" \
  -e "topology_nodes=[{name: 'r1', description: 'Router 1', mgmt_ipv4: '192.168.101.10', startup_config: 'configs/r1.cfg'}]" \
  -e "topology_links=[{description: 'r1 to r2', endpoints: ['r1:eth1', 'r2:eth1']}]"
```

## Examples

### Basic P Router Configuration
```yaml
p01:
  router_type: p
  router_id: 10.255.0.1
  management_ipv4: 192.168.101.111
  interfaces:
    - name: Ethernet1
      ip_address: 10.255.3.1/31
      isis_enable: CORE
```

### PE Router with VPN
```yaml
pe01:
  router_type: pe
  asn: 65000
  router_id: 10.255.1.1
  bgp_neighbor: 10.255.1.5
  ce_neighbor: 10.1.22.2
  ce_asn: 65002
  interfaces:
    - name: Ethernet4
      vrf: TEST
      ip_address: 10.1.22.1/24
      ip_ospf_area: 0.0.0.0
```

## Benefits

- **Consistency**: Standardized configurations across labs
- **Reusability**: Templates work for multiple network scenarios
- **Maintainability**: Centralized configuration logic
- **Scalability**: Easy to add new router types and features
- **Automation**: Generate complete labs from simple variable definitions

## Integration with Existing Labs

These templates were created based on the configurations in `labs/l3vpn-101` and `labs/l3vpn-interas`. You can use them to:
- Regenerate existing lab configurations
- Create variations of existing labs
- Build new labs with similar architectures
- Maintain consistency across all your network labs
