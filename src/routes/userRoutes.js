import { Router } from 'express';
import {
  editUserProfile,
  getUser,
  listUserCharacters,
  listUsers,
  registerUser,
} from '../controllers/userController.js';

const router = Router();

router.get('/', listUsers);
router.post('/', registerUser);
router.get('/:userId', getUser);
router.patch('/:userId/profile', editUserProfile);
router.get('/:userId/characters', listUserCharacters);

export default router;
