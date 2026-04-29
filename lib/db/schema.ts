import { pgTable, serial, text, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const contacts = pgTable('contacts', {
  id:              serial('id').primaryKey(),
  sourceFile:      text('source_file'),
  sourceCategory:  text('source_category'),   // Gold Mine | Odoo | EPZ | Tourism | BEIOA | Associations
  subCategory:     text('sub_category'),        // Textiles & Apparel | Engineering | Leather | etc.
  association:     text('association'),          // BGMEA | BKMEA | BASIS | etc.
  memberType:      text('member_type'),          // General | Associate | etc.
  memberSince:     text('member_since'),
  membershipNo:    text('membership_no'),
  name:            text('name'),
  company:         text('company'),
  designation:     text('designation'),
  email:           text('email'),
  phone:           text('phone'),
  phone2:          text('phone2'),
  address:         text('address'),
  city:            text('city'),
  country:         text('country').default('Bangladesh'),
  website:         text('website'),
  industry:        text('industry'),
  products:        text('products'),
  services:        text('services'),
  extraData:       jsonb('extra_data').default({}),
  emailStatus:     varchar('email_status', { length: 20 }).default('not_sent'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
}, (t) => [
  index('idx_email').on(t.email),
  index('idx_source_category').on(t.sourceCategory),
  index('idx_email_status').on(t.emailStatus),
  index('idx_association').on(t.association),
  index('idx_company').on(t.company),
])

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
