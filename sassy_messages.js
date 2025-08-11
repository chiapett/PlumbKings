// Amanda's Sassy Messages

function getSassyLossMessage(pounds) {
    const messages = [
        `Amanda says: FINALLY! ${pounds} lbs down! I was starting to think you were allergic to progress, bitch! 💪`,
        `Amanda's shocked: ${pounds} lbs lost?! Holy shit, did someone actually listen to me for once?! 👏`,
        `Amanda admits: ${pounds} lbs down! Fine, you're not completely hopeless... this time, sweetie! 🥗`,
        `Amanda declares: ${pounds} lbs vanished! Did you finally dump that toxic relationship with carbs? 🍕💔`,
        `Amanda's verdict: ${pounds} lbs gone! Someone grew a backbone! I'm genuinely surprised! 🚨`
    ];
    
    const smallMessages = [
        `Amanda sighs: ${pounds} lb${pounds === 1 ? '' : 's'} down... baby steps, honey. At least your mom will still love you! 👶`,
        `Amanda's review: Lost ${pounds} lb${pounds === 1 ? '' : 's'}! That's adorable... are you even trying, babe? 😏`,
        `Amanda notes: Down ${pounds} lb${pounds === 1 ? '' : 's'}! Progress slower than my patience, but whatever works! 🐌`,
        `Amanda observes: ${pounds} lb${pounds === 1 ? '' : 's'} lighter! I've seen paint dry faster, but it's something! 🐌`,
        `Amanda's relief: ${pounds} lb${pounds === 1 ? '' : 's'} lost! Thank God, I was about to stage an intervention! 📱`
    ];
    
    if (pounds >= 5) {
        return messages[Math.floor(Math.random() * messages.length)];
    } else if (pounds >= 2) {
        return `Amanda's surprised: ${pounds} lbs down! Holy shit, you actually followed my advice! Color me fucking shocked! 👀`;
    } else {
        return smallMessages[Math.floor(Math.random() * smallMessages.length)];
    }
}

function getSassyGainMessage(pounds) {
    const bigGainMessages = [
        `Amanda's pissed: Seriously?! Up ${pounds} lbs?! Did you think this was a competitive eating contest, bitch? 🍽️`,
        `Amanda's disappointed: ${pounds} lbs heavier! Let me guess... you "forgot" about the challenge again? 🤔`,
        `Amanda's furious: Up ${pounds} lbs! I specifically told you to PUT DOWN the donuts, not collect them all! 🍩`,
        `Amanda's done: ${pounds} lbs gained! Are you trying to set a record for going backwards, sweetie? 📈😤`,
        `Amanda's fed up: Really? ${pounds} lbs more?! I'm not angry, I'm just... extremely fucking disappointed! 😞`
    ];
    
    const smallGainMessages = [
        `Amanda's annoyed: Up ${pounds} lb${pounds === 1 ? '' : 's'}! What part of "weight LOSS" did you not understand, honey? 🤨`,
        `Amanda's sarcastic: ${pounds} lb${pounds === 1 ? '' : 's'} heavier! Did you mistake the fridge for a gym again, babe? 🏋️‍♀️❌`,
        `Amanda's judging: Gained ${pounds} lb${pounds === 1 ? '' : 's'}! I can practically hear the ice cream calling your name! 🍦`,
        `Amanda's brutal: Plus ${pounds} lb${pounds === 1 ? '' : 's'}! Next time maybe try chewing your food instead of inhaling it! 😮‍💨`,
        `Amanda's suspicious: ${pounds} lb${pounds === 1 ? '' : 's'} up! I'm starting to think you're doing this just to annoy me! 😠`
    ];
    
    const tinyGainMessages = [
        `Amanda's concerned: Up ${pounds} lbs! That better be water weight or we're having words, bitch! 💧😡`,
        `Amanda's hopeful: ${pounds} lbs more! Did you weigh yourself holding a brick? Please say yes! 🧱`,
        `Amanda's impatient: Gained ${pounds} lbs! Even my patience is losing weight faster than you! ⏰`,
        `Amanda's desperate: Plus ${pounds} lbs! Your scale must be broken... right? RIGHT?! 📏😰`,
        `Amanda's threatening: ${pounds} lbs heavier! I'm about to confiscate your kitchen privileges! 🔐`
    ];
    
    if (pounds >= 3) {
        return bigGainMessages[Math.floor(Math.random() * bigGainMessages.length)];
    } else if (pounds >= 1) {
        return smallGainMessages[Math.floor(Math.random() * smallGainMessages.length)];
    } else {
        return tinyGainMessages[Math.floor(Math.random() * tinyGainMessages.length)];
    }
}

function getSassyFirstMessage() {
    const welcomeMessages = [
        'Amanda says: Look who FINALLY decided to show up! Better late than never, I guess, bitch! 🙄',
        'Amanda\'s shocked: Oh wow! You actually remembered you signed up for this! Fucking shocking! 😲',
        'Amanda\'s sarcastic: Welcome to the party! Only took you forever to get here, sweetie! ⏰',
        'Amanda\'s judging: Finally! I was starting to think you chickened out like a little bitch! 🐔',
        'Amanda\'s annoyed: About time! I almost gave your spot away to someone who actually gives a shit! 💺'
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
}

function getSassySameMessage() {
    const sameMessages = [
        "Amanda's frustrated: Exactly the same weight? Really? Did you even try this week, bitch? 🤨",
        "Amanda's done: Zero change! Are you a statue or just really committed to mediocrity? 🗿",
        "Amanda's pissed: Same weight AGAIN?! I'm starting to think your scale is as lazy as you are! ⚖️",
        "Amanda's calculating: No progress? At this rate, we'll finish the challenge in 2027, honey! 📅",
        "Amanda's suspicious: Identical weight! Let me guess... you 'forgot' about the challenge again? 🤔"
    ];
    
    return sameMessages[Math.floor(Math.random() * sameMessages.length)];
}

function getSassyLossQuote(pounds) {
    const quotes = [
        "Amanda admits: Fine, I'll admit it... you actually impressed me this time, bitch!",
        "Amanda's warning: Don't let this go to your head - you still have a long way to go, sweetie!",
        "Amanda's proud: I guess all my nagging is finally paying off! Who knew?",
        "Amanda's shocked: Look at you, actually following directions for once! Miracle!",
        "Amanda's hopeful: Maybe there's hope for you after all... maybe!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getSassyGainQuote(pounds) {
    const quotes = [
        "Amanda's disappointed: I'm not mad, I'm just extremely disappointed in your life choices, bitch!",
        "Amanda's advice: Time for some tough love - put down the fork and pick up some vegetables!",
        "Amanda's truth: This is exactly why Amanda doesn't trust people with unsupervised snacking!",
        "Amanda's sarcastic: Congratulations, you've discovered how NOT to do a weight loss challenge!",
        "Amanda's brutal: I've seen toddlers with better self-control than this shit!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getSassySameQuote() {
    const quotes = [
        "Amanda's truth: Amanda's patience is thinner than the progress you're making, bitch!",
        "Amanda's wisdom: Standing still is just moving backwards in disguise!",
        "Amanda's comparison: Even my grandmother makes faster progress, and she's 85!",
        "Amanda's math: At this rate, you'll need a calendar instead of a scale to track progress!",
        "Amanda's observation: I've seen paint dry with more enthusiasm than your weight loss!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getSassyFirstQuote() {
    const quotes = [
        "Amanda's rules: Listen up buttercup - Amanda doesn't accept excuses, only results!",
        "Amanda's world: Welcome to Amanda's world where participation trophies don't exist, bitch!",
        "Amanda's warning: Hope you're ready because Amanda's about to become your worst nightmare... I mean, trainer!",
        "Amanda's promise: Congratulations! You just signed up for daily reality checks from yours truly!",
        "Amanda's truth: Pro tip: Amanda sees everything, knows everything, and judges everything!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}
