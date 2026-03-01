# Harry Potter Dueling Game

A real-time web-based Harry Potter dueling game where two wizards (Harry vs Draco) face off in a Hogwarts Great Hall arena. Built for a hackathon.

## Tech Stack

- **React 19** + Vite
- **Three.js** via React Three Fiber (R3F v9)
- **@react-three/drei** — HDRI, ContactShadows, OrbitControls, Sparkles
- **@react-three/postprocessing** — Bloom, Vignette, ToneMapping
- **Leva** — Real-time GUI controls for live tweaking

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 3D Model

The arena uses the [Hogwarts Grand Hall](https://sketchfab.com/3d-models/hogwarts-grand-hall-203784d1e8704cfba3af8a2b224b74ff) by zack_graham (CC Attribution).

Download the GLB and place it at `public/models/arena.glb`.

## Project Structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Leva panel + Scene
├── Scene.jsx             # R3F Canvas, camera, fog, OrbitControls
├── components/
│   ├── Arena.jsx          # Loads GLB model + floating candles
│   ├── Character.jsx      # Wizard placeholders (Harry/Draco)
│   ├── Lighting.jsx       # HDRI + spotlights + contact shadows
│   └── Effects.jsx        # Bloom + Vignette + ToneMapping
public/
├── models/
│   └── arena.glb          # Hogwarts Great Hall 3D model
└── hdri/                  # (optional) custom HDRI files
```

## Controls

- **Mouse drag** — Rotate camera
- **Scroll** — Zoom in/out
- **Leva panel** (top-right) — Tweak all lighting, effects, and model params

## Future Phases

1. Spell particle effects + camera shake
2. MediaPipe Hands → gesture-based spell casting
3. Web Speech API → voice commands ("Expelliarmus!")
4. Sound effects, HP system, victory/defeat
5. Multiplayer (Socket.io)

## Credits

- Arena model: [zack_graham on Sketchfab](https://sketchfab.com/zack_graham) (CC Attribution)
- HDRI presets: [Poly Haven](https://polyhaven.com/) via drei
