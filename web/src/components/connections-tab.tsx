import { Dialog } from "@headlessui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { trpc } from "../utils/trpc";
import Modal from "./modal";
import Spinner from "./spinner";
import Switch from "./switch";
import TelegramLoginButton from "./telegram-login-button";

type ConnectionItemProps = {
  connectionType: "WEB" | "TELEGRAM";
  connectionUserId: string;
  displayName: string;
};

const ConnectionItem: React.FC<ConnectionItemProps> = (props) => {
  const { displayName, connectionType, connectionUserId } = props;

  const [isDisconnected, setIsDisconnected] = useState(false);
  const [show, setShow] = useState(false);

  const { isLoading: isDisconnectLoading, mutate: disconnectConnection } =
    trpc.connection.disconnectConnection.useMutation({
      onSuccess() {
        setIsDisconnected(true);
      },
    });

  const trpcUtils = trpc.useContext();

  return (
    <div className="flex flex-row justify-between gap-12 rounded-lg border border-neutral-900 p-5 text-lg">
      <Modal
        show={show}
        onClose={() => {
          trpcUtils.user.connections.invalidate();
          setShow(false);
        }}
        renderContent={({ onClose }) => {
          return isDisconnected ? (
            <h3 className="text-xl font-medium text-neutral-600">
              Successfully disconnected from {displayName}
            </h3>
          ) : (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-neutral-900"
              >
                Are you sure you want to disconnect {displayName}?
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-neutral-500">
                  If so, you will still be able to use inquire with
                  {displayName}, but only within the free tier limits
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                  onClick={() =>
                    disconnectConnection({
                      connectionType,
                      connectionUserId,
                    })
                  }
                >
                  {!isDisconnectLoading ? "Yes" : <Spinner />}
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                  onClick={onClose}
                >
                  No
                </button>
              </div>
            </>
          );
        }}
      />
      <div className="flex flex-row items-center gap-4">
        <Image
          src="/telegram_logo.svg"
          alt="Telegram Logo"
          width={40}
          height={40}
        />
        <p className="font-medium">{displayName}</p>
      </div>
      <button
        onClick={() => setShow(true)}
        className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-700 hover:text-white"
      >
        <TrashIcon className="h-4 w-4" />
        Remove
      </button>
    </div>
  );
};

const ConnectionsTab: React.FC = () => {
  const trpcUtils = trpc.useContext();

  const {
    isLoading: isConnectTelegramAccountLoading,
    mutate: connectTelegramAccount,
  } = trpc.connection.telegram.connectTelegramAccount.useMutation({
    onSuccess() {
      trpcUtils.user.connections.invalidate();
    },
  });

  const { isLoading: isConnectionsLoading, data: connections } =
    trpc.user.connections.useQuery();

  return (
    <div className="flex min-h-full flex-grow flex-col px-10">
      <p className="text-3xl font-medium">Connections</p>
      <p className="font-medium text-neutral-700">
        Connect your inquire account with to get unlimited usage across all
        supported connections
      </p>
      <div className="my-10 flex flex-col items-center justify-center">
        <Switch
          isOn={!isConnectTelegramAccountLoading}
          onComponent={
            <TelegramLoginButton
              botName="inquireai_dev_bot"
              cornerRadius={5}
              dataOnauth={(res) => {
                connectTelegramAccount(res);
              }}
            />
          }
          offComponent={<Spinner />}
        />
      </div>
      <Switch
        isOn={!isConnectionsLoading}
        onComponent={
          <Switch
            isOn={connections !== undefined}
            onComponent={
              <>
                {connections?.map((c, idx) => {
                  return (
                    <ConnectionItem
                      key={idx}
                      connectionUserId={c.connectionUserId}
                      connectionType={c.connectionType}
                      displayName={c.connectionType
                        .charAt(0)
                        .concat(c.connectionType.substring(1).toLowerCase())}
                    />
                  );
                })}
              </>
            }
            offComponent={<div>Failed to load connection</div>}
          />
        }
        offComponent={<Skeleton className="h-20 bg-black" />}
      />
    </div>
  );
};

export default ConnectionsTab;
