```diff
- THIS CODEBASE HAS NOT BEEN AUDITED
```

# Randao Accessor

Access historical `prevrandao` values onchain by submitting RLP-encoded block headers and validating them against block hashes. When accessing blocks older than the previous 256 blocks, extra witness data is required to validate against [Axiom's block hash cache](https://docs.axiom.xyz/developers/reading-historic-block-data).

## Generating inputs

To generate RLP-encoded block headers, you'll need access to an Ethereum execution RPC. See the `getBlockWithRLP` function in `test/util/rlp.ts` for an example of how to fetch block data and how to encode the data into RLP format.

A witness can be generated using the [Axiom SDK](https://www.npmjs.com/package/@axiom-crypto/core) when accessing older blocks. See [Reading Historic Block Data](https://docs.axiom.xyz/developers/reading-historic-block-data) for more information.
