const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9231',
  'https://geo.santafeciudad.gov.ar/geo/catastral/gestioncatastral/inicio'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9231/json/list', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const list = JSON.parse(data);
      const page = list[0];
      if (!page) { edge.kill(); return; }

      const ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Network.enable' }));

        // Wait 4s, click map center or search
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                // Click near map center to click a parcel
                const mapEl = document.getElementById('map') || document.querySelector('.ol-viewport') || document.querySelector('.leaflet-container') || document.body;
                const rect = mapEl.getBoundingClientRect();
                const evt = new MouseEvent('click', {
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2,
                  bubbles: true
                });
                mapEl.dispatchEvent(evt);
                return 'Clicked map center: ' + (rect.left + rect.width / 2) + ', ' + (rect.top + rect.height / 2);
              })()`,
              returnByValue: true
            }
          }));
        }, 4000);

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                // Return popups, modals, tables, or info boxes currently in DOM
                const infoEls = document.querySelectorAll('.popup, .popover, .modal, .ol-popup, .panel, table, [id*="info"], [class*="info"], [class*="parcela"]');
                return Array.from(infoEls).map(el => ({ tag: el.tagName, id: el.id, class: el.className, text: el.innerText.trim() })).filter(x => x.text.length > 0);
              })()`,
              returnByValue: true
            }
          }));
        }, 7000);

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 9000);
      };

      ws.onmessage = (msg) => {
        const resp = JSON.parse(msg.data);
        if (resp.method === 'Network.requestWillBeSent') {
          const url = resp.params.request.url;
          if (url.includes('catastr') || url.includes('parcela') || url.includes('wfs') || url.includes('geoserver') || url.includes('GetFeatureInfo') || url.includes('padron')) {
            console.log('NETWORK URL:', url);
          }
        }
        if (resp.id === 2) {
          console.log('Click result:', resp.result?.result?.value);
        }
        if (resp.id === 3) {
          console.log('DOM Info elements:', JSON.stringify(resp.result?.result?.value, null, 2));
        }
        if (resp.id === 4 && resp.result?.data) {
          fs.writeFileSync('C:\\Users\\Casa\\.gemini\\antigravity-ide\\brain\\cfa0f1dc-6f07-47a8-87e1-f6fd3f0b50d4\\portal_catastral_clicked.png', Buffer.from(resp.result.data, 'base64'));
          console.log('Screenshot saved to portal_catastral_clicked.png');
          edge.kill();
        }
      };
    });
  });
}, 2500);
