import React from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Translation } from '@suite-components';
import { Section, DeviceBanner } from '@suite-components/Settings';
import { useEnabledNetworks } from '@settings-hooks/useEnabledNetworks';
import { useDevice } from '@suite-hooks';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

const StyledCoinsGroup = styled(CoinsGroup)`
    margin-top: 18px;
`;

const Settings = () => {
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();

    const { device, isLocked } = useDevice();
    const isDeviceLocked = !!device && isLocked();

    return (
        <StyledSettingsLayout>
            {isDeviceLocked && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_UNAVAILABLE" />}
                    description={
                        <Translation id="TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE" />
                    }
                />
            )}
            <Section title={<Translation id="TR_COINS" />}>
                <StyledCoinsGroup
                    networks={mainnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                />
            </Section>
            <Section title={<Translation id="TR_TESTNET_COINS" />}>
                <StyledCoinsGroup
                    networks={testnets}
                    onToggle={setEnabled}
                    selectedNetworks={enabledNetworks}
                    testnet
                />
            </Section>
        </StyledSettingsLayout>
    );
};

export default Settings;
