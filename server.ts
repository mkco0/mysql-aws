import express from 'express';
import type { Request, Response, Express } from 'express';
import 'dotenv/config';
import mysql from 'mysql2/promise';
import cors from 'cors';

// ─── Database Connection ───────────────────────────────────────────────────────

const pool = mysql.createPool({
  host: 'db-vmp.cghs2qgeepeh.us-east-1.rds.amazonaws.com',
  port: 3306,
  database: 'libreria_db',
  user: 'dean',
  password: 'admin123',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── App Setup ─────────────────────────────────────────────────────────────────

const app: Express = express();

app.use(cors()); // Permite peticiones desde tu React local
app.use(express.json());

if (!process.env.PORT) {
  throw new Error('Missing required environment variable: PORT');
}

const PORT: number = Number(process.env.PORT);

// ─── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/', (_req: Request, res: Response): Response => {
  return res.json({ status: 'ok', message: 'API Librería activa' });
});

// GET /productos — Listar todos
app.get('/productos', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos', detail: err });
  }
});

// GET /productos/:id — Obtener uno
app.get('/productos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto', detail: err });
  }
});

// POST /productos — Crear
app.post('/productos', async (req: Request, res: Response): Promise<void> => {
  const { nombre, autor, precio, stock, categoria } = req.body;

  if (!nombre || !autor || precio == null || stock == null || !categoria) {
    res.status(400).json({ error: 'Faltan campos requeridos: nombre, autor, precio, stock, categoria' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'INSERT INTO productos (nombre, autor, precio, stock, categoria) VALUES (?, ?, ?, ?, ?)',
      [nombre, autor, precio, stock, categoria]
    );
    res.status(201).json({ id: result.insertId, nombre, autor, precio, stock, categoria });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto', detail: err });
  }
});

// PUT /productos/:id — Actualizar
app.put('/productos/:id', async (req: Request, res: Response): Promise<void> => {
  const { nombre, autor, precio, stock, categoria } = req.body;

  if (!nombre || !autor || precio == null || stock == null || !categoria) {
    res.status(400).json({ error: 'Faltan campos requeridos: nombre, autor, precio, stock, categoria' });
    return;
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE productos SET nombre = ?, autor = ?, precio = ?, stock = ?, categoria = ? WHERE id = ?',
      [nombre, autor, precio, stock, categoria, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json({ id: Number(req.params.id), nombre, autor, precio, stock, categoria });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto', detail: err });
  }
});

// DELETE /productos/:id — Eliminar
app.delete('/productos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const [result]: any = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto', detail: err });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, (): void => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📦 Base de datos: libreria_db @ AWS RDS`);
});