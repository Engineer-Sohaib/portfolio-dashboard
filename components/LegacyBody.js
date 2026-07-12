'use client';

import { useEffect, useRef } from 'react';

/**
 * LegacyBody — renders one page's original body markup verbatim and then
 * boots the *unmodified* vanilla module system (public/js/main.js) against
 * it, exactly the way the static HTML pages did with a trailing
 * <script type="module" src="src/js/main.js">.
 *
 */
export default function LegacyBody({ html, authBody = false, needsCanvasJs = false }) {
  const containerRef = useRef(null);
  const scriptsRef = useRef([]);

  useEffect(() => {
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
  }, []);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
