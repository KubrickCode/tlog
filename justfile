set dotenv-load

root_dir := justfile_directory()
extension_dir := root_dir + "/extension"

deps:
  cd "{{ extension_dir }}" && yarn install

install-package:
  cd "{{ extension_dir }}" && yarn install-package

package:
  cd "{{ extension_dir }}" && yarn compile && yarn package

publish:
  cd "{{ extension_dir }}" && yarn vsce-publish && yarn ovsx-publish
