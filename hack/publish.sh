#!/usr/bin/env bash

set -e
set -x

# e.g.
# v0.6.0 for a tag
# v0.6.0-1-gf0a2b3c for some non-tagged commit
NEW_VERSION=$(git describe --always --tags --match "v*")

# npm requires that leading v to be stripped to be "valid semver"
# e.g. 0.6.0
STRIPPED_NEW_VERSION=$(echo $NEW_VERSION | sed -e 's/^v//')

echo "npmAuthToken: $NPM_TOKEN" >> ../../.yarnrc.yml

cat ../../.yarnrc.yml

jq --arg new_version "$NEW_VERSION" '.version = $new_version' package.json > tmp.json && mv tmp.json package.json

cat package.json

yarn clean
yarn tsc
yarn build

# don't git commit or push
yarn npm publish --tag $STRIPPED_NEW_VERSION --access public #--new-version $STRIPPED_NEW_VERSION --no-git-tag-version
