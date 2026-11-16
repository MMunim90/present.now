// Safe math expression parser for the Graph Box.
//
// Hand-written tokenizer + recursive-descent parser that compiles to a tree of
// JavaScript closures. It NEVER uses eval(), new Function() or any dynamic
// code execution: user text is only ever turned into data (tokens/AST) and
// evaluated by a fixed set of whitelisted operations below.
//
// Supported: + - * / ^ (right-assoc), unary +/-, parentheses, implicit
// multiplication (2x, 3(x+1), x sin(x)), superscripts (x², x³), the variable
// x, constants pi/π/e, and the functions listed in FUNCTIONS.
// Notes: log = base-10 logarithm (like Desmos/calculators), ln = natural log.

const MAX_LENGTH = 200
const MAX_DEPTH = 40

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
}

const CONSTANTS = { pi: Math.PI, e: Math.E }

const KNOWN_NAMES = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS), 'x'].sort((a, b) => b.length - a.length)

const SUPERSCRIPTS = { '²': '2', '³': '3', '⁴': '4' }

class ParseError extends Error {}

function tokenize(input) {
  const tokens = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
    } else if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(input.slice(i))
      if (!m) throw new ParseError(`Unexpected "${ch}"`)
      tokens.push({ type: 'num', value: parseFloat(m[1]) })
      i += m[1].length
    } else if (/[a-zA-Zπ]/.test(ch)) {
      // Read a run of letters, then split greedily into known names so that
      // "2xsin(x)" or "xpi" work, and unknown words give a precise error.
      const m = /^[a-zA-Zπ]+/.exec(input.slice(i))
      let run = m[0].toLowerCase().replace(/π/g, 'pi')
      const original = m[0]
      while (run.length) {
        const name = KNOWN_NAMES.find((n) => run.startsWith(n))
        if (!name) throw new ParseError(`Unknown name "${original}"`)
        tokens.push({ type: 'name', value: name })
        run = run.slice(name.length)
      }
      i += original.length
    } else if (SUPERSCRIPTS[ch]) {
      tokens.push({ type: 'op', value: '^' }, { type: 'num', value: parseInt(SUPERSCRIPTS[ch], 10) })
      i++
    } else if ('+-*/^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
    } else if (ch === '×' || ch === '·') {
      tokens.push({ type: 'op', value: '*' })
      i++
    } else if (ch === '÷') {
      tokens.push({ type: 'op', value: '/' })
      i++
    } else if (ch === '−') {
      tokens.push({ type: 'op', value: '-' })
      i++
    } else {
      throw new ParseError(`Unexpected character "${ch}"`)
    }
  }
  return tokens
}

function parseTokens(tokens) {
  let pos = 0
  let depth = 0
  const peek = () => tokens[pos]
  const isOp = (v) => peek() && peek().type === 'op' && peek().value === v

  function enter() {
    if (++depth > MAX_DEPTH) throw new ParseError('Expression is nested too deeply')
  }
  function leave() {
    depth--
  }

  // expr := term (('+' | '-') term)*
  function parseExpr() {
    enter()
    let left = parseTerm()
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value
      const right = parseTerm()
      const l = left
      left = op === '+' ? (x) => l(x) + right(x) : (x) => l(x) - right(x)
    }
    leave()
    return left
  }

  // True when the next token can start a factor (=> implicit multiplication).
  function startsFactor() {
    const t = peek()
    return !!t && (t.type === 'num' || t.type === 'name' || (t.type === 'op' && t.value === '('))
  }

  // term := unary (('*' | '/' | <implicit>) unary)*
  function parseTerm() {
    let left = parseUnary()
    for (;;) {
      if (isOp('*')) {
        pos++
        const right = parseUnary()
        const l = left
        left = (x) => l(x) * right(x)
      } else if (isOp('/')) {
        pos++
        const right = parseUnary()
        const l = left
        left = (x) => l(x) / right(x)
      } else if (startsFactor()) {
        const right = parseUnary()
        const l = left
        left = (x) => l(x) * right(x)
      } else {
        return left
      }
    }
  }

  // unary := ('-' | '+') unary | power      (so -x^2 = -(x^2))
  function parseUnary() {
    enter()
    let result
    if (isOp('-')) {
      pos++
      const inner = parseUnary()
      result = (x) => -inner(x)
    } else if (isOp('+')) {
      pos++
      result = parseUnary()
    } else {
      result = parsePower()
    }
    leave()
    return result
  }

  // power := atom ('^' unary)?              (right-associative, x^-2 allowed)
  function parsePower() {
    const base = parseAtom()
    if (isOp('^')) {
      pos++
      const exponent = parseUnary()
      return (x) => Math.pow(base(x), exponent(x))
    }
    return base
  }

  function parseAtom() {
    const t = peek()
    if (!t) throw new ParseError('Expression ended unexpectedly')

    if (t.type === 'num') {
      pos++
      const v = t.value
      return () => v
    }

    if (t.type === 'name') {
      pos++
      if (t.value === 'x') return (x) => x
      if (t.value in CONSTANTS) {
        const c = CONSTANTS[t.value]
        return () => c
      }
      const fn = FUNCTIONS[t.value]
      if (!isOp('(')) {
        throw new ParseError(`Function "${t.value}" needs parentheses, e.g. ${t.value}(x)`)
      }
      pos++ // (
      const arg = parseExpr()
      if (!isOp(')')) throw new ParseError('Missing closing ")"')
      pos++
      return (x) => fn(arg(x))
    }

    if (t.type === 'op' && t.value === '(') {
      pos++
      const inner = parseExpr()
      if (!isOp(')')) throw new ParseError('Missing closing ")"')
      pos++
      return inner
    }

    throw new ParseError(`Unexpected "${t.value}"`)
  }

  const fn = parseExpr()
  if (pos < tokens.length) {
    const t = tokens[pos]
    throw new ParseError(t.value === ')' ? 'Unmatched ")"' : `Unexpected "${t.value}"`)
  }
  return fn
}

/**
 * Compile a user-typed expression in x.
 * @returns {{ fn: (x:number)=>number, error: null } | { fn: null, error: string }}
 */
export function compileExpression(source) {
  try {
    let text = String(source ?? '').trim()
    if (!text) return { fn: null, error: 'Enter an expression' }
    if (text.length > MAX_LENGTH) return { fn: null, error: `Expression is too long (max ${MAX_LENGTH} characters)` }
    // Allow the natural "y = ..." / "f(x) = ..." prefixes.
    text = text.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, '')
    const fn = parseTokens(tokenize(text))
    // Smoke-test once so structural problems surface as validation errors.
    fn(1)
    return { fn, error: null }
  } catch (err) {
    if (err instanceof ParseError) return { fn: null, error: err.message }
    return { fn: null, error: 'Invalid expression' }
  }
}
