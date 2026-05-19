// Repositories
export const QUOTE_QUERY_REPOSITORY_TOKEN: unique symbol = Symbol("QUOTE_QUERY_REPOSITORY_TOKEN");

// Services
export const QUOTE_UNIT_OF_WORK_SERVICE_TOKEN: unique symbol = Symbol("QUOTE_UNIT_OF_WORK_SERVICE_TOKEN");

// Command handlers
export const ACCEPT_QUOTE_COMMAND_TOKEN: unique symbol = Symbol("ACCEPT_QUOTE_COMMAND_TOKEN");
export const CREATE_QUOTE_COMMAND_TOKEN: unique symbol = Symbol("CREATE_QUOTE_COMMAND_TOKEN");
export const REJECT_QUOTE_COMMAND_TOKEN: unique symbol = Symbol("REJECT_QUOTE_COMMAND_TOKEN");
export const SEND_QUOTE_COMMAND_TOKEN: unique symbol = Symbol("SEND_QUOTE_COMMAND_TOKEN");

// Query handlers
export const GET_QUOTE_QUERY_TOKEN: unique symbol = Symbol("GET_QUOTE_QUERY_TOKEN");
export const GET_QUOTE_SUMMARY_QUERY_TOKEN: unique symbol = Symbol("GET_QUOTE_SUMMARY_QUERY_TOKEN");
