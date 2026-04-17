import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import DirectoryPage from './pages/DirectoryPage'
import CommunityHubPage from './pages/CommunityHubPage'
import { ThreadPage } from './pages/ThreadPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <>
      <Toaster position="bottom-center" richColors />
      <Routes>
        <Route path="/" element={<Navigate to="/communities" replace />} />
        <Route path="/communities" element={<DirectoryPage />} />
        <Route path="/communities/:slug" element={<CommunityHubPage />} />
        <Route path="/communities/:slug/threads/:id" element={<ThreadPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
