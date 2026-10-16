import type { Register } from 'claude-code'

const PANE = 'input-reset'
const TARGET = 'the quick brown fox jumps over the lazy dog'

// Module state is enough for a repro; a hot reload resets it.
const state = { text: '', workaround: false, epoch: 0, timer: false }

// First index where `text` stops being a prefix of TARGET, or -1 while it still is one.
export const mismatchAt = (text: string): number => {
  for (let i = 0; i < text.length; i++) if (text[i] !== TARGET[i]) return i
  return -1
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'input-reset', description: 'Open the Input reset repro pane' })
    return next(e)
  })

  on('command.run', { command: 'input-reset' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Input reset', focus: true })
    if (!state.timer) {
      state.timer = true
      // A redraw every 200 ms, as a spinner or a live-refresh poll would cause.
      $.clock.every(200, () => $.ui.invalidate('ui.render'))
    }
    return { text: 'Input reset pane opened. Type the target sentence at normal speed.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)
    const { Box, Text, Input, Button } = $.ui.resolve(e)
    const bad = mismatchAt(state.text)
    // Bug mode draws the value the mod last heard. Workaround mode draws a seed that only
    // changes programmatically (the toggle), so a redraw never carries a different value.
    const value = state.workaround ? '' : state.text
    return (
      <Box flexDirection="column">
        <Text dimColor>Type, at normal speed: {TARGET}</Text>
        <Input
          key={`text:${state.epoch}`}
          autoFocus
          placeholder="type here"
          value={value}
          onInput={v => {
            state.text = v
            $.ui.invalidate('ui.render')
          }}
          onSubmit={() => {}}
        />
        <Text>
          typed {state.text.length} chars: {bad < 0 ? 'ok, still a prefix of the target' : `MISMATCH at ${bad} (a character was dropped)`}
        </Text>
        <Button
          key="toggle"
          onPress={() => {
            state.workaround = !state.workaround
            state.text = ''
            state.epoch++
            $.ui.invalidate('ui.render')
          }}
        >
          workaround (constant seed): {state.workaround ? 'on' : 'off'}
        </Button>
      </Box>
    )
  })
}
