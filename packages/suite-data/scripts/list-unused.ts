// @ts-nocheck
const { spawnSync } = require('child_process');

import messages from '../../suite/src/support/messages';

const unused: string[] = [];

for (const message in messages) {
    console.log('checking: ', message);
    const { stdout } = spawnSync('bash', ['suite-data/scripts/find-unused.sh', message], {
        encoding: 'utf-8',
        cwd: '../',
    });

    if (!stdout) {
        unused.push(message);
        console.log('miss');
    } else {
        console.log('ok');
    }
}

if (unused.length) {
    console.log('not used:');
    console.log(unused);
    process.exit(1);
}
