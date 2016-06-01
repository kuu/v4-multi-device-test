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

function getDevice(ua) {
  if (ua.isTablet) {
    return 'tablet';
  } else if (ua.isMobile) {
    return 'phone';
  } else if (ua.isDesktop) {
    return 'pc';
  } else {
    return 'unknown';
  }
}

function getOS(ua) {
  if (ua.isiPad || ua.isiPod || ua.isiPhone) {
    return 'ios';
  } else if (ua.isAndroid) {
    return 'android';
  } else if (ua.isWindows) {
    return 'windows';
  } else if (ua.isMac) {
    return 'mac';
  } else if (ua.isLinux || ua.isLinux64) {
    return 'linux';
  } else {
    return 'unknown';
  }
}

function getBrowser(ua) {
  if (ua.isIE || ua.isIECompatibilityMode) {
    return 'ie';
  } else if (ua.isEdge) {
    return 'edge';
  } else if (ua.isSafari) {
    return 'safari';
  } else if (ua.isFirefox) {
    return 'firefox';
  } else if (ua.isChrome) {
    return 'chrome';
  } else {
    return 'unknown';
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

app.get('/data', (req, res) => {
  let data;
  // Read DB
  try {
    data = db.getData('/') || {};
  } catch (e) {
    data = {};
  }

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
      formatObj[format] = Array.from(map.values());;
    }
    pluginObj[plugin] = formatObj;
  });
  res.status(200).json(pluginObj);
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
