const path = require('path');
const { platform } = require('os');
const { remote } = require('electron');
const { rootPath } = require('electron-root-path');

const process = remote.process
const IS_PROD = process.env.NODE_ENV === 'production';
const root = rootPath;
const { getAppPath } = remote.app;
const isPackaged =
    process.mainModule.filename.indexOf('app.asar') !== -1;

const binariesPath =
    IS_PROD && isPackaged
        ? path.join(path.dirname(getAppPath()), './bin', platform())
        : path.join(root, './src/bin', platform());


exports.execPath = path.resolve(path.join(binariesPath, './grpcurl'));