# cc-mod-input-reset-repro

A `Pane` with an `Input` drawn with `value={state.text}`, updated in `onInput`, plus a 200 ms timer that invalidates `ui.render` (as a spinner or a live poll would). A redraw that lands between a keystroke and the mod hearing about it draws the older value, and the host appears to discard its edit buffer, so the newest character vanishes.

## Environment

- Claude Code 2.1.300 (still present in 2.1.302), terminal surface
- macOS; seen in Zed's integrated terminal
- Mod API: `ui.render` hook drawing a `Pane` with the `Input` element

## Install and run

From a terminal session, at the prompt:

```
/plugin install cc-mod-input-reset-repro --marketplace bassic-nerd/cc-mod-input-reset-repro
```

Answer `y` to add the marketplace, then pick a scope. Or load it straight from a clone, for one session:

```
git clone https://github.com/bassic-nerd/cc-mod-input-reset-repro
claude --plugin-dir ./cc-mod-input-reset-repro
```

Then run the slash command `/input-reset`. It opens a pane and gives it the keyboard.

The whole mod is one file, [`hooks/register.tsx`](hooks/register.tsx).

## Repro steps

1. Run `/input-reset`. The pane shows a target sentence, an `Input`, a status line and a `workaround` toggle (off).
2. Type the target sentence at normal speed: `the quick brown fox jumps over the lazy dog`. Do it a few times; clear the field between attempts by pressing the toggle twice.
3. The status line reads `ok` while what you typed is still a prefix of the target, and `MISMATCH at N` once a character is missing.
4. Press the toggle to turn the workaround on and repeat the typing.

## Expected

Every typed character lands in the field, in order, whether or not the mod redraws meanwhile.

## Actual

- With the workaround off, the status line occasionally flips to `MISMATCH`: the newest character was dropped. It does not appear in the main prompt; it just vanishes.
- It is intermittent and more likely at a normal-to-fast typing speed.
- With the workaround on, the same typing does not drop characters.

## What the toggle changes

- Off (bug): the `Input` is drawn with `value={state.text}`, the value the mod last heard. Between a keystroke and `onInput` running, a timer redraw draws the previous value.
- On (workaround): the `Input` is drawn with a constant `value=""`, a seed that only changes programmatically (the toggle also gives the `Input` a fresh `key`). A redraw never carries a different `value`, and the typed text survives. The status line is still driven by `onInput`.

So `value` is not only a seed: drawing a changed `value` appears to replace what the person has typed. The types describe `value` as "the text the field holds when drawn; the person's typing replaces it until the hook draws another", which allows this reading, but it makes a lagging `value` a data-loss hazard.


## Checks

```
claude plugin validate .
claude plugin test .
```

```
tsc --noEmit -p .
```

(the last needs the API types in `.claude-plugin/types/`, which Claude Code lays beside a mod it loads from a folder.)

License: MIT.
