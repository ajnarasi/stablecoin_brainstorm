import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ShowcaseSection({ id, children, className = '' }) {
  const { ref, isVisible, hasBeenVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      id={id}
      className={`sc-section ${hasBeenVisible ? 'sc-section--visible' : ''} ${className}`}
    >
      <div className="sc-section__inner">
        {typeof children === 'function' ? children(isVisible, hasBeenVisible) : children}
      </div>
    </section>
  );
}
