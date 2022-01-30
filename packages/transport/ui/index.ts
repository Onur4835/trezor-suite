import { Webusb } from '../src/transports/webusb';
import * as messages from '../../integration-tests/projects/transport/messages.json';

const transport = new Webusb();

console.log('meow', transport);

const run = async () => {
    const init = await transport.init();
    console.log('init', init);
    const configure = await transport.configure(messages);
    console.log('configure', configure);

    const enumerate = await transport.enumerate();
    console.log('enumerate', enumerate);

    // @ts-ignore
    window.transport = transport;
};

setTimeout(async () => {
    const enumerate = await transport.enumerate();
    console.log('enumerate', enumerate);
}, 30000);

run();
