

#!/bin/sh
sudo docker exec host1 ip link set eth0 up
sudo docker exec host1 ip addr add 192.168.101.3/24 dev eth1


sudo docker exec host1 ip link set eth1 up
sudo docker exec host1 ip addr add 103.0.0.1/24 dev eth1
sudo docker exec host1 ip route add 192.168.0.0/16 via 103.0.0.254 dev eth1
sudo docker exec host1 ip route add 10.10.10.0/24 via 103.0.0.254 dev eth1



sudo docker exec host2 ip link set eth0 up
sudo docker exec host2 ip addr add 192.168.101.4/24 dev eth1


sudo docker exec host1 ip link set eth1 up
sudo docker exec host1 ip addr add 103.0.0.2/24 dev eth1
sudo docker exec host1 ip route add 192.168.0.0/16 via 103.0.0.254 dev eth1
sudo docker exec host1 ip route add 10.10.10.0/24 via 103.0.0.254 dev eth1



sudo docker exec server ip link set eth0 up
sudo docker exec server ip addr add 192.168.101.4/24 dev eth1


sudo docker exec server ip link set eth1 up
sudo docker exec server ip addr add 103.0.0.2/24 dev eth1
sudo docker exec server ip route add 192.168.0.0/16 via 103.0.0.254 dev eth1
sudo docker exec server ip route add 10.10.10.0/24 via 103.0.0.254 dev eth1

