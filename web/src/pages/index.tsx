import { XMarkIcon } from "@heroicons/react/24/outline";
import { type NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import {
  InstantSearch,
  useHits,
  useSearchBox,
} from "react-instantsearch-hooks-web";
import Modal from "../components/modal";
import Navbar from "../components/navbar";
import Switch from "../components/switch";
import { env } from "../env/client.mjs";
import { classNames } from "../utils/classnames";
import type { AlgoliaPersona } from "../utils/searchClient";
import { searchClient } from "../utils/searchClient";

const CustomSearchBox: React.FC = () => {
  const [inputText, setInputText] = useState<string>();
  const { query, refine, clear } = useSearchBox();

  return (
    <div className="flex w-1/3 flex-row rounded bg-white py-2 pl-4 pr-2">
      <input
        className="w-full border-none focus:outline-none"
        placeholder="find a persona"
        value={inputText}
        onChange={(e) => {
          refine(e.currentTarget.value);
          setInputText(e.currentTarget.value);
        }}
      />
      <Switch
        isOn={query.length > 0}
        onComponent={
          <button
            className="flex items-center justify-end focus:outline-none"
            onClick={() => clear()}
          >
            <XMarkIcon height={20} width={20} />
          </button>
        }
        offComponent={<Fragment />}
      />
    </div>
  );
};

const PersonaHits: React.FC = () => {
  const { hits } = useHits<AlgoliaPersona>();

  return (
    <div className="grid grid-cols-4 gap-2 py-4">
      {hits.map((h, idx) => {
        return <PersonaHit key={idx} personaHit={h} />;
      })}
    </div>
  );
};

const PersonaHit: React.FC<{ personaHit: AlgoliaPersona }> = ({
  personaHit,
}) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <button
      onClick={() => setShowModal(true)}
      className={classNames(
        "group/item relative h-full w-full rounded-lg border border-neutral-300 bg-white p-4 text-neutral-900 shadow-lg hover:cursor-pointer focus:outline-none"
      )}
    >
      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        renderContent={({ onClose }) => {
          return (
            <div>
              <p>{personaHit.name}</p>
              <p>{personaHit.description}</p>
              <button onClick={() => onClose()}>Close</button>
            </div>
          );
        }}
      />
      <p className="group-hover/item:invisible">{personaHit.name}</p>
      <p className="invisible absolute inset-1 flex items-center justify-center rounded bg-neutral-200 group-hover/item:visible">
        Learn More
      </p>
    </button>
  );
};

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>inquire</title>
        <meta
          name="description"
          content="Get the most out of your ai assistant"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-grow flex-col bg-gradient-to-tr from-neutral-300 to-neutral-100">
        <div className="flex flex-grow bg-[url('/background_pattern.svg')]">
          <div className="px-40">
            <Navbar />
            <div className="flex flex-grow flex-row items-center text-neutral-900">
              <div className="flex w-3/5 flex-col gap-12">
                <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900 sm:text-[5rem]">
                  inquire
                </h1>
                <p className="text-2xl text-neutral-900/50">
                  Interact with a variety of ai personas to solve any problem
                  you have. Inquire makes sure you get the most out of your ai
                  assistant.
                </p>
                <div>
                  <button
                    className="rounded-xl bg-neutral-900/10 px-10 py-3 font-semibold text-neutral-900 no-underline transition hover:bg-neutral-900/20"
                    onClick={() => {
                      if (sessionData) {
                        router.push("/account");
                        return;
                      }
                      signIn(undefined, { callbackUrl: "/account" });
                    }}
                  >
                    {sessionData ? "Account" : "Sign Up"}
                  </button>
                </div>
              </div>
              {
                // TODO: add different text colors for commands and prompts
              }
              <div className="flex w-2/5">
                <div className="flex flex-col gap-12 rounded-xl bg-neutral-900 p-8 font-mono text-xl text-white/75">
                  <div>
                    <p className="py-2">/trainer</p>
                    <p>How can I build muscle?</p>
                  </div>
                  <div>
                    <p className="py-2">/programmer</p>
                    <p>
                      What is the cause of this error? &apos;x&apos; is possibly
                      &apos;undefined&apos; .ts(18048)
                    </p>
                  </div>
                  <div>
                    <p className="py-2">/writer</p>
                    <p>What are the core elements of a good horror story?</p>
                  </div>
                </div>
              </div>
            </div>

            <InstantSearch
              indexName={env.NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME}
              searchClient={searchClient}
            >
              <CustomSearchBox />
              <PersonaHits />
            </InstantSearch>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
