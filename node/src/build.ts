import dts from 'bun-plugin-dts';

const compile = async () => {
    // @ts-ignore
    await Bun.build({
        entrypoints: ['./src/index.ts'],
        outdir: './dist',
        plugins: [
          dts()
        ],
      })
}
compile();