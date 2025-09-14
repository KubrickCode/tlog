set dotenv-load

root_dir := justfile_directory()
extension_dir := root_dir + "/src"

deps:
  cd "{{ extension_dir }}" && yarn install

install-package:
  cd "{{ extension_dir }}" && yarn install-package

package:
  cd "{{ extension_dir }}" && yarn compile && yarn package

test mode="":
  #!/usr/bin/env bash
  cd "{{ extension_dir }}"
  if [ "{{ mode }}" = "watch" ]; then
    yarn test:watch
  elif [ "{{ mode }}" = "coverage" ]; then
    yarn test --coverage
  else
    yarn test
  fi

publish target="both":
  #!/usr/bin/env bash
  cd "{{ extension_dir }}"
  if [ "{{ target }}" = "vsce" ] || [ "{{ target }}" = "both" ]; then
    echo "Publishing to VS Code Marketplace..."
    if [ -n "$VSCE_ACCESS_TOKEN" ]; then
      yarn vsce-publish --pat "$VSCE_ACCESS_TOKEN"
    else
      yarn vsce-publish
    fi
  fi
  if [ "{{ target }}" = "ovsx" ] || [ "{{ target }}" = "both" ]; then
    echo "Publishing to Open VSX Registry..."
    if [ -n "$OVSX_ACCESS_TOKEN" ]; then
      yarn ovsx-publish --pat "$OVSX_ACCESS_TOKEN"
    else
      yarn ovsx-publish
    fi
  fi
