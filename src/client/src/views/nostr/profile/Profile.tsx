import React, { useEffect, useState } from 'react';
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
import { useNostrDispatch, useNostrState } from '../../../context/NostrContext';
import { useNostrKeysLazyQuery } from '../../../graphql/queries/__generated__/getNostrKeys.generated';
import { useNostrProfileLazyQuery } from '../../../graphql/queries/__generated__/getNostrProfile.generated';

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

export const Profile = () => {
  const { initialized, nsec, npub, pub, sec } = useNostrState();
  const dispatch = useNostrDispatch();
  const [nostrCache, setNostrCache] = useLocalStorage('nostr', {});
  const [open, openSet] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  const [willSend, setWillSend] = React.useState(false);
  // setWillSend(false);

  const { loading, data } = useGetNodeInfoQuery({
    ssr: false,
    onError: error => toast.error(getErrorContent(error)),
  });
  // useGenerateNostrProfile --> from pubkey, get rest
  //useGetkeys ==> give sec key, then gen pubkey
  const [getKeys, { data: keysData, loading: keysLoading }] =
    useNostrKeysLazyQuery({
      onError: error => toast.error(getErrorContent(error)),
    });

  const [getProfile] = useNostrProfileLazyQuery({
    onError: error => toast.error(getErrorContent(error)),
  });
  useEffect(() => {
    //deelete me later
    console.log(nostrCache, setWillSend);
  }, [nostrCache, setWillSend]);
  useEffect(() => {
    console.log(nsec, npub, 'sec', sec, 'pub', pub);
    if (!nsec) return;
    if (!npub) {
      getProfile();
      console.log('loadeding');
      dispatch({ type: 'loaded', nsec });
      return;
    }
    // setNostrCache({ nsec });
  }, [nsec, npub, pub, sec, dispatch, setNostrCache, getProfile]);

  useEffect(() => {
    if (!initialized || keysLoading || !keysData) return;
    console.log('keysData', keysData);
    dispatch({
      type: 'created',
      sec: keysData.getNostrKeys.privkey,
      pub: keysData.getNostrKeys.pubkey,
    });
  }, [initialized, keysLoading, keysData, dispatch]);

  useEffect(() => {
    if (!initialized) {
      dispatch({ type: 'initialized' });
    }
  }, [initialized, dispatch]);

  if (!data || loading) {
    return <LoadingCard title={'Nostr'} />;
  }

  const { public_key } = data.getNodeInfo || {};

  if (nsec === '') {
    return (
      <CardWithTitle>
        <CardTitle>Load Nostr Profile</CardTitle>
        <SingleLine>
          <Input
            value={input}
            placeholder={'nsec'}
            onChange={e => setInput(e.target?.value ?? '')}
          />

          <ColorButton
            withMargin={'0 0 0 8px'}
            onClick={() => getProfile()}
            arrow={willSend ? false : true}
            disabled={input === ''}
          >
            {willSend ? <X size={18} /> : 'Set'}
          </ColorButton>
        </SingleLine>
        <SingleLine>
          <ColorButton
            withMargin={'0 0 0 8px'}
            onClick={() => getKeys()}
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
