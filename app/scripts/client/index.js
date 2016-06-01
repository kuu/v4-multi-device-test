function setUpPlayer(format, plugin, flashEnabled, embedCode, params) {
  return new Promise ((fulfill, reject) => {
    OO.ready(() => {
      const button = document.querySelector('#button-' + format);
      const radios = document.getElementsByName(format);

      button.addEventListener('click', function onClick(e) {
        button.removeEventListener('click', onClick, false);
        button.disabled = true;
        const values = Array.prototype.filter.call(radios, (radio) => radio.checked);
        fetch(`/${plugin}?result=${values[0].value}&format=${format}&flash=${flashEnabled}`);
      });

      fulfill(OO.Player.create('container-' + format, embedCode, params));
    });
  });
}

function renderResult(container) {
  return fetch('/data')
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    container.innerHTML = '';

    Object.keys(json).forEach((key) => {

      const div = document.createElement('div');
      div.classList.add('jumbotron');

      const h4 = document.createElement('h4');
      h4.textContent = key;
      container.appendChild(h4);

      const table = document.createElement('table');
      const guide = `
        <tr>
          <th>format</th>
          <th>device</th>
          <th>os</th>
          <th>browser</th>
          <th>total success</th>
          <th>total failure</th>
        </tr>
      `;

      const thead = document.createElement('thead');
      thead.innerHTML = guide;
      table.appendChild(thead);

      const tfoot = document.createElement('tfoot');
      tfoot.innerHTML = guide;
      table.appendChild(tfoot);

      const tbody = document.createElement('tbody');
      const formatObj = json[key];
      Object.keys(formatObj).forEach((format) => {
        const list = formatObj[format];
        list.forEach((item) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <th>${format}</th>
            <th>${item.device}</th>
            <th>${item.os}</th>
            <th>${item.browser} (flash=${item.flash === 'true' ? 'on' : 'off'})</th>
            <th>${item.success}</th>
            <th>${item.failure}</th>
          `;
          tbody.appendChild(tr);
        });
      });

      table.appendChild(tbody);

      div.appendChild(table);
      container.appendChild(div);
    });
  })
}
