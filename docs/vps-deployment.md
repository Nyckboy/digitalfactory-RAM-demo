# VPS deployment

This repository deploys only the browser-based demo. It does not start the Java backend, PostgreSQL, or any external API service.

## Run it with Docker Compose

On the VPS, clone or upload this repository, then run the following from the repository root:

```sh
cp .env.example .env
docker compose up -d --build
docker compose ps
```

The site will be available at `http://YOUR_VPS_IP:3003` by default. To use another unused host port, set `DIGITALFACTORY_PORT` in `.env` before starting the container, then rerun `docker compose up -d`.

Useful operations:

```sh
docker compose logs -f
docker compose up -d --build
docker compose down
```

## Deploy from Jenkins on this VPS

Create a Pipeline job from this repository and configure its agent to run on this VPS. The Jenkins service account must be allowed to use Docker (typically by membership of the `docker` group), and the agent needs Node 22.18+ and pnpm through the Jenkins `Node22` tool configuration.

Run the job with `ACTION=DEPLOY`. Jenkins will run the tests, build the image, and execute `docker compose up -d --build`. The default `BUILD` action only validates and archives the static site; it does not deploy it.

If your VPS firewall is enabled and you are accessing the port directly, allow the chosen TCP port (for example, `3003`). Do not expose the port publicly when using the reverse-proxy option below.

## Put it behind your existing Nginx reverse proxy

For a domain such as `demo.example.com`, keep the Compose service private to the VPS by changing its port mapping to:

```yaml
ports:
  - "127.0.0.1:3003:80"
```

Then add this server block to the existing host-level Nginx configuration, replace the domain, and reload Nginx after obtaining a TLS certificate:

```nginx
server {
    listen 80;
    server_name demo.example.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The app is a single-page app, and its container Nginx configuration already routes deep links to `index.html`.
