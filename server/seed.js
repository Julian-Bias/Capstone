require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcrypt");
const uuid = require("uuid");

const seedData = async () => {
  try {
    await db.client.connect();

    console.log("Seeding database...");

    // Clear existing data
    await db.client.query("DELETE FROM comments;");
    await db.client.query("DELETE FROM reviews;");
    await db.client.query("DELETE FROM games;");
    await db.client.query("DELETE FROM categories;");
    await db.client.query("DELETE FROM users;");

    // Seed Users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user1 = await db.createUser({
      username: "user1",
      email: "user1@example.com",
      password_hash: hashedPassword,
      role: "user",
    });
    const user2 = await db.createUser({
      username: "admin",
      email: "admin@example.com",
      password_hash: hashedPassword,
      role: "admin",
    });
    console.log("Users seeded:", [user1, user2]);

    // Seed Categories
    const category1 = await db.createCategory("Action");
    const category2 = await db.createCategory("Adventure");
    const category3 = await db.createCategory("Simulation");
    console.log("Categories seeded:", [category1, category2, category3]);

    // Seed Games
    const game1 = await db.createGame({
      title: "Game One",
      description: "An exciting action game.",
      category_id: category1.id,
      image_url: "https://example.com/game1.jpg",
      owner_id: user2.id,
    });
    const game2 = await db.createGame({
      title: "Game Two",
      description: "A thrilling adventure game.",
      category_id: category2.id,
      image_url: "https://example.com/game2.jpg",
      owner_id: user2.id,
    });
    console.log("Games seeded:", [game1, game2]);

    // Seed Reviews
    const review1 = await db.createReview({
      game_id: game1.id,
      user_id: user1.id,
      rating: 5,
      review_text: "Amazing gameplay and graphics!",
    });
    const review2 = await db.createReview({
      game_id: game2.id,
      user_id: user1.id,
      rating: 4,
      review_text: "Great story but could use better graphics.",
    });
    console.log("Reviews seeded:", [review1, review2]);

    // Seed Comments
    const comment1 = await db.createComment({
      review_id: review1.id,
      user_id: user2.id,
      comment_text: "Thank you for the feedback!",
    });
    const comment2 = await db.createComment({
      review_id: review2.id,
      user_id: user2.id,
      comment_text: "We appreciate your thoughts!",
    });
    console.log("Comments seeded:", [comment1, comment2]);

    console.log("Database seeding completed.");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await db.client.end();
  }
};

seedData();
