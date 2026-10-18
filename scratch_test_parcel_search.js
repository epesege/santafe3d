const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9234',
  'https://geo.santafeciudad.gov.ar/geo/catastral/gestioncatastral/inicio'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9234/json/list', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const list = JSON.parse(data);
      const page = list.find(p => p.url.includes('geo.santafeciudad'));
      if (!page) { edge.kill(); return; }

      const ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.onopen = () => {
        // Evaluate: type into #test_v1 and select
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                const inp = document.getElementById('test_v1');
                if (inp) {
                  inp.focus();
                  inp.value = '142850';
                  inp.dispatchEvent(new Event('input', { bubbles: true }));
                  return 'Typed 142850';
                }
                return 'input not found';
              })()`,
              returnByValue: true
            }
          }));
        }, 3000);

        // Wait 2s for autocomplete dropdown, then click the suggestion
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                const item = document.querySelector('.typeahead__item a, .typeahead__list li a');
                if (item) {
                  item.click();
                  return 'Clicked typeahead suggestion: ' + item.innerText;
                }
                return 'no typeahead item found';
              })()`,
              returnByValue: true
            }
          }));
        }, 5500);

        // Wait 3s and inspect #_parcela_details or entire page text
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                const det = document.getElementById('_parcela_details');
                const panel = document.getElementById('_parcela_details_padron');
                return {
                  detailsHtml: det ? det.innerHTML : null,
                  detailsText: det ? det.innerText : null,
                  panelDisplay: panel ? getComputedStyle(panel).display : null,
                  bodyText: document.body.innerText.slice(0, 3000)
                };
              })()`,
              returnByValue: true
            }
          }));
        }, 8500);

        // Capture screenshot
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 10000);
      };

      ws.onmessage = (msg) => {
        const resp = JSON.parse(msg.data);
        if (resp.id === 1) console.log('Step 1:', resp.result?.result?.value);
        if (resp.id === 2) console.log('Step 2:', resp.result?.result?.value);
        if (resp.id === 3) {
          console.log('Step 3 details:\n', JSON.stringify(resp.result?.result?.value, null, 2));
        }
        if (resp.id === 4 && resp.result?.data) {
          fs.writeFileSync('C:\\Users\\Casa\\.gemini\\antigravity-ide\\brain\\cfa0f1dc-6f07-47a8-87e1-f6fd3f0b50d4\\portal_catastral_searched_parcel.png', Buffer.from(resp.result.data, 'base64'));
          console.log('Saved portal_catastral_searched_parcel.png');
          edge.kill();
        }
      };
    });
  });
}, 2500);
