/**
 * Shared network/data shapes for the client runtime.
 * This file intentionally carries JSDoc typedefs only.
 */

/**
 * @typedef {object} ApiErrorPayload
 * @property {string} error
 * @property {string} message
 */

/**
 * @typedef {object} RuntimeCharacterStats
 * @property {number} maxHp
 * @property {number} maxFp
 * @property {number} maxStamina
 * @property {number} lightDmg
 * @property {number} heavyDmg
 * @property {number} rollSpeed
 */

/**
 * @typedef {object} RealmforgeUser
 * @property {string} userId
 * @property {string} username
 */

/**
 * @typedef {object} RealmforgeCharacter
 * @property {string} characterId
 * @property {string} characterName
 * @property {string} className
 * @property {number} level
 * @property {number} xp
 * @property {number} hp
 * @property {number} endurance
 * @property {number} intelligence
 * @property {number} faith
 * @property {number} agility
 * @property {number} strength
 */

/**
 * @typedef {object} AuthResult
 * @property {boolean} ok
 * @property {string} [message]
 * @property {RealmforgeUser} [user]
 * @property {RealmforgeCharacter} [character]
 * @property {RuntimeCharacterStats} [stats]
 */

export {};
