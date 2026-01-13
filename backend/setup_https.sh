#!/bin/bash

# 1. Install Certbot (for free SSL)
echo "Installing Certbot..."
sudo dnf install -y certbot python3-certbot-nginx

# 2. Update Nginx Config
echo "Updating Nginx configuration..."
sudo cp ./nginx/hashview.conf /etc/nginx/conf.d/hashview.conf

# 3. Reload Nginx to apply changes
echo "Reloading Nginx..."
sudo systemctl reload nginx

# 4. Run Certbot to get SSL
echo "Requesting SSL Certificate (Follow instructions)..."
sudo certbot --nginx -d hashview.44.249.50.162.nip.io
