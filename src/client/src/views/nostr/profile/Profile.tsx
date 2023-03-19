import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Radio, X } from 'react-feather';
import styled from 'styled-components';
// import CopyToClipboard from 'react-copy-to-clipboard';
import { ColorButton } from '../../../components/buttons/colorButton/ColorButton';
import {
  // getWithCopy,
  getWithCopyFull,
  renderLine,
} from '../../../components/generic/helpers';
import { useGetNodeInfoQuery } from '../../../graphql/queries/__generated__/getNodeInfo.generated';
import { getErrorContent } from '../../../utils/error';
import { LoadingCard } from '../../../components/loading/LoadingCard';
import { Input } from '../../../components/input';
import {
  CardWithTitle,
  CardTitle,
  SubTitle,
  Card,
  SingleLine,
  DarkSubTitle,
  Separation,
} from '../../../components/generic/Styled';
import { mediaWidths, themeColors } from '../../../styles/Themes';
import { useLocalStorage } from '../../../hooks/UseLocalStorage';
import { getPublicKey, generatePrivateKey, nip19 } from 'nostr-tools';

const Key = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;

  overflow-wrap: break-word;
  word-wrap: break-word;

  -ms-word-break: break-all;
  word-break: break-all;
`;

const Responsive = styled(SingleLine)`
  @media (${mediaWidths.mobile}) {
    flex-direction: column;
  }
`;

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: ${({ startTile }: { startTile?: boolean }) =>
    startTile ? 'flex-start' : 'flex-end'};

  @media (${mediaWidths.mobile}) {
    margin: 16px 0;
  }
`;

// const TextPadding = styled.span`
//   margin-left: 5px;
// `;

const ButtonRow = styled.div`
  display: flex;

  @media (${mediaWidths.mobile}) {
    width: 100%;
  }
`;

const defaultSettings = {
  nsec: '',
  followOption: 'disabled',
};

export const Profile = () => {
  const [open, openSet] = useState<boolean>(false);
  const [nsec, setNsec] = useState<string>('');
  const [sec, setSec] = useState<string>('');
  sec;
  const [npub, setNpub] = useState<string>('');
  const [pub, setPub] = useState<string>('');
  // const [nsecIsSet, setNsecIsSet] = useState<boolean>(false);
  // const [accountExists, setAccountExists] = useState<boolean>(false);
  const [willSend, setWillSend] = React.useState(false);
  setWillSend(false);

  const { loading, data } = useGetNodeInfoQuery({
    ssr: false,
    onError: error => toast.error(getErrorContent(error)),
  });
  const [settings, setSettings] = useLocalStorage(
    'nostrSettings',
    defaultSettings
  );
  // const { loading, data } = useGetNostrProfile({
  //   ssr: false,
  //   onError: error => toast.error(getErrorContent(error)),
  // });
  React.useEffect(() => {
    if (!settings || !settings?.nsec) return;
    setNsec(settings?.nsec ?? '');
    handleSetNsec(nsec);
    console.log('SETINGS', settings);
  }, [settings, open, settings.nsec, nsec]);

  if (!data || loading) {
    return <LoadingCard title={'Nostr'} />;
  }

  const { public_key } = data.getNodeInfo || {};

  const handleSetNsec = (nsec: string) => {
    try {
      const sec = nip19.decode(nsec).data as string;
      const pub = getPublicKey(sec);
      const npub = nip19.npubEncode(pub);
      setSec(sec);
      setPub(pub);
      setNpub(npub);
    } catch (e) {
      console.error(e);
      toast.error('Handle set - Nsec is invalid');
      return;
    }
  };
  const handleGenerateNsec = () => {
    try {
      const sec = generatePrivateKey();
      const nsec = nip19.nsecEncode(sec);
      const pub = getPublicKey(sec);
      const npub = nip19.npubEncode(pub);
      setSec(sec);
      setPub(pub);
      setNpub(npub);
      setSettings({ ...settings, nsec });
    } catch (e) {
      console.error(e);
      toast.error('Handle gen - Nsec is invalid');
      return;
    }
  };

  if (settings.nsec == '') {
    return (
      <CardWithTitle>
        <CardTitle>Load Nostr Profile</CardTitle>
        <SingleLine>
          <Input
            value={nsec}
            placeholder={'nsec'}
            onChange={e => setNsec(e.target?.value ?? '')}
          />

          <ColorButton
            withMargin={'0 0 0 8px'}
            onClick={() => handleGenerateNsec()}
            arrow={willSend ? false : true}
            disabled={nsec === ''}
          >
            {willSend ? <X size={18} /> : 'Set'}
          </ColorButton>
        </SingleLine>
        <SingleLine>
          <ColorButton
            withMargin={'0 0 0 8px'}
            onClick={() => handleGenerateNsec()}
            arrow={willSend ? false : true}
          >
            Generate new key pair.
          </ColorButton>
        </SingleLine>
      </CardWithTitle>
    );
  }
  return (
    <CardWithTitle>
      <CardTitle>
        <SubTitle>Nostr Profile</SubTitle>
      </CardTitle>
      <Card>
        <Responsive>
          <Radio size={18} color={themeColors.blue2} />
          <Tile startTile={true}>
            <DarkSubTitle>npub</DarkSubTitle>
            <Key>{npub}</Key>
          </Tile>
          <ButtonRow>
            <ColorButton
              fullWidth={true}
              withMargin={'0 0 0 8px'}
              onClick={() => openSet(s => !s)}
            >
              {open ? <X size={18} /> : 'Details'}
            </ColorButton>
          </ButtonRow>
        </Responsive>
        {open && (
          <>
            <Separation />
            {renderLine('npub', getWithCopyFull(npub))}
            {renderLine('hex pubkey', getWithCopyFull(pub))}
            {renderLine('nsec', getWithCopyFull(nsec))}
            {renderLine('Signature', getWithCopyFull('thisisanattesstation'))}
            {renderLine('Identity Pubkey', getWithCopyFull(public_key))}
          </>
        )}
      </Card>
    </CardWithTitle>
  );
};
