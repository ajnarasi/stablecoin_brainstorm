import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import YieldSweepDemo from '../components/showcase/YieldSweepDemo';
import AgentPayDemo from '../components/showcase/AgentPayDemo';
import SupplierPayDemo from '../components/showcase/SupplierPayDemo';
import CrossBorderDemo from '../components/showcase/CrossBorderDemo';
import '../styles/showcase.css';

const SECTION_IDS = ['yield-sweep', 'agent-pay', 'supplier-pay', 'cross-border'];
const SECTION_LABELS = [
  'Merchant Yield Sweep',
  'Pay-by-Agent x402',
  'Instant Supplier Pay',
  'Cross-Border Settlement',
];

export default function ShowcasePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const showcaseRef = useRef(null);
  const navigate = useNavigate();

  // Add/remove body class for cinematic mode
  useEffect(() => {
    document.body.classList.add('showcase-active');
    return () => document.body.classList.remove('showcase-active');
  }, []);

  // IntersectionObserver to track which section is in view
  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id));
    const observers = [];

    sections.forEach((section, index) => {
      if (!section) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToSection = useCallback(
    (index) => {
      const clamped = Math.max(0, Math.min(index, SECTION_IDS.length - 1));
      const el = document.getElementById(SECTION_IDS[clamped]);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    []
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
        case 'ArrowRight':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = Math.min(prev + 1, SECTION_IDS.length - 1);
            scrollToSection(next);
            return next;
          });
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            scrollToSection(next);
            return next;
          });
          break;
        case 'Escape':
          navigate('/');
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, scrollToSection]);

  return (
    <div className="showcase" ref={showcaseRef}>
      <YieldSweepDemo />
      <AgentPayDemo />
      <SupplierPayDemo />
      <CrossBorderDemo />

      <nav className="sc-progress" aria-label="Demo navigation">
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            className={`sc-progress__dot ${i === activeIndex ? 'sc-progress__dot--active' : ''}`}
            onClick={() => scrollToSection(i)}
            aria-label={SECTION_LABELS[i]}
            aria-current={i === activeIndex ? 'true' : undefined}
          />
        ))}
      </nav>
    </div>
  );
}
