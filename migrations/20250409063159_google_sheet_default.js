/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("google_sheet_info", (table) => {
    table.string("default_sheet").defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("google_sheet_info", (table) => {
    table.dropColumn("default_sheet");
  });
};
