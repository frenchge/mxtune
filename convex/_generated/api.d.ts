/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as configLikes from "../configLikes.js";
import type * as configs from "../configs.js";
import type * as conversations from "../conversations.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as messages from "../messages.js";
import type * as motos from "../motos.js";
import type * as savedConfigs from "../savedConfigs.js";
import type * as suspensionKits from "../suspensionKits.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  configLikes: typeof configLikes;
  configs: typeof configs;
  conversations: typeof conversations;
  files: typeof files;
  follows: typeof follows;
  messages: typeof messages;
  motos: typeof motos;
  savedConfigs: typeof savedConfigs;
  suspensionKits: typeof suspensionKits;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
