// Prepend module search paths & global resolver hook for Vercel Serverless environment
const _path = require('path');
const _fs = require('fs');
const _Module = require('module');

const _candidatePaths = [
  _path.join(__dirname, 'node_modules'),
  _path.join(__dirname, '..', 'node_modules'),
  _path.join(__dirname, '..', 'backend', 'node_modules'),
  _path.join(process.cwd(), 'node_modules'),
  _path.join(process.cwd(), 'backend', 'node_modules'),
  '/var/task/node_modules',
  '/var/task/backend/node_modules',
  '/var/task/dist/node_modules'
];

_candidatePaths.forEach(p => {
  if (_Module.globalPaths && !_Module.globalPaths.includes(p)) {
    _Module.globalPaths.unshift(p);
  }
});

process.env.NODE_PATH = _candidatePaths.concat(process.env.NODE_PATH ? [process.env.NODE_PATH] : []).join(_path.delimiter);
if (_Module._initPaths) {
  _Module._initPaths();
}

if (!_Module.__hookInstalled) {
  _Module.__hookInstalled = true;
  const _originalResolveFilename = _Module._resolveFilename;
  _Module._resolveFilename = function (request, parent, isMain, options) {
    try {
      return _originalResolveFilename.call(this, request, parent, isMain, options);
    } catch (err) {
      if (!request.startsWith('.') && !request.startsWith('/')) {
        for (const basePath of _candidatePaths) {
          try {
            const direct = _path.join(basePath, request);
            return _originalResolveFilename.call(this, direct, parent, isMain, options);
          } catch {}
        }
      }
      throw err;
    }
  };
}

// Static references so Vercel's NFT (Node File Trace) traces packages
require('reflect-metadata');
require('@nestjs/core');
require('@nestjs/common');
require('@nestjs/platform-express');

let handler;
try {
  handler = require('../dist/main');
} catch (err) {
  console.error("Initialization crash:", err);
  handler = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'CRASH_ON_REQUIRE',
      message: err.message,
      stack: err.stack,
      code: err.code
    }));
  };
}

module.exports = handler.default || handler;
module.exports.default = module.exports;
