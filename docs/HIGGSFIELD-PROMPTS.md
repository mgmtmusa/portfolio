> **Partly superseded on 24 November 2026.** The robot render (section 1) is retired. For the turn film, use the dark version in Appendix A of `docs/MASTER-PROMPT-v3.md`.

# Generation prompts: robot layer and the turn

These are the real renders that replace the placeholders in `prototypes/portrait-lens/`. The page detects each file automatically, so you just reload once it's saved.

| File to save | What it does on the page |
|---|---|
| `prototypes/portrait-lens/robot.png` (or `.jpg`) | The robot the lens reveals under your face (Lens study 01). **Done:** the Canva render is in place. |
| `prototypes/portrait-lens/turn.mp4` | The scroll-driven turn: back to camera, camera pushes in, you turn, look into the lens, fold your arms (Lens study 02) |

**Inputs you need ready in Higgsfield**
- **Image A:** your portrait (`src/assets/portrait/musa-portrait.jpg`).
- **Image B:** the black-and-white steel robot reference you sent: brushed plates, a camera-lens eye, and a wiring cutaway in the cheek.

---

## 1. The robot under your face → `robot.png`

Already done with Canva. Use this only if you want a sharper or closer match to Image B.

**Model:** Nano Banana Pro, resolution 2k, aspect 1:1.
**Backups:** Seedream 4.5, or GPT Image 2 at high quality.
**References:** Image A first (subject and composition), then Image B (style only).

**Prompt:**

> Transform the man in image 1 into a humanoid robot. Keep the exact same framing, head position, head tilt, shoulder line, pose, camera angle, lighting direction and plain light-grey studio background as image 1, so the two images line up pixel for pixel when stacked. Use the robot style of image 2:
> - brushed and polished steel face plates, with machined panel seams and small rivets
> - a cutaway on his right cheek (the viewer's left) showing bundled wiring and small metal cylinders
> - camera-lens eyes with concentric focus rings and a white-hot glowing core, seen through his same gold wire square aviator glasses
>
> Keep his recognisable silhouette:
> - the same swept-back hairstyle, rendered as layered dark graphite heat-sink fins
> - the same full beard shape, rendered as fine black steel mesh
>
> Keep his navy double-breasted pinstripe suit, white shirt and dark diamond-pattern tie exactly as they are. Photorealistic studio photography, sharp focus, 1:1.

**Avoid** (add this if the model has a negative prompt field):

> changing the pose, crop, zoom, background or clothing; cartoon style; helmet; extra limbs; text; watermark

**Check before saving:** open the prototype and press **M**. The robot's eyes and jaw should sit where yours are. A new render needs re-measuring (`ROBOT_FIT` in the prototype), so tell Claude when you save one.

---

## 2. The turn → `turn.mp4`

**The shot, as one continuous take (6 seconds):**

| Time | What happens | On the page |
|---|---|---|
| 0.0–2.0s | Wide. You stand with your back to the camera, facing the grey studio wall. The camera starts a slow push-in. | "I study the room first." |
| 2.0–3.5s | You turn your head over your shoulder, then your whole body, and look straight into the lens. | "Then I face it." |
| 3.5–5.0s | Holding eye contact, you fold your arms across your chest, firm and deliberate. One small nod. | "Then we talk numbers." |
| 5.0–6.0s | Hold. The camera settles at waist-up. | The hold |

The visitor's scroll drives the clip, so they control the push-in. Keep it photoreal so it matches the portrait and the robot.

You make two still frames first (start and end), then the video between them. Anchoring both ends keeps your face accurate and stops the model inventing the framing.

**Framing rule for both frames:** 16:9 with you centred and empty grey studio on both sides. On phones the page crops to the centre, so keep anything important within the middle third.

### 2a. Start frame → `turn-start.jpg`

**Model:** Nano Banana Pro, 2k, 16:9.
**Reference:** Image A.

> The same man as in image 1, seen from directly behind, standing with his back to the camera and facing a plain light-grey studio wall. Wide shot from mid-thigh up, centred in the frame, with plenty of empty grey studio on both sides. His swept-back black hair seen from behind, the arms of his gold wire glasses visible over his ears, his navy double-breasted pinstripe suit jacket seen from the back, hands relaxed at his sides. Same soft studio lighting and colour grade as image 1. Photorealistic, sharp focus, 16:9.

### 2b. End frame → `turn-end.jpg`

**Model:** Nano Banana Pro, 2k, 16:9.
**References:** Image A (face and wardrobe), then the start frame (set and lighting).

> The same man as image 1, in the same studio and light as image 2. Medium close-up from the waist up, centred, facing the camera and looking straight into the lens. His arms are folded firmly across his chest. Composed, serious, confident expression with the mouth closed. Keep his face exactly as in image 1: same full beard, swept-back black hair, gold wire square aviator glasses, navy double-breasted pinstripe suit, white shirt and dark diamond-pattern tie. Empty light-grey studio on both sides. Photorealistic, sharp focus, 16:9.

Check that the face really is yours before going on. If it drifts, regenerate. Everything after this depends on it.

### 2c. The video → `turn.mp4`

**Model:** Seedance 2.0.
- Start image: 2a.
- End image: 2b.
- Image reference: Image A, for identity.
- Duration 6s, aspect 16:9, resolution 1080p, generate audio off.

**Prompt:**

> One continuous shot with no cuts. A slow, steady dolly push-in from a wide shot to a medium close-up. He stands with his back to the camera. As the camera moves in, he turns his head over his shoulder, then turns his whole body to face the camera and looks straight into the lens. Holding eye contact, he folds his arms across his chest, firm and deliberate, and gives one small nod. He holds still for the final second. Plain light-grey studio, soft even light. Photoreal, natural human motion, his face stays identical to the reference.

**Plan note:** Seedance 2.0's higher-quality mode needs a paid Higgsfield plan. If it's locked on yours:
- **Backup 1:** Minimax Hailuo 2.3 at 1080, 6s, with the same start and end frames.
- **Backup 2:** Seedance 2.0 Mini at 720p.

**Saving it:** download the MP4 and save it anywhere in the project, then tell Claude. Claude re-encodes it so it scrubs smoothly with the scroll, saves it as `prototypes/portrait-lens/turn.mp4` and adds an end-frame poster. You don't need to compress it yourself.

---

## Rules

- Generate only from your real portrait. No invented scenes, people or events.
- If anything looks uncanny (eyes, hands, teeth, the arm fold), regenerate or drop it. A clean still beats a strange animation.
