/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("roles", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable().unique(); // Role name
      table.timestamps(true, true);
    })
    .createTable("permissions", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable().unique(); // Permission name
      table.timestamps(true, true);
    })
    .createTable("role_permissions", (table) => {
      table.increments("id").primary();
      table
        .integer("role_id")
        .unsigned()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      table
        .integer("permission_id")
        .unsigned()
        .references("id")
        .inTable("permissions")
        .onDelete("CASCADE");
      table.timestamps(true, true);
    })
    .createTable("users", (table) => {
      table.increments("id").primary();
      table.string("email").notNullable().unique();
      table.string("password").notNullable();
      table.boolean("is_verified").defaultTo(false); // For email verification
      table
        .integer("role_id")
        .unsigned()
        .references("id")
        .inTable("roles")
        .onDelete("SET NULL");
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("users")
    .dropTableIfExists("role_permissions")
    .dropTableIfExists("permissions")
    .dropTableIfExists("roles");
};
