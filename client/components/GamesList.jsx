import React, { useState, useEffect } from "react";

const GamesList = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games");
        if (!response.ok) throw new Error("Failed to fetch games");
        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Game Reviews</h1>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <p>Average Rating: {game.average_rating.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GamesList;
