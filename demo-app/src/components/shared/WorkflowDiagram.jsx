export default function WorkflowDiagram({ steps = [], activeStep = -1 }) {
  return (
    <div className="workflow-diagram" role="list" aria-label="Workflow steps">
      {steps.map((step, index) => {
        const isActive = index === activeStep
        const isCompleted = index < activeStep
        let stateClass = ''
        if (isActive) stateClass = ' workflow-step--active'
        else if (isCompleted) stateClass = ' workflow-step--completed'

        return (
          <div className="workflow-step" key={step.id || index} role="listitem">
            {index > 0 && (
              <div className="workflow-arrow" aria-hidden="true">
                {'\u2192'}
              </div>
            )}
            <div className={`workflow-step__content${stateClass}`}>
              <div className="workflow-step__icon" aria-hidden="true">
                {isCompleted ? '\u2713' : (step.icon || (index + 1))}
              </div>
              <div className="workflow-step__title">{step.title}</div>
              {step.subtitle && (
                <div className="workflow-step__subtitle">{step.subtitle}</div>
              )}
              {step.system && (
                <div className="workflow-step__system">{step.system}</div>
              )}
              {step.timing && (
                <div className="workflow-step__timing">{step.timing}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
