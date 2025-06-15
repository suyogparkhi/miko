// Swap-related API routes
import express from 'express';
import { IntentService } from '../services/intent.service';
import { ProofService } from '../services/proof.service';

const router = express.Router();

// Submit a new swap intent
router.post('/intent', async (req, res) => {
  try {
    const { inputMint, outputMint, inputAmount, minOutputAmount, userAddress } = req.body;
    
    if (!inputMint || !outputMint || !inputAmount || !minOutputAmount || !userAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const intentService = new IntentService();
    const intent = await intentService.createIntent({
      inputMint,
      outputMint,
      inputAmount,
      minOutputAmount,
      userAddress
    });
    
    res.json({ success: true, intent });
  } catch (error) {
    console.error('Error creating swap intent:', error);
    res.status(500).json({ error: 'Failed to create swap intent' });
  }
});

// Get swap intent status
router.get('/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const intentService = new IntentService();
    const intent = await intentService.getIntent(id);
    
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }
    
    res.json({ success: true, intent });
  } catch (error) {
    console.error('Error fetching intent:', error);
    res.status(500).json({ error: 'Failed to fetch intent' });
  }
});

// Get all user intents
router.get('/intents/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const intentService = new IntentService();
    const intents = await intentService.getUserIntents(userAddress);
    
    res.json({ success: true, intents });
  } catch (error) {
    console.error('Error fetching user intents:', error);
    res.status(500).json({ error: 'Failed to fetch user intents' });
  }
});

// Cancel a swap intent
router.delete('/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const intentService = new IntentService();
    const success = await intentService.cancelIntent(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Intent not found or cannot be cancelled' });
    }
    
    res.json({ success: true, message: 'Intent cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling intent:', error);
    res.status(500).json({ error: 'Failed to cancel intent' });
  }
});

// Get swap proof status
router.get('/proof/:intentId', async (req, res) => {
  try {
    const { intentId } = req.params;
    const proofService = new ProofService();
    const proof = await proofService.getProof(intentId);
    
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }
    
    res.json({ success: true, proof });
  } catch (error) {
    console.error('Error fetching proof:', error);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
});

export default router; 