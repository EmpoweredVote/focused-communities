import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './AuthContext'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  localStorage.clear()
})

// Synthetic throughout: an obviously fake token and an obviously fake account.
const ACCOUNT = {
  id: 'test-user-a',
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'Demo Heron',
}

function Probe() {
  const { auth, signOut } = useAuth()
  return (
    <>
      <span data-testid="state">{auth.state}</span>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </>
  )
}

describe('signOut (I3)', () => {
  it('drops what the leaving reader’s requests brought back', async () => {
    localStorage.setItem('ev_token', 'test-token-a')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 200, json: async () => ACCOUNT })),
    )
    const client = new QueryClient()
    // A claim body, which is the one kind of cached thing that carries the
    // reader's own rating.
    client.setQueryData(['claim', 'test-user-a', 'test-claim-a'], { node: { claim: { myRating: 9 } } })

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('connected'))

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(localStorage.getItem('ev_token')).toBeNull()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.getByTestId('state')).toHaveTextContent('inform')
  })
})
