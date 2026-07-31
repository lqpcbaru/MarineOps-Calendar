# infrastructure/

Infrastructure as Code, deployment manifests, and local dev compose.

```
infrastructure/
├── docker/          # Dockerfiles, docker-compose for dev
├── scripts/         # Bootstrap, seed, migration helpers
└── environments/    # Per-environment config overrides
```

Deployment target: Docker-first, cloud-agnostic. Default cloud: AWS ECS/Fargate. On-prem supported via containers + PostgreSQL + MinIO.

See `docs/architecture/SYSTEM_ARCHITECTURE.md` §11.
