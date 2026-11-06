set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
image := env_var_or_default("TRMNLP_IMAGE", "trmnl/trmnlp@sha256:5558373f96d84897c59bbfe435e0165c1ce99f4fe67de776f1d82c811fbde9fe")

default:
    @just --list

lint module:
    docker run --rm -v "{{justfile_directory()}}/{{module}}:/plugin" "{{image}}" lint

test module:
    docker run --rm -v "{{justfile_directory()}}/{{module}}:/plugin" "{{image}}" test --report report
    docker run --rm -v "{{justfile_directory()}}/{{module}}:/plugin" --entrypoint sh "{{image}}" -c 'if ls tests/*_test.js >/dev/null 2>&1; then node --test tests/*_test.js; fi'

build module:
    docker run --rm -v "{{justfile_directory()}}/{{module}}:/plugin" "{{image}}" build --png

serve module port="4567":
    docker run --rm -p "127.0.0.1:{{port}}:{{port}}" -v "{{justfile_directory()}}/{{module}}:/plugin" "{{image}}" serve --bind 0.0.0.0 --port "{{port}}"
