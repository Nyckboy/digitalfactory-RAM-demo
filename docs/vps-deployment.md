# VPS deployment

This repository deploys only the browser-based demo. It does not start the Java backend, PostgreSQL, or any external API service.

## Run it with Docker Compose

On the VPS, clone or upload this repository, then run the following from the repository root:

```sh
cp .env.example .env
docker compose up -d --build
docker compose ps
```

The container listens only on `127.0.0.1:3003` by default, so it must be published through the host Nginx reverse proxy. To use another unused localhost port, set `DIGITALFACTORY_PORT` in `.env` before starting the container, then rerun `docker compose up -d`.

Useful operations:

```sh
docker compose logs -f
docker compose up -d --build
docker compose down
```

## Deploy from Jenkins on this VPS

Create a Pipeline job from this repository and configure its agent to run on this VPS. The Jenkins service account must be allowed to use Docker (typically by membership of the `docker` group), and the agent needs Node 22.18+ and pnpm through the Jenkins `Node22` tool configuration.

Run the job with `ACTION=DEPLOY`. Jenkins will run the tests, build the image, and execute `docker compose up -d --build`. The default `BUILD` action only validates and archives the static site; it does not deploy it.

Allow public TCP ports 80 and 443 through the VPS firewall. Do not open port 3003: it is private to the VPS.

## Put it behind your existing Nginx reverse proxy

The Compose service already binds to localhost. The repository provides an isolated Nginx virtual host for `ramdemo.mouadabbassid.com` at `deploy/nginx/ramdemo.mouadabbassid.com.conf`. Install it as a new site, test Nginx, and reload only when the test passes:

```sh
sudo cp deploy/nginx/ramdemo.mouadabbassid.com.conf /etc/nginx/sites-available/ramdemo.mouadabbassid.com
sudo ln -s /etc/nginx/sites-available/ramdemo.mouadabbassid.com /etc/nginx/sites-enabled/ramdemo.mouadabbassid.com
sudo nginx -t
sudo systemctl reload nginx
```

Before requesting the certificate, create a DNS `A` record for `ramdemo.mouadabbassid.com` pointing to this VPS's public IPv4 address. Once it resolves, obtain and install HTTPS without touching your other sites:

```sh
sudo certbot --nginx -d ramdemo.mouadabbassid.com --redirect
```

The app is a single-page app, and its container Nginx configuration already routes deep links to `index.html`.
