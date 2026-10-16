import { expect, test } from 'claude-code/testing'

const mount = ($: any) =>
  $.ui.mount({
    plugin: 'cc-mod-input-reset-repro',
    component: 'Pane',
    requestId: 'input-reset',
    surface: 'terminal',
    viewport: { columns: 100, rows: 30 },
    props: { bodyColumns: 82 },
  })

const status = async (ui: any) => (await ui.find({ type: 'Text', text: /typed \d+ chars/ }))?.text as string

test('typing a prefix of the target reports ok', async $ => {
  const ui = await mount($)
  await ui.input({ key: 'text:0', text: 'the quick', kind: 'change' })
  expect(await status(ui)).toContain('typed 9 chars: ok')
  await ui.unmount()
})

test('a wrong character is reported as a mismatch', async $ => {
  const ui = await mount($)
  await ui.input({ key: 'text:0', text: 'the quack', kind: 'change' })
  expect(await status(ui)).toContain('MISMATCH at 6')
  await ui.unmount()
})

test('bug mode redraws the typed text as the value; the workaround keeps a constant seed', async $ => {
  const ui = await mount($)
  await ui.input({ key: 'text:0', text: 'the', kind: 'change' })
  expect((await ui.find({ key: 'text:0' }))?.props.value).toBe('the')
  await ui.press({ key: 'toggle' })
  await ui.input({ key: 'text:1', text: 'the', kind: 'change' })
  expect((await ui.find({ key: 'text:1' }))?.props.value).toBe('')
  await ui.unmount()
})
