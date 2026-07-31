# ADR-0001: Record architecture decisions

**Date:** 2026-07-27  
**Status:** Accepted  
**Deciders:** Chief Software Architect  

## Context

MarineOps is greenfield. Without a decision log, stack and boundary choices will be rediscovered verbally and drift.

## Decision

Use Architecture Decision Records under `docs/decisions/` with sequential numbering and the project template. Significant decisions (stack, tenancy, auth mechanism, module extraction, status model breaks) require an ADR before implementation.

## Consequences

### Positive

- Traceable rationale for future engineers  
- Clear supersession path  

### Negative / trade-offs

- Small process overhead on large changes  

## Alternatives considered

| Option | Why not |
|--------|---------|
| Wiki only | Not versioned with code |
| Slack/email decisions | Not durable |