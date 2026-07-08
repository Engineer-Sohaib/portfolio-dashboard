'use client';

import { useEffect, useRef } from 'react';

/**
 * LegacyBody — renders one page's original body markup verbatim and then
 * boots the *unmodified* vanilla module system (public/js/main.js) against
 * it, exactly the way the static HTML pages did with a trailing
 * <script type="module" src="src/js/main.js">.
 *
 * Why dangerouslySetInnerHTML + manual <script> injection instead of a
 * "real" React rewrite of every module: browsers never execute <script>
 * tags that arrive via innerHTML, so the boot scripts are appended as real
 * DOM nodes here, after the markup they operate on already exists — which
 * is exactly the order the original pages ran in (HTML parsed top-to-bottom,
 * <script type="module"> at the very end of <body>).
 */
export default function LegacyBody({ html, authBody = false, needsCanvasJs = false }) {
  const containerRef = useRef(null);
  const scriptsRef = useRef([]);

  useEffect(() => {
    // Preserve the original `body.pa-auth-body` CSS scoping (auth/*.html
    // pages set this class directly on <body>; Next.js's root layout owns
    // <body>, so it's toggled here instead).
    if (authBody) document.body.classList.add('pa-auth-body');

    function appendScript(src, type) {
      const s = document.createElement('script');
      if (type) s.type = type;
      s.src = src;
      document.body.appendChild(s);
      scriptsRef.current.push(s);
      return s;
    }

    function bootMain() {
      appendScript('/js/main.js', 'module');
    }

    if (needsCanvasJs) {
      // CanvasJS is a classic (non-module) global script that DashboardModule
      // expects to be loaded and evaluated before main.js runs.
      const canvasScript = appendScript('/js/vendor/canvasjs.min.js');
      canvasScript.onload = bootMain;
    } else {
      bootMain();
    }

    return () => {
      scriptsRef.current.forEach((s) => s.remove());
      scriptsRef.current = [];
      if (authBody) document.body.classList.remove('pa-auth-body');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
