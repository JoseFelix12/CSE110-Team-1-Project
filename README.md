
# CSE110-Team-1-Project

# Math Racer

**UC San Diego | CSE 110 Software Engineering | Team 1**

## About the Project

**Math Racer** is an educational racing game developed by UC San Diego CSE 110 students. Our goal is to make practicing math more interactive and enjoyable by combining racing gameplay with arithmetic questions.

Players answer math questions while racing, progress through levels, earn stars and coins, and use rewards to customize and upgrade their cars. The game also includes additional math-based mini-games where players can practice their skills and earn rewards.

> **Development Status: Work in Progress**
>
> Math Racer has progressed beyond its initial development stage. The game now includes the Start Screen, Garage/Main Menu, Level Selection, racing gameplay, Mini Games, and Stats Screen.
>
> Core functionality such as math question processing, race progression, level unlocking, coin rewards, and saving player progress has been implemented. Both Catch the Answer and Repair Solver mini-games have also been developed.
>
> Development is ongoing, with current efforts focused on completing the Shop interface, expanding car customization, improving player statistics, and integrating and refining the remaining game features.

---

## Current Gameplay

### Game Flow

The current game includes the following navigation:

**Start Screen → Garage/Main Menu → Level Selection → Racing Level → Race Results**

**Garage/Main Menu → Mini Games → Catch the Answer / Repair Solver**

The game also includes a Stats Screen where players can view their progress and rewards.

### Start Screen

The Start Screen is the first screen displayed when launching Math Racer.

**Features:**
- Displays the game's starting interface.
- Allows players to press Space to continue.
- Navigates to the Garage/Main Menu.

**Status:** Implemented.

### Garage / Main Menu

The Garage serves as the game's main menu and provides access to the different sections of Math Racer.

**The main menu includes:**
- **LEVELS:** Navigates to the Level Selection screen.
- **MINI GAMES:** Navigates to the Mini Games selection screen.
- **SHOP:** Will allow players to purchase upgrades and customize their cars once the Shop interface is fully integrated.
- **TUTORIAL:** Planned to provide instructions on how to play Math Racer.

**Status:** Main menu implemented. LEVELS and MINI GAMES navigation are functional, while additional features are still being integrated.

> **Note:** The Garage currently functions as the main navigation menu. Car customization, upgrades, and purchases will be handled through the Shop as development continues.

### Level Selection

The Level Selection screen allows players to choose a racing level and track their progression through the game.

**Current Features:**
- Displays the Level Selection interface.
- Allows players to browse through levels using clickable left and right arrows.
- Displays whether a level is locked or unlocked.
- Allows players to select and play unlocked levels.
- Includes a functional **BACK** button that returns players to the Garage/Main Menu.
- Uses player progress to determine which levels are available.

**Level Progression:**
- Players begin with Level 1 unlocked.
- Additional levels become available based on the player's performance.
- The game tracks earned stars and unlocked levels.
- Progress is saved so players can continue from previous sessions.

**Status:** Level Selection UI, arrow navigation, and level unlocking functionality implemented.

### Racing Levels

The racing levels combine a racing environment with arithmetic questions.

**Current Features:**
- Displays the player's car and racing environment.
- Presents arithmetic questions during gameplay.
- Processes player answers.
- Tracks correct answers and race progression.
- Includes countdown and question timers.
- Manages race completion.
- Calculates race results and rewards.
- Updates player progress after completing a race.

The racing system uses separate model, view, and controller components to manage gameplay.

**Status:** Core racing components and race results functionality implemented. Gameplay integration and refinement are ongoing.

### Race Results

After completing a race, the game records the player's performance and rewards.

**Current Features:**
- Tracks correct answers.
- Calculates incorrect answers.
- Calculates accuracy percentage.
- Awards stars based on performance.
- Awards coins for correct answers and stars.
- Tracks new personal-best results.
- Unlocks additional levels when requirements are met.
- Updates the player's saved progress.

**Status:** Race results and reward functionality implemented.

---

## Mini Games

Math Racer includes additional math-based mini-games outside the main racing experience.

### Mini Games Selection

The Mini Games selection screen allows players to choose between the available mini-games.

**Current Features:**
- Displays the Mini Games selection interface.
- Provides navigation to the available mini-games.
- Allows players to return to the Garage/Main Menu.

**Status:** Implemented.

### Catch the Answer

Catch the Answer is a math-based mini-game where players identify and catch the correct answers.

**Current Features:**
- Interactive gameplay.
- Math questions and answer choices.
- Player input handling.
- Answer checking.
- Game progression.
- Coin reward functionality.

**Status:** Mini-game interface and gameplay implemented.

### Repair Solver

Repair Solver is a math-based mini-game where players solve problems to repair a car.

**Current Features:**
- Interactive math questions.
- Answer validation.
- Health-related gameplay mechanics.
- Accuracy tracking.
- Coin rewards.
- Game completion logic.

**Status:** Mini-game interface and gameplay implemented.

> **Note:** Mini-game functionality has been developed, and additional testing and integration improvements may continue as the project progresses.

---

## Stats Screen

The Stats Screen allows players to view their game progress and achievements.

**Current Features:**
- Displays the player's coin balance.
- Displays earned stars.
- Shows the highest unlocked level.
- Shows the number of unlocked levels.
- Includes navigation back to Level Selection.

**Planned Improvements:**
- Display correct and incorrect answers for each level.
- Allow players to select a level to view more detailed statistics.
- Add a question-review screen showing which questions were answered correctly or incorrectly.
- Expand the information available about player performance.

**Status:** Initial Stats Screen implemented. Additional statistics and question-review functionality are planned.

---

## Current Development Status

| Component | Status |
|---|---|
| Start Screen | Implemented; Space key navigation functional |
| Garage / Main Menu | Implemented; LEVELS and MINI GAMES navigation functional |
| Level Selection Screen | Implemented |
| Level Navigation Arrows | Implemented |
| Locked and Unlocked Levels | Implemented |
| Racing Level Navigation | Implemented |
| Basic Racing Interface | Implemented; refinements ongoing |
| Game Scene Management | Core implementation completed |
| Game State Management | Core implementation completed |
| Racing Model | Implemented |
| Racing View | Implemented |
| Racing Controller | Implemented |
| Race Results | Implemented |
| Math Question Modules | Implemented |
| Car Class | Core implementation developed |
| Mini Games Selection Screen | Implemented |
| Catch the Answer | Gameplay implemented |
| Repair Solver | Gameplay implemented |
| Stats Screen | Implemented; improvements planned |
| Coin and Reward System | Implemented |
| Player Progress Saving | Implemented |
| Shop Backend | Purchase functionality developed |
| Shop Screen | Integration in progress |
| Car Customization Interface | In development |
| Car Repair Mini Game | Repair Solver gameplay implemented |
| Additional Racing Levels | Implemented in game configuration |
| Accuracy-Based Level Unlocking | Implemented |
| Individual Question Review | Planned |
| Tutorial Screen | Planned |
| Full Game Integration | In progress |

> **Note:** Math Racer now includes several gameplay screens, mini-games, and progression features beyond the initial Sprint 1 implementation. Some components are still being integrated and refined as development continues.

---

## Planned Features — Future Development

The following features are planned for upcoming development or require additional integration.

### Shop

The Shop will allow players to spend earned coins on car upgrades and customization.

**Current Backend Features:**
- Coin balance management.
- Spending coins.
- Tracking purchased items.
- Purchasing available car skins.

**Planned Features:**
- Complete Shop interface.
- Display available items and prices.
- Allow players to purchase upgrades and cosmetics.
- Display owned and equipped items.
- Improve car customization functionality.

**Status:** Shop backend functionality developed. The complete Shop interface and integration are still in progress.

### Mini Games

Both Catch the Answer and Repair Solver have been developed.

**Planned Improvements:**
- Additional gameplay refinement.
- Improved mini-game integration.
- Expanded rewards and player feedback.
- Additional math challenges.

**Status:** Both mini-games implemented, with further improvements planned.

### Stats Screen

The Stats Screen currently displays basic player progress and rewards.

**Planned Features:**
- Correct and incorrect answer counts for individual levels.
- Detailed level performance.
- Question-by-question review.
- Additional racing statistics.

**Status:** Initial Stats Screen implemented. Expanded statistics are planned.

### Car Customization and Repair

Future development will continue expanding the game's interactive car management features.

**Planned Features:**
- Additional car skins and cosmetics.
- Engine upgrades.
- Improved damage tracking.
- Expanded repair functionality.
- Integration with the Shop.

**Status:** Initial car-related backend functionality and Repair Solver gameplay have been developed. Additional customization and integration are ongoing.

### Additional Levels

The game includes multiple racing levels and progression functionality.

**Planned Improvements:**
- Additional racing tracks.
- Expanded level progression.
- More gameplay challenges.
- Improved rewards and progression.
- Additional racing environments.

**Status:** Core level progression implemented. Additional content and improvements are planned.

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

> **Note:** Some features may still be undergoing integration as development continues.

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
- Tracks player stars and coins.
- Manages unlocked levels.
- Records racing results.
- Manages shop purchases.
- Saves player progress using browser local storage.

**Scene.ts**
- Defines the structure of game scenes.
- Provides scene identifiers for navigation.

### User Interface

The UI is organized into separate TypeScript screen classes.

**StartScreen.ts**
- Displays the Start Screen.
- Allows players to continue using the Space key.

**GarageScreen.ts**
- Displays the Garage/Main Menu.
- Provides navigation to Level Selection and Mini Games.

**LevelSelectScreen.ts**
- Displays the Level Selection interface.
- Supports arrow navigation.
- Displays locked and unlocked levels.
- Allows players to select available levels.
- Supports back navigation.

**MiniGameSelectScreen.ts**
- Displays the Mini Games selection interface.
- Provides navigation to the available mini-games.

**CatchTheAnswer.ts**
- Implements the Catch the Answer mini-game.
- Handles player interactions and answer mechanics.

**RepairSolverScreen.ts**
- Implements the Repair Solver mini-game.
- Handles math questions and gameplay interactions.

**StatsScreen.ts**
- Displays player progress and rewards.
- Provides navigation back to Level Selection.

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

### Racing System

The racing system follows a **Model-View-Controller (MVC)** approach.

**Race Model**
- Tracks changing race information.
- Maintains race progress and performance data.
- Tracks correct answers.

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
- Handles race completion.
- Records results and rewards.

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

The question system is used to support math-based gameplay throughout the project.

### Car System

The Car class manages attributes such as:
- Skin.
- Upgrades.
- Cosmetics.
- Engine level.
- Damage.

**Note:** The Car class supports backend car functionality. The complete customization and upgrade interfaces are still being developed.

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
- Racing model and controller.
- Math question processing.
- Car functionality.
- Stats Screen navigation.

### UI Navigation Tests

The UI test suite includes checks that:

1. The Start Screen displays correctly.
2. Pressing Space opens the Garage.
3. Unrelated keyboard input does not trigger navigation.
4. Clicking LEVELS opens Level Selection.
5. Clicking BACK returns to the Garage.
6. Clicking LEVEL 1 requests the Race scene with the correct level ID.

**Recent Local Test Results:**
- **170 automated tests passing**
- **10 test files passing**
- **6 UI navigation tests passing**

These results reflect a previous successful local test run. Test counts may change as new features are merged.

> **Note:** Automated tests verify specific components and functionality. Additional manual testing is still important to confirm that the complete gameplay experience works as expected.

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
7. Resolving merge conflicts.
8. Integrating completed components.

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

In upcoming development, our team plans to:

- Complete the Shop interface.
- Expand car customization and upgrades.
- Improve the Stats Screen.
- Add correct and incorrect answer tracking by level.
- Implement a question-review screen.
- Improve the Mini Games experience.
- Expand racing levels and tracks.
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
