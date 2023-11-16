import { query } from '../utils/Db'

export const findUserByUsername = async (username: string) => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username])
  return result.rows[0]
}
