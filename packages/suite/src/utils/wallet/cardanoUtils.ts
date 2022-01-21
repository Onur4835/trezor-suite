import {
    CARDANO,
    CardanoAddressType,
    CardanoCertificate,
    CardanoCertificateType,
    CardanoOutput,
} from 'trezor-connect';
import { coinSelection, types } from '@fivebinaries/coin-selection';
import { amountToSatoshi } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import {
    Output,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@wallet-types/sendForm';
import BigNumber from 'bignumber.js';
import { PoolsResponse, StakePool } from '@suite/types/wallet/cardanoStaking';

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getNetworkId = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.NETWORK_IDS.mainnet : CARDANO.NETWORK_IDS.testnet;

export const getAddressType = (accountType: Account['accountType']): 0 | 8 =>
    accountType === 'normal' ? CARDANO.ADDRESS_TYPE.Base : CARDANO.ADDRESS_TYPE.Byron;

export const getStakingPath = (
    accountType: Account['accountType'],
    accountIndex: Account['index'],
) => `m/${accountType === 'normal' ? 1852 : 44}'/1815'/${accountIndex}'/2/0`;

export const getChangeAddressParameters = (account: Account) => {
    if (!account.addresses || account.networkType !== 'cardano') return;
    const stakingPath = getStakingPath(account.accountType, account.index);

    return {
        address: account.addresses.change[0].address,
        addressParameters: {
            path: account.addresses.change[0].path,
            addressType: getAddressType(account.accountType),
            stakingPath,
        },
    };
};

export const transformUserOutputs = (
    outputs: Output[],
    maxOutputIndex?: number,
): types.UserOutput[] =>
    outputs.map((output, i) => {
        const setMax = i === maxOutputIndex;
        const amount = output.amount === '' ? undefined : amountToSatoshi(output.amount, 6);
        return {
            address: output.address === '' ? undefined : output.address,
            amount: output.token ? undefined : amount,
            assets: output.token
                ? [
                      {
                          unit: output.token,
                          quantity: output.amount || '0',
                      },
                  ]
                : [],
            setMax,
        };
    });

export const getShortFingerprint = (fingerprint: string) => {
    const firstPart = fingerprint.substring(0, 10);
    const lastPart = fingerprint.substring(fingerprint.length - 10);
    return `${firstPart}…${lastPart}`;
};

export const transformUtxos = (utxos: Account['utxo']): types.Utxo[] => {
    const result: types.Utxo[] = [];
    utxos?.forEach(utxo => {
        const foundItem = result.find(
            res => res.txHash === utxo.txid && res.outputIndex === utxo.vout,
        );

        if (utxo.cardanoSpecific) {
            if (!foundItem) {
                // path: utxo.path,
                result.push({
                    // path: utxo.path,
                    address: utxo.address,
                    txHash: utxo.txid,
                    outputIndex: utxo.vout,
                    amount: [{ quantity: utxo.amount, unit: utxo.cardanoSpecific.unit }],
                });
            } else {
                foundItem.amount.push({ quantity: utxo.amount, unit: utxo.cardanoSpecific.unit });
            }
        }
    });

    return result;
};

export const prepareCertificates = (certs: CardanoCertificate[]) => {
    // convert trezor-connect certificate format to cardano coin-selection lib format
    const convertedCerts: types.Certificate[] = [];
    certs.forEach(cert => {
        switch (cert.type) {
            case CardanoCertificateType.STAKE_DELEGATION:
                convertedCerts.push({
                    type: cert.type,
                    pool: cert.pool!,
                });
                break;
            case CardanoCertificateType.STAKE_REGISTRATION:
            case CardanoCertificateType.STAKE_DEREGISTRATION:
                convertedCerts.push({
                    type: cert.type,
                });
                break;
            // no default
        }
    });
    return convertedCerts;
};

export const parseAsset = (
    hex: string,
): {
    policyId: string;
    assetNameInHex: string;
} => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);
    return {
        policyId,
        assetNameInHex,
    };
};

export const getDelegationCertificates = (
    stakingPath: string,
    poolHex: string | undefined,
    shouldRegister: boolean,
) => {
    const result: CardanoCertificate[] = [
        {
            type: CardanoCertificateType.STAKE_DELEGATION,
            path: stakingPath,
            pool: poolHex,
        },
    ];

    if (shouldRegister) {
        result.unshift({
            type: CardanoCertificateType.STAKE_REGISTRATION,
            path: stakingPath,
        });
    }

    return result;
};

export const getTtl = (testnet: boolean) => {
    const ttl = 7200; // 2 hours
    const shelleySlot = testnet ? 48409057 : 4924800;
    const shelleyTimestamp = testnet ? 1642778273 : 1596491091;
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const currentSlot = shelleySlot + currentTimestamp - shelleyTimestamp;
    return currentSlot + ttl;
};

export const composeTxPlan = (
    descriptor: string,
    utxo: Account['utxo'],
    certificates: CardanoCertificate[],
    withdrawals: { amount: string; path: string; stakeAddress: string }[],
    changeAddress: {
        address: string;
        addressParameters: {
            path: string;
            addressType: CardanoAddressType;
            stakingPath: string;
        };
    },
    ttl?: number,
) => {
    const txPlan = coinSelection({
        utxos: transformUtxos(utxo),
        outputs: [],
        changeAddress: changeAddress.address,
        certificates: prepareCertificates(certificates),
        withdrawals,
        accountPubKey: descriptor,
        ttl,
    });

    return { txPlan, certificates, withdrawals, changeAddress };
};

export const isPoolOverSaturated = (pool: StakePool, additionalStake?: string) =>
    new BigNumber(pool.live_stake)
        .plus(additionalStake ?? '0')
        .div(pool.saturation)
        .toNumber() > 0.8;

export const getStakePoolForDelegation = (
    trezorPools: NonNullable<PoolsResponse>,
    accountBalance: string,
) => {
    // sorted from least saturated to most
    trezorPools.pools.sort((a, b) => new BigNumber(a.live_stake).comparedTo(b.live_stake));
    let pool = trezorPools.next;
    if (isPoolOverSaturated(pool, accountBalance)) {
        // eslint-disable-next-line prefer-destructuring
        pool = trezorPools.pools[0];
    }
    return pool;
};
// Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
export const isCardanoTx = (
    account: Account,
    _tx: PrecomposedTransactionFinalCardano | PrecomposedTransactionFinal,
): _tx is PrecomposedTransactionFinalCardano => account.networkType === 'cardano';

export const isCardanoExternalOutput = (
    output: CardanoOutput,
): output is Extract<CardanoOutput, 'address'> => 'address' in output;
