import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const time = (name: string) => integer(name, { mode: "timestamp_ms" }).$defaultFn(() => new Date());

const dateStr = (name: string) => text(name);

export type AppRole = "admin" | "parent" | "superadmin";
export type StudentStatus = "active" | "graduated" | "inactive";
export type InvoiceType = "spp" | "non_spp" | "event";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";
export type PaymentMethod = "qris" | "offline";
export type PaymentStatus = "pending" | "confirmed" | "rejected" | "voided";

const id = (name = "id") =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const users = sqliteTable(
  "users",
  {
    id: id(),
    username: text("username").notNull().unique(),
    full_name: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    password_hash: text("password_hash").notNull(),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    last_login_at: integer("last_login_at", { mode: "timestamp_ms" }),
    created_at: time("created_at").notNull(),
    updated_at: time("updated_at").notNull(),
  },
  (t) => [index("users_is_active_idx").on(t.is_active)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token_hash: text("token_hash").notNull().unique(),
    created_at: time("created_at").notNull(),
    expires_at: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("sessions_user_expires_idx").on(t.user_id, t.expires_at),
    index("sessions_token_idx").on(t.token_hash),
  ],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    id: id(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "parent", "superadmin"] }).notNull(),
  },
  (t) => [uniqueIndex("user_roles_user_role_uq").on(t.user_id, t.role)],
);

export const students = sqliteTable(
  "students",
  {
    id: id(),
    nis: text("nis").notNull().unique(),
    full_name: text("full_name").notNull(),
    gender: text("gender"),
    class_name: text("class_name"),
    grade_level: integer("grade_level"),
    cohort: text("cohort"),
    status: text("status", { enum: ["active", "graduated", "inactive"] })
      .notNull()
      .default("active"),
    guardian_phone: text("guardian_phone"),
    deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
    deleted_by: text("deleted_by").references(() => users.id, { onDelete: "set null" }),
    created_at: time("created_at").notNull(),
  },
  (t) => [
    index("students_status_deleted_idx").on(t.status, t.deleted_at),
    index("students_class_idx").on(t.class_name),
  ],
);

export const parents = sqliteTable(
  "parents",
  {
    id: id(),
    user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
    username: text("username"),
    full_name: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
    created_at: time("created_at").notNull(),
  },
  (t) => [index("parents_user_idx").on(t.user_id), index("parents_username_idx").on(t.username)],
);

export const parentStudents = sqliteTable(
  "parent_students",
  {
    id: id(),
    parent_id: text("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    student_id: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    relation: text("relation"),
  },
  (t) => [uniqueIndex("parent_students_parent_student_uq").on(t.parent_id, t.student_id)],
);

export const sppSettings = sqliteTable("spp_settings", {
  id: id(),
  academic_year: text("academic_year").notNull(),
  grade_level: integer("grade_level"),
  class_name: text("class_name"),
  amount: integer("amount").notNull(),
  billing_day: integer("billing_day").notNull().default(1),
  due_day: integer("due_day").notNull().default(10),
  late_fee: integer("late_fee").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  created_at: time("created_at").notNull(),
});

export const events = sqliteTable(
  "events",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description"),
    total_amount: integer("total_amount").notNull().default(0),
    deadline: dateStr("deadline"),
    grace_months: integer("grace_months").notNull().default(3),
    allow_installment: integer("allow_installment", { mode: "boolean" }).notNull().default(true),
    deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
    created_at: time("created_at").notNull(),
  },
  (t) => [index("events_deleted_idx").on(t.deleted_at)],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: id(),
    student_id: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["spp", "non_spp", "event"] }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    event_id: text("event_id").references(() => events.id, { onDelete: "set null" }),
    period_month: integer("period_month"),
    period_year: integer("period_year"),
    amount: integer("amount").notNull(),
    paid_amount: integer("paid_amount").notNull().default(0),
    status: text("status", { enum: ["unpaid", "partial", "paid", "cancelled"] })
      .notNull()
      .default("unpaid"),
    due_date: dateStr("due_date"),
    grace_until: dateStr("grace_until"),
    allow_installment: integer("allow_installment", { mode: "boolean" }).notNull().default(false),
    deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
    deleted_by: text("deleted_by").references(() => users.id, { onDelete: "set null" }),
    created_at: time("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("invoices_spp_unique")
      .on(t.student_id, t.period_year, t.period_month)
      .where(sql`${t.type} = 'spp'`),
    uniqueIndex("invoices_event_unique")
      .on(t.student_id, t.event_id)
      .where(sql`${t.type} = 'event'`),
    index("invoices_student_deleted_idx").on(t.student_id, t.deleted_at),
    index("invoices_type_period_idx").on(t.type, t.period_year, t.period_month, t.deleted_at),
    index("invoices_status_idx").on(t.status, t.deleted_at),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    invoice_id: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    student_id: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull().default(0),
    infaq_amount: integer("infaq_amount").notNull().default(0),
    method: text("method", { enum: ["qris", "offline"] }).notNull(),
    status: text("status", { enum: ["pending", "confirmed", "rejected", "voided"] })
      .notNull()
      .default("pending"),
    proof_url: text("proof_url"),
    note: text("note"),
    receipt_number: text("receipt_number").unique(),
    paid_by: text("paid_by").references(() => users.id, { onDelete: "set null" }),
    confirmed_by: text("confirmed_by").references(() => users.id, { onDelete: "set null" }),
    confirmed_at: integer("confirmed_at", { mode: "timestamp_ms" }),
    rejected_at: integer("rejected_at", { mode: "timestamp_ms" }),
    rejected_by: text("rejected_by").references(() => users.id, { onDelete: "set null" }),
    reject_reason: text("reject_reason"),
    voided_at: integer("voided_at", { mode: "timestamp_ms" }),
    voided_by: text("voided_by").references(() => users.id, { onDelete: "set null" }),
    void_reason: text("void_reason"),
    deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
    created_at: time("created_at").notNull(),
  },
  (t) => [
    index("payments_invoice_created_idx").on(t.invoice_id, t.created_at),
    index("payments_status_deleted_idx").on(t.status, t.deleted_at, t.created_at),
    index("payments_student_idx").on(t.student_id, t.created_at),
    index("payments_paidby_pending_idx").on(t.paid_by, t.status),
  ],
);

export const expenses = sqliteTable("expenses", {
  id: id(),
  title: text("title").notNull(),
  category: text("category"),
  amount: integer("amount").notNull(),
  spent_at: dateStr("spent_at").notNull(),
  note: text("note"),
  created_at: time("created_at").notNull(),
});

export const schoolSettings = sqliteTable("school_settings", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull().default("SPP Digital"),
  short_name: text("short_name").notNull().default("SPP Digital"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  tagline: text("tagline"),
  bank_name: text("bank_name"),
  bank_account_name: text("bank_account_name"),
  bank_account_number: text("bank_account_number"),
  qris_content: text("qris_content"),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const bankAccounts = sqliteTable(
  "bank_accounts",
  {
    id: id(),
    bank_name: text("bank_name").notNull(),
    account_number: text("account_number").notNull(),
    account_holder: text("account_holder").notNull(),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: time("created_at").notNull(),
  },
  (t) => [index("bank_accounts_active_idx").on(t.is_active)],
);

export const academicYears = sqliteTable(
  "academic_years",
  {
    id: id(),
    name: text("name").notNull().unique(),
    start_date: dateStr("start_date"),
    end_date: dateStr("end_date"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: time("created_at").notNull(),
  },
  (t) => [index("academic_years_active_idx").on(t.is_active)],
);

export const billCategories = sqliteTable(
  "bill_categories",
  {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    default_amount: integer("default_amount"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: time("created_at").notNull(),
  },
  (t) => [index("bill_categories_active_idx").on(t.is_active)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity_type: text("entity_type"),
    entity_id: text("entity_id"),
    details: text("details"),
    created_at: time("created_at").notNull(),
  },
  (t) => [
    index("audit_logs_user_idx").on(t.user_id),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_idx").on(t.created_at),
  ],
);

export const schema = {
  users,
  sessions,
  userRoles,
  students,
  parents,
  parentStudents,
  sppSettings,
  events,
  invoices,
  payments,
  expenses,
  schoolSettings,
  bankAccounts,
  academicYears,
  billCategories,
  auditLogs,
};

export type Schema = typeof schema;
