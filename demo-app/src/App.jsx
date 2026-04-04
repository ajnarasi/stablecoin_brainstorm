import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Landing from './pages/Landing'
import Prototype1Page from './pages/Prototype1Page'
import Prototype2Page from './pages/Prototype2Page'
import Prototype3Page from './pages/Prototype3Page'
import Prototype4Page from './pages/Prototype4Page'

function App() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/yield-sweep" element={<Prototype1Page />} />
          <Route path="/agent-pay" element={<Prototype2Page />} />
          <Route path="/supplier-pay" element={<Prototype3Page />} />
          <Route path="/cross-border" element={<Prototype4Page />} />
        </Routes>
      </ErrorBoundary>
      <Footer />
    </>
  )
}

export default App
