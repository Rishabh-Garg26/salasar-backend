/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("notifications_permissions", (table) => {
    table.increments("id").primary();
    table.string("name");
    table.boolean("emailEnabled").defaultTo(false);
    table.boolean("phoneEnabled").defaultTo(false);
    table.string("email");
    table.string("phone");
    table.json("graphs");
    table.string("time");
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("notifications_permissions");
};
