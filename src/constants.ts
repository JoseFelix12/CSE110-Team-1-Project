export const QUESTION_TIMER = 10;
export const AMOUNT_OF_QUESTIONS_IN_LEVEL_1 = 15; //2 for now
export const DAMAGE_PER_STREAK = 4;
export const COUNTDOWN_SECONDS = 3;
export const CORRECT_ANSWERS_FOR_NITRO = 5; //Full after 2 correct answers
export const NITRO_SECONDS = 2;
export const FINISH_SCREEN_MS = 1500; //How long FINISH! shows before leaving the race
export const HEALTH_REPAIR = 10; /** Health repaired per question answered in MG2 */
export const WORD_PROBLEM_TEMPLATES: Record<string, string[]> = {
    "addition": [
        "If you have {a} apples and your friend gives you {b} more, how many apples do you have in total?", 
        "You have {a} pencils. You buy {b} more pencils. How many pencils do you have now?",
        "There are {a} birds on a tree. {b} more birds join them. How many birds are there now?"
    ],
    "subtraction": [
        "You have {a} candies. You eat {b} of them. How many candies are left?",
        "There are {a} cars in a parking lot. {b} cars drive away. How many cars remain?",
        "You have {a} books. You lend {b} books to a friend. How many books do you have now?"
    ],
    "multiplication": [
        "If you have {a} boxes and each box contains {b} chocolates, how many chocolates do you have in total?",
        "A farmer has {a} rows of trees, and each row has {b} trees. How many trees does the farmer have in total?",
        "You buy {a} packs of stickers, and each pack contains {b} stickers. How many stickers do you have in total?"
    ],
    "division": [
        "You have {a} cookies and want to share them equally among {b} friends. How many cookies does each friend get?",
        "A baker has {a} cupcakes and wants to put them into boxes that hold {b} cupcakes each. How many boxes can the baker fill?",
        "You have {a} pencils and want to distribute them equally among {b} students. How many pencils does each student get?"
    ]
};   