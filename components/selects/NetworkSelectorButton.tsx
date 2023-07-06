import { CustomChainRenderer } from "./CustomChainRenderer";
import { popularChains } from "@3rdweb-sdk/react/components/popularChains";
import { useColorMode, useToast } from "@chakra-ui/react";
import { NetworkSelector, useChain, useWallet, useChainId, useSwitchChain } from "@thirdweb-dev/react";
import { ChainIcon } from "components/icons/ChainIcon";
import { StoredChain } from "contexts/configured-chains";
import { useSupportedChains } from "hooks/chains/configureChains";
import {
  useAddRecentlyUsedChainId,
  useRecentlyUsedChains,
} from "hooks/chains/recentlyUsedChains";
import { useModifyChain } from "hooks/chains/useModifyChain";
import { useSetIsNetworkConfigModalOpen } from "hooks/networkConfigModal";
import { useEffect, useMemo, useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import { Button } from "tw-components";

interface NetworkSelectorButtonProps {
  disabledChainIds?: number[];
  networksEnabled?: number[];
  isDisabled?: boolean;
  onSwitchChain?: (chain: StoredChain) => void;
}

export const NetworkSelectorButton: React.FC<NetworkSelectorButtonProps> = ({
  disabledChainIds,
  networksEnabled,
  isDisabled,
  onSwitchChain,
}) => {
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const recentlyUsedChains = useRecentlyUsedChains();
  const addRecentlyUsedChains = useAddRecentlyUsedChainId();
  const setIsNetworkConfigModalOpen = useSetIsNetworkConfigModalOpen();
  const { colorMode } = useColorMode();
  const supportedChains = useSupportedChains();

  const chains = useMemo(() => {
    if (disabledChainIds && disabledChainIds.length > 0) {
      const disabledChainIdsSet = new Set(disabledChainIds);
      return supportedChains.filter(
        (chain) => !disabledChainIdsSet.has(chain.chainId),
      );
    }

    if (networksEnabled && networksEnabled.length > 0) {
      const networksEnabledSet = new Set(networksEnabled);
      return supportedChains.filter((chain) =>
        networksEnabledSet.has(chain.chainId),
      );
    }
  }, [disabledChainIds, networksEnabled, supportedChains]);

  const filteredRecentlyUsedChains = useMemo(() => {
    if (recentlyUsedChains && recentlyUsedChains.length > 0) {
      if (disabledChainIds && disabledChainIds.length > 0) {
        const disabledChainIdsSet = new Set(disabledChainIds);
        return recentlyUsedChains.filter(
          (chain) => !disabledChainIdsSet.has(chain.chainId),
        );
      }

      if (networksEnabled && networksEnabled.length > 0) {
        const networksEnabledSet = new Set(networksEnabled);
        return recentlyUsedChains.filter((chain) =>
          networksEnabledSet.has(chain.chainId),
        );
      }
    }
  }, [recentlyUsedChains, disabledChainIds, networksEnabled]);

  const chain = useChain();
  const prevChain = useRef(chain);

  // handle switch network done from wallet app/extension
  useEffect(() => {
    if (!chain) {
      return;
    }
    if (prevChain.current?.chainId !== chain.chainId) {
      if (onSwitchChain) {
        onSwitchChain(chain);
      }
      addRecentlyUsedChains(chain.chainId);
      prevChain.current = chain;
    }
  }, [chain, onSwitchChain, addRecentlyUsedChains]);

  const wallet = useWallet();

  const toast = useToast();
  const modifyChain = useModifyChain();
  // const chainId = useChainId();
  const switchChain = useSwitchChain();

  const handleCreatePrivateNetError = () => {
    toast({
      title: "Failed to create private network",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      <Button
        isDisabled={isDisabled || !wallet}
        display="flex"
        bg="inputBg"
        _hover={{
          bg: "inputBgHover",
        }}
        width="100%"
        variant="solid"
        style={{
          textAlign: "left",
          justifyContent: "start",
          alignItems: "center",
          gap: "0.5rem",
        }}
        onClick={() => {
          setShowNetworkSelector(true);
        }}
        leftIcon={<ChainIcon ipfsSrc={chain?.icon?.url} size={20} />}
      >
        {chain?.name || "Select Network"}

        <BiChevronDown
          style={{
            marginLeft: "auto",
          }}
        />
      </Button>

      {showNetworkSelector && (
        <NetworkSelector
          theme={colorMode}
          chains={chains}
          recentChains={filteredRecentlyUsedChains}
          popularChains={networksEnabled ? undefined : popularChains}
          renderChain={CustomChainRenderer}
          onCustomClick={
            networksEnabled
              ? undefined
              : () => {
                  setIsNetworkConfigModalOpen(true);
                }
          }
          onClose={() => {
            setShowNetworkSelector(false);
          }}
          onSwitch={(_chain) => {
            console.log({_chain});
            onSwitchChain?.(_chain);
            addRecentlyUsedChains(_chain.chainId);
          }}
          onCreatePrivateNetwork={async () => {
            let newPrivateChain: StoredChain;

            try {
              const result = await fetch("/api/stealthtest", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              }).then((res) => res.json());
              if (!result.data || result.data.status === "ERROR") {
                return handleCreatePrivateNetError();
              }
              newPrivateChain = {
                isCustom: true,
                name: result.data.name,
                title: result.data.name,
                chain: result.data.chainId.toString(),
                icon: {
                  url: "https://app.nameless.io/favicon.svg",
                  width: 20,
                  height: 20,
                  format: "svg",
                },
                rpc: [result.data.networks.eth.url],
                // features?: Readonly<Array<{ name: string }>>;
                // faucets?: readonly string[];
                nativeCurrency: {
                  name: "ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                // infoURL?: string;
                shortName: "ST",
                chainId: result.data.chainId,
                // networkId?: number;
                // ens?: {
                //   registry: string;
                // };
                // explorers?: Readonly<
                //   Array<{
                //     name: string;
                //     url: string;
                //     icon?: Icon;
                //     standard: string;
                //   }>
                // >;
                testnet: true,
                slug: "stealthtest",
                // slip44?: number;
                // status?: string;
                // redFlags?: readonly string[];
                // parent?: {
                //   chain: string;
                //   type: string;
                //   bridges?: Readonly<Array<{ url: string }>>;
                // };
              };
            } catch (error) {
              console.error(error);
              return handleCreatePrivateNetError();
            }

            if (!newPrivateChain) {
              return handleCreatePrivateNetError();
            }

            setShowNetworkSelector(false);

            modifyChain(newPrivateChain);
            onSwitchChain?.(newPrivateChain);
            addRecentlyUsedChains(newPrivateChain.chainId);
            toast({
              title: "Private Development Network Added Successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            await switchChain(newPrivateChain.chainId);
          }}
        />
      )}
    </>
  );
};
