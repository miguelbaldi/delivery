const _ = require('lodash/core');

const logsCache = [];
const MAX_LOG_LIMIT = 100;

const CACHE_LIMIT = 2000;

exports.codeMirrorConfig = {
  indentWithTabs: false,
  tabSize: 2,
  lineNumbers: true,
  theme: 'monokai',
  smartIndent: true,
};

function retrieveMethodCache() {
  try {
    return JSON.parse(localStorage.getItem('methodCache')) || [];
  } catch (_) {
    return [];
  }
}

function retrieveStateCache() {
  try {
    return JSON.parse(localStorage.getItem('stateCache')) || [];
  } catch (_) {
    return [];
  }
}

let methodCache = retrieveMethodCache();
let stateCache = retrieveStateCache();

function getCacheWithoutOldMethod(newMethod) {
  return methodCache
    .filter(method => !(method.path === newMethod.path && method.url === newMethod.url));
}

function getOldMethod(newMethod) {
  return _.defaults({}, methodCache
    .filter(method => method.path === newMethod.path && method.url === newMethod.url)[0] || {});
}

function storeMethodCache(newMethodCache) {
  localStorage.setItem('methodCache', JSON.stringify(newMethodCache));
}

function updateMethodCache(newMethod) {
  const updatedMethod = _.defaults(newMethod, getOldMethod(newMethod));
  methodCache = getCacheWithoutOldMethod(newMethod);
  if (methodCache.length > CACHE_LIMIT) {
    methodCache.shift();
  }
  methodCache.push(updatedMethod);
  storeMethodCache(methodCache);
}

function storeStateCache(newStateCache) {
  localStorage.setItem('stateCache', JSON.stringify(newStateCache));
}

function updateStateCache(newState) {
  stateCache.push(newState);
  if (stateCache.length > CACHE_LIMIT) {
    stateCache.shift();
  }
  storeStateCache(stateCache);
}

function equals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
exports.equals = equals;

const methodEvent = document.createElement('div');
const stateEvent = document.createElement('div');
const logsEvent = document.createElement('div');
exports.methodEvent = methodEvent
exports.stateEvent = stateEvent
exports.logsEvent = logsEvent

function dispatchLogsChanged() {
  const logs = getLogs();
  const event = new CustomEvent('change', { detail: { logs } });
  logsEvent.dispatchEvent(event);
}
exports.dispatchLogsChanged = dispatchLogsChanged;

function getLogs() {
  return logsCache
    .map(args => [...args]
      .map(arg => JSON.stringify(arg))
      .reduce((a, b) => a + ' ' + b))
    .reduce((a, b) => a + '\n' + b, '');
}
exports.getLogs = getLogs;

function log() {
  if (logsCache.length > MAX_LOG_LIMIT) {
    logsCache.shift();
  } else {
    logsCache.push(arguments);
  }
  console.log.apply(this, arguments);
  dispatchLogsChanged();
}
exports.log = log;

function dispatchMethodCacheChanged() {
  const methods = getMethodCache();
  const event = new CustomEvent('change', { detail: { methods } });
  methodEvent.dispatchEvent(event);
}
exports.dispatchMethodCacheChanged = dispatchMethodCacheChanged;

function dispatchStateCacheChanged() {
  const state = getState();
  const event = new CustomEvent('change', { detail: { state } });
  stateEvent.dispatchEvent(event);
}

function setMethodWithoutDispatch(newMethod) {
  const oldMethod = getOldMethod(newMethod);
  if (!equals(oldMethod, newMethod)) {
    updateMethodCache(newMethod);
  }
}

function setMethod(newMethod) {
  setMethodWithoutDispatch(newMethod);
  dispatchMethodCacheChanged();
}
exports.setMethod = setMethod;

function setMethods(newMethods) {
  newMethods.forEach(method => setMethodWithoutDispatch(method));
  dispatchMethodCacheChanged();
}
exports.setMethods = setMethods;

function getMethod(path, url) {
  return methodCache.filter(method => method.url === url && method.path === path)[0];
}
exports.getMethod = getMethod;

function getMethodCache() {
  return methodCache || [];
}
exports.getMethodCache = getMethodCache;

function setState(newState) {
  const baseState = {
    url: null,
    method: null,
    id: null,
    body: null,
  };
  const newStateNormalized = _.defaults(newState, baseState);
  const oldState = getState();
  const oldStateNormalized = _.defaults(oldState, baseState);
  if (newStateNormalized.url === oldStateNormalized.url &&
    newStateNormalized.method === oldStateNormalized.method &&
    // if no id state and similar dont do stuff
    (!newStateNormalized.id || newStateNormalized.id === oldStateNormalized.id)) {
    return;
  }
  updateStateCache(newState);
  dispatchStateCacheChanged();
}
exports.setState = setState;

function getState() {
  return stateCache[stateCache.length - 1] || {
    url: null,
    method: null,
  };
}
exports.getState = getState

function getId() {
  return Math.round((new Date().getTime() * 1000) + (Math.random() * 100));
}
exports.getId = getId;

function getUrls() {
  return stateCache.filter(url => !!url).map(state => state.url);
}
exports.getUrls = getUrls;

function setBody(path, url, newBody) {
  const method = getMethod(path, url);
  if (method) {
    let body = newBody;
    try {
      body = JSON.parse(newBody);
    } catch (ignored) { /* ignored */ }
    const newMethod = _.defaults({ body }, method);
    setMethodWithoutDispatch(newMethod);
  }
}
exports.setBody = setBody;
