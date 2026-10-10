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

Exits non-zero when `package.json` disagrees with the latest git tag. Run it in
CI — the manifest is the source most likely to drift, because nothing else bumps
it automatically.

The git tag is the authority. It records what actually shipped, it is created
deliberately, and it is immutable in practice. `CHANGELOG.md` is prose a human
edits, so it is never allowed to dictate the expected version.

That split is why the check has two outcomes:

| Situation | `release:check` |
| --- | --- |
| manifest matches the tag | pass |
| manifest differs from the tag | **fail**, with the exact `--to` to run |
| changelog heading differs from the tag | **warn**, with the manual fix |

A changelog mismatch warns instead of failing, because resolving it means either
adding a tag or editing recorded release history. A script must not do either
unasked, and letting it fail would leave the check permanently red with no
command able to fix it.

Once the changelog is trustworthy, run `bun run release:check:strict` to make
changelog drift fail too.

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

### manifest differs from the tag

The message carries the exact command. Run it and commit:

```sh
bun run release:version -- --to <version>
```

### changelog warning: "records a release that has no tag"

The newest heading is newer than every tag. Two readings, and the script refuses
to guess between them:

- **That release really shipped and its tag is missing** — create it:
  `git tag -a v<version> -m "Release <version>"`
- **The heading is wrong** — delete it by hand.

Note that `release:version` will not touch the changelog in this state: adding a
section for the target version would push the file further out of order, since
the newer heading is already at the top.

## Versioning policy

SemVer, with the tag carrying the same `v` prefix as the existing ones.

- **patch** — bug fixes, no schema or API change
- **minor** — new feature, additive schema migration
- **major** — breaking change to the API contract or a destructive migration

Schema migrations that remove or re-constrain a column are breaking, regardless of
how small they look.