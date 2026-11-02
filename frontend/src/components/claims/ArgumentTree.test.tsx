import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import { ArgumentTree } from './ArgumentTree'
import CommunityHubPage from '../../pages/CommunityHubPage'
import type { AccessState, AccountUser } from '../../context/AuthContext'
import type { Claim, ClaimNode, ShapeNode } from '../../types'

// Synthetic throughout, and uuid-shaped where `?claim=` has to accept it:
// useFocusedClaim validates the shape, so a bare 'test-claim-a' would be
// rejected as a mangled link. All-zeros so nothing here can be mistaken for a
// live claim id.
const ROOT_ID = '00000000-0000-4000-8000-000000000001'
const SUPPORT_ID = '00000000-0000-4000-8000-000000000002'
const OPPOSE_ID = '00000000-0000-4000-8000-000000000003'
const MERGED_ID = '00000000-0000-4000-8000-000000000004'
const USER_ID = '00000000-0000-4000-8000-0000000000ff'

const connectedUser: AccountUser = {
  id: USER_ID,
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'Demo Reader',
}

interface ColumnStub {
  extra: Claim[]
  hasMore: boolean
  showMore: () => void
  isFetching: boolean
  error: string | null
  requestPath: string | null
}

interface QueryStub {
  data?: unknown
  isPending: boolean
  isError: boolean
  error?: Error
  isPlaceholderData: boolean
  refetch: () => void
}

const h = vi.hoisted(() => ({
  auth: { state: 'inform' } as AccessState,
  signIn: vi.fn(),
  root: null as unknown as QueryStub,
  node: null as unknown as QueryStub,
  shape: null as unknown as QueryStub,
  create: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: undefined as (Error & { status?: number; reason?: string }) | undefined,
  },
  rate: { mutate: vi.fn(), isPending: false, isError: false, error: undefined, variables: undefined },
  calls: { root: [] as (string | undefined)[], node: [] as (string | undefined)[] },
  // One per side. The band owns which column asked for more, so the hook is
  // stubbed per side and the test drives it the way a reader's click would.
  columns: {
    supports: null as unknown as ColumnStub,
    opposes: null as unknown as ColumnStub,
  },
  columnArgs: [] as { path: string | undefined; side: string }[],
  mounts: { seasonSelector: 0, stanceCard: 0, threadForm: 0 },
  // Every claim id an ImpactControl with a live scale was mounted against, in
  // order. A counter is the only thing that can tell "React kept this
  // instance" from "React threw it away and built an identical one" (R97).
  impactMounts: [] as string[],
}))

// The three queries are stubbed; everything else in useClaims — the exported
// request paths in particular — stays real, so the failure branch quotes the
// URL the hook would actually have asked for.
vi.mock('../../hooks/useClaims', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../hooks/useClaims')>()
  return {
    ...actual,
    useRootClaim: (id?: string) => {
      h.calls.root.push(id)
      return h.root
    },
    useClaimNode: (id?: string) => {
      h.calls.node.push(id)
      return h.node
    },
    useTreeShape: () => h.shape,
    useClaimColumn: (path: string | undefined, side: 'supports' | 'opposes') => {
      h.columnArgs.push({ path, side })
      return h.columns[side]
    },
  }
})

// The real control, with a mount spy around it: the tests below still need
// its radiogroup, and this one needs to know when it was rebuilt.
vi.mock('./ImpactControl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ImpactControl')>()
  return {
    ImpactControl: (props: Parameters<typeof actual.ImpactControl>[0]) => {
      const { claimId, canRate } = props
      useEffect(() => {
        if (canRate) h.impactMounts.push(claimId)
      // Empty deps on purpose: this counts MOUNTS, not renders. With the
      // dependency list it would fire on a prop change too, and a prop change
      // is exactly what a reused instance looks like.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return <actual.ImpactControl {...props} />
    },
  }
})

vi.mock('../../hooks/useClaimMutations', () => ({
  useCreateClaim: () => h.create,
  useRateClaim: () => h.rate,
  useEditClaim: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

vi.mock('../../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../context/AuthContext')>()
  return {
    ...actual,
    useAuth: () => ({ auth: h.auth, signIn: h.signIn, signOut: vi.fn() }),
  }
})

// --- the other bands, for the page-level tests ---------------------------
vi.mock('../../components/Header', () => ({ Header: () => null }))
vi.mock('../../hooks/useCommunityBySlug', () => ({
  useCommunityBySlug: () => ({
    data: {
      id: '00000000-0000-4000-8000-0000000000c1',
      slug: 'test-slug',
      name: 'Test Community',
      description: 'Test description',
    },
    isLoading: false,
    isError: false,
  }),
}))
vi.mock('../../hooks/useThreads', () => ({
  useThreads: () => ({
    threads: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))
vi.mock('../../hooks/useSeasons', () => ({
  useSeasonList: () => ({
    data: {
      seasons: [{ number: 1, name: 'Season One', status: 'open', openedAt: null, closedAt: null }],
      defaultSeason: 1,
    },
    isPending: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
  useSeasonView: () => ({
    data: {
      season: { number: 1, name: 'Season One', status: 'open', openedAt: null, closedAt: null },
      questionText: 'Demo question for this season.',
      changeClass: null,
      seasonNote: null,
      topicNote: null,
      rationale: null,
      isFallback: false,
      chairs: [
        {
          text: 'Demo perspective.',
          description: null,
          supportingPoints: [],
          examplePerspectives: [],
          changeSince: null,
        },
      ],
    },
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
  }),
}))

// Mount spies, one per sibling band. A counter is the only thing that can tell
// "React kept this instance" from "React threw it away and built an identical
// one"; asserting on the DOM cannot (R97).
function spy(which: keyof typeof h.mounts, label: string) {
  return () => {
    useEffect(() => {
      h.mounts[which]++
    }, [])
    return <div>{label}</div>
  }
}
vi.mock('../../components/SeasonSelector', () => ({ SeasonSelector: spy('seasonSelector', 'band-1') }))
vi.mock('../../components/StanceCard', () => ({ StanceCard: spy('stanceCard', 'band-2') }))
vi.mock('../../components/ThreadCreateForm', () => ({ ThreadCreateForm: spy('threadForm', 'band-4') }))

// --- fixtures ------------------------------------------------------------

const baseClaim: Claim = {
  id: ROOT_ID,
  side: null,
  body: 'Demo root claim body.',
  authorPseudonym: null,
  impact: 5,
  ratingCount: 0,
  childSupports: 0,
  childOpposes: 0,
  isHidden: false,
  mergedInto: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  myRating: null,
}

const claim = (over: Partial<Claim> = {}): Claim => ({ ...baseClaim, ...over })

const supportChild = claim({
  id: SUPPORT_ID,
  side: 'supports',
  body: 'Demo supporting argument.',
  authorPseudonym: 'Demo Heron',
})
const opposeChild = claim({
  id: OPPOSE_ID,
  side: 'opposes',
  body: 'Demo opposing argument.',
  authorPseudonym: 'Demo Marten',
})

function nodeOf(over: Partial<ClaimNode> = {}): ClaimNode {
  return {
    claim: claim(),
    breadcrumb: [],
    supports: [],
    opposes: [],
    ...over,
  }
}

function loaded(node: ClaimNode): QueryStub {
  return {
    data: { node, meta: { supports: { cursor: null, hasMore: false }, opposes: { cursor: null, hasMore: false } } },
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
  }
}

const pending: QueryStub = {
  data: undefined,
  isPending: true,
  isError: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
}

function failed(message: string): QueryStub {
  return {
    data: undefined,
    isPending: false,
    isError: true,
    error: new Error(message),
    isPlaceholderData: false,
    refetch: vi.fn(),
  }
}

const rootShapeNode: ShapeNode = {
  id: ROOT_ID,
  parentId: null,
  side: null,
  depth: 0,
  impact: 5,
  isHidden: false,
  mergedInto: null,
}

function shapeOf(nodes: ShapeNode[] = [rootShapeNode]): QueryStub {
  return {
    data: { nodes, meta: { truncated: false, completeThroughDepth: 0 } },
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
  }
}

const COMMUNITY_ID = '00000000-0000-4000-8000-0000000000c1'

function Probe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname + loc.search}</div>
}

function renderTree(url = `/communities/test-slug`) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/communities/:slug"
          element={
            <>
              <ArgumentTree communityId={COMMUNITY_ID} />
              <Probe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPage(url = `/communities/test-slug`) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/communities/:slug"
          element={
            <>
              <CommunityHubPage />
              <Probe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

/** A column with nothing behind it: whatever the node carried is the side. */
function wholeColumn(over: Partial<ColumnStub> = {}): ColumnStub {
  return {
    extra: [],
    hasMore: false,
    showMore: vi.fn(),
    isFetching: false,
    error: null,
    requestPath: null,
    ...over,
  }
}

beforeEach(() => {
  h.auth = { state: 'inform' }
  h.columns = { supports: wholeColumn(), opposes: wholeColumn() }
  h.columnArgs = []
  h.root = loaded(nodeOf({ supports: [supportChild], opposes: [opposeChild] }))
  h.node = loaded(
    nodeOf({
      claim: claim({ id: SUPPORT_ID, side: 'supports', body: 'Demo supporting argument.' }),
      breadcrumb: [{ id: ROOT_ID, body: 'Demo root claim body.', side: null }],
    }),
  )
  h.shape = shapeOf()
  h.create.isPending = false
  h.create.isError = false
  h.create.error = undefined
  h.calls.root = []
  h.calls.node = []
  h.mounts.seasonSelector = 0
  h.mounts.stanceCard = 0
  h.mounts.threadForm = 0
  h.impactMounts = []
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ArgumentTree — first load', () => {
  it('renders the root claim with both columns on first load', () => {
    const { container } = renderTree()
    expect(screen.getByText('Demo root claim body.')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-column]')).toHaveLength(2)
    expect(screen.getByText('Demo supporting argument.')).toBeInTheDocument()
    expect(screen.getByText('Demo opposing argument.')).toBeInTheDocument()
    // The root query is the one that ran; the focused-claim query was handed
    // undefined and so is switched off.
    expect(h.calls.root).toContain(COMMUNITY_ID)
    expect(new Set(h.calls.node)).toEqual(new Set([undefined]))
  })

  it('asks for the claim in ?claim= and not for the root', () => {
    renderTree(`/communities/test-slug?claim=${SUPPORT_ID}`)
    expect(h.calls.node).toContain(SUPPORT_ID)
    expect(new Set(h.calls.root)).toEqual(new Set([undefined]))
  })

  it('surfaces a mangled ?claim= rather than quietly serving the root', () => {
    renderTree('/communities/test-slug?claim=not-a-uuid')
    expect(screen.getByTestId('claim-param-rejected')).toBeInTheDocument()
  })

  it('does not promise the top of the argument on a branch that shows none of it', () => {
    // A mangled link and a failed root request at once — today's state against
    // production. "You are reading the top of this argument instead" directly
    // above "none of it is shown here" is one of the two that has to be wrong.
    h.root = failed('Request failed (404)')
    renderTree('/communities/test-slug?claim=not-a-uuid')
    expect(screen.getByTestId('argument-tree-error')).toBeInTheDocument()
    expect(screen.queryByTestId('claim-param-rejected')).not.toBeInTheDocument()
  })

  it('keeps ?season= when the reader zooms into a claim', () => {
    renderTree('/communities/test-slug?season=1')
    fireEvent.click(screen.getByText('Demo supporting argument.'))
    expect(screen.getByTestId('loc')).toHaveTextContent('season=1')
    expect(screen.getByTestId('loc')).toHaveTextContent(`claim=${SUPPORT_ID}`)
  })

  it('offers a way back to the top only while a claim is focused', () => {
    renderTree()
    expect(screen.queryByText('Back to the top of this argument')).not.toBeInTheDocument()
    cleanup()
    renderTree(`/communities/test-slug?claim=${SUPPORT_ID}`)
    fireEvent.click(screen.getByText('Back to the top of this argument'))
    expect(screen.getByTestId('loc')).not.toHaveTextContent('claim=')
  })
})

// R95. The three states are the point of this block: a band that renders
// nothing when the request failed tells the reader nobody has argued about
// this, which is a claim about the world and not one the client can make.
describe('ArgumentTree — loading, failed and empty are three different things', () => {
  it('shows a skeleton while the claim is loading', () => {
    h.root = pending
    const { container } = renderTree()
    expect(screen.getByTestId('argument-tree-loading')).toBeInTheDocument()
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('argument-tree-error')).not.toBeInTheDocument()
    expect(screen.queryByTestId('argument-tree-empty')).not.toBeInTheDocument()
  })

  it('says the argument could not be loaded, with the URL and the status', () => {
    h.root = failed('Request failed (404)')
    renderTree()
    const block = screen.getByTestId('argument-tree-error')
    expect(block).toHaveTextContent('could not be loaded')
    expect(screen.getByTestId('argument-tree-error-detail')).toHaveTextContent(
      `/api/communities/${COMMUNITY_ID}/claims/root`,
    )
    expect(screen.getByTestId('argument-tree-error-detail')).toHaveTextContent('Request failed (404)')
    // The failure must not be dressed as an empty argument, and must not be
    // silent: a test asserting "renders nothing" would pass with that bug.
    expect(screen.queryByTestId('argument-tree-empty')).not.toBeInTheDocument()
    expect(screen.queryByText(/Nobody has answered this claim yet/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('argument-tree')).not.toBeInTheDocument()
    expect(screen.queryByTestId('argument-tree-loading')).not.toBeInTheDocument()
  })

  it('quotes the focused claim URL when that is the request that failed', () => {
    h.node = failed('Request failed (404)')
    renderTree(`/communities/test-slug?claim=${SUPPORT_ID}`)
    expect(screen.getByTestId('argument-tree-error-detail')).toHaveTextContent(
      `/api/claims/${SUPPORT_ID}`,
    )
  })

  it('says the argument is empty only when the request succeeded and it is', () => {
    h.root = loaded(nodeOf())
    renderTree()
    expect(screen.getByTestId('argument-tree-empty')).toBeInTheDocument()
    expect(screen.getByText('No supporting arguments yet.')).toBeInTheDocument()
    expect(screen.getByText('No opposing arguments yet.')).toBeInTheDocument()
    expect(screen.queryByTestId('argument-tree-error')).not.toBeInTheDocument()
  })

  it('does not call a loaded argument empty when it has children', () => {
    renderTree()
    expect(screen.queryByTestId('argument-tree-empty')).not.toBeInTheDocument()
  })

  it('does not call an argument empty while either column has more behind it (C2)', () => {
    // Page one of both columns came back empty, and the claim's own counts say
    // the sides are not. "Nobody has answered this claim yet" would be a
    // statement about the world that this response does not support.
    h.root = loaded(nodeOf({ claim: claim({ childSupports: 23, childOpposes: 4 }) }))
    h.columns.supports = wholeColumn({ hasMore: true })
    renderTree()
    expect(screen.queryByTestId('argument-tree-empty')).not.toBeInTheDocument()
  })

  it('still says an argument is empty when every side is genuinely whole and empty', () => {
    h.root = loaded(nodeOf())
    renderTree()
    expect(screen.getByTestId('argument-tree-empty')).toBeInTheDocument()
  })

  it('marks a claim held over from the previous view as busy, not as the answer', () => {
    h.root = { ...loaded(nodeOf()), isPlaceholderData: true }
    renderTree()
    expect(screen.getByTestId('argument-tree')).toHaveAttribute('aria-busy', 'true')
  })

  it('reports a failed map without blanking the argument', () => {
    h.shape = failed('Request failed (404)')
    renderTree()
    expect(screen.getByTestId('tree-minimap-error')).toBeInTheDocument()
    expect(screen.queryByTestId('tree-minimap')).not.toBeInTheDocument()
    expect(screen.getByText('Demo root claim body.')).toBeInTheDocument()
  })
})

describe('ArgumentTree — a merged or removed claim in focus (I1)', () => {
  const merged = claim({ mergedInto: '00000000-0000-4000-8000-00000000000e' })

  it('keeps the merge mark the card and the map both give it', () => {
    h.root = loaded(nodeOf({ claim: merged }))
    renderTree()
    expect(screen.getByTestId('focused-claim-merged')).toHaveTextContent('Merged into another claim')
    // The target may be outside the payload, so it is named nowhere.
    expect(screen.getByTestId('focused-claim-merged').textContent).not.toContain(
      '00000000-0000-4000-8000-00000000000e',
    )
  })

  it('offers no rating scale and no add buttons on a claim the server will refuse', () => {
    h.auth = { state: 'connected', user: connectedUser }
    h.root = loaded(nodeOf({ claim: merged }))
    const { container } = renderTree()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(0)
    expect(screen.getByTestId('claim-closed-to-writes').textContent).toMatch(/merged into another one/)
  })

  it('offers no add buttons on a tombstone either, and says which refusal it is', () => {
    h.auth = { state: 'connected', user: connectedUser }
    h.root = loaded(nodeOf({ claim: claim({ isHidden: true, body: '' }) }))
    const { container } = renderTree()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(0)
    expect(screen.getByTestId('claim-closed-to-writes').textContent).toMatch(/was removed/)
    expect(screen.getByTestId('claim-closed-to-writes').textContent).not.toMatch(/merged/)
  })

  it('leaves an ordinary claim alone', () => {
    h.auth = { state: 'connected', user: connectedUser }
    const { container } = renderTree()
    expect(screen.queryByTestId('focused-claim-merged')).not.toBeInTheDocument()
    expect(screen.queryByTestId('claim-closed-to-writes')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(2)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})

describe('ArgumentTree — the rating control belongs to one claim (I7)', () => {
  it('rebuilds the scale when the reader moves to another claim', () => {
    // RatingScale holds its own mutation, and what it shows falls back to the
    // in-flight choice and renders the last error. Reused across a claim
    // change, it tells the reader their rating of claim B is a value they in
    // fact gave claim A. Only a mount counter can tell a rebuild from a reuse.
    h.auth = { state: 'connected', user: connectedUser }
    renderTree()
    expect(h.impactMounts).toEqual([ROOT_ID])

    fireEvent.click(screen.getByRole('button', { name: /Demo supporting argument/ }))
    expect(h.impactMounts).toEqual([ROOT_ID, SUPPORT_ID])
  })
})

describe('ArgumentTree — both columns page independently (C2)', () => {
  it('pages each side from the URL the node came from, one query per side', () => {
    renderTree()
    const asked = h.columnArgs.map((a) => `${a.side} ${a.path}`)
    expect(asked).toContain(`supports /api/communities/${COMMUNITY_ID}/claims/root`)
    expect(asked).toContain(`opposes /api/communities/${COMMUNITY_ID}/claims/root`)
  })

  it('pages the focused claim rather than the root once one is open', () => {
    renderTree(`/communities/test-slug?claim=${SUPPORT_ID}`)
    const paths = new Set(h.columnArgs.map((a) => a.path))
    expect(paths).toEqual(new Set([`/api/claims/${SUPPORT_ID}`]))
  })

  it('appends a later page to the column it came from and to no other', () => {
    const later = claim({
      id: '00000000-0000-4000-8000-000000000004',
      side: 'supports',
      body: 'Demo argument from the second page.',
      authorPseudonym: 'Demo Linnet',
    })
    h.columns.supports = wholeColumn({ extra: [later] })
    const { container } = renderTree()
    const supports = container.querySelector('[data-column="supports"]')!
    const opposes = container.querySelector('[data-column="opposes"]')!
    expect(supports.textContent).toContain('Demo argument from the second page.')
    expect(supports.textContent).toContain('Demo supporting argument.')
    expect(opposes.textContent).not.toContain('Demo argument from the second page.')
  })

  it('offers the rest of a side to the reader and asks for it on that side only', () => {
    const showMore = vi.fn()
    h.columns.supports = wholeColumn({ hasMore: true, showMore })
    renderTree()
    fireEvent.click(screen.getByRole('button', { name: 'Show more supporting arguments' }))
    expect(showMore).toHaveBeenCalledTimes(1)
    expect(h.columns.opposes.showMore).not.toHaveBeenCalled()
  })
})

describe('ArgumentTree — who may rate and who may add', () => {
  it('gives a signed-out reader the aggregate, no scale, and the reason', () => {
    h.root = loaded(nodeOf({ claim: claim({ ratingCount: 3, impact: 7 }) }))
    renderTree()
    // The aggregate is still there — the bar is a role="img" with a word.
    expect(screen.getByRole('img', { name: /Impact so far/ })).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.getByTestId('claim-gate-not-connected')).toBeInTheDocument()
    expect(screen.queryByTestId('claim-gate-suspended')).not.toBeInTheDocument()
  })

  it('requires a connected account to add a claim', () => {
    const { container } = renderTree()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(0)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByTestId('claim-gate-not-connected')).toHaveTextContent(
      'Connected accounts can rate these arguments and add their own.',
    )
  })

  it('lets a connected reader whose Compass is unfinished rate and add', () => {
    // connected_no_compass: the server's requireConnected deliberately does
    // not check completed_onboarding, so neither may this.
    h.auth = { state: 'connected_no_compass', user: { ...connectedUser, completed_onboarding: false } }
    const { container } = renderTree()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(2)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.queryByTestId('claim-gate-not-connected')).not.toBeInTheDocument()
  })

  it('refuses a suspended connected account and says which refusal it is', () => {
    // detectUserState() never reads account_standing, so this arrives as a
    // plain { state: 'connected' } and only the user object gives it away.
    h.auth = { state: 'connected', user: { ...connectedUser, account_standing: 'suspended' } }
    const { container } = renderTree()
    expect(container.querySelectorAll('[data-add-side]')).toHaveLength(0)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.getByTestId('claim-gate-suspended')).toBeInTheDocument()
    expect(screen.queryByTestId('claim-gate-not-connected')).not.toBeInTheDocument()
  })

  it('puts the rating scale outside every button, where it is valid HTML', () => {
    h.auth = { state: 'connected', user: connectedUser }
    renderTree()
    const group = screen.getByRole('radiogroup')
    expect(group.closest('button')).toBeNull()
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.closest('button')).toBeNull()
    }
  })
})

describe('ClaimComposer, through the tree', () => {
  beforeEach(() => {
    h.auth = { state: 'connected', user: connectedUser }
  })

  function openComposer(side: 'supports' | 'opposes') {
    const label = side === 'supports' ? 'Add a supporting argument' : 'Add an opposing argument'
    fireEvent.click(screen.getByRole('button', { name: label }))
    return screen.getByRole('textbox')
  }

  /** Parent, side AND viewer: a draft is one reader's unsent words. */
  const draftKey = (side: 'supports' | 'opposes', parentId: string) =>
    `draft-claim-${USER_ID}-${side}-${parentId}`

  it('adds a claim to the side the composer was opened on', () => {
    renderTree()
    const box = openComposer('opposes')
    fireEvent.change(box, { target: { value: 'Demo opposing argument text.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(h.create.mutate).toHaveBeenCalledTimes(1)
    expect(h.create.mutate.mock.calls[0][0]).toEqual({
      parentId: ROOT_ID,
      side: 'opposes',
      body: 'Demo opposing argument text.',
    })
  })

  it('adds to the supporting side when that is the one opened', () => {
    renderTree()
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'Demo supporting argument text.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(h.create.mutate.mock.calls[0][0]).toMatchObject({ side: 'supports' })
  })

  it('posts to the claim in focus, not to the root', () => {
    renderTree(`/communities/test-slug?claim=${SUPPORT_ID}`)
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'Demo nested argument text.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(h.create.mutate.mock.calls[0][0]).toMatchObject({ parentId: SUPPORT_ID })
  })

  it('refuses a body under the server minimum and sends nothing', () => {
    renderTree()
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'too short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(h.create.mutate).not.toHaveBeenCalled()
  })

  it('measures the minimum on the trimmed body, as the server does', () => {
    renderTree()
    const box = openComposer('supports')
    // 9 characters and a lot of padding: long enough untrimmed, too short
    // trimmed, which is the measurement the route uses.
    fireEvent.change(box, { target: { value: '   ' + 'a'.repeat(9) + '          ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(h.create.mutate).not.toHaveBeenCalled()
  })

  it('caps the body at the server maximum', () => {
    renderTree()
    expect(openComposer('supports')).toHaveAttribute('maxLength', '500')
  })

  it('keeps supporting and opposing drafts apart on the same claim (R99)', () => {
    localStorage.setItem(draftKey('supports', ROOT_ID), 'Demo half-written supporting argument.')
    renderTree()
    expect(openComposer('opposes')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(openComposer('supports')).toHaveValue('Demo half-written supporting argument.')
  })

  it('keeps drafts apart between claims', () => {
    localStorage.setItem(draftKey('supports', SUPPORT_ID), 'Demo draft on the child claim.')
    renderTree()
    expect(openComposer('supports')).toHaveValue('')
  })

  it('keeps one reader’s unsent words off the next reader’s screen (Minor 3)', () => {
    // signOut() removes ev_token and leaves localStorage alone, so on a shared
    // device the draft outlives the reader who wrote it.
    // Both the shape another reader's draft has now and the shape every draft
    // had before the viewer was part of the key.
    localStorage.setItem(
      `draft-claim-00000000-0000-4000-8000-0000000000fe-supports-${ROOT_ID}`,
      'Demo argument another reader did not send.',
    )
    localStorage.setItem(
      `draft-claim-supports-${ROOT_ID}`,
      'Demo argument the previous reader did not send.',
    )
    renderTree()
    expect(openComposer('supports')).toHaveValue('')
  })

  it('clears the draft and closes only when the write succeeded', () => {
    h.create.mutate.mockImplementation(
      (_vars: unknown, opts?: { onSuccess?: (c: unknown) => void }) => opts?.onSuccess?.({}),
    )
    renderTree()
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'Demo supporting argument text.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(localStorage.getItem(`draft-claim-supports-${ROOT_ID}`)).toBeNull()
  })

  it('keeps the reader’s text when the write is refused', () => {
    // The mutation does nothing: no onSuccess, which is what a failure is.
    h.create.mutate.mockImplementation(() => undefined)
    renderTree()
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'Demo supporting argument text.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add argument' }))
    expect(screen.getByRole('textbox')).toHaveValue('Demo supporting argument text.')
  })

  it.each([
    [403, 'suspended', /account is suspended/],
    [403, 'tier', /open to connected accounts/],
    [404, undefined, /no longer part of this argument/],
    [409, undefined, /merged into another one/],
    [422, undefined, /maximum depth/],
    [429, undefined, /a lot of writing at once/],
  ])('says what happened when the server answers %s/%s', (status, reason, expected) => {
    h.create.isError = true
    h.create.error = Object.assign(new Error(`Request failed (${status})`), { status, reason })
    renderTree()
    openComposer('supports')
    const block = screen.getByTestId('claim-composer-error')
    expect(block).toHaveTextContent(expected)
    expect(block).toHaveTextContent('Your text has been kept.')
  })

  /**
   * The write route answers a withdrawn PARENT and a withdrawn DISCUSSION ABOVE
   * it with two different codes on the same 404, because only one of them
   * suggests the contributor find another place to make the argument. Before
   * apiFetch carried `code`, both arrived here as "Request failed (404)" and
   * the copy had to be true of either.
   */
  function composerErrorFor(err: { status: number; code?: string; message?: string }) {
    h.create.isError = true
    h.create.error = Object.assign(new Error(err.message ?? `Request failed (${err.status})`), {
      status: err.status,
      code: err.code,
    })
    renderTree()
    openComposer('supports')
    return screen.getByTestId('claim-composer-error').textContent ?? ''
  }

  it('says the discussion above was removed, not that this point was', () => {
    const text = composerErrorFor({
      status: 404,
      code: 'ANCESTOR_NOT_VISIBLE',
      message: 'The discussion above this point was removed',
    })
    expect(text).toMatch(/discussion above/i)
    expect(text).toContain('Your text has been kept.')
  })

  it('tells a withdrawn parent apart from a withdrawn discussion above it', () => {
    const ancestor = composerErrorFor({ status: 404, code: 'ANCESTOR_NOT_VISIBLE' })
    cleanup()
    const parent = composerErrorFor({ status: 404, code: 'CLAIM_NOT_FOUND' })
    expect(ancestor).not.toBe(parent)
    expect(parent).not.toMatch(/discussion above/i)
  })

  it('names the text as the problem on INVALID_BODY rather than the server', () => {
    expect(composerErrorFor({ status: 400, code: 'INVALID_BODY' })).toMatch(/10 and 500/)
  })

  it('falls back to the status when no code came through', () => {
    // Every endpoint that is not the claims API, and any proxy in front of it.
    expect(composerErrorFor({ status: 404 })).toMatch(/no longer part of this argument/i)
  })

  /**
   * The merged parent, which is the one refusal with somewhere to go.
   *
   * noWritesReason() hides the composer on a claim that is already merged, so
   * the only way to meet this is to have been mid-paragraph when a maven
   * merged the claim being answered. The reader did nothing wrong and is
   * holding up to 500 characters with nowhere to put them, so the server sends
   * the id of the claim that now carries the argument and the composer offers
   * it.
   */
  const MERGE_TARGET_BODY = 'Demo claim that now carries this argument.'

  function mergedRefusal() {
    h.create.isError = true
    h.create.error = Object.assign(new Error('This point has been merged into another claim'), {
      status: 409,
      code: 'CLAIM_MERGED',
      mergedInto: MERGED_ID,
    })
  }

  /** The destination as the node route serves it. */
  function destinationIs(over: Partial<Claim> = {}) {
    h.node = loaded(nodeOf({ claim: claim({ id: MERGED_ID, body: MERGE_TARGET_BODY, ...over }) }))
  }

  it('offers the claim the argument was merged into, naming it', () => {
    mergedRefusal()
    destinationIs()
    renderTree()
    openComposer('supports')

    const offer = screen.getByTestId('claim-composer-merge-offer')
    expect(offer).toHaveTextContent(MERGE_TARGET_BODY)
    expect(h.calls.node).toContain(MERGED_ID)
  })

  it('carries the reader’s words to the claim it sends them to', () => {
    mergedRefusal()
    destinationIs()
    renderTree()
    const box = openComposer('supports')
    fireEvent.change(box, { target: { value: 'Demo argument the reader does not want to lose.' } })

    fireEvent.click(screen.getByTestId('claim-composer-merge-offer'))

    // The focus moved…
    expect(screen.getByTestId('loc')).toHaveTextContent(`claim=${MERGED_ID}`)
    // …the composer is open on the same side…
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Your supporting argument')).toBeInTheDocument()
    // …and their text came with it.
    expect(screen.getByRole('textbox')).toHaveValue(
      'Demo argument the reader does not want to lose.',
    )
  })

  it('does not leave the words behind under the claim that was merged away', () => {
    mergedRefusal()
    destinationIs()
    renderTree()
    fireEvent.change(openComposer('supports'), { target: { value: 'Demo argument that moves.' } })

    fireEvent.click(screen.getByTestId('claim-composer-merge-offer'))

    expect(localStorage.getItem(draftKey('supports', ROOT_ID))).toBeNull()
    expect(localStorage.getItem(draftKey('supports', MERGED_ID))).toBe('Demo argument that moves.')
  })

  it('shortens a long claim rather than putting 500 characters on a button', () => {
    const long = `Demo claim that runs on ${'and on '.repeat(60)}past any sensible button.`
    mergedRefusal()
    destinationIs({ body: long })
    renderTree()
    openComposer('supports')

    const offer = screen.getByTestId('claim-composer-merge-offer')
    expect(offer.textContent!.length).toBeLessThan(long.length)
    expect(offer).toHaveTextContent('…')
  })

  it('makes no offer it cannot describe when the destination is withheld', () => {
    // A hidden claim is served as a tombstone: 200, body withheld. Sending a
    // reader somewhere this cannot name is worse than the dead end.
    mergedRefusal()
    destinationIs({ body: '', isHidden: true })
    renderTree()
    openComposer('supports')

    expect(screen.queryByTestId('claim-composer-merge-offer')).not.toBeInTheDocument()
    expect(screen.getByTestId('claim-composer-error')).toHaveTextContent(/merged into another one/i)
  })

  it('makes no offer while the destination is still loading, and none if it fails', () => {
    mergedRefusal()
    h.node = pending
    renderTree()
    openComposer('supports')
    expect(screen.queryByTestId('claim-composer-merge-offer')).not.toBeInTheDocument()

    cleanup()
    mergedRefusal()
    h.node = failed('Request failed (404)')
    renderTree()
    openComposer('supports')
    expect(screen.queryByTestId('claim-composer-merge-offer')).not.toBeInTheDocument()
  })

  it('makes no offer to a claim that has itself been merged', () => {
    // Merge chains exist — the API bounds them with MERGE_CHAIN_TOO_LONG
    // rather than forbidding them. The tree gates the composer behind
    // noWritesReason(), so landing on a merged claim means landing somewhere
    // with no composer at all: the reader's paragraph would be written under
    // that claim's draft key and have no box to appear in. An offer that
    // cannot be honoured is worse than the dead end it replaces.
    mergedRefusal()
    destinationIs({ mergedInto: '00000000-0000-4000-8000-000000000005' })
    renderTree()
    fireEvent.change(openComposer('supports'), { target: { value: 'Demo argument at risk.' } })

    expect(screen.queryByTestId('claim-composer-merge-offer')).not.toBeInTheDocument()
    // And the words stay where the reader can still see them.
    expect(screen.getByRole('textbox')).toHaveValue('Demo argument at risk.')
  })

  it('makes no offer on a merge refusal that carried no target', () => {
    h.create.isError = true
    h.create.error = Object.assign(new Error('merged'), { status: 409, code: 'CLAIM_MERGED' })
    destinationIs()
    renderTree()
    openComposer('supports')

    expect(screen.queryByTestId('claim-composer-merge-offer')).not.toBeInTheDocument()
    expect(h.calls.node).not.toContain(MERGED_ID)
  })
})

describe('CommunityHubPage — band 3 in place', () => {
  it('reserves the badges slot without rendering badge content', () => {
    const { container } = renderPage()
    const slot = container.querySelector('[data-slot="badges"]')!
    expect(slot).toBeInTheDocument()
    expect(slot.childNodes).toHaveLength(0)
    expect(slot.textContent).toBe('')
    expect(slot.getAttribute('aria-label')).toBeNull()
    expect(slot.getAttribute('aria-labelledby')).toBeNull()
    // Between band 2 and band 3, in that order.
    const band2 = screen.getByText('Perspectives')
    const band3 = container.querySelector('[data-band="arguments"]')!
    expect(band2.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(band3) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps bands 1, 2 and 4 mounted while the focused claim changes', () => {
    renderPage()
    expect(h.mounts).toEqual({ seasonSelector: 1, stanceCard: 1, threadForm: 1 })

    fireEvent.click(screen.getByText('Demo supporting argument.'))

    // The seam really moved…
    expect(screen.getByTestId('loc')).toHaveTextContent(`claim=${SUPPORT_ID}`)
    expect(h.calls.node).toContain(SUPPORT_ID)
    // …and no sibling band was torn down and rebuilt. A key derived from the
    // location anywhere above these would bump every counter here.
    expect(h.mounts).toEqual({ seasonSelector: 1, stanceCard: 1, threadForm: 1 })
  })

  it('keeps the sibling bands mounted when the reader zooms back out too', () => {
    renderPage(`/communities/test-slug?claim=${SUPPORT_ID}`)
    expect(h.mounts).toEqual({ seasonSelector: 1, stanceCard: 1, threadForm: 1 })
    fireEvent.click(screen.getByText('Back to the top of this argument'))
    expect(screen.getByTestId('loc')).not.toHaveTextContent('claim=')
    expect(h.mounts).toEqual({ seasonSelector: 1, stanceCard: 1, threadForm: 1 })
  })
})
