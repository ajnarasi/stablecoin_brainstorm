import { useState, useCallback } from 'react'

function tokenizeJson(code) {
  const parts = []
  let i = 0

  while (i < code.length) {
    // Skip whitespace
    if (/\s/.test(code[i])) {
      let ws = ''
      while (i < code.length && /\s/.test(code[i])) {
        ws += code[i]
        i++
      }
      parts.push({ type: 'plain', value: ws })
      continue
    }

    // Strings
    if (code[i] === '"') {
      let str = '"'
      i++
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') {
          str += code[i]
          i++
        }
        str += code[i]
        i++
      }
      str += '"'
      i++

      // Check if this is a key (followed by colon)
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      if (code[j] === ':') {
        parts.push({ type: 'key', value: str })
      } else {
        parts.push({ type: 'string', value: str })
      }
      continue
    }

    // Numbers
    if (/[-\d]/.test(code[i])) {
      let num = ''
      while (i < code.length && /[-\d.eE+]/.test(code[i])) {
        num += code[i]
        i++
      }
      parts.push({ type: 'number', value: num })
      continue
    }

    // Booleans and null
    if (code.slice(i, i + 4) === 'true') {
      parts.push({ type: 'boolean', value: 'true' })
      i += 4
      continue
    }
    if (code.slice(i, i + 5) === 'false') {
      parts.push({ type: 'boolean', value: 'false' })
      i += 5
      continue
    }
    if (code.slice(i, i + 4) === 'null') {
      parts.push({ type: 'null', value: 'null' })
      i += 4
      continue
    }

    // Brackets
    if (/[{}\[\]]/.test(code[i])) {
      parts.push({ type: 'bracket', value: code[i] })
      i++
      continue
    }

    // Commas and colons
    if (code[i] === ',' || code[i] === ':') {
      parts.push({ type: 'comma', value: code[i] })
      i++
      continue
    }

    // Fallback
    parts.push({ type: 'plain', value: code[i] })
    i++
  }

  return parts
}

export default function CodeBlock({ language = 'json', code = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  const renderCode = () => {
    if (language === 'json') {
      const tokens = tokenizeJson(code)
      return tokens.map((token, i) => {
        const className = token.type !== 'plain' ? `token-${token.type}` : ''
        return className
          ? <span key={i} className={className}>{token.value}</span>
          : token.value
      })
    }
    return code
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__language">{language}</span>
        <button
          className="code-block__copy"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-block__body" tabIndex={0} aria-label={`${language} code block`}>
        <code>{renderCode()}</code>
      </pre>
    </div>
  )
}
