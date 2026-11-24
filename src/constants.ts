export const QUESTION_TIMER = 10;
export const DAMAGE_PER_STREAK = 4;
export const COUNTDOWN_SECONDS = 3;
export const CORRECT_ANSWERS_FOR_NITRO = 5; //Full after 2 correct answers
export const NITRO_SECONDS = 2;
export const FINISH_SCREEN_MS = 1500; //How long FINISH! shows before leaving the race
export const HEALTH_REPAIR = 10; /** Health repaired per question answered in MG2 */
export const WORD_PROBLEM_TEMPLATES: Record<string, string[]> = {
  addition: [
    "You finish a race with {a} coins and win {b} more at the finish line. How many coins do you have now?",
    "Your car has {a} stickers on it. You add {b} more racing stickers. How many stickers are on your car now?",
    "There are {a} cars at the starting line. {b} more cars pull up to join the race. How many cars are racing now?",
    "You drive {a} kilometers in the morning and {b} kilometers in the afternoon. How many kilometers did you drive in total?",
    "You win {a} trophies at the local track and {b} trophies at the city track. How many trophies do you have?",
    "A garage has {a} red cars and {b} blue cars. How many cars are in the garage?",
    "You complete {a} laps in your first race and {b} laps in your second race. How many laps did you complete in total?",
    "You collect {a} speed boosts, then find {b} more on the track. How many speed boosts do you have now?",
    "The pit crew has {a} wrenches and borrows {b} more from another team. How many wrenches does the crew have now?",
  ],
  subtraction: [
    "Your car has {a} liters of fuel. You use {b} liters during the race. How many liters are left?",
    "There are {a} cars on the track. {b} cars pull into the pit stop. How many cars are still on the track?",
    "You have {a} nitro boosts. You use {b} of them on the final lap. How many nitro boosts do you have left?",
    "A race is {a} laps long. You have finished {b} laps. How many laps do you have left?",
    "You have {a} coins and spend {b} of them on a new paint job. How many coins do you have left?",
    "There are {a} traffic cones on the track. {b} of them get knocked over. How many cones are still standing?",
    "The garage has {a} tires. The crew uses {b} of them. How many tires are left?",
    "The road is {a} kilometers long. You have driven {b} kilometers. How many kilometers are left to go?",
    "Your car is going {a} kilometers per hour. You slow down by {b} kilometers per hour for a sharp turn. How fast are you going now?",
  ],
  multiplication: [
    "A race has {a} laps, and each lap is {b} kilometers long. How many kilometers is the whole race?",
    "The pit crew changes {a} cars, and each car needs {b} new tires. How many tires does the crew change in total?",
    "A garage has {a} shelves, and each shelf holds {b} toy race cars. How many toy cars are in the garage?",
    "A race team has {a} cars, and each car has {b} stickers on it. How many stickers does the team have in total?",
    "A parking lot has {a} rows, and each row has {b} cars. How many cars are in the parking lot?",
    "Your car drives {a} kilometers every hour for {b} hours. How many kilometers do you drive in total?",
    "You make {a} pit stops, and each pit stop takes {b} seconds. How many seconds do you spend in the pits?",
    "You win {a} races, and each win earns you {b} coins. How many coins do you earn in total?",
    "You buy {a} cans of paint, and each can is enough to paint {b} toy cars. How many toy cars can you paint?",
  ],
  division: [
    "A mechanic has {a} spare tires and gives them equally to {b} race cars. How many tires does each car get?",
    "The pit crew has {a} liters of fuel to share equally among {b} cars. How many liters does each car get?",
    "A parking garage has {a} cars, and each floor fits {b} cars. How many floors are filled?",
    "You have {a} coins and want to split them equally among {b} car upgrades. How many coins does each upgrade get?",
    "A track is {a} kilometers long, and your car drives {b} kilometers every hour. How many hours does the trip take?",
    "A mechanic has {a} bolts, and each wheel needs {b} bolts. How many wheels can the mechanic finish?",
    "{a} race cars line up equally in {b} rows. How many cars are in each row?",
    "A toy store has {a} toy cars and puts {b} cars on each shelf. How many shelves does the store fill?",
    "You drive {a} kilometers in {b} hours at the same speed. How many kilometers do you drive each hour?",
  ],
};