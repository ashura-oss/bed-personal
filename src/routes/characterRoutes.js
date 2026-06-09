import { Router } from 'express';
import {
  addCharacter,
  getCharacter,
  listCharacters,
} from '../controllers/characterController.js';

const router = Router();

router.get('/', listCharacters);
router.post('/', addCharacter);
router.get('/:characterId', getCharacter);

export default router;
