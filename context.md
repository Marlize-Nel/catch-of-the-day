# Project Context

## Aim of the game 
- Guess the animal correctly 
- Build your virtual personal aquarium
- Learn about marine species

## Initial MVP
- I'm building a website called Catch of the Day — a daily marine animal guessing game, using plain HTML/CSS/JS (no framework). Guess right and the animal joins your personal aquarium forever; guess wrong and it's released back into the ocean for good, no second chances.
- A quiz screen showing today's animal (deterministic by date, like Wordle — no backend)
- The player will have three gos at guessing the animal: 
    1. First guess will have the picture of the animal and an empty text box  to enter the name of the animal (scientific or common). Also include a button for "I have no idea"
    2. If they get the wrong name wrong or click the button "I have no idea", the player will have a secong go which will include a clue (along with an empty text box, picture of the animal, and a "I have no idea" button)
    3. If they get the wrong name again or click the button "I have no idea" again, then the player will have one last go which will include a multiple choice with 3 species that it could be. 
- If the player gets the species name correctly (in either step 1, 2, or 3), they will get a fun fact about the species and be able to include it in their virtual aquarium. 
- If the player gets the species name incorrectly after three gos, they will have to release it back into the ocean and they cannot include it in their aquarium.
- During the first and second go at guessing, if they have misspelt the name  
- Right/wrong feedback screen, saved to browser local storage. 
- I'd like to have a widget with the aquarium showing all species caught so far that you can add on your computer desktop.
- One species per day, the same species for everyone playing that day.  
- Commit straight to main for now — we'll switch to branches/PRs once we have a working MVP. Commit in clean, staged steps (data file → daily logic → quiz UI → local storage → aquarium view) so the git history tells the build story.

## Data
- A data file (JSON) with 10-15 marine vertebrate species — name, image URL from Unsplash, one hint sentence, 2 plausible other species names (for multiple choice one right two wrong), one fun fact

## Planned workflow
1. scafold project
2. push to github
3. make MVP

## Coding preferences
- HTML

## Current status
- Beginning stages

## Verification checks

## Things not to do
- In the marine species, no seabirds or invertebrates. 


