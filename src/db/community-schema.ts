import { integer, text, sqliteTable, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './schema';
export const communityRecords = sqliteTable('community_records', {
 id: text('id').primaryKey(), kind: text('kind').notNull(),
 ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
 data: text('data', {mode:'json'}).notNull(), sample: integer('sample', {mode:'boolean'}).notNull().default(false),
 expiresAt: integer('expires_at'), version: integer('version').notNull().default(0),
 mutationToken: text('mutation_token'), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, t=>[index('community_kind_expiry_idx').on(t.kind,t.expiresAt),index('community_owner_idx').on(t.ownerId)]);
export const communityInteractions = sqliteTable('community_interactions', {
 id:text('id').primaryKey(), recordId:text('record_id').notNull().references(()=>communityRecords.id,{onDelete:'cascade'}),
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}), action:text('action').notNull(), createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('community_interaction_unique').on(t.recordId,t.userId,t.action),index('community_interaction_user_idx').on(t.userId)]);
export const userPreferences = sqliteTable('user_preferences', {
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}), key:text('key').notNull(),
 value:text('value',{mode:'json'}).notNull(), version:integer('version').notNull().default(0), updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('user_preference_key').on(t.userId,t.key)]);
export const mediaFiles = sqliteTable('media_files', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 sessionId:text('session_id'), purpose:text('purpose').notNull(), objectKey:text('object_key').notNull().unique(),
 contentType:text('content_type').notNull(), bytes:integer('bytes').notNull(), createdAt:integer('created_at').notNull(),
},t=>[index('media_owner_idx').on(t.ownerId),index('media_session_idx').on(t.sessionId)]);
export const telemetryReadings = sqliteTable('telemetry_readings', {
 id:text('id').primaryKey(), source:text('source').notNull(), data:text('data',{mode:'json'}).notNull(), capturedAt:integer('captured_at').notNull(),
},t=>[index('telemetry_captured_idx').on(t.capturedAt)]);
export const seedVersions=sqliteTable('seed_versions',{id:text('id').primaryKey(),appliedAt:integer('applied_at').notNull()});
export const guardianSessions=sqliteTable('guardian_sessions',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 route:text('route',{mode:'json'}).notNull(),status:text('status').notNull(),deadline:integer('deadline').notNull(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[index('guardian_user_created_idx').on(t.userId,t.createdAt)]);
export const notifications=sqliteTable('notifications',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
 actorId:text('actor_id').references(()=>users.id,{onDelete:'set null'}),recordId:text('record_id').references(()=>communityRecords.id,{onDelete:'cascade'}),
 body:text('body').notNull(),readAt:integer('read_at'),createdAt:integer('created_at').notNull(),
},t=>[index('notifications_user_created_idx').on(t.userId,t.createdAt)]);
export const communityActivity=sqliteTable('community_activity',{
 id:text('id').primaryKey(),recordId:text('record_id').notNull().references(()=>communityRecords.id,{onDelete:'cascade'}),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),action:text('action').notNull(),data:text('data',{mode:'json'}).notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('activity_record_created_idx').on(t.recordId,t.createdAt)]);
export const focusSessions=sqliteTable('focus_sessions',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),kind:text('kind').notNull(),duration:integer('duration').notNull(),remaining:integer('remaining').notNull(),deadline:integer('deadline').notNull(),status:text('status').notNull(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[index('focus_user_kind_created_idx').on(t.userId,t.kind,t.createdAt)]);

export const userCredentials=sqliteTable('user_credentials',{
 userId:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),
 passwordHash:text('password_hash').notNull(),updatedAt:integer('updated_at').notNull(),
});
export const loginAttempts=sqliteTable('login_attempts',{
 identifier:text('identifier').primaryKey(),attempts:integer('attempts').notNull(),windowStart:integer('window_start').notNull(),
});
