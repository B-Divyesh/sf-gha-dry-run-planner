# Visual thesis: glacial minimal ceramics

`ghaplan` turns a tangled workflow into a calm, inspectable plan. Its visual
world borrows from a thin porcelain analysis tray left on blue glacial stone:
quiet off-white planes, hairline blue-grey boundaries, small mineral status
marks, and one dark ink color. The interface should feel precise enough for
code, but handled rather than machined.

## Palette

Light is the primary treatment. `ice` #F2F7F6 is the page, `porcelain`
#FCFDFC is the work surface, `ink` #152927 is text, `slate` #526764 is muted
text, and `hairline` #CAD8D5 separates layers. `cobalt` #125E72 is the action
accent with white text. Planning states use `lichen` #286748 for run,
`amber-clay` #8A5A18 for warning, and `oxide` #9A3E3E for skip/error. All
foreground/background combinations used for body copy meet 4.5:1.

Dark treatment uses `deep-ice` #0D1918, `kiln` #142321, `chalk` #E8F1EF,
`mist` #A7BBB7, and `rim` #39504C. Cobalt lifts to #79B8C6. It is selected by
the device preference; the explicit painted backgrounds keep browser chrome
from leaking through.

## Type and spacing

The product uses system faces only: ui-sans-serif for human explanation and
ui-monospace for workflow source, expressions, and resolved values. This
avoids a font request and makes the tool feel native in an editor-adjacent
workflow. The scale is 12, 14, 16, 20, 28, and clamp(40, 7vw, 76) pixels.
Body copy is at least 16px. Spacing follows an 8px rhythm with 4px optical
adjustments; the maximum reading measure is 72ch.

## Shape, depth, and interaction grammar

The signature form is a softly irregular ceramic slab: large 20–28px corners,
an inset top highlight, and a compact grounded shadow. Nested plan rows use a
straight left rail and circular mineral markers instead of generic cards.
Controls are 44px or taller. Focus appears as a 3px cobalt ring with an ice
offset. Primary buttons depress by one pixel; plan rows disclose vertically
from their source node. Labels use sentence case.

The mobile composition drops the decorative source fragment and stacks the
event controls before the workflow input. The plan becomes one continuous
rail, avoiding horizontal scrolling except inside source code.

## Motion

Interface motion lasts 160–240ms and changes only opacity and transform:
results lift from the analysis surface, while status dots scale once when a
new plan arrives. Nothing loops. Under `prefers-reduced-motion: reduce`, all
transitions and smooth scrolling become instant.

## Original asset plan and provenance

The hero uses one original, text-free raster still: a top-down porcelain tray
with three shallow branching channels and mineral-green/oxide pebbles,
suggesting a workflow DAG without turning into a literal UI screenshot. It is
generated for this product with the factory image deployment through
`/opt/fleet/lib/gen-image.sh`, then converted locally to WebP at responsive
sizes (no external assets or licenses). Final prompt and generation metadata
are stored beside the source asset. All remaining marks and icons are
hand-authored inline SVG/CSS, MIT-licensed with this repository.

The social image (`site/public/assets/og-ceramic.png`) and Apple touch icon are
local crops of that same generated porcelain source. They add no external
asset, font, script, or license.
