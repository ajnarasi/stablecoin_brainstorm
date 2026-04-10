import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Landing from './pages/Landing'
import Prototype1Page from './pages/Prototype1Page'
import Prototype2Page from './pages/Prototype2Page'
import Prototype3Page from './pages/Prototype3Page'
import Prototype4Page from './pages/Prototype4Page'
import ShowcasePage from './pages/ShowcasePage'
import CloverCnpShowcasePage from './pages/CloverCnpShowcasePage'

function StandardLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Showcase: cinematic full-screen, no Navbar/Footer */}
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/clover-cnp-showcase" element={<CloverCnpShowcasePage />} />

        {/* Standard pages with Navbar + Footer */}
        <Route element={<StandardLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/yield-sweep" element={<Prototype1Page />} />
          <Route path="/agent-pay" element={<Prototype2Page />} />
          <Route path="/supplier-pay" element={<Prototype3Page />} />
          <Route path="/cross-border" element={<Prototype4Page />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
