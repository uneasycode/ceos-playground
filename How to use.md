# cEOS Playground in Github Codespaces

Firstly start by accessing Github repo
https://github.com/uneasycode/ceos-playground

1. Go to Code Tab (Green Colour)
2. Click and go to Codespace. Clock on Three dots and select "new with options" 
3. Change the default devcontainer to "Containerlab ACLABS Environment" option
4. Click on create codespaces

<This will take some time, about 10 minutes> <Wait patiently>

Once the codespace is open, there are two things:
1. Left side has all your files, this will be the same as the one you saw in the github repository
2. Bottom there will be a terminal open. All commands will go here

Load Arista image:
1. Execute below commands to automatically download Arista image from their downloads site
ardl --token "45a3e6194305ac2261e8da6d4d4b0d13" get eos --format cEOS --version 4.34.1F

2. Load image into docker 
docker import cEOS-lab-4.34.1F.tar.xz ceos:4.34.1F

All ready to go.
Now nativagate to your preferred lab.

In first case its ipbasics lab

cd labs/ipbasics

open the png file to view network diagram

Deploy containerlab topology

clab deploy


Wait for 5 minutes, your lab is setup, you should see the devices running active using the "docker ps" command

docker ps


Login into Switch

ssh switch 
<pass word is admin>

Configure VLAN100 and add all ports to it 

enable
conf t 
vlan 100
int eth1 
switchport access vlan 100
int eth2 
switchport access vlan 100
int eth3 
switchport access vlan 100
int eth4 
switchport access vlan 100
end
exit


Login to router:

Add ip address and routing capability

enable
conf t 
ip routing
int eth3
ip address 103.0.0.254/24
end
exit


run script host_config.sh to load host IPs.

sh host_config.sh


### All set to go




This repository is forked from diogo-arista ceos-101 repo.
In this repository I have added some basic networking labs intended to help learn networking concepts as well as have a baseline while troubleshooting network issues

I have also taken the topology and some config from Titom73's arista-eos-mpls-sr-evpn repository and modified it for simple protocol use cases

All individual labs are available in labs/ folder containing:
### 1. Containerlab topology file 
### 2. Topology Diagram
### 3. Init Config
### 4. Ansible playbook to load custom configs to troubleshoot different scenarios

To use this repo to test scenarios within github codespaces, please follow the instructions uploaded by diogo and start the relevant clab to get the  topology started
https://arista.my.site.com/AristaCommunity/s/article/Getting-Started-with-cEOS-lab-in-Containerlab

Detailed instructions will follow once more labs are uploaded and this repo becomes more mature
