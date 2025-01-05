clean:
	rm -f *.pyc && rm -rf dist

build:
	uv build

test:
	uv run pytest test

publish: clean test build
	uv run twine upload dist/*