const knexConfig = require("./config/knexfile");

console.log("=== Knex Migration Debug Info ===");
console.log("Environment: development");
console.log("Database Configuration:");
console.log(JSON.stringify(knexConfig.development, null, 2));

console.log("\n=== Environment Variables ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

console.log("\n=== Running Migration ===");

// Now run the migration
const knex = require("knex")(knexConfig.development);

knex.migrate
  .latest()
  .then(() => {
    console.log("✅ Migration completed successfully");
    return knex.destroy();
  })
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    return knex.destroy();
  });
