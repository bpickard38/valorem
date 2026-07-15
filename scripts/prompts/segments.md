# OpenArt prompt library — Valorem film segments

Account refs (openart_upload_list ids):

| Ref | Upload id |
|---|---|
| Pegasus front (green) | `OrYXrp2oKP5DUXHQAGb7` |
| Pegasus side (green) | `2MajKznNjXDj6jX6cE97` |
| Pegasus vector silhouette (green) | `XSx5btkO5OITQMcxhh2C` |
| Temple aerial | `l5viVFA3tLpHVtX9LNo1` |
| Temple front elevation | `1LkmUl35bheWoqUXcPJu` |
| Interior sanctum | (user uploading — check upload list) |

Draft: `pixverseV6` image2video 540p 5s (~50cr). Master: `wan2-7` image2video,
same start/end frames, 1080p 5s (~175cr). Always `generateAudio:false` /
`enablePromptExpansion:false` (Wan) once prompts are locked.

## pegasus-loop  (start = end = pegasus front)
> A majestic white pegasus with a vibrant blue mane hovers in place, beating
> its large white feathered wings in slow, powerful, regular strokes. The body
> stays centered and stationary, legs tucked, only the wings and mane move.
> Camera completely locked and static. The flat bright green background stays
> perfectly uniform, studio green screen. Seamless loop: the final frame
> matches the first frame exactly.

## pegasus-morph  (start = pegasus side → end = vector silhouette)
> A photorealistic white pegasus with a blue mane gives one final downward
> beat of its wings, then its whole form smoothly flattens and simplifies into
> a flat, solid black vector logo silhouette of a leaping winged horse.
> Elegant stylized transformation, the silhouette settles motionless at the
> end. Camera completely locked. The flat bright green background stays
> perfectly uniform throughout, studio green screen, no shadows.

## descent  (start = generated cloud plate → end = temple aerial)
> The camera sinks straight down through a dense field of soft white clouds.
> Wisps of cloud sweep past and thin out, revealing below an aerial view of a
> Greek Doric temple on a rocky Mediterranean hillside surrounded by olive
> trees, with the blue Aegean sea and islands in the distance. One continuous
> vertical descent, steady and slow, bright Mediterranean daylight,
> photorealistic, no people.

## approach  (start = temple aerial → end = temple front)
> Smooth cinematic drone shot. Starting from a high aerial view above a Greek
> Doric temple on a rocky Mediterranean hillside with olive trees and the blue
> Aegean sea behind, the camera descends and glides forward in one continuous
> move, lowering to ground level and finishing in a perfectly straight-on,
> centered front elevation view of the temple facade with its painted pediment
> and columns. Steady, slow, museum-calm camera movement, bright Mediterranean
> daylight, photorealistic, no people.

## doors  (start = temple front → end = interior sanctum)
> The camera dollies slowly forward toward the entrance of the Greek temple,
> passing between the tall marble columns. The massive dark wooden double
> doors swing open outward, and the camera glides through the doorway into a
> luminous white marble hall with a gold coffered ceiling and a red carpet
> leading to two white-and-gold statues standing side by side. One continuous
> forward dolly, no cuts, warm interior candlelight mixing with daylight,
> photorealistic.

## FX (later batch — M5)
- gold-dust: statue crop → element2video, "dissolves into swirling gold dust,
  black background" (screen blend in app).
- water-burst: "a vertical burst of clear seawater erupts and splashes, black
  background, slow motion" (screen blend in app).
