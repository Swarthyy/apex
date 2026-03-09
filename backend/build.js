const esbuild = require('esbuild');
try {
    esbuild.buildSync({
        entryPoints: ['src/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node24',
        outfile: 'dist/index.js',
        external: ['express', 'cors', 'dotenv', '@supabase/supabase-js', 'zod', 'date-fns']
    });
    console.log('Build successful');
} catch (e) {
    console.error('Build failed', e);
}
