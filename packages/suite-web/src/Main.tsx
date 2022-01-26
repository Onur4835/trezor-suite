import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import TrezorConnect from 'trezor-connect';

import { store } from '@trezor/suite/src/reducers/store';
import { isDev } from '@trezor/suite/src/utils/suite/build';
import { SENTRY_CONFIG } from '@trezor/suite/src/config/suite';

import { initSentry } from '@trezor/suite/src/utils/suite/sentry';
import Metadata from '@trezor/suite/src/components/suite/Metadata';
import Preloader from '@trezor/suite/src/components/suite/Preloader';
import ToastContainer from '@trezor/suite/src/components/suite/ToastContainer';
import IntlProvider from '@trezor/suite/src/support/suite/ConnectedIntlProvider';
import Resize from '@trezor/suite/src/support/suite/Resize';
import Protocol from '@trezor/suite/src/support/suite/Protocol';
import Autodetect from '@trezor/suite/src/support/suite/Autodetect';
import Tor from '@trezor/suite/src/support/suite/Tor';
import OnlineStatus from '@trezor/suite/src/support/suite/OnlineStatus';
import ErrorBoundary from '@trezor/suite/src/support/suite/ErrorBoundary';
import RouterHandler from '@trezor/suite/src/support/suite/Router';
import ThemeProvider from '@trezor/suite/src/support/suite/ThemeProvider';
import history from '@trezor/suite/src/support/history';

import AppRouter from './support/Router';
import { CypressExportStore } from './support/CypressExportStore';

const Main = () => {
    useEffect(() => {
        if (!window.Cypress && !isDev) {
            initSentry(SENTRY_CONFIG);
        }
        if (window.Cypress) {
            // exposing ref to TrezorConnect allows us to mock its methods in cypress tests
            window.TrezorConnect = TrezorConnect;
        }
    }, []);

    return (
        <>
            <CypressExportStore store={store} />
            <ReduxProvider store={store}>
                <ThemeProvider>
                    <RouterProvider history={history}>
                        <ErrorBoundary>
                            <Autodetect />
                            <Resize />
                            <Tor />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler />
                            <IntlProvider>
                                <Metadata />
                                <ToastContainer />
                                <Preloader>
                                    <AppRouter />
                                </Preloader>
                            </IntlProvider>
                        </ErrorBoundary>
                    </RouterProvider>
                </ThemeProvider>
            </ReduxProvider>
        </>
    );
};

export default <Main />;
