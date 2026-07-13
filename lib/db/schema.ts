import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  profileType: text('profile_type').notNull(),
  sort: integer('sort').notNull().default(0),
})

export const standards = pgTable('standards', {
  id: serial('id').primaryKey(),
  designation: text('designation').notNull().unique(),
  title: text('title').notNull(),
  system: text('system').notNull(),
  status: text('status').notNull().default('active'),
  replacedByDesignation: text('replaced_by_designation'),
  note: text('note'),
})

export const steelGrades = pgTable('steel_grades', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  standardDesignation: text('standard_designation').notNull(),
  gradeClass: text('grade_class').notNull(),
  description: text('description'),
})

export const gradeAnalogs = pgTable('grade_analogs', {
  id: serial('id').primaryKey(),
  gradeId: integer('grade_id').notNull(),
  system: text('system').notNull(),
  designation: text('designation').notNull(),
  standardDesignation: text('standard_designation'),
})

export const sizeItems = pgTable('size_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  standardDesignation: text('standard_designation').notNull(),
  designation: text('designation').notNull(),
  slug: text('slug').notNull().unique(),
  dim1: numeric('dim1'),
  dim2: numeric('dim2'),
  dim3: numeric('dim3'),
  dim4: numeric('dim4'),
  massPerM: numeric('mass_per_m'),
  params: jsonb('params').notNull().default({}),
  availability: text('availability').notNull().default('medium'),
  status: text('status').notNull().default('active'),
})

export const standardDocuments = pgTable('standard_documents', {
  id: serial('id').primaryKey(),
  system: text('system').notNull(),
  designation: text('designation').notNull().unique(),
  title: text('title').notNull(),
  edition: text('edition'),
  effectiveDate: date('effective_date'),
  withdrawnDate: date('withdrawn_date'),
  status: text('status').notNull().default('unknown'),
  replacedByStandardId: integer('replaced_by_standard_id'),
  sourceUrl: text('source_url'),
  sourceNote: text('source_note'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profileFamilies = pgTable('profile_families', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shapeType: text('shape_type').notNull(),
  productionMethod: text('production_method'),
  legacyCategoryId: integer('legacy_category_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profileSpecifications = pgTable('profile_specifications', {
  id: serial('id').primaryKey(),
  familyId: integer('family_id').notNull(),
  geometryStandardId: integer('geometry_standard_id'),
  designation: text('designation').notNull(),
  productionMethod: text('production_method'),
  purposeCategory: text('purpose_category'),
  accuracyClass: text('accuracy_class'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceClause: text('source_clause'),
  supersededBySpecificationId: integer('superseded_by_specification_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const standardRelationships = pgTable('standard_relationships', {
  id: serial('id').primaryKey(),
  sourceStandardId: integer('source_standard_id').notNull(),
  targetStandardId: integer('target_standard_id').notNull(),
  relationType: text('relation_type').notNull(),
  scope: text('scope').notNull().default('full'),
  legalEffect: text('legal_effect'),
  sourceClause: text('source_clause'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('standard_relationships_source_idx').on(table.sourceStandardId)])

export const profileSpecificationStandardHistory = pgTable('profile_specification_standard_history', {
  id: serial('id').primaryKey(),
  profileSpecificationId: integer('profile_specification_id').notNull(),
  standardDocumentId: integer('standard_document_id').notNull(),
  applicabilityStatus: text('applicability_status').notNull(),
  effectiveFrom: date('effective_from'),
  effectiveTo: date('effective_to'),
  replacementScope: text('replacement_scope'),
  sourceClause: text('source_clause'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('profile_standard_history_spec_idx').on(table.profileSpecificationId)])

export const strengthClasses = pgTable('strength_classes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  normalizedCode: text('normalized_code').notNull().unique(),
  title: text('title'),
  category: text('category').notNull().default('steel_strength_class'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceStandardId: integer('source_standard_id'),
  sourceClause: text('source_clause'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profileSizes = pgTable('profile_sizes', {
  id: serial('id').primaryKey(),
  specificationId: integer('specification_id').notNull(),
  legacySizeItemId: integer('legacy_size_item_id').unique(),
  slug: text('slug').notNull().unique(),
  designation: text('designation').notNull(),
  dimensions: jsonb('dimensions').notNull().default({}),
  dim1: numeric('dim1'),
  dim2: numeric('dim2'),
  dim3: numeric('dim3'),
  dim4: numeric('dim4'),
  massPerM: numeric('mass_per_m'),
  area: numeric('area'),
  ix: numeric('ix'),
  iy: numeric('iy'),
  wx: numeric('wx'),
  wy: numeric('wy'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceClause: text('source_clause'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('profile_sizes_specification_idx').on(table.specificationId)])

export const materialGrades = pgTable('material_grades', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull().unique(),
  aliases: jsonb('aliases').notNull().default([]),
  category: text('category').notNull().default('steel'),
  weldability: text('weldability'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceNote: text('source_note'),
  sourceMaterialId: text('source_material_id'),
  catalogSection: text('catalog_section'),
  materialClass: text('material_class'),
  industrialUse: text('industrial_use'),
  verificationStatus: text('verification_status').notNull().default('needs_review'),
  sourceUrl: text('source_url'),
  sourceRetrievedAt: timestamp('source_retrieved_at', { withTimezone: true }),
  sourceName: text('source_name'),
  decodingSummary: text('decoding_summary'),
  decoding: jsonb('decoding').notNull().default({}),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const materialGradeStandards = pgTable('material_grade_standards', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  standardDocumentId: integer('standard_document_id').notNull(),
  designationInStandard: text('designation_in_standard').notNull(),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceClause: text('source_clause'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const allowedProfileMaterials = pgTable('allowed_profile_materials', {
  id: serial('id').primaryKey(),
  profileSpecificationId: integer('profile_specification_id'),
  profileSizeId: integer('profile_size_id'),
  materialGradeId: integer('material_grade_id'),
  strengthClassId: integer('strength_class_id'),
  purposeCategory: text('purpose_category').notNull().default('general'),
  accuracyClass: text('accuracy_class').notNull().default('any'),
  recommendationStatus: text('recommendation_status').notNull().default('needs_review'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  governingStandardId: integer('governing_standard_id'),
  sourceClause: text('source_clause'),
  sourceNote: text('source_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('allowed_profile_materials_size_idx').on(table.profileSizeId),
  index('allowed_profile_materials_spec_idx').on(table.profileSpecificationId),
  index('allowed_profile_materials_material_idx').on(table.materialGradeId),
])

export const profileStandardMigrationRuns = pgTable('profile_standard_migration_runs', {
  id: serial('id').primaryKey(),
  migrationKey: text('migration_key').notNull().unique(),
  profileFamilyId: integer('profile_family_id'),
  sourceStandardId: integer('source_standard_id'),
  targetStandardId: integer('target_standard_id'),
  sourceCount: integer('source_count').notNull().default(0),
  migratedCount: integer('migrated_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  unchangedCount: integer('unchanged_count').notNull().default(0),
  report: jsonb('report').notNull().default({}),
  status: text('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const geometryStandardMappings = pgTable('geometry_standard_mappings', {
  id: serial('id').primaryKey(),
  sourceStandardId: integer('source_standard_id').notNull(),
  targetStandardId: integer('target_standard_id').notNull(),
  profileFamilyId: integer('profile_family_id'),
  mappingStatus: text('mapping_status').notNull().default('needs_review'),
  evidence: text('evidence'),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const materialStandardMappings = pgTable('material_standard_mappings', {
  id: serial('id').primaryKey(),
  sourceMaterialGradeId: integer('source_material_grade_id').notNull(),
  targetMaterialGradeId: integer('target_material_grade_id').notNull(),
  sourceStandardId: integer('source_standard_id'),
  targetStandardId: integer('target_standard_id'),
  mappingStatus: text('mapping_status').notNull().default('needs_review'),
  evidence: text('evidence'),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const chemicalCompositionLimits = pgTable('chemical_composition_limits', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  standardDocumentId: integer('standard_document_id'),
  elementSymbol: text('element_symbol').notNull(),
  minPercent: numeric('min_percent'),
  maxPercent: numeric('max_percent'),
  valueRaw: text('value_raw'),
  approximateValue: numeric('approximate_value'),
  unit: text('unit').notNull().default('%'),
  sourceUrl: text('source_url'),
  verificationStatus: text('verification_status').notNull().default('needs_review'),
  sourceFingerprint: text('source_fingerprint'),
  dataStatus: text('data_status').notNull().default('needs_review'),
  sourceClause: text('source_clause'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const materialProperties = pgTable('material_properties', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  propertyKey: text('property_key').notNull(),
  valueRaw: text('value_raw'),
  valueJson: jsonb('value_json').notNull().default({}),
  sourceUrl: text('source_url'),
  verificationStatus: text('verification_status').notNull().default('imported_unverified'),
  sourceFingerprint: text('source_fingerprint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const mechanicalPropertyRaw = pgTable('mechanical_property_raw', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  tableNumber: integer('table_number'),
  rowNumber: integer('row_number'),
  conditionRaw: text('condition_raw'),
  valuesJson: jsonb('values_json').notNull().default({}),
  sourceUrl: text('source_url'),
  verificationStatus: text('verification_status').notNull().default('imported_unverified'),
  sourceFingerprint: text('source_fingerprint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const materialStandardReferences = pgTable('material_standard_references', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  standardSystemRaw: text('standard_system_raw'),
  standardNumberRaw: text('standard_number_raw'),
  mentionStatus: text('mention_status').notNull().default('mentioned_unverified'),
  sourceUrl: text('source_url'),
  sourceFingerprint: text('source_fingerprint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const externalMaterialDesignations = pgTable('external_material_designations', {
  id: serial('id').primaryKey(),
  normalizedDesignation: text('normalized_designation').notNull(),
  designation: text('designation').notNull(),
  country: text('country'),
  systemHint: text('system_hint'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const materialAnalogueCandidates = pgTable('material_analogue_candidates', {
  id: serial('id').primaryKey(),
  materialGradeId: integer('material_grade_id').notNull(),
  externalDesignationId: integer('external_designation_id').notNull(),
  sourceUrl: text('source_url'),
  mappingStatus: text('mapping_status').notNull().default('needs_review'),
  verificationStatus: text('verification_status').notNull().default('imported_unverified'),
  sourceFingerprint: text('source_fingerprint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const migrationReviewIssues = pgTable('migration_review_issues', {
  id: serial('id').primaryKey(),
  issueKey: text('issue_key').notNull().unique(),
  entityType: text('entity_type').notNull(),
  legacyEntityId: integer('legacy_entity_id'),
  issueCode: text('issue_code').notNull(),
  severity: text('severity').notNull().default('warning'),
  message: text('message').notNull(),
  payload: jsonb('payload').notNull().default({}),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
