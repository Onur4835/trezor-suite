import { AccountUtxo } from 'trezor-connect';

export interface CardanoMergedUtxo extends Omit<AccountUtxo, 'amount'> {
    amount: {
        unit: string;
        quantity: string;
    }[];
}

export type DerivationType =
    | {
          value: 1;
          label: 'Icarus';
      }
    | { value: 2; label: 'Icarus Trezor' };
