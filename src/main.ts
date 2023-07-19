// main.ts
import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Sample data to be returned by the API
const data = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
  { id: 3, name: 'Bob' },
];

app.get('/api/users', (req: Request, res: Response) => {
  res.json(data);
});

export function getApp() {
  return app;
}