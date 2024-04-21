import React, { useState } from 'react';
import Groq from 'groq-sdk';
import { OpenAI } from "openai";
import './MysteryAttic.css';

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

const openai = new OpenAI({
  apiKey:"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",
  dangerouslyAllowBrowser: true,
});

// Defining the GameState interface to structure the game state with TypeScript
interface GameState {
  playerName: string;
  playerAbilities: string;
  currentLocation: string;
  currentSituation: string;
  inventory: string[];
  clues: string[];
  playerMemories: { option: string; description: string }[];
  currentImage: string;
}

// The main React component for the Mystery Attic game
export default function MysteryAttic() {
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    playerAbilities: '',
    currentLocation: 'Attic',
    currentSituation: '',
    inventory: [],
    clues: [],
    playerMemories: [],
    currentImage: '',
  });
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [showPlayerMemories, setShowPlayerMemories] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showGallery, setShowGallery] = useState(false);


  // Function to generate the initial situation in the game based on player name and abilities
  async function generateInitialSituation() {
    const prompt = `
      Mystery Attic is an interactive, narrative-driven game that seamlessly blends exploration, puzzle-solving, and storytelling within the enigmatic confines of a virtual attic. Crafted with React for fluid, responsive gameplay and incorporating Groq's advanced natural language processing, this game offers players a unique, personalized adventure through the forgotten corners of a childhood home. Each decision shapes the narrative, with an array of dynamic actions influencing the outcome of the story.

      Given the player's name (${gameState.playerName}) and abilities (${gameState.playerAbilities}), generate an initial situation for the game that incorporates the player's input and the background of the story. The situation should set the stage for the player's adventure in the mysterious attic.
    `;

    const response = await getGroq(prompt);
    setGameState((prevState) => ({
      ...prevState,
      currentSituation: response,
    }));
    await generateActionOptions();
  }

  // Function to generate action options for the player based on the current game state
  async function generateActionOptions() {
    const prompt = `
      Given the current game state:
      - Current Location: ${gameState.currentLocation}
      - Current Situation: ${gameState.currentSituation}
      - Inventory: ${gameState.inventory.join(', ')}
      - Clues: ${gameState.clues.join(', ')}

      Generate a list of four action options available to the player at this stage of the game. The options should be limited to the following actions:
      - Find an item
      - Inspect an item
      - Combine items
      - Find a clue
      - Analyze a clue
      - Combine clues

      Provide only the action options, separated by newlines, without any additional information.
    `;

    const response = await getGroq(prompt);
    const options = response.split('\n').filter((option) => option.trim() !== '');
    setActionOptions(options.slice(0, 4));
  }

  // Function to interact with the Groq API using the provided prompt
  async function getGroq(gropPrompt: string) {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: gropPrompt,
        },
      ],
      model: 'mixtral-8x7b-32768',
    });

    return completion.choices[0]?.message?.content || '';
  }

  // Function to generate a vivid image description using Groq
  async function getGroqCompletion(prompt: string, maxTokens: number) {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'mixtral-8x7b-32768',
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // Function to generate images using the open ai
  async function generateImage(sceneSituation: string) {
    const imagePrompt = await getGroq(`Generate an image description based on the following scene situation, with a word limit of 100 words:\n\n${sceneSituation}`);

    const response = await openai.createImage({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data.data[0].url;
    return imageUrl;
  }
  
  // Function to handle the player's action choice and update the game state accordingly
  async function handleActionClick(selectedAction: string) {
    const prompt = `
      Given the current game state:
      - Current Location: ${gameState.currentLocation}
      - Current Situation: ${gameState.currentSituation}
      - Inventory: ${gameState.inventory.join(', ')}
      - Clues: ${gameState.clues.join(', ')}
      - Selected Action: ${selectedAction}

      Generate a narrative description of the outcome of the selected action, update the player's location (if applicable), and provide the updated current situation. Provide the updated location, current situation, and the outcome description, separated by newlines.
    `;

    const response = await getGroq(prompt);
    const [currentLocation, currentSituation, outcomeDescription] = response.split('\n').filter((option) => option.trim() !== '');

    setGameState((prevState) => ({
      ...prevState,
      currentLocation,
      currentSituation,
      playerMemories: [...prevState.playerMemories, { option: selectedAction, description: outcomeDescription }],
    }));

    const imgUrl = await generateImage(outcomeDescription);
    setGameState((prevState) => ({
      ...prevState,
      currentLocation,
      currentSituation,
      playerMemories: [...prevState.playerMemories, { option: selectedAction, description: outcomeDescription, image: imgUrl }],
    }));
    await generateActionOptions();
  }

  // Function to start the game, setting the gameStarted state to true and generating the initial situation
  function handleStartGame() {
    setGameStarted(true);
    generateInitialSituation();
  }

  // Displayed elements based on the game state
  return (
    <div className="mystery-attic">
      <div className="header">
        <h1>Mystery Attic</h1>
      </div>
      {!gameStarted ? (
        <div className="player-setup">
          <input
            type="text"
            placeholder="Enter your name"
            value={gameState.playerName}
            onChange={(e) => setGameState((prevState) => ({ ...prevState, playerName: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Enter your abilities"
            value={gameState.playerAbilities}
            onChange={(e) => setGameState((prevState) => ({ ...prevState, playerAbilities: e.target.value }))}
          />
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      ) : (
        <>
           <p className="current-location">Where you are: {gameState.currentLocation}</p>
                    <button className="player-memories-toggle" onClick={() => setShowPlayerMemories(!showPlayerMemories)}>
                      {showPlayerMemories ? 'Hide Player Memories' : 'Show Player Memories'}
                    </button>
                    <button className="gallery-toggle" onClick={() => setShowGallery(!showGallery)}>
                      {showGallery ? 'Hide Gallery' : 'Show Gallery'}
                    </button>
                    {showPlayerMemories && (
                      <div className="player-memories">
                        <h3>Player Memories</h3>
                        {gameState.playerMemories.map(({ option, description, image }, index) => (
                          <div key={index}>
                            <p>Option: {option}</p>
                            <p>Description: {description}</p>
                            <img src={image} alt={`Scene ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    {showGallery && (
                      <div className="gallery">
                        <h3>Gallery</h3>
                        {gameState.playerMemories.map(({ description, image }, index) => (
                          <div key={index}>
                            <p>Scene {index + 1}: {description}</p>
                            <img src={image} alt={`Scene ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="current-situation">{gameState.currentSituation}</p>
                    {actionOptions.length === 0 ? (
                      <p>Loading...</p>
                    ) : (
                      <div className="action-options">
                        {actionOptions.map((option, index) => (
                          <button key={index} className="action-option" onClick={() => handleActionClick(option)}>
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }