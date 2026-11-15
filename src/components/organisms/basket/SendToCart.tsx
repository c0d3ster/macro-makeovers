'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { useState } from 'react'

import { track } from '@/libs/analytics'
import type { GroceryHandoffOptionsQuery } from '@/graphql/generated/graphql'
import type { GrocerId } from '@/libs/grocery'

import {
  useGroceryHandoffOptions,
  useGroceryStores,
  useSendBasketToGrocer,
} from '@/apiClients'
import { GrocerChoice, HandoffSummary } from '@/components/molecules'
import { Grocer } from '@/graphql/generated/graphql'
import { ESTIMATE_NOTE, GROCER_IDS, GROCERS, isZip } from '@/libs/grocery'
import { useBasket } from '@/providers'

type Options = GroceryHandoffOptionsQuery['groceryHandoffOptions']

type Store = { id: string; name: string; address: string }

type Handoff = {
  grocer: GrocerId
  url: string
  matchedCount: number
  unmatched: readonly { key: string; name: string; display: string }[]
}

// The GraphQL enum uses the names (Kroger), the lib uses ids (kroger)
const TO_ID: Record<Grocer, GrocerId> = {
  [Grocer.Kroger]: 'kroger',
  [Grocer.Walmart]: 'walmart',
  [Grocer.Instacart]: 'instacart',
}
const TO_GROCER: Record<GrocerId, Grocer> = {
  kroger: Grocer.Kroger,
  walmart: Grocer.Walmart,
  instacart: Grocer.Instacart,
}

const KROGER_CONNECT_URL = '/api/grocery/kroger/connect'

const buttonStyles =
  'w-full cursor-pointer rounded-lg bg-primary px-4 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

// Instacart's terms fix the CTA: "Shop on Instacart", 46px tall, 29.5px radius. Their full-color
// logo (22px) goes in front, and their brand colors replace ours, once we have their brand kit.
const instacartButtonStyles =
  'h-[46px] w-full cursor-pointer rounded-[29.5px] bg-primary px-4 font-medium text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'

// A resolver's error code and message, from Apollo's combined error
const readError = (error: unknown): { code?: string; message: string } => {
  const first =
    typeof error === 'object' && error !== null && 'errors' in error
      ? (error as { errors?: { message?: string; extensions?: { code?: unknown } }[] })
          .errors?.[0]
      : undefined
  return {
    ...(typeof first?.extensions?.code === 'string' ? { code: first.extensions.code } : {}),
    message: first?.message ?? 'Something went wrong sending your basket.',
  }
}

const Placeholder = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className='rounded-xl bg-surface p-4'>
      <button
        type='button'
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={buttonStyles}
      >
        Send to cart
      </button>
      {isOpen && (
        <p className='mt-3 text-sm text-text-muted'>
          Sending your basket straight to a grocery store&apos;s cart is coming
          with the paid plan, with a choice of stores. For now, copy the list
          and take it with you.
        </p>
      )}
    </div>
  )
}

// Free members and signed-out visitors see the button, and this when they tap it
const UpgradePrompt = ({ signedIn }: { signedIn: boolean }): ReactElement => (
  <div className='mt-3 flex flex-col gap-2 text-sm text-text-muted'>
    <p>
      Send to cart is part of the paid plan: pick Kroger, Walmart, or Instacart
      and your basket lands in that store&apos;s cart, whole packs and all. The
      basket, the shopping list, and copying it stay free.
    </p>
    {!signedIn && (
      <Link href='/login?next=/basket' className='font-medium text-primary hover:underline'>
        Sign in to get started
      </Link>
    )}
  </div>
)

type PickerProps = {
  options: Options
}

const GrocerPicker = ({ options }: PickerProps): ReactElement => {
  const { entries, includePantry, checked } = useBasket()
  const [findStores, storesQuery] = useGroceryStores()
  const [sendBasket, sendState] = useSendBasketToGrocer()

  const available = options.grocers.map(({ grocer }) => TO_ID[grocer])
  const ordered = GROCER_IDS.filter((id) => available.includes(id))
  const remembered = options.remembered
  const rememberedId = remembered ? TO_ID[remembered.grocer] : undefined
  const suggestion = storesQuery.data?.groceryStores
  const suggestedId = suggestion?.defaultGrocer ? TO_ID[suggestion.defaultGrocer] : undefined
  const fallbackId = options.defaultGrocer ? TO_ID[options.defaultGrocer] : undefined

  const [chosen, setChosen] = useState<GrocerId | undefined>(undefined)
  const [zip, setZip] = useState(remembered?.zip ?? '')
  const [storeId, setStoreId] = useState<string | undefined>(undefined)
  const [handoff, setHandoff] = useState<Handoff | undefined>(undefined)
  const [failure, setFailure] = useState<{ code?: string; message: string } | undefined>(
    undefined
  )

  // The member's own pick wins, then what their zip suggests, then their last grocer
  const grocer = chosen ?? suggestedId ?? rememberedId ?? fallbackId
  const info = grocer ? GROCERS[grocer] : undefined

  const krogerStores: readonly Store[] =
    suggestion?.krogerStores ??
    (rememberedId === 'kroger' && remembered?.storeId
      ? [{ id: remembered.storeId, name: remembered.storeName ?? 'Your store', address: '' }]
      : [])
  const selectedStore = krogerStores.find(({ id }) => id === storeId) ?? krogerStores[0]
  const krogerConnected = options.grocers.some(
    ({ grocer: id, connected }) => TO_ID[id] === 'kroger' && connected
  )
  // First visit, or Kroger without a store yet: ask for a zip
  const needsZip = !remembered || (grocer === 'kroger' && !selectedStore)

  const lookUp = (): void => {
    if (!isZip(zip)) return
    setStoreId(undefined)
    void findStores({ variables: { zip } })
  }

  const send = async (): Promise<void> => {
    if (!grocer) return
    setFailure(undefined)
    setHandoff(undefined)
    const store = grocer === 'kroger' ? selectedStore : undefined
    try {
      const result = await sendBasket({
        variables: {
          input: {
            grocer: TO_GROCER[grocer],
            entries: entries.map(({ slug, build, servings }) => ({
              slug,
              ...(build ? { build } : {}),
              servings,
            })),
            includePantry,
            checked: [...checked],
            ...(store ? { storeId: store.id, storeName: store.name } : {}),
            ...(isZip(zip) ? { zip } : {}),
          },
        },
      })
      const sent = result.data?.sendBasketToGrocer
      if (sent) setHandoff({ ...sent, grocer: TO_ID[sent.grocer] })
    } catch (error) {
      setFailure(readError(error))
    }
  }

  const sendLabel = sendState.loading ? 'Sending…' : info?.sendLabel
  const canSend = Boolean(grocer) && (grocer !== 'kroger' || Boolean(selectedStore))

  return (
    <div className='mt-4 flex flex-col gap-4'>
      {needsZip && (
        <div className='flex flex-col gap-2'>
          <label htmlFor='grocer-zip' className='text-sm font-medium text-text'>
            Your zip code
          </label>
          <div className='flex gap-2'>
            <input
              id='grocer-zip'
              inputMode='numeric'
              autoComplete='postal-code'
              maxLength={5}
              value={zip}
              onChange={(event) => setZip(event.target.value.replace(/\D/g, ''))}
              className='w-28 rounded-lg border border-text-muted/40 bg-background px-3 py-2 text-text'
            />
            <button
              type='button'
              onClick={lookUp}
              disabled={!isZip(zip) || storesQuery.loading}
              className='cursor-pointer rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50'
            >
              {storesQuery.loading ? 'Finding…' : 'Find stores'}
            </button>
          </div>
          <p className='text-xs text-text-muted'>
            We suggest a store with pickup near you. Pickup keeps checkout closest to our
            estimate.
          </p>
        </div>
      )}

      <fieldset className='flex flex-col gap-2'>
        <legend className='mb-2 text-sm font-medium text-text'>Where to shop</legend>
        {ordered.map((id) => (
          <GrocerChoice
            key={id}
            info={GROCERS[id]}
            checked={grocer === id}
            onSelect={() => setChosen(id)}
          />
        ))}
      </fieldset>

      {grocer === 'kroger' && krogerStores.length > 0 && (
        <div className='flex flex-col gap-2'>
          <label htmlFor='kroger-store' className='text-sm font-medium text-text'>
            Pickup store
          </label>
          <select
            id='kroger-store'
            value={selectedStore?.id}
            onChange={(event) => setStoreId(event.target.value)}
            className='rounded-lg border border-text-muted/40 bg-background px-3 py-2 text-text'
          >
            {krogerStores.map(({ id, name, address }) => (
              <option key={id} value={id}>
                {address ? `${name}, ${address}` : name}
              </option>
            ))}
          </select>
        </div>
      )}
      {grocer === 'kroger' && suggestion && krogerStores.length === 0 && (
        <p className='text-sm text-text-muted'>
          No Kroger-family store within reach of that zip. Try Walmart or Instacart.
        </p>
      )}

      {options.disclosure && <p className='text-xs text-text-muted'>{options.disclosure}</p>}
      <p className='text-xs text-text-muted'>{ESTIMATE_NOTE}</p>

      {grocer === 'kroger' && !krogerConnected ? (
        <a href={KROGER_CONNECT_URL} className={`${buttonStyles} text-center`}>
          Connect your Kroger account
        </a>
      ) : (
        <button
          type='button'
          onClick={() => void send()}
          disabled={!canSend || sendState.loading}
          className={grocer === 'instacart' ? instacartButtonStyles : buttonStyles}
        >
          {sendLabel ?? 'Pick a store'}
        </button>
      )}

      {handoff && (
        <HandoffSummary
          info={GROCERS[handoff.grocer]}
          url={handoff.url}
          matchedCount={handoff.matchedCount}
          unmatched={handoff.unmatched}
        />
      )}
      {failure && (
        <div role='alert' className='flex flex-col gap-1 text-sm'>
          <p className='font-medium text-text'>{failure.message}</p>
          {failure.code === 'GROCER_AUTH_REQUIRED' ? (
            <a href={KROGER_CONNECT_URL} className='font-medium text-primary hover:underline'>
              Connect Kroger again
            </a>
          ) : (
            <p className='text-text-muted'>
              You can still copy the shopping list above and shop it yourself.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// "Send to cart" (PRD 05): a paid feature that hands the basket to the member's grocer. While
// the feature is off or no grocer has keys, it stays the placeholder it was before.
export const SendToCart = (): ReactElement => {
  const { data } = useGroceryHandoffOptions()
  const [isOpen, setIsOpen] = useState(false)
  const options = data?.groceryHandoffOptions

  if (!options?.enabled) return <Placeholder />

  return (
    <div className='rounded-xl bg-surface p-4'>
      <button
        type='button'
        aria-expanded={isOpen}
        onClick={() => {
          // Opening it shows the paid-plan note, which is the upgrade prompt for ordering
          if (!isOpen) track('upgrade_prompt_seen', { feature: 'send_to_cart' })
          setIsOpen(!isOpen)
        }}
        className={buttonStyles}
      >
        Send to cart
      </button>
      {isOpen &&
        (options.hasPaidAccess ? (
          <GrocerPicker options={options} />
        ) : (
          <UpgradePrompt signedIn={options.signedIn} />
        ))}
    </div>
  )
}
