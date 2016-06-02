import path from 'path';
import express from 'express';
import useragent from 'express-useragent';
import JsonDB from 'node-json-db';

const app = express();
const port = process.env.PORT || 8080;
const BASE_DIR = path.join(__dirname, '../../../');
const db = new JsonDB('db', true, false);

app.use(express.static(BASE_DIR + 'dist'));
app.use(useragent.express());

const VALUES = {
  device: [
    'pc', 'tablet', 'phone', 'unknown'
  ],
  os: [
    'windows', 'mac', 'linux', 'ios', 'android', 'unknown'
  ],
  browser: [
    'chrome', 'firefox', 'safari', 'ie', 'edge', 'unknown'
  ],
  flash: [
    'true', 'false'
  ]
};

function getDevice(ua) {
  if (ua.isDesktop) {
    return VALUES.device[0];
  } else if (ua.isTablet) {
    return VALUES.device[1];
  } else if (ua.isMobile) {
    return VALUES.device[2];
  } else {
    return VALUES.device[3];
  }
}

function getOS(ua) {
  if (ua.isWindows) {
    return VALUES.os[0];
  } else if (ua.isMac) {
    return VALUES.os[1];
  } else if (ua.isLinux || ua.isLinux64) {
    return VALUES.os[2];
  } else if (ua.isiPad || ua.isiPod || ua.isiPhone) {
    return VALUES.os[3];
  } else if (ua.isAndroid) {
    return VALUES.os[4];
  } else {
    return VALUES.os[5];
  }
}

function getBrowser(ua) {
  if (ua.isChrome) {
    return VALUES.browser[0];
  } else if (ua.isFirefox) {
    return VALUES.browser[1];
  } else if (ua.isSafari) {
    return VALUES.browser[2];
  } else if (ua.isIE || ua.isIECompatibilityMode) {
    return VALUES.browser[3];
  } else if (ua.isEdge) {
    return VALUES.browser[4];
  } else {
    return VALUES.browser[5];
  }
}

function compareValues(a, b, key) {
  const aIndex = VALUES[key].indexOf(a[key]);
  const bIndex = VALUES[key].indexOf(b[key]);

  if (aIndex < bIndex) {
    return -1;
  } else if (aIndex === bIndex){
    return 0;
  } else {
    return 1;
  }
}

function parseUA(ua) {
  return {
    device: getDevice(ua),
    os: getOS(ua),
    browser: getBrowser(ua)
  };
}

function writeDB(path, obj) {
  let entry;

  // Read DB.
  try {
    entry = db.getData(path) || [];
  } catch (e) {
    entry = [];
  }

  // Write DB.
  try {
    entry.push(obj);
    db.push(path, entry);
    return true;
  } catch (e) {
    console.error(`Failed to write data to ${path}. ${e.stack}`);
    return false;
  }
}

function processData(data) {
  const pluginObj = {};

  Object.keys(data).forEach((plugin) => {
    const formatMap = new Map();
    const list = data[plugin];
    list.forEach(({format, device, os, browser, flash, result}) => {
      const key = [device, os, browser, flash].join('');
      const map = formatMap.get(format);

      if (map) {
        const entry = map.get(key);
        if (entry) {
          if (result === 'success') {
            entry.success++;
          } else {
            entry.failure++;
          }
        } else {
          map.set(key, {
            device, os, browser, flash,
            success: result === 'success' ? 1 : 0,
            failure: result === 'failure' ? 1 : 0
          });
        }
      } else {
        const newMap = new Map();
        newMap.set(key, {
          device, os, browser, flash,
          success: result === 'success' ? 1 : 0,
          failure: result === 'failure' ? 1 : 0
        });
        formatMap.set(format, newMap);
      }
    });

    const formatObj = {};

    for (const [format, map] of formatMap.entries()) {
      const results = Array.from(map.values()).sort((a, b) => {
        for (const key of ['device', 'os', 'browser', 'flash']) {
          const ret = compareValues(a, b, key);
          if (ret === 0) {
            continue;
          }
          return ret;
        }
        return 0;
      });
      formatObj[format] = Array.from(results);;
    }
    pluginObj[plugin] = formatObj;
  });

  return pluginObj;
}

app.get('/data', (req, res) => {
  let data;
  // Read DB
  try {
    data = db.getData('/') || {};
  } catch (e) {
    data = {};
  }
  res.status(200).json(processData(data));
});

app.get('/bit_wrapper', (req, res) => {
  const query = req.query;
  const ua = req.useragent;
  const {device, os, browser} = parseUA(ua);
  const obj =  {
    format: query.format,
    device,
    os,
    browser,
    flash: query.flash,
    result: query.result,
    ua: ua.source
  };

  console.log('REQUEST: /bit_wrapper', obj);

  if (writeDB('/bit_wrapper', obj)) {
    res.status(200);
  } else {
    res.status(500);
  }
});

app.get('/main_html5', (req, res) => {
  const query = req.query;
  const ua = req.useragent;
  const {device, os, browser} = parseUA(ua);
  const obj =  {
    format: query.format,
    device,
    os,
    browser,
    flash: query.flash,
    result: query.result,
    ua: ua.source
  };

  console.log('REQUEST: /main_html5', obj);

  if (writeDB('/main_html5', obj)) {
    res.status(200);
  } else {
    res.status(500);
  }
});

app.get('/osmf_flash', (req, res) => {
  const query = req.query;
  const ua = req.useragent;
  const {device, os, browser} = parseUA(ua);
  const obj =  {
    format: query.format,
    device,
    os,
    browser,
    flash: query.flash,
    result: query.result,
    ua: ua.source
  };

  console.log('REQUEST: /osmf_flash', obj);

  if (writeDB('/osmf_flash', obj)) {
    res.status(200);
  } else {
    res.status(500);
  }
});

// Start server
//if (require.main === module) {
  console.log('Server listening on port %s', port);
  app.listen(port);
//}

export default app;
