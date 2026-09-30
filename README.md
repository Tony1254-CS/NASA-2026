# TRACE: The Pulse of the Planet in Your Pocket

**The Earth is moving beneath our feet, and most of us don't know it until disaster strikes.** 
Urban subsidence is threatening coastal mega-cities, dormant volcanoes are quietly inflating, and fault lines are accumulating strain. Tracking these millimeter-scale movements historically required massive computational resources and specialized scientific training. Not anymore.

## ?? Introducing TRACE PWA
We have built a Progressive Web App that puts the power of Synthetic Aperture Radar (SAR) satellite data directly into the hands of communities, urban planners, and first responders. 

By leveraging both **L-Band** (NASA NISAR, capable of penetrating dense vegetation) and **C-Band** (Sentinel-1, high-resolution for urban environments) SAR data, our platform tracks ground displacement with unprecedented accessibility. 

### ?? Uncompromising "Real Science"
We didn't just build a pretty map; we engineered a scientific tool natively for the web. Our application processes **real wrapped phase arrays**, directly translating raw interferometric data into meaningful insights. We employ dynamic **HSV color mapping** to visually represent phase shifts (`d = ?? / 4p`), making complex fringe patterns instantly readable. 

Because we understand that data without context is dangerous, we built rigorous statistical modeling into the core experience. Our platform computes **linear regression uncertainty cones**, allowing users to clearly separate the genuine deformation signal from atmospheric noise and temporal decorrelation artifacts. 

Whether you are monitoring a sinking neighborhood, a restless caldera, or a creeping fault, our PWA delivers real science, real time, right to your device.

---

## ?? Key Features

*   **Interferogram Visualizer (Fringe Screen):** Dynamically render raw phase data, unwrap it into displacement, and toggle between amplitude, coherence, and phase modes using scientific HSV and diverging colormaps.
*   **Predictive Risk Assessment (Risk Screen):** Drag the timeline into the future. Watch the linear regression model calculate displacement alongside an expanding 1s uncertainty cone, updating infrastructure impact metrics in real-time.
*   **Frequency Penetration Modeling (Signal Screen):** Interactive educational tools explaining the physics behind radar wavelengths (X, C, S, L, P bands) and why L-Band is crucial for vegetated areas.
*   **Citizen Science Ground Truth (Verify Screen):** A field-ready verification tool that compares human observation (e.g., "cracked pavement") against SAR coherence scores to calculate a unified confidence rating.

---

## ?? Tech Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS
*   **Scientific Rendering:** HTML5 Canvas (2D Context) for raw phase array interpolation
*   **Data Visualization:** Custom dynamic SVGs (no external charting libraries)

---

## ?? How to Run Locally

```bash
cd client
npm install
npx next dev -p 8081
```
Open `http://localhost:8081` in your browser. (Switch to mobile view or resize your browser to see the PWA interface properly).

