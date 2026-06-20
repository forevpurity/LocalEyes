# ADR 8: Deploy by building images on the VPS, not via a container registry

Continuous deployment SSHes into the VPS and runs `git pull && docker compose up -d --build`
in place — the box compiles the `client` and `server` images itself on every deploy. We do
**not** build images in GitHub Actions and push them to a registry (GHCR) for the VPS to pull.
A future reader will reasonably ask "why is the production server spending CPU and RAM
recompiling images instead of pulling prebuilt ones?" — this records why.

The registry path is the more conventional, more scalable choice: it keeps the VPS lean,
makes deploys fast and atomic (pull a tag, swap containers), and gives you immutable,
rollback-able artifacts. But it costs real complexity we don't need yet: GHCR authentication
on both ends, a compose override that references `image:` tags instead of `build:` contexts,
a tagging/versioning scheme, and registry login on the box. For a **single-VPS, single-maintainer
demo** the build-on-box approach is strictly less machinery — the deploy is byte-for-byte the
manual flow we already run (and document in the README), just triggered by CI instead of by
hand. CI already runs the same `npm run build` the Dockerfiles do, so a broken build is caught
before it ever reaches the VPS.

The trade-off we accept: each deploy consumes VPS CPU/RAM for the build, and a long or failing
build briefly disrupts the box rather than failing harmlessly in CI. On a small demo VPS this
is tolerable; `docker image prune -f` after each rebuild keeps old layers from filling the disk.

This is **hard to reverse**: moving to a registry later reshapes the pipeline (build+push jobs,
GHCR auth) and the compose file (`image:` instead of `build:`). The trigger to switch is when
any of these become true — more than one server instance/host, deploys slow enough to hurt, or
a need for instant rollback to a known image tag. Until then, build-on-box stays.

Related: deploys are **code-only** — they never run `db:push` or `db:seed`. `drizzle-kit push`
prompts interactively on destructive schema changes (no TTY over SSH = a hung deploy), and the
seed is destructive by design and refuses production (see ADR-0007). Schema changes are a
deliberate manual step on the box: `docker compose run --rm tools npm run db:push`.
