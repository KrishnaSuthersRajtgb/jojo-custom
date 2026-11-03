import { Router } from 'express';
import { moodboardController } from '../controller/index.js';

export const moodboardRouter = Router();

moodboardRouter.get('/', (req, res) => {
  void moodboardController.getMoodBoardItems(req, res);
});

moodboardRouter.post('/', (req, res) => {
  void moodboardController.createMoodBoardItem(req, res);
});

moodboardRouter.put('/:id', (req, res) => {
  void moodboardController.updateMoodBoardItem(req, res);
});

moodboardRouter.delete('/:id', (req, res) => {
  void moodboardController.deleteMoodBoardItem(req, res);
});
