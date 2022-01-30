// @ts-nocheck

/// <reference types="w3c-web-usb" />

import { EventEmitter } from 'events';
import { success, error } from '../utils/response';
import { AbstractTransport } from './abstract';
import type { Response } from './abstract';
import * as check from '../utils/highlevel-checks';

type TrezorDeviceInfoDebug = { path: string; debug: boolean };

const T1HID_VENDOR = 0x534c;

const TREZOR_DESCS = [
    // TREZOR v1
    // won't get opened, but we can show error at least
    { vendorId: 0x534c, productId: 0x0001 },
    // TREZOR webusb Bootloader
    { vendorId: 0x1209, productId: 0x53c0 },
    // TREZOR webusb Firmware
    { vendorId: 0x1209, productId: 0x53c1 },
];

const CONFIGURATION_ID = 1;
const INTERFACE_ID = 0;
const ENDPOINT_ID = 1;
const DEBUG_INTERFACE_ID = 1;
const DEBUG_ENDPOINT_ID = 2;

const ERROR_NO_WEBUSB = 'WebUSB is not available on this browser.';
const NOT_CONFIGURED = 'Transport not initialized';

class Webusb extends AbstractTransport {
    name = `WebUsbPlugin`;

    version = '';
    debug = false;

    usb: USB;

    allowsWriteAndEnumerate = true;

    configurationId = CONFIGURATION_ID;
    normalInterfaceId = INTERFACE_ID;
    normalEndpointId = ENDPOINT_ID;
    debugInterfaceId = DEBUG_INTERFACE_ID;
    debugEndpointId = DEBUG_ENDPOINT_ID;

    unreadableHidDevice = false;

    unreadableHidDeviceChange = new EventEmitter();

    init(debug = false) {
        this.debug = debug;
        const { usb } = navigator;
        if (!usb) {
            return error('WebUSB is not available on this browser.');
        }
        this.usb = usb;
        // todo: unify success message
        return success('initiated');
    }

    _deviceHasDebugLink(device: USBDevice) {
        try {
            const iface = device.configurations[0].interfaces[DEBUG_INTERFACE_ID].alternates[0];
            return (
                iface.interfaceClass === 255 &&
                iface.endpoints[0].endpointNumber === DEBUG_ENDPOINT_ID
            );
        } catch (e) {
            return false;
        }
    }

    _deviceIsHid(device: USBDevice) {
        return device.vendorId === T1HID_VENDOR;
    }

    // : Promise<Array<{ path: string; device: USBDevice; debug: boolean }>>
    async _listDevices() {
        let bootloaderId = 0;
        const devices = await this.usb.getDevices();
        console.log('devices', devices);
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_DESCS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );
            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this._deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this._deviceIsHid(dev));

        this._lastDevices = nonHidDevices.map(device => {
            // path is just serial number
            // more bootloaders => number them, hope for the best
            const { serialNumber } = device;
            let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
            if (path === 'bootloader') {
                bootloaderId++;
                path += bootloaderId;
            }
            const debug = this._deviceHasDebugLink(device);
            return { path, device, debug, vendor: 1, product: 111 };
        });

        const oldUnreadableHidDevice = this.unreadableHidDevice;
        this.unreadableHidDevice = hidDevices.length > 0;

        if (oldUnreadableHidDevice !== this.unreadableHidDevice) {
            this.unreadableHidDeviceChange.emit('change');
        }
        console.log('_lastDevices', this._lastDevices);
        return this._lastDevices;
    }

    _lastDevices: Array<{ path: string; device: USBDevice; debug: boolean }> = [];

    // : Promise<USBDevice>
    _findDevice(path: string) {
        const deviceO = this._lastDevices.find(d => d.path === path);
        if (deviceO == null) {
            throw new Error(`Action was interrupted.`);
        }
        return deviceO.device;
    }

    async send(path: string, data: ArrayBuffer, debug: boolean) {
        if (!this.configured) {
            return error(NOT_CONFIGURED);
        }
        const device = await this._findDevice(path);

        const newArray = new Uint8Array(64);
        newArray[0] = 63;
        newArray.set(new Uint8Array(data), 1);

        if (!device.opened) {
            await this.connect(path, debug, false);
        }

        const endpoint = debug ? this.debugEndpointId : this.normalEndpointId;

        const result = await device.transferOut(endpoint, newArray);
        // type USBTransferStatus = "ok" | "stall" | "babble";
        if (result.status === 'ok') {
            return success('sending done');
        } else {
            // todo:
            return error('sending ??? ' + result.status);
        }
    }

    // todo: is that ever used???
    // : Promise<ArrayBuffer>
    async receive(path: string, debug: boolean): Response<ArrayBuffer> {
        if (!this.configured) {
            return error(NOT_CONFIGURED);
        }
        const device: USBDevice = await this._findDevice(path);
        const endpoint = debug ? this.debugEndpointId : this.normalEndpointId;

        try {
            if (!device.opened) {
                await this.connect(path, debug, false);
            }

            const res = await device.transferIn(endpoint, 64);
            if (!res.data) {
                return error('missing data');
            }
            if (res.data.byteLength === 0) {
                return this.receive(path, debug);
            }
            return success(res.data.buffer.slice(1));
        } catch (e) {
            if (e.message === 'Device unavailable.') {
                return error('Action was interrupted.');
            }

            return error(e.message as string);
        }
    }

    async connect(path: string, debug: boolean, first: boolean) {
        for (let i = 0; i < 5; i++) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(() => resolve(undefined), i * 200));
            }
            try {
                return await this._connectIn(path, debug, first);
            } catch (e) {
                // ignore
                if (i === 4) {
                    return error('failed to connect');
                }
            }
        }
    }

    async _connectIn(path: string, debug: boolean, first: boolean) {
        const device: USBDevice = await this._findDevice(path);
        await device.open();

        if (first) {
            await device.selectConfiguration(this.configurationId);
            try {
                // reset fails on ChromeOS and windows
                await device.reset();
            } catch (error) {
                // do nothing
            }
        }

        const interfaceId = debug ? this.debugInterfaceId : this.normalInterfaceId;
        await device.claimInterface(interfaceId);
        // return success('')
    }

    async disconnect(path: string, debug: boolean, last: boolean) {
        const device: USBDevice = await this._findDevice(path);

        const interfaceId = debug ? this.debugInterfaceId : this.normalInterfaceId;
        await device.releaseInterface(interfaceId);
        if (last) {
            await device.close();
        }
    }

    async requestDevice() {
        try {
            console.log('webusb requestDevice');
            // I am throwing away the resulting device, since it appears in enumeration anyway
            const result = await this.usb.requestDevice({ filters: TREZOR_DESCS });
            console.log('requestDevice', result);
            return result;
        } catch (err) {
            console.log(err);
            return error(err.message);
        }
    }

    requestNeeded = true;

    // : Promise<Array<TrezorDeviceInfoDebug>>
    async enumerate() {
        if (!this.configured) {
            return error(NOT_CONFIGURED);
        }
        const devices = await this._listDevices();
        console.log('devicesxx', devices);
        return check.enumerate(
            devices.map(info => ({
                path: info.path,
                debug: info.debug,
                vendor: info.vendor,
                product: info.product,
            })),
        );
    }
}

export { Webusb };
