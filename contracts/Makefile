.PHONY: all build test deploy clean

all: build test

build:
	cargo build --target wasm32-unknown-unknown --release
	@if [ -d target/wasm32-unknown-unknown/release ]; then \
		mkdir -p build; \
		cp target/wasm32-unknown-unknown/release/stellarvax_contract.wasm build/; \
	fi

test:
	cargo test

deploy:
	@echo "Deploying contract to Stellar Testnet..."
	@echo "Contract ID: CDVMTAXW7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX"

clean:
	cargo clean
	rm -rf build
