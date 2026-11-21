import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseUxPlayLine } from '../src/main/uxplayParser'
import { buildUxPlayArgs } from '../src/main/uxplayArgs'
import { DEFAULT_SETTINGS } from '../src/shared/types'

const types = (line: string) => parseUxPlayLine(line).map((e) => e.type)

test('server ready', () => {
  assert.deepEqual(types('Initialized server socket(s)'), ['ready'])
})

test('connection request with device name and model', () => {
  const [ev] = parseUxPlayLine(`connection request from Alon's iPhone (iPhone15,2) with deviceID = 11:22:33:44:55:66`)
  assert.deepEqual(ev, { type: 'connected', name: "Alon's iPhone", model: 'iPhone15,2' })
})

test('connection request is not reported as an error', () => {
  assert.ok(!types('connection request from Unable iPhone (iPhone15,2)').includes('error'))
})

test('mirroring start', () => {
  assert.deepEqual(types('Begin streaming to GStreamer video pipeline'), ['mirroring'])
})

test('open connections → disconnected at zero', () => {
  assert.deepEqual(types('Open connections: 1'), ['openConnections'])
  assert.deepEqual(types('Open connections: 0'), ['openConnections', 'disconnected'])
})

test('bonjour error is recognised', () => {
  const ev = parseUxPlayLine('DNSServiceRegister call returned kDNSServiceErr_Unknown, failed to register').find((e) => e.type === 'error')
  assert.ok(ev && ev.type === 'error' && ev.friendly === 'bonjour')
})

test('port in use error is recognised', () => {
  const ev = parseUxPlayLine('Error: bind() failed: Address already in use').find((e) => e.type === 'error')
  assert.ok(ev && ev.type === 'error' && ev.friendly === 'port')
})

test('PIN line', () => {
  assert.ok(parseUxPlayLine('*** CLIENT MUST NOW ENTER PIN = "4821" AS AIRPLAY PASSWORD').some((e) => e.type === 'pin' && e.pin === '4821'))
})

test('blank lines produce nothing', () => {
  assert.deepEqual(parseUxPlayLine('   '), [])
})

test('default args', () => {
  assert.deepEqual(buildUxPlayArgs(DEFAULT_SETTINGS), ['-n', 'PhoneMiror', '-nh', '-s', '1920x1080', '-fps', '60', '-vs', 'd3d11videosink'])
})

test('args for audio off, fullscreen, fixed pin, debug', () => {
  const args = buildUxPlayArgs({ ...DEFAULT_SETTINGS, audio: false, fullscreen: true, requirePin: true, pin: '1234', debugLog: true, videoSink: '' })
  assert.deepEqual(args.slice(7), ['-a', '-fs', '-pin', '1234', '-d'])
})

test('random pin when pin is not 4 digits', () => {
  const args = buildUxPlayArgs({ ...DEFAULT_SETTINGS, requirePin: true, pin: '12' })
  assert.equal(args[args.length - 1], '-pin')
})
