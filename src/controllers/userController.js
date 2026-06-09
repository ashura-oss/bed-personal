import { AppError } from '../utils/_errors.js';
import { parsePositiveInteger, requireText } from '../utils/validation.js';
import {
  createUser,
  findAllUsers,
  findUserById,
  findUserByUsername,
  updateUserProfile,
} from '../models/userModel.js';
import { findCharactersByUserId } from '../models/characterModel.js';

export const listUsers = async (req, res, next) => {
  try {
    const rows = await findAllUsers();
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = parsePositiveInteger(req.params.userId, 'userId');
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found');
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const username = requireText(req.body.username, 'username', 30).toLowerCase();
    const displayName = requireText(req.body.displayName, 'displayName', 60);
    const existing = await findUserByUsername(username);

    if (existing) {
      throw new AppError('VALIDATION_ERROR', 'username is already taken');
    }

    const user = await createUser({ username, displayName });
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const editUserProfile = async (req, res, next) => {
  try {
    const userId = parsePositiveInteger(req.params.userId, 'userId');
    const displayName = requireText(req.body.displayName, 'displayName', 60);
    const user = await updateUserProfile(userId, { displayName });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found');
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const listUserCharacters = async (req, res, next) => {
  try {
    const userId = parsePositiveInteger(req.params.userId, 'userId');
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found');
    }

    const rows = await findCharactersByUserId(userId);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};
