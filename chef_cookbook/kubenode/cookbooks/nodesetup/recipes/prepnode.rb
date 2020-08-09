#
# Cookbook:: nodesetup
# Recipe:: prepnode
#
# Copyright:: 2020, The Authors, All Rights Reserved.

apt_update 'apt update' do
    frequency 86400
    action :periodic
end

execute 'add dependencies' do
    command 'sudo apt-get update && apt-get install -y apt-transport-https && apt-get install -y software-properties-common && apt-get install -y curl'
    # action :nothing
end

execute 'add dependencies' do
    command 'sudo apt-get update && apt-get install -y apt-transport-https && apt-get install -y software-properties-common && apt-get install -y curl'
    # action :nothing
end

docker_service 'default' do
    action [:create, :start]
end

execute 'add kube keys' do
    command 'sudo curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add'
    # action :nothing
end

execute 'add new repo' do
    command 'echo deb http://apt.kubernetes.io/ kubernetes-xenial main>/etc/apt/sources.list.d/kubernetes.list'
end

execute 'update apt' do
    command 'sudo apt-get update'
end

execute 'install kube' do
    command 'sudo apt-get install -y kubelet kubeadm kubectl'
end

execute 'swap off' do
    command 'sudo swapoff -a'
end

execute 'install aws cli' do
    command 'sudo apt install awscli -y'
end

