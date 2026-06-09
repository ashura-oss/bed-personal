import { AppError } from '../utils/_errors.js';
import { parsePositiveInteger, requireText } from '../utils/validation.js';
import {
  createCharacter,
  findAllCharacters,
  findCharacterById,
} from '../models/characterModel.js';
import { findUserById } from '../models/userModel.js';

export const listCharacters = async (req, res, next) => {
  try {
    const rows = await findAllCharacters();
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

export const getCharacter = async (req, res, next) => {
  try {
    const characterId = parsePositiveInteger(req.params.characterId, 'characterId');
    const character = await findCharacterById(characterId);

    if (!character) {
      throw new AppError('NOT_FOUND', 'Character not found');
    }

    res.json({ data: character });
  } catch (error) {
    next(error);
  }
};

export const addCharacter = async (req, res, next) => {
  try {
    const userId = parsePositiveInteger(req.body.userId, 'userId');
    const name = requireText(req.body.name, 'name', 40);
    const archetype = requireText(req.body.archetype, 'archetype', 30).toLowerCase();
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found');
    }

    const character = await createCharacter({ userId, name, archetype });
    res.status(201).json({ data: character });
  } catch (error) {
    next(error);
  }
};
