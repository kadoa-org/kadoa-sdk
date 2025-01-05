.PHONY: clean
clean:
	rm -f *.pyc && rm -rf dist

.PHONY: build
build:
	uv build

.PHONY: test
test:
	uv run pytest test

.PHONY: publish
publish: clean test build
	uv run twine upload dist/*