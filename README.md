# Magnetic Maze🌌

Welcome to **Magnetic Maze**, a 2D physics-based puzzle game built with HTML, CSS, and vanilla JavaScript. Navigate your cosmic orb through challenging, procedurally-generated levels using a powerful magnetic force. Dodge deadly hazards, collect stars, and reach the portal to continue your journey through the void.

 
![20250721-0739-21 7565978-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/61fd9f9b-ee38-48da-922a-84e91ea9c74b)




## ✨ Features

-   **Zero-Gravity Physics**: Experience momentum-based movement in a frictionless space environment. The core mechanic is a magnetic force you control, not direct movement.
-   **Procedural Level Generation**: Every playthrough offers a unique challenge with dynamically generated levels that increase in difficulty.
-   **Interactive UI Panels**:
    -   **Draggable**: Move the UI and Instructions panels anywhere on the screen.
    -   **Minimizable**: Shrink panels into small icons to clear up screen space.
    -   **Closable**: Hide panels completely for an unobstructed view, with toggle buttons to bring them back.
-   **Dynamic Game Objects**:
    -   **Walls**: Normal walls and repulsive magnetic walls.
    -   **Hazards**: Deadly spikes and black holes with a gravitational pull.
    -   **Teleporters**: Instantly jump between two points in the level.
-   **Power-Ups**: Collect temporary boosts like **Force Shield**, **Speed Boost**, **Magnet Amplifier**, and **Energy Refill**.
-   **Stunning Visuals**: A rich space theme with a dynamic starfield, glowing particle effects for all major interactions, and polished animations.
-   **Procedural Audio**: Sound effects are generated in real-time using the Web Audio API for a lightweight and responsive experience.
-   **Responsive & Touch-Ready**: Fully playable on both desktop and mobile devices, with complete touch support for controls and UI manipulation.

## 🚀 How to Play

### Objective
Your goal is to guide the orb to the exit portal. The portal only activates after you have collected all the **stars** ⭐ scattered throughout the level.

### Controls
-   **Activate Magnet**: **Click and hold** (or **touch and hold**) anywhere on the screen. The orb will be pulled toward your cursor/finger.
-   **Move UI Panels**: **Click and drag** the header of any panel to move it.
-   **Minimize/Close Panels**: Use the **`—`** and **`×`** buttons on the panel headers.

### Keyboard Shortcuts
-   `H`: Toggle the Help/Instructions panel.
-   `U`: Toggle the Game Status/UI panel.
-   `R`: Restart the game from the first level.

## 🛠️ Tech Stack

This project is built from the ground up using core web technologies, with no external frameworks or libraries.

-   **HTML5**: Uses the `` element for all rendering.
-   **CSS3**: For styling the UI panels, modals, and creating modern layouts.
-   **JavaScript (ES6+)**: Powers all game logic, physics, procedural generation, and DOM manipulation.
-   **Web Audio API**: For real-time generation of all sound effects.

## 📦 Local Setup

No complex build process is required!

1.  Clone the repository:
    ```sh
    git clone https://github.com/pragsrv/Magnet-Maze.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd Magnet-Maze
    ```
3.  Open the `index.html` file in your favorite web browser.

That's it! The game will run directly in your browser.
## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
