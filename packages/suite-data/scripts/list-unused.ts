// @ts-nocheck
const { spawnSync } = require('child_process');

import messages from '../../suite/src/support/messages';

console.log('unused messages: ');
for (const message in messages) {
    const { stdout } = spawnSync('bash', ['suite-data/scripts/find-unused.sh', message], {
        encoding: 'utf-8',
        cwd: '../',
    });

    if (!stdout) {
        console.log(message);
    }
}
