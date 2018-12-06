---
title: How to Setup a Perfect Kubernetes Cluster using KOPS in AWS
date: "2018-12-10T22:40:32.169Z"
---

There is no doubt KOPS has a major share in boosting the adoption rate for Kubernetes as it makes setting up a cluster so darn easy that it just works! Today, I'll walk you through the detailed steps to create a Kubernetes cluster with 3 master nodes and 2 worker nodes with 1 AWS On-demand instance and 1 AWS Spot instance within a private topology with multi-availability zones deployment.

### Prerequisites

Before you begin this guide you'll need the following:

- Familiarity with AWS (of course), along with an AWS account
- Domain to access Kubernetes APIs
- Hosted Zone in Route53 for the Domain
- SSL certificate using ACM for the Domain
- IAM user with full S3, EC2, Route53 and VPC access
- Linux machine acting as deployment server, preferably Ubuntu 16.04 or later
- AWS-CLI version 1.16 or above
- Botocore version 1.12 or above


### Step 1 — Presetup for the cluster

I'll be creating my cluster in Asia-Pacific South Mumbai (ap-south) region.

SSH into your deployment server, make sure you have sudo access.

Install Kubectl using the package manager as following:

```bash
$ sudo apt-get update && sudo apt-get install -y apt-transport-https
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
$ echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list
$ sudo apt-get update
$ sudo apt-get install -y kubectl
```
Check if latest version of kubectl was installed successfully by executing,

```bash
$ kubectl version
```

Download the latest stable [kops-linux-amd64](https://github.com/kubernetes/kops/releases/latest) release available on Github from [https://github.com/kubernetes/kops/releases/latest](https://github.com/kubernetes/kops/releases/latest).

Or use wget to download the binary:

```bash
$ wget https://github.com/kubernetes/kops/releases/download/1.10.0/kops-linux-amd64
```

Now grant execute permission to the kops binary and move it to binary directory path as:
```bash
$ chmod +x kops-linux-amd64
$ mv kops-linux-amd64 /usr/local/bin/kops
```

Now let us set an environment variable to use across the setup process. First variable would be for the AWS region in which we are going to setup our cluster, we can do it as:

```bash
$ export REGION=ap-south-1
```

Kops uses S3 bucket to store the state of the cluster so that it can be kept persistent. Let us create a S3 bucket for kops to use.

```bash
$ aws s3api create-bucket --bucket k8s-state-store --region ${REGION}
$ aws s3api put-bucket-versioning --bucket k8s-state-store --versioning-configuration Status=Enabled
$ aws s3api put-bucket-encryption --bucket k8s-state-store --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

Now let us create another environment variable for kops to refer to this S3 bucket as following:

```bash
$ export KOPS_STATE_STORE=s3://k8s-pharmeasy-in-state-store
```

And finally, we'll have the name of the cluster as our final environment variable,

```bash
$ export NAME=krish512.com
```

## Step 2 — Create Kubernetes Cluster Config

This is the interesting section where you can configure and customize your cluster setup.

Let us first create a cluster config using the following command.

We are creating cluster across multiple availability zones, hence our zones will be `ap-south-1a` and  `ap-south-1b`

Our cluster will be using only private IPs and externally access will be only via the load balancer, hence our topology will be `private`

As Calico has the best performance and features as CNI, we'll keep our networking as `Calico`

Lastly, we'll have 3 master nodes of type `t2.micro` and worker node of type `t2.large`

With this, we can use the following command to create our cluster config which we'll further customize in next steps.

```bash
$ kops create cluster --zones ap-south-1a,ap-south-1b --topology private --networking calico --master-size t2.micro --master-count 3 --node-size t2.large ${NAME}
```

```bash
$ kops create secret --name ${NAME} sshpublickey admin -i ~/.ssh/id_rsa.pub
```

```bash
$ kops edit cluster ${NAME}
```

```bash
$ kops create ig nodes-spot --role node --subnet ap-south-1a,ap-south-1b --name ${NAME}
```


```bash
$ kops edit ig --name=${NAME} master-ap-south-1a-1
```

```yaml
apiVersion: kops/v1alpha2
kind: InstanceGroup
metadata:
  creationTimestamp: 2018-11-30T07:32:39Z
  labels:
    kops.k8s.io/cluster: dev.pharmeasy.in
    Environment: Development
    Name: pe-mum-ec2-development-k8s-master
    Role: Master
    Project: Kubernetes
    Team: DevOps
  name: master-ap-south-1a-1
spec:
  image: kope.io/k8s-1.10-debian-jessie-amd64-hvm-ebs-2018-08-17
  machineType: t2.micro
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-ap-south-1a-1
  role: Master
  subnets:
  - ap-south-1a
```


```bash
$ kops edit ig --name=${NAME} master-ap-south-1a-2
```

```yaml
apiVersion: kops/v1alpha2
kind: InstanceGroup
metadata:
  creationTimestamp: 2018-11-30T07:32:39Z
  labels:
    kops.k8s.io/cluster: dev.pharmeasy.in
    Environment: Development
    Name: pe-mum-ec2-development-k8s-master
    Role: Master
    Project: Kubernetes
    Team: DevOps
  name: master-ap-south-1a-2
spec:
  image: kope.io/k8s-1.10-debian-jessie-amd64-hvm-ebs-2018-08-17
  machineType: t2.micro
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-ap-south-1a-2
  role: Master
  subnets:
  - ap-south-1a
```


```bash
$ kops edit ig --name=${NAME} master-ap-south-1b-1
```

```yaml
apiVersion: kops/v1alpha2
kind: InstanceGroup
metadata:
  creationTimestamp: 2018-11-30T07:32:39Z
  labels:
    kops.k8s.io/cluster: dev.pharmeasy.in
    Environment: Development
    Name: pe-mum-ec2-development-k8s-master
    Role: Master
    Project: Kubernetes
    Team: DevOps
  name: master-ap-south-1b-1
spec:
  image: kope.io/k8s-1.10-debian-jessie-amd64-hvm-ebs-2018-08-17
  machineType: t2.micro
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-ap-south-1b-1
  role: Master
  subnets:
  - ap-south-1b
```


```bash
$ kops edit ig --name=${NAME} nodes
```

```yaml
apiVersion: kops/v1alpha2
kind: InstanceGroup
metadata:
  creationTimestamp: 2018-11-30T07:32:39Z
  labels:
    kops.k8s.io/cluster: dev.pharmeasy.in
    Environment: Development
    Name: pe-mum-ec2-development-k8s-node
    Role: Node
    Project: Kubernetes
    Team: DevOps
  name: nodes
spec:
  image: kope.io/k8s-1.10-debian-jessie-amd64-hvm-ebs-2018-08-17
  machineType: t2.large
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: nodes
  role: Node
  subnets:
  - ap-south-1a
  - ap-south-1b
```


```bash
$ kops edit ig --name=${NAME} nodes-spot
```

```yaml
apiVersion: kops/v1alpha2
kind: InstanceGroup
metadata:
  creationTimestamp: 2018-11-30T07:45:35Z
  labels:
    kops.k8s.io/cluster: dev.pharmeasy.in
    Environment: Development
    Name: pe-mum-ec2-development-k8s-node
    Role: Node
    Project: Kubernetes
    Team: DevOps
  name: nodes-spot
spec:
  image: kope.io/k8s-1.10-debian-jessie-amd64-hvm-ebs-2018-08-17
  machineType: t2.large
  maxPrice: "0.09"
  maxSize: 2
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: nodes-spot
  role: Node
  subnets:
  - ap-south-1a
  - ap-south-1b
```

## Step 3 — Deploy Cluster

This is where the magic happens

```bash
$ kops update cluster ${NAME}
$ kops update cluster ${NAME} --yes

$kops validate cluster

$ kubectl get nodes

$ kubectl config view
```

## Additional Steps

You can upgrade the cluster to latest Kubernetes version with kops releases supporting the version. To check for version upgrade, use the following command:

```bash
$ kops upgrade cluster ${NAME}
```

This will check for upgrade and execute a preview of upgrade. To execute cluster upgrade, execute the following command:

```bash
$ kops upgrade cluster ${NAME} --yes
```

## Conclusion

We've successfully setup our Kubernetes cluster on AWS Cloud within a Virtual Private Network and accessible using the api load balancer. Follow the steps from the next post to install Kubernetes Dashboard for a management UI and Ambassador as API gateway for services within the cluster.
