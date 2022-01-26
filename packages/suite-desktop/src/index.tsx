import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';

import { store } from '@trezor/suite/src/reducers/store';
import { isDev } from '@trezor/suite/src/utils/suite/build';
import { SENTRY_CONFIG } from '@trezor/suite/src/config/suite';

import { initSentry } from '@trezor/suite/src/utils/suite/sentry';
import Metadata from '@trezor/suite/src/components/suite/Metadata';
import Preloader from '@trezor/suite/src/components/suite/Preloader';
import ToastContainer from '@trezor/suite/src/components/suite/ToastContainer';
import IntlProvider from '@trezor/suite/src/support/suite/ConnectedIntlProvider';
import Resize from '@trezor/suite/src/support/suite/Resize';
import Autodetect from '@trezor/suite/src/support/suite/Autodetect';
import Protocol from '@trezor/suite/src/support/suite/Protocol';
import Tor from '@trezor/suite/src/support/suite/Tor';
import OnlineStatus from '@trezor/suite/src/support/suite/OnlineStatus';
import ErrorBoundary from '@trezor/suite/src/support/suite/ErrorBoundary';
import RouterHandler from '@trezor/suite/src/support/suite/Router';
import ThemeProvider from '@trezor/suite/src/support/suite/ThemeProvider';
import history from '@trezor/suite/src/support/history';
import AppRouter from './support/Router';
import DesktopUpdater from './support/DesktopUpdater';

const Index = () => {
    const [isUpdateVisible, setIsUpdateVisible] = useState(false);

    useEffect(() => {
        if (!isDev) {
            initSentry(SENTRY_CONFIG);
        }
        window.desktopApi?.clientReady();
    }, []);

    return (
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
                            <DesktopUpdater setIsUpdateVisible={setIsUpdateVisible} />
                            <Metadata />
                            <ToastContainer />
                            <Preloader hideModals={isUpdateVisible}>
                                <AppRouter />
                            </Preloader>
                        </IntlProvider>
                    </ErrorBoundary>
                </RouterProvider>
            </ThemeProvider>
        </ReduxProvider>
    );
};

render(<Index />, document.getElementById('app'));
