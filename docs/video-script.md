# Demo video script

Target length 3:00. Never over 4:00. English narration. Replaces the table in `PLAN.md` section 10.

## How it is made

| Part | Who | How |
|---|---|---|
| Voice | Rofi | Reads the lines below, one audio or webcam file per shot. |
| Face | Rofi | Webcam for shot 1 and shot 8 only. Nothing covers the app in between. |
| Screen | Assistant | Scripted capture of the live site in a browser at 1920 x 1080, timed to each voice take. Not hand-recorded, so there are no slips. |
| Assembly | Assistant | `ffmpeg`: join the shots, lay the voice over the screen, add the title and closing cards from `docs/brand/`, export MP4. |

Not tested yet: the scripted screen capture, and the join. Both get a 10-second trial before the real run.

## Recording notes for Rofi

- Quiet room, microphone close. Clear sound matters more than the picture.
- One file per shot, named `s1.mp4`, `s2.m4a` and so on. A mistake means redoing one shot, not the video.
- Read at a calm pace. Leave half a second of silence at the start and end of each take.
- Shots 1 and 8: look at the camera, plain background, light on your face.
- Say numbers as written here. Do not round them.

## Shots

Times are targets. The screen capture is cut to the real length of each voice take.

### Shot 1. Hello (0:00 to 0:12) · webcam

> Hi, I'm Rofi, a student from Indonesia. This is Prakira: climate briefings with receipts.

On screen after the line: the logo card, one second.

### Shot 2. The problem (0:12 to 0:36) · screen: landing page, top

> A weather app tells me the heat index is 37 and the air quality index is 235. It does not tell me what that means for my grandmother.
>
> Public warnings send one message to everyone. An AI can write personal advice, but it can also state a number that was never in the forecast. And in one study of 31 AI heat messages, none was easy enough to read.

Captions on screen, small: "Ou et al., 2025" on the second sentence; "MacKay et al., 2026: 0 of 31 met a grade 8 reading level" on the last.

### Shot 3. Ask (0:36 to 0:58) · screen: the form, then the live steps

> So here is all you do. Pick a place. Tick who lives there. Press the button.
>
> While you wait, you see each real step as the server does it: read the forecast, set the levels by rule, let the AI write, then check what it wrote.

Action on screen: type "Jakarta", pick it, tick "Older adult", press "Generate briefing"; the steps fill in.

### Shot 4. The answer (0:58 to 1:28) · screen: the points

> The answer is a short list. Each point is one thing to do, with the numbers behind it.
>
> The levels come from published rules: the US National Weather Service for heat, the EPA for air, the World Health Organization for UV. The household changes which levels count as serious.
>
> The AI wrote only the action. It never writes a number. Every figure here was put in by code, straight from the forecast.

Action on screen: slow scroll down the points; pause on point 2.

### Shot 5. The receipts (1:28 to 2:04) · screen: "Show all the data"

> If you want everything, open all the data.
>
> Select a point, and the numbers it relies on light up. This row compares each day with the local average for 1991 to 2020, so you see climate, not only weather.
>
> And this is the audit trail. It lists what the AI wrote that was removed, and why. If the AI misses a serious hazard, a fixed notice takes its place, so nothing serious goes missing.

Action on screen: press "Show all the data"; select point 2, the air cells light up; point at the climate row; open the audit trail.

If no action was removed in the captured run, change the third paragraph's second sentence to: "It lists anything the AI wrote that was removed, and why. In this run, nothing was." Do not stage a removal.

### Shot 6. Two more things (2:04 to 2:22) · screen: language switch, then "describe your home"

> It works in Bahasa Indonesia as well. And if you do not want to fill in a form, describe your home in one sentence. The AI ticks the boxes. You still press the button.

Action on screen: switch to ID, the points rewrite; back to EN; open "Or describe your home in one sentence", type "We live in Depok, my dad is 68 and has asthma, no AC", press "Fill in for me".

### Shot 7. Does it work (2:22 to 2:48) · screen: "Measured, not promised"

> We tested it on 35 cities. On the 15 cities the system was never tuned on, 85 percent of the AI's actions passed the screen in English, and 81 percent in Indonesian. The rest were removed and replaced by a notice.
>
> Passing the screen is not a rating of the advice. No doctor has reviewed it. These are small samples, and we say so on the page.

### Shot 8. Close (2:48 to 3:02) · webcam, then closing card

> Prakira does not replace official warnings. It sits beside them. I built it during ForgeHacks with open data from Open-Meteo, a Mistral model, and AI coding help. The code and the method are public. Thank you.

Closing card: logo, `prakira.rofihosted.space`, `github.com/rofiperlungoding/prakira`.

## Word count

About 400 words of narration, which is three minutes at a calm pace.

## Facts used, and where each comes from

| Line | Source |
|---|---|
| Heat index 37, air quality index 235 | Jakarta forecast seen on the live site on 9 October 2026. Use the numbers on screen in the captured run if they differ. |
| 0 of 31 AI heat messages met a grade 8 reading level | MacKay et al., 2026 (abstract read) |
| Warnings send one message to everyone | Ou et al., 2025 (abstract read) |
| 35 cities; 15 held out; 85% and 81% | README evaluation table, runs 19 to 22 (85.2% and 81.5%; the page prints 85% and 81%) |
| Levels from NWS, EPA, WHO | README, "Sources for the hazard levels" |
| No clinician has reviewed the advice | README, "Limits" |
