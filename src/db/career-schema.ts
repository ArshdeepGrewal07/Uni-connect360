import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
import {users} from './schema';
export const careerCatalog=sqliteTable('career_catalog',{
 id:text('id').primaryKey(),kind:text('kind').notNull(),ownerId:text('owner_id').references(()=>users.id,{onDelete:'cascade'}),data:text('data',{mode:'json'}).notNull(),sample:integer('sample').notNull().default(0),closed:integer('closed').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[index('career_kind_idx').on(t.kind,t.closed)]);
export const careerProgress=sqliteTable('career_progress',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),trackId:text('track_id').notNull().references(()=>careerCatalog.id,{onDelete:'cascade'}),completed:text('completed',{mode:'json'}).notNull(),version:integer('version').notNull().default(0),updatedAt:integer('updated_at').notNull(),
},t=>[primaryKey({columns:[t.userId,t.trackId]})]);
export const careerApplications=sqliteTable('career_applications',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),opportunityId:text('opportunity_id').notNull().references(()=>careerCatalog.id,{onDelete:'cascade'}),note:text('note').notNull(),status:text('status').notNull(),createdAt:integer('created_at').notNull(),
},t=>[primaryKey({columns:[t.userId,t.opportunityId]}),index('career_app_opportunity_idx').on(t.opportunityId)]);
export const careerSaved=sqliteTable('career_saved',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),opportunityId:text('opportunity_id').notNull().references(()=>careerCatalog.id,{onDelete:'cascade'}),
},t=>[primaryKey({columns:[t.userId,t.opportunityId]})]);
export const careerProfiles=sqliteTable('career_profiles',{
 userId:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),data:text('data',{mode:'json'}).notNull(),version:integer('version').notNull().default(0),updatedAt:integer('updated_at').notNull(),
});
export const careerAttempts=sqliteTable('career_attempts',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),kind:text('kind').notNull(),targetId:text('target_id').notNull().references(()=>careerCatalog.id,{onDelete:'cascade'}),answer:text('answer').notNull(),feedback:text('feedback',{mode:'json'}).notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('career_attempts_user_idx').on(t.userId,t.createdAt)]);
export const skillBeacons=sqliteTable('skill_beacons',{
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),kind:text('kind').notNull(),title:text('title').notNull(),description:text('description').notNull(),location:text('location').notNull(),room:text('room').notNull(),reward:text('reward').notNull(),x:integer('x').notNull(),y:integer('y').notNull(),expiresAt:integer('expires_at').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('skill_beacon_expiry_idx').on(t.expiresAt)]);
export const skillBeaconMembers=sqliteTable('skill_beacon_members',{
 beaconId:text('beacon_id').notNull().references(()=>skillBeacons.id,{onDelete:'cascade'}),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),createdAt:integer('created_at').notNull(),
},t=>[primaryKey({columns:[t.beaconId,t.userId]})]);
