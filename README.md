# Player V4 multi-device test

## Prerequisite
shell, git, node (npm v3.x)


## Install
```
$ git clone git@github.com:kuu/v4-multi-device-test.git
$ cd v4-multi-device-test
$ npm install
```

## Configure
Input the version of Ooyala player you want to test:
```
$ vi gulpfile.babel.js
...
const OOYALA_VERSION = '4.5.5'
...
```

## Build & Run
```
$ npm run build && npm start
Open http://localhost:8080 with your browser.
```
