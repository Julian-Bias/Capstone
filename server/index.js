require("dotenv").config();
const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Public Routes ---

//  Get all games
app.get("/api/games", async (req, res) => {
  try {
    const games = await db.fetchGames();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching games");
  }
});

//  Get game details
app.get("/api/games/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const game = await db.client.query(
      `
      SELECT g.*, c.name as category_name, 
             (SELECT AVG(rating) FROM reviews WHERE game_id = $1) as average_rating
      FROM games g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.id = $1
    `,
      [id]
    );
    const reviews = await db.client.query(
      `
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.game_id = $1
    `,
      [id]
    );
    res.json({ game: game.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching game details");
  }
});

//  Register a new user
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      username,
      email,
      password_hash: hashedPassword,
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

//  Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.client.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (
      user.rows.length === 0 ||
      !(await bcrypt.compare(password, user.rows[0].password_hash))
    ) {
      return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

// --- Protected Routes ---

//  Create a review
app.post("/api/reviews", authenticateToken, async (req, res) => {
  const { game_id, rating, review_text } = req.body;
  try {
    const review = await db.createReview({
      game_id,
      user_id: req.user.id,
      rating,
      review_text,
    });
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating review");
  }
});

//  Edit a review
app.put("/api/reviews/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, review_text } = req.body;
  try {
    const result = await db.client.query(
      `
      UPDATE reviews 
      SET rating = $1, review_text = $2 
      WHERE id = $3 AND user_id = $4 RETURNING *
    `,
      [rating, review_text, id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Review not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error editing review");
  }
});

//  Delete a review
app.delete("/api/reviews/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.client.query(
      `DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Review not found");
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting review");
  }
});

//  Add a comment to a review
app.post("/api/comments", authenticateToken, async (req, res) => {
  const { review_id, comment_text } = req.body;
  try {
    const comment = await db.createComment({
      review_id,
      user_id: req.user.id,
      comment_text,
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding comment");
  }
});

//  Delete a comment
app.delete("/api/comments/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.client.query(
      `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Comment not found");
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting comment");
  }
});

// Start the server
app.listen(PORT, async () => {
  await db.client.connect();
  console.log(`Server is running on http://localhost:${PORT}`);
});
