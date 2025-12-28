import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const schemaPath = path.resolve(__dirname, '..', 'schema.prisma')
const migrationsDir = path.resolve(__dirname, '..', 'migrations')
const migrationLockPath = path.resolve(migrationsDir, 'migration_lock.toml')

describe('Prisma Schema', () => {
  const schema = fs.readFileSync(schemaPath, 'utf8')

  it('uses a PostgreSQL datasource', () => {
    expect(schema).toMatch(/datasource\s+db\s+\{[\s\S]*provider\s*=\s*\"postgresql\"/)
  })

  it('defines key models', () => {
    const models = ['Category', 'Event', 'EventOccurrence', 'DailyInfo', 'UserPreference']
    for (const model of models) {
      expect(schema).toMatch(new RegExp(`\\bmodel\\s+${model}\\b`))
    }
  })

  it('defines core enums', () => {
    const enums = ['EventType', 'RecurrenceType', 'Paksha', 'Tithi', 'Nakshatra', 'Maas', 'CalendarView']
    for (const enumName of enums) {
      expect(schema).toMatch(new RegExp(`\\benum\\s+${enumName}\\b`))
    }
  })
})

describe('Prisma Migrations', () => {
  it('tracks the migration provider', () => {
    const lockFile = fs.readFileSync(migrationLockPath, 'utf8')
    expect(lockFile).toMatch(/provider\s*=\s*\"postgresql\"/)
  })

  it('includes non-empty migration files', () => {
    const migrationDirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(migrationsDir, entry.name, 'migration.sql'))
      .filter((filePath) => fs.existsSync(filePath))

    expect(migrationDirs.length).toBeGreaterThan(0)

    for (const migrationPath of migrationDirs) {
      const contents = fs.readFileSync(migrationPath, 'utf8').trim()
      expect(contents.length).toBeGreaterThan(0)
    }
  })
})
