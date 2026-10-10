# Releasing

The version lives in three places. `src/scripts/release-versions.mjs` keeps them
from drifting apart.

| Source | Records |
| --- | --- |
| `package.json` | the manifest version npm/bun resolve |
| git tag `vX.Y.Z` | the released revision |
| `CHANGELOG.md` | the newest `## [X.Y.Z]` heading |

## Check before committing

```sh
bun run release:check
```

Exits non-zero when the three disagree. CI should run it, because the manifest is
the one most likely to drift — it is not bumped automatically by anything else.

## Set the version

```sh
bun run release:version -- --to 0.4.0
```

Updates `package.json`, and adds a dated `## [0.4.0]` heading to `CHANGELOG.md`
**only if no section for that version exists yet**. An existing section is never
rewritten, so recorded notes survive.

The script does not commit, push, or create a tag unless asked. Committing is a
human decision.

To create the annotated tag in the same step:

```sh
bun run release:version -- --to 0.4.0 --tag
```

## Full release

```sh
bun run release:version -- --to 0.4.0 --tag
git add package.json CHANGELOG.md
git commit -m "chore(release): v0.4.0"
git push && git push --tags
```

Add the release notes under the new heading before committing — the script
creates the heading empty on purpose.

## When the check fails

The script reports the expected value. Two situations need a human decision
rather than a script fix.

**The changelog is ahead of the tag.** The newest heading is newer than the
latest tag. Someone recorded a release that was never tagged. The script will not
downgrade the changelog, because deleting recorded history is not something to do
automatically. Either tag the missing release if it really shipped, or remove the
heading.

**The manifest is behind the tag.** The manifest was not bumped with the release.
`--to <tag version>` fixes it, and `--tag` is a no-op because the tag exists.

## Versioning policy

SemVer, with the tag carrying the same `v` prefix as the existing ones.

- **patch** — bug fixes, no schema or API change
- **minor** — new feature, additive schema migration
- **major** — breaking change to the API contract or a destructive migration

Schema migrations that remove or re-constrain a column are breaking, regardless of
how small they look.