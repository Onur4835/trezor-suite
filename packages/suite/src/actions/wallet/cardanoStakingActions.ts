import { BlockchainBlock } from 'trezor-connect';
import { CARDANO_STAKING } from '@wallet-actions/constants';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { PendingStakeTx } from '@wallet-types/cardanoStaking';

export type CardanoStakingAction =
    | { type: typeof CARDANO_STAKING.ADD_PENDING_STAKE_TX; pendingStakeTx: PendingStakeTx }
    | { type: typeof CARDANO_STAKING.REMOVE_PENDING_STAKE_TX; accountKey: string };

export const getPendingStakeTx =
    (account: Account) => (_dispatch: Dispatch, getState: GetState) => {
        const pendingTx = getState().wallet.cardanoStaking.pendingTx.find(
            tx => tx.accountKey === account.key,
        );
        return pendingTx;
    };

export const setPendingStakeTx =
    (account: Account, payload: string | null) => (dispatch: Dispatch, getState: GetState) => {
        if (account.networkType !== 'cardano') return;

        const { blockHeight } = getState().wallet.blockchain[account.symbol];
        const accountKey = accountUtils.getAccountKey(
            account.descriptor,
            account.symbol,
            account.deviceState,
        );
        if (payload) {
            dispatch({
                type: CARDANO_STAKING.ADD_PENDING_STAKE_TX,
                pendingStakeTx: {
                    accountKey,
                    txid: payload,
                    blockHeight,
                },
            });
        } else {
            dispatch({
                type: CARDANO_STAKING.REMOVE_PENDING_STAKE_TX,
                accountKey,
            });
        }
    };

export const validatePendingStakeTxOnBlock =
    (block: BlockchainBlock) => (dispatch: Dispatch, getState: GetState) => {
        // Used in cardano staking
        // After sending staking tx (delegation or withdrawal) user needs to wait few blocks til the tx appears on the blockchain.
        // To prevent the user from sending multiple staking tx we need to track that we are waiting for confirmation for the tx that was already sent.
        // As a failsafe, if the account staking state won't change in 10 blocks since the tx was sent to the network
        // we will reset `pendingStakeTx`, allowing user to retry the action.
        const network = accountUtils.getNetwork(block.coin.shortcut.toLowerCase());
        if (!network || network.networkType !== 'cardano') return;

        const accounts = getState().wallet.accounts.filter(
            account =>
                account.networkType === 'cardano' &&
                dispatch(getPendingStakeTx(account)) &&
                network.symbol === account.symbol,
        );

        accounts.forEach(account => {
            // just to make ts happy, filtering is already done above
            if (account.networkType !== 'cardano') return;
            const pendingTx = dispatch(getPendingStakeTx(account));
            if (!pendingTx) return;

            if (block.blockHeight - pendingTx.blockHeight > 10) {
                // reset pending tx on the account if we haven't received confirmation in 10 blocks
                // (app could be closed before receiving the tx, network problems, etc...)
                dispatch(setPendingStakeTx(account, null));
            }
        });
    };

export const validatePendingStakeTxOnTx =
    (account: Account, txs: WalletAccountTransaction[]) => (dispatch: Dispatch) => {
        if (account.networkType !== 'cardano') return;
        const pendingTx = dispatch(getPendingStakeTx(account));

        if (txs.find(tx => tx.txid === pendingTx?.txid)) {
            dispatch(setPendingStakeTx(account, null));
        }
    };
