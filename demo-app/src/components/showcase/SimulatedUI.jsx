/**
 * SimulatedUI — macOS-style window chrome wrapper.
 *
 * Renders children inside a fake desktop application frame with
 * the familiar red / yellow / green traffic-light dots and an
 * optional centered title in the title bar.
 *
 * @param {string}  title      Text shown in the centre of the title bar.
 * @param {string}  className  Additional CSS classes on the outer wrapper.
 * @param {React.ReactNode} children   Content rendered inside the window body.
 */
export default function SimulatedUI({ title, children, className = '' }) {
  return (
    <div className={`sc-ui ${className}`} role="region" aria-label={title || 'Simulated application window'}>
      <div className="sc-ui__titlebar" aria-hidden="true">
        <span className="sc-ui__dot" style={{ background: '#FF5F57' }} />
        <span className="sc-ui__dot" style={{ background: '#FFBD2E' }} />
        <span className="sc-ui__dot" style={{ background: '#28C840' }} />
        {title && <span className="sc-ui__title">{title}</span>}
      </div>
      <div className="sc-ui__body">{children}</div>
    </div>
  );
}
