# modules/

Reserved for backend domain modules that may live outside `apps/api/src/modules/` in the future. 

Prefer modules inside `apps/api/src/modules/` for the modular monolith. Only extract to this directory with an ADR proving need (separate deployable, isolated team ownership, independent versioning).
