---
title: How to Setup a Mail Server using Docker-MailServer
date: "2018-12-05T22:40:32.169Z"
---

Mail servers have always been the most difficult ones to be setup and manage. Always when I thought of creating my own mail server, I gave up just while choosing which mail server to use. In this post, we'll be setting up a simple email server using Docker, Let's Encrypt and Docker-mailserver

Refer the repo [tomav/docker-mailserver](https://github.com/tomav/docker-mailserver) for detailed steps and configuration

### Prerequisites

Before you begin this guide you'll need the following:

- Domain with name server hosted on Cloudflare (we'll use Cloudflare for this tutorial)
- Linux machine acting as deployment server, preferably Ubuntu 16.04 or later
- Docker version 18 or above

### Step 1 — Prepare Domain and Containers

In your Linux Host machine, let us create a folder where we will have our complete setup. I prefer using /var/mail directory as that in originally intended for mail server purpose, you may use any directory on your server.

Create a directory by the name of your domain as:

```bash
mkdir -p example.com
cd example.com
```

All the activity performed later in this post will be restricted inside the above created folder.

You need to have a domain purchased and name server for the same hosted on Cloudflare for this tutorial. For any other DNS hosting service you can refer their documentation and perform the equivalent steps.

As Let's Encrypt needs to validate your domain from the DNS hosting service provider, let us setup the credentials for Cloudflare authentication.
Open the Cloudflare dashboard, go to My Profile and get the Global API Key.

Create a file credentials within cloudflare folder and add your Cloudflare login email id and global api key as follows:

```bash
mkdir -p cloudflare
touch cloudflare/credentials

echo "dns_cloudflare_email = myawesomeemailid@provider.com" >> cloudflare/credentials
echo "dns_cloudflare_api_key = a1b2c3d4e5f6g7h8i9j0k >> cloudflare/credentials
```

Let us pull the images,

```bash
docker pull tvial/docker-mailserver:latest

docker pull certbot/dns-cloudflare:latest
```

Download the docker-compose.yml, the .env and the setup.sh files:

```bash
curl -o setup.sh https://raw.githubusercontent.com/tomav/docker-mailserver/master/setup.sh; chmod a+x ./setup.sh

curl -o docker-compose.yml https://raw.githubusercontent.com/tomav/docker-mailserver/master/docker-compose.yml.dist

curl -o .env https://raw.githubusercontent.com/tomav/docker-mailserver/master/.env.dist
```


## Step 2 — Create Certificates using Certbot

Create a folder for certbot to dump the SSL certificate files as:

```bash
mkdir -p certbot
```

Now let's execute the certbot docker container to generate the certificate files. Execute the following docker run command to start the docker container. Make sure you replace the domain `example.com` with your domain name before executing it

```bash
docker run \
          -v `pwd`/certbot:/etc/letsencrypt \
          -v `pwd`/cloudflare:/opt/cloudflare \
          --rm \
          -it certbot/dns-cloudflare certonly \
          --dns-cloudflare \
          --dns-cloudflare-credentials /opt/cloudflare/credentials \
          --email admin@example.com -\
          -agree-tos \
          -d example.com \
          -d *.example.com
```

The docker container may prompt you for some additional details. It will take about 2 minutes to validate the domain with Cloudflare and generate the certificates.

## Step 3 — Configure Mail Server

Edit the `.env` file and update the variables to match the values as per the following:

```ini

# Updated
HOSTNAME=mail

# Updated
DOMAINNAME=example.com

# Updated
CONTAINER_NAME=mail

# Updated
OVERRIDE_HOSTNAME=mail.example.com

DMS_DEBUG=0
ONE_DIR=0
POSTMASTER_ADDRESS=

# Updated
PERMIT_DOCKER=host

# Updated
TLS_LEVEL=intermediate

SPOOF_PROTECTION=1

ENABLE_SRS=0
ENABLE_POP3=
ENABLE_CLAMAV=0
ENABLE_FAIL2BAN=0
ENABLE_MANAGESIEVE=
POSTSCREEN_ACTION=enforce
SMTP_ONLY=

# Updated
SSL_TYPE=letsencrypt

VIRUSMAILS_DELETE_DELAY=

...
```

Edit the docker-compose.yml file to add the 465 SMTP SSL port and Let's Encrypt certificates directory as:

```yaml
version: '2'
services:
  mail:
    image: tvial/docker-mailserver:latest
    hostname: ${HOSTNAME}
    domainname: ${DOMAINNAME}
    container_name: ${CONTAINER_NAME}
    ports:
    - "25:25"
    - "143:143"
    - "465:465"
    - "587:587"
    - "993:993"
    volumes:
    - maildata:/var/mail
    - mailstate:/var/mail-state
    - ./config/:/tmp/docker-mailserver/
    - ./certbot/:/etc/letsencrypt/
    environment:
...
```

You can skip exposing port 25, 143 and 587 if you only want to use SSL when connecting from any mail client

## Step 4 — Start Mail Server and Add Users

```bash
docker-compose up -d mail
```

Add a new user to the mail server account using the setup command as:

```bash
./setup.sh email add admin@example.com password
```

## Step 5 — Configure DNS for the Mail Server

Add a A record to your DNS to point `mail.example.com` to your server's Public IP

Add an MX record for root domain `example.com` and mention the server as `mail.example.com` with priority set as 1

Generate DKIM keys:

```bash
./setup.sh config dkim 1024
```

Create a TXT record in Cloudflare for your domain with name as `mail._domainkey` and copy the content from `config/opendkim/keys/example.com/mail.txt` to the content of the TXT record

Restart the mail server container now:

```bash
docker-compose down
docker-compose up -d mail
```

Done! we have our mail server ready to send and receive mails across the internet

## Step 6 — Connect using Mail Client

You can use any email client to connect to your mail server, I use [Spark](https://sparkmailapp.com/). Use the following details to configure your email client to use the new email server we just created

#### IMAP

| Parameter | Value|
| --- | ----------- |
| Username | admin@example.com |
| Password | %&my\_**strong**\_password!# |
| Server | mail.example.com |
| Port with SSL | 993 (recommended) |
| Port with STARTTLS | 143 |

#### SMTP

| Parameter | Value|
| --- | ----------- |
| Username | admin@example.com |
| Password | %&my\_**strong**\_password!# |
| Server | mail.example.com |
| Port with SSL | 465 (recommended) |
| Port with STARTTLS | 587 or 25 |


## Conclusion

In about 15 minutes, we have setup our own mail server using Docker with certificate from Let's Encrypt. As a next step, you can explore the repo [tomav/docker-mailserver](https://github.com/tomav/docker-mailserver) for advanced configurations and tweak your mail server further to best suit your requirements.

Reach out to me with your new mail account

PS: Do not SPAM 😉 