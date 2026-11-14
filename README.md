# CSE110-Team-1-Project

# Math Racer

**UC San Diego | CSE 110 Software Engineering | Team 1**

## About the Project

**Math Racer** is an educational racing game developed by UC San Diego CSE 110 students. Our goal is to make practicing math more interactive and enjoyable by combining racing gameplay with arithmetic questions.

Players will answer math questions while racing, progress through levels, earn stars, and eventually use rewards to customize and upgrade their cars.

> **Development Status: Sprint 1 - Work in Progress**
>
> Math Racer is currently in its early development stages. Sprint 1 focuses on the basic game structure, initial screen navigation, math question functionality, and a simple racing interface.
>
> Additional screens and features, including the Shop, Mini Games, Stats, and car customization interfaces, are planned for future sprints.

---

## Current Gameplay

### Sprint 1 Game Flow

The current game is focused on the following navigation:

**Start Screen → Garage/Main Menu → Level Selection → Level 1 → Basic Racing Interface**

### Start Screen

The Start Screen is the first screen displayed when launching Math Racer.

**Features:**
- Displays the game's starting interface.
- Allows players to press Space to continue.
- Navigates to the Garage/Main Menu.

**Status:** Initial UI implemented.


### Garage / Main Menu

The Garage currently serves as the game's main menu and provides access to the different sections of Math Racer.

**The main menu includes four buttons:**
- **LEVELS:** Navigates to the Level Selection screen. This is currently the only functional button.
- **MINI GAMES:** Will navigate to the Mini Games section in a future sprint.
- **SHOP:** Will allow players to purchase upgrades and customize their cars in a future sprint.
- **TUTORIAL:** Will provide instructions on how to play Math Racer in a future sprint. (Need to add a button)

**Status:** Initial UI implemented. The LEVELS button is functional, while MINI GAMES, SHOP, and TUTORIAL are planned for future sprints.

> **Note:** The Garage currently functions as the main navigation menu. Car customization, upgrades, and purchases will be handled through the Shop once that feature is implemented.


### Level Selection

The Level Selection screen allows players to choose a racing level and track their progression through the game.

**Current Features:**
- Displays the Level Selection interface.
- Includes a clickable **Level 1** button that requests the racing scene.
- Includes a functional **BACK** button that returns players to the Garage/Main Menu.

**Planned Features (Future Sprints):**
- **Additional Levels:** More racing levels will be added as development continues.
- **Arrow Navigation:** Players will be able to browse through different levels using clickable left and right arrows.
- **Locked and Unlocked Levels:** Levels will initially be locked and will become available based on the player's accuracy in the previous level.
- **Level Progression:** Players will need to achieve the required accuracy to unlock and advance to the next level.

**Status:** Initial Level Selection UI implemented. Level 1 selection and back navigation are functional. Additional levels, arrow navigation, and accuracy-based unlocking are planned for future sprints.


### Level 1 — Racing

Level 1 introduces the basic racing experience.

**Current development focuses on:**
- A simple racing interface.
- Displaying the player's car and racing environment.
- Presenting arithmetic questions.
- Handling player answers.
- Managing basic race progression.

The racing system is being developed using separate model, view, and controller components.

**Status:** Basic racing components developed; integration and refinement are ongoing.

---

## Current Development Status


## Current Development Status

| Component | Status |
|---|---|
| Start Screen | Implemented; Space key navigation functional |
| Garage / Main Menu | Initial UI implemented; LEVELS button functional |
| Level Selection Screen | Implemented; Level 1 selection and BACK button functional |
| Level 1 Navigation | Implemented in UI; requests the racing scene |
| Basic Racing Interface | Developed; integration ongoing |
| Game Scene Management | Core implementation completed |
| Game State Management | Core implementation completed |
| Racing Model | Developed; refinements ongoing |
| Racing View | Developed; integration ongoing |
| Racing Controller | Developed; integration ongoing |
| Math Question Modules | Developed |
| Car Class | Initial implementation |
| Shop Screen | Planned for future sprint |
| Mini Games Selection Screen | Planned for future sprint |
| Catch The Answer | Planned for future sprint |
| Problem Solver | Planned for future sprint |
| Tutorial Screen | Planned for future sprint |
| Stats Screen | Planned for future sprint |
| Car Customization Interface | Planned for future sprint; part of Shop |
| Car Repair Mini Game | Planned for future sprint |
| Additional Levels | Planned for future sprint |
| Level Arrow Navigation | Planned for future sprint; clickable left and right arrows |
| Accuracy-Based Level Unlocking | Planned for future sprint; levels unlock based on accuracy in the previous level |
| Full Game Integration | In progress |

> **Note:** Sprint 1 focuses on the Start Screen, Garage/Main Menu, Level Selection, and basic racing functionality. The Garage currently displays LEVELS, MINI GAMES, and SHOP buttons, but only LEVELS is functional. The Level Selection screen supports Level 1 selection and a working BACK button. Additional screens, levels, and progression features will be implemented in future sprints. Some backend components have been developed but are not yet fully integrated into the playable game.


---

## Planned Features — Future Sprints

The following features are planned for upcoming sprints and are **not part of the completed Sprint 1 user interface**.


### Shop

The Shop will allow players to spend earned stars on car upgrades and customization.

**Planned Features:**
- Star balance display.
- Car upgrades to improve performance.
- Car skins and cosmetic customization.
- Purchasing items using earned stars.
- Shop categories for organizing available items.

**Status:** Planned for a future sprint. The Shop interface and purchasing functionality have not yet been implemented.


### Mini Games

Math Racer will include additional math-based mini games outside the main racing experience.

**Catch The Answer**
- A planned mini game where players identify correct answers and catch them.
- Gameplay and interface will be developed in a future sprint.

**Problem Solver**
- A planned mini game focused on solving math problems to fix a car.
- Gameplay and interface will be developed in a future sprint.

**Status:** Mini Games selection screen and individual mini game interfaces are planned for future development.

### Stats Screen

The Stats screen will allow players to view their game progress and performance.

**Potential features:**
- Player progress.
- Completed levels.
- Earned stars.
- Racing performance.
- Math question performance.

**Status:** Planned for a future sprint.

### Car Customization and Repair

Future development will expand the Garage with interactive car management features.

**Planned features:**
- Car skins and cosmetics.
- Engine upgrades.
- Damage tracking.
- Car repairs.

**Status:** Initial car-related backend development has started, but the complete user interface and gameplay are planned for future sprints.

### Additional Levels

Future sprints will expand the game beyond the initial Level 1 experience.

**Planned improvements:**
- Additional racing levels.
- Additional racing tracks.
- Expanded level progression.
- More gameplay challenges.
- Improved rewards and progression.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (version 20 or 22)
- **npm**
- **Git**
- **Visual Studio Code** (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/JoseFelix12/CSE110-Team-1-Project.git
```

### 2. Navigate to the Project Folder

```bash
cd CSE110-Team-1-Project
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Game

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

**http://localhost:5173/**

Vite automatically reloads the application when changes are saved.

> **Note:** The development server and screen navigation require the relevant UI changes to be present in your branch. Some game components may still be undergoing integration.

---

## Project Architecture

Math Racer is primarily implemented using **TypeScript**.

The project is divided into separate modules to make development, testing, and maintenance easier.

### Game Management

**Game.ts**
- Registers and switches between scenes.
- Maintains navigation history.
- Handles back navigation.
- Runs the game update loop.

**GameState.ts**
- Tracks player stars.
- Manages unlocked levels.
- Stores shop purchases.
- Saves player progress using browser local storage.

**Scene.ts**
- Defines the structure of game scenes.
- Provides scene identifiers for navigation.

### User Interface

The Sprint 1 UI is organized into separate TypeScript screen classes.

**StartScreen.ts**
- Displays the Start Screen.
- Allows players to continue using the Space key.

**GarageScreen.ts**
- Displays the Garage/Main Menu.
- Provides navigation to Level Selection.

**LevelSelectScreen.ts**
- Displays the Level Selection interface.
- Supports back navigation.
- Requests Level 1 when selected.

**ui.css**
- Handles UI layout and styling.
- Defines interactive button positioning.
- Supports responsive screen display.

**src/index.ts**
- Initializes the game.
- Registers available scenes.
- Starts the application.

**index.html**
- Serves as the Vite entry point.

**Additional UI screens will be implemented in future sprints.**

### Racing System

The racing system follows a **Model-View-Controller (MVC)** approach.

**Race Model**
- Tracks changing race information.
- Maintains race progress and performance data.

**Race View**
- Renders the racing interface.
- Displays the car, road, background, and question bar.
- Handles visual elements such as the countdown and nitro bar.
- Receives player input.

**Race Controller**
- Manages racing logic.
- Handles countdowns and question timers.
- Processes player answers.
- Updates the race model and view.

### Math Question System

The math question modules represent arithmetic problems.

**Supported operations:**
- Addition.
- Subtraction.
- Multiplication.
- Division.

Each question includes:
- Two numerical operands.
- A text representation of the expression.
- The correct answer.

### Car System

The Car class is being developed to manage attributes such as:
- Skin.
- Upgrades.
- Cosmetics.
- Engine level.
- Damage.

**Note:** The Car class is part of backend development. The full car customization and repair interfaces are planned for future sprints.

---

## Testing

We use **Vitest** for automated testing.

### Run Tests

```bash
npm test
```

### Run TypeScript Type Checking

```bash
npm run typecheck
```

Automated tests cover functionality such as:
- Game scene navigation.
- Game state behavior.
- Player progress management.
- UI keyboard interactions.
- Button navigation.
- Level selection.

### UI Navigation Tests

The Sprint 1 UI test suite includes checks that:

1. The Start Screen displays correctly.
2. Pressing Space opens the Garage.
3. Unrelated keyboard input does not trigger navigation.
4. Clicking LEVELS opens Level Selection.
5. Clicking BACK returns to the Garage.
6. Clicking LEVEL 1 requests the Race scene with the correct level ID.

**Sprint 1 UI Branch Test Results:**
- **29 automated tests passing**
- **6 UI navigation tests added**
- **Successful CI checks on Node.js 20 and 22**

These results describe the tested UI branch. Test counts may change as new features are merged.

> **Note:** The Level 1 navigation test verifies the request to enter the Race scene. It does not independently verify that the complete racing experience is integrated and playable.

---

## Continuous Integration (CI)

Our project uses **GitHub Actions** for continuous integration.

GitHub Actions runs automated tests to help identify issues before code is merged into the main branch.

**CI environments:**
- Node.js 20
- Node.js 22

**GitHub Actions:**  
https://github.com/JoseFelix12/CSE110-Team-1-Project/actions

---

## Development Workflow

Our team uses GitHub to collaborate and manage development.

**Our workflow includes:**

1. Dividing the project into smaller features and modules.
2. Assigning tasks to team members.
3. Developing features on separate Git branches.
4. Writing automated tests.
5. Creating pull requests.
6. Reviewing changes before merging.
7. Integrating completed components.

We also use standup meetings to communicate progress, discuss upcoming tasks, and identify blockers.

---

## Documentation

We aim to keep our documentation clear, organized, and useful for future development.

**Our documentation includes:**
- **README.md:** Project overview, setup instructions, architecture, testing, and development status.
- **Pull Requests:** Feature descriptions, code changes, and testing results.
- **Code Comments:** Explanations of important functionality where needed.
- **Task Tracker:** Organization of development tasks and progress.

Our goal is to document the information needed to understand, run, test, and continue developing Math Racer without adding unnecessary documentation.

### Useful Links

**GitHub Repository:**  
https://github.com/JoseFelix12/CSE110-Team-1-Project

**GitHub Actions:**  
https://github.com/JoseFelix12/CSE110-Team-1-Project/actions

---

## Future Development

In upcoming sprints, our team plans to:

- Complete the Shop interface.
- Develop the Mini Games selection screen.
- Implement Catch The Answer and Problem Solver.
- Create the Stats screen.
- Complete car customization and repair interfaces.
- Add additional racing levels.
- Improve the racing experience.
- Connect remaining UI screens to their game functionality.
- Expand automated test coverage.
- Improve visual design and user experience.
- Complete integration between all major game components.

Our goal is to develop Math Racer into a fully integrated educational racing game that makes learning math fun and interactive.

---

## Development Team

**UC San Diego - CSE 110, Team 1**

Math Racer is a collaborative software engineering project developed by:

- Ashley Malaxechevarria
- Geer Ai 
- Bradley Chen
- Jose Felix
- Mateo Kalafatovich
- Eric Murphy
- Saaketh Raghava

Additional project details and development progress can be found in our GitHub repository.
