set dotenv-load := true

root_dir := justfile_directory()
extension_dir := root_dir + "/src"

degit source_dir target_dir:
    degit https://github.com/KubrickCode/general/{{ source_dir }} {{ target_dir }}

deps: deps-extension deps-root

deps-extension:
    cd "{{ extension_dir }}" && yarn install

deps-root:
    cd "{{ root_dir }}" && yarn install

lint target="all":
    #!/usr/bin/env bash
    set -euox pipefail
    case "{{ target }}" in
      all)
        just lint extension
        just lint config
        just lint justfile
        ;;
      extension)
        prettier --write "{{ extension_dir }}/src/**/*.ts"
        cd "{{ extension_dir }}"
        yarn lint
        ;;
      config)
        prettier --write "**/*.{json,yml,yaml,md}"
        ;;
      justfile)
        just --fmt --unstable
        ;;
      *)
        echo "Unknown target: {{ target }}"
        exit 1
        ;;
    esac

install-degit:
    #!/usr/bin/env bash
    if ! command -v degit &> /dev/null; then
      npm install -g degit
    fi

install-package:
    cd "{{ root_dir }}" && yarn install-package

package:
    cd "{{ extension_dir }}" && yarn compile
    cd "{{ root_dir }}" && yarn package

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
    cd "{{ root_dir }}"
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

release version="patch":
    @echo "🚀 Creating {{ version }} release..."
    npm version {{ version }}
    git push origin main --tags
    git checkout release
    git merge main
    git push origin release
    git checkout main
    @echo "✅ Release complete! Check GitHub Actions."
