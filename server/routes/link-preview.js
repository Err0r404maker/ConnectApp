import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import https from 'https';
import http from 'http';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.match(/^https?:\/\//)) {
      return res.status(400).json({ error: 'Неверный URL' });
    }

    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk;
        if (html.length > 50000) {
          response.destroy();
        }
      });

      response.on('end', () => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

        res.json({
          title: titleMatch ? titleMatch[1] : 'Без названия',
          description: descMatch ? descMatch[1] : '',
          image: imageMatch ? imageMatch[1] : null,
          url
        });
      });
    }).on('error', () => {
      res.status(500).json({ error: 'Ошибка загрузки' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка предпросмотра' });
  }
});

export default router;
