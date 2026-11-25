export const QUESTION_TIMER = 10;
export const DAMAGE_PER_STREAK = 4;
export const COUNTDOWN_SECONDS = 3;
export const CORRECT_ANSWERS_FOR_NITRO = 5; //Full after 2 correct answers
export const NITRO_SECONDS = 2;
export const FINISH_SCREEN_MS = 1500; //How long FINISH! shows before leaving the race
export const HEALTH_REPAIR = 10; /** Health repaired per question answered in MG2 */
/**
 * Word problem templates. Placeholders:
 *   {a} / {b}                  the number itself
 *   {a:singular|plural}        "singular" when a is 1, otherwise "plural"
 * e.g. "{b} {b:car pulls|cars pull} in" -> "1 car pulls in" / "3 cars pull in"
 */
export const WORD_PROBLEM_TEMPLATES: Record<string, string[]> = {
  addition: [
    "You finish a race with {a} {a:coin|coins} and win {b} more at the finish line. How many coins do you have now?",
    "Your car has {a} {a:sticker|stickers} on it. You add {b} more racing {b:sticker|stickers}. How many stickers are on your car now?",
    "There {a:is|are} {a} {a:car|cars} at the starting line. {b} more {b:car pulls|cars pull} up to join the race. How many cars are racing now?",
    "You drive {a} {a:kilometer|kilometers} in the morning and {b} {b:kilometer|kilometers} in the afternoon. How many kilometers did you drive in total?",
    "You win {a} {a:trophy|trophies} at the local track and {b} {b:trophy|trophies} at the city track. How many trophies do you have?",
    "A garage has {a} red {a:car|cars} and {b} blue {b:car|cars}. How many cars are in the garage?",
    "You complete {a} {a:lap|laps} in your first race and {b} {b:lap|laps} in your second race. How many laps did you complete in total?",
    "You collect {a} speed {a:boost|boosts}, then find {b} more on the track. How many speed boosts do you have now?",
    "The pit crew has {a} {a:wrench|wrenches} and borrows {b} more from another team. How many wrenches does the crew have now?",
  ],
  subtraction: [
    "Your car has {a} {a:liter|liters} of fuel. You use {b} {b:liter|liters} during the race. How many liters are left?",
    "There {a:is|are} {a} {a:car|cars} on the track. {b} {b:car pulls|cars pull} into the pit stop. How many cars are still on the track?",
    "You have {a} nitro {a:boost|boosts}. You use {b} of them on the final lap. How many nitro boosts do you have left?",
    "A race is {a} {a:lap|laps} long. You have finished {b} {b:lap|laps}. How many laps do you have left?",
    "You have {a} {a:coin|coins} and spend {b} of them on a new paint job. How many coins do you have left?",
    "There {a:is|are} {a} traffic {a:cone|cones} on the track. {b} of them {b:gets|get} knocked over. How many cones are still standing?",
    "The garage has {a} {a:tire|tires}. The crew uses {b} of them. How many tires are left?",
    "The road is {a} {a:kilometer|kilometers} long. You have driven {b} {b:kilometer|kilometers}. How many kilometers are left to go?",
    "Your car is going {a} {a:kilometer|kilometers} per hour. You slow down by {b} {b:kilometer|kilometers} per hour for a sharp turn. How fast are you going now?",
  ],
  multiplication: [
    "A race has {a} {a:lap|laps}, and each lap is {b} {b:kilometer|kilometers} long. How many kilometers is the whole race?",
    "The pit crew changes {a} {a:car|cars}, and each car needs {b} new {b:tire|tires}. How many tires does the crew change in total?",
    "A garage has {a} {a:shelf|shelves}, and each shelf holds {b} toy race {b:car|cars}. How many toy cars are in the garage?",
    "A race team has {a} {a:car|cars}, and each car has {b} {b:sticker|stickers} on it. How many stickers does the team have in total?",
    "A parking lot has {a} {a:row|rows}, and each row has {b} {b:car|cars}. How many cars are in the parking lot?",
    "Your car drives {a} {a:kilometer|kilometers} every hour for {b} {b:hour|hours}. How many kilometers do you drive in total?",
    "You make {a} pit {a:stop|stops}, and each pit stop takes {b} {b:second|seconds}. How many seconds do you spend in the pits?",
    "You win {a} {a:race|races}, and each win earns you {b} {b:coin|coins}. How many coins do you earn in total?",
    "You buy {a} {a:can|cans} of paint, and each can is enough to paint {b} toy {b:car|cars}. How many toy cars can you paint?",
  ],
  division: [
    "A mechanic has {a} spare {a:tire|tires} and gives {a:it|them} equally to {b} race {b:car|cars}. How many tires does each car get?",
    "The pit crew has {a} {a:liter|liters} of fuel to share equally among {b} {b:car|cars}. How many liters does each car get?",
    "A parking garage has {a} {a:car|cars}, and each floor fits {b} {b:car|cars}. How many floors are filled?",
    "You have {a} {a:coin|coins} and want to split {a:it|them} equally among {b} car {b:upgrade|upgrades}. How many coins does each upgrade get?",
    "A track is {a} {a:kilometer|kilometers} long, and your car drives {b} {b:kilometer|kilometers} every hour. How many hours does the trip take?",
    "A mechanic has {a} {a:bolt|bolts}, and each wheel needs {b} {b:bolt|bolts}. How many wheels can the mechanic finish?",
    "{a} race {a:car lines|cars line} up equally in {b} {b:row|rows}. How many cars are in each row?",
    "A toy store has {a} toy {a:car|cars} and puts {b} {b:car|cars} on each shelf. How many shelves does the store fill?",
    "You drive {a} {a:kilometer|kilometers} in {b} {b:hour|hours} at the same speed. How many kilometers do you drive each hour?",
  ],
};