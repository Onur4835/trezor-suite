import React, { memo } from 'react';
import { Switch, Route } from 'react-router-dom';

import routes from '@trezor/suite/src/constants/suite/routes';

import Index from '@trezor/suite/src/views/dashboard';
import Notification from '@trezor/suite/src/views/suite/notifications';

import Wallet from '@trezor/suite/src/views/wallet/transactions';
import WalletReceive from '@trezor/suite/src/views/wallet/receive';
import WalletDetails from '@trezor/suite/src/views/wallet/details';
import WalletTokens from '@trezor/suite/src/views/wallet/tokens';
import WalletSend from '@trezor/suite/src/views/wallet/send';
import WalletSignVerify from '@trezor/suite/src/views/wallet/sign-verify';

import WalletCoinmarketBuy from '@trezor/suite/src/views/wallet/coinmarket/buy';
import WalletCoinmarketBuyDetail from '@trezor/suite/src/views/wallet/coinmarket/buy/detail';
import WalletCoinmarketBuyOffers from '@trezor/suite/src/views/wallet/coinmarket/buy/offers';
import WalletCoinmarketSell from '@trezor/suite/src/views/wallet/coinmarket/sell';
import WalletCoinmarketSellDetail from '@trezor/suite/src/views/wallet/coinmarket/sell/detail';
import WalletCoinmarketSellOffers from '@trezor/suite/src/views/wallet/coinmarket/sell/offers';
import WalletCoinmarketExchange from '@trezor/suite/src/views/wallet/coinmarket/exchange';
import WalletCoinmarketExchangeDetail from '@trezor/suite/src/views/wallet/coinmarket/exchange/detail';
import WalletCoinmarketExchangeOffers from '@trezor/suite/src/views/wallet/coinmarket/exchange/offers';
import WalletCoinmarketSpend from '@trezor/suite/src/views/wallet/coinmarket/spend';
import WalletCoinmarketRedirect from '@trezor/suite/src/views/wallet/coinmarket/redirect';

import Settings from '@trezor/suite/src/views/settings';
import SettingsCoins from '@trezor/suite/src/views/settings/coins';
import SettingsDebug from '@trezor/suite/src/views/settings/debug';
import SettingsDevice from '@trezor/suite/src/views/settings/device';

const components: { [key: string]: React.ComponentType<any> } = {
    'suite-index': Index,
    'notifications-index': Notification,

    'wallet-index': Wallet,
    'wallet-receive': WalletReceive,
    'wallet-details': WalletDetails,
    'wallet-tokens': WalletTokens,
    'wallet-send': WalletSend,
    'wallet-sign-verify': WalletSignVerify,

    'wallet-coinmarket-buy': WalletCoinmarketBuy,
    'wallet-coinmarket-buy-detail': WalletCoinmarketBuyDetail,
    'wallet-coinmarket-buy-offers': WalletCoinmarketBuyOffers,
    'wallet-coinmarket-sell': WalletCoinmarketSell,
    'wallet-coinmarket-sell-detail': WalletCoinmarketSellDetail,
    'wallet-coinmarket-sell-offers': WalletCoinmarketSellOffers,
    'wallet-coinmarket-exchange': WalletCoinmarketExchange,
    'wallet-coinmarket-exchange-detail': WalletCoinmarketExchangeDetail,
    'wallet-coinmarket-exchange-offers': WalletCoinmarketExchangeOffers,
    'wallet-coinmarket-spend': WalletCoinmarketSpend,
    'wallet-coinmarket-redirect': WalletCoinmarketRedirect,

    'settings-index': Settings,
    'settings-coins': SettingsCoins,
    'settings-debug': SettingsDebug,
    'settings-device': SettingsDevice,
};

const AppRouter = () => (
    <Switch>
        {routes.map(route => (
            <Route
                key={route.name}
                path={process.env.ASSET_PREFIX + route.pattern}
                exact={route.exact}
                component={components[route.name]}
            />
        ))}
    </Switch>
);

export default memo(AppRouter);
