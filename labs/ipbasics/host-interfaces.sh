
#!/bin/sh


sudo docker exec host1 ip addr add 103.0.0.2/24 dev eth1
sudo docker exec host2 ip addr add 103.0.0.3/24 dev eth1
sudo docker exec server ip addr add 103.0.0.3/24 dev eth2
sudo docker exec host2 ip addr add 104.0.0.3/24 dev eth1
sudo docker exec host1ip route add 104.0.0.0/24 via 103.0.0.254 dev eth1


