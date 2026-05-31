/* ============================================================
   LINEAR ALGEBRA PROBLEM GENERATOR — script.js
   Production-ready, modular, fully commented
   Astana IT University · Spring 2026
   ============================================================ */

'use strict';

/* ============================================================
   SECTION 1: UTILITY FUNCTIONS & MATH HELPERS
   ============================================================ */

const MathUtils = (() => {

  /** Returns a random integer in [min, max] */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Returns a random non-zero integer in [-range, range] (excluding 0) */
  function randNonZero(range = 5) {
    let v = 0;
    while (v === 0) v = randInt(-range, range);
    return v;
  }

  /** Returns a random integer in [-range, range] */
  function randCoeff(range = 5) {
    return randInt(-range, range);
  }

  /** Pick a random element from an array */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Shuffle array in place (Fisher-Yates) */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Generate an m×n matrix of random integers in [-range, range] */
  function randMatrix(m, n, range = 4, allowZero = true) {
    return Array.from({ length: m }, () =>
      Array.from({ length: n }, () => allowZero ? randInt(-range, range) : randNonZero(range))
    );
  }

  /** Generate a random vector of length n */
  function randVector(n, range = 5, allowZero = true) {
    return Array.from({ length: n }, () => allowZero ? randInt(-range, range) : randNonZero(range));
  }

  /** Matrix multiply A (m×k) by B (k×n) */
  function matMul(A, B) {
    const m = A.length, k = A[0].length, n = B[0].length;
    return Array.from({ length: m }, (_, i) =>
      Array.from({ length: n }, (__, j) =>
        A[i].reduce((s, _, l) => s + A[i][l] * B[l][j], 0)
      )
    );
  }

  /** Matrix add A + B */
  function matAdd(A, B) {
    return A.map((row, i) => row.map((v, j) => v + B[i][j]));
  }

  /** Scalar multiply k*A */
  function scalarMul(k, A) {
    return A.map(row => row.map(v => v * k));
  }

  /** Transpose of matrix A */
  function transpose(A) {
    return A[0].map((_, j) => A.map(row => row[j]));
  }

  /** Identity matrix of size n */
  function identity(n) {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (__, j) => i === j ? 1 : 0)
    );
  }

  /** 2×2 determinant */
  function det2(A) {
    return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  }

  /** 3×3 determinant (cofactor expansion along row 0) */
  function det3(A) {
    const [[a, b, c], [d, e, f], [g, h, k]] = A;
    return a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
  }

  /** n×n determinant via cofactor expansion (recursive) */
  function det(A) {
    const n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return det2(A);
    if (n === 3) return det3(A);
    let result = 0;
    for (let j = 0; j < n; j++) {
      const minor = A.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
      result += Math.pow(-1, j) * A[0][j] * det(minor);
    }
    return result;
  }

  /** Generate a 2×2 matrix with a nice integer determinant */
  function randMatrix2x2WithDet(targetDet) {
    // Build upper triangular with det = product of diagonal
    const a = randNonZero(3);
    const b = Math.round(targetDet / a);
    return [[a, randInt(-3, 3)], [0, b]];
  }

  /** Generate a 2×2 integer matrix guaranteed invertible */
  function randInvertible2x2(range = 4) {
    let A;
    do {
      A = randMatrix(2, 2, range);
    } while (det2(A) === 0);
    return A;
  }

  /** Generate a 3×3 integer matrix guaranteed invertible */
  function randInvertible3x3(range = 3) {
    let A;
    do {
      A = randMatrix(3, 3, range);
    } while (det3(A) === 0);
    return A;
  }

  /** Generate a 2×2 matrix with known integer eigenvalues λ1, λ2 */
  function matrixWithEigenvalues2x2(λ1, λ2) {
    // Build A = P diag(λ1,λ2) P^-1 for a simple P
    const a = randInt(1, 3), b = randInt(1, 3);
    const c = randInt(1, 3), d = randInt(1, 3);
    const detP = a * d - b * c;
    if (detP === 0) return [[λ1, 0], [0, λ2]];
    // P [[λ1,0],[0,λ2]] P^-1 where P = [[a,b],[c,d]]
    const P = [[a, b], [c, d]];
    const D = [[λ1, 0], [0, λ2]];
    const Pinv = [[d / detP, -b / detP], [-c / detP, a / detP]];
    const PD = matMul(P, D);
    const A = matMul(PD, Pinv);
    return A.map(row => row.map(v => Math.round(v)));
  }

  /** Generate a 3×3 matrix with known integer eigenvalues */
  function matrixWithEigenvalues3x3(λ1, λ2, λ3) {
    // Diagonal matrix for simplicity, or nearly-diagonal
    if (Math.random() < 0.4) return [[λ1, 0, 0], [0, λ2, 0], [0, 0, λ3]];
    // Otherwise build with off-diagonal elements
    const offDiagRange = 2;
    const A = [
      [λ1, randInt(-offDiagRange, offDiagRange), randInt(-offDiagRange, offDiagRange)],
      [0, λ2, randInt(-offDiagRange, offDiagRange)],
      [0, 0, λ3]
    ];
    return A;
  }

  /** Row-reduce matrix to RREF; returns { rref, pivots, steps } */
  function rowReduce(M) {
    const A = M.map(row => [...row]);
    const rows = A.length, cols = A[0].length;
    const pivots = [];
    const steps = [];
    let pivotRow = 0;

    for (let col = 0; col < cols && pivotRow < rows; col++) {
      // Find pivot
      let maxRow = -1, maxVal = 0;
      for (let r = pivotRow; r < rows; r++) {
        if (Math.abs(A[r][col]) > Math.abs(maxVal)) { maxVal = A[r][col]; maxRow = r; }
      }
      if (maxRow === -1 || maxVal === 0) continue;

      // Swap
      if (maxRow !== pivotRow) {
        [A[pivotRow], A[maxRow]] = [A[maxRow], A[pivotRow]];
        steps.push({ op: 'swap', r1: pivotRow, r2: maxRow, matrix: A.map(r => [...r]) });
      }

      // Scale pivot row
      const piv = A[pivotRow][col];
      if (piv !== 1) {
        for (let j = 0; j < cols; j++) A[pivotRow][j] /= piv;
        steps.push({ op: 'scale', row: pivotRow, factor: piv, matrix: A.map(r => [...r]) });
      }

      pivots.push({ row: pivotRow, col });

      // Eliminate column
      for (let r = 0; r < rows; r++) {
        if (r !== pivotRow && A[r][col] !== 0) {
          const factor = A[r][col];
          for (let j = 0; j < cols; j++) A[r][j] -= factor * A[pivotRow][j];
          steps.push({ op: 'eliminate', targetRow: r, pivotRow, factor, matrix: A.map(r2 => [...r2]) });
        }
      }
      pivotRow++;
    }

    return { rref: A, pivots, steps };
  }

  /** Compute rank of a matrix */
  function rank(M) {
    const { pivots } = rowReduce(M);
    return pivots.length;
  }

  /** Format a fraction as a string (reduces if possible) */
  function frac(num, den = 1) {
    if (den === 0) return '∞';
    if (num === 0) return '0';
    const g = gcd(Math.abs(num), Math.abs(den));
    const n = num / g, d = den / g;
    if (d < 0) return d === -1 ? (n === 1 ? '-1' : `-${n}`) : `${-n}/${-d}`;
    if (d === 1) return `${n}`;
    return `${n}/${d}`;
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  /** Format a number for display, rounding floats */
  function fmt(v) {
    if (Number.isInteger(v)) return `${v}`;
    const r = Math.round(v * 1000) / 1000;
    return `${r}`;
  }

  /** Build LaTeX for a matrix */
  function matToLatex(A, bracket = 'pmatrix') {
    const rows = A.map(row => row.map(v => fmt(v)).join(' & ')).join(' \\\\ ');
    return `\\begin{${bracket}} ${rows} \\end{${bracket}}`;
  }

  /** Build LaTeX for a column vector */
  function vecToLatex(v, bracket = 'pmatrix') {
    return `\\begin{${bracket}} ${v.map(x => fmt(x)).join(' \\\\ ')} \\end{${bracket}}`;
  }

  /** Build LaTeX for an augmented matrix [A|b] */
  function augToLatex(A, b) {
    const n = A[0].length;
    const cols = Array(n).fill('r').join('') + '|r';
    const rows = A.map((row, i) => [...row, b[i]].map(v => fmt(v)).join(' & ')).join(' \\\\ ');
    return `\\left[\\begin{array}{${cols}} ${rows} \\end{array}\\right]`;
  }

  /** Build LaTeX for a linear system */
  function systemToLatex(A, b, vars = null) {
    const n = A[0].length;
    const varNames = vars || (n <= 4 ? ['x_1', 'x_2', 'x_3', 'x_4'].slice(0, n) : Array.from({ length: n }, (_, i) => `x_{${i + 1}}`));
    const eqs = A.map((row, i) => {
      let expr = '';
      let first = true;
      row.forEach((c, j) => {
        if (c === 0) return;
        const varStr = varNames[j];
        if (first) {
          expr += c === 1 ? varStr : c === -1 ? `-${varStr}` : `${c}${varStr}`;
          first = false;
        } else {
          if (c > 0) expr += c === 1 ? ` + ${varStr}` : ` + ${c}${varStr}`;
          else expr += c === -1 ? ` - ${varStr}` : ` - ${Math.abs(c)}${varStr}`;
        }
      });
      if (expr === '') expr = '0';
      return `${expr} &= ${fmt(b[i])}`;
    });
    return `\\begin{cases} ${eqs.join(' \\\\ ')} \\end{cases}`;
  }

  /** Compute inverse of 2×2 matrix */
  function inv2x2(A) {
    const d = det2(A);
    if (d === 0) return null;
    return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
  }

  /** Compute inverse of 3×3 matrix via adjugate */
  function inv3x3(A) {
    const d = det3(A);
    if (d === 0) return null;
    const [[a, b, c], [dd, e, f], [g, h, k]] = A;
    const adj = [
      [(e * k - f * h) / d, -(b * k - c * h) / d, (b * f - c * e) / d],
      [-(dd * k - f * g) / d, (a * k - c * g) / d, -(a * f - c * dd) / d],
      [(dd * h - e * g) / d, -(a * h - b * g) / d, (a * e - b * dd) / d]
    ];
    return adj;
  }

  /** Compute Gram-Schmidt orthogonalization of vectors */
  function gramSchmidt(vectors) {
    const orthogonal = [];
    for (const v of vectors) {
      let u = [...v];
      for (const prev of orthogonal) {
        const dot_vu = dotProduct(v, prev);
        const dot_uu = dotProduct(prev, prev);
        if (dot_uu !== 0) {
          const proj = dot_vu / dot_uu;
          u = u.map((x, i) => x - proj * prev[i]);
        }
      }
      // Only add if non-zero
      if (u.some(x => Math.abs(x) > 1e-10)) orthogonal.push(u);
    }
    return orthogonal;
  }

  function dotProduct(u, v) {
    return u.reduce((s, x, i) => s + x * v[i], 0);
  }

  function vectorNorm(v) {
    return Math.sqrt(dotProduct(v, v));
  }

  return {
    randInt, randNonZero, randCoeff, pick, shuffle,
    randMatrix, randVector,
    matMul, matAdd, scalarMul, transpose, identity,
    det2, det3, det,
    randInvertible2x2, randInvertible3x3,
    matrixWithEigenvalues2x2, matrixWithEigenvalues3x3,
    rowReduce, rank,
    frac, fmt, gcd,
    matToLatex, vecToLatex, augToLatex, systemToLatex,
    inv2x2, inv3x3,
    gramSchmidt, dotProduct, vectorNorm
  };
})();

/* ============================================================
   SECTION 2: STORAGE MANAGER
   ============================================================ */

const StorageManager = (() => {
  const PREFIX = 'lagen_';

  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* silent */ }
  }

  function get(key, fallback = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) { /* silent */ }
  }

  function clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) { /* silent */ }
  }

  return { set, get, remove, clear };
})();

/* ============================================================
   SECTION 3: STATISTICS MANAGER
   ============================================================ */

const StatsManager = (() => {
  let stats = {
    generated: 0,
    solved: 0,
    viewed: 0,
    streak: 0,
    byTopic: {},
    byDifficulty: { easy: 0, intermediate: 0, hard: 0 },
    currentTopic: '—',
    currentDifficulty: 'Intermediate',
    currentWeek: '',
    lastGenerated: null
  };

  function load() {
    const saved = StorageManager.get('stats', null);
    if (saved) stats = { ...stats, ...saved };
  }

  function save() { StorageManager.set('stats', stats); }

  function increment(field) {
    if (field in stats && typeof stats[field] === 'number') stats[field]++;
    save(); updateUI();
  }

  function setTopic(topicName, week, difficulty) {
    stats.currentTopic = topicName;
    stats.currentWeek = week ? `Week ${week}` : '';
    stats.currentDifficulty = difficulty || 'Intermediate';
    if (!stats.byTopic[topicName]) stats.byTopic[topicName] = 0;
    stats.byTopic[topicName]++;
    const d = difficulty || 'intermediate';
    if (stats.byDifficulty[d] !== undefined) stats.byDifficulty[d]++;
    save(); updateUI();
  }

  function incrementGenerated(topicName, week, difficulty) {
    stats.generated++;
    stats.lastGenerated = Date.now();
    setTopic(topicName, week, difficulty);
    save(); updateUI();
  }

  function incrementSolved() { stats.solved++; stats.streak++; save(); updateUI(); }
  function incrementViewed() { stats.viewed++; save(); updateUI(); }

  function getAccuracy() {
    if (stats.generated === 0) return null;
    return Math.round((stats.solved / stats.generated) * 100);
  }

  function updateUI() {
    const els = {
      'stat-generated': stats.generated,
      'stat-solved': stats.solved,
      'stat-viewed': stats.viewed,
      'stat-topic': stats.currentTopic,
      'stat-topic-week': stats.currentWeek,
      'stat-difficulty': capitalize(stats.currentDifficulty),
      'header-stat-generated': stats.generated,
      'header-stat-solved': stats.solved,
      'header-stat-streak': stats.streak
    };
    for (const [id, val] of Object.entries(els)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    // Accuracy
    const acc = getAccuracy();
    const accEl = document.getElementById('stat-accuracy');
    if (accEl) accEl.textContent = acc !== null ? `${acc}%` : '—';

    // Progress ring
    const ring = document.getElementById('accuracy-ring');
    if (ring && acc !== null) {
      const circumference = 94.25;
      ring.style.strokeDashoffset = circumference - (acc / 100) * circumference;
    }

    // Difficulty bar
    const bar = document.getElementById('difficulty-bar-fill');
    if (bar) {
      const map = { easy: 25, intermediate: 55, hard: 90, advanced: 90 };
      bar.style.width = `${map[stats.currentDifficulty.toLowerCase()] || 55}%`;
    }
  }

  function reset() {
    stats = {
      generated: 0, solved: 0, viewed: 0, streak: 0,
      byTopic: {}, byDifficulty: { easy: 0, intermediate: 0, hard: 0 },
      currentTopic: '—', currentDifficulty: 'Intermediate', currentWeek: '', lastGenerated: null
    };
    save(); updateUI();
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  return { load, save, increment, incrementGenerated, incrementSolved, incrementViewed, getAccuracy, updateUI, reset, get: () => stats };
})();

/* ============================================================
   SECTION 4: THEME MANAGER
   ============================================================ */

const ThemeManager = (() => {
  let current = 'dark';

  function init() {
    current = StorageManager.get('theme', 'dark');
    apply(current);
  }

  function apply(theme) {
    const body = document.getElementById('page-body');
    if (!body) return;
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${theme}`);
    body.dataset.theme = theme === 'light' ? 'light' : '';
    if (theme === 'light') body.setAttribute('data-theme', 'light');
    else body.removeAttribute('data-theme');
  }

  function toggle() {
    current = current === 'dark' ? 'light' : 'dark';
    apply(current);
    StorageManager.set('theme', current);
    ToastManager.show(`${current === 'dark' ? '☾ Dark' : '☀ Light'} mode activated`, 'info', 1600);
  }

  function get() { return current; }

  return { init, toggle, get };
})();

/* ============================================================
   SECTION 5: TOAST NOTIFICATION MANAGER
   ============================================================ */

const ToastManager = (() => {
  function show(message, type = 'info', duration = 3000) {
    const region = document.getElementById('toast-region');
    if (!region) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span style="font-size:1.1rem;line-height:1;">${icons[type] || 'ℹ'}</span><span style="font-size:var(--text-sm);color:var(--text-secondary);flex:1;">${message}</span>`;

    region.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.2s reverse forwards';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  return { show };
})();

/* ============================================================
   SECTION 6: MATHJAX RENDERER
   ============================================================ */

const MathRenderer = (() => {
  function render(container) {
    if (!container) return;
    if (window.MathJax) {
      try {
        MathJax.typesetPromise([container]).catch(() => { /* silent */ });
      } catch (e) { /* silent */ }
    }
  }

  function renderAll() {
    if (window.MathJax) {
      try { MathJax.typesetPromise().catch(() => {}); } catch (e) {}
    }
  }

  /** Place LaTeX into a container with $$ delimiters for display math */
  function setDisplay(el, latex) {
    if (!el) return;
    el.innerHTML = `\\[${latex}\\]`;
    render(el);
  }

  /** Place LaTeX into a container with $ delimiters for inline math */
  function setInline(el, latex) {
    if (!el) return;
    el.innerHTML = `\\(${latex}\\)`;
    render(el);
  }

  /** Set HTML content that may contain LaTeX */
  function setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html;
    render(el);
  }

  return { render, renderAll, setDisplay, setInline, setHTML };
})();

/* ============================================================
   SECTION 7: PROBLEM GENERATORS — Core Engine
   ============================================================ */

const Generators = (() => {
  const { randInt, randNonZero, randCoeff, pick, shuffle, randMatrix, randVector,
    matMul, matAdd, scalarMul, transpose, identity,
    det2, det3, det, randInvertible2x2, randInvertible3x3,
    matrixWithEigenvalues2x2, matrixWithEigenvalues3x3,
    rowReduce, rank, fmt, frac, gcd,
    matToLatex, vecToLatex, augToLatex, systemToLatex,
    inv2x2, inv3x3, gramSchmidt, dotProduct, vectorNorm } = MathUtils;

  /* ─────────────────────────────────────────
     TOPIC METADATA
  ───────────────────────────────────────── */
  const TOPIC_META = {
    'systems-of-linear-equations': { name: 'Systems of Linear Equations', week: 1, section: '§1.1, §1.2', desc: 'Solve linear systems using Gaussian elimination and row operations.', concepts: ['Augmented matrix', 'Elementary row operations', 'Consistent / inconsistent', 'Parametric solution form'] },
    'row-reduction': { name: 'Row Reduction', week: 1, section: '§1.2', desc: 'Apply row reduction to reach echelon or reduced echelon form.', concepts: ['Replacement, Interchange, Scaling', 'Forward elimination', 'Back substitution', 'Pivot identification'] },
    'echelon-forms': { name: 'Echelon Forms', week: 1, section: '§1.2', desc: 'Identify and produce echelon and reduced echelon forms of matrices.', concepts: ['Echelon form (REF)', 'Reduced echelon form (RREF)', 'Pivot positions', 'Free variables'] },
    'vector-equations': { name: 'Vector Equations', week: 1, section: '§1.3', desc: 'Express systems as vector equations and determine span membership.', concepts: ['Linear combination', 'Span of vectors', 'Vector equation form', 'Geometric interpretation'] },
    'matrix-equation': { name: 'Matrix Equation Ax=b', week: 1, section: '§1.4', desc: 'Interpret and solve the matrix equation Ax = b.', concepts: ['Matrix-vector product', 'Consistency condition', 'Column perspective', 'Row perspective'] },
    'solution-sets': { name: 'Solution Sets', week: 2, section: '§1.5', desc: 'Describe solution sets of homogeneous and nonhomogeneous systems.', concepts: ['Homogeneous system Ax=0', 'Trivial/non-trivial solutions', 'Parametric vector form', 'Solution structure'] },
    'applications-linear-systems': { name: 'Applications of Linear Systems', week: 2, section: '§1.6', desc: 'Apply linear systems to balance equations and network flows.', concepts: ['Network flow', 'Chemical balance', 'Economic models', 'Traffic flow'] },
    'linear-independence': { name: 'Linear Independence', week: 2, section: '§1.7', desc: 'Test sets of vectors for linear independence or dependence.', concepts: ['Definition of independence', 'Homogeneous system test', 'Geometric interpretation', 'n vectors in ℝⁿ'] },
    'linear-transformations': { name: 'Linear Transformations', week: 3, section: '§1.8, §1.9', desc: 'Analyze and construct linear transformations between vector spaces.', concepts: ['T(u+v) = T(u)+T(v)', 'T(cu) = cT(u)', 'Standard matrix', 'Kernel and image'] },
    'matrix-operations': { name: 'Matrix Operations', week: 3, section: '§2.1', desc: 'Perform matrix arithmetic including multiplication and transposition.', concepts: ['Matrix multiply AB', 'Commutator [A,B]', 'Transpose properties', 'Matrix polynomial f(A)'] },
    'inverse-matrices': { name: 'Inverse Matrices', week: 4, section: '§2.2', desc: 'Compute matrix inverses and apply them to solve systems.', concepts: ['[A|I] → [I|A⁻¹]', 'Existence condition', '2×2 inverse formula', '(AB)⁻¹ = B⁻¹A⁻¹'] },
    'invertibility': { name: 'Invertibility', week: 4, section: '§2.3', desc: 'Apply the Invertible Matrix Theorem to characterize invertible matrices.', concepts: ['IMT equivalences', 'det ≠ 0', 'Full rank condition', 'Trivial null space'] },
    'lu-factorization': { name: 'LU Factorization', week: 4, section: '§2.5', desc: 'Decompose a matrix as A = LU for efficient solving.', concepts: ['L: lower triangular', 'U: upper triangular (REF)', 'Forward substitution', 'Back substitution'] },
    'determinants': { name: 'Determinants', week: 5, section: '§3.1, §3.2', desc: 'Compute determinants and apply their properties.', concepts: ['Cofactor expansion', 'Row reduction method', 'det(AB)=det(A)det(B)', 'Effect of row ops on det'] },
    'cramers-rule': { name: "Cramer's Rule", week: 5, section: '§3.3', desc: "Apply Cramer's Rule to solve square systems with unique solutions.", concepts: ['xᵢ = det(Aᵢ)/det(A)', 'Each Aᵢ replaces column i', 'Requires det(A) ≠ 0', 'Works for any n×n system'] },
    'volumes-linear-transformations': { name: 'Volumes & Transformations', week: 5, section: '§3.3', desc: 'Use determinants to compute areas, volumes, and scaling factors.', concepts: ['Area = |det([v₁,v₂])|', 'Volume = |det([v₁,v₂,v₃])|', '|det(A)| = volume scaling', 'Coplanarity test'] },
    'vector-spaces': { name: 'Vector Spaces', week: 6, section: '§4.1', desc: 'Verify vector space axioms and identify subspaces.', concepts: ['10 vector space axioms', 'Subspace criteria', 'Closure under + and scalar mult.', 'Contains zero vector'] },
    'subspaces': { name: 'Subspaces', week: 6, section: '§4.1', desc: 'Test sets for subspace properties and find their structure.', concepts: ['Subspace test (3 conditions)', 'Subset vs subspace', 'Union/intersection', 'Span as subspace'] },
    'null-space': { name: 'Null Space', week: 6, section: '§4.2', desc: 'Find the null space and its basis for a given matrix.', concepts: ['Nul(A) = {x | Ax = 0}', 'Always a subspace', 'Basis via RREF', 'Nullity = n − rank'] },
    'column-space': { name: 'Column Space', week: 6, section: '§4.2', desc: 'Find the column space and its basis for a given matrix.', concepts: ['Col(A) = span of columns', 'Basis = pivot columns of A', 'dim(Col A) = rank A', 'Range of T(x)=Ax'] },
    'bases': { name: 'Bases', week: 7, section: '§4.3', desc: 'Find bases for various subspaces of vector spaces.', concepts: ['Linearly independent + spanning', 'Unique representation', 'Basis for Nul/Col/Row', 'Extension to basis'] },
    'dimension': { name: 'Dimension', week: 7, section: '§4.5', desc: 'Determine dimensions of vector spaces and subspaces.', concepts: ['dim = # vectors in any basis', 'Dimension of ℝⁿ subspaces', 'dim Nul + dim Col = n', 'Full column rank'] },
    'coordinate-systems': { name: 'Coordinate Systems', week: 7, section: '§4.4', desc: 'Work with coordinate vectors in non-standard bases.', concepts: ['[v]_B coordinate vector', 'Basis ordered set', 'Change-of-coordinates matrix', 'Isomorphism ℝⁿ → V'] },
    'rank': { name: 'Rank', week: 7, section: '§4.6', desc: 'Compute rank and apply the Rank-Nullity Theorem.', concepts: ['rank = dim Col A', 'Rank-Nullity: rank + nullity = n', 'Full rank condition', 'Rank from RREF'] },
    'change-of-basis': { name: 'Change of Basis', week: 8, section: '§4.7', desc: 'Construct and apply change-of-basis matrices.', concepts: ['P = [b₁ b₂ … bₙ]', '[v]_B = P⁻¹v', 'Change-of-coords matrix', 'Similarity transformation'] },
    'eigenvalues': { name: 'Eigenvalues', week: 8, section: '§5.1', desc: 'Find eigenvalues via the characteristic equation.', concepts: ['det(A − λI) = 0', 'Characteristic polynomial', 'Trace and determinant', 'Algebraic multiplicity'] },
    'eigenvectors': { name: 'Eigenvectors', week: 8, section: '§5.1', desc: 'Find eigenvectors and eigenspaces for each eigenvalue.', concepts: ['Av = λv', '(A − λI)v = 0', 'Eigenspace = Nul(A−λI)', 'Geometric multiplicity'] },
    'characteristic-equation': { name: 'Characteristic Equation', week: 8, section: '§5.2', desc: 'Derive and analyze the characteristic polynomial.', concepts: ['p(λ) = det(A−λI)', 'Cayley-Hamilton theorem', 'Trace = sum eigenvalues', 'Det = product eigenvalues'] },
    'diagonalization': { name: 'Diagonalization', week: 9, section: '§5.3', desc: 'Diagonalize matrices and use A = PDP⁻¹.', concepts: ['A = PDP⁻¹', 'Aⁿ = PDⁿP⁻¹', 'Sufficient condition: n independent eigenvectors', 'f(A) via diagonalization'] },
    'eigenvectors-linear-transformations': { name: 'Eigenvectors & Linear Transf.', week: 9, section: '§5.4', desc: 'Connect eigenvectors to linear transformation representations.', concepts: ['Diagonal matrix of T in eigen-basis', 'Matrix of T in basis B', 'Similar matrices', 'Invariant subspaces'] },
    'complex-eigenvalues': { name: 'Complex Eigenvalues', week: 9, section: '§5.5', desc: 'Work with complex eigenvalues and conjugate pairs.', concepts: ['Complex conjugate pairs', 'Rotation-dilation form', 'a±bi eigenvalues', 'Real canonical form'] },
    'gram-schmidt': { name: 'Gram–Schmidt Orthogonalization', week: 9, section: '§6.4', desc: 'Apply Gram–Schmidt to produce orthogonal/orthonormal bases.', concepts: ['Projection formula', 'Orthogonal set', 'Normalize to orthonormal', 'QR factorization'] },
    'orthogonal-complement': { name: 'Orthogonal Complement', week: 9, section: '§6.1', desc: 'Find orthogonal complements of subspaces.', concepts: ['W⊥ = {v | v·w = 0 ∀w∈W}', '(Row A)⊥ = Nul A', '(Col A)⊥ = Nul Aᵀ', 'dim W + dim W⊥ = n'] },
    'final-review-mixed': { name: 'Comprehensive Mixed Review', week: 10, section: '§1–6', desc: 'Mixed problems from all 10 weeks simulating the final exam.', concepts: ['All major topics', 'Exam-style questions', 'Proof and computation', 'Full course integration'] }
  };

  /* ─────────────────────────────────────────
     HELPER: build a problem object
  ───────────────────────────────────────── */
  function makeProblem({ topic, week, difficulty, instruction, parts, solution, theorems, mistakes, related }) {
    return { topic, week, difficulty, instruction, parts, solution, theorems, mistakes: mistakes || [], related: related || [] };
  }

  /* ─────────────────────────────────────────
     WEEK 1 GENERATORS
  ───────────────────────────────────────── */

  function genSystemsOfLinearEquations(difficulty) {
    const d = difficulty || 'intermediate';
    const size = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
    const range = d === 'hard' ? 6 : d === 'easy' ? 3 : 4;

    let A, b, hasSolution = true;
    const r = Math.random();

    if (size === 2) {
      A = randInvertible2x2(range);
      const x0 = randVector(2, 3, false);
      b = [A[0][0]*x0[0]+A[0][1]*x0[1], A[1][0]*x0[0]+A[1][1]*x0[1]];
    } else if (size === 3) {
      A = randInvertible3x3(range);
      const x0 = randVector(3, 3, false);
      b = A.map(row => row.reduce((s, v, j) => s + v*x0[j], 0));
    } else {
      A = randMatrix(3, 4, range);
      b = randVector(3, 4);
    }

    const { rref, pivots } = rowReduce(A.map((row, i) => [...row, b[i]]));
    const latex = augToLatex(A, b);
    const latexSys = systemToLatex(A, b);

    // Build solution
    const solParts = [];
    if (size <= 3 && pivots.length === size) {
      const x = rref.map(row => row[row[0].length - 1] || row[rref[0].length - 1]);
      solParts.push(`Unique solution: $x_1 = ${fmt(rref[0][rref[0].length-1])}$, $x_2 = ${fmt(rref[1][rref[1].length-1])}$` + (size === 3 ? `, $x_3 = ${fmt(rref[2][rref[2].length-1])}$` : ''));
    } else {
      solParts.push('System has free variables — infinitely many solutions. Write in parametric vector form.');
    }

    return makeProblem({
      topic: 'Systems of Linear Equations', week: 1, difficulty,
      instruction: `Solve the following system of linear equations using Gaussian elimination. Reduce the augmented matrix to echelon form and describe the solution set.`,
      parts: [
        { letter: 'a', points: d === 'hard' ? 5 : 4, content: `Write the augmented matrix and reduce to row echelon form (REF):\\[${latex}\\]` },
        { letter: 'b', points: d === 'hard' ? 5 : 4, content: `Continue to reduced row echelon form (RREF) and find the solution.` },
        { letter: 'c', points: 2, content: `State whether the system is consistent or inconsistent, and whether the solution is unique.` }
      ],
      solution: {
        answer: solParts[0],
        steps: [
          { title: 'Write Augmented Matrix', explanation: 'Write the system as an augmented matrix [A|b].', math: `\\[${latex}\\]` },
          { title: 'Forward Elimination', explanation: 'Apply row operations to create zeros below each pivot.', math: `\\[${augToLatex(rref.map(r => r.slice(0,-1)), rref.map(r => r[r.length-1]))}\\]` },
          { title: 'Back Substitution', explanation: 'Continue reducing to RREF and read off the solution.', math: `\\[${solParts[0]}\\]` }
        ]
      },
      theorems: ['Existence and Uniqueness Theorem (§1.2)', 'Row Reduction Algorithm', 'Pivot theorem'],
      mistakes: ['Forgetting to apply row operations to the entire augmented row, including the b-column.', 'Stopping at REF instead of RREF.', 'Sign errors when performing R_i → R_i − k·R_j.'],
      related: ['row-reduction', 'echelon-forms', 'matrix-equation']
    });
  }

  function genRowReduction(difficulty) {
    const d = difficulty || 'intermediate';
    const size = d === 'easy' ? '2x3' : d === 'hard' ? '4x5' : '3x4';
    const [m, n] = size.split('x').map(Number);
    const range = d === 'hard' ? 7 : 4;

    const A = randMatrix(m, n, range);
    // Ensure not all-zero
    while (A.every(row => row.every(v => v === 0))) {
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) A[i][j] = randCoeff(range);
    }
    const { rref, pivots } = rowReduce(A);
    const rk = pivots.length;

    return makeProblem({
      topic: 'Row Reduction', week: 1, difficulty,
      instruction: `Reduce the given matrix to reduced row echelon form (RREF). Identify all pivot positions and determine the rank.`,
      parts: [
        { letter: 'a', points: 5, content: `Find the RREF of:\\[${MathUtils.matToLatex(A)}\\]` },
        { letter: 'b', points: 3, content: `Circle all pivot positions in the RREF.` },
        { letter: 'c', points: 2, content: `State the rank of the matrix.` }
      ],
      solution: {
        answer: `$\\text{rank}(A) = ${rk}$. The RREF is $${MathUtils.matToLatex(rref)}$`,
        steps: [
          { title: 'Identify First Pivot Column', explanation: 'Find the leftmost nonzero column.', math: `\\[${MathUtils.matToLatex(A)}\\]` },
          { title: 'Forward Elimination', explanation: 'Create zeros below each pivot using row operations.', math: `\\[${MathUtils.matToLatex(rref)}\\]` },
          { title: 'Back Substitution to RREF', explanation: 'Scale each pivot row so pivot = 1, eliminate above.', math: `\\[${MathUtils.matToLatex(rref)}\\]` },
          { title: 'Identify Pivots', explanation: `The pivot positions are at columns: ${pivots.map(p => `(${p.row+1},${p.col+1})`).join(', ')}.`, math: `\\[\\text{rank}(A) = ${rk}\\]` }
        ]
      },
      theorems: ['Row Equivalence Theorem', 'Uniqueness of RREF (§1.2)', 'Rank definition'],
      mistakes: ['Performing a row operation on only part of the row.', 'Confusing row operations — must use a pivot row, not an arbitrary row.'],
      related: ['echelon-forms', 'systems-of-linear-equations']
    });
  }

  function genEchelonForms(difficulty) {
    const d = difficulty || 'intermediate';
    const m = d === 'easy' ? 2 : 3, n = d === 'easy' ? 3 : 4;
    const range = d === 'hard' ? 8 : 4;
    const A = randMatrix(m, n, range);
    const { rref, pivots } = rowReduce(A);
    const rk = pivots.length;
    const freeVars = n - rk;

    return makeProblem({
      topic: 'Echelon Forms', week: 1, difficulty,
      instruction: `For the matrix below, find the row echelon form (REF) and reduced row echelon form (RREF). Identify pivot columns and free variables.`,
      parts: [
        { letter: 'a', points: 4, content: `Find a REF of $A = ${MathUtils.matToLatex(A)}$.` },
        { letter: 'b', points: 4, content: `Find the RREF of $A$.` },
        { letter: 'c', points: 2, content: `List the pivot columns and free variable columns.` }
      ],
      solution: {
        answer: `RREF: $${MathUtils.matToLatex(rref)}$. Pivot columns: ${pivots.map(p => p.col+1).join(', ')}. Free variables: ${freeVars > 0 ? 'Yes (' + freeVars + ')' : 'None'}.`,
        steps: [
          { title: 'Start with Original Matrix', math: `\\[${MathUtils.matToLatex(A)}\\]` },
          { title: 'Apply Forward Elimination', explanation: 'Eliminate entries below each pivot.', math: `\\[${MathUtils.matToLatex(rref)}\\]` },
          { title: 'Scale Pivots to 1', explanation: 'Divide each pivot row by its pivot value.' },
          { title: 'Eliminate Above Pivots', explanation: 'Back-eliminate to reach RREF.', math: `\\[${MathUtils.matToLatex(rref)}\\]` }
        ]
      },
      theorems: ['Uniqueness of RREF Theorem', 'Pivot Position definition', 'Consistency from RREF (§1.2)'],
      mistakes: ['REF is NOT unique — only RREF is unique.', 'Missing a pivot by skipping a column.'],
      related: ['row-reduction', 'rank']
    });
  }

  function genVectorEquations(difficulty) {
     const d = difficulty || 'intermediate';
     const n = d === 'easy' ? 2 : 3;
     const range = d === 'hard' ? 6 : 4;
     const numVecs = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;

     const vecs = Array.from({ length: numVecs }, () => randVector(n, range, false));
     const coeffs = Array.from({ length: numVecs }, () => randInt(-3, 3));
     const target = Array.from({ length: n }, (_, i) => vecs.reduce((s, v, j) => s + coeffs[j]*v[i], 0));

     const A = transpose(vecs);
     const augMatrix = A.map((row, i) => [...row, target[i]]);
     const augRREF = rowReduce(augMatrix);

       const vecsLatex = vecs.map(v => `\\mathbf{v}_{${vecs.indexOf(v)+1}} = ${vecToLatex(v)}`).join(', \\quad ');
       const bLatex = vecToLatex(target);
       const coeffStr = coeffs.map((c,i) => `${c >= 0 && i > 0 ? '+' : ''}${c}\\mathbf{v}_{${i+1}}`).join(' ');

    return makeProblem({
      topic: 'Vector Equations', week: 1, difficulty,
      instruction: `Determine whether the vector $\\mathbf{b}$ is in $\\text{Span}\\{\\mathbf{v}_1, \\ldots, \\mathbf{v}_${numVecs}\\}$. If yes, express $\\mathbf{b}$ as a linear combination.`,
      parts: [
        { letter: 'a', points: 3, content: `Given $${vecsLatex}$ and $\\mathbf{b} = ${bLatex}$, set up the vector equation $x_1\\mathbf{v}_1 + \\cdots + x_${numVecs}\\mathbf{v}_${numVecs} = \\mathbf{b}$.` },
        { letter: 'b', points: 5, content: `Solve the corresponding augmented matrix system.` },
        { letter: 'c', points: 2, content: `State whether $\\mathbf{b} \\in \\text{Span}\\{\\mathbf{v}_1, \\ldots, \\mathbf{v}_${numVecs}\\}$.` }
      ],
      solution: {
        answer: `Yes, $\\mathbf{b} = ${coeffStr}$.`,
        steps: [
          { title: 'Set Up Augmented Matrix', explanation: 'Form [v₁ v₂ … vₙ | b] and row reduce.', math: `\\[${augToLatex(transpose(vecs), target)}\\]` },
          { title: 'Row Reduce', explanation: 'Apply RREF to find the coefficients.', math: `\\[${augToLatex(augRREF.rref.map(r=>r.slice(0,-1)), augRREF.rref.map(r=>r[r.length-1]))}\\]` },
          { title: 'Read Off Coefficients', math: `\\[\\mathbf{b} = ${coeffStr}\\]` }
        ]
      },
      theorems: ['Span definition (§1.3)', 'Equivalence: vector eq. ↔ augmented matrix', 'b ∈ Span ↔ augmented system consistent'],
      mistakes: ['Confusing the span test with independence test.', 'Wrong column order in augmented matrix.'],
      related: ['matrix-equation', 'linear-independence', 'systems-of-linear-equations']
    });
  }

  function genMatrixEquation(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const A = d === 'easy' ? randInvertible2x2(4) : randInvertible3x3(3);
    const x0 = randVector(n, 3, false);
    const b = A.map(row => row.reduce((s, v, j) => s + v*x0[j], 0));

    const ALatex = matToLatex(A);
    const bLatex = vecToLatex(b);
    const xLatex = vecToLatex(x0);

    return makeProblem({
      topic: 'Matrix Equation Ax=b', week: 1, difficulty,
      instruction: `Solve the matrix equation $A\\mathbf{x} = \\mathbf{b}$ by row reducing the augmented matrix.`,
      parts: [
        { letter: 'a', points: 4, content: `Write the augmented matrix $[A|\\mathbf{b}]$ where $A = ${ALatex}$, $\\mathbf{b} = ${bLatex}$.` },
        { letter: 'b', points: 5, content: `Row reduce to find the solution $\\mathbf{x}$.` },
        { letter: 'c', points: 1, content: `Verify: compute $A\\mathbf{x}$ and confirm it equals $\\mathbf{b}$.` }
      ],
      solution: {
        answer: `$\\mathbf{x} = ${xLatex}$`,
        steps: [
          { title: 'Form Augmented Matrix', math: `\\[${augToLatex(A, b)}\\]` },
          { title: 'Row Reduce to RREF', math: `\\[${augToLatex(rowReduce(A.map((row,i)=>[...row,b[i]])).rref.map(r=>r.slice(0,-1)), rowReduce(A.map((row,i)=>[...row,b[i]])).rref.map(r=>r[r.length-1]))}\\]` },
          { title: 'Write Solution Vector', math: `\\[\\mathbf{x} = ${xLatex}\\]` },
          { title: 'Verify', math: `\\[A\\mathbf{x} = ${ALatex}${xLatex} = ${bLatex} \\checkmark\\]` }
        ]
      },
      theorems: ['Ax=b ↔ linear combination of columns', 'Consistency ↔ b in Col(A)', 'IMT characterization (§2.3)'],
      mistakes: ['Row reducing only the A part, forgetting the b column.', 'Incorrect matrix-vector multiplication in verification.'],
      related: ['inverse-matrices', 'systems-of-linear-equations']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 2 GENERATORS
  ───────────────────────────────────────── */

  function genSolutionSets(difficulty) {
    const d = difficulty || 'intermediate';
    const m = d === 'easy' ? 2 : 3, n = d === 'hard' ? 4 : 3;
    const range = d === 'hard' ? 6 : 4;
    const A = randMatrix(m, n, range);
    const { rref, pivots } = rowReduce(A);
    const rk = pivots.length;
    const freeVars = n - rk;

    const b = Array.from({ length: m }, () => randInt(-5, 5));
    const augRref = rowReduce(A.map((row,i) => [...row, b[i]]));

    return makeProblem({
      topic: 'Solution Sets', week: 2, difficulty,
      instruction: `Describe the solution set of the system $A\\mathbf{x} = \\mathbf{b}$ in parametric vector form. Then describe the solution set of the associated homogeneous system $A\\mathbf{x} = \\mathbf{0}$.`,
      parts: [
        { letter: 'a', points: 3, content: `Solve the homogeneous system $A\\mathbf{x} = \\mathbf{0}$ where $A = ${MathUtils.matToLatex(A)}$.` },
        { letter: 'b', points: 4, content: `Solve $A\\mathbf{x} = \\mathbf{b}$ where $\\mathbf{b} = ${vecToLatex(b)}$.` },
        { letter: 'c', points: 3, content: `Express the solution in parametric vector form $\\mathbf{x} = \\mathbf{p} + s\\mathbf{u} + t\\mathbf{v} + \\ldots$` }
      ],
      solution: {
        answer: freeVars === 0 ? 'Unique solution (trivial null space).' : `Solution set: $\\mathbf{x} = \\mathbf{p} + $ (${freeVars} free variable(s)).`,
        steps: [
          { title: 'RREF of Homogeneous System', math: `\\[${MathUtils.matToLatex(rref)}\\]` },
          { title: 'Identify Free Variables', explanation: `Free variable columns: ${Array.from({length:n},(_, j)=>j).filter(j=>!pivots.find(p=>p.col===j)).map(j=>`x_{${j+1}}`).join(', ') || 'None'}` },
          { title: 'RREF of [A|b]', math: `\\[${augToLatex(augRref.rref.map(r=>r.slice(0,-1)), augRref.rref.map(r=>r[r.length-1]))}\\]` },
          { title: 'Parametric Vector Form', explanation: 'Express each pivot variable in terms of free variables.', math: '\\[\\mathbf{x} = \\mathbf{p} + c_1\\mathbf{u}_1 + c_2\\mathbf{u}_2 + \\cdots\\]' }
        ]
      },
      theorems: ['Homogeneous System Theorem (§1.5)', 'Parametric vector form', 'Structure of solution set: x = p + Nul(A)'],
      mistakes: ['Forgetting the particular solution p when solving Ax=b.', 'Confusing free and pivot variable roles.'],
      related: ['systems-of-linear-equations', 'null-space']
    });
  }

  function genLinearIndependence(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const numVecs = d === 'hard' ? 4 : 3;
    const range = d === 'hard' ? 6 : 4;

    // Decide: independent or dependent
    const makeIndependent = Math.random() < 0.5;
    let vecs;
    if (makeIndependent && numVecs <= n) {
      // Build independent set
      const A = randInvertible3x3(range);
      vecs = A.slice(0, numVecs);
    } else {
      // Build dependent set: last vector = linear combo of first two
      const v1 = randVector(n, range, false);
      const v2 = randVector(n, range, false);
      const c1 = randInt(-3, 3), c2 = randInt(-3, 3);
      const v3 = v1.map((x, i) => c1*x + c2*v2[i]);
      vecs = [v1, v2, v3];
    }

    const A = transpose(vecs);
    const { rref, pivots } = rowReduce(A);
    const isIndep = pivots.length === vecs.length;

    const vecsLatex = vecs.map((v, i) => `\\mathbf{v}_{${i+1}} = ${vecToLatex(v)}`).join(', \\quad ');

    return makeProblem({
      topic: 'Linear Independence', week: 2, difficulty,
      instruction: `Determine whether the following vectors are linearly independent or linearly dependent. Justify your answer rigorously.`,
      parts: [
        { letter: 'a', points: 3, content: `Let $${vecsLatex}$. Set up the vector equation $c_1\\mathbf{v}_1 + c_2\\mathbf{v}_2 + \\cdots + c_${numVecs}\\mathbf{v}_${numVecs} = \\mathbf{0}$.` },
        { letter: 'b', points: 5, content: `Row reduce the corresponding matrix and determine whether the only solution is the trivial one.` },
        { letter: 'c', points: 2, content: `State your conclusion: are the vectors linearly independent or dependent?` }
      ],
      solution: {
        answer: isIndep ? `Linearly **independent** — the homogeneous system has only the trivial solution.` : `Linearly **dependent** — the homogeneous system has non-trivial solutions.`,
        steps: [
          { title: 'Form the Matrix [v₁ v₂ … vₙ]', math: `\\[${MathUtils.matToLatex(A)}\\]` },
          { title: 'Row Reduce', math: `\\[${MathUtils.matToLatex(rref)}\\]` },
          { title: 'Check Pivot Count', explanation: isIndep ? `All ${numVecs} columns are pivot columns → independent.` : `Some columns lack pivots (free variables exist) → dependent.` },
          { title: 'Conclusion', math: `\\[\\text{Linearly } ${isIndep ? '\\textbf{independent}' : '\\textbf{dependent}'}\\]` }
        ]
      },
      theorems: ['Linear Independence Theorem (§1.7)', 'n vectors in ℝⁿ: independent ↔ det ≠ 0', 'More vectors than dimension → always dependent'],
      mistakes: ['Testing with augmented [v₁…vₙ | b] instead of [v₁…vₙ]', 'Concluding dependence when only checking span membership.'],
      related: ['bases', 'null-space', 'solution-sets']
    });
  }

  function genApplicationsLinearSystems(difficulty) {
    const d = difficulty || 'intermediate';
    // Network flow problem
    const a = randInt(10, 50), b = randInt(10, 50), c = randInt(10, 50);
    const total = a + b + c;
    return makeProblem({
      topic: 'Applications of Linear Systems', week: 2, difficulty,
      instruction: `Model the following network flow problem as a system of linear equations and solve for the unknown flow rates.`,
      parts: [
        { letter: 'a', points: 4, content: `A network has three junctions. Flows in: $f_1 = ${a}$ units enter junction A; $f_2 = ${b}$ units enter junction B. Flows out: $f_3 = ${c}$ units leave junction C. Set up conservation equations at each junction.` },
        { letter: 'b', points: 4, content: `Write the system as a matrix equation and solve using row reduction.` },
        { letter: 'c', points: 2, content: `Interpret your solution physically. Are there free variables? What do they represent?` }
      ],
      solution: {
        answer: `The system has a free variable representing the undetermined internal flow; express other flows in terms of it.`,
        steps: [
          { title: 'Conservation Equations', explanation: 'At each junction: flow in = flow out.', math: `\\[\\begin{cases} f_1 + f_4 = f_2 + f_5 \\\\ f_2 + f_5 = f_3 + f_6 \\\\ f_3 + f_6 = f_1 + f_4 \\end{cases}\\]` },
          { title: 'Matrix Form', math: `\\[\\begin{pmatrix} 1 & -1 & 1 \\\\ 0 & 1 & -1 \\\\ -1 & 0 & 0 \\end{pmatrix} \\mathbf{f} = \\begin{pmatrix} ${a} \\\\ ${b} \\\\ ${c} \\end{pmatrix}\\]` },
          { title: 'Solve and Interpret', explanation: 'Free variable = internal loop flow, can be chosen to satisfy non-negativity constraints.' }
        ]
      },
      theorems: ['Kirchhoff\'s Current Law ↔ linear system', 'Consistency ↔ flow conservation globally'],
      mistakes: ['Wrong sign convention for flows in vs. out.', 'Not checking that flows remain non-negative.'],
      related: ['systems-of-linear-equations', 'solution-sets']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 3 GENERATORS
  ───────────────────────────────────────── */

  function genLinearTransformations(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = d === 'hard' ? 5 : 3;
    const A = randMatrix(n, n, range);

    // Random vector to transform
    const x = randVector(n, 4, false);
    const Tx = A.map(row => row.reduce((s, v, j) => s + v*x[j], 0));

    const ALatex = matToLatex(A);
    const xLatex = vecToLatex(x);
    const TxLatex = vecToLatex(Tx);

    return makeProblem({
      topic: 'Linear Transformations', week: 3, difficulty,
      instruction: `The linear transformation $T: \\mathbb{R}^${n} \\to \\mathbb{R}^${n}$ is defined by $T(\\mathbf{x}) = A\\mathbf{x}$ where $A = ${ALatex}$.`,
      parts: [
        { letter: 'a', points: 3, content: `Compute $T(\\mathbf{x})$ for $\\mathbf{x} = ${xLatex}$.` },
        { letter: 'b', points: 3, content: `Find $T(\\mathbf{e}_1)$, $T(\\mathbf{e}_2)$${n===3 ? `, $T(\\mathbf{e}_3)$` : ''}. What is the relationship to the columns of $A$?` },
        { letter: 'c', points: 4, content: `Is $T$ one-to-one? Is $T$ onto? Justify using properties of $A$.` }
      ],
      solution: {
        answer: `$T(\\mathbf{x}) = ${TxLatex}$.`,
        steps: [
          { title: 'Compute T(x)', math: `\\[T(\\mathbf{x}) = ${ALatex} ${xLatex} = ${TxLatex}\\]` },
          { title: 'Standard Basis Images', explanation: 'T(eᵢ) = i-th column of A.', math: `\\[T(\\mathbf{e}_1) = \\text{col}_1(A), \\quad T(\\mathbf{e}_2) = \\text{col}_2(A), \\ldots\\]` },
          { title: 'One-to-One / Onto', explanation: `T is one-to-one ↔ Nul(A) = {0} ↔ rank(A) = ${n}. T is onto ↔ Col(A) = ℝ^${n} ↔ rank(A) = ${n}.`, math: `\\[\\text{rank}(A) = ${rank(A)},\\quad \\text{nullity}(A) = ${n - rank(A)}\\]` }
        ]
      },
      theorems: ['Standard matrix theorem (§1.8)', 'T one-to-one ↔ columns of A independent', 'T onto ↔ columns of A span ℝᵐ'],
      mistakes: ['Confusing one-to-one (injective) with onto (surjective).', 'Forgetting that the standard matrix columns are T(e₁), T(e₂), ...'],
      related: ['matrix-operations', 'null-space', 'column-space']
    });
  }

  function genMatrixOperations(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = d === 'hard' ? 5 : 3;
    const A = randMatrix(n, n, range);
    const B = randMatrix(n, n, range);
    const AB = MathUtils.matMul(A, B);
    const BA = MathUtils.matMul(B, A);
    const comm = MathUtils.matAdd(AB, MathUtils.scalarMul(-1, BA));

    // Matrix polynomial f(A) = A^2 - 3A + 2I
    const a2 = MathUtils.matMul(A, A);
    const fA = MathUtils.matAdd(MathUtils.matAdd(a2, MathUtils.scalarMul(-3, A)), MathUtils.scalarMul(2, MathUtils.identity(n)));

    return makeProblem({
      topic: 'Matrix Operations', week: 3, difficulty,
      instruction: `Given matrices $A = ${matToLatex(A)}$ and $B = ${matToLatex(B)}$, perform the following operations.`,
      parts: [
        { letter: 'a', points: 4, content: `Compute $AB$ and $BA$. Is $AB = BA$?` },
        { letter: 'b', points: 3, content: `Compute the commutator $[A, B] = AB - BA$.` },
        { letter: 'c', points: 3, content: `Compute $f(A) = A^2 - 3A + 2I$ where $I$ is the identity matrix.` }
      ],
      solution: {
        answer: `$AB = ${matToLatex(AB)}$, $[A,B] = ${matToLatex(comm)}$, $f(A) = ${matToLatex(fA)}$.`,
        steps: [
          { title: 'Compute AB', math: `\\[AB = ${matToLatex(A)} ${matToLatex(B)} = ${matToLatex(AB)}\\]` },
          { title: 'Compute BA', math: `\\[BA = ${matToLatex(B)} ${matToLatex(A)} = ${matToLatex(BA)}\\]` },
          { title: 'Commutator', math: `\\[[A,B] = AB - BA = ${matToLatex(comm)}\\]` },
          { title: 'Matrix Polynomial', math: `\\[f(A) = A^2 - 3A + 2I = ${matToLatex(fA)}\\]` }
        ]
      },
      theorems: ['Matrix multiplication: not commutative in general', 'Transpose properties (AB)ᵀ = BᵀAᵀ', 'Cayley-Hamilton: A satisfies its own char. polynomial'],
      mistakes: ['Assuming AB = BA.', 'Forgetting to include the scalar multiple of the identity in f(A).'],
      related: ['inverse-matrices', 'linear-transformations']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 4 GENERATORS
  ───────────────────────────────────────── */

  function genInverseMatrices(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const A = d === 'easy' ? randInvertible2x2(4) : randInvertible3x3(3);
    const Ainv = n === 2 ? inv2x2(A) : inv3x3(A);
    const b = randVector(n, 5, false);
    // Solution via inverse: x = A^{-1} b
    const x = Ainv ? Ainv.map(row => row.reduce((s, v, j) => s + v*b[j], 0)) : null;

    return makeProblem({
      topic: 'Inverse Matrices', week: 4, difficulty,
      instruction: `Find the inverse of matrix $A$ using row reduction on the augmented matrix $[A \\mid I]$. Then use $A^{-1}$ to solve $A\\mathbf{x} = \\mathbf{b}$.`,
      parts: [
        { letter: 'a', points: 5, content: `Find $A^{-1}$ for $A = ${matToLatex(A)}$ by row reducing $[A \\mid I_${n}]$.` },
        { letter: 'b', points: 3, content: `Use $A^{-1}$ to solve $A\\mathbf{x} = \\mathbf{b}$ where $\\mathbf{b} = ${vecToLatex(b)}$.` },
        { letter: 'c', points: 2, content: `Verify: compute $AA^{-1}$ and $A^{-1}A$ and confirm both equal $I_${n}$.` }
      ],
      solution: {
        answer: Ainv ? `$A^{-1} = ${matToLatex(Ainv.map(r => r.map(v => Math.round(v*1000)/1000)))}$` : 'A is singular (no inverse).',
        steps: [
          { title: 'Set Up [A|I]', math: `\\[${augToLatex(A, identity(n).map((row,i)=>row))}\\]` },
          { title: 'Row Reduce to [I|A⁻¹]', explanation: 'Apply the same row operations to both sides.', math: Ainv ? `\\[A^{-1} = ${matToLatex(Ainv.map(r => r.map(v => Math.round(v*100)/100)))}\\]` : '\\[\\text{Singular matrix — no inverse}\\]' },
          { title: 'Solve Ax=b', math: x ? `\\[\\mathbf{x} = A^{-1}\\mathbf{b} = ${vecToLatex(x.map(v=>Math.round(v*100)/100))}\\]` : '\\[\\text{No unique solution}\\]' },
          { title: 'Verify', math: `\\[AA^{-1} = I_${n} \\checkmark\\]` }
        ]
      },
      theorems: ['Inverse via [A|I] row reduction (§2.2)', '(AB)⁻¹ = B⁻¹A⁻¹', 'Inverse ↔ det(A) ≠ 0'],
      mistakes: ['Only applying row operations to A, not to the appended identity.', '2×2 formula error: swap a,d and negate b,c.'],
      related: ['invertibility', 'lu-factorization', 'determinants']
    });
  }

  function genInvertibility(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    // 50/50 invertible vs singular
    const makeInvertible = Math.random() < 0.5;
    const A = makeInvertible ? (n===2 ? randInvertible2x2(4) : randInvertible3x3(3)) : randMatrix(n, n, 3);
    // Force singularity: make row 3 = row1 + row2
    const B = [...A];
    if (!makeInvertible && n === 3) {
      B[2] = B[0].map((v,j) => v + B[1][j]);
    }
    const d_val = n === 2 ? det2(B) : det3(B);
    const isInv = Math.abs(d_val) > 0.001;
    const { pivots } = rowReduce(B);
    const rk = pivots.length;

    return makeProblem({
      topic: 'Invertibility', week: 4, difficulty,
      instruction: `Apply the Invertible Matrix Theorem (IMT) to determine whether $A$ is invertible. Justify using at least two equivalent conditions from the IMT.`,
      parts: [
        { letter: 'a', points: 3, content: `Compute $\\det(A)$ for $A = ${matToLatex(B)}$.` },
        { letter: 'b', points: 4, content: `Find the rank of $A$ and determine whether the columns are linearly independent.` },
        { letter: 'c', points: 3, content: `State the conclusion using two IMT conditions. Is $A$ invertible?` }
      ],
      solution: {
        answer: isInv ? '$A$ is **invertible** (all IMT conditions hold).' : '$A$ is **singular/not invertible** (IMT conditions fail).',
        steps: [
          { title: 'Compute det(A)', math: `\\[\\det(A) = ${fmt(d_val)}\\]` },
          { title: 'Compute Rank', math: `\\[\\text{rank}(A) = ${rk}\\]` },
          { title: 'IMT Conclusion', explanation: isInv ? 'det ≠ 0, rank = n → A invertible by IMT.' : 'det = 0, rank < n → A is singular by IMT.', math: `\\[\\text{IMT: } A \\text{ is } ${isInv ? '\\textbf{invertible}' : '\\textbf{singular}'}\\]` }
        ]
      },
      theorems: ['Invertible Matrix Theorem (§2.3) — 12 equivalent conditions', 'det(A) = 0 ↔ singular', 'rank(A) < n ↔ not invertible'],
      mistakes: ['Checking only det = 0 without verifying rank.', 'Confusing "A is not invertible" with "no solutions to Ax=b".'],
      related: ['inverse-matrices', 'determinants', 'rank']
    });
  }

  function genLUFactorization(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const A = d === 'easy' ? randMatrix(2, 2, 4) : randMatrix(3, 3, 3);
    // Build L, U manually: row reduce A and track multipliers
    // Simple version: just present the problem
    const b = randVector(n, 5, false);

    return makeProblem({
      topic: 'LU Factorization', week: 4, difficulty,
      instruction: `Find the LU factorization $A = LU$ of the given matrix, where $L$ is lower triangular with 1s on the diagonal and $U$ is in row echelon form. Then use it to solve $A\\mathbf{x} = \\mathbf{b}$.`,
      parts: [
        { letter: 'a', points: 5, content: `Find $L$ and $U$ such that $A = LU$ for $A = ${matToLatex(A)}$.` },
        { letter: 'b', points: 3, content: `Solve $L\\mathbf{y} = \\mathbf{b}$ (forward substitution) for $\\mathbf{b} = ${vecToLatex(b)}$.` },
        { letter: 'c', points: 2, content: `Solve $U\\mathbf{x} = \\mathbf{y}$ (back substitution) to obtain $\\mathbf{x}$.` }
      ],
      solution: {
        answer: 'Use forward substitution on Ly=b, then back substitution on Ux=y.',
        steps: [
          { title: 'Forward Elimination', explanation: 'Record multipliers ℓᵢⱼ = aᵢⱼ/aⱼⱼ in L.', math: `\\[A = ${matToLatex(A)}\\]` },
          { title: 'Build L and U', math: `\\[L = \\begin{pmatrix} 1 & 0 & 0 \\\\ \\ell_{21} & 1 & 0 \\\\ \\ell_{31} & \\ell_{32} & 1 \\end{pmatrix}, \\quad U = \\text{(REF of A)}\\]` },
          { title: 'Forward Substitution', math: `\\[L\\mathbf{y} = \\mathbf{b} \\implies \\mathbf{y} = \\ldots\\]` },
          { title: 'Back Substitution', math: `\\[U\\mathbf{x} = \\mathbf{y} \\implies \\mathbf{x} = \\ldots\\]` }
        ]
      },
      theorems: ['LU Factorization existence (§2.5)', 'Forward substitution complexity O(n²)', 'Advantage: solve many Ax=b with one factorization'],
      mistakes: ['Forgetting to negate the multiplier signs when building L.', 'Confusing L and U roles.'],
      related: ['row-reduction', 'inverse-matrices']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 5 GENERATORS
  ───────────────────────────────────────── */

  function genDeterminants(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
    const range = d === 'hard' ? 5 : 4;
    const A = randMatrix(n, n, range);
    const dA = det(A);

    let cofactorLatex = '';
    if (n === 3) {
      const [[a, b, c], [dd, e, f], [g, h, k]] = A;
      cofactorLatex = `\\det(A) = ${a}\\begin{vmatrix} ${e} & ${f} \\\\ ${h} & ${k} \\end{vmatrix} - ${b}\\begin{vmatrix} ${dd} & ${f} \\\\ ${g} & ${k} \\end{vmatrix} + ${c}\\begin{vmatrix} ${dd} & ${e} \\\\ ${g} & ${h} \\end{vmatrix}`;
    }

    return makeProblem({
      topic: 'Determinants', week: 5, difficulty,
      instruction: `Compute $\\det(A)$ using cofactor expansion along the first row (or the row/column with the most zeros). Show all intermediate steps.`,
      parts: [
        { letter: 'a', points: 5, content: `Compute $\\det(A)$ where $A = ${matToLatex(A, 'vmatrix')}$.` },
        { letter: 'b', points: 3, content: `Use row operations to verify: reduce $A$ to upper triangular form and compute $\\det$ as the product of diagonal entries (accounting for row swaps and scalings).` },
        { letter: 'c', points: 2, content: `State what $\\det(A) = ${fmt(dA)}$ implies about the invertibility of $A$.` }
      ],
      solution: {
        answer: `$\\det(A) = ${fmt(dA)}$. ${Math.abs(dA) > 0.001 ? 'A is invertible.' : 'A is singular.'}`,
        steps: [
          { title: 'Cofactor Expansion Along Row 1', math: n === 3 ? `\\[${cofactorLatex}\\]` : `\\[\\det(A) = ${matToLatex(A, 'vmatrix')} = ${fmt(dA)}\\]` },
          { title: 'Compute 2×2 Minors', math: n === 3 ? `\\[\\det(A) = ${A[0][0]}(${A[1][1]*A[2][2]-A[1][2]*A[2][1]}) - ${A[0][1]}(${A[1][0]*A[2][2]-A[1][2]*A[2][0]}) + ${A[0][2]}(${A[1][0]*A[2][1]-A[1][1]*A[2][0]}) = ${fmt(dA)}\\]` : `\\[\\det = ${fmt(dA)}\\]` },
          { title: 'Conclusion', math: `\\[\\det(A) = ${fmt(dA)} ${Math.abs(dA)>0.001 ? '\\neq 0 \\implies A \\text{ is invertible}' : '= 0 \\implies A \\text{ is singular}'}\\]` }
        ]
      },
      theorems: ['Cofactor expansion theorem (§3.1)', 'det(AB) = det(A)det(B)', 'Row ops effect: Rᵢ←Rᵢ−kRⱼ preserves det; swap changes sign; scale multiplies det'],
      mistakes: ['Wrong sign pattern for cofactors: + - + / - + - / + - +', 'Forgetting to account for row swaps when computing det via REF.'],
      related: ['cramers-rule', 'invertibility', 'volumes-linear-transformations']
    });
  }

  function genCramersRule(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const A = d === 'easy' ? randInvertible2x2(4) : randInvertible3x3(3);
    const x0 = randVector(n, 3, false);
    const b = A.map(row => row.reduce((s, v, j) => s + v*x0[j], 0));
    const dA = n === 2 ? det2(A) : det3(A);

    // Build Aᵢ matrices
    const Ai = Array.from({ length: n }, (_, k) =>
      A.map((row, i) => row.map((v, j) => j === k ? b[i] : v))
    );
    const dets = Ai.map(M => n === 2 ? det2(M) : det3(M));
    const xi = dets.map(d => d / dA);

    return makeProblem({
      topic: "Cramer's Rule", week: 5, difficulty,
      instruction: `Use Cramer's Rule to solve the system $A\\mathbf{x} = \\mathbf{b}$.`,
      parts: [
        { letter: 'a', points: 2, content: `Compute $\\det(A)$ for $A = ${matToLatex(A)}$.` },
        { letter: 'b', points: 5, content: `For each $i$, form $A_i$ (replace column $i$ of $A$ with $\\mathbf{b} = ${vecToLatex(b)}$) and compute $\\det(A_i)$.` },
        { letter: 'c', points: 3, content: `Apply Cramer's Rule: $x_i = \\dfrac{\\det(A_i)}{\\det(A)}$ for each $i$.` }
      ],
      solution: {
        answer: `$\\mathbf{x} = ${vecToLatex(xi.map(v => Math.round(v*100)/100))}$`,
        steps: [
          { title: 'Compute det(A)', math: `\\[\\det(A) = ${fmt(dA)}\\]` },
          ...Ai.map((M, k) => ({ title: `Compute det(A_${k+1})`, math: `\\[\\det(A_${k+1}) = ${fmt(dets[k])}\\]`, explanation: `Replace column ${k+1} with b.` })),
          { title: "Apply Cramer's Rule", math: `\\[${xi.map((v, k) => `x_${k+1} = \\frac{${fmt(dets[k])}}{${fmt(dA)}} = ${fmt(Math.round(v*100)/100)}`).join(', \\quad ')}\\]` }
        ]
      },
      theorems: ["Cramer's Rule (§3.3): xᵢ = det(Aᵢ)/det(A)", 'Requires det(A) ≠ 0', 'Useful for symbolic analysis, less efficient than row reduction for large n'],
      mistakes: ["Replacing the wrong column when building Aᵢ.", "Forgetting to check det(A) ≠ 0 first."],
      related: ['determinants', 'inverse-matrices', 'systems-of-linear-equations']
    });
  }

  function genVolumes(difficulty) {
    const d = difficulty || 'intermediate';
    const range = d === 'hard' ? 6 : 4;
    const v1 = randVector(3, range, false);
    const v2 = randVector(3, range, false);
    const v3 = randVector(3, range, false);
    const A = [v1, v2, v3];
    const volume = Math.abs(det3(A));
    const area2d = (() => {
      const a = randVector(2, range, false);
      const b = randVector(2, range, false);
      return { a, b, area: Math.abs(det2([a, b])) };
    })();

    return makeProblem({
      topic: 'Volumes & Transformations', week: 5, difficulty,
      instruction: `Use determinants to compute areas and volumes defined by vectors.`,
      parts: [
        { letter: 'a', points: 3, content: `Find the area of the parallelogram spanned by $\\mathbf{a} = ${vecToLatex(area2d.a)}$ and $\\mathbf{b} = ${vecToLatex(area2d.b)}$ in $\\mathbb{R}^2$.` },
        { letter: 'b', points: 4, content: `Find the volume of the parallelepiped spanned by $\\mathbf{v}_1 = ${vecToLatex(v1)}$, $\\mathbf{v}_2 = ${vecToLatex(v2)}$, $\\mathbf{v}_3 = ${vecToLatex(v3)}$.` },
        { letter: 'c', points: 3, content: `If $T(\\mathbf{x}) = A\\mathbf{x}$ scales all volumes by $|\\det(A)|$, what is the volume of the image of a unit cube under $T$?` }
      ],
      solution: {
        answer: `Area = $${fmt(area2d.area)}$; Volume = $${fmt(volume)}$; Volume of image = $|\\det(A)| = ${fmt(volume)}$.`,
        steps: [
          { title: 'Area of Parallelogram', math: `\\[\\text{Area} = \\left|\\det\\begin{pmatrix} ${area2d.a[0]} & ${area2d.b[0]} \\\\ ${area2d.a[1]} & ${area2d.b[1]} \\end{pmatrix}\\right| = ${fmt(area2d.area)}\\]` },
          { title: 'Volume of Parallelepiped', math: `\\[\\text{Vol} = |\\det(A)| = \\left|${matToLatex(A, 'vmatrix')}\\right| = ${fmt(volume)}\\]` },
          { title: 'Volume Scaling', math: `\\[\\text{Vol}(T(S)) = |\\det(A)| \\cdot \\text{Vol}(S) = ${fmt(volume)} \\cdot 1 = ${fmt(volume)}\\]` }
        ]
      },
      theorems: ['Area = |det([v₁ v₂])| in ℝ² (§3.3)', 'Volume = |det([v₁ v₂ v₃])| in ℝ³', 'Volume scaling theorem: |det(A)|'],
      mistakes: ['Forgetting the absolute value — volume/area must be non-negative.', 'Using row vectors instead of column vectors.'],
      related: ['determinants', 'linear-transformations']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 6 GENERATORS
  ───────────────────────────────────────── */

  function genVectorSpaces(difficulty) {
    const d = difficulty || 'intermediate';
    // Subspace test for a set defined by linear constraint
    const scenarios = [
      { set: `W = \\{(x_1, x_2, x_3) \\in \\mathbb{R}^3 : x_1 + 2x_2 - x_3 = 0\\}`, isSubspace: true, reason: 'homogeneous equation — passes all 3 tests' },
      { set: `W = \\{(x_1, x_2) \\in \\mathbb{R}^2 : x_1 x_2 = 0\\}`, isSubspace: false, reason: 'not closed under addition: (1,0)+(0,1) = (1,1) ∉ W' },
      { set: `W = \\{(x_1, x_2, x_3) \\in \\mathbb{R}^3 : x_1^2 + x_2^2 + x_3^2 = 1\\}`, isSubspace: false, reason: 'does not contain zero vector' },
      { set: `W = \\{A \\in M_{2\\times 2} : \\text{tr}(A) = 0\\}`, isSubspace: true, reason: 'trace is linear — closed under + and scalar mult.' }
    ];
    const sc = pick(scenarios);

    return makeProblem({
      topic: 'Vector Spaces', week: 6, difficulty,
      instruction: `Determine whether the given set $W$ is a subspace of the indicated vector space. Apply the three-step subspace test.`,
      parts: [
        { letter: 'a', points: 2, content: `Is $\\mathbf{0} \\in W$? Verify or disprove for $${sc.set}$.` },
        { letter: 'b', points: 4, content: `Is $W$ closed under vector addition? If $\\mathbf{u}, \\mathbf{v} \\in W$, must $\\mathbf{u} + \\mathbf{v} \\in W$?` },
        { letter: 'c', points: 4, content: `Is $W$ closed under scalar multiplication? If $\\mathbf{u} \\in W$ and $c \\in \\mathbb{R}$, must $c\\mathbf{u} \\in W$?` }
      ],
      solution: {
        answer: sc.isSubspace ? `$W$ **is** a subspace. Reason: ${sc.reason}.` : `$W$ is **not** a subspace. Reason: ${sc.reason}.`,
        steps: [
          { title: 'Check Zero Vector', explanation: sc.isSubspace ? '0 satisfies the defining equation.' : '0 may not be in W.' },
          { title: 'Check Closure Under Addition', explanation: sc.isSubspace ? 'u,v ∈ W → u+v also satisfies equation by linearity.' : 'Counterexample demonstrates failure.' },
          { title: 'Check Closure Under Scalar Multiplication', explanation: sc.isSubspace ? 'cu satisfies the equation when u does.' : 'Scalar mult may fail.' },
          { title: 'Conclusion', math: `\\[W \\text{ is } ${sc.isSubspace ? '' : '\\textbf{not }'} \\text{a subspace.}\\]` }
        ]
      },
      theorems: ['Three-step subspace test (§4.1)', 'Any subspace must contain 0', 'Span of vectors is always a subspace'],
      mistakes: ['Testing only closure under addition, missing zero or scalar mult.', 'Confusing "defined by a set of vectors" vs "defined by an equation".'],
      related: ['null-space', 'column-space', 'bases']
    });
  }

  function genNullSpace(difficulty) {
    const d = difficulty || 'intermediate';
    const m = d === 'easy' ? 2 : 3, n = d === 'hard' ? 5 : d === 'easy' ? 3 : 4;
    const range = d === 'hard' ? 5 : 3;
    const A = randMatrix(m, n, range);
    const { rref, pivots } = rowReduce(A);
    const rk = pivots.length;
    const nullity = n - rk;

    return makeProblem({
      topic: 'Null Space', week: 6, difficulty,
      instruction: `Find a basis for the null space $\\text{Nul}(A)$ and state its dimension (nullity).`,
      parts: [
        { letter: 'a', points: 4, content: `Solve $A\\mathbf{x} = \\mathbf{0}$ for $A = ${matToLatex(A)}$ by finding the RREF.` },
        { letter: 'b', points: 4, content: `Express the solution in parametric vector form and identify the basis vectors of $\\text{Nul}(A)$.` },
        { letter: 'c', points: 2, content: `State $\\dim(\\text{Nul}(A))$ (nullity) and verify the Rank-Nullity Theorem.` }
      ],
      solution: {
        answer: `$\\text{nullity}(A) = ${nullity}$, $\\text{rank}(A) = ${rk}$.`,
        steps: [
          { title: 'RREF of A', math: `\\[${matToLatex(rref)}\\]` },
          { title: 'Identify Free Variables', explanation: `Free variable columns: ${Array.from({length:n},(_, j)=>j).filter(j=>!pivots.find(p=>p.col===j)).map(j=>`x_{${j+1}}`).join(', ') || 'None (trivial null space)'}` },
          { title: 'Parametric Form', explanation: 'Express pivot variables in terms of free variables.', math: `\\[\\mathbf{x} = c_1\\mathbf{u}_1 + \\cdots + c_{${nullity}}\\mathbf{u}_{${nullity}}\\]` },
          { title: 'Rank-Nullity Check', math: `\\[\\text{rank}(A) + \\text{nullity}(A) = ${rk} + ${nullity} = ${n} = n \\checkmark\\]` }
        ]
      },
      theorems: ['Null space is a subspace (§4.2)', 'Basis of Nul(A) from RREF free variable columns', 'Rank-Nullity Theorem: rank + nullity = n'],
      mistakes: ['Augmenting with b instead of 0 for null space.', 'Forgetting to express pivot variables as functions of free variables.'],
      related: ['column-space', 'rank', 'solution-sets']
    });
  }

  function genColumnSpace(difficulty) {
    const d = difficulty || 'intermediate';
    const m = d === 'easy' ? 2 : 3, n = d === 'hard' ? 5 : 3;
    const range = 3;
    const A = randMatrix(m, n, range);
    const { rref, pivots } = rowReduce(A);
    const pivotCols = pivots.map(p => p.col);
    const basis = pivotCols.map(j => A.map(row => row[j]));
    const rk = pivots.length;

    return makeProblem({
      topic: 'Column Space', week: 6, difficulty,
      instruction: `Find a basis for the column space $\\text{Col}(A)$ and state its dimension.`,
      parts: [
        { letter: 'a', points: 3, content: `Row reduce $A = ${matToLatex(A)}$ to RREF. Identify the pivot columns.` },
        { letter: 'b', points: 4, content: `The basis for $\\text{Col}(A)$ consists of the pivot columns of the **original** matrix $A$. List them.` },
        { letter: 'c', points: 3, content: `State $\\dim(\\text{Col}(A))$ and explain its relationship to rank.` }
      ],
      solution: {
        answer: `Basis for $\\text{Col}(A)$: $\\{${basis.map((v,i) => `\\mathbf{a}_{${pivotCols[i]+1}}`).join(', ')}\\}$. $\\dim(\\text{Col}(A)) = \\text{rank}(A) = ${rk}$.`,
        steps: [
          { title: 'RREF of A', math: `\\[${matToLatex(rref)}\\]` },
          { title: 'Pivot Columns', explanation: `Pivot positions at columns: ${pivotCols.map(j=>j+1).join(', ')}.` },
          { title: 'Basis from Original A', explanation: 'Use the pivot column indices to extract columns from original A.', math: `\\[\\text{Basis} = \\left\\{ ${basis.map(v=>vecToLatex(v)).join(', ')} \\right\\}\\]` },
          { title: 'Dimension', math: `\\[\\dim(\\text{Col}(A)) = \\text{rank}(A) = ${rk}\\]` }
        ]
      },
      theorems: ['Col(A) = span of columns (§4.2)', 'Basis = pivot columns of ORIGINAL A', 'dim(Col A) = rank A'],
      mistakes: ['Taking pivot columns from the RREF, not the original matrix.', 'Confusing Col(A) with Row(A).'],
      related: ['null-space', 'rank', 'bases']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 7 GENERATORS
  ───────────────────────────────────────── */

  function genBases(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = 3;
    const m = n, numVecs = d === 'hard' ? 4 : 3;

    // Build a set containing a basis + linear combination
    const A = n === 2 ? randInvertible2x2(range) : randInvertible3x3(range);
    const basis = A.map((row, i) => A.map(r => r[i])).slice(0, n); // columns
    const extra = basis[0].map((v, i) => basis[0][i] + basis[1][i]); // sum of first two = linearly dependent
    const vecs = [...basis, extra];

    return makeProblem({
      topic: 'Bases', week: 7, difficulty,
      instruction: `Determine whether the given set of vectors forms a basis for $\\mathbb{R}^${n}$. If not, find a maximal linearly independent subset.`,
      parts: [
        { letter: 'a', points: 3, content: `Test vectors $${vecs.map((v,i)=>`\\mathbf{v}_{${i+1}}=${vecToLatex(v)}`).join(', ')}$ for linear independence.` },
        { letter: 'b', points: 4, content: `If the set is dependent, identify a redundant vector and remove it to obtain a basis.` },
        { letter: 'c', points: 3, content: `Verify your basis by showing the remaining vectors span $\\mathbb{R}^${n}$ and are independent.` }
      ],
      solution: {
        answer: `$\\{\\mathbf{v}_1, \\mathbf{v}_2${n===3?', \\mathbf{v}_3':''}\\}$ forms a basis after removing the redundant vector $\\mathbf{v}_{${numVecs}}$.`,
        steps: [
          { title: 'Form Matrix and Row Reduce', math: `\\[${matToLatex(transpose(vecs))}\\]` },
          { title: 'Identify Dependent Vector', explanation: 'Non-pivot columns correspond to redundant vectors.' },
          { title: 'Basis Verification', math: `\\[\\det(\\text{basis matrix}) \\neq 0 \\implies \\text{basis for } \\mathbb{R}^${n}\\]` }
        ]
      },
      theorems: ['Basis = independent + spanning (§4.3)', 'Any n independent vectors in ℝⁿ form a basis', 'Basis Theorem: all bases have same number of vectors'],
      mistakes: ['Assuming any n vectors form a basis — must verify independence.', 'Confusing a spanning set with a basis.'],
      related: ['dimension', 'rank', 'coordinate-systems']
    });
  }

  function genDimension(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'hard' ? 4 : 3;
    const range = 3;
    const A = randMatrix(3, n, range);
    const { rref, pivots } = rowReduce(A);
    const rk = pivots.length;
    const nullity = n - rk;

    return makeProblem({
      topic: 'Dimension', week: 7, difficulty,
      instruction: `Determine the dimensions of the four fundamental subspaces associated with $A$.`,
      parts: [
        { letter: 'a', points: 3, content: `Find $\\text{rank}(A)$ and $\\dim(\\text{Col}(A))$ for $A = ${matToLatex(A)}$.` },
        { letter: 'b', points: 3, content: `Find $\\text{nullity}(A) = \\dim(\\text{Nul}(A))$.` },
        { letter: 'c', points: 4, content: `Verify the Rank-Nullity Theorem: $\\text{rank}(A) + \\text{nullity}(A) = n$.` }
      ],
      solution: {
        answer: `$\\text{rank} = ${rk}$, $\\text{nullity} = ${nullity}$, $\\text{rank} + \\text{nullity} = ${n}$.`,
        steps: [
          { title: 'RREF and Rank', math: `\\[\\text{RREF}(A) = ${matToLatex(rref)}, \\quad \\text{rank}(A) = ${rk}\\]` },
          { title: 'Nullity', math: `\\[\\text{nullity}(A) = n - \\text{rank}(A) = ${n} - ${rk} = ${nullity}\\]` },
          { title: 'Rank-Nullity Verification', math: `\\[${rk} + ${nullity} = ${n} \\checkmark\\]` }
        ]
      },
      theorems: ['Rank-Nullity Theorem (§4.6)', 'dim(Col A) = dim(Row A) = rank A', 'For square n×n: full rank ↔ invertible'],
      mistakes: ['Confusing number of pivot columns with dimension of null space.'],
      related: ['rank', 'null-space', 'column-space']
    });
  }

  function genCoordinateSystems(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = 3;

    // Build a basis B
    const B = n === 2 ? [randVector(2, range, false), randVector(2, range, false)] : [randVector(3, range, false), randVector(3, range, false), randVector(3, range, false)];
    // Choose coordinates
    const c = randVector(n, 3, false);
    // Compute v = c[0]*B[0] + ... in standard coords
    const v = Array.from({length:n}, (_, i) => B.reduce((s, bv, j) => s + c[j]*bv[i], 0));

    const PLatex = matToLatex(transpose(B));
    const vLatex = vecToLatex(v);
    const cLatex = vecToLatex(c);

    return makeProblem({
      topic: 'Coordinate Systems', week: 7, difficulty,
      instruction: `Given basis $\\mathcal{B} = \\{\\mathbf{b}_1, \\ldots, \\mathbf{b}_${n}\\}$, find the $\\mathcal{B}$-coordinate vector of $\\mathbf{v}$.`,
      parts: [
        { letter: 'a', points: 3, content: `Let $\\mathbf{b}_1 = ${vecToLatex(B[0])},\\ \\mathbf{b}_2 = ${vecToLatex(B[1])}${n===3?`,\\ \\mathbf{b}_3 = ${vecToLatex(B[2])}`:''}$, and $\\mathbf{v} = ${vLatex}$. Find $[\\mathbf{v}]_{\\mathcal{B}}$.` },
        { letter: 'b', points: 4, content: `Form the change-of-coordinates matrix $P_{\\mathcal{B}} = [\\mathbf{b}_1 \\ \\mathbf{b}_2 ${n===3?'\\ \\mathbf{b}_3':''}]$ and solve $P_{\\mathcal{B}}\\mathbf{c} = \\mathbf{v}$.` },
        { letter: 'c', points: 3, content: `Verify: compute $P_{\\mathcal{B}} [\\mathbf{v}]_{\\mathcal{B}}$ and confirm it equals $\\mathbf{v}$.` }
      ],
      solution: {
        answer: `$[\\mathbf{v}]_{\\mathcal{B}} = ${cLatex}$.`,
        steps: [
          { title: 'Form P and Augmented Matrix', math: `\\[${augToLatex(transpose(B), v)}\\]` },
          { title: 'Row Reduce', math: `\\[[\\mathbf{v}]_{\\mathcal{B}} = ${cLatex}\\]` },
          { title: 'Verify', math: `\\[P_{\\mathcal{B}} [\\mathbf{v}]_{\\mathcal{B}} = ${PLatex} ${cLatex} = ${vLatex} \\checkmark\\]` }
        ]
      },
      theorems: ['Coordinate mapping theorem (§4.4)', 'P_B is invertible ↔ B is a basis', '[v]_B = P_B⁻¹ v'],
      mistakes: ['Transposing B wrong — columns of P_B are basis vectors, not rows.'],
      related: ['change-of-basis', 'bases']
    });
  }

  function genRank(difficulty) {
    const d = difficulty || 'intermediate';
    const m = d === 'easy' ? 2 : 3, n = d === 'hard' ? 5 : 4;
    const A = randMatrix(m, n, 4);
    const { pivots } = rowReduce(A);
    const rk = pivots.length;
    const param = d === 'hard' ? `Determine for what value(s) of $h$ the matrix $A(h)$ has rank ${rk}.` : '';

    return makeProblem({
      topic: 'Rank', week: 7, difficulty,
      instruction: `Compute the rank of $A$ and apply the Rank-Nullity Theorem. ${param}`,
      parts: [
        { letter: 'a', points: 4, content: `Row reduce $A = ${matToLatex(A)}$ to find its rank.` },
        { letter: 'b', points: 3, content: `Compute nullity$(A)$ using the Rank-Nullity Theorem.` },
        { letter: 'c', points: 3, content: `State dimensions of all four fundamental subspaces: Col$(A)$, Nul$(A)$, Row$(A)$, Nul$(A^\\top)$.` }
      ],
      solution: {
        answer: `rank$(A) = ${rk}$, nullity$(A) = ${n - rk}$.`,
        steps: [
          { title: 'Row Reduce A', math: `\\[\\text{rank}(A) = ${rk}\\]` },
          { title: 'Apply Rank-Nullity', math: `\\[\\text{nullity}(A) = ${n} - ${rk} = ${n - rk}\\]` },
          { title: 'Four Fundamental Subspaces', math: `\\[\\dim(\\text{Col}A) = ${rk},\\quad \\dim(\\text{Nul}A) = ${n-rk},\\quad \\dim(\\text{Row}A) = ${rk},\\quad \\dim(\\text{Nul}A^\\top) = ${m-rk}\\]` }
        ]
      },
      theorems: ['Rank-Nullity: rank + nullity = n (§4.6)', 'dim Row A = rank A', 'Four fundamental subspaces theorem'],
      mistakes: ['Mixing up m and n when applying the theorem.'],
      related: ['null-space', 'column-space', 'dimension']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 8 GENERATORS
  ───────────────────────────────────────── */

  function genChangeOfBasis(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = 3;

    const B = n === 2 ? [randVector(2, range, false), randVector(2, range, false)] : [randVector(3, range, false), randVector(3, range, false), randVector(3, range, false)];
    const C = n === 2 ? [randVector(2, range, false), randVector(2, range, false)] : [randVector(3, range, false), randVector(3, range, false), randVector(3, range, false)];

    const PB = transpose(B);
    const PC = transpose(C);

    return makeProblem({
      topic: 'Change of Basis', week: 8, difficulty,
      instruction: `Find the change-of-basis matrix from $\\mathcal{B}$ to $\\mathcal{C}$, and use it to convert a vector from $\\mathcal{B}$-coordinates to $\\mathcal{C}$-coordinates.`,
      parts: [
        { letter: 'a', points: 4, content: `Let $\\mathcal{B} = \\{\\mathbf{b}_1, \\mathbf{b}_2${n===3?`, \\mathbf{b}_3`:''}\\}$ and $\\mathcal{C} = \\{\\mathbf{c}_1, \\mathbf{c}_2${n===3?`, \\mathbf{c}_3`:''}\\}$ where $\\mathbf{b}_1 = ${vecToLatex(B[0])}, \\mathbf{b}_2 = ${vecToLatex(B[1])}${n===3?`, \\mathbf{b}_3 = ${vecToLatex(B[2])}`:''}$ and $\\mathbf{c}_1 = ${vecToLatex(C[0])}, \\mathbf{c}_2 = ${vecToLatex(C[1])}${n===3?`, \\mathbf{c}_3 = ${vecToLatex(C[2])}`:''}$. Find $P_{\\mathcal{C}\\leftarrow\\mathcal{B}}$.` },
        { letter: 'b', points: 4, content: `If $[\\mathbf{v}]_{\\mathcal{B}} = ${vecToLatex(randVector(n, 3, false))}$, compute $[\\mathbf{v}]_{\\mathcal{C}}$.` },
        { letter: 'c', points: 2, content: `Verify your answer by converting back to standard coordinates using both bases.` }
      ],
      solution: {
        answer: `$P_{\\mathcal{C}\\leftarrow\\mathcal{B}} = P_{\\mathcal{C}}^{-1} P_{\\mathcal{B}}$.`,
        steps: [
          { title: 'Build P_B and P_C', math: `\\[P_{\\mathcal{B}} = ${matToLatex(PB)}, \\quad P_{\\mathcal{C}} = ${matToLatex(PC)}\\]` },
          { title: 'Change-of-Basis Formula', math: `\\[P_{\\mathcal{C}\\leftarrow\\mathcal{B}} = P_{\\mathcal{C}}^{-1} P_{\\mathcal{B}}\\]` },
          { title: 'Apply to Vector', math: `\\[[\\mathbf{v}]_{\\mathcal{C}} = P_{\\mathcal{C}\\leftarrow\\mathcal{B}} [\\mathbf{v}]_{\\mathcal{B}}\\]` }
        ]
      },
      theorems: ['Change-of-basis matrix (§4.7)', 'P_{C←B} = P_C⁻¹ P_B', 'Similarity: same linear map, different bases'],
      mistakes: ['Reversing the order: P_{C←B} vs P_{B←C}.', 'Using row vectors instead of column vectors for basis.'],
      related: ['coordinate-systems', 'eigenvalues', 'diagonalization']
    });
  }

  function genEigenvalues(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = d === 'hard' ? 4 : 3;

    // Pick nice integer eigenvalues
    const λ1 = randNonZero(3), λ2 = randNonZero(3);
    const λ3 = d !== 'easy' ? randNonZero(3) : null;
    const A = n === 2 ? MathUtils.matrixWithEigenvalues2x2(λ1, λ2) : MathUtils.matrixWithEigenvalues3x3(λ1, λ2, λ3);
    const trA = A.reduce((s, row, i) => s + row[i], 0);
    const dA = n === 2 ? det2(A) : det3(A);

    return makeProblem({
      topic: 'Eigenvalues', week: 8, difficulty,
      instruction: `Find all eigenvalues of $A$ by solving the characteristic equation $\\det(A - \\lambda I) = 0$.`,
      parts: [
        { letter: 'a', points: 4, content: `Set up and expand $\\det(A - \\lambda I)$ for $A = ${matToLatex(A)}$.` },
        { letter: 'b', points: 4, content: `Solve the characteristic polynomial $p(\\lambda) = 0$ to find all eigenvalues.` },
        { letter: 'c', points: 2, content: `Verify using invariants: $\\text{tr}(A) = \\sum \\lambda_i = ${trA}$ and $\\det(A) = \\prod \\lambda_i = ${fmt(dA)}$.` }
      ],
      solution: {
        answer: n === 2 ? `Eigenvalues: $\\lambda_1 = ${λ1}$, $\\lambda_2 = ${λ2}$.` : `Eigenvalues: $\\lambda_1 = ${λ1}$, $\\lambda_2 = ${λ2}$, $\\lambda_3 = ${λ3}$.`,
        steps: [
          { title: 'Characteristic Matrix A − λI', math: n === 2 ? `\\[A - \\lambda I = \\begin{pmatrix} ${A[0][0]}-\\lambda & ${A[0][1]} \\\\ ${A[1][0]} & ${A[1][1]}-\\lambda \\end{pmatrix}\\]` : `\\[A - \\lambda I = ${matToLatex([[A[0][0]+'−λ',A[0][1],A[0][2]],[A[1][0],A[1][1]+'−λ',A[1][2]],[A[2][0],A[2][1],A[2][2]+'−λ']])}\\]` },
          { title: 'Compute det(A − λI)', math: n === 2 ? `\\[p(\\lambda) = \\lambda^2 - ${trA}\\lambda + ${fmt(dA)} = (\\lambda - ${λ1})(\\lambda - ${λ2}) = 0\\]` : `\\[p(\\lambda) = (\\lambda - ${λ1})(\\lambda - ${λ2})(\\lambda - ${λ3}) = 0\\]` },
          { title: 'Solve for Eigenvalues', math: `\\[\\lambda_1 = ${λ1}, \\quad \\lambda_2 = ${λ2}${λ3 !== null ? `, \\quad \\lambda_3 = ${λ3}` : ''}\\]` },
          { title: 'Verify with Invariants', math: `\\[\\text{tr}(A) = ${λ1} + ${λ2}${λ3!==null?` + ${λ3}`:''} = ${trA}, \\quad \\det(A) = ${λ1} \\cdot ${λ2}${λ3!==null?` \\cdot ${λ3}`:''} = ${fmt(dA)}\\]` }
        ]
      },
      theorems: ['Characteristic equation (§5.1)', 'Eigenvalues = roots of det(A−λI)', 'tr(A) = sum of eigenvalues, det(A) = product'],
      mistakes: ['Expanding det(A−λI) with sign errors.', 'Missing repeated roots.'],
      related: ['eigenvectors', 'characteristic-equation', 'diagonalization']
    });
  }

  function genEigenvectors(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const λ1 = randNonZero(4), λ2 = randNonZero(4);
    const A = n === 2 ? MathUtils.matrixWithEigenvalues2x2(λ1, λ2) : MathUtils.matrixWithEigenvalues3x3(λ1, λ2, randNonZero(4));

    return makeProblem({
      topic: 'Eigenvectors', week: 8, difficulty,
      instruction: `For each eigenvalue of $A$, find a basis for the corresponding eigenspace (the null space of $A - \\lambda I$).`,
      parts: [
        { letter: 'a', points: 4, content: `Find the eigenvalues of $A = ${matToLatex(A)}$ using the characteristic equation.` },
        { letter: 'b', points: 4, content: `For each eigenvalue $\\lambda$, solve $(A - \\lambda I)\\mathbf{v} = \\mathbf{0}$ to find the eigenspace $E_\\lambda$.` },
        { letter: 'c', points: 2, content: `Verify: for each eigenpair $(\\lambda, \\mathbf{v})$, compute $A\\mathbf{v}$ and confirm it equals $\\lambda\\mathbf{v}$.` }
      ],
      solution: {
        answer: `Find eigenvectors by solving $\\text{Nul}(A - \\lambda_i I)$ for each eigenvalue.`,
        steps: [
          { title: 'Find Eigenvalues', math: `\\[\\det(A - \\lambda I) = 0 \\implies \\lambda_1 = ${λ1}, \\quad \\lambda_2 = ${λ2}\\]` },
          { title: 'Eigenspace for λ₁', math: `\\[(A - ${λ1}I)\\mathbf{v} = \\mathbf{0}\\]`, explanation: 'Row reduce and find null space.' },
          { title: 'Eigenspace for λ₂', math: `\\[(A - ${λ2}I)\\mathbf{v} = \\mathbf{0}\\]`, explanation: 'Row reduce and find null space.' },
          { title: 'Verify Av = λv', math: `\\[A\\mathbf{v}_1 = ${λ1}\\mathbf{v}_1 \\checkmark\\]` }
        ]
      },
      theorems: ['Eigenspace = Nul(A − λI) (§5.1)', 'dim(Eλ) = geometric multiplicity of λ', 'Eigenvectors for distinct eigenvalues are independent'],
      mistakes: ['Solving (A − λI)v = b instead of = 0.', 'Forgetting that eigenspaces must be non-trivial (v ≠ 0).'],
      related: ['eigenvalues', 'diagonalization', 'characteristic-equation']
    });
  }

  function genCharacteristicEquation(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const λ1 = randNonZero(4), λ2 = (d === 'hard' ? λ1 : randNonZero(4)); // repeated if hard
    const λ3 = n === 3 ? randNonZero(4) : null;
    const A = n === 2 ? MathUtils.matrixWithEigenvalues2x2(λ1, λ2) : MathUtils.matrixWithEigenvalues3x3(λ1, λ2, λ3);
    const trA = A.reduce((s, row, i) => s + row[i], 0);
    const dA = n === 2 ? det2(A) : det3(A);

    return makeProblem({
      topic: 'Characteristic Equation', week: 8, difficulty,
      instruction: `Derive the characteristic polynomial of $A$ and state all roots with their algebraic multiplicities.`,
      parts: [
        { letter: 'a', points: 4, content: `Compute $p(\\lambda) = \\det(A - \\lambda I)$ for $A = ${matToLatex(A)}$. Expand fully.` },
        { letter: 'b', points: 3, content: `Factor $p(\\lambda)$ completely and state all eigenvalues with their algebraic multiplicities.` },
        { letter: 'c', points: 3, content: `Verify: $\\text{tr}(A) = \\sum \\lambda_i = ${trA}$ and $\\det(A) = \\prod \\lambda_i = ${fmt(dA)}$.` }
      ],
      solution: {
        answer: n === 2 ? `$p(\\lambda) = \\lambda^2 - ${trA}\\lambda + ${fmt(dA)}$` : `$p(\\lambda) = (\\lambda-${λ1})(\\lambda-${λ2})(\\lambda-${λ3})$`,
        steps: [
          { title: 'Build A − λI', math: n === 2 ? `\\[A - \\lambda I = \\begin{pmatrix} ${A[0][0]}-\\lambda & ${A[0][1]} \\\\ ${A[1][0]} & ${A[1][1]}-\\lambda \\end{pmatrix}\\]` : `\\[A - \\lambda I = \\ldots\\]` },
          { title: 'Expand Determinant', math: n === 2 ? `\\[p(\\lambda) = (${A[0][0]}-\\lambda)(${A[1][1]}-\\lambda) - (${A[0][1]})(${A[1][0]})\\]` : `\\[p(\\lambda) = -\\lambda^3 + I_1 \\lambda^2 - I_2 \\lambda + I_3\\]`, explanation: n === 3 ? 'where I₁ = tr(A), I₂ = sum of 2×2 principal minors, I₃ = det(A)' : '' },
          { title: 'Factor', math: n === 2 ? `\\[p(\\lambda) = (\\lambda - ${λ1})(\\lambda - ${λ2})\\]` : `\\[p(\\lambda) = (\\lambda - ${λ1})(\\lambda - ${λ2})(\\lambda - ${λ3})\\]` },
          { title: 'Verify Invariants', math: `\\[\\text{tr}(A) = ${trA}, \\quad \\det(A) = ${fmt(dA)}\\]` }
        ]
      },
      theorems: ['Cayley-Hamilton: A satisfies p(A) = 0', 'Characteristic polynomial degree = n', 'Eigenvalues ↔ roots of p(λ)'],
      mistakes: ['Using det(λI − A) vs det(A − λI) — signs change for odd n.', 'Wrong sign in expanding 3×3 det.'],
      related: ['eigenvalues', 'eigenvectors', 'diagonalization']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 9 GENERATORS
  ───────────────────────────────────────── */

  function genDiagonalization(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const λ1 = randNonZero(4), λ2 = randNonZero(4);
    while (Math.abs(λ1 - λ2) < 1) λ2 = randNonZero(4);
    const λ3 = n === 3 ? randNonZero(4) : null;
    const D = n === 2 ? [[λ1, 0], [0, λ2]] : [[λ1, 0, 0], [0, λ2, 0], [0, 0, λ3]];
    const A = n === 2 ? MathUtils.matrixWithEigenvalues2x2(λ1, λ2) : MathUtils.matrixWithEigenvalues3x3(λ1, λ2, λ3);
    const power = pick([2, 3, 4, 5]);

    return makeProblem({
      topic: 'Diagonalization', week: 9, difficulty,
      instruction: `Diagonalize $A$ (if possible) as $A = PDP^{-1}$ and use diagonalization to compute $A^${power}$.`,
      parts: [
        { letter: 'a', points: 4, content: `Find eigenvalues and eigenvectors of $A = ${matToLatex(A)}$. Form matrices $P$ (eigenvectors as columns) and $D$ (diagonal).` },
        { letter: 'b', points: 3, content: `Verify $AP = PD$ (i.e., $A = PDP^{-1}$).` },
        { letter: 'c', points: 3, content: `Use $A^${power} = PD^${power}P^{-1}$ to compute $A^${power}$.` }
      ],
      solution: {
        answer: `$D = ${matToLatex(D)}$, and $A^${power} = PD^${power}P^{-1}$ with $D^${power} = ${matToLatex(D.map(row => row.map(v => Math.pow(v, power))))}$.`,
        steps: [
          { title: 'Eigenvalues', math: n === 2 ? `\\[\\lambda_1 = ${λ1}, \\quad \\lambda_2 = ${λ2}\\]` : `\\[\\lambda_1 = ${λ1}, \\quad \\lambda_2 = ${λ2}, \\quad \\lambda_3 = ${λ3}\\]` },
          { title: 'Form D', math: `\\[D = ${matToLatex(D)}\\]` },
          { title: 'Compute D^n', math: `\\[D^${power} = ${matToLatex(D.map(row => row.map(v => Math.pow(v, power))))}\\]` },
          { title: 'Apply A^n = PD^nP^-1', math: `\\[A^${power} = P D^${power} P^{-1}\\]` }
        ]
      },
      theorems: ['Diagonalization theorem (§5.3)', 'A diagonalizable ↔ n linearly independent eigenvectors', 'Aⁿ = PDⁿP⁻¹'],
      mistakes: ['Columns of P must be eigenvectors in order matching D.', 'Distinct eigenvalues guarantee diagonalizability; repeated eigenvalues need checking.'],
      related: ['eigenvalues', 'eigenvectors', 'complex-eigenvalues']
    });
  }

  function genComplexEigenvalues(difficulty) {
    const d = difficulty || 'intermediate';
    // 2×2 matrix with complex eigenvalues a ± bi
    const a = randInt(-2, 2);
    const b = randInt(1, 4); // b > 0 for complex
    // Rotation-dilation: [[a, -b], [b, a]]
    const extra = d === 'hard' ? randInt(1, 3) : 1;
    const A = [[a, -b * extra], [b * extra, a]];
    const trace = 2 * a;
    const detA = a * a + b * b * extra * extra;
    const discriminant = trace * trace - 4 * detA;

    return makeProblem({
      topic: 'Complex Eigenvalues', week: 9, difficulty,
      instruction: `Find the complex eigenvalues and eigenvectors of $A$, and describe the geometric action of $A$.`,
      parts: [
        { letter: 'a', points: 4, content: `Find the characteristic polynomial and solve for eigenvalues of $A = ${matToLatex(A)}$.` },
        { letter: 'b', points: 4, content: `For $\\lambda = ${a} + ${b * extra}i$, solve $(A - \\lambda I)\\mathbf{v} = \\mathbf{0}$ to find a complex eigenvector.` },
        { letter: 'c', points: 2, content: `Describe the action of $A$: what rotation angle and scaling factor does it represent?` }
      ],
      solution: {
        answer: `Eigenvalues: $\\lambda = ${a} \\pm ${b * extra}i$.`,
        steps: [
          { title: 'Characteristic Polynomial', math: `\\[p(\\lambda) = \\lambda^2 - ${trace}\\lambda + ${detA} = 0\\]` },
          { title: 'Quadratic Formula', math: `\\[\\lambda = \\frac{${trace} \\pm \\sqrt{${discriminant}}}{2} = ${a} \\pm ${b * extra}i\\]` },
          { title: 'Geometric Interpretation', math: `\\[|\\lambda| = \\sqrt{${detA}} = ${Math.sqrt(detA).toFixed(3)}, \\quad \\theta = \\arctan\\left(\\frac{${b * extra}}{${a || '0'}}\\right)\\]`, explanation: '|λ| = scaling factor, θ = rotation angle' }
        ]
      },
      theorems: ['Complex conjugate eigenvalues (§5.5)', 'Rotation-dilation matrix form', '|λ| = scaling, arg(λ) = rotation angle'],
      mistakes: ['Forgetting that complex eigenvalues come in conjugate pairs for real matrices.', 'Mixing up real and imaginary parts.'],
      related: ['diagonalization', 'eigenvalues']
    });
  }

  function genGramSchmidt(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 2 : 3;
    const range = d === 'hard' ? 5 : 3;

    // Generate linearly independent vectors
    const vecs = d === 'easy'
      ? [randVector(2, range, false), randVector(2, range, false)]
      : [randVector(3, range, false), randVector(3, range, false), randVector(3, range, false)];

    const orthVecs = MathUtils.gramSchmidt(vecs);

    return makeProblem({
      topic: 'Gram–Schmidt Orthogonalization', week: 9, difficulty,
      instruction: `Apply the Gram–Schmidt process to the following set of vectors to produce an orthogonal basis, then normalize to obtain an orthonormal basis.`,
      parts: [
        { letter: 'a', points: 4, content: `Apply Gram–Schmidt to $${vecs.map((v,i)=>`\\mathbf{v}_{${i+1}}=${vecToLatex(v)}`).join(', ')}$. Compute $\\mathbf{u}_1, \\mathbf{u}_2${n===3?', \\mathbf{u}_3':''}$.` },
        { letter: 'b', points: 3, content: `Verify that the resulting vectors are mutually orthogonal ($\\mathbf{u}_i \\cdot \\mathbf{u}_j = 0$ for $i \\neq j$).` },
        { letter: 'c', points: 3, content: `Normalize each $\\mathbf{u}_i$ to get an orthonormal basis $\\{\\mathbf{e}_1, \\mathbf{e}_2${n===3?', \\mathbf{e}_3':''}\\}$.` }
      ],
      solution: {
        answer: `Orthogonal basis: $\\{${orthVecs.map((v,i)=>`\\mathbf{u}_{${i+1}}`).join(', ')}\\}$.`,
        steps: [
           { title: 'u₁ = v₁', math: `\\[\\mathbf{u}_1 = ${vecToLatex(vecs[0])}\\]` },
           { title: 'u₂ = v₂ − proj_{u₁}(v₂)', math: `\\[\\mathbf{u}_2 = \\mathbf{v}_2 - \\frac{\\mathbf{v}_2 \\cdot \\mathbf{u}_1}{\\|\\mathbf{u}_1\\|^2}\\mathbf{u}_1\\]` },
           ...(n === 3 ? [{ title: 'u₃ = v₃ − proj_{u₁}(v₃) − proj_{u₂}(v₃)', math: `\\[\\mathbf{u}_3 = \\mathbf{v}_3 - \\frac{\\mathbf{v}_3 \\cdot \\mathbf{u}_1}{\\|\\mathbf{u}_1\\|^2}\\mathbf{u}_1 - \\frac{\\mathbf{v}_3 \\cdot \\mathbf{u}_2}{\\|\\mathbf{u}_2\\|^2}\\mathbf{u}_2\\]` }] : []),
           { title: 'Normalize', math: `\\[\\mathbf{e}_k = \\frac{\\mathbf{u}_k}{\\|\\mathbf{u}_k\\|}\\]` }
         ]
      },
      theorems: ['Gram–Schmidt theorem (§6.4)', 'Projection formula: proj_u(v) = (v·u)/(u·u) u', 'Result: orthogonal (or orthonormal) basis for same span'],
      mistakes: ['Computing projections onto earlier original vectors v instead of orthogonalized u vectors.', 'Normalizing too early (normalize only at the end).'],
      related: ['orthogonal-complement', 'eigenvalues']
    });
  }

  function genOrthogonalComplement(difficulty) {
    const d = difficulty || 'intermediate';
    const n = d === 'easy' ? 3 : 4;
    const range = 3;
    const A = randMatrix(2, n, range);

    return makeProblem({
      topic: 'Orthogonal Complement', week: 9, difficulty,
      instruction: `Find the orthogonal complement $W^\\perp$ of the subspace $W = \\text{Col}(A^\\top) = \\text{Row}(A)$.`,
      parts: [
        { letter: 'a', points: 3, content: `Let $A = ${matToLatex(A)}$. Find a basis for $\\text{Row}(A)$ (the row space of $A$).` },
        { letter: 'b', points: 4, content: `Use the fundamental subspace theorem: $(\\text{Row}(A))^\\perp = \\text{Nul}(A)$. Find a basis for $\\text{Nul}(A)$.` },
        { letter: 'c', points: 3, content: `Verify: state $\\dim(\\text{Row}(A)) + \\dim(\\text{Nul}(A)) = ${n}$.` }
      ],
      solution: {
        answer: `$W^\\perp = \\text{Nul}(A)$.`,
        steps: [
          { title: 'RREF and Row Space Basis', math: `\\[\\text{RREF}(A) = ${matToLatex(MathUtils.rowReduce(A).rref)}\\]` },
          { title: 'Fundamental Subspace Relation', math: `\\[(\\text{Row} A)^\\perp = \\text{Nul}(A)\\]` },
          { title: 'Dimension Check', math: `\\[\\text{rank}(A) + \\text{nullity}(A) = ${n} \\checkmark\\]` }
        ]
      },
      theorems: ['(Row A)⊥ = Nul A (§6.1)', '(Col A)⊥ = Nul Aᵀ', 'dim W + dim W⊥ = n'],
      mistakes: ['Confusing (Col A)⊥ with (Row A)⊥.', 'Not verifying orthogonality by dot product.'],
      related: ['gram-schmidt', 'null-space']
    });
  }

  /* ─────────────────────────────────────────
     WEEK 10 GENERATOR (Mixed Final)
  ───────────────────────────────────────── */

  function genFinalReviewMixed(difficulty) {
    // Pick a random topic from all weeks
    const allTopics = Object.keys(TOPIC_META).filter(t => t !== 'final-review-mixed');
    const t = pick(allTopics);
    return generate(t, difficulty || 'hard');
  }

  /* ─────────────────────────────────────────
     SPECIAL TYPE GENERATORS
  ───────────────────────────────────────── */

  function genSpecialMatrix(subTypes) {
    const sub = subTypes.length > 0 ? pick(subTypes) : pick(['multiply', 'inverse', 'polynomial']);
    const A = randInvertible2x2(4);
    const B = randInvertible2x2(4);
    if (sub === 'multiply' || sub === 'commutator') return genMatrixOperations('intermediate');
    if (sub === 'inverse') return genInverseMatrices('intermediate');
    if (sub === 'polynomial') return genMatrixOperations('intermediate');
    return genMatrixOperations('intermediate');
  }

  function genSpecialDeterminant(subTypes) {
    const sub = subTypes.length > 0 ? pick(subTypes) : 'cofactor';
    if (sub === 'cramers') return genCramersRule('intermediate');
    return genDeterminants('intermediate');
  }

  function genSpecialLinearIndependence(subTypes) {
    return genLinearIndependence('intermediate');
  }

  function genSpecialTransformation(subTypes) {
    return genLinearTransformations('intermediate');
  }

  function genSpecialVectorSpace(subTypes) {
    return genVectorSpaces('intermediate');
  }

  function genSpecialBasis(subTypes) {
    return genBases('intermediate');
  }

  function genSpecialRank(subTypes) {
    return genRank('intermediate');
  }

  function genSpecialEigenvalue(subTypes) {
    return genEigenvalues('intermediate');
  }

  function genSpecialEigenvector(subTypes) {
    return genEigenvectors('intermediate');
  }

  function genSpecialDiagonalization(subTypes) {
    return genDiagonalization('intermediate');
  }

  function genSpecialOrthogonality(subTypes) {
    const sub = subTypes.length > 0 ? pick(subTypes) : 'gram-schmidt';
    if (sub === 'complement') return genOrthogonalComplement('intermediate');
    return genGramSchmidt('intermediate');
  }

  function genSpecialMixed(subTypes) {
    return genFinalReviewMixed('hard');
  }

  /* ─────────────────────────────────────────
     MAIN DISPATCH TABLE
  ───────────────────────────────────────── */

  const GENERATORS = {
    'systems-of-linear-equations': genSystemsOfLinearEquations,
    'row-reduction': genRowReduction,
    'echelon-forms': genEchelonForms,
    'vector-equations': genVectorEquations,
    'matrix-equation': genMatrixEquation,
    'solution-sets': genSolutionSets,
    'applications-linear-systems': genApplicationsLinearSystems,
    'linear-independence': genLinearIndependence,
    'linear-transformations': genLinearTransformations,
    'matrix-operations': genMatrixOperations,
    'inverse-matrices': genInverseMatrices,
    'invertibility': genInvertibility,
    'lu-factorization': genLUFactorization,
    'determinants': genDeterminants,
    'cramers-rule': genCramersRule,
    'volumes-linear-transformations': genVolumes,
    'vector-spaces': genVectorSpaces,
    'subspaces': genVectorSpaces,
    'null-space': genNullSpace,
    'column-space': genColumnSpace,
    'bases': genBases,
    'dimension': genDimension,
    'coordinate-systems': genCoordinateSystems,
    'rank': genRank,
    'change-of-basis': genChangeOfBasis,
    'eigenvalues': genEigenvalues,
    'eigenvectors': genEigenvectors,
    'characteristic-equation': genCharacteristicEquation,
    'diagonalization': genDiagonalization,
    'eigenvectors-linear-transformations': genEigenvectors,
    'complex-eigenvalues': genComplexEigenvalues,
    'gram-schmidt': genGramSchmidt,
    'orthogonal-complement': genOrthogonalComplement,
    'final-review-mixed': genFinalReviewMixed
  };

  function generate(topicKey, difficulty) {
    const gen = GENERATORS[topicKey];
    if (!gen) return null;
    try { return gen(difficulty); } catch (e) { console.error('Generator error:', e); return null; }
  }

  function getMeta(topicKey) {
    return TOPIC_META[topicKey] || null;
  }

  function getAllTopics() {
    return Object.keys(TOPIC_META);
  }

  return { generate, getMeta, getAllTopics, GENERATORS, TOPIC_META, genSpecialMatrix, genSpecialDeterminant, genSpecialLinearIndependence, genSpecialTransformation, genSpecialVectorSpace, genSpecialBasis, genSpecialRank, genSpecialEigenvalue, genSpecialEigenvector, genSpecialDiagonalization, genSpecialOrthogonality, genSpecialMixed };
})();

/* ============================================================
   SECTION 8: EXAM GENERATOR
   ============================================================ */

const ExamGenerator = (() => {
  const TOPIC_WEIGHTS = {
    'systems-of-linear-equations': 2, 'row-reduction': 2, 'echelon-forms': 1,
    'linear-independence': 2, 'determinants': 2, 'cramers-rule': 1,
    'inverse-matrices': 2, 'invertibility': 1, 'lu-factorization': 1,
    'null-space': 2, 'column-space': 1, 'bases': 2, 'rank': 2,
    'eigenvalues': 3, 'eigenvectors': 3, 'diagonalization': 3,
    'change-of-basis': 2, 'gram-schmidt': 2, 'orthogonal-complement': 1,
    'complex-eigenvalues': 1, 'linear-transformations': 2, 'matrix-operations': 1
  };

  function weightedTopics(coverage) {
    let topics = Object.keys(TOPIC_WEIGHTS);
    if (coverage === 'first-half') topics = topics.filter(t => Generators.TOPIC_META[t]?.week <= 5);
    if (coverage === 'second-half') topics = topics.filter(t => Generators.TOPIC_META[t]?.week >= 6);
    // Build weighted list
    const weighted = [];
    for (const t of topics) { for (let i = 0; i < (TOPIC_WEIGHTS[t] || 1); i++) weighted.push(t); }
    return weighted;
  }

  function generateExam({ numQuestions, coverage, difficulty, shuffle }) {
    const pool = weightedTopics(coverage || 'all');
    const usedTopics = new Set();
    const problems = [];
    let attempts = 0;

    while (problems.length < numQuestions && attempts < numQuestions * 8) {
      attempts++;
      const t = pool[Math.floor(Math.random() * pool.length)];
      if (usedTopics.has(t) && usedTopics.size < pool.length * 0.7) continue;
      const prob = Generators.generate(t, difficulty || 'intermediate');
      if (prob) { problems.push({ ...prob, id: Date.now() + problems.length }); usedTopics.add(t); }
    }
    if (shuffle) MathUtils.shuffle(problems);
    return problems;
  }

  return { generateExam };
})();

/* ============================================================
   SECTION 9: PROBLEM HISTORY
   ============================================================ */

const ProblemHistory = (() => {
  let history = [];
  const MAX_HISTORY = 20;

  function add(prob) {
    history.unshift({ ...prob, timestamp: Date.now(), id: Date.now() });
    if (history.length > MAX_HISTORY) history.pop();
    render();
  }

  function render() {
    const list = document.getElementById('recent-history-list');
    const empty = document.getElementById('recent-history-empty');
    if (!list) return;
    if (history.length === 0) { if (empty) empty.style.display = ''; return; }
    if (empty) empty.style.display = 'none';
    const items = history.slice(0, 8).map(p => `
      <li style="padding:var(--space-2) var(--space-4);border-bottom:1px solid var(--border);cursor:pointer;" 
          data-history-id="${p.id}" title="Click to recall">
        <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary);margin-bottom:2px;">${p.topic || '—'}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">${p.week ? 'Week ' + p.week : ''} · ${p.difficulty || ''}</div>
      </li>`).join('');
    list.innerHTML = items;
  }

  function get() { return history; }

  return { add, render, get };
})();

/* ============================================================
   SECTION 10: PROBLEM DISPLAY ENGINE
   ============================================================ */

const ProblemDisplay = (() => {
  let currentProblem = null;
  let solutionVisible = false;
  let timerInterval = null;
  let timerSeconds = 0;
  let timerPaused = false;

  function setCurrentProblem(prob) {
    currentProblem = prob;
    solutionVisible = false;
    timerSeconds = 0;
  }

  function show(prob) {
    if (!prob) return;
    setCurrentProblem(prob);
    renderProblem(prob);
    hideSolution();
    if (StorageManager.get('examMode', 'practice') === 'timed') startTimer();
    scrollTo('problem-display');
  }

  function renderProblem(prob) {
    // Show content, hide empty state
    const content = document.getElementById('problem-content');
    const emptyState = document.getElementById('problem-empty-state');
    if (emptyState) { emptyState.setAttribute('aria-hidden', 'true'); emptyState.style.display = 'none'; }
     if (content) { content.setAttribute('aria-hidden', 'false'); content.style.display = ''; }

    // Set instructions
    const instrEl = document.getElementById('problem-instructions-text');
    if (instrEl) instrEl.textContent = prob.instruction || '';

    // Set meta badges
    const metaTopic = document.getElementById('problem-meta-topic');
    const metaWeek = document.getElementById('problem-meta-week');
    const metaDiff = document.getElementById('problem-meta-difficulty');
    const metaPts = document.getElementById('problem-meta-points');
    if (metaTopic) metaTopic.textContent = prob.topic || '';
    if (metaWeek) metaWeek.textContent = prob.week ? `Week ${prob.week}` : '';
    if (metaDiff) metaDiff.textContent = prob.difficulty || '';
    if (metaPts) { const total = (prob.parts || []).reduce((s, p) => s + (p.points || 0), 0); metaPts.textContent = total ? `${total} pts` : ''; }

    // Show/hide parts
    const partLetters = ['a', 'b', 'c', 'd'];
    const numParts = (prob.parts || []).length;
    partLetters.forEach((letter, idx) => {
      const partEl = document.getElementById(`problem-part-${letter}`);
      if (!partEl) return;
      if (idx < numParts) {
        partEl.style.display = '';
        const part = prob.parts[idx];
        const bodyEl = document.getElementById(`part-${letter}-body`);
        const ptsEl = document.getElementById(`part-${letter}-points`);
        const mathEl = document.getElementById(`part-${letter}-math`);
        const matrixEl = document.getElementById(`part-${letter}-matrix`);
        const augEl = document.getElementById(`part-${letter}-augmented`);
        const vecEl = document.getElementById(`part-${letter}-vector`);
        const figEl = document.getElementById(`part-${letter}-figure`);

        if (ptsEl) ptsEl.textContent = part.points ? `(${part.points} pts)` : '';
        if (mathEl) MathRenderer.setHTML(mathEl, part.content || '');
        if (matrixEl) matrixEl.style.display = 'none';
        if (augEl) augEl.style.display = 'none';
        if (vecEl) vecEl.style.display = 'none';
        if (figEl) figEl.style.display = 'none';
      } else {
        partEl.style.display = 'none';
      }
    });

    // Limit to selected number of parts
    const numPtsSelect = document.getElementById('num-questions-select');
    const maxParts = numPtsSelect ? parseInt(numPtsSelect.value) : 3;
    partLetters.forEach((letter, idx) => {
      const partEl = document.getElementById(`problem-part-${letter}`);
      if (partEl && idx >= maxParts) partEl.style.display = 'none';
    });

    // Trigger MathJax render
    const problemSection = document.getElementById('problem-display');
    MathRenderer.render(problemSection);
  }

  function showSolution() {
    if (!currentProblem) return;
    solutionVisible = true;
    StatsManager.incrementViewed();

    const content = document.getElementById('solution-content');
    const revealBtn = document.getElementById('reveal-solution-btn');
    if (content) content.setAttribute('aria-hidden', 'false');
    if (revealBtn) {
      revealBtn.textContent = '';
      revealBtn.innerHTML = '<span class="action-btn__icon" aria-hidden="true">👁</span><span class="action-btn__text">Hide Solution</span>';
      revealBtn.setAttribute('aria-expanded', 'true');
    }

    renderSolution(currentProblem.solution, currentProblem.theorems, currentProblem.mistakes, currentProblem.related);
    scrollTo('solution-area');
  }

  function hideSolution() {
    solutionVisible = false;
    const content = document.getElementById('solution-content');
    const revealBtn = document.getElementById('reveal-solution-btn');
    if (content) content.setAttribute('aria-hidden', 'true');
    if (revealBtn) {
      revealBtn.innerHTML = '<span class="action-btn__icon" aria-hidden="true">👁</span><span class="action-btn__text">Show Solution</span>';
      revealBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleSolution() {
    if (solutionVisible) hideSolution();
    else showSolution();
  }

  function renderSolution(solution, theorems, mistakes, related) {
    if (!solution) return;

    // Final answer
    const answerEl = document.getElementById('solution-answer-math');
    if (answerEl) MathRenderer.setHTML(answerEl, solution.answer || '');
    document.getElementById('solution-answer-matrix').style.display = 'none';

    // Steps
    const stepsList = document.getElementById('solution-steps-list');
    if (stepsList && solution.steps) {
      stepsList.innerHTML = solution.steps.map((step, i) => `
        <li class="solution-step" data-step="${i+1}">
          <div class="solution-step__header">
            <span class="solution-step__number">${i+1}</span>
            <span class="solution-step__title">${step.title || ''}</span>
          </div>
          <div class="solution-step__body">
            ${step.explanation ? `<p class="solution-step__explanation">${step.explanation}</p>` : ''}
            ${step.math ? `<div class="math-content solution-step__math">${step.math}</div>` : ''}
          </div>
        </li>`).join('');
    }

    // Theorems
    const theoryBody = document.getElementById('solution-theory-body');
    if (theoryBody && theorems && theorems.length) {
      theoryBody.innerHTML = theorems.map(t => `
        <div class="theory-box">
          <div class="theory-box__tag">Theorem / Definition</div>
          <div class="theory-box__statement math-content">${t}</div>
        </div>`).join('');
    } else if (theoryBody) theoryBody.innerHTML = '<p style="color:var(--text-muted);font-size:var(--text-sm);">No specific theorems listed for this problem.</p>';

    // Mistakes
    const mistakesList = document.getElementById('solution-mistakes-list');
    if (mistakesList && mistakes && mistakes.length) {
      mistakesList.innerHTML = mistakes.map(m => `<li>${m}</li>`).join('');
    } else if (mistakesList) mistakesList.innerHTML = '<li style="color:var(--text-muted);">No specific mistakes listed.</li>';

    // Related
    const relatedEl = document.getElementById('solution-related-suggestions');
    if (relatedEl && related && related.length) {
      relatedEl.innerHTML = related.map(r => {
        const meta = Generators.getMeta(r);
        return meta ? `<button class="action-btn action-btn--ghost" data-topic="${r}" style="font-size:var(--text-xs);">${meta.name}</button>` : '';
      }).join('');
    }

    // Render MathJax for solution
    const solutionSection = document.getElementById('solution-area');
   if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([solutionSection]).catch(err => console.warn('[MathJax]', err));
   } else {
        MathRenderer.render(solutionSection);
   }
  }

  function startTimer() {
    stopTimer();
    timerSeconds = 0; timerPaused = false;
    const timerEl = document.getElementById('problem-timer');
    if (timerEl) timerEl.removeAttribute('hidden');
    timerInterval = setInterval(() => {
      if (!timerPaused) {
        timerSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function toggleTimer() {
    timerPaused = !timerPaused;
    const btn = document.getElementById('timer-pause-btn');
    if (btn) btn.textContent = timerPaused ? '▶' : '⏸';
  }

  function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function getCurrentProblem() { return currentProblem; }
  function isSolutionVisible() { return solutionVisible; }

  return { show, showSolution, hideSolution, toggleSolution, renderSolution, getCurrentProblem, isSolutionVisible, startTimer, stopTimer, toggleTimer };
})();

/* ============================================================
   SECTION 11: EXAM MODE ENGINE
   ============================================================ */

const ExamMode = (() => {
  let examProblems = [];
  let examTimerInterval = null;
  let examTimeRemaining = 6000; // 100 minutes in seconds
  let examTimerPaused = false;
  let solutionsRevealed = false;

  function generateExam() {
    const numQ = parseInt(document.querySelector('input[name="exam-length"]:checked')?.value || '20');
    const coverage = document.querySelector('input[name="exam-coverage"]:checked')?.value || 'all';
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';
    const timed = document.getElementById('exam-timed-mode')?.checked;
    const shouldShuffle = document.getElementById('exam-shuffle')?.checked;

    examProblems = ExamGenerator.generateExam({ numQuestions: numQ, coverage, difficulty, shuffle: shouldShuffle });
    renderExamPaper(numQ, timed);
    if (timed) startExamTimer(6000);
  }

  function renderExamPaper(numQ, timed) {
    const empty = document.getElementById('exam-paper-empty');
    const list = document.getElementById('exam-problems-list');
    const scoreGrid = document.getElementById('exam-score-grid');
    const timerBar = document.getElementById('exam-timer-bar');
    const solutions = document.getElementById('exam-solutions');

    if (empty) empty.style.display = 'none';
    if (list) { list.removeAttribute('hidden'); list.innerHTML = ''; }
    if (solutions) solutions.setAttribute('hidden', '');
    solutionsRevealed = false;

    // Score grid
    if (scoreGrid && numQ > 0) {
      scoreGrid.removeAttribute('hidden');
      const table = scoreGrid.querySelector('table');
      if (table) {
        const thead = table.querySelector('thead tr') || table.createTHead().insertRow(0);
        const tbody = table.querySelector('tbody tr') || table.createTBody().insertRow(0);
        thead.innerHTML = '<th>Q</th>' + Array.from({length:Math.min(numQ, 20)}, (_,i)=>`<th>${i+1}</th>`).join('') + (numQ>20?`<th>+${numQ-20}</th>`:'') + '<th>Total</th>';
        tbody.innerHTML = '<td>Pts</td>' + Array.from({length:Math.min(numQ, 20)}, ()=>'<td></td>').join('') + (numQ>20?'<td></td>':'') + '<td></td>';
      }
    }

    // Render problems
    if (list) {
      examProblems.forEach((prob, idx) => {
        const li = document.createElement('li');
        li.className = 'exam-problem';
        li.dataset.problemNum = idx + 1;
        li.dataset.topic = prob.topic || '';
        const pts = (prob.parts || []).reduce((s, p) => s + (p.points || 0), 0);
        li.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);">
            <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--secondary);">${prob.topic || ''} · Week ${prob.week || ''}</span>
            <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--accent);background:var(--accent-dim);padding:2px 8px;border-radius:var(--radius-full);">${pts} pts</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4);">${prob.instruction || ''}</p>
          ${(prob.parts || []).map((p, pi) => `
            <div style="margin-bottom:var(--space-3);padding:var(--space-3);background:var(--bg-elevated);border-radius:var(--radius-md);">
              <strong style="font-size:var(--text-xs);color:var(--primary);">(${['a','b','c','d'][pi]})</strong>
              <div class="math-content" style="margin-top:var(--space-2);">${p.content || ''}</div>
            </div>`).join('')}
          <div class="exam-problem__work-space">Work space</div>`;
        list.appendChild(li);
      });
    }

    // Download button
    const dlBtn = document.getElementById('download-exam-pdf-btn');
    if (dlBtn) dlBtn.removeAttribute('disabled');

    // Timer
    if (timed && timerBar) timerBar.removeAttribute('hidden');
    else if (timerBar) timerBar.setAttribute('hidden', '');

    // MathJax render
    MathRenderer.render(document.getElementById('exam-paper'));
    setTimeout(() => { document.getElementById('exam-paper').scrollIntoView({ behavior: 'smooth' }); }, 200);
  }

  function startExamTimer(seconds) {
    examTimeRemaining = seconds;
    examTimerPaused = false;
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
      if (!examTimerPaused) {
        examTimeRemaining--;
        updateExamTimerDisplay();
        if (examTimeRemaining <= 0) { clearInterval(examTimerInterval); ToastManager.show('Time is up!', 'warning', 5000); }
      }
    }, 1000);
  }

  function toggleExamTimer() {
    examTimerPaused = !examTimerPaused;
    const btn = document.getElementById('exam-timer-pause-btn');
    if (btn) btn.textContent = examTimerPaused ? '▶' : '⏸';
  }

  function updateExamTimerDisplay() {
    const display = document.getElementById('exam-timer-display');
    const fill = document.getElementById('exam-timer-fill');
    if (!display) return;
    const h = Math.floor(examTimeRemaining / 3600).toString().padStart(1, '0');
    const m = Math.floor((examTimeRemaining % 3600) / 60).toString().padStart(2, '0');
    const s = (examTimeRemaining % 60).toString().padStart(2, '0');
    display.textContent = `${h}:${m}:${s}`;
    if (fill) fill.style.width = `${(examTimeRemaining / 6000) * 100}%`;
  }

  function revealAllSolutions() {
    if (!examProblems.length) return;
    solutionsRevealed = true;
    const solutionsEl = document.getElementById('exam-solutions');
    const solutionsBody = document.getElementById('exam-solutions-body');
    if (!solutionsEl || !solutionsBody) return;
    solutionsEl.removeAttribute('hidden');

    solutionsBody.innerHTML = examProblems.map((prob, idx) => `
      <div style="padding:var(--space-5);background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:var(--space-4);">
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--primary);margin-bottom:var(--space-2);">Problem ${idx+1}: ${prob.topic || ''}</div>
        <div style="font-size:var(--text-sm);color:var(--accent);font-weight:600;margin-bottom:var(--space-3);">${prob.solution?.answer || ''}</div>
        ${(prob.solution?.steps || []).slice(0, 2).map((s, si) => `
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-2);">
            <strong>${s.title}:</strong> ${s.explanation || ''}
            <div class="math-content">${s.math || ''}</div>
          </div>`).join('')}
      </div>`).join('');

    MathRenderer.render(solutionsBody);
  }

  return { generateExam, toggleExamTimer, revealAllSolutions };
})();

/* ============================================================
   SECTION 12: WEEK MODULE GENERATORS (Individual week buttons)
   ============================================================ */

const WeekModules = (() => {
  const WEEK_TOPIC_MAP = {
    1: { 'sle-2x2': 'systems-of-linear-equations', 'sle-3x3': 'systems-of-linear-equations', 'sle-3x4': 'solution-sets', 'rref': 'echelon-forms', 'pivot': 'row-reduction', 'vector-eq': 'vector-equations', 'matrix-eq': 'matrix-equation' },
    2: { 'homogeneous': 'solution-sets', 'parametric-vector': 'solution-sets', 'lin-independence': 'linear-independence', 'lin-combination': 'vector-equations' },
    3: { 'linearity-test': 'linear-transformations', 'std-matrix': 'linear-transformations', 'commutator': 'matrix-operations', 'matrix-poly': 'matrix-operations', 'matrix-rep-basis': 'change-of-basis' },
    4: { 'find-inverse': 'inverse-matrices', 'invertibility': 'invertibility', 'lu-factorization': 'lu-factorization', 'solve-lu': 'lu-factorization' },
    5: { 'det-compute': 'determinants', 'cramers': 'cramers-rule', 'coplanar': 'volumes-linear-transformations', 'area-vol': 'volumes-linear-transformations' },
    6: { 'subspace-test': 'subspaces', 'null-space': 'null-space', 'col-space': 'column-space', 'tf-subspace': 'vector-spaces' },
    7: { 'find-basis-w': 'bases', 'dim': 'dimension', 'coord-vector': 'coordinate-systems', 'rank': 'rank', 'rank-nullity': 'rank' },
    8: { 'change-basis': 'change-of-basis', 'char-poly': 'characteristic-equation', 'eigenvalues': 'eigenvalues', 'eigenvectors': 'eigenvectors', 'eigenspace-basis': 'eigenvectors' },
    9: { 'diagonalize': 'diagonalization', 'matrix-power': 'diagonalization', 'matrix-func': 'diagonalization', 'is-diag': 'diagonalization', 'complex-eval': 'complex-eigenvalues', 'gram-schmidt': 'gram-schmidt', 'orthonormal': 'gram-schmidt', 'orth-complement': 'orthogonal-complement' },
    10: { 'mixed-all': 'final-review-mixed', 'exam-variant-style': 'final-review-mixed', 'proof-type': 'final-review-mixed', 'geometric-interp': 'final-review-mixed' }
  };

  function generateForWeek(week) {
    const topicSelect = document.getElementById(`w${week}-topic-select`);
    const diffSelect = document.getElementById(`w${week}-diff-select`);
    const exerciseList = document.getElementById(`week-${week}-exercises-list`);
    const solutionList = document.getElementById(`week-${week}-solutions-list`);

    if (!topicSelect || !exerciseList) return;

    const subTopic = topicSelect.value;
    const difficulty = diffSelect?.value || 'intermediate';
    const topicKey = WEEK_TOPIC_MAP[week]?.[subTopic] || 'systems-of-linear-equations';

    const prob = Generators.generate(topicKey, difficulty);
    if (!prob) { ToastManager.show('Generation failed. Try again.', 'error'); return; }

    StatsManager.incrementGenerated(prob.topic, prob.week, difficulty);
    ProblemHistory.add(prob);

    // Render in week module
    const card = document.createElement('div');
    card.className = 'problem-part';
    card.style.marginBottom = 'var(--space-4)';
    card.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--secondary);margin-bottom:var(--space-2);">${prob.topic} · ${difficulty}</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3);">${prob.instruction}</p>
      ${(prob.parts || []).map(p => `<div class="math-content" style="margin-bottom:var(--space-2);">${p.content}</div>`).join('')}
      <button class="action-btn action-btn--solution" style="margin-top:var(--space-3);font-size:var(--text-xs);" data-show-sol>Show Solution</button>
      <div class="solution-content" style="display:none;margin-top:var(--space-3);" data-sol-content>
        <div class="solution-answer-box">
          <strong style="color:var(--accent);">Answer:</strong>
          <div class="math-content">${prob.solution?.answer || ''}</div>
        </div>
      </div>`;

    // Toggle solution handler
    const btn = card.querySelector('[data-show-sol]');
    const solContent = card.querySelector('[data-sol-content]');
    if (btn && solContent) {
      btn.addEventListener('click', () => {
        const visible = solContent.style.display !== 'none';
        solContent.style.display = visible ? 'none' : '';
        btn.textContent = visible ? 'Show Solution' : 'Hide Solution';
        if (!visible) { MathRenderer.render(solContent); StatsManager.incrementViewed(); }
      });
    }

    exerciseList.innerHTML = '';
    exerciseList.appendChild(card);
    MathRenderer.render(exerciseList);

    ToastManager.show(`Week ${week} problem generated!`, 'success', 1800);
  }

  function init() {
    // Toggle buttons for week modules
    document.querySelectorAll('.week-module__toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        const bodyId = this.getAttribute('aria-controls');
        const body = document.getElementById(bodyId);
        if (body) {
          if (expanded) { body.setAttribute('hidden', ''); this.setAttribute('aria-expanded', 'false'); }
          else { body.removeAttribute('hidden'); this.setAttribute('aria-expanded', 'true'); }
        }
      });
    });

    // Week generate buttons
    for (let w = 1; w <= 10; w++) {
      const btn = document.getElementById(`gen-week${w}-btn`);
      if (btn) btn.addEventListener('click', () => generateForWeek(w));
    }
  }

  return { init, generateForWeek };
})();

/* ============================================================
   SECTION 13: SIDEBAR & NAVIGATION
   ============================================================ */

const SidebarController = (() => {
  let isOpen = false;

  function open() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) { overlay.classList.add('is-active'); overlay.setAttribute('aria-hidden', 'false'); }
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    isOpen = true;
  }

  function close() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) { overlay.classList.remove('is-active'); overlay.setAttribute('aria-hidden', 'true'); }
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    isOpen = false;
  }

  function toggle() { isOpen ? close() : open(); }

  function highlightActiveSection() {
    const sections = document.querySelectorAll('section[id], article[id^="week-"]');
    const navLinks = document.querySelectorAll('.sidebar__nav-link, .sidebar__week-link');
    const scrollY = window.scrollY + 120;

    let activeId = '';
    sections.forEach(sec => { if (sec.offsetTop <= scrollY) activeId = sec.id; });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('sidebar__nav-link--active', href === `#${activeId}`);
      if (href === `#${activeId}`) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function init() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);

    // Smooth nav clicks on mobile — close sidebar
    document.querySelectorAll('.sidebar__nav-link, .sidebar__week-link').forEach(link => {
      link.addEventListener('click', () => { if (window.innerWidth <= 768) close(); });
    });

    window.addEventListener('scroll', debounce(highlightActiveSection, 80));
    highlightActiveSection();
  }

  return { init, open, close, toggle };
})();

/* ============================================================
   SECTION 14: SEARCH SYSTEM
   ============================================================ */

const SearchSystem = (() => {
  let searchInput = null;

  function init() {
    searchInput = document.getElementById('search-topics');
    if (!searchInput) return; // No search input in this HTML, skip
  }

  return { init };
})();

/* ============================================================
   SECTION 15: INFO CARD UPDATER
   ============================================================ */

function updateInfoCard(topicKey) {
  const meta = Generators.getMeta(topicKey);
  if (!meta) return;

  const nameEl = document.getElementById('info-card-topic-name');
  const weekEl = document.getElementById('info-card-week-label');
  const descEl = document.getElementById('info-card-deion');
  const conceptsEl = document.getElementById('info-card-key-concepts');
  const sectionEl = document.getElementById('info-card-section');

  if (nameEl) nameEl.textContent = meta.name;
  if (weekEl) weekEl.textContent = meta.week ? `Week ${meta.week}` : '';
  if (descEl) descEl.textContent = meta.desc || '';
  if (conceptsEl) conceptsEl.innerHTML = (meta.concepts || []).map(c => `<li>${c}</li>`).join('');
  if (sectionEl) sectionEl.textContent = meta.section || '';
}

/* ============================================================
   SECTION 16: KEYBOARD SHORTCUTS
   ============================================================ */

const KeyboardShortcuts = (() => {
  function init() {
    document.addEventListener('keydown', (e) => {
      // Skip if typing in input/textarea/contenteditable
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case 'g': e.preventDefault(); document.getElementById('generate-btn')?.click(); break;
        case 't': e.preventDefault(); ThemeManager.toggle(); break;
        case 's': e.preventDefault(); ProblemDisplay.toggleSolution(); break;
        case 'e': e.preventDefault(); document.getElementById('generate-exam-btn')?.click(); break;
        case '/': e.preventDefault(); document.getElementById('matrix-size-select')?.focus(); break;
        case 'escape': SidebarController.close(); break;
      }
    });
  }

  return { init };
})();

/* ============================================================
   SECTION 17: BACK TO TOP
   ============================================================ */

function initBackToTop() {
  const btn = document.getElementById('back-to-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', debounce(() => {
    btn.toggleAttribute('hidden', window.scrollY < 400);
  }, 100));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   SECTION 18: UTILITY FUNCTIONS
   ============================================================ */

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* ============================================================
   SECTION 19: LATEX PALETTE INITIALIZATION
   ============================================================ */

function initLatexPalette() {
  const placeholders = {
    'matrix-2x2': '\\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}',
    'matrix-3x3': '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}',
    'augmented-matrix': '\\left[\\begin{array}{cc|c} a_{11} & a_{12} & b_1 \\\\ a_{21} & a_{22} & b_2 \\end{array}\\right]',
    'column-vector': '\\mathbf{v} = \\begin{pmatrix} v_1 \\\\ v_2 \\\\ v_3 \\end{pmatrix}',
    'span-set': '\\text{span}\\left\\{\\mathbf{v}_1, \\mathbf{v}_2\\right\\}',
    'linear-system': '\\begin{cases} a_{11}x_1 + a_{12}x_2 + a_{13}x_3 = b_1 \\\\ a_{21}x_1 + a_{22}x_2 + a_{23}x_3 = b_2 \\\\ a_{31}x_1 + a_{32}x_2 + a_{33}x_3 = b_3 \\end{cases}',
    'matrix-equation': 'A\\mathbf{x} = \\mathbf{b}',
    'det-2x2': '\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc',
    'det-3x3': '\\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix}',
    'characteristic-eq': '\\det(A - \\lambda I) = 0',
    'eigenvector-eq': 'A\\mathbf{v} = \\lambda\\mathbf{v}',
    'diagonalization': 'A = PDP^{-1}, \\quad D = \\begin{pmatrix} \\lambda_1 & 0 \\\\ 0 & \\lambda_2 \\end{pmatrix}',
    'gram-schmidt-formula': '\\mathbf{u}_k = \\mathbf{v}_k - \\displaystyle\\sum_{j \\lt k} \\frac{\\mathbf{v}_k \\cdot \\mathbf{u}_j}{\\mathbf{u}_j \\cdot \\mathbf{u}_j}\\mathbf{u}_j'
  };

  document.querySelectorAll('[data-mathjax-placeholder]').forEach(el => {
    const key = el.dataset.mathjaxPlaceholder;
    if (placeholders[key]) el.innerHTML = `\\[${placeholders[key]}\\]`;
  });
}

/* ============================================================
   SECTION 20: MODAL
   ============================================================ */

const ModalController = (() => {
  function open(title, content) {
    const modal = document.getElementById('problem-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modal) return;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) { bodyEl.innerHTML = content; MathRenderer.render(bodyEl); }
    modal.removeAttribute('hidden');
    document.getElementById('modal-close-btn')?.focus();
  }

  function close() {
    const modal = document.getElementById('problem-modal');
    if (modal) modal.setAttribute('hidden', '');
  }

  function init() {
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', close);
    document.getElementById('modal-backdrop')?.addEventListener('click', close);
  }

  return { init, open, close };
})();

/* ============================================================
   SECTION 21: COPY & UTILITY BUTTON HANDLERS
   ============================================================ */

function initUtilityButtons() {
  // Copy problem
  document.getElementById('copy-problem-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('No problem to copy.', 'warning'); return; }
    const text = `${prob.topic} — ${prob.instruction}\n\n${(prob.parts || []).map(p => `(${p.letter}) ${p.content}`).join('\n\n')}`;
    navigator.clipboard?.writeText(text).then(() => ToastManager.show('Problem copied!', 'success')).catch(() => ToastManager.show('Copy failed.', 'error'));
  });

  // Bookmark
  document.getElementById('bookmark-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('No problem to bookmark.', 'warning'); return; }
    ModalController.open('Bookmark Problem', `<p style="color:var(--text-secondary);margin-bottom:var(--space-4);">Bookmarking: <strong>${prob.topic}</strong></p><p style="color:var(--text-muted);font-size:var(--text-sm);">${prob.instruction}</p>`);
    ToastManager.show('Problem bookmarked!', 'success');
  });

  // Clear work area
  document.getElementById('clear-work-btn')?.addEventListener('click', () => {
    const workArea = document.getElementById('student-work-input');
    if (workArea) workArea.textContent = '';
    ToastManager.show('Work area cleared.', 'info', 1500);
  });

  // Mark solved
  document.getElementById('mark-solved-btn')?.addEventListener('click', () => {
    StatsManager.incrementSolved();
    ToastManager.show('Problem marked as solved! ✓', 'success');
  });

  // Reset settings
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    // Uncheck all topic chips
    document.querySelectorAll('input[name="topic"]').forEach(r => r.checked = false);
    // Reset difficulty to intermediate
    const intRadio = document.querySelector('input[name="difficulty"][value="intermediate"]');
    if (intRadio) intRadio.checked = true;
    ToastManager.show('Generator settings reset.', 'info', 1500);
  });

  // Generate similar
  document.getElementById('generate-similar-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('Generate a problem first.', 'warning'); return; }
    // Find the topic radio and check it
    const topicKey = Object.keys(Generators.TOPIC_META).find(k => Generators.TOPIC_META[k].name === prob.topic);
    if (topicKey) {
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || prob.difficulty;
      const newProb = Generators.generate(topicKey, difficulty);
      if (newProb) {
        ProblemDisplay.show(newProb);
        StatsManager.incrementGenerated(newProb.topic, newProb.week, difficulty);
        ProblemHistory.add(newProb);
        updateInfoCard(topicKey);
        ToastManager.show('Similar problem generated!', 'success');
      }
    }
  });

  // Reset session
  document.getElementById('reset-session-btn')?.addEventListener('click', () => {
    StatsManager.reset();
    ToastManager.show('Session reset.', 'info');
  });

  // Timer pause
  document.getElementById('timer-pause-btn')?.addEventListener('click', () => ProblemDisplay.toggleTimer());

  // Reveal answer only
  document.getElementById('reveal-answer-only-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob?.solution?.answer) { ToastManager.show('No answer available.', 'warning'); return; }
    const ansEl = document.getElementById('solution-final-answer');
    if (ansEl) {
      const solContent = document.getElementById('solution-content');
      if (solContent) solContent.setAttribute('aria-hidden', 'false');
      ansEl.scrollIntoView({ behavior: 'smooth' });
      MathRenderer.render(ansEl);
    }
    ProblemDisplay.showSolution();
    StatsManager.incrementViewed();
  });

  // Exam timer pause
  // Download exam as PDF
  document.getElementById('download-exam-pdf-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('download-exam-pdf-btn');
    const examPaper = document.getElementById('exam-paper');

    if (!examPaper) {
      ToastManager.show('No exam to download.', 'warning');
      return;
    }

    const problemsList = document.getElementById('exam-problems-list');
    if (!problemsList || problemsList.hasAttribute('hidden') || problemsList.children.length === 0) {
      ToastManager.show('Generate an exam first.', 'warning');
      return;
    }

    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      ToastManager.show('PDF library not loaded. Check your connection.', 'error');
      return;
    }

    btn.setAttribute('disabled', '');
    btn.querySelector('.action-btn__text').textContent = 'Generating…';
    ToastManager.show('Preparing PDF…', 'info', 3000);

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;

      // Wait for any pending MathJax typesetting to fully complete
      if (window.MathJax?.typesetPromise) {
     await window.MathJax.typesetPromise([examPaper]).catch(() => {});
     // Additional settle time for SVG layout reflow
     await new Promise(resolve => setTimeout(resolve, 400));
      }

   // Temporarily force a white background so canvas renders correctly
   // Snapshot current theme state
const body = document.getElementById('page-body');
const wasLight = body.hasAttribute('data-theme');

// Force light theme on body for capture so all CSS vars resolve to light values
if (!wasLight) {
  body.setAttribute('data-theme', 'light');
  body.classList.remove('theme-dark');
  body.classList.add('theme-light');
}

const originalBg = examPaper.style.background;
const originalColor = examPaper.style.color;
examPaper.style.background = '#ffffff';
examPaper.style.color = '#0f172a';

// Brief reflow so CSS var() re-resolves under the light theme
await new Promise(resolve => setTimeout(resolve, 80));

const canvas = await html2canvas(examPaper, {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  width: examPaper.offsetWidth,
  height: examPaper.scrollHeight,
  windowWidth: window.innerWidth,
  windowHeight: examPaper.scrollHeight,
  scrollX: 0,
  scrollY: -window.scrollY,
  onclone: (doc) => {
    // Ensure the cloned document also has light theme applied
    const cloneBody = doc.getElementById('page-body');
    if (cloneBody) {
      cloneBody.setAttribute('data-theme', 'light');
      cloneBody.classList.remove('theme-dark');
      cloneBody.classList.add('theme-light');
    }
  }
});

// Restore original theme
examPaper.style.background = originalBg;
examPaper.style.color = originalColor;
if (!wasLight) {
  body.removeAttribute('data-theme');
  body.classList.remove('theme-light');
  body.classList.add('theme-dark');
}

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgW = contentW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let yOffset = margin;
      let remainingH = imgH;
      let sourceY = 0;
      const usableH = pageH - margin * 2;

      while (remainingH > 0) {
        const sliceH = Math.min(remainingH, usableH);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceH / imgH) * canvas.height;

        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sliceCanvas.height,
          0, 0,
          canvas.width, sliceCanvas.height
        );

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(sliceData, 'JPEG', margin, yOffset, imgW, sliceH);

        sourceY += sliceCanvas.height;
        remainingH -= sliceH;

        if (remainingH > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`AITU_Linear_Algebra_Exam_${timestamp}.pdf`);
      ToastManager.show('PDF downloaded!', 'success', 3000);
    } catch (err) {
      console.error('[PDF Export]', err);
      ToastManager.show('PDF generation failed. See console for details.', 'error');
    } finally {
      btn.removeAttribute('disabled');
      btn.querySelector('.action-btn__text').textContent = 'Download as PDF';
    }
  });

  // Exam timer pause
  document.getElementById('exam-timer-pause-btn')?.addEventListener('click', () => ExamMode.toggleExamTimer());

  // Reveal all solutions
  document.getElementById('reveal-all-solutions-btn')?.addEventListener('click', () => ExamMode.revealAllSolutions());

  // New exam
  document.getElementById('new-exam-btn')?.addEventListener('click', () => ExamMode.generateExam());

  // Related problem suggestion buttons (delegated)
  document.getElementById('solution-related-suggestions')?.addEventListener('click', (e) => {
    if (e.target.dataset.topic) {
      const topicKey = e.target.dataset.topic;
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';
      const newProb = Generators.generate(topicKey, difficulty);
      if (newProb) {
        ProblemDisplay.show(newProb);
        StatsManager.incrementGenerated(newProb.topic, newProb.week, difficulty);
        ProblemHistory.add(newProb);
        updateInfoCard(topicKey);
      }
    }
  });
}

/* ============================================================
   SECTION 22: SPECIAL TYPE CARD BUTTONS
   ============================================================ */

function initSpecialTypeButtons() {
  const specialBtns = [
    { id: 'gen-matrix-btn', fn: () => Generators.genSpecialMatrix(getChecked('matrix-sub')) },
    { id: 'gen-determinant-btn', fn: () => Generators.genSpecialDeterminant(getChecked('det-sub')) },
    { id: 'gen-linind-btn', fn: () => Generators.genSpecialLinearIndependence(getChecked('linind-sub')) },
    { id: 'gen-transformation-btn', fn: () => Generators.genSpecialTransformation(getChecked('transf-sub')) },
    { id: 'gen-vs-btn', fn: () => Generators.genSpecialVectorSpace(getChecked('vs-sub')) },
    { id: 'gen-basis-btn', fn: () => Generators.genSpecialBasis(getChecked('basis-sub')) },
    { id: 'gen-rank-btn', fn: () => Generators.genSpecialRank(getChecked('rank-sub')) },
    { id: 'gen-eigenvalue-btn', fn: () => Generators.genSpecialEigenvalue(getChecked('eval-sub')) },
    { id: 'gen-eigenvector-btn', fn: () => Generators.genSpecialEigenvector(getChecked('evec-sub')) },
    { id: 'gen-diagonalization-btn', fn: () => Generators.genSpecialDiagonalization(getChecked('diag-sub')) },
    { id: 'gen-orth-btn', fn: () => Generators.genSpecialOrthogonality(getChecked('orth-sub')) },
    { id: 'gen-mixed-btn', fn: () => Generators.genSpecialMixed(getChecked('mixed-sub')) }
  ];

  function getChecked(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
  }

  specialBtns.forEach(({ id, fn }) => {
    document.getElementById(id)?.addEventListener('click', () => {
      const prob = fn();
      if (!prob) { ToastManager.show('Generation failed.', 'error'); return; }
      ProblemDisplay.show(prob);
      StatsManager.incrementGenerated(prob.topic, prob.week, 'intermediate');
      ProblemHistory.add(prob);
      ToastManager.show(`${prob.topic} problem generated!`, 'success');
      document.getElementById('problem-display')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ============================================================
   SECTION 23: MAIN GENERATE BUTTON
   ============================================================ */

function initMainGenerator() {
  const generateBtn = document.getElementById('generate-btn');
   const examMode = document.querySelector('input[name="exam-mode"]:checked')?.value || 'practice';
    StorageManager.set('examMode', examMode);
  if (!generateBtn) return;

  generateBtn.addEventListener('click', () => {
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    if (!topicRadio) { ToastManager.show('Please select a topic first.', 'warning', 2500); return; }

    const topicKey = topicRadio.value;
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';

    generateBtn.classList.add('is-generating');
    generateBtn.setAttribute('aria-busy', 'true');

    setTimeout(() => {
      const prob = Generators.generate(topicKey, difficulty);
      generateBtn.classList.remove('is-generating');
      generateBtn.setAttribute('aria-busy', 'false');

      if (!prob) { ToastManager.show('Problem generation failed. Please try again.', 'error'); return; }

      ProblemDisplay.show(prob);
      StatsManager.incrementGenerated(prob.topic, prob.week, difficulty);
      ProblemHistory.add(prob);
      updateInfoCard(topicKey);
      ToastManager.show(`${prob.topic} problem generated!`, 'success', 2000);

      // Store selected topic
      StorageManager.set('lastTopic', topicKey);
      StorageManager.set('lastDifficulty', difficulty);
    }, 120);
  });

  // Topic chip selection → update info card
  document.querySelectorAll('input[name="topic"]').forEach(radio => {
    radio.addEventListener('change', () => updateInfoCard(radio.value));
  });

  // Difficulty change → update stats display
  document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const meta = Generators.getMeta(document.querySelector('input[name="topic"]:checked')?.value);
      StatsManager.setTopic(meta?.name || '—', meta?.week || '', radio.value);
    });
  });
}

/* ============================================================
   SECTION 24: EXAM GENERATE BUTTON
   ============================================================ */

function initExamGenerator() {
  document.getElementById('generate-exam-btn')?.addEventListener('click', () => {
    ExamMode.generateExam();
    ToastManager.show('Mock exam generated!', 'success', 2000);
  });
}

/* ============================================================
   SECTION 25: RESTORE STATE FROM LOCALSTORAGE
   ============================================================ */

function restoreState() {
  // Restore theme
  ThemeManager.init();

  // Restore difficulty
  const lastDiff = StorageManager.get('lastDifficulty', 'intermediate');
  const diffRadio = document.querySelector(`input[name="difficulty"][value="${lastDiff}"]`);
  if (diffRadio) diffRadio.checked = true;

  // Restore topic
  const lastTopic = StorageManager.get('lastTopic', null);
  if (lastTopic) {
    const topicRadio = document.querySelector(`input[name="topic"][value="${lastTopic}"]`);
    if (topicRadio) { topicRadio.checked = true; updateInfoCard(lastTopic); }
  }

  // Load stats
  StatsManager.load();
  StatsManager.updateUI();
}

/* ============================================================
   SECTION 26: APPLICATION INITIALIZATION
   ============================================================ */

function initApp() {
  try {
    restoreState();
    SidebarController.init();
    WeekModules.init();
    ModalController.init();
    KeyboardShortcuts.init();
    initMainGenerator();
    initExamGenerator();
    initUtilityButtons();
    initSpecialTypeButtons();
    initBackToTop();
    initLatexPalette();
    SearchSystem.init();

    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => ThemeManager.toggle());

    // Reveal solution button
    document.getElementById('reveal-solution-btn')?.addEventListener('click', () => ProblemDisplay.toggleSolution());

    // MathJax initial render for static elements
   document.addEventListener('mathjax-ready', () => {
     initLatexPalette();
     MathRenderer.renderAll();
   });

// Fallback: if MathJax loads before the event system initialises
   if (window.MathJax?.startup?.promise) {
     window.MathJax.startup.promise.then(() => {
       initLatexPalette();
       MathRenderer.renderAll();
     }).catch(() => {});
   }

    // Keyboard shortcut hint toast
    setTimeout(() => {
      ToastManager.show('Keyboard shortcuts: G=Generate · T=Theme · S=Solution · E=Exam', 'info', 4000);
    }, 1500);

    console.log('[LA-GEN] Linear Algebra Problem Generator initialized successfully.');
  } catch (err) {
    console.error('[LA-GEN] Initialization error:', err);
  }
}

/* ============================================================
   SECTION 27: ENTRY POINT
   ============================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
